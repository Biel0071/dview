package com.droidview.agent

import android.app.Activity
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class WebAppActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val url = intent.getStringExtra(EXTRA_URL)?.takeIf { it.startsWith("http://") || it.startsWith("https://") }
            ?: "https://example.com"

        val webView = WebView(this)
        webView.webViewClient = WebViewClient()
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.cacheMode = WebSettings.LOAD_DEFAULT
        setContentView(webView)
        webView.loadUrl(url)
    }

    companion object {
        const val EXTRA_URL = "com.droidview.agent.WEB_URL"
    }
}
