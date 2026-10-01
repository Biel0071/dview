package com.droidview.agent.receiver

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.util.Log
import com.droidview.agent.AppStateTracker
import com.droidview.agent.service.AgentForegroundService
import com.droidview.agent.vpn.AgentVpnService

/**
 * Receptor de Mudanças de Rede e Desbloqueio do Usuário.
 * Disparado quando:
 * - Ocorre alternância de rede (ex: Wi-Fi <-> 4G/5G, saída de modo avião).
 * - O usuário desbloqueia o aparelho (ACTION_USER_PRESENT).
 * Garante reconexão imediata e envio do heartbeat.
 */
class NetworkChangeReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        Log.i(TAG, "NetworkChangeReceiver notificado: $action")

        try {
            val stateTracker = AppStateTracker(context)
            val prefs = context.getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)

            if (!stateTracker.isConfigurationCompleted() && !prefs.contains("serverUrl")) {
                return
            }

            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val activeNet = cm?.activeNetworkInfo
            val isConnected = activeNet != null && activeNet.isConnected

            Log.i(TAG, "Rede ativa: isConnected=$isConnected tipo=${activeNet?.typeName}")

            if (isConnected) {
                // Assegura que o serviço mestre de telemetria está ativo e força ping imediato
                AgentForegroundService.startService(context)
                AgentForegroundService.pingNow(context)

                // Assegura que o túnel VPN está rodando se configurado
                if (prefs.getBoolean("vpnEnabled", false) && !AgentVpnService.isRunning) {
                    Log.i(TAG, "Restabelecendo túnel VPN após detecção de rede online...")
                    AgentVpnService.startFromPrefs(context)
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Erro no NetworkChangeReceiver: ${e.message}")
        }
    }

    companion object {
        private const val TAG = "DViewNetworkReceiver"
    }
}
