package io.github.dineshkumarponnusamy.familyfieldguide

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import io.github.dineshkumarponnusamy.familyfieldguide.core.GuideStore
import io.github.dineshkumarponnusamy.familyfieldguide.ui.FamilyGuideScreen
import io.github.dineshkumarponnusamy.familyfieldguide.ui.FamilyGuideTheme
import java.io.File

class MainActivity : FragmentActivity() {
    private lateinit var store: GuideStore
    private var revision by mutableIntStateOf(0)
    private var isLocked by mutableStateOf(false)
    private var pendingExportJson: String? = null
    private var pendingImportCallback: ((String) -> Unit)? = null

    private val exportLauncher = registerForActivityResult(ActivityResultContracts.CreateDocument("application/json")) { uri ->
        val json = pendingExportJson
        pendingExportJson = null
        if (uri != null && json != null) {
            contentResolver.openOutputStream(uri)?.use { it.write(json.toByteArray(Charsets.UTF_8)) }
            Toast.makeText(this, "Encrypted backup saved", Toast.LENGTH_SHORT).show()
        }
    }

    private val importLauncher = registerForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        val cb = pendingImportCallback
        pendingImportCallback = null
        if (uri != null && cb != null) {
            val txt = contentResolver.openInputStream(uri)?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }
            if (txt != null) cb(txt)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val guideJson = assets.open("guide-data.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        store = GuideStore(guideJson, File(filesDir, "state.json"))
        store.onStateChanged = { revision++ }

        setContent {
            @Suppress("UNUSED_VARIABLE") val _tick = revision
            FamilyGuideTheme(
                largeText = store.state.largeText,
                highContrast = store.state.highContrast
            ) {
                FamilyGuideScreen(
                    store = store,
                    revision = revision,
                    isLocked = isLocked,
                    onRequestBiometricUnlock = { promptUnlock() },
                    onLockNow = { isLocked = true },
                    onShareText = { subject, text ->
                        val intent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, subject)
                            putExtra(Intent.EXTRA_TEXT, text)
                        }
                        startActivity(Intent.createChooser(intent, subject))
                    },
                    onExportBackupJson = { jsonOut ->
                        pendingExportJson = jsonOut
                        exportLauncher.launch("family-field-guide-backup.json")
                    },
                    onPickBackupFile = { cb ->
                        pendingImportCallback = cb
                        importLauncher.launch(arrayOf("application/json", "text/html", "text/plain", "*/*"))
                    }
                )
            }
        }
    }

    private fun promptUnlock() {
        val authenticators = BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
        val canAuth = BiometricManager.from(this).canAuthenticate(authenticators)
        if (canAuth != BiometricManager.BIOMETRIC_SUCCESS) {
            isLocked = false
            return
        }
        val executor = ContextCompat.getMainExecutor(this)
        val prompt = BiometricPrompt(
            this,
            executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    isLocked = false
                }
            }
        )
        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Unlock Our Family Field Guide")
            .setSubtitle("Verify Fingerprint, Face, or Device PIN")
            .setAllowedAuthenticators(authenticators)
            .build()
        prompt.authenticate(info)
    }
}
