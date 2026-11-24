using System.Text.Json;
using FamilyGuide.Core;
using Xunit;

namespace FamilyGuide.Core.Tests;

public class FamilyGuideCoreTests
{
    private static GuideStore CreateTempStore()
    {
        string dir = Path.Combine(Path.GetTempPath(), "ffg-win-test-" + Guid.NewGuid().ToString("N"));
        return new GuideStore(dir);
    }

    [Fact]
    public void SchemaAndRegionsDecodeCleanly()
    {
        var store = CreateTempStore();
        Assert.Equal(6, store.Data.TABS.Count);
        Assert.Equal(7, store.Data.PLAYBOOK.Count);
        Assert.Equal(6, store.Data.MONEY_GUIDE.Count);
        Assert.Equal(5, store.Data.PRO_FINDER.Count);
        Assert.Equal(9, store.Data.REGIONS.Count);
        Assert.Equal(256, store.Data.DICE_WORDS.Count);
        Assert.NotNull(store.Data.REGIONS["us_in"].moneyGuide);
        Assert.NotNull(store.Data.REGIONS["in"].proFinder);
    }

    [Fact]
    public void AesGcmEncryptDecryptAndHtmlExtraction()
    {
        var store = CreateTempStore();
        store.State.f["q_first"] = "Priya Sharma · 206-555-0148";
        store.State.lists["crypto"] = new() { new() { ["platform"] = "Ledger", ["access"] = "Safe", ["helper"] = "Arjun" } };
        const string pw = "amber-cedar-lantern-orbit-river";

        var pkg = CryptoEngine.Encrypt(store.State, pw);
        var dec = CryptoEngine.Decrypt(pkg, pw);
        Assert.Equal("Priya Sharma · 206-555-0148", dec.f["q_first"]);
        Assert.ThrowsAny<Exception>(() => CryptoEngine.Decrypt(pkg, "wrong-passphrase"));

        string jsonStr = JsonSerializer.Serialize(pkg);
        string html = $"<!DOCTYPE html><html><body><script id=\"ffg-pkg\" type=\"application/json\">{jsonStr}</script></body></html>";
        var parsed = CryptoEngine.ParseBackupPayload(html);
        var fromHtml = CryptoEngine.Decrypt(parsed, pw);
        Assert.Equal("Priya Sharma · 206-555-0148", fromHtml.f["q_first"]);
    }

    [Fact]
    public void CrossPlatformShamir2of3InteropWithWebJs()
    {
        const string s1 = "FFG-1-39F9-5E0D-03F8-66D0-86D0-D9C2-0FA9-4188-E876-6689-C6CF-BF9E-BAB4-368E-BEAC-AF";
        const string s2 = "FFG-2-D15E-1AB5-909C-6914-BB18-3FE8-AAEA-3097-647A-7E7E-2613-C39C-F304-FABC-FDEC-D3";
        const string s3 = "FFG-3-89CA-26DD-E149-6CA1-59A9-9407-C922-1F6B-E97E-76DA-8FAE-1E6B-3D9D-BE5B-3525-0E";

        Assert.Equal("amber-cedar-lantern-orbit-river", CryptoEngine.SssCombine2of3(s1, s2));
        Assert.Equal("amber-cedar-lantern-orbit-river", CryptoEngine.SssCombine2of3(s2, s3));
        Assert.Equal("amber-cedar-lantern-orbit-river", CryptoEngine.SssCombine2of3(s1, s3));

        var shares = CryptoEngine.SssSplit2of3("banyan-copper-falcon-glacier-anchor");
        Assert.Equal(3, shares.Count);
        Assert.Equal("banyan-copper-falcon-glacier-anchor", CryptoEngine.SssCombine2of3(shares[0], shares[2]));
    }

    [Fact]
    public void ReadinessAuditsCatchSeedsAndFullIds()
    {
        var store = CreateTempStore();
        store.State.lists["crypto"] = new() { new() { ["platform"] = "Ledger", ["access"] = "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima" } };
        store.State.lists["gov_ids"] = new() { new() { ["who"] = "Me", ["idtype"] = "SSN", ["last4"] = "123-45-6789" } };

        var audit = store.ComputeAudit();
        Assert.Equal(AuditSeverity.high, audit.First(x => x.id == "crypto_safety").sev);
        Assert.Equal(AuditSeverity.high, audit.First(x => x.id == "gov_id_privacy").sev);

        store.State.lists["crypto"] = new() { new() { ["platform"] = "Ledger", ["access"] = "Safe drawer", ["helper"] = "Arjun" } };
        store.State.lists["gov_ids"] = new() { new() { ["who"] = "Me", ["idtype"] = "SSN", ["last4"] = "4812", ["where"] = "Safe" } };
        audit = store.ComputeAudit();
        Assert.Equal(AuditSeverity.ok, audit.First(x => x.id == "crypto_safety").sev);
        Assert.Equal(AuditSeverity.ok, audit.First(x => x.id == "gov_id_privacy").sev);
    }

    [Fact]
    public void SearchAndSmartMergeWork()
    {
        var store = CreateTempStore();
        store.State.region = "us_in";
        store.LoadDemo();
        Assert.NotEmpty(store.Search("$1M"));
        Assert.NotEmpty(store.Search("AILA"));

        store.State.region = "in";
        store.Normalize();
        Assert.NotEmpty(store.Search("NALSA"));

        var inc = new GuideState { f = new() { ["d_charity"] = "St. Jude" } };
        var plan = store.ComputeMergePlan(inc);
        Assert.Equal(1, plan.newFields);
        store.ApplyMerge(inc, overwriteConflicts: false);
        Assert.Equal("St. Jude", store.State.f["d_charity"]);
    }

    [Fact]
    public void CustomSectionTemplateAndDelete()
    {
        var store = CreateTempStore();
        Assert.Equal(8, store.Data.SECTION_TEMPLATES.Count);
        var tpl = store.Data.SECTION_TEMPLATES[0];
        store.ApplySectionTemplate(tpl);
        Assert.Single(store.State.customTabs);
        string tid = store.State.customTabs[0].id;
        Assert.Equal(tid, store.State.tab);
        Assert.NotEmpty(store.State.extra[tid]);

        store.DeleteCustomSection(tid);
        Assert.Empty(store.State.customTabs);
        Assert.Equal("start", store.State.tab);
    }

    [Fact]
    public void ExportsAndRegionLocalization()
    {
        var store = CreateTempStore();
        store.State.region = "in";
        store.Normalize();
        store.State.f["h_triage"] = "Apollo Oncology 24/7";
        store.State.f["h_redflag"] = "Fever >= 100.4F -> ER";
        store.State.f["q_first"] = "Meera (+91-98765-43210)";

        string er = store.ExportErGrabSheetText();
        Assert.Contains("Apollo Oncology 24/7", er);
        Assert.Contains("Fever >= 100.4F", er);
        Assert.Contains("112", er);

        string summary = store.ExportExecutiveSummaryText();
        Assert.Contains("Meera (+91-98765-43210)", summary);
        Assert.Contains("ER / Active Illness Alert", summary);
    }

    [Fact]
    public void AccessibilityAndReadModeStateRoundTrip()
    {
        string dir = Path.Combine(Path.GetTempPath(), "ffg-win-acc-" + Guid.NewGuid().ToString("N"));
        var store = new GuideStore(dir);
        store.State.readMode = true;
        store.State.largeText = true;
        store.State.highContrast = true;
        store.Save(touch: false);

        var reloaded = new GuideStore(dir);
        Assert.True(reloaded.State.readMode);
        Assert.True(reloaded.State.largeText);
        Assert.True(reloaded.State.highContrast);
    }
}
