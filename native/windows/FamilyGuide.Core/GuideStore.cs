using System.Reflection;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace FamilyGuide.Core;

public sealed class GuideStore
{
    private static readonly JsonSerializerOptions JsonOpts = new() { WriteIndented = true };
    private readonly string _statePath;

    public GuideData Data { get; }
    public GuideState State { get; set; }
    public string? StatusToast { get; set; }
    public event Action? StateChanged;

    public GuideStore(string? storageDirectory = null)
    {
        var asm = Assembly.GetExecutingAssembly();
        using var stream = asm.GetManifestResourceStream("FamilyGuide.Core.Resources.guide-data.json")
            ?? throw new InvalidOperationException("Missing embedded guide-data.json resource.");
        Data = JsonSerializer.Deserialize<GuideData>(stream)
            ?? throw new InvalidOperationException("Could not decode guide-data.json.");

        string dir = storageDirectory
            ?? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "FamilyFieldGuide");
        Directory.CreateDirectory(dir);
        _statePath = Path.Combine(dir, "state.json");

        if (File.Exists(_statePath))
        {
            try
            {
                State = JsonSerializer.Deserialize<GuideState>(File.ReadAllText(_statePath)) ?? new GuideState();
            }
            catch
            {
                State = new GuideState();
            }
        }
        else
        {
            State = new GuideState();
        }
        Normalize();
    }

    public void Save(bool touch = true)
    {
        if (touch) State.updated = DateTime.UtcNow.ToString("O");
        try
        {
            File.WriteAllText(_statePath, JsonSerializer.Serialize(State, JsonOpts));
        }
        catch { }
        StateChanged?.Invoke();
    }

    public void Normalize()
    {
        if (!Data.REGIONS.ContainsKey(State.region)) State.region = "us";
        if (!Data.PLAYBOOK.ContainsKey(State.track)) State.track = "hurt";

        foreach (var tab in Data.TABS)
        {
            foreach (var b in tab.blocks)
            {
                if (b.type == "list" && b.id != null && !State.lists.ContainsKey(b.id))
                {
                    State.lists[b.id] = b.seed != null
                        ? b.seed.Select(r => new Dictionary<string, string>(r)).ToList()
                        : new List<Dictionary<string, string>> { new() };
                }
            }
        }

        foreach (var items in State.extra.Values)
        {
            foreach (var x in items)
            {
                if (x.type == "list" && !State.lists.ContainsKey(x.id))
                    State.lists[x.id] = new List<Dictionary<string, string>> { new() };
            }
        }

        var validTabs = Data.TABS.Select(t => t.id).Concat(State.customTabs.Select(c => c.id)).ToHashSet();
        if (!validTabs.Contains(State.tab)) State.tab = "start";
    }

    public RegionPreset CurrentRegion => Data.REGIONS.TryGetValue(State.region, out var r) ? r : Data.REGIONS["us"];

    public FieldDef LocalizedField(FieldDef f)
    {
        if (CurrentRegion.fieldOverrides != null && CurrentRegion.fieldOverrides.TryGetValue(f.id, out var ov))
            return new FieldDef(f.id, ov.label ?? f.label, ov.ph ?? f.placeholder, f.wide);
        return f;
    }

    public (string? hint, List<string> suggestions, List<ColDef> cols) LocalizedList(BlockDef b)
    {
        ListOverride? ov = null;
        if (b.id != null) CurrentRegion.listOverrides?.TryGetValue(b.id, out ov);

        var sugs = new List<string>(b.suggestions ?? Enumerable.Empty<string>());
        if (ov?.extraSuggestions != null)
        {
            foreach (var s in ov.extraSuggestions)
                if (!sugs.Contains(s)) sugs.Add(s);
        }

        var cols = (b.cols ?? Enumerable.Empty<ColDef>()).Select(c =>
        {
            string? lbl = null;
            ov?.colLabels?.TryGetValue(c.key, out lbl);
            return new ColDef(c.key, lbl ?? c.label);
        }).ToList();

        return (ov?.hint ?? b.hint, sugs, cols);
    }

    public PlaybookStep LocalizedStep(PlaybookStep s)
    {
        if (CurrentRegion.stepOverrides != null && CurrentRegion.stepOverrides.TryGetValue(s.id, out var ov))
        {
            return new PlaybookStep
            {
                id = s.id,
                t = ov.t ?? s.t,
                d = ov.d ?? s.d,
                @ref = s.@ref,
                refTab = s.refTab,
                refBlock = s.refBlock
            };
        }
        return s;
    }

    public BlockDef? FindListDef(string id) =>
        Data.TABS.SelectMany(t => t.blocks).FirstOrDefault(b => b.id == id);

    public bool IsRowUserEdited(string blockId, Dictionary<string, string> row)
    {
        var nonEmpty = row.Where(kv => !string.IsNullOrWhiteSpace(kv.Value)).ToList();
        if (nonEmpty.Count == 0) return false;

        var def = FindListDef(blockId);
        if (def == null) return true;
        var loc = LocalizedList(def);

        if (def.seed != null && def.seed.Count > 0)
        {
            bool matchesSeed = def.seed.Any(sr =>
            {
                var se = sr.Where(kv => !string.IsNullOrWhiteSpace(kv.Value)).ToList();
                return se.Count == nonEmpty.Count &&
                       se.All(kv => row.TryGetValue(kv.Key, out var rv) && rv.Trim() == kv.Value.Trim());
            });
            if (matchesSeed) return false;
        }

        if (loc.suggestions.Count > 0 && nonEmpty.Count == 1)
        {
            var first = nonEmpty[0];
            string scol = def.suggestCol ?? loc.cols.FirstOrDefault()?.key ?? "";
            if (first.Key == scol && loc.suggestions.Any(s => string.Equals(s, first.Value.Trim(), StringComparison.OrdinalIgnoreCase)))
                return false;
        }
        return true;
    }

    public bool HasAnyContent =>
        State.f.Values.Any(v => !string.IsNullOrWhiteSpace(v)) ||
        State.lists.Any(kv => kv.Value.Any(r => IsRowUserEdited(kv.Key, r))) ||
        State.customTabs.Count > 0 || State.extra.Count > 0 || State.photos.Count > 0;

    public int CompletionPercent
    {
        get
        {
            int total = 0, got = 0;
            int Has(string id) => State.f.TryGetValue(id, out var v) && !string.IsNullOrWhiteSpace(v) ? 1 : 0;
            int ListFilled(string id) => State.lists.TryGetValue(id, out var rs) ? Math.Min(2, rs.Count(r => IsRowUserEdited(id, r))) : 0;

            foreach (var t in Data.TABS)
            {
                foreach (var b in t.blocks)
                {
                    if (b.type == "fields" && b.fields != null)
                        foreach (var f in b.fields) { total++; got += Has(f.id); }
                    else if (b.type == "list" && b.id != null)
                    { total += 2; got += ListFilled(b.id); }
                }
            }
            foreach (var items in State.extra.Values)
            {
                foreach (var x in items)
                {
                    if (x.type == "field") { total++; got += Has(x.id); }
                    else { total += 2; got += ListFilled(x.id); }
                }
            }
            foreach (var g in Data.GLANCE) { total++; got += Has(g.id); }
            foreach (var k in Data.KIDS) { total++; got += Has(k.id); }
            total++; got += Has("letter");
            return total > 0 ? (int)Math.Round(got * 100.0 / total) : 0;
        }
    }

    public void LoadDemo()
    {
        var src = Data.DEMO_FAMILIES.TryGetValue(State.region, out var d) ? d : Data.DEMO_FAMILIES["default"];
        var next = new GuideState
        {
            region = State.region,
            largeText = State.largeText,
            highContrast = State.highContrast,
            isDemo = true,
            track = src.track ?? "hurt",
            tab = "start",
            f = new Dictionary<string, string>(src.f ?? new()),
            lists = (src.lists ?? new()).ToDictionary(kv => kv.Key, kv => kv.Value.Select(r => new Dictionary<string, string>(r)).ToList()),
            customTabs = (src.customTabs ?? new()).Select(c => new CustomTab { id = c.id, label = c.label, title = c.title }).ToList(),
            extra = (src.extra ?? new()).ToDictionary(kv => kv.Key, kv => kv.Value.ToList())
        };
        if (src.f_extra_patch != null)
            foreach (var kv in src.f_extra_patch) next.f[kv.Key] = kv.Value;

        State = next;
        Normalize();
        Save(touch: false);
        StatusToast = "Sample family loaded";
    }

    public void ClearDemo()
    {
        State = new GuideState { region = State.region, largeText = State.largeText, highContrast = State.highContrast };
        Normalize();
        Save(touch: false);
        StatusToast = "Cleared sample — ready for your family";
    }

    public void AddCustomSection(string name)
    {
        string tid = "tab_" + Guid.NewGuid().ToString("N")[..8];
        State.customTabs.Add(new CustomTab { id = tid, label = name, title = name });
        State.tab = tid;
        Save();
    }

    public void ApplySectionTemplate(SectionTemplate tpl)
    {
        string tid = "tab_" + Guid.NewGuid().ToString("N")[..8];
        State.customTabs.Add(new CustomTab { id = tid, label = tpl.name, title = tpl.name });
        var items = new List<ExtraItem>();
        foreach (var f in tpl.fields)
            items.Add(new ExtraItem { type = "field", id = "x_" + Guid.NewGuid().ToString("N")[..8], label = f.label, wide = f.wide });
        foreach (var l in tpl.lists)
        {
            string lid = "l_" + Guid.NewGuid().ToString("N")[..8];
            var cols = l.cols.Select((c, i) => new ColDef("c" + i, c)).ToList();
            items.Add(new ExtraItem { type = "list", id = lid, title = l.title, cols = cols });
            State.lists[lid] = new List<Dictionary<string, string>> { new() };
        }
        State.extra[tid] = items;
        State.tab = tid;
        Save();
        StatusToast = $"Added \"{tpl.name}\"";
    }

    public List<AuditItem> ComputeAudit()
    {
        string F(string id) => State.f.TryGetValue(id, out var v) ? v.Trim() : "";
        List<Dictionary<string, string>> RowsOf(string id) =>
            State.lists.TryGetValue(id, out var rs) ? rs.Where(r => IsRowUserEdited(id, r)).ToList() : new();

        var items = new List<AuditItem>();
        var reg = CurrentRegion;

        var missCore = new[] { string.IsNullOrEmpty(F("q_first")) ? "First person to call" : null, string.IsNullOrEmpty(F("q_binder")) ? "Where papers live" : null }
            .Where(x => x != null).ToList();
        items.Add(missCore.Count > 0
            ? new AuditItem("start_core", AuditSeverity.high, "Start-here essentials incomplete", $"Missing: {string.Join(", ", missCore)}.", "start", "glance")
            : new AuditItem("start_core", AuditSeverity.ok, "First-call & paper locations set", "Your spouse knows who to call and where originals live."));

        if (string.IsNullOrEmpty(F("d_phone")))
            items.Add(new AuditItem("phone_2fa", AuditSeverity.high, "No phone unlock instructions", "Banks and email send 2FA codes to your phone—without unlock notes, your spouse can get locked out.", "docs", "Getting into things"));
        else if (string.IsNullOrEmpty(F("d_2fa")) && string.IsNullOrEmpty(F("d_sim")))
            items.Add(new AuditItem("phone_2fa", AuditSeverity.med, "Add 2FA recovery or carrier SIM PIN", "Phone unlock is noted, but 2FA recovery codes or SIM PIN instructions will prevent lockouts.", "docs", "Getting into things"));
        else
            items.Add(new AuditItem("phone_2fa", AuditSeverity.ok, "Phone & 2FA access documented", "Unlock and 2FA/SIM instructions are covered."));

        var accts = RowsOf("accounts");
        bool hasJoint = accts.Any(r => r.TryGetValue("own", out var own) && Regex.IsMatch(own, @"joint|both|shared|either|survivor|&|\band\b", RegexOptions.IgnoreCase));
        if (accts.Count == 0) items.Add(new AuditItem("joint_bank", AuditSeverity.med, "No bank accounts listed yet", "List checking/savings (last 4 digits) and mark which ones are Joint.", "money", "accounts"));
        else if (!hasJoint) items.Add(new AuditItem("joint_bank", AuditSeverity.high, "No bank account marked Joint", "Solo accounts often freeze upon death, stranding household bills until probate.", "money", "accounts"));
        else items.Add(new AuditItem("joint_bank", AuditSeverity.ok, "Joint bank access listed", "At least one account is marked joint/shared."));

        var invRows = RowsOf("invest");
        var lifeRows = RowsOf("insurance").Where(r => r.TryGetValue("type", out var t) && Regex.IsMatch(t, @"life|term", RegexOptions.IgnoreCase)).ToList();
        int missBenef = invRows.Count(r => !r.TryGetValue("benef", out var b) || string.IsNullOrWhiteSpace(b))
                      + lifeRows.Count(r => !r.TryGetValue("benef", out var b) || string.IsNullOrWhiteSpace(b));
        string indiaNote = reg.indiaNotes ? " In India, bank/demat nominees are custodians—ensure your will/legal heirs match." : "";
        if (missBenef > 0) items.Add(new AuditItem("beneficiaries", AuditSeverity.high, $"{missBenef} retirement/life-insurance entry missing a Beneficiary", "Named beneficiaries override your will—record who is named on each." + indiaNote, "money", "insurance"));
        else if (invRows.Count == 0 && lifeRows.Count == 0) items.Add(new AuditItem("beneficiaries", AuditSeverity.med, "No life insurance or retirement accounts listed", "Record policies and retirement accounts along with named beneficiaries." + indiaNote, "money", "insurance"));
        else items.Add(new AuditItem("beneficiaries", AuditSeverity.ok, "Beneficiaries recorded", "Listed life insurance & retirement entries name a beneficiary." + indiaNote));

        var cryptoRows = RowsOf("crypto");
        if (cryptoRows.Count > 0)
        {
            bool hasSeed = cryptoRows.Any(r => r.Values.Any(v => Regex.IsMatch(v, @"\b([a-z]{3,}\s+){11,}[a-z]{3,}\b", RegexOptions.IgnoreCase)));
            bool missCrypto = cryptoRows.Any(r => !r.TryGetValue("access", out var a) || string.IsNullOrWhiteSpace(a) || !r.TryGetValue("helper", out var h) || string.IsNullOrWhiteSpace(h));
            if (hasSeed) items.Add(new AuditItem("crypto_safety", AuditSeverity.high, "Possible crypto seed phrase detected!", "Never store 12/24-word recovery seeds in this guide—write ONLY where the physical backup lives.", "money", "crypto"));
            else if (missCrypto) items.Add(new AuditItem("crypto_safety", AuditSeverity.med, "Crypto entry missing recovery location or helper", "Record where the seed/hardware wallet is stored and a trusted helper.", "money", "crypto"));
            else items.Add(new AuditItem("crypto_safety", AuditSeverity.ok, "Crypto recovery map documented (no raw seeds)", "Holdings, storage locations, and trusted helper instructions are recorded."));
        }

        var govRows = RowsOf("gov_ids");
        if (govRows.Count > 0)
        {
            bool hasFullId = govRows.Any(r => r.Values.Any(v => Regex.IsMatch(v, @"\b\d{3}-\d{2}-\d{4}\b|\b\d{4}[\s-]\d{4}[\s-]\d{4}\b|\b\d{9,}\b")));
            items.Add(hasFullId
                ? new AuditItem("gov_id_privacy", AuditSeverity.high, "Possible full SSN / National ID detected!", "Safety rule: enter ONLY the last 4 digits and where the original card lives.", "docs", "gov_ids")
                : new AuditItem("gov_id_privacy", AuditSeverity.ok, "Key IDs mapped safely (last 4 only)", "Government IDs record only last 4 digits and physical locations."));
        }

        if (!string.IsNullOrEmpty(F("q_life")) || lifeRows.Count > 0)
        {
            bool hasPayout = new[] { F("m_payout_first"), F("m_payout_payoff"), F("m_payout_advisor"), F("m_payout_monthly") }.Any(x => !string.IsNullOrEmpty(x));
            items.Add(hasPayout
                ? new AuditItem("payout_plan", AuditSeverity.ok, "Survivor big-money instructions documented", "Plain-English instructions for handling insurance payouts are filled in.")
                : new AuditItem("payout_plan", AuditSeverity.med, "Add personal instructions for life insurance / big money", "Tell your spouse what to do first with payouts, which debts to leave alone, and who to trust.", "money", "My instructions for big money / insurance payouts"));
        }

        if (reg.crossBorder)
        {
            string blob = JsonSerializer.Serialize(State.f) + JsonSerializer.Serialize(RowsOf("doclocs")) + JsonSerializer.Serialize(State.customTabs);
            bool hasVisa = Regex.IsMatch(blob, @"i-797|i-140|h-1b|h-4|oci|visa|immig", RegexOptions.IgnoreCase);
            bool hasPro = RowsOf("pros").Any(r => Regex.IsMatch(string.Join(" ", r.Values), @"immig|visa|cross", RegexOptions.IgnoreCase));
            items.Add(hasVisa && hasPro
                ? new AuditItem("cross_border", AuditSeverity.ok, "Cross-border & visa readiness covered", "Visa papers, separate country planning, and immigration counsel are noted.")
                : new AuditItem("cross_border", AuditSeverity.high, "Cross-border / Visa readiness incomplete", "Record visa filings, immigration attorney, local temporary guardian, and separate wills.", "docs", "doclocs"));
        }

        if (HasAnyContent && State.lastBackup == null)
            items.Add(new AuditItem("backup_fresh", AuditSeverity.high, "No locked backup saved yet", "Export an AES-256-GCM locked backup file now.", act: "backup"));
        else
            items.Add(new AuditItem("backup_fresh", AuditSeverity.ok, "Locked backup status", State.lastBackup != null ? "Saved." : "Ready."));

        items.Add(State.lastDryRun == null
            ? new AuditItem("fire_drill", AuditSeverity.med, "Run a 10-minute Family Fire Drill", "Verify your spouse can unlock the guide and locate papers and phone access.")
            : new AuditItem("fire_drill", AuditSeverity.ok, "Family Fire Drill completed", "Completed."));

        return items.OrderBy(i => (int)i.sev).ToList();
    }

    public List<SearchHit> Search(string query)
    {
        string term = (query ?? "").Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(term)) return new();
        var hits = new List<SearchHit>();
        void Push(string tabId, string tabLbl, string title, string sub, string bk = "", string tk = "")
        {
            if (hits.Count < 20) hits.Add(new SearchHit(tabId, tabLbl, title, sub, bk, tk));
        }

        foreach (var rawG in Data.GLANCE)
        {
            var rf = LocalizedField(new FieldDef(rawG.id, rawG.label, rawG.placeholder));
            string v = State.f.TryGetValue(rf.id, out var fv) ? fv : "";
            if (rf.label.Contains(term, StringComparison.OrdinalIgnoreCase) || v.Contains(term, StringComparison.OrdinalIgnoreCase))
                Push("start", "Start here", rf.label, string.IsNullOrEmpty(v) ? "Quick glance" : v, "glance");
        }
        foreach (var t in Data.TABS)
        {
            foreach (var b in t.blocks)
            {
                if (b.type == "fields" && b.fields != null)
                {
                    foreach (var rawF in b.fields)
                    {
                        var rf = LocalizedField(rawF);
                        string v = State.f.TryGetValue(rf.id, out var fv) ? fv : "";
                        if (rf.label.Contains(term, StringComparison.OrdinalIgnoreCase) || v.Contains(term, StringComparison.OrdinalIgnoreCase) || (b.title ?? "").Contains(term, StringComparison.OrdinalIgnoreCase))
                            Push(t.id, t.label, rf.label, string.IsNullOrEmpty(v) ? (b.title ?? "") : v, b.StableId);
                    }
                }
                else if (b.type == "list" && b.id != null)
                {
                    var loc = LocalizedList(b);
                    var rows = State.lists.TryGetValue(b.id, out var rs) ? rs : new();
                    var mr = rows.FirstOrDefault(r => r.Values.Any(v => v.Contains(term, StringComparison.OrdinalIgnoreCase)));
                    var ms = loc.suggestions.FirstOrDefault(s => s.Contains(term, StringComparison.OrdinalIgnoreCase));
                    if ((b.title ?? "").Contains(term, StringComparison.OrdinalIgnoreCase) || mr != null || ms != null || (loc.hint ?? "").Contains(term, StringComparison.OrdinalIgnoreCase))
                    {
                        string sub = mr != null ? string.Join(" · ", mr.Values.Where(x => !string.IsNullOrWhiteSpace(x)))
                                   : ms != null ? $"Quick-add: {ms}" : (loc.hint ?? "Table");
                        Push(t.id, t.label, b.title ?? "Table", sub, b.id);
                    }
                }
            }
        }
        foreach (var g in Data.MONEY_GUIDE)
        {
            string txt = $"{g.title} {g.summary} {string.Join(" ", g.bullets)} {g.note}";
            if (txt.Contains(term, StringComparison.OrdinalIgnoreCase)) Push("money", "Money Guide", g.title, g.summary, "money_guide");
        }
        if (CurrentRegion.proFinder != null)
        {
            var pf = CurrentRegion.proFinder;
            var hit = new[] { pf.legal, pf.visa, pf.money, pf.tax }.FirstOrDefault(x => !string.IsNullOrEmpty(x) && x.Contains(term, StringComparison.OrdinalIgnoreCase));
            if (hit != null) Push("contacts", "Finding Help", $"Local directories ({CurrentRegion.label})", hit, "pro_finder");
        }
        foreach (var c in Data.PRO_FINDER)
        {
            string txt = $"{c.title} {c.summary} {string.Join(" ", c.bullets)} {c.note}";
            if (txt.Contains(term, StringComparison.OrdinalIgnoreCase)) Push("contacts", "Finding Help", c.title, c.summary, "pro_finder");
        }
        foreach (var kv in Data.PLAYBOOK)
        {
            foreach (var ph in kv.Value.phases)
            {
                foreach (var rawS in ph.steps)
                {
                    var s = LocalizedStep(rawS);
                    if (s.t.Contains(term, StringComparison.OrdinalIgnoreCase) || s.d.Contains(term, StringComparison.OrdinalIgnoreCase))
                        Push("start", "Playbook", s.t, s.d, "playbook", kv.Key);
                }
            }
        }
        foreach (var sc in Data.SCRIPTS)
            if (sc.title.Contains(term, StringComparison.OrdinalIgnoreCase) || sc.body.Contains(term, StringComparison.OrdinalIgnoreCase))
                Push("start", "Scripts", sc.title, sc.body, "scripts");

        return hits;
    }

    private static string RowSig(Dictionary<string, string> row) =>
        string.Join("|", row.Where(kv => !string.IsNullOrWhiteSpace(kv.Value))
            .OrderBy(kv => kv.Key, StringComparer.Ordinal)
            .Select(kv => $"{kv.Key}={kv.Value.Trim().ToLowerInvariant()}"));

    public string FieldLabel(string id, Dictionary<string, List<ExtraItem>>? extraFromInc = null)
    {
        if (id == "letter") return "A note to you";
        var g = Data.GLANCE.FirstOrDefault(x => x.id == id); if (g != null) return g.label;
        var k = Data.KIDS.FirstOrDefault(x => x.id == id); if (k != null) return k.label;
        foreach (var t in Data.TABS)
            foreach (var b in t.blocks)
                if (b.fields?.FirstOrDefault(x => x.id == id) is { } fd) return fd.label;
        var ex = State.extra.Values.SelectMany(x => x).Concat((extraFromInc ?? new()).Values.SelectMany(x => x)).FirstOrDefault(x => x.id == id);
        return ex?.label ?? id;
    }

    public MergePlan ComputeMergePlan(GuideState inc)
    {
        int newFields = 0;
        var conflicts = new List<MergeConflict>();
        foreach (var (id, val) in inc.f)
        {
            string iv = val.Trim();
            if (string.IsNullOrEmpty(iv)) continue;
            string cv = State.f.TryGetValue(id, out var curV) ? curV.Trim() : "";
            if (string.IsNullOrEmpty(cv)) newFields++;
            else if (cv != iv) conflicts.Add(new MergeConflict(id, FieldLabel(id, inc.extra)));
        }
        var curTabs = State.customTabs.Select(c => c.id).ToHashSet();
        int newTabs = inc.customTabs.Count(c => !curTabs.Contains(c.id));
        int newExtras = inc.extra.Sum(kv => kv.Value.Count(x => !(State.extra.TryGetValue(kv.Key, out var cur) ? cur : new()).Any(c => c.id == x.id)));
        int newRows = 0;
        foreach (var (lid, rows) in inc.lists)
        {
            var sigs = (State.lists.TryGetValue(lid, out var curRs) ? curRs : new()).Select(RowSig).Where(s => s.Length > 0).ToHashSet();
            foreach (var r in rows)
            {
                if (IsRowUserEdited(lid, r))
                {
                    string sig = RowSig(r);
                    if (sig.Length > 0 && sigs.Add(sig)) newRows++;
                }
            }
        }
        int newChecks = inc.checks.Count(kv => kv.Value && !(State.checks.TryGetValue(kv.Key, out var cv) && cv));
        return new MergePlan(newFields, conflicts, newTabs, newExtras, newRows, newChecks);
    }

    public string ApplyMerge(GuideState inc, bool overwriteConflicts)
    {
        int addedF = 0, updatedF = 0, addedR = 0, addedC = 0, addedS = 0;
        var curTabIds = State.customTabs.Select(c => c.id).ToHashSet();
        foreach (var t in inc.customTabs)
            if (curTabIds.Add(t.id)) { State.customTabs.Add(new CustomTab { id = t.id, label = t.label, title = t.title }); addedS++; }

        foreach (var (tid, arr) in inc.extra)
        {
            if (!State.extra.TryGetValue(tid, out var curArr)) State.extra[tid] = curArr = new();
            var exIds = curArr.Select(x => x.id).ToHashSet();
            foreach (var x in arr) if (exIds.Add(x.id)) curArr.Add(x);
        }
        foreach (var (id, val) in inc.f)
        {
            string iv = val.Trim();
            if (string.IsNullOrEmpty(iv)) continue;
            string cv = State.f.TryGetValue(id, out var curV) ? curV.Trim() : "";
            if (string.IsNullOrEmpty(cv)) { State.f[id] = val; addedF++; }
            else if (cv != iv && overwriteConflicts) { State.f[id] = val; updatedF++; }
        }
        foreach (var (lid, rows) in inc.lists)
        {
            if (!State.lists.TryGetValue(lid, out var curRows)) State.lists[lid] = curRows = new();
            var sigs = curRows.Select(RowSig).Where(s => s.Length > 0).ToHashSet();
            int addedHere = 0;
            foreach (var r in rows)
            {
                if (IsRowUserEdited(lid, r))
                {
                    string sig = RowSig(r);
                    if (sig.Length > 0 && sigs.Add(sig)) { curRows.Add(new Dictionary<string, string>(r)); addedR++; addedHere++; }
                }
            }
            if (addedHere > 0)
            {
                curRows.RemoveAll(r => r.Values.All(string.IsNullOrWhiteSpace));
                if (curRows.Count == 0) curRows.Add(new());
            }
        }
        foreach (var (k, v) in inc.checks)
            if (v && !(State.checks.TryGetValue(k, out var cv) && cv)) { State.checks[k] = true; addedC++; }

        Normalize();
        Save();
        var parts = new List<string>();
        if (addedF > 0) parts.Add($"+{addedF} fields");
        if (updatedF > 0) parts.Add($"{updatedF} updated");
        if (addedR > 0) parts.Add($"+{addedR} rows");
        if (addedS > 0) parts.Add($"+{addedS} sections");
        if (addedC > 0) parts.Add($"+{addedC} checks");
        string msg = parts.Count == 0 ? "Already up to date" : $"Merged ({string.Join(", ", parts)})";
        StatusToast = msg;
        return msg;
    }

    public string ExportErGrabSheetText()
    {
        string F(string id) => State.f.TryGetValue(id, out var v) ? v.Trim() : "";
        var lines = new List<string>
        {
            "1-PAGE ER & MEDICAL TREATMENT GRAB SHEET",
            $"Region: {CurrentRegion.label} | Emergency #: {CurrentRegion.emergency}",
            "=================================================="
        };
        if (!string.IsNullOrEmpty(F("h_triage"))) lines.Add($"24/7 SPECIALIST TRIAGE / ER: {F("h_triage")}");
        if (!string.IsNullOrEmpty(F("h_redflag"))) lines.Add($"RED-FLAG RULE: {F("h_redflag")}");
        if (!string.IsNullOrEmpty(F("h_diag"))) lines.Add($"Diagnosis / Protocol: {F("h_diag")}");
        if (!string.IsNullOrEmpty(F("h_devices"))) lines.Add($"Ports / Implants / Arm Limits: {F("h_devices")}");
        if (!string.IsNullOrEmpty(F("d_meds"))) lines.Add($"Daily Meds & Allergies: {F("d_meds")}");
        if (!string.IsNullOrEmpty(F("h_rescue"))) lines.Add($"Rescue Meds: {F("h_rescue")}");
        if (!string.IsNullOrEmpty(F("h_pharm"))) lines.Add($"Pharmacy: {F("h_pharm")}");
        if (!string.IsNullOrEmpty(F("d_mpoa"))) lines.Add($"Medical POA: {F("d_mpoa")}");
        if (!string.IsNullOrEmpty(F("h_portal"))) lines.Add($"Portal Proxy / HIPAA: {F("h_portal")}");
        if (!string.IsNullOrEmpty(F("d_ins"))) lines.Add($"Insurance: {F("d_ins")}");
        if (!string.IsNullOrEmpty(F("q_first"))) lines.Add($"Call First: {F("q_first")}");
        return string.Join(Environment.NewLine, lines);
    }

    public string ExportExecutiveSummaryText()
    {
        string F(string id) => State.f.TryGetValue(id, out var v) ? v.Trim() : "";
        List<Dictionary<string, string>> RowsOf(string id) =>
            State.lists.TryGetValue(id, out var rs) ? rs.Where(r => IsRowUserEdited(id, r)).ToList() : new();

        var lines = new List<string>
        {
            $"OUR FAMILY FIELD GUIDE — 1-PAGE SUMMARY ({CurrentRegion.label})",
            "=================================================="
        };
        if (!string.IsNullOrEmpty(F("q_first"))) lines.Add($"Call First: {F("q_first")}");
        if (!string.IsNullOrEmpty(F("q_binder"))) lines.Add($"Papers Location: {F("q_binder")}");
        if (!string.IsNullOrEmpty(F("q_life"))) lines.Add($"Total Life Insurance: {F("q_life")}");
        if (!string.IsNullOrEmpty(F("m_monthly"))) lines.Add($"Monthly Spending: {F("m_monthly")}");
        if (!string.IsNullOrEmpty(F("m_payout_first"))) lines.Add($"Payout First Step: {F("m_payout_first")}");

        var accts = RowsOf("accounts");
        if (accts.Count > 0)
        {
            lines.Add("\nBank Accounts:");
            foreach (var r in accts) lines.Add($" - {r.GetValueOrDefault("inst") ?? r.GetValueOrDefault("type")} ({r.GetValueOrDefault("own")}, *{r.GetValueOrDefault("last4")})");
        }
        var crypto = RowsOf("crypto");
        if (crypto.Count > 0)
        {
            lines.Add("\nCrypto / Digital:");
            foreach (var r in crypto) lines.Add($" - {r.GetValueOrDefault("platform")}: {r.GetValueOrDefault("access")}");
        }
        var ins = RowsOf("insurance");
        if (ins.Count > 0)
        {
            lines.Add("\nInsurance:");
            foreach (var r in ins) lines.Add($" - {r.GetValueOrDefault("type")}: {r.GetValueOrDefault("co")} {r.GetValueOrDefault("amt")} (Benef: {r.GetValueOrDefault("benef")})");
        }
        var ids = RowsOf("gov_ids");
        if (ids.Count > 0)
        {
            lines.Add("\nKey IDs (last 4 only):");
            foreach (var r in ids) lines.Add($" - {r.GetValueOrDefault("idtype")} *{r.GetValueOrDefault("last4")} ({r.GetValueOrDefault("where")})");
        }
        if (!string.IsNullOrEmpty(F("h_diag")) || !string.IsNullOrEmpty(F("h_triage")) || !string.IsNullOrEmpty(F("h_redflag")))
        {
            lines.Add("\nER / Active Illness Alert:");
            if (!string.IsNullOrEmpty(F("h_diag"))) lines.Add($" - Diagnosis: {F("h_diag")}");
            if (!string.IsNullOrEmpty(F("h_triage"))) lines.Add($" - Triage: {F("h_triage")}");
            if (!string.IsNullOrEmpty(F("h_redflag"))) lines.Add($" - Red-flag rule: {F("h_redflag")}");
        }
        return string.Join(Environment.NewLine, lines);
    }
}
