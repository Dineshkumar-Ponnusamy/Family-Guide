using System.Text.Json;
using System.Text.Json.Serialization;

namespace FamilyGuide.Core;

public sealed class GuideData
{
    public List<TabDef> TABS { get; set; } = new();
    public Dictionary<string, PlaybookDef> PLAYBOOK { get; set; } = new();
    public List<ScriptItem> SCRIPTS { get; set; } = new();
    public List<GuideCard> MONEY_GUIDE { get; set; } = new();
    public List<GuideCard> PRO_FINDER { get; set; } = new();
    public List<GlanceItem> GLANCE { get; set; } = new();
    public List<KidsItem> KIDS { get; set; } = new();
    public List<EssentialItem> ESSENTIALS { get; set; } = new();
    public List<SectionTemplate> SECTION_TEMPLATES { get; set; } = new();
    public List<FireDrillItem> FIRE_DRILL { get; set; } = new();
    public Dictionary<string, RegionPreset> REGIONS { get; set; } = new();
    public Dictionary<string, DemoFamily> DEMO_FAMILIES { get; set; } = new();
    public List<string> DICE_WORDS { get; set; } = new();
}

public sealed class TabDef
{
    public string id { get; set; } = "";
    public string label { get; set; } = "";
    public string title { get; set; } = "";
    public string lede { get; set; } = "";
    public List<BlockDef> blocks { get; set; } = new();
}

public sealed class BlockDef
{
    public string type { get; set; } = "";
    public string? id { get; set; }
    public string? title { get; set; }
    public string? hint { get; set; }
    public bool? crisisEditable { get; set; }
    public List<FieldDef>? fields { get; set; }
    public List<ColDef>? cols { get; set; }
    public List<Dictionary<string, string>>? seed { get; set; }
    public string? suggestCol { get; set; }
    public List<string>? suggestions { get; set; }
    [JsonIgnore] public string StableId => id ?? title ?? type;
}

[JsonConverter(typeof(FieldDefConverter))]
public sealed record FieldDef(string id, string label, string placeholder = "", bool wide = false);

public sealed class FieldDefConverter : JsonConverter<FieldDef>
{
    public override FieldDef Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        var arr = doc.RootElement;
        return new FieldDef(
            arr.GetArrayLength() > 0 ? arr[0].GetString() ?? "" : "",
            arr.GetArrayLength() > 1 ? arr[1].GetString() ?? "" : "",
            arr.GetArrayLength() > 2 && arr[2].ValueKind == JsonValueKind.String ? arr[2].GetString() ?? "" : "",
            arr.GetArrayLength() > 3 && arr[3].ValueKind == JsonValueKind.True
        );
    }

    public override void Write(Utf8JsonWriter writer, FieldDef value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.id);
        writer.WriteStringValue(value.label);
        writer.WriteStringValue(value.placeholder);
        writer.WriteBooleanValue(value.wide);
        writer.WriteEndArray();
    }
}

[JsonConverter(typeof(ColDefConverter))]
public sealed record ColDef(string key, string label);

public sealed class ColDefConverter : JsonConverter<ColDef>
{
    public override ColDef Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        var arr = doc.RootElement;
        return new ColDef(
            arr.GetArrayLength() > 0 ? arr[0].GetString() ?? "" : "",
            arr.GetArrayLength() > 1 ? arr[1].GetString() ?? "" : ""
        );
    }

    public override void Write(Utf8JsonWriter writer, ColDef value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.key);
        writer.WriteStringValue(value.label);
        writer.WriteEndArray();
    }
}

public sealed class PlaybookDef
{
    public string label { get; set; } = "";
    public List<PlaybookPhase> phases { get; set; } = new();
}

public sealed class PlaybookPhase
{
    [JsonPropertyName("when")] public string whenLabel { get; set; } = "";
    public List<PlaybookStep> steps { get; set; } = new();
}

public sealed class PlaybookStep
{
    public string id { get; set; } = "";
    public string t { get; set; } = "";
    public string d { get; set; } = "";
    public string? @ref { get; set; }
    public string? refTab { get; set; }
    public string? refBlock { get; set; }
}

[JsonConverter(typeof(ScriptItemConverter))]
public sealed record ScriptItem(string title, string body);

public sealed class ScriptItemConverter : JsonConverter<ScriptItem>
{
    public override ScriptItem Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        var arr = doc.RootElement;
        return new ScriptItem(
            arr.GetArrayLength() > 0 ? arr[0].GetString() ?? "" : "",
            arr.GetArrayLength() > 1 ? arr[1].GetString() ?? "" : ""
        );
    }

    public override void Write(Utf8JsonWriter writer, ScriptItem value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.title);
        writer.WriteStringValue(value.body);
        writer.WriteEndArray();
    }
}

public sealed class GuideCard
{
    public string id { get; set; } = "";
    public string title { get; set; } = "";
    public string badge { get; set; } = "";
    public string summary { get; set; } = "";
    public List<string> bullets { get; set; } = new();
    public string? note { get; set; }
}

[JsonConverter(typeof(GlanceItemConverter))]
public sealed record GlanceItem(string id, string label, string placeholder = "");

public sealed class GlanceItemConverter : JsonConverter<GlanceItem>
{
    public override GlanceItem Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        var arr = doc.RootElement;
        return new GlanceItem(
            arr.GetArrayLength() > 0 ? arr[0].GetString() ?? "" : "",
            arr.GetArrayLength() > 1 ? arr[1].GetString() ?? "" : "",
            arr.GetArrayLength() > 2 && arr[2].ValueKind == JsonValueKind.String ? arr[2].GetString() ?? "" : ""
        );
    }

    public override void Write(Utf8JsonWriter writer, GlanceItem value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.id);
        writer.WriteStringValue(value.label);
        writer.WriteStringValue(value.placeholder);
        writer.WriteEndArray();
    }
}

[JsonConverter(typeof(KidsItemConverter))]
public sealed record KidsItem(string id, string emoji, string label, string placeholder = "");

public sealed class KidsItemConverter : JsonConverter<KidsItem>
{
    public override KidsItem Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        using var doc = JsonDocument.ParseValue(ref reader);
        var arr = doc.RootElement;
        return new KidsItem(
            arr.GetArrayLength() > 0 ? arr[0].GetString() ?? "" : "",
            arr.GetArrayLength() > 1 ? arr[1].GetString() ?? "" : "",
            arr.GetArrayLength() > 2 ? arr[2].GetString() ?? "" : "",
            arr.GetArrayLength() > 3 && arr[3].ValueKind == JsonValueKind.String ? arr[3].GetString() ?? "" : ""
        );
    }

    public override void Write(Utf8JsonWriter writer, KidsItem value, JsonSerializerOptions options)
    {
        writer.WriteStartArray();
        writer.WriteStringValue(value.id);
        writer.WriteStringValue(value.emoji);
        writer.WriteStringValue(value.label);
        writer.WriteStringValue(value.placeholder);
        writer.WriteEndArray();
    }
}

public sealed class EssentialItem
{
    public string id { get; set; } = "";
    public string type { get; set; } = "";
    public string label { get; set; } = "";
    public string tab { get; set; } = "";
    public string block { get; set; } = "";
}

public sealed class SectionTemplate
{
    public string name { get; set; } = "";
    public string desc { get; set; } = "";
    public List<TemplateField> fields { get; set; } = new();
    public List<TemplateList> lists { get; set; } = new();
}

public sealed class TemplateField
{
    public string label { get; set; } = "";
    public bool wide { get; set; }
}

public sealed class TemplateList
{
    public string title { get; set; } = "";
    public List<string> cols { get; set; } = new();
}

public sealed class FireDrillItem
{
    public string id { get; set; } = "";
    public string t { get; set; } = "";
    public string d { get; set; } = "";
}

public sealed class RegionPreset
{
    public string label { get; set; } = "";
    public string emergency { get; set; } = "911";
    public string currency { get; set; } = "$";
    public bool crossBorder { get; set; }
    public bool indiaNotes { get; set; }
    public RegionMoneyGuide? moneyGuide { get; set; }
    public RegionProFinder? proFinder { get; set; }
    public Dictionary<string, FieldOverride>? fieldOverrides { get; set; }
    public Dictionary<string, ListOverride>? listOverrides { get; set; }
    public Dictionary<string, StepOverride>? stepOverrides { get; set; }
}

public sealed class RegionMoneyGuide
{
    public string? depositCap { get; set; }
    public string? taxNote { get; set; }
    public string? fiduciaryName { get; set; }
    public string? safeCash { get; set; }
    public string? sampleTitle { get; set; }
    public List<string>? sampleLines { get; set; }
}

public sealed class RegionProFinder
{
    public string? legal { get; set; }
    public string? visa { get; set; }
    public string? money { get; set; }
    public string? tax { get; set; }
}

public sealed class FieldOverride { public string? label { get; set; } public string? ph { get; set; } }
public sealed class ListOverride { public string? hint { get; set; } public Dictionary<string, string>? colLabels { get; set; } public List<string>? extraSuggestions { get; set; } }
public sealed class StepOverride { public string? t { get; set; } public string? d { get; set; } }

public sealed class DemoFamily
{
    public string? track { get; set; }
    public Dictionary<string, string>? f { get; set; }
    public Dictionary<string, List<Dictionary<string, string>>>? lists { get; set; }
    public List<CustomTab>? customTabs { get; set; }
    public Dictionary<string, List<ExtraItem>>? extra { get; set; }
    public Dictionary<string, string>? f_extra_patch { get; set; }
}

public sealed class CustomTab
{
    public string id { get; set; } = "";
    public string label { get; set; } = "";
    public string title { get; set; } = "";
}

public sealed class ExtraItem
{
    public string type { get; set; } = "";
    public string id { get; set; } = "";
    public string? label { get; set; }
    public string? title { get; set; }
    public bool? wide { get; set; }
    public List<ColDef>? cols { get; set; }
}

public sealed class PhotoSnippet
{
    public string id { get; set; } = "";
    public string label { get; set; } = "";
    public string dataUrl { get; set; } = "";
}

public sealed class GuideState
{
    public Dictionary<string, string> f { get; set; } = new();
    public Dictionary<string, List<Dictionary<string, string>>> lists { get; set; } = new();
    public Dictionary<string, bool> checks { get; set; } = new();
    public string track { get; set; } = "hurt";
    public string tab { get; set; } = "start";
    public string region { get; set; } = "us";
    public bool isDemo { get; set; }
    public bool dismissDemo { get; set; }
    public bool readMode { get; set; }
    public bool hideEssentials { get; set; }
    public bool largeText { get; set; }
    public bool highContrast { get; set; }
    public List<CustomTab> customTabs { get; set; } = new();
    public Dictionary<string, List<ExtraItem>> extra { get; set; } = new();
    public Dictionary<string, bool> fireDrill { get; set; } = new();
    public List<PhotoSnippet> photos { get; set; } = new();
    public string? lastDryRun { get; set; }
    public string? updated { get; set; }
    public string? reviewed { get; set; }
    public string? lastBackup { get; set; }
}

public sealed class EncryptedBackupPackage
{
    public string app { get; set; } = "family-field-guide";
    public int v { get; set; } = 1;
    public string salt { get; set; } = "";
    public string iv { get; set; } = "";
    public string data { get; set; } = "";
}

public enum AuditSeverity { high = 0, med = 1, ok = 2 }

public sealed record AuditItem(
    string id,
    AuditSeverity sev,
    string title,
    string detail,
    string? tab = null,
    string? block = null,
    string? act = null
);

public sealed record MergeConflict(string id, string label);

public sealed record MergePlan(
    int newFields,
    List<MergeConflict> conflictFields,
    int newTabs,
    int newExtras,
    int newRows,
    int newChecks
);

public sealed record SearchHit(
    string tabId,
    string tabLabel,
    string title,
    string sub,
    string blockKey = "",
    string trackKey = ""
);
