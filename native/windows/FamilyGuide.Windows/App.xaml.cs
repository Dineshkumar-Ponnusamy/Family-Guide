using System;
using System.IO;
using System.Linq;
using System.Windows;
using FamilyGuide.Core;

namespace FamilyGuide.Windows;

public partial class App : System.Windows.Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        string? smokeOutPath = e.Args
            .FirstOrDefault(a => a.StartsWith("--smoke-test-out=", StringComparison.Ordinal))
            ?.Substring("--smoke-test-out=".Length);
        if (e.Args.Contains("--smoke-test") || smokeOutPath != null)
        {
            int code = RunSmokeTest(smokeOutPath);
            Shutdown(code);
            return;
        }
        base.OnStartup(e);
    }

    private static int RunSmokeTest(string? smokeOutPath)
    {
        string tmp = Path.Combine(Path.GetTempPath(), "ffg-win-smoke-" + Guid.NewGuid().ToString("N"));
        try
        {
            var store = new GuideStore(tmp);
            if (store.Data.TABS.Count != 6 || store.Data.REGIONS.Count != 9 || store.Data.PLAYBOOK.Count != 7)
                throw new InvalidOperationException("Unexpected schema counts.");

            store.LoadDemo();
            if (store.ComputeAudit().Count == 0)
                throw new InvalidOperationException("Readiness audit returned empty list.");

            const string pw = "amber-cedar-lantern-orbit-river";
            var pkg = CryptoEngine.Encrypt(store.State, pw);
            var decoded = CryptoEngine.Decrypt(pkg, pw);
            if (!decoded.isDemo)
                throw new InvalidOperationException("Decrypted demo flag mismatch.");

            const string v1 = "FFG-1-39F9-5E0D-03F8-66D0-86D0-D9C2-0FA9-4188-E876-6689-C6CF-BF9E-BAB4-368E-BEAC-AF";
            const string v2 = "FFG-2-D15E-1AB5-909C-6914-BB18-3FE8-AAEA-3097-647A-7E7E-2613-C39C-F304-FABC-FDEC-D3";
            if (CryptoEngine.SssCombine2of3(v1, v2) != pw)
                throw new InvalidOperationException("Shamir 2-of-3 cross-platform vector mismatch.");

            if (string.IsNullOrWhiteSpace(store.ExportExecutiveSummaryText()))
                throw new InvalidOperationException("Executive summary was empty.");

            const string okMsg = "WINDOWS_APP_SMOKE_TEST_PASSED";
            if (!string.IsNullOrWhiteSpace(smokeOutPath))
                File.WriteAllText(smokeOutPath, okMsg + Environment.NewLine);
            Console.WriteLine(okMsg);
            return 0;
        }
        catch (Exception ex)
        {
            string errMsg = "WINDOWS_APP_SMOKE_TEST_FAILED: " + ex;
            if (!string.IsNullOrWhiteSpace(smokeOutPath))
            {
                try { File.WriteAllText(smokeOutPath, errMsg + Environment.NewLine); } catch { }
            }
            Console.Error.WriteLine(errMsg);
            return 1;
        }
        finally
        {
            try { if (Directory.Exists(tmp)) Directory.Delete(tmp, true); } catch { }
        }
    }
}
