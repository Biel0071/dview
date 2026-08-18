package com.droidview.agent.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder

class AgentForegroundService : Service() {
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val serverUrl = intent?.getStringExtra(EXTRA_SERVER_URL) ?: "not paired"
        val deviceName = intent?.getStringExtra(EXTRA_DEVICE_NAME) ?: "Android Device"
        val channelId = "droidview_agent"

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "DroidView Agent", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
            Notification.Builder(this, channelId)
        } else {
            Notification.Builder(this)
        }

        val notification = builder
            .setContentTitle("DroidView Agent ativo")
            .setContentText("$deviceName pareado com $serverUrl. Sessao remota exige aceite visivel.")
            .setSmallIcon(android.R.drawable.presence_online)
            .setOngoing(true)
            .build()
        startForeground(1001, notification)
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    companion object {
        const val EXTRA_SERVER_URL = "com.droidview.agent.SERVER_URL"
        const val EXTRA_DEVICE_NAME = "com.droidview.agent.DEVICE_NAME"
        const val EXTRA_ENROLLMENT_TOKEN = "com.droidview.agent.ENROLLMENT_TOKEN"
    }
}
