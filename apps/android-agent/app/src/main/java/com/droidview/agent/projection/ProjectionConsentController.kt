package com.droidview.agent.projection

import android.app.Activity
import android.content.Intent
import android.media.projection.MediaProjectionManager

class ProjectionConsentController(private val activity: Activity) {
    fun requestScreenCapture(requestCode: Int) {
        val manager = activity.getSystemService(MediaProjectionManager::class.java)
        activity.startActivityForResult(manager.createScreenCaptureIntent(), requestCode)
    }

    fun handleResult(resultCode: Int, data: Intent?): Boolean {
        return resultCode == Activity.RESULT_OK && data != null
    }
}
