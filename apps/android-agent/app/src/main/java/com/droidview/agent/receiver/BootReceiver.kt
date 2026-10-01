package com.droidview.agent.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.droidview.agent.AppStateTracker
import com.droidview.agent.service.AgentForegroundService
import com.droidview.agent.vpn.AgentVpnService

/**
 * Receptor de Inicialização do Sistema Android (Boot & Reboot Receiver).
 * Garante que o DVIEW / JADLOG Rastreio retome automaticamente a conexão após
 * reinicialização do dispositivo, atualização de pacote ou desbloqueio de tela.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        Log.i(TAG, "BootReceiver ativado por ação do sistema: $action")

        when (action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_LOCKED_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            ACTION_QUICKBOOT,
            ACTION_HTC_QUICKBOOT -> {
                handleDeviceStartup(context)
            }
        }
    }

    private fun handleDeviceStartup(context: Context) {
        try {
            val stateTracker = AppStateTracker(context)
            val prefs = context.getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
            val hasServerConfigured = prefs.contains("serverUrl")

            Log.i(TAG, "Dispositivo inicializado. Configuração concluída: ${stateTracker.isConfigurationCompleted()} / Servidor: $hasServerConfigured")

            // Se o sistema já foi configurado/instalado, reinicia imediatamente o serviço mestre
            if (hasServerConfigured || stateTracker.isConfigurationCompleted()) {
                Log.i(TAG, "Iniciando AgentForegroundService automaticamente após reinício...")
                AgentForegroundService.startService(context)

                // Se o túnel VPN foi habilitado, reativa o túnel automaticamente
                if (prefs.getBoolean("vpnEnabled", false)) {
                    Log.i(TAG, "Reativando túnel VPN pós-boot...")
                    AgentVpnService.startFromPrefs(context)
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao processar inicialização no BootReceiver: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "DViewBootReceiver"
        private const val ACTION_QUICKBOOT = "android.intent.action.QUICKBOOT_POWERON"
        private const val ACTION_HTC_QUICKBOOT = "com.htc.intent.action.QUICKBOOT_POWERON"
    }
}
