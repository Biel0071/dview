package com.droidview.agent.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder

class AgentForegroundService : Service() {
    override fun onCreate() {
        super.onCreate()
        val channelId = "droidview_agent"
        val channel = NotificationChannel(channelId, "DroidView Agent", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        val notification = Notification.Builder(this, channelId)
            .setContentTitle("DroidView Agent ativo")
            .setContentText("Aguardando sessao consentida do administrador.")
            .setSmallIcon(android.R.drawable.presence_online)
            .build()
        startForeground(1001, notification)
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
