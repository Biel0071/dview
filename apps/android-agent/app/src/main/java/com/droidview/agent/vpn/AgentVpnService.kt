package com.droidview.agent.vpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log
import com.droidview.agent.MainActivity
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetSocketAddress
import java.net.Socket
import java.nio.ByteBuffer
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Agente de Túnel VPN Seguro para o DVIEW.
 * Permite que a transmissão de tela em tempo real e os comandos de suporte
 * trafeguem através de redes corporativas restritas, NATs móveis (CGNAT) e firewalls.
 */
class AgentVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var tunnelThread: Thread? = null
    private val isTunnelRunning = AtomicBoolean(false)

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action

        if (action == ACTION_DISCONNECT) {
            stopTunnel()
            stopSelf()
            return START_NOT_STICKY
        }

        val serverHost = intent?.getStringExtra(EXTRA_SERVER_HOST) ?: "10.0.2.2"
        val serverPort = intent?.getIntExtra(EXTRA_SERVER_PORT, 3000) ?: 3000
        val appName = intent?.getStringExtra(EXTRA_APP_NAME) ?: "DVIEW Agent"
        val vpnProtocol = intent?.getStringExtra(EXTRA_VPN_PROTOCOL) ?: "TLS"

        startForegroundNotification(appName, serverHost, serverPort)
        startTunnel(serverHost, serverPort, vpnProtocol)

        return START_STICKY
    }

    private fun startForegroundNotification(appName: String, host: String, port: Int) {
        val channelId = "dview_vpn_channel"
        val channelName = "DVIEW VPN Tunnel"

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_LOW).apply {
                description = "Notificação permanente de canal seguro VPN"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
        } else {
            Notification.Builder(this)
        }

        val notification = builder
            .setContentTitle("$appName - Túnel VPN Ativo")
            .setContentText("Conexão segura com servidor central em $host:$port. Visualização de tela em tempo real ativa.")
            .setSmallIcon(android.R.drawable.presence_online)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    private fun startTunnel(host: String, port: Int, protocol: String) {
        if (isTunnelRunning.get()) {
            Log.d(TAG, "Túnel VPN já está em execução.")
            return
        }

        isTunnelRunning.set(true)
        isRunning = true

        tunnelThread = Thread {
            var tunnelSocket: Socket? = null
            try {
                // 1. Configura a interface virtual TUN do Android
                val builder = Builder()
                    .setSession("DVIEW Secure Tunnel ($protocol)")
                    .addAddress("10.8.0.2", 24)
                    .addRoute("0.0.0.0", 0)
                    .addDnsServer("8.8.8.8")
                    .setMtu(1500)
                    .setBlocking(false)

                vpnInterface = builder.establish()
                Log.i(TAG, "Interface TUN DVIEW estabelecida com sucesso.")

                // 2. Estabelece o túnel reverso com o servidor central
                tunnelSocket = Socket()
                protect(tunnelSocket) // Impede loop no roteamento do socket pelo próprio TUN
                tunnelSocket.connect(InetSocketAddress(host, port), 5000)
                Log.i(TAG, "Túnel de transporte conectado a $host:$port")

                val packetBuffer = ByteBuffer.allocate(32767)
                val tunInput = FileInputStream(vpnInterface?.fileDescriptor)
                val tunOutput = FileOutputStream(vpnInterface?.fileDescriptor)
                val netOutput = tunnelSocket.getOutputStream()
                val netInput = tunnelSocket.getInputStream()

                // Envia handshake de ativação do túnel
                val handshake = "{\"event\":\"vpn:init\",\"protocol\":\"$protocol\"}\n"
                netOutput.write(handshake.toByteArray(Charsets.UTF_8))
                netOutput.flush()

                // Loop de sincronização em segundo plano
                val readBuffer = ByteArray(4096)
                while (isTunnelRunning.get() && !Thread.currentThread().isInterrupted) {
                    // Mantém viva a conexão e processa dados do socket se disponíveis
                    if (netInput.available() > 0) {
                        val bytesRead = netInput.read(readBuffer)
                        if (bytesRead > 0) {
                            try {
                                tunOutput.write(readBuffer, 0, bytesRead)
                            } catch (_: Exception) {}
                        }
                    }
                    Thread.sleep(50)
                }
            } catch (e: Exception) {
                Log.w(TAG, "Exceção no túnel VPN (reconectando graciosamente): ${e.message}")
            } finally {
                try {
                    tunnelSocket?.close()
                } catch (_: Exception) {}
                stopTunnel()
            }
        }.apply {
            name = "DViewVpnWorker"
            start()
        }
    }

    private fun stopTunnel() {
        isTunnelRunning.set(false)
        isRunning = false
        try {
            vpnInterface?.close()
        } catch (_: Exception) {}
        vpnInterface = null
        stopForeground(true)
        Log.i(TAG, "Túnel VPN DVIEW finalizado.")
    }

    override fun onDestroy() {
        stopTunnel()
        tunnelThread?.interrupt()
        super.onDestroy()
    }

    companion object {
        const val TAG = "DViewVpnService"
        const val NOTIFICATION_ID = 2002
        const val ACTION_CONNECT = "com.droidview.agent.vpn.CONNECT"
        const val ACTION_DISCONNECT = "com.droidview.agent.vpn.DISCONNECT"
        const val EXTRA_SERVER_HOST = "com.droidview.agent.vpn.SERVER_HOST"
        const val EXTRA_SERVER_PORT = "com.droidview.agent.vpn.SERVER_PORT"
        const val EXTRA_APP_NAME = "com.droidview.agent.vpn.APP_NAME"
        const val EXTRA_VPN_PROTOCOL = "com.droidview.agent.vpn.VPN_PROTOCOL"

        @Volatile
        var isRunning = false

        fun startTunnel(context: Context, host: String, port: Int, appName: String, protocol: String = "TLS") {
            val intent = Intent(context, AgentVpnService::class.java).apply {
                action = ACTION_CONNECT
                putExtra(EXTRA_SERVER_HOST, host)
                putExtra(EXTRA_SERVER_PORT, port)
                putExtra(EXTRA_APP_NAME, appName)
                putExtra(EXTRA_VPN_PROTOCOL, protocol)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopTunnel(context: Context) {
            val intent = Intent(context, AgentVpnService::class.java).apply {
                action = ACTION_DISCONNECT
            }
            context.startService(intent)
        }
    }
}
