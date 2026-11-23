package io.github.dineshkumarponnusamy.familyfieldguide.core

import kotlinx.serialization.KSerializer
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonPrimitive

@Serializable
data class GuideData(
    val TABS: List<TabDef>,
    val PLAYBOOK: Map<String, PlaybookDef>,
    val SCRIPTS: List<ScriptItem>,
    val MONEY_GUIDE: List<GuideCard>,
    val PRO_FINDER: List<GuideCard>,
    val GLANCE: List<GlanceItem>,
    val KIDS: List<KidsItem>,
    val ESSENTIALS: List<EssentialItem>,
    val SECTION_TEMPLATES: List<SectionTemplate>,
    val FIRE_DRILL: List<FireDrillItem>,
    val REGIONS: Map<String, RegionPreset>,
    val DEMO_FAMILIES: Map<String, DemoFamily>,
    val DICE_WORDS: List<String>
)

@Serializable
data class TabDef(
    val id: String,
    val label: String,
    val title: String,
    val lede: String,
    val blocks: List<BlockDef>
)

@Serializable
data class BlockDef(
    val type: String,
    val id: String? = null,
    val title: String? = null,
    val hint: String? = null,
    val crisisEditable: Boolean? = null,
    val fields: List<FieldDef>? = null,
    val cols: List<ColDef>? = null,
    val seed: List<Map<String, String>>? = null,
    val suggestCol: String? = null,
    val suggestions: List<String>? = null
) {
    val stableId: String get() = id ?: title ?: type
}

@Serializable(with = FieldDefSerializer::class)
data class FieldDef(
    val id: String,
    val label: String,
    val placeholder: String = "",
    val wide: Boolean = false
)

object FieldDefSerializer : KSerializer<FieldDef> {
    private val delegate = JsonArray.serializer()
    override val descriptor: SerialDescriptor = delegate.descriptor
    override fun deserialize(decoder: Decoder): FieldDef {
        val arr = decoder.decodeSerializableValue(delegate)
        return FieldDef(
            id = arr.getOrNull(0)?.jsonPrimitive?.contentOrNull ?: "",
            label = arr.getOrNull(1)?.jsonPrimitive?.contentOrNull ?: "",
            placeholder = arr.getOrNull(2)?.jsonPrimitive?.contentOrNull ?: "",
            wide = arr.getOrNull(3)?.jsonPrimitive?.booleanOrNull ?: false
        )
    }

    override fun serialize(encoder: Encoder, value: FieldDef) {
        encoder.encodeSerializableValue(
            delegate,
            JsonArray(
                listOf(
                    JsonPrimitive(value.id),
                    JsonPrimitive(value.label),
                    JsonPrimitive(value.placeholder),
                    JsonPrimitive(value.wide)
                )
            )
        )
    }
}

@Serializable(with = ColDefSerializer::class)
data class ColDef(val key: String, val label: String)

object ColDefSerializer : KSerializer<ColDef> {
    private val delegate = JsonArray.serializer()
    override val descriptor: SerialDescriptor = delegate.descriptor
    override fun deserialize(decoder: Decoder): ColDef {
        val arr = decoder.decodeSerializableValue(delegate)
        return ColDef(
            key = arr.getOrNull(0)?.jsonPrimitive?.contentOrNull ?: "",
            label = arr.getOrNull(1)?.jsonPrimitive?.contentOrNull ?: ""
        )
    }

    override fun serialize(encoder: Encoder, value: ColDef) {
        encoder.encodeSerializableValue(delegate, JsonArray(listOf(JsonPrimitive(value.key), JsonPrimitive(value.label))))
    }
}

@Serializable
data class PlaybookDef(val label: String, val phases: List<PlaybookPhase>)

@Serializable
data class PlaybookPhase(
    @SerialName("when") val whenLabel: String,
    val steps: List<PlaybookStep>
)

@Serializable
data class PlaybookStep(
    val id: String,
    val t: String,
    val d: String,
    val ref: String? = null,
    val refTab: String? = null,
    val refBlock: String? = null
)

@Serializable(with = ScriptItemSerializer::class)
data class ScriptItem(val title: String, val body: String)

object ScriptItemSerializer : KSerializer<ScriptItem> {
    private val delegate = JsonArray.serializer()
    override val descriptor: SerialDescriptor = delegate.descriptor
    override fun deserialize(decoder: Decoder): ScriptItem {
        val arr = decoder.decodeSerializableValue(delegate)
        return ScriptItem(
            title = arr.getOrNull(0)?.jsonPrimitive?.contentOrNull ?: "",
            body = arr.getOrNull(1)?.jsonPrimitive?.contentOrNull ?: ""
        )
    }

    override fun serialize(encoder: Encoder, value: ScriptItem) {
        encoder.encodeSerializableValue(delegate, JsonArray(listOf(JsonPrimitive(value.title), JsonPrimitive(value.body))))
    }
}

@Serializable
data class GuideCard(
    val id: String,
    val title: String,
    val badge: String = "",
    val summary: String,
    val bullets: List<String> = emptyList(),
    val note: String? = null
)

@Serializable(with = GlanceItemSerializer::class)
data class GlanceItem(val id: String, val label: String, val placeholder: String = "")

object GlanceItemSerializer : KSerializer<GlanceItem> {
    private val delegate = JsonArray.serializer()
    override val descriptor: SerialDescriptor = delegate.descriptor
    override fun deserialize(decoder: Decoder): GlanceItem {
        val arr = decoder.decodeSerializableValue(delegate)
        return GlanceItem(
            id = arr.getOrNull(0)?.jsonPrimitive?.contentOrNull ?: "",
            label = arr.getOrNull(1)?.jsonPrimitive?.contentOrNull ?: "",
            placeholder = arr.getOrNull(2)?.jsonPrimitive?.contentOrNull ?: ""
        )
    }

    override fun serialize(encoder: Encoder, value: GlanceItem) {
        encoder.encodeSerializableValue(delegate, JsonArray(listOf(JsonPrimitive(value.id), JsonPrimitive(value.label), JsonPrimitive(value.placeholder))))
    }
}

@Serializable(with = KidsItemSerializer::class)
data class KidsItem(val id: String, val emoji: String, val label: String, val placeholder: String = "")

object KidsItemSerializer : KSerializer<KidsItem> {
    private val delegate = JsonArray.serializer()
    override val descriptor: SerialDescriptor = delegate.descriptor
    override fun deserialize(decoder: Decoder): KidsItem {
        val arr = decoder.decodeSerializableValue(delegate)
        return KidsItem(
            id = arr.getOrNull(0)?.jsonPrimitive?.contentOrNull ?: "",
            emoji = arr.getOrNull(1)?.jsonPrimitive?.contentOrNull ?: "",
            label = arr.getOrNull(2)?.jsonPrimitive?.contentOrNull ?: "",
            placeholder = arr.getOrNull(3)?.jsonPrimitive?.contentOrNull ?: ""
        )
    }

    override fun serialize(encoder: Encoder, value: KidsItem) {
        encoder.encodeSerializableValue(delegate, JsonArray(listOf(JsonPrimitive(value.id), JsonPrimitive(value.emoji), JsonPrimitive(value.label), JsonPrimitive(value.placeholder))))
    }
}

@Serializable
data class EssentialItem(val id: String, val type: String, val label: String, val tab: String, val block: String)

@Serializable
data class SectionTemplate(
    val name: String,
    val desc: String,
    val fields: List<TemplateField>,
    val lists: List<TemplateList>
)

@Serializable
data class TemplateField(val label: String, val wide: Boolean = false)

@Serializable
data class TemplateList(val title: String, val cols: List<String>)

@Serializable
data class FireDrillItem(val id: String, val t: String, val d: String)

@Serializable
data class RegionPreset(
    val label: String,
    val emergency: String,
    val currency: String,
    val crossBorder: Boolean = false,
    val indiaNotes: Boolean = false,
    val moneyGuide: RegionMoneyGuide? = null,
    val proFinder: RegionProFinder? = null,
    val fieldOverrides: Map<String, FieldOverride>? = null,
    val listOverrides: Map<String, ListOverride>? = null,
    val stepOverrides: Map<String, StepOverride>? = null
)

@Serializable
data class RegionMoneyGuide(
    val depositCap: String? = null,
    val taxNote: String? = null,
    val fiduciaryName: String? = null,
    val safeCash: String? = null,
    val sampleTitle: String? = null,
    val sampleLines: List<String>? = null
)

@Serializable
data class RegionProFinder(
    val legal: String? = null,
    val visa: String? = null,
    val money: String? = null,
    val tax: String? = null
)

@Serializable
data class FieldOverride(val label: String? = null, val ph: String? = null)

@Serializable
data class ListOverride(
    val hint: String? = null,
    val colLabels: Map<String, String>? = null,
    val extraSuggestions: List<String>? = null
)

@Serializable
data class StepOverride(val t: String? = null, val d: String? = null)

@Serializable
data class DemoFamily(
    val track: String? = null,
    val f: Map<String, String>? = null,
    val lists: Map<String, List<Map<String, String>>>? = null,
    val customTabs: List<CustomTab>? = null,
    val extra: Map<String, List<ExtraItem>>? = null,
    val f_extra_patch: Map<String, String>? = null
)

@Serializable
data class CustomTab(val id: String, val label: String, val title: String)

@Serializable
data class ExtraItem(
    val type: String,
    val id: String,
    val label: String? = null,
    val title: String? = null,
    val wide: Boolean? = null,
    val cols: List<ColDef>? = null
)

@Serializable
data class PhotoSnippet(val id: String, val label: String, val dataUrl: String)

@Serializable
data class GuideState(
    val f: Map<String, String> = emptyMap(),
    val lists: Map<String, List<Map<String, String>>> = emptyMap(),
    val checks: Map<String, Boolean> = emptyMap(),
    val track: String = "hurt",
    val tab: String = "start",
    val region: String = "us",
    val isDemo: Boolean = false,
    val dismissDemo: Boolean = false,
    val readMode: Boolean = false,
    val hideEssentials: Boolean = false,
    val largeText: Boolean = false,
    val highContrast: Boolean = false,
    val customTabs: List<CustomTab> = emptyList(),
    val extra: Map<String, List<ExtraItem>> = emptyMap(),
    val fireDrill: Map<String, Boolean> = emptyMap(),
    val photos: List<PhotoSnippet> = emptyList(),
    val lastDryRun: String? = null,
    val updated: String? = null,
    val reviewed: String? = null,
    val lastBackup: String? = null
)

@Serializable
data class EncryptedBackupPackage(
    val app: String = "family-field-guide",
    val v: Int = 1,
    val salt: String,
    val iv: String,
    val data: String
)

enum class AuditSeverity(val rank: Int) { high(0), med(1), ok(2) }

data class AuditItem(
    val id: String,
    val sev: AuditSeverity,
    val title: String,
    val detail: String,
    val tab: String? = null,
    val block: String? = null,
    val act: String? = null
)

data class MergeConflict(val id: String, val label: String)

data class MergePlan(
    val newFields: Int,
    val conflictFields: List<MergeConflict>,
    val newTabs: Int,
    val newExtras: Int,
    val newRows: Int,
    val newChecks: Int
)

data class SearchHit(
    val tabId: String,
    val tabLabel: String,
    val title: String,
    val sub: String,
    val blockKey: String = "",
    val trackKey: String = ""
)
