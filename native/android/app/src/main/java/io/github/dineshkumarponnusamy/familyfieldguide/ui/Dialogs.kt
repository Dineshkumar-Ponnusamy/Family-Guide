package io.github.dineshkumarponnusamy.familyfieldguide.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import io.github.dineshkumarponnusamy.familyfieldguide.core.*
import java.time.Instant

@Composable
fun TextSheetDialog(title: String, bodyText: String, onShare: () -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title, fontWeight = FontWeight.Bold) },
        text = {
            SelectionContainer {
                Text(bodyText, fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.bodySmall, modifier = Modifier.verticalScroll(rememberScrollState()))
            }
        },
        confirmButton = { Button(onClick = onShare) { Text("Share / Print") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Close") } }
    )
}

@Composable
fun ReadinessDialog(store: GuideStore, onFix: (String?, String?) -> Unit, onDismiss: () -> Unit) {
    val audit = store.computeAudit()
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Readiness & Fire Drill", fontWeight = FontWeight.Bold) },
        text = {
            LazyColumn(Modifier.heightIn(max = 420.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(audit) { item ->
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.Top) {
                        Box(
                            Modifier.padding(top = 6.dp).size(10.dp).clip(CircleShape)
                                .background(when (item.sev) { AuditSeverity.high -> FfgColors.Tomato; AuditSeverity.med -> FfgColors.Sun; AuditSeverity.ok -> Color(0xFF4D8B55) })
                        )
                        Spacer(Modifier.width(8.dp))
                        Column(Modifier.weight(1f)) {
                            Text(item.title, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
                            Text(item.detail, style = MaterialTheme.typography.bodySmall, color = FfgColors.Ink2)
                        }
                        if (item.sev != AuditSeverity.ok && (item.tab != null || item.act != null)) {
                            TextButton(onClick = { onFix(item.tab, item.act) }) { Text("Fix →") }
                        }
                    }
                }
                item {
                    HorizontalDivider(Modifier.padding(vertical = 8.dp))
                    Text("10-Minute Family Fire Drill", fontWeight = FontWeight.Bold)
                }
                items(store.data.FIRE_DRILL) { fd ->
                    val checked = store.state.fireDrill[fd.id] == true
                    Row(verticalAlignment = Alignment.Top) {
                        Checkbox(checked = checked, onCheckedChange = {
                            val next = store.state.fireDrill.toMutableMap()
                            next[fd.id] = it
                            store.state = store.state.copy(fireDrill = next)
                            store.save()
                        })
                        Column {
                            Text(fd.t, style = MaterialTheme.typography.bodySmall, fontWeight = FontWeight.SemiBold)
                            Text(fd.d, style = MaterialTheme.typography.labelSmall, color = FfgColors.Ink2)
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                store.state = store.state.copy(lastDryRun = Instant.now().toString())
                store.save()
                onDismiss()
            }) { Text("Mark Drill Done") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Close") } }
    )
}

@Composable
fun SearchDialog(store: GuideStore, onSelect: (SearchHit) -> Unit, onDismiss: () -> Unit) {
    var q by remember { mutableStateOf("") }
    val hits = store.search(q)
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Search Guide", fontWeight = FontWeight.Bold) },
        text = {
            Column {
                OutlinedTextField(value = q, onValueChange = { q = it }, label = { Text("Search ($1M, AILA, crypto, SSN, fever…)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                LazyColumn(Modifier.heightIn(max = 300.dp)) {
                    items(hits) { h ->
                        Column(Modifier.fillMaxWidth().clickable { onSelect(h) }.padding(vertical = 8.dp)) {
                            Text(h.tabLabel.uppercase(), style = MaterialTheme.typography.labelSmall, color = FfgColors.Sky)
                            Text(h.title, fontWeight = FontWeight.Bold)
                            if (h.sub.isNotEmpty()) Text(h.sub, style = MaterialTheme.typography.bodySmall, color = FfgColors.Ink2, maxLines = 2)
                        }
                        HorizontalDivider()
                    }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Close") } }
    )
}

@Composable
fun BackupDialog(store: GuideStore, onExportJson: (String) -> Unit, onDismiss: () -> Unit) {
    var pw1 by remember { mutableStateOf("") }
    var pw2 by remember { mutableStateOf("") }
    var makeCards by remember { mutableStateOf(false) }
    var cards by remember { mutableStateOf<List<String>>(emptyList()) }
    var err by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Save Locked Backup", fontWeight = FontWeight.Bold) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = pw1, onValueChange = { pw1 = it }, label = { Text("Passphrase (min 8 chars)") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                OutlinedTextField(value = pw2, onValueChange = { pw2 = it }, label = { Text("Confirm passphrase") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                TextButton(onClick = {
                    val pw = CryptoEngine.generatePassphrase(5, store.data.DICE_WORDS)
                    pw1 = pw; pw2 = pw
                }) { Text("Generate 5-word Diceware Passphrase") }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = makeCards, onCheckedChange = { makeCards = it })
                    Text("Create 2-of-3 Shamir Recovery Cards", style = MaterialTheme.typography.bodySmall)
                }
                err?.let { Text(it, color = FfgColors.Tomato, style = MaterialTheme.typography.bodySmall) }
                cards.forEachIndexed { idx, card ->
                    SelectionContainer {
                        Text("Card ${idx + 1}: $card", fontFamily = FontFamily.Monospace, style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = {
                if (pw1.length < 8) { err = "Use at least 8 characters."; return@Button }
                if (pw1 != pw2) { err = "Passphrases do not match."; return@Button }
                val now = Instant.now().toString()
                store.state = store.state.copy(lastBackup = now, updated = store.state.updated ?: now)
                val pkg = CryptoEngine.encrypt(store.state, pw1)
                if (makeCards) cards = CryptoEngine.sssSplit2of3(pw1)
                store.save(touch = false)
                err = null
                val jsonOut = Json { encodeDefaults = true }.encodeToString(pkg)
                onExportJson(jsonOut)
            }) { Text("Encrypt & Export") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Close") } }
    )
}

@Composable
fun RestoreDialog(store: GuideStore, onPickFile: ((String) -> Unit) -> Unit, onDismiss: () -> Unit) {
    var payload by remember { mutableStateOf("") }
    var useCards by remember { mutableStateOf(false) }
    var pw by remember { mutableStateOf("") }
    var cardA by remember { mutableStateOf("") }
    var cardB by remember { mutableStateOf("") }
    var unlocked by remember { mutableStateOf<GuideState?>(null) }
    var plan by remember { mutableStateOf<MergePlan?>(null) }
    var err by remember { mutableStateOf<String?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Open / Merge Backup", fontWeight = FontWeight.Bold) },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState()), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                val inc = unlocked
                val mp = plan
                if (inc != null && mp != null) {
                    Text("+${mp.newFields} fields · +${mp.newRows} rows · +${mp.newTabs} sections · +${mp.newChecks} checks")
                    if (mp.conflictFields.isNotEmpty()) {
                        Text("${mp.conflictFields.size} conflict(s): ${mp.conflictFields.take(4).joinToString { it.label }}", color = FfgColors.Tomato, style = MaterialTheme.typography.bodySmall)
                    }
                    Button(onClick = { store.applyMerge(inc, false); onDismiss() }, modifier = Modifier.fillMaxWidth()) { Text("Smart Merge (Keep Mine)") }
                    OutlinedButton(onClick = { store.applyMerge(inc, true); onDismiss() }, modifier = Modifier.fillMaxWidth()) { Text("Smart Merge (Prefer Backup)") }
                    TextButton(onClick = {
                        store.state = inc; store.normalize(); store.save(touch = false); onDismiss()
                    }) { Text("Replace Everything on Device", color = FfgColors.Tomato) }
                } else {
                    OutlinedButton(onClick = { onPickFile { payload = it } }) { Text("Choose .json or .html file") }
                    OutlinedTextField(value = payload, onValueChange = { payload = it }, label = { Text("Or paste backup text") }, maxLines = 4, modifier = Modifier.fillMaxWidth())
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Checkbox(checked = useCards, onCheckedChange = { useCards = it })
                        Text("Unlock with 2 recovery cards", style = MaterialTheme.typography.bodySmall)
                    }
                    if (useCards) {
                        OutlinedTextField(value = cardA, onValueChange = { cardA = it }, label = { Text("Card A (FFG-1-...)") }, modifier = Modifier.fillMaxWidth())
                        OutlinedTextField(value = cardB, onValueChange = { cardB = it }, label = { Text("Card B (FFG-2-...)") }, modifier = Modifier.fillMaxWidth())
                    } else {
                        OutlinedTextField(value = pw, onValueChange = { pw = it }, label = { Text("Passphrase") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    }
                    err?.let { Text(it, color = FfgColors.Tomato, style = MaterialTheme.typography.bodySmall) }
                }
            }
        },
        confirmButton = {
            if (unlocked == null) {
                Button(onClick = {
                    runCatching {
                        val pkg = CryptoEngine.parseBackupPayload(payload)
                        val pass = if (useCards) CryptoEngine.sssCombine2of3(cardA, cardB) else pw
                        CryptoEngine.decrypt(pkg, pass)
                    }.onSuccess { inc ->
                        if (!store.hasAnyContent) {
                            store.state = inc; store.normalize(); store.save(touch = false); onDismiss()
                        } else {
                            unlocked = inc; plan = store.computeMergePlan(inc); err = null
                        }
                    }.onFailure { err = it.message ?: "Could not unlock backup." }
                }) { Text("Unlock") }
            }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Close") } }
    )
}

@Composable
fun NewSectionDialog(store: GuideStore, onDismiss: () -> Unit) {
    var name by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add a Section", fontWeight = FontWeight.Bold) },
        text = {
            LazyColumn(Modifier.heightIn(max = 380.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Custom name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                    Button(
                        onClick = { store.addCustomSection(name.trim()); onDismiss() },
                        enabled = name.trim().isNotEmpty(),
                        modifier = Modifier.padding(top = 4.dp)
                    ) { Text("Add Blank Section") }
                    HorizontalDivider(Modifier.padding(vertical = 8.dp))
                    Text("Or Start From a Template", fontWeight = FontWeight.Bold)
                }
                items(store.data.SECTION_TEMPLATES) { tpl ->
                    Column(Modifier.fillMaxWidth().clickable { store.applySectionTemplate(tpl); onDismiss() }.padding(vertical = 6.dp)) {
                        Text(tpl.name, fontWeight = FontWeight.SemiBold)
                        Text(tpl.desc, style = MaterialTheme.typography.bodySmall, color = FfgColors.Ink2)
                    }
                    HorizontalDivider()
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("Close") } }
    )
}
