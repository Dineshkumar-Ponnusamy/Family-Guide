package io.github.dineshkumarponnusamy.familyfieldguide.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.selection.SelectionContainer
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import io.github.dineshkumarponnusamy.familyfieldguide.core.*

enum class SheetType { Summary, ErGrab, Readiness, Search, Backup, Restore, NewSection }

private data class PendingRowDelete(
    val listId: String,
    val rowIdx: Int,
    val keepOneBlank: Boolean,
    val preview: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FamilyGuideScreen(
    store: GuideStore,
    revision: Int,
    isLocked: Boolean,
    lockEnabled: Boolean = false,
    onRequestBiometricUnlock: () -> Unit,
    onLockNow: () -> Unit,
    onDisableLock: () -> Unit = {},
    onShareText: (String, String) -> Unit,
    onExportBackupJson: (String) -> Unit,
    onPickBackupFile: ((String) -> Unit) -> Unit
) {
    // Reading `revision` ensures Compose recomposes on store mutations.
    @Suppress("UNUSED_VARIABLE") val _tick = revision
    var activeSheet by remember { mutableStateOf<SheetType?>(null) }
    var menuOpen by remember { mutableStateOf(false) }
    var regionMenuOpen by remember { mutableStateOf(false) }
    var pendingDeleteSection by remember { mutableStateOf<CustomTab?>(null) }
    var pendingDeleteRow by remember { mutableStateOf<PendingRowDelete?>(null) }
    val hc = store.state.highContrast

    if (isLocked) {
        Box(
            modifier = Modifier.fillMaxSize().background(if (hc) FfgColors.HcPaper else FfgColors.Paper).padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            FfgCard(highContrast = hc) {
                FfgBrandLogo(size = 56.dp)
                Spacer(Modifier.height(10.dp))
                Text("Our Family Field Guide is Locked", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp))
                Text("100% offline. Unlock with Fingerprint, Face, or Device PIN.", color = FfgColors.Ink2)
                Spacer(Modifier.height(16.dp))
                Button(onClick = onRequestBiometricUnlock) { Text("Unlock Guide") }
            }
        }
        return
    }

    val allTabs = remember(store.data, store.state.customTabs, revision) {
        store.data.TABS.map { it.id to it.label } + store.state.customTabs.map { it.id to it.label }
    }
    val selectedIdx = allTabs.indexOfFirst { it.first == store.state.tab }.coerceAtLeast(0)

    Scaffold(
        containerColor = if (hc) FfgColors.HcPaper else FfgColors.Paper,
        topBar = {
            TopAppBar(
                colors = TopAppBarDefaults.topAppBarColors(containerColor = if (hc) FfgColors.HcPaper else FfgColors.Paper),
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        FfgBrandLogo(size = 32.dp)
                        Column {
                            Text("Our Family Field Guide", style = MaterialTheme.typography.titleMedium, color = FfgColors.Ink)
                            Text(
                                "${store.completionPercent}% · ${store.currentRegion.label}",
                                style = MaterialTheme.typography.labelSmall,
                                color = FfgColors.Ink2
                            )
                        }
                    }
                },
                actions = {
                    TextButton(onClick = {
                        store.state = store.state.copy(readMode = !store.state.readMode)
                        store.save(touch = false)
                    }) {
                        Text(if (store.state.readMode) "Edit" else "Read", fontWeight = FontWeight.Bold)
                    }
                    IconButton(onClick = { activeSheet = SheetType.Search }) {
                        Icon(Icons.Default.Search, contentDescription = "Search")
                    }
                    IconButton(onClick = onLockNow) {
                        Icon(Icons.Default.Lock, contentDescription = "Lock")
                    }
                    Box {
                        IconButton(onClick = { menuOpen = true }) {
                            Icon(Icons.Default.MoreVert, contentDescription = "More")
                        }
                        DropdownMenu(expanded = menuOpen, onDismissRequest = { menuOpen = false }) {
                            DropdownMenuItem(text = { Text("1-Page Summary") }, onClick = { menuOpen = false; activeSheet = SheetType.Summary })
                            DropdownMenuItem(text = { Text("1-Page ER Grab Sheet") }, onClick = { menuOpen = false; activeSheet = SheetType.ErGrab })
                            DropdownMenuItem(text = { Text("Readiness & Fire Drill") }, onClick = { menuOpen = false; activeSheet = SheetType.Readiness })
                            DropdownMenuItem(text = { Text("Add Section / Template") }, onClick = { menuOpen = false; activeSheet = SheetType.NewSection })
                            DropdownMenuItem(text = { Text("Change Country / Region") }, onClick = { menuOpen = false; regionMenuOpen = true })
                            HorizontalDivider()
                            DropdownMenuItem(
                                text = { Text(if (store.state.largeText) "✓ A+ Large Text (On)" else "A+ Large Text") },
                                onClick = {
                                    menuOpen = false
                                    store.state = store.state.copy(largeText = !store.state.largeText)
                                    store.save(touch = false)
                                }
                            )
                            DropdownMenuItem(
                                text = { Text(if (store.state.highContrast) "✓ High Contrast (On)" else "High Contrast") },
                                onClick = {
                                    menuOpen = false
                                    store.state = store.state.copy(highContrast = !store.state.highContrast)
                                    store.save(touch = false)
                                }
                            )
                            HorizontalDivider()
                            if (lockEnabled) {
                                DropdownMenuItem(
                                    text = { Text("✓ Auto-Lock on Leave (On)") },
                                    onClick = { menuOpen = false; onDisableLock() }
                                )
                            }
                            DropdownMenuItem(text = { Text("Save Locked Backup") }, onClick = { menuOpen = false; activeSheet = SheetType.Backup })
                            DropdownMenuItem(text = { Text("Open / Merge Backup") }, onClick = { menuOpen = false; activeSheet = SheetType.Restore })
                        }
                        DropdownMenu(expanded = regionMenuOpen, onDismissRequest = { regionMenuOpen = false }) {
                            FfgColors.REGION_ORDER.filter { store.data.REGIONS.containsKey(it) }.forEach { k ->
                                DropdownMenuItem(
                                    text = { Text(store.data.REGIONS[k]?.label ?: k) },
                                    onClick = {
                                        regionMenuOpen = false
                                        store.state = store.state.copy(region = k)
                                        store.save(touch = false)
                                    }
                                )
                            }
                        }
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding)) {
            ScrollableTabRow(
                selectedTabIndex = selectedIdx,
                containerColor = if (hc) FfgColors.HcPaper else FfgColors.Paper,
                contentColor = FfgColors.Ink,
                edgePadding = 12.dp
            ) {
                allTabs.forEachIndexed { idx, (tid, lbl) ->
                    Tab(
                        selected = idx == selectedIdx,
                        onClick = {
                            store.state = store.state.copy(tab = tid)
                            store.save(touch = false)
                        },
                        text = { Text(lbl) }
                    )
                }
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(vertical = 14.dp)
            ) {
                if (store.state.readMode) {
                    item {
                        Surface(color = FfgColors.InfoBg, shape = RoundedCornerShape(8.dp), border = BorderStroke(1.dp, FfgColors.Sky), modifier = Modifier.fillMaxWidth()) {
                            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Read Mode — showing only filled answers.", modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodySmall)
                                TextButton(onClick = { store.state = store.state.copy(readMode = false); store.save(touch = false) }) {
                                    Text("Back to Edit")
                                }
                            }
                        }
                    }
                }
                item { DemoBanner(store) }

                val stdTab = store.data.TABS.firstOrNull { it.id == store.state.tab }
                if (stdTab != null) {
                    item {
                        Text(stdTab.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        Text(stdTab.lede, style = MaterialTheme.typography.bodySmall, color = FfgColors.Ink2)
                    }
                    stdTab.blocks.forEach { block ->
                        item(key = "${stdTab.id}_${block.stableId}") {
                            RenderBlock(
                                store = store,
                                b = block,
                                onRequestRowDelete = { listId, idx, keepOneBlank, row ->
                                    val preview = row.values.map { it.trim() }.filter { it.isNotEmpty() }.joinToString(" · ").take(60)
                                    if (preview.isNotEmpty()) {
                                        pendingDeleteRow = PendingRowDelete(listId, idx, keepOneBlank, preview)
                                    } else {
                                        store.removeListRow(listId, idx, keepOneBlank)
                                    }
                                },
                                onJump = { t, tr ->
                                    store.state = store.state.copy(
                                        tab = t,
                                        track = if (tr.isNotEmpty() && store.data.PLAYBOOK.containsKey(tr)) tr else store.state.track
                                    )
                                    store.save(touch = false)
                                }
                            )
                        }
                    }
                    item { RenderExtras(store, stdTab.id, "More details") }
                } else {
                    val ct = store.state.customTabs.firstOrNull { it.id == store.state.tab }
                    if (ct != null) {
                        item {
                            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text(ct.title, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                                if (!store.state.readMode) {
                                    TextButton(onClick = { pendingDeleteSection = ct }) {
                                        Text("Delete", color = FfgColors.TomatoInk)
                                    }
                                }
                            }
                        }
                        item { RenderExtras(store, ct.id, "Details") }
                    }
                }
            }
        }
    }

    when (activeSheet) {
        SheetType.Summary -> TextSheetDialog("1-Page Executive Summary", store.exportExecutiveSummaryText(), onShare = {
            onShareText("Family Guide Summary", store.exportExecutiveSummaryText())
        }, onDismiss = { activeSheet = null })
        SheetType.ErGrab -> TextSheetDialog("1-Page ER Grab Sheet", store.exportErGrabSheetText(), onShare = {
            onShareText("ER & Medical Grab Sheet", store.exportErGrabSheetText())
        }, onDismiss = { activeSheet = null })
        SheetType.Readiness -> ReadinessDialog(store, onFix = { tab, act ->
            activeSheet = if (act == "backup") SheetType.Backup else null
            if (tab != null) {
                store.state = store.state.copy(tab = tab)
                store.save(touch = false)
            }
        }, onDismiss = { activeSheet = null })
        SheetType.Search -> SearchDialog(store, onSelect = { hit ->
            store.state = store.state.copy(
                tab = hit.tabId,
                track = if (hit.trackKey.isNotEmpty() && store.data.PLAYBOOK.containsKey(hit.trackKey)) hit.trackKey else store.state.track
            )
            store.save(touch = false)
            activeSheet = null
        }, onDismiss = { activeSheet = null })
        SheetType.Backup -> BackupDialog(store, onExportJson = onExportBackupJson, onDismiss = { activeSheet = null })
        SheetType.Restore -> RestoreDialog(store, onPickFile = onPickBackupFile, onDismiss = { activeSheet = null })
        SheetType.NewSection -> NewSectionDialog(store, onDismiss = { activeSheet = null })
        null -> {}
    }

    pendingDeleteRow?.let { pending ->
        AlertDialog(
            onDismissRequest = { pendingDeleteRow = null },
            title = { Text("Remove this row?", fontWeight = FontWeight.Bold) },
            text = { Text("Remove \"${pending.preview}\" from this list?") },
            confirmButton = {
                TextButton(onClick = {
                    store.removeListRow(pending.listId, pending.rowIdx, pending.keepOneBlank)
                    pendingDeleteRow = null
                }) { Text("Remove", color = FfgColors.TomatoInk) }
            },
            dismissButton = {
                TextButton(onClick = { pendingDeleteRow = null }) { Text("Cancel") }
            }
        )
    }

    pendingDeleteSection?.let { ct ->
        AlertDialog(
            onDismissRequest = { pendingDeleteSection = null },
            title = { Text("Delete \"${ct.title}\"?", fontWeight = FontWeight.Bold) },
            text = { Text("This will permanently remove this custom section and all entries inside it.") },
            confirmButton = {
                TextButton(onClick = {
                    store.deleteCustomSection(ct.id)
                    pendingDeleteSection = null
                }) { Text("Delete", color = FfgColors.TomatoInk) }
            },
            dismissButton = {
                TextButton(onClick = { pendingDeleteSection = null }) { Text("Cancel") }
            }
        )
    }
}

@Composable
private fun DemoBanner(store: GuideStore) {
    if (store.state.isDemo) {
        Surface(color = Color(0xFFFFF3DD), shape = RoundedCornerShape(8.dp), modifier = Modifier.fillMaxWidth()) {
            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Sample family (${store.currentRegion.label})", modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodySmall)
                Button(onClick = { store.clearDemo() }) { Text("Clear sample") }
            }
        }
    } else if (!store.hasAnyContent && !store.state.readMode && !store.state.dismissDemo) {
        Surface(color = Color(0xFFEEF5EE), shape = RoundedCornerShape(8.dp), modifier = Modifier.fillMaxWidth()) {
            Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("Preview a filled sample guide (US + India H-1B or Standard)", modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodySmall)
                TextButton(onClick = { store.state = store.state.copy(dismissDemo = true); store.save(touch = false) }) { Text("Dismiss") }
                Button(onClick = { store.loadDemo() }) { Text("Load sample") }
            }
        }
    }
}

@Composable
private fun RenderBlock(
    store: GuideStore,
    b: BlockDef,
    onRequestRowDelete: (String, Int, Boolean, Map<String, String>) -> Unit,
    onJump: (String, String) -> Unit
) {
    when (b.type) {
        "glance" -> {
            Surface(color = FfgColors.Ink, shape = RoundedCornerShape(10.dp), border = BorderStroke(2.dp, FfgColors.Tomato), modifier = Modifier.fillMaxWidth()) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("If you read nothing else", style = MaterialTheme.typography.titleMedium, color = FfgColors.Paper, fontWeight = FontWeight.Bold)
                    store.data.GLANCE.forEach { g ->
                        val rf = store.localizedField(FieldDef(g.id, g.label, g.placeholder))
                        val v = store.state.f[rf.id] ?: ""
                        if (!store.state.readMode || v.trim().isNotEmpty()) {
                            Text(rf.label.uppercase(), style = MaterialTheme.typography.labelSmall, color = FfgColors.Paper2)
                            if (store.state.readMode) {
                                SelectionContainer { Text(v, color = FfgColors.Paper) }
                            } else {
                                OutlinedTextField(
                                    value = v,
                                    onValueChange = { store.updateField(rf.id, it) },
                                    placeholder = { Text(rf.placeholder) },
                                    singleLine = true,
                                    colors = OutlinedTextFieldDefaults.colors(focusedTextColor = FfgColors.Paper, unfocusedTextColor = FfgColors.Paper),
                                    modifier = Modifier.fillMaxWidth()
                                )
                            }
                        }
                    }
                }
            }
        }
        "playbook" -> FfgCard(highContrast = store.state.highContrast) {
            Text("What's happening?", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FfgColors.PLAYBOOK_ORDER.mapNotNull { k -> store.data.PLAYBOOK[k]?.let { k to it } }.forEach { (k, pb) ->
                    FilterChip(
                        selected = store.state.track == k,
                        onClick = { store.state = store.state.copy(track = k); store.save(touch = false) },
                        label = { Text(pb.label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = FfgColors.Tomato,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
            val active = store.data.PLAYBOOK[store.state.track]
            active?.phases?.forEach { ph ->
                Text(ph.whenLabel, fontFamily = FontFamily.Serif, color = FfgColors.Tomato, fontWeight = FontWeight.Bold, fontStyle = FontStyle.Italic, modifier = Modifier.padding(top = 8.dp))
                ph.steps.forEach { rawS ->
                    val s = store.localizedStep(rawS)
                    val checked = store.state.checks[s.id] == true
                    Row(Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.Top) {
                        Checkbox(checked = checked, onCheckedChange = {
                            val next = store.state.checks.toMutableMap()
                            next[s.id] = it
                            store.state = store.state.copy(checks = next)
                            store.save()
                        })
                        Column(Modifier.weight(1f)) {
                            Text(s.t, fontWeight = FontWeight.SemiBold, textDecoration = if (checked) TextDecoration.LineThrough else TextDecoration.None)
                            Text(s.d, style = MaterialTheme.typography.bodySmall, color = FfgColors.Ink2)
                            if (!s.ref.isNullOrEmpty() && !s.refTab.isNullOrEmpty()) {
                                Text(
                                    "↳ ${s.ref}",
                                    color = FfgColors.Sky,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.clickable { onJump(s.refTab, "") }.padding(top = 2.dp)
                                )
                            }
                        }
                    }
                    HorizontalDivider(color = FfgColors.Rule)
                }
            }
        }
        "fields" -> {
            val fields = (b.fields ?: emptyList()).map { store.localizedField(it) }
            val visible = if (store.state.readMode) fields.filter { (store.state.f[it.id] ?: "").trim().isNotEmpty() } else fields
            if (visible.isNotEmpty()) {
                FfgCard {
                    Text(b.title ?: "", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    b.hint?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = FfgColors.Mute) }
                    Spacer(Modifier.height(6.dp))
                    visible.forEach { rf ->
                        val v = store.state.f[rf.id] ?: ""
                        Text(rf.label.uppercase(), style = MaterialTheme.typography.labelSmall, color = FfgColors.Ink2)
                        if (store.state.readMode) {
                            SelectionContainer { Text(v, modifier = Modifier.padding(vertical = 4.dp)) }
                        } else {
                            OutlinedTextField(
                                value = v,
                                onValueChange = { store.updateField(rf.id, it) },
                                placeholder = { Text(rf.placeholder) },
                                singleLine = !rf.wide,
                                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)
                            )
                        }
                    }
                }
            }
        }
        "list" -> b.id?.let { bid ->
            val loc = store.localizedList(b)
            val editable = !store.state.readMode || (b.crisisEditable == true)
            val rows = store.state.lists[bid] ?: emptyList()
            val filled = rows.mapIndexedNotNull { idx, r -> if (store.isRowUserEdited(bid, r)) idx to r else null }
            if (editable || filled.isNotEmpty()) {
                FfgCard {
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(b.title ?: "", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        if (filled.isNotEmpty()) Text("${filled.size} filled", style = MaterialTheme.typography.labelSmall, color = FfgColors.Ink2)
                    }
                    loc.hint?.let { Text(it, style = MaterialTheme.typography.bodySmall, color = FfgColors.Mute) }
                    val indices = if (editable) rows.indices.toList() else filled.map { it.first }
                    indices.forEach { idx ->
                        Surface(color = FfgColors.Paper, shape = RoundedCornerShape(6.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                            Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                if (editable) {
                                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                                        Text("✕", color = FfgColors.TomatoInk, modifier = Modifier.clickable {
                                            onRequestRowDelete(bid, idx, b.crisisEditable == true, rows[idx])
                                        })
                                    }
                                }
                                loc.cols.forEach { col ->
                                    val cell = rows[idx][col.key] ?: ""
                                    if (editable || cell.trim().isNotEmpty()) {
                                        Text(col.label.uppercase(), style = MaterialTheme.typography.labelSmall, color = FfgColors.Ink2)
                                        if (editable) {
                                            OutlinedTextField(
                                                value = cell,
                                                onValueChange = { store.updateListCell(bid, idx, col.key, it) },
                                                singleLine = true,
                                                modifier = Modifier.fillMaxWidth()
                                            )
                                        } else {
                                            SelectionContainer { Text(cell) }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (editable) {
                        OutlinedButton(onClick = { store.addListRow(bid) }) { Text("+ Add a row") }
                        if (loc.suggestions.isNotEmpty() && !store.state.readMode) {
                            val scol = b.suggestCol ?: loc.cols.firstOrNull()?.key ?: ""
                            Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                loc.suggestions.forEach { lbl ->
                                    AssistChip(onClick = { store.addListRow(bid, mapOf(scol to lbl)) }, label = { Text("+ $lbl") })
                                }
                            }
                        }
                    }
                }
            }
        }
        "money_guide" -> FfgCard {
            Text(b.title ?: "Beginner's guide: handling big money", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            store.currentRegion.moneyGuide?.let { mg ->
                Surface(color = FfgColors.WarnBg, shape = RoundedCornerShape(6.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                    Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        mg.depositCap?.let { Text("Deposit Cap (${store.currentRegion.label}): $it", style = MaterialTheme.typography.bodySmall) }
                        mg.safeCash?.let { Text("Safe Cash: $it", style = MaterialTheme.typography.bodySmall) }
                        mg.fiduciaryName?.let { Text("Who to Hire: $it", style = MaterialTheme.typography.bodySmall) }
                        mg.taxNote?.let { Text("Tax Note: $it", style = MaterialTheme.typography.bodySmall) }
                    }
                }
                mg.sampleLines?.takeIf { it.isNotEmpty() }?.let { lines ->
                    Text(mg.sampleTitle ?: "Sample Allocation", fontWeight = FontWeight.Bold)
                    lines.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
                }
            }
            Spacer(Modifier.height(6.dp))
            store.data.MONEY_GUIDE.forEach { RenderGuideCard(it) }
        }
        "pro_finder" -> FfgCard {
            Text(b.title ?: "How to find vetted & low-cost help", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            store.currentRegion.proFinder?.let { pf ->
                Surface(color = FfgColors.WarnBg, shape = RoundedCornerShape(6.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
                    Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        pf.legal?.let { Text("Legal / Estate: $it", style = MaterialTheme.typography.bodySmall) }
                        pf.visa?.let { Text("Immigration / Visa: $it", style = MaterialTheme.typography.bodySmall) }
                        pf.money?.let { Text("Financial Advisor: $it", style = MaterialTheme.typography.bodySmall) }
                        pf.tax?.let { Text("Taxes & Free Aid: $it", style = MaterialTheme.typography.bodySmall) }
                    }
                }
            }
            Spacer(Modifier.height(6.dp))
            store.data.PRO_FINDER.forEach { RenderGuideCard(it) }
        }
        "scripts" -> FfgCard {
            Text("What to say", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            store.data.SCRIPTS.forEach { sc ->
                Surface(color = FfgColors.Paper, shape = RoundedCornerShape(6.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Column(Modifier.padding(10.dp)) {
                        Text(sc.title.uppercase(), style = MaterialTheme.typography.labelSmall, color = FfgColors.Ink2)
                        SelectionContainer { Text(sc.body, fontStyle = FontStyle.Italic) }
                    }
                }
            }
        }
        "letter" -> {
            val v = store.state.f["letter"] ?: ""
            if (!store.state.readMode || v.trim().isNotEmpty()) {
                FfgCard {
                    Text("A note to you", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    if (store.state.readMode) SelectionContainer { Text(v) }
                    else OutlinedTextField(value = v, onValueChange = { store.updateField("letter", it) }, modifier = Modifier.fillMaxWidth())
                }
            }
        }
        "kids" -> FfgCard {
            store.data.KIDS.forEach { k ->
                val rf = store.localizedField(FieldDef(k.id, k.label, k.placeholder, true))
                val v = store.state.f[rf.id] ?: ""
                if (!store.state.readMode || v.trim().isNotEmpty()) {
                    Text("${k.emoji} ${rf.label}", fontWeight = FontWeight.Bold)
                    if (store.state.readMode) SelectionContainer { Text(v) }
                    else OutlinedTextField(value = v, onValueChange = { store.updateField(rf.id, it) }, placeholder = { Text(rf.placeholder) }, modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp))
                }
            }
        }
    }
}

@Composable
private fun RenderGuideCard(c: GuideCard) {
    Surface(color = FfgColors.Paper, shape = RoundedCornerShape(6.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Column(Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text(c.title, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                Text(c.badge, style = MaterialTheme.typography.labelSmall, color = FfgColors.Sky)
            }
            Text(c.summary, style = MaterialTheme.typography.bodySmall, color = FfgColors.Ink2)
            c.bullets.forEach { Text("• $it", style = MaterialTheme.typography.bodySmall) }
            c.note?.let {
                Surface(color = FfgColors.InfoBg, shape = RoundedCornerShape(4.dp)) {
                    Text(it, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(8.dp))
                }
            }
        }
    }
}

@Composable
private fun RenderExtras(store: GuideStore, tabId: String, title: String) {
    val items = store.state.extra[tabId] ?: return
    val fields = items.filter { it.type == "field" }
    val lists = items.filter { it.type == "list" }
    if (fields.isNotEmpty()) {
        FfgCard {
            Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            fields.forEach { x ->
                val v = store.state.f[x.id] ?: ""
                Text((x.label ?: "").uppercase(), style = MaterialTheme.typography.labelSmall, color = FfgColors.Ink2)
                if (store.state.readMode) SelectionContainer { Text(v) }
                else OutlinedTextField(value = v, onValueChange = { store.updateField(x.id, it) }, modifier = Modifier.fillMaxWidth().padding(bottom = 6.dp))
            }
        }
    }
    lists.forEach { x ->
        val rows = store.state.lists[x.id] ?: emptyList()
        FfgCard {
            Text(x.title ?: "Table", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            rows.indices.forEach { idx ->
                Surface(color = FfgColors.Paper, shape = RoundedCornerShape(6.dp), modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Column(Modifier.padding(8.dp)) {
                        (x.cols ?: emptyList()).forEach { col ->
                            val cell = rows[idx][col.key] ?: ""
                            Text(col.label.uppercase(), style = MaterialTheme.typography.labelSmall)
                            if (store.state.readMode) Text(cell)
                            else OutlinedTextField(value = cell, onValueChange = { store.updateListCell(x.id, idx, col.key, it) }, modifier = Modifier.fillMaxWidth())
                        }
                    }
                }
            }
            if (!store.state.readMode) {
                OutlinedButton(onClick = { store.addListRow(x.id) }) { Text("+ Add a row") }
            }
        }
    }
}
