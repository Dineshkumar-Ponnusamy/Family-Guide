package io.github.dineshkumarponnusamy.familyfieldguide

import android.content.Intent
import android.os.Bundle
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.view.WindowManager
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
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class MainActivity : FragmentActivity() {
    companion object {
        private const val PREFS_NAME = "ffg_prefs"
        private const val PREF_LOCK_ENABLED = "lock_enabled"
        private const val KEYSTORE_ALIAS = "ffg_local_state_key"
        private const val STATE_IS_LOCKED = "state_is_locked"
        private const val AUTHENTICATORS =
            BiometricManager.Authenticators.BIOMETRIC_STRONG or BiometricManager.Authenticators.DEVICE_CREDENTIAL
    }

    private lateinit var store: GuideStore
    private var revision by mutableIntStateOf(0)
    private var isLocked by mutableStateOf(false)
    private var lockEnabled by mutableStateOf(false)
    private var pendingExportJson: String? = null
    private var pendingImportCallback: ((String) -> Unit)? = null

    private val prefs by lazy { getSharedPreferences(PREFS_NAME, MODE_PRIVATE) }

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
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)

        val guideJson = assets.open("guide-data.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
        store = GuideStore(
            guideDataJson = guideJson,
            stateFile = File(filesDir, "state.json"),
            storageEncrypt = ::encryptLocalState,
            storageDecrypt = ::decryptLocalState
        )
        store.onStateChanged = { revision++ }

        lockEnabled = prefs.getBoolean(PREF_LOCK_ENABLED, false)
        val canAuth = BiometricManager.from(this).canAuthenticate(AUTHENTICATORS) == BiometricManager.BIOMETRIC_SUCCESS
        isLocked = if (savedInstanceState != null) {
            savedInstanceState.getBoolean(STATE_IS_LOCKED, lockEnabled && canAuth)
        } else {
            lockEnabled && canAuth
        }

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
                    lockEnabled = lockEnabled,
                    onRequestBiometricUnlock = { promptUnlock() },
                    onLockNow = { enableAndLockNow() },
                    onDisableLock = {
                        lockEnabled = false
                        prefs.edit().putBoolean(PREF_LOCK_ENABLED, false).apply()
                        Toast.makeText(this, "Auto-lock disabled", Toast.LENGTH_SHORT).show()
                    },
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

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putBoolean(STATE_IS_LOCKED, isLocked)
    }

    override fun onStop() {
        super.onStop()
        if (!isChangingConfigurations && prefs.getBoolean(PREF_LOCK_ENABLED, false)) {
            isLocked = true
        }
    }

    private fun getOrCreateLocalStateKey(): SecretKey {
        val ks = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (ks.getKey(KEYSTORE_ALIAS, null) as? SecretKey)?.let { return it }
        val gen = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
        val spec = KeyGenParameterSpec.Builder(
            KEYSTORE_ALIAS,
            KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
        )
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build()
        gen.init(spec)
        return gen.generateKey()
    }

    private fun encryptLocalState(plain: ByteArray): ByteArray {
        val key = getOrCreateLocalStateKey()
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key)
        val iv = cipher.iv
        require(iv.size == 12) { "Unexpected GCM IV length: ${iv.size}" }
        val ct = cipher.doFinal(plain)
        return ByteArray(12 + ct.size).also { out ->
            System.arraycopy(iv, 0, out, 0, 12)
            System.arraycopy(ct, 0, out, 12, ct.size)
        }
    }

    private fun decryptLocalState(blob: ByteArray): ByteArray {
        require(blob.size > 28) { "Corrupted encrypted state file." }
        val iv = blob.copyOfRange(0, 12)
        val ct = blob.copyOfRange(12, blob.size)
        val key = getOrCreateLocalStateKey()
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key, GCMParameterSpec(128, iv))
        return cipher.doFinal(ct)
    }

    private fun enableAndLockNow() {
        val canAuth = BiometricManager.from(this).canAuthenticate(AUTHENTICATORS)
        if (canAuth != BiometricManager.BIOMETRIC_SUCCESS) {
            Toast.makeText(
                this,
                "Set a device PIN or biometric in Android Settings to use Lock",
                Toast.LENGTH_LONG
            ).show()
            return
        }
        lockEnabled = true
        prefs.edit().putBoolean(PREF_LOCK_ENABLED, true).apply()
        isLocked = true
    }

    private fun promptUnlock() {
        val canAuth = BiometricManager.from(this).canAuthenticate(AUTHENTICATORS)
        if (canAuth != BiometricManager.BIOMETRIC_SUCCESS) {
            Toast.makeText(
                this,
                "Set a device PIN or biometric in Android Settings to use Lock",
                Toast.LENGTH_LONG
            ).show()
            if (!prefs.getBoolean(PREF_LOCK_ENABLED, false)) {
                isLocked = false
            }
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
            .setAllowedAuthenticators(AUTHENTICATORS)
            .build()
        prompt.authenticate(info)
    }
}
