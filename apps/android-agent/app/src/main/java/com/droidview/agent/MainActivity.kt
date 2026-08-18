package com.droidview.agent

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import com.droidview.agent.service.AgentForegroundService

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val enrollment = intent?.data?.getQueryParameter("config") ?: "manual"
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(48, 64, 48, 48)
        }

        val title = TextView(this).apply {
            text = "DroidView Agent"
            textSize = 26f
        }

        val status = TextView(this).apply {
            text = "Pareamento: $enrollment\nSessao remota exige consentimento visivel."
            textSize = 16f
            setPadding(0, 24, 0, 24)
        }

        val start = Button(this).apply {
            text = "Ativar agente"
            setOnClickListener {
                startForegroundService(Intent(this@MainActivity, AgentForegroundService::class.java))
            }
        }

        layout.addView(title)
        layout.addView(status)
        layout.addView(start)
        setContentView(layout)
    }
}
