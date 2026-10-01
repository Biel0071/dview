package com.droidview.agent.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.content.Context
import android.graphics.Path
import android.graphics.Rect
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Modelo de evento de toque digital detectado pelo sistema de acessibilidade.
 */
data class DetectedTouchEvent(
    val id: String = "touch_${System.currentTimeMillis()}_${(100..999).random()}",
    val action: String, // "click", "long_click", "scroll", "touch_down", "touch_up"
    val x: Float,
    val y: Float,
    val endX: Float? = null,
    val endY: Float? = null,
    val durationMs: Long? = null,
    val packageName: String = "",
    val className: String = "",
    val text: String = "",
    val contentDescription: String = "",
    val bounds: String = "",
    val source: String = "device_user", // "device_user" ou "remote_simulation"
    val timestamp: Long = System.currentTimeMillis()
)

interface TouchEventListener {
    fun onTouchDetected(event: DetectedTouchEvent)
}

/**
 * Serviço de Acessibilidade nativo do DVIEW.
 * Permite suporte supervisionado, assistência remota, transmissão e despacho de gestos.
 * Fornece detecção completa de toques e simulação digital de toques e gestos (API 24+).
 */
open class AgentAccessibilityService : AccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "AgentAccessibilityService conectado com suporte a detecção e simulação de toques digitais.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return
        val packageName = event.packageName?.toString() ?: ""
        val className = event.className?.toString() ?: ""

        // Detecção de toques e interações digitais do usuário
        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                extractAndDispatchTouchEvent(event, "click")
            }
            AccessibilityEvent.TYPE_VIEW_LONG_CLICKED -> {
                extractAndDispatchTouchEvent(event, "long_click")
            }
            AccessibilityEvent.TYPE_VIEW_SCROLLED -> {
                extractAndDispatchTouchEvent(event, "scroll")
            }
            AccessibilityEvent.TYPE_TOUCH_INTERACTION_START -> {
                extractAndDispatchTouchEvent(event, "touch_down")
            }
            AccessibilityEvent.TYPE_TOUCH_INTERACTION_END -> {
                extractAndDispatchTouchEvent(event, "touch_up")
            }
            else -> {
                Log.d(TAG, "Evento acessibilidade: tipo=${event.eventType} pkg=$packageName class=$className")
            }
        }
    }

    private fun extractAndDispatchTouchEvent(event: AccessibilityEvent, action: String) {
        try {
            val packageName = event.packageName?.toString() ?: ""
            val className = event.className?.toString() ?: ""
            val node = event.source
            val bounds = Rect()

            var text = ""
            var contentDesc = ""

            if (node != null) {
                node.getBoundsInScreen(bounds)
                text = node.text?.toString() ?: ""
                contentDesc = node.contentDescription?.toString() ?: ""
            }

            if (text.isBlank() && event.text != null && event.text.isNotEmpty()) {
                text = event.text.joinToString(" ")
            }

            val x = if (bounds.width() > 0) bounds.exactCenterX() else 0f
            val y = if (bounds.height() > 0) bounds.exactCenterY() else 0f
            val boundsStr = if (bounds.width() > 0 || bounds.height() > 0) {
                "[${bounds.left},${bounds.top}][${bounds.right},${bounds.bottom}]"
            } else ""

            val touchEvent = DetectedTouchEvent(
                action = action,
                x = x,
                y = y,
                packageName = packageName,
                className = className,
                text = text,
                contentDescription = contentDesc,
                bounds = boundsStr,
                source = "device_user",
                timestamp = System.currentTimeMillis()
            )

            recordTouchEvent(touchEvent)
            Log.i(TAG, "Toque digital detectado: $action em ($x, $y) | texto='$text' | pkg=$packageName | bounds=$boundsStr")
        } catch (e: Exception) {
            Log.w(TAG, "Falha ao extrair dados de toque do evento: ${e.message}")
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "AgentAccessibilityService interrompido.")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
        Log.i(TAG, "AgentAccessibilityService destruído.")
    }

    /**
     * Simula toque digital rápido (Tap) na coordenada especificada.
     */
    fun simulateTap(x: Float, y: Float, durationMs: Long = 60L, onComplete: ((Boolean) -> Unit)? = null): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val path = Path().apply { moveTo(x, y) }
            val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
            val gesture = GestureDescription.Builder().addStroke(stroke).build()

            val success = dispatchGesture(gesture, object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    super.onCompleted(gestureDescription)
                    Log.i(TAG, "Toque digital simulado concluído com sucesso em ($x, $y)")
                    recordTouchEvent(
                        DetectedTouchEvent(
                            action = "click",
                            x = x,
                            y = y,
                            source = "remote_simulation"
                        )
                    )
                    onComplete?.invoke(true)
                }

                override fun onCancelled(gestureDescription: GestureDescription?) {
                    super.onCancelled(gestureDescription)
                    Log.w(TAG, "Toque digital simulado cancelado pelo sistema em ($x, $y)")
                    onComplete?.invoke(false)
                }
            }, null)

            return success
        }
        return false
    }

    /**
     * Compatibilidade legada com performClick.
     */
    fun performClick(x: Float, y: Float): Boolean {
        return simulateTap(x, y, 60L)
    }

    /**
     * Simula toque longo digital (Long Press).
     */
    fun simulateLongPress(x: Float, y: Float, durationMs: Long = 800L, onComplete: ((Boolean) -> Unit)? = null): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val path = Path().apply { moveTo(x, y) }
            val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
            val gesture = GestureDescription.Builder().addStroke(stroke).build()

            return dispatchGesture(gesture, object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    super.onCompleted(gestureDescription)
                    Log.i(TAG, "Toque longo digital simulado concluído com sucesso em ($x, $y) por ${durationMs}ms")
                    recordTouchEvent(
                        DetectedTouchEvent(
                            action = "long_click",
                            x = x,
                            y = y,
                            durationMs = durationMs,
                            source = "remote_simulation"
                        )
                    )
                    onComplete?.invoke(true)
                }

                override fun onCancelled(gestureDescription: GestureDescription?) {
                    super.onCancelled(gestureDescription)
                    Log.w(TAG, "Toque longo digital simulado cancelado em ($x, $y)")
                    onComplete?.invoke(false)
                }
            }, null)
        }
        return false
    }

    /**
     * Simula deslize digital / gesto de rolagem (Swipe) entre duas coordenadas.
     */
    fun simulateSwipe(
        x1: Float,
        y1: Float,
        x2: Float,
        y2: Float,
        durationMs: Long = 300L,
        onComplete: ((Boolean) -> Unit)? = null
    ): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            val path = Path().apply {
                moveTo(x1, y1)
                lineTo(x2, y2)
            }
            val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
            val gesture = GestureDescription.Builder().addStroke(stroke).build()

            return dispatchGesture(gesture, object : GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription?) {
                    super.onCompleted(gestureDescription)
                    Log.i(TAG, "Gesto de deslize simulado com sucesso: ($x1, $y1) -> ($x2, $y2) em ${durationMs}ms")
                    recordTouchEvent(
                        DetectedTouchEvent(
                            action = "swipe",
                            x = x1,
                            y = y1,
                            endX = x2,
                            endY = y2,
                            durationMs = durationMs,
                            source = "remote_simulation"
                        )
                    )
                    onComplete?.invoke(true)
                }

                override fun onCancelled(gestureDescription: GestureDescription?) {
                    super.onCancelled(gestureDescription)
                    Log.w(TAG, "Gesto de deslize simulado cancelado: ($x1, $y1) -> ($x2, $y2)")
                    onComplete?.invoke(false)
                }
            }, null)
        }
        return false
    }

    fun performSwipe(x1: Float, y1: Float, x2: Float, y2: Float, durationMs: Long = 300): Boolean {
        return simulateSwipe(x1, y1, x2, y2, durationMs)
    }

    fun performBack(): Boolean = performGlobalAction(GLOBAL_ACTION_BACK)
    fun performHome(): Boolean = performGlobalAction(GLOBAL_ACTION_HOME)
    fun performRecents(): Boolean = performGlobalAction(GLOBAL_ACTION_RECENTS)

    companion object {
        private const val TAG = "AgentAccessibility"
        var instance: AgentAccessibilityService? = null
            private set

        private val touchListeners = CopyOnWriteArrayList<TouchEventListener>()
        private val recentTouchEventsList = CopyOnWriteArrayList<DetectedTouchEvent>()

        fun addTouchListener(listener: TouchEventListener) {
            if (!touchListeners.contains(listener)) {
                touchListeners.add(listener)
            }
        }

        fun removeTouchListener(listener: TouchEventListener) {
            touchListeners.remove(listener)
        }

        fun recordTouchEvent(event: DetectedTouchEvent) {
            recentTouchEventsList.add(0, event)
            while (recentTouchEventsList.size > 100) {
                recentTouchEventsList.removeAt(recentTouchEventsList.size - 1)
            }
            for (listener in touchListeners) {
                try {
                    listener.onTouchDetected(event)
                } catch (e: Exception) {
                    Log.w(TAG, "Erro no listener de toque: ${e.message}")
                }
            }
        }

        fun getRecentTouchEvents(): List<DetectedTouchEvent> = recentTouchEventsList.toList()

        fun isServiceRunning(): Boolean = instance != null

        fun isServiceEnabled(context: Context): Boolean {
            if (instance != null) return true
            val expectedServiceName = "${context.packageName}/${AgentAccessibilityService::class.java.name}"
            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false
            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServices)
            while (colonSplitter.hasNext()) {
                val componentName = colonSplitter.next()
                if (componentName.equals(expectedServiceName, ignoreCase = true) ||
                    componentName.contains(context.packageName)
                ) {
                    return true
                }
            }
            return false
        }
    }
}
