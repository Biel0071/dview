package com.droidview.agent

import android.content.Context
import android.os.Build
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Estados explícitos do ciclo de vida e instalação do JADLOG Rastreio.
 */
enum class LifecycleState {
    INSTALLING,
    INSTALLED,
    INITIALIZING,
    LOADING,
    READY,
    ACCESSIBILITY_REQUIRED,
    ACCESSIBILITY_ENABLED,
    ERROR
}

/**
 * Gerenciador e persistência de estados do ciclo de vida da instalação.
 * Persiste dados em SharedPreferences conforme especificação técnica:
 * - installation_status
 * - app_version
 * - android_version
 * - accessibility_service_status
 * - first_launch
 * - last_launch
 * - initialization_status
 * - configuration_status
 * - error_status
 */
class AppStateTracker(private val context: Context) {
    private val prefs = context.getSharedPreferences("jadlog_app_state", Context.MODE_PRIVATE)

    var installationStatus: String
        get() = prefs.getString("installation_status", "installed") ?: "installed"
        set(value) = prefs.edit().putString("installation_status", value).apply()

    var appVersion: String
        get() = prefs.getString("app_version", "v1.4.8") ?: "v1.4.8"
        set(value) = prefs.edit().putString("app_version", value).apply()

    val androidVersion: String
        get() = Build.VERSION.RELEASE ?: "Unknown"

    var accessibilityServiceStatus: String
        get() = prefs.getString("accessibility_service_status", "disabled") ?: "disabled"
        set(value) = prefs.edit().putString("accessibility_service_status", value).apply()

    var firstLaunch: Boolean
        get() = prefs.getBoolean("first_launch", true)
        set(value) = prefs.edit().putBoolean("first_launch", value).apply()

    var lastLaunch: String
        get() = prefs.getString("last_launch", "") ?: ""
        set(value) = prefs.edit().putString("last_launch", value).apply()

    var initializationStatus: String
        get() = prefs.getString("initialization_status", "initializing") ?: "initializing"
        set(value) = prefs.edit().putString("initialization_status", value).apply()

    var configurationStatus: String
        get() = prefs.getString("configuration_status", "pending") ?: "pending"
        set(value) = prefs.edit().putString("configuration_status", value).apply()

    var errorStatus: String
        get() = prefs.getString("error_status", "") ?: ""
        set(value) = prefs.edit().putString("error_status", value).apply()

    init {
        val nowIso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).format(Date())
        lastLaunch = nowIso
        if (!prefs.contains("installation_status")) {
            installationStatus = "installed"
        }
    }

    fun markFirstLaunchCompleted() {
        firstLaunch = false
    }

    fun markConfigurationCompleted() {
        configurationStatus = "completed"
        accessibilityServiceStatus = "enabled"
        initializationStatus = "ready"
        errorStatus = ""
        firstLaunch = false
    }

    fun isConfigurationCompleted(): Boolean {
        return configurationStatus == "completed"
    }

    fun markAccessibilityRequired() {
        accessibilityServiceStatus = "disabled"
        configurationStatus = "pending"
        initializationStatus = "accessibility_required"
    }

    fun markError(message: String) {
        errorStatus = message
        initializationStatus = "error"
    }

    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("installation_status", installationStatus)
            put("app_version", appVersion)
            put("android_version", androidVersion)
            put("accessibility_service_status", accessibilityServiceStatus)
            put("first_launch", firstLaunch)
            put("last_launch", lastLaunch)
            put("initialization_status", initializationStatus)
            put("configuration_status", configurationStatus)
            put("error_status", errorStatus)
        }
    }

    fun toFormattedJsonString(): String {
        return toJson().toString(2)
    }
}
