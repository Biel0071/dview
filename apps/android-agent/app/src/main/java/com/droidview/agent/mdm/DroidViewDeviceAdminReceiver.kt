package com.droidview.agent.mdm

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.PersistableBundle
import android.util.Log
import com.droidview.agent.MainActivity

/**
 * Receptor de Administração do Dispositivo e Perfil de Trabalho (Island / Managed Profile).
 * Gerencia a ativação corporativa e a conclusão de provisionamento do container isolado e Zero-Touch MDM.
 */
class DroidViewDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i(TAG, "onProfileProvisioningComplete: Perfil Island / Device Owner provisionado com sucesso pelo Android.")

        try {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val component = ComponentName(context, DroidViewDeviceAdminReceiver::class.java)

            // Define o nome identificador do perfil isolado
            dpm.setProfileName(component, "DVIEW Enterprise Profile")

            // Habilita o perfil no sistema operacional
            dpm.setProfileEnabled(component)

            // Processa extras de provisionamento Zero-Touch / 0-Click
            handleZeroTouchExtras(context, intent)

            Log.i(TAG, "Perfil Island / Device Owner ativado e pronto no dispositivo.")
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao finalizar configuração do perfil provisionado: ${e.message}")
        }
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Administrador de Dispositivo DVIEW ativado com sucesso.")
        try {
            handleZeroTouchExtras(context, intent)
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao processar extras no onEnabled: ${e.message}")
        }
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.i(TAG, "Administrador de Dispositivo DVIEW desativado.")
    }

    private fun handleZeroTouchExtras(context: Context, intent: Intent) {
        try {
            val extras = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                intent.getParcelableExtra<PersistableBundle>(DevicePolicyManager.EXTRA_PROVISIONING_ADMIN_EXTRAS_BUNDLE)
            } else {
                null
            }

            val prefs = context.getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
            val editor = prefs.edit()

            if (extras != null) {
                val serverUrl = extras.getString("serverUrl")
                val token = extras.getString("enrollmentToken")
                val appName = extras.getString("appName")
                val companyEmoji = extras.getString("companyEmoji")
                val encryptedPayload = extras.getString("encryptedPayload")

                if (!serverUrl.isNullOrEmpty()) editor.putString("serverUrl", serverUrl)
                if (!token.isNullOrEmpty()) editor.putString("enrollmentToken", token)
                if (!appName.isNullOrEmpty()) editor.putString("appName", appName)
                if (!companyEmoji.isNullOrEmpty()) editor.putString("companyEmoji", companyEmoji)
                if (!encryptedPayload.isNullOrEmpty()) editor.putString("encryptedPayload", encryptedPayload)
                editor.putBoolean("zeroTouchCompleted", true)
                editor.apply()

                Log.i(TAG, "Extras de Zero-Touch gravados com sucesso para: $appName no servidor $serverUrl")
            }

            // Inicia automaticamente a MainActivity para registrar presença e iniciar streaming
            val launchIntent = Intent(context, MainActivity::class.java).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                putExtra("zero_touch_auto_start", true)
            }
            context.startActivity(launchIntent)
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao iniciar app pós-provisionamento: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "DeviceAdminReceiver"
    }
}
