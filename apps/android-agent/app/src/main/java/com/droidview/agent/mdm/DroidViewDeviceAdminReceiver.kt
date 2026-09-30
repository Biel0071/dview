package com.droidview.agent.mdm

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Receptor de Administração do Dispositivo e Perfil de Trabalho (Island / Managed Profile).
 * Gerencia a ativação corporativa e a conclusão de provisionamento do container isolado.
 */
class DroidViewDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        Log.i(TAG, "onProfileProvisioningComplete: Perfil Island / Work Profile provisionado com sucesso pelo Android.")

        try {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
            val component = ComponentName(context, DroidViewDeviceAdminReceiver::class.java)

            // Define o nome identificador do perfil isolado
            dpm.setProfileName(component, "DVIEW Island Profile")

            // Habilita o perfil no sistema operacional
            dpm.setProfileEnabled(component)

            Log.i(TAG, "Perfil Island corporativo ativado e disponível no dispositivo.")
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao finalizar configuração do perfil provisionado: ${e.message}")
        }
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "Administrador de Dispositivo DVIEW ativado com sucesso.")
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Log.i(TAG, "Administrador de Dispositivo DVIEW desativado.")
    }

    companion object {
        private const val TAG = "DeviceAdminReceiver"
    }
}
