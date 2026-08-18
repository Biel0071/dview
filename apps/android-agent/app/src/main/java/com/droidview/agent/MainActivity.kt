package com.droidview.agent

import android.app.Activity
import android.app.AlertDialog
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.util.Base64
import android.widget.Button
import android.widget.CheckBox
import android.widget.LinearLayout
import android.widget.TextView
import com.droidview.agent.mdm.DroidViewDeviceAdminReceiver
import com.droidview.agent.projection.ProjectionConsentController
import com.droidview.agent.service.AgentForegroundService
import org.json.JSONObject

class MainActivity : Activity() {
    private val projectionRequestCode = 4102
    private lateinit var consentController: ProjectionConsentController
    private lateinit var copy: Copy
    private lateinit var enrollment: EnrollmentConfig
    private lateinit var status: TextView
    private lateinit var consent: CheckBox

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        consentController = ProjectionConsentController(this)
        copy = Copy(loadLanguage())
        enrollment = parseEnrollment()
        render()
    }

    private fun render() {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 56, 48, 48)
        }

        val title = TextView(this).apply {
            text = copy.title
            textSize = 26f
        }

        status = TextView(this).apply {
            text = statusText()
            textSize = 16f
            setPadding(0, 22, 0, 22)
        }

        consent = CheckBox(this).apply {
            text = copy.consent
            textSize = 15f
            setPadding(0, 8, 0, 8)
        }

        val activate = Button(this).apply {
            text = copy.activate
            setOnClickListener { activateAgent() }
        }

        val openWebApp = Button(this).apply {
            text = copy.openWebApp
            setOnClickListener { openWebApp() }
        }

        val screenShare = Button(this).apply {
            text = copy.screenShare
            setOnClickListener { requestScreenShareConsent() }
        }

        val deviceAdmin = Button(this).apply {
            text = copy.deviceAdmin
            setOnClickListener { requestDeviceAdmin() }
        }

        val settings = Button(this).apply {
            text = copy.androidSettings
            setOnClickListener { startActivity(Intent(Settings.ACTION_SETTINGS)) }
        }

        val language = Button(this).apply {
            text = copy.languageButton
            setOnClickListener {
                val next = if (copy.language == "pt") "en" else "pt"
                getPreferences(MODE_PRIVATE).edit().putString("language", next).apply()
                copy = Copy(next)
                render()
            }
        }

        layout.addView(title)
        layout.addView(status)
        layout.addView(consent)
        layout.addView(activate)
        layout.addView(openWebApp)
        layout.addView(screenShare)
        layout.addView(deviceAdmin)
        layout.addView(settings)
        layout.addView(language)
        setContentView(layout)
    }

    private fun activateAgent() {
        if (!consent.isChecked) {
            AlertDialog.Builder(this)
                .setTitle(copy.consentRequiredTitle)
                .setMessage(copy.consentRequiredBody)
                .setPositiveButton("OK", null)
                .show()
            return
        }

        val serviceIntent = Intent(this, AgentForegroundService::class.java).apply {
            putExtra(AgentForegroundService.EXTRA_SERVER_URL, enrollment.serverUrl)
            putExtra(AgentForegroundService.EXTRA_DEVICE_NAME, enrollment.deviceName)
            putExtra(AgentForegroundService.EXTRA_ENROLLMENT_TOKEN, enrollment.enrollmentToken)
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(serviceIntent)
        } else {
            startService(serviceIntent)
        }
        status.text = statusText(active = true)
        openWebApp()
    }

    private fun openWebApp() {
        val intent = Intent(this, WebAppActivity::class.java).apply {
            putExtra(WebAppActivity.EXTRA_URL, enrollment.redirectUrl)
        }
        startActivity(intent)
    }

    private fun requestScreenShareConsent() {
        if (!consent.isChecked) {
            AlertDialog.Builder(this)
                .setTitle(copy.consentRequiredTitle)
                .setMessage(copy.screenConsentBody)
                .setPositiveButton("OK", null)
                .show()
            return
        }
        consentController.requestScreenCapture(projectionRequestCode)
    }

    private fun requestDeviceAdmin() {
        val component = ComponentName(this, DroidViewDeviceAdminReceiver::class.java)
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, component)
            putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, copy.deviceAdminExplanation)
        }
        startActivity(intent)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == projectionRequestCode) {
            val accepted = consentController.handleResult(resultCode, data)
            status.text = statusText(screenAccepted = accepted)
        }
    }

    private fun statusText(active: Boolean = false, screenAccepted: Boolean = false): String {
        val pairing = if (enrollment.valid) copy.paired else copy.manualPairing
        val agent = if (active) copy.agentActive else copy.agentIdle
        val screen = if (screenAccepted) copy.screenAccepted else copy.screenWaiting
        return listOf(
            "${copy.device}: ${enrollment.deviceName}",
            "${copy.server}: ${enrollment.serverUrl}",
            "${copy.pairing}: $pairing",
            "${copy.agent}: $agent",
            "${copy.screen}: $screen"
        ).joinToString("\n")
    }

    private fun parseEnrollment(): EnrollmentConfig {
        val config = intent?.data?.getQueryParameter("config") ?: return EnrollmentConfig()
        return try {
            val normalized = config.replace('-', '+').replace('_', '/')
            val padded = normalized + "=".repeat((4 - normalized.length % 4) % 4)
            val json = String(Base64.decode(padded, Base64.DEFAULT), Charsets.UTF_8)
            val parsed = JSONObject(json)
            EnrollmentConfig(
                serverUrl = parsed.optString("serverUrl", "http://localhost:3000"),
                enrollmentToken = parsed.optString("enrollmentToken", ""),
                deviceName = parsed.optString("deviceName", android.os.Build.MODEL ?: "Android Device"),
                appName = parsed.optString("appName", "DroidView Agent"),
                redirectUrl = parsed.optString("redirectUrl", parsed.optString("serverUrl", "http://localhost:3000")),
                logoDataUrl = parsed.optString("logoDataUrl", ""),
                valid = true
            )
        } catch (_: Exception) {
            EnrollmentConfig(valid = false)
        }
    }

    private fun loadLanguage(): String {
        return getPreferences(MODE_PRIVATE).getString("language", "pt") ?: "pt"
    }

    data class EnrollmentConfig(
        val serverUrl: String = "http://localhost:3000",
        val enrollmentToken: String = "",
        val deviceName: String = android.os.Build.MODEL ?: "Android Device",
        val appName: String = "DroidView Agent",
        val redirectUrl: String = "http://localhost:3000",
        val logoDataUrl: String = "",
        val valid: Boolean = false
    )

    data class Copy(val language: String) {
        val title = if (language == "pt") "DroidView Agent" else "DroidView Agent"
        val consent = if (language == "pt") {
            "Eu autorizo pareamento visivel e sessoes remotas somente com meu aceite."
        } else {
            "I allow visible pairing and remote sessions only with my consent."
        }
        val activate = if (language == "pt") "Ativar agente visivel" else "Activate visible agent"
        val openWebApp = if (language == "pt") "Abrir site no app" else "Open site in app"
        val screenShare = if (language == "pt") "Autorizar compartilhamento de tela" else "Authorize screen sharing"
        val deviceAdmin = if (language == "pt") "Abrir permissao Device Admin" else "Open Device Admin permission"
        val androidSettings = if (language == "pt") "Abrir settings do Android" else "Open Android settings"
        val languageButton = if (language == "pt") "Switch to English" else "Trocar para Portugues"
        val consentRequiredTitle = if (language == "pt") "Consentimento necessario" else "Consent required"
        val consentRequiredBody = if (language == "pt") {
            "Marque o aceite antes de ativar o agente."
        } else {
            "Check the consent box before activating the agent."
        }
        val screenConsentBody = if (language == "pt") {
            "O compartilhamento de tela sempre abre o dialogo nativo do Android."
        } else {
            "Screen sharing always opens the native Android consent dialog."
        }
        val deviceAdminExplanation = if (language == "pt") {
            "DroidView usa Device Admin apenas para administracao corporativa consentida."
        } else {
            "DroidView uses Device Admin only for consented corporate administration."
        }
        val device = if (language == "pt") "Dispositivo" else "Device"
        val server = if (language == "pt") "Servidor" else "Server"
        val pairing = if (language == "pt") "Pareamento" else "Pairing"
        val paired = if (language == "pt") "configurado por QR/deeplink" else "configured by QR/deep link"
        val manualPairing = if (language == "pt") "manual ou pendente" else "manual or pending"
        val agent = if (language == "pt") "Agente" else "Agent"
        val agentActive = if (language == "pt") "ativo com notificacao persistente" else "active with persistent notification"
        val agentIdle = if (language == "pt") "aguardando ativacao" else "waiting for activation"
        val screen = if (language == "pt") "Tela" else "Screen"
        val screenAccepted = if (language == "pt") "consentimento concedido nesta sessao" else "consent granted for this session"
        val screenWaiting = if (language == "pt") "aguardando consentimento nativo" else "waiting for native consent"
    }
}
