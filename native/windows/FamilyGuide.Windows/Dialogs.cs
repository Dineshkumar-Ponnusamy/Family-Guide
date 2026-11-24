using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using FamilyGuide.Core;
using Microsoft.Win32;

namespace FamilyGuide.Windows;

internal static class Dialogs
{
    public static void ShowTextSheet(string title, string text, Window owner)
    {
        var w = new Window { Title = title, Width = 640, Height = 560, Owner = owner, WindowStartupLocation = WindowStartupLocation.CenterOwner };
        var dp = new DockPanel { Margin = new Thickness(16) };
        var btns = new StackPanel { Orientation = Orientation.Horizontal, HorizontalAlignment = HorizontalAlignment.Right, Margin = new Thickness(0, 10, 0, 0) };
        var copy = new Button { Content = "Copy to Clipboard", Padding = new Thickness(10, 5, 10, 5), Margin = new Thickness(0, 0, 8, 0) };
        copy.Click += (_, _) => Clipboard.SetText(text);
        var close = new Button { Content = "Close", Padding = new Thickness(12, 5, 12, 5) };
        close.Click += (_, _) => w.Close();
        btns.Children.Add(copy); btns.Children.Add(close);
        DockPanel.SetDock(btns, Dock.Bottom);
        dp.Children.Add(btns);
        dp.Children.Add(new TextBox { Text = text, IsReadOnly = true, VerticalScrollBarVisibility = ScrollBarVisibility.Auto, FontFamily = new("Consolas"), TextWrapping = TextWrapping.Wrap });
        w.Content = dp;
        w.ShowDialog();
    }

    public static int ShowListPicker(string title, List<(string Title, string Sub)> items, Window owner)
    {
        int picked = -1;
        var w = new Window { Title = title, Width = 540, Height = 420, Owner = owner, WindowStartupLocation = WindowStartupLocation.CenterOwner };
        var lb = new ListBox { Margin = new Thickness(12) };
        foreach (var it in items) lb.Items.Add($"{it.Title}\n  {it.Sub}");
        lb.MouseDoubleClick += (_, _) => { picked = lb.SelectedIndex; w.Close(); };
        w.Content = lb;
        w.ShowDialog();
        return picked >= 0 ? picked : lb.SelectedIndex;
    }

    public static string? PromptText(string title, string prompt, string initial, bool isPassword, Window owner)
    {
        string? result = null;
        var w = new Window { Title = title, Width = 420, Height = 190, Owner = owner, WindowStartupLocation = WindowStartupLocation.CenterOwner };
        var sp = new StackPanel { Margin = new Thickness(16) };
        sp.Children.Add(new TextBlock { Text = prompt, TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 0, 0, 8) });
        Control input = isPassword ? new PasswordBox { Padding = new Thickness(5) } : new TextBox { Text = initial, Padding = new Thickness(5) };
        sp.Children.Add(input);
        var ok = new Button { Content = "OK", Padding = new Thickness(14, 5, 14, 5), Margin = new Thickness(0, 12, 0, 0), HorizontalAlignment = HorizontalAlignment.Right };
        ok.Click += (_, _) => { result = input is PasswordBox pb ? pb.Password : ((TextBox)input).Text; w.Close(); };
        sp.Children.Add(ok);
        w.Content = sp;
        w.ShowDialog();
        return result;
    }

    public static void ShowReadiness(GuideStore store, Window owner, Action<string?> onFix)
    {
        var w = new Window { Title = "Readiness & 10-Minute Family Fire Drill", Width = 620, Height = 560, Owner = owner, WindowStartupLocation = WindowStartupLocation.CenterOwner };
        var sp = new StackPanel { Margin = new Thickness(16) };
        foreach (var a in store.ComputeAudit())
        {
            var dp = new DockPanel { Margin = new Thickness(0, 4, 0, 4) };
            if (a.sev != AuditSeverity.ok && a.tab != null)
            {
                var fix = new Button { Content = "Fix →", Padding = new Thickness(8, 2, 8, 2) };
                string target = a.tab;
                fix.Click += (_, _) => { w.Close(); onFix(target); };
                DockPanel.SetDock(fix, Dock.Right);
                dp.Children.Add(fix);
            }
            dp.Children.Add(new TextBlock { Text = $"[{a.sev.ToString().ToUpperInvariant()}] {a.title} — {a.detail}", TextWrapping = TextWrapping.Wrap });
            sp.Children.Add(dp);
        }
        sp.Children.Add(new TextBlock { Text = "\n10-Minute Family Fire Drill", FontWeight = FontWeights.Bold, Margin = new Thickness(0, 8, 0, 4) });
        foreach (var fd in store.Data.FIRE_DRILL)
        {
            var cb = new CheckBox { Content = fd.t, IsChecked = store.State.fireDrill.TryGetValue(fd.id, out var v) && v, Margin = new Thickness(0, 2, 0, 2) };
            string id = fd.id;
            cb.Checked += (_, _) => { store.State.fireDrill[id] = true; store.Save(); };
            cb.Unchecked += (_, _) => { store.State.fireDrill[id] = false; store.Save(); };
            sp.Children.Add(cb);
        }
        w.Content = new ScrollViewer { Content = sp };
        w.ShowDialog();
    }

    public static bool ShowNewSection(GuideStore store, Window owner)
    {
        bool added = false;
        var w = new Window { Title = "Add Section or Template", Width = 520, Height = 460, Owner = owner, WindowStartupLocation = WindowStartupLocation.CenterOwner };
        var sp = new StackPanel { Margin = new Thickness(16) };
        var tb = new TextBox { Padding = new Thickness(6), Margin = new Thickness(0, 0, 0, 8) };
        var addBlank = new Button { Content = "Add Blank Section", Padding = new Thickness(10, 4, 10, 4), Margin = new Thickness(0, 0, 0, 12) };
        addBlank.Click += (_, _) => { if (!string.IsNullOrWhiteSpace(tb.Text)) { store.AddCustomSection(tb.Text.Trim()); added = true; w.Close(); } };
        sp.Children.Add(new TextBlock { Text = "Custom Section Name:" });
        sp.Children.Add(tb); sp.Children.Add(addBlank);
        sp.Children.Add(new TextBlock { Text = "Or Start From a Template:", FontWeight = FontWeights.Bold, Margin = new Thickness(0, 4, 0, 6) });
        foreach (var tpl in store.Data.SECTION_TEMPLATES)
        {
            var btn = new Button { Content = $"{tpl.name} — {tpl.desc}", HorizontalContentAlignment = HorizontalAlignment.Left, Padding = new Thickness(8, 5, 8, 5), Margin = new Thickness(0, 2, 0, 2) };
            var pick = tpl;
            btn.Click += (_, _) => { store.ApplySectionTemplate(pick); added = true; w.Close(); };
            sp.Children.Add(btn);
        }
        w.Content = new ScrollViewer { Content = sp };
        w.ShowDialog();
        return added;
    }

    public static void ShowBackup(GuideStore store, Window owner)
    {
        var w = new Window { Title = "Save Locked Backup (.json)", Width = 500, Height = 380, Owner = owner, WindowStartupLocation = WindowStartupLocation.CenterOwner };
        var sp = new StackPanel { Margin = new Thickness(16) };
        var p1 = new TextBox { Padding = new Thickness(5), Margin = new Thickness(0, 2, 0, 6) };
        var p2 = new TextBox { Padding = new Thickness(5), Margin = new Thickness(0, 2, 0, 6) };
        var gen = new Button { Content = "Generate 5-Word Diceware Passphrase", Margin = new Thickness(0, 0, 0, 8) };
        gen.Click += (_, _) => { string pw = CryptoEngine.GeneratePassphrase(5, store.Data.DICE_WORDS); p1.Text = pw; p2.Text = pw; };
        var mkCards = new CheckBox { Content = "Also generate 2-of-3 Shamir Split Recovery Cards", Margin = new Thickness(0, 0, 0, 8) };
        var outCards = new TextBox { IsReadOnly = true, AcceptsReturn = true, Height = 90, FontFamily = new("Consolas"), Margin = new Thickness(0, 6, 0, 0) };
        var go = new Button { Content = "Encrypt & Save Backup File", Padding = new Thickness(12, 6, 12, 6) };
        go.Click += (_, _) =>
        {
            if (p1.Text.Length < 8 || p1.Text != p2.Text) { MessageBox.Show("Use matching passphrases of at least 8 characters."); return; }
            string now = DateTime.UtcNow.ToString("O");
            store.State.lastBackup = now;
            store.State.updated ??= now;
            var pkg = CryptoEngine.Encrypt(store.State, p1.Text);
            if (mkCards.IsChecked == true) outCards.Text = string.Join("\n", CryptoEngine.SssSplit2of3(p1.Text));
            store.Save(touch: false);
            var sfd = new SaveFileDialog { Filter = "JSON Backup (*.json)|*.json", FileName = $"family-field-guide-{now[..10]}.json" };
            if (sfd.ShowDialog() == true)
            {
                File.WriteAllText(sfd.FileName, JsonSerializer.Serialize(pkg));
                MessageBox.Show("Encrypted backup saved.", "Success");
            }
        };
        sp.Children.Add(new TextBlock { Text = "Passphrase (min 8 chars):" }); sp.Children.Add(p1);
        sp.Children.Add(new TextBlock { Text = "Confirm Passphrase:" }); sp.Children.Add(p2);
        sp.Children.Add(gen); sp.Children.Add(mkCards); sp.Children.Add(go); sp.Children.Add(outCards);
        w.Content = sp;
        w.ShowDialog();
    }

    public static bool ShowRestore(GuideStore store, Window owner)
    {
        bool changed = false;
        var ofd = new OpenFileDialog { Filter = "Guide Backups (*.json;*.html)|*.json;*.html|All Files (*.*)|*.*" };
        if (ofd.ShowDialog() != true) return false;
        EncryptedBackupPackage pkg;
        try { pkg = CryptoEngine.ParseBackupPayload(File.ReadAllText(ofd.FileName)); }
        catch (Exception ex) { MessageBox.Show(ex.Message, "Invalid Backup"); return false; }

        string? pw = PromptText("Unlock Backup", "Enter backup passphrase (or leave blank to enter 2 recovery cards on next prompts):", "", isPassword: true, owner: owner);
        if (string.IsNullOrEmpty(pw))
        {
            string? c1 = PromptText("Recovery Card 1", "Enter Card A (FFG-1-...):", "", false, owner);
            string? c2 = PromptText("Recovery Card 2", "Enter Card B (FFG-2-...):", "", false, owner);
            if (string.IsNullOrEmpty(c1) || string.IsNullOrEmpty(c2)) return false;
            try { pw = CryptoEngine.SssCombine2of3(c1, c2); }
            catch (Exception ex) { MessageBox.Show(ex.Message, "Error"); return false; }
        }

        GuideState inc;
        try { inc = CryptoEngine.Decrypt(pkg, pw); }
        catch { MessageBox.Show("Wrong passphrase or recovery cards.", "Unlock Failed"); return false; }

        if (!store.HasAnyContent)
        {
            store.State = inc; store.Normalize(); store.Save(touch: false);
            return true;
        }
        var plan = store.ComputeMergePlan(inc);
        var res = MessageBox.Show($"Smart Merge ready:\n+{plan.newFields} fields, +{plan.newRows} rows, +{plan.newTabs} sections, {plan.conflictFields.Count} conflicts.\n\nClick YES to Smart Merge (keep local edits), NO to Replace all on device, CANCEL to abort.", "Backup Unlocked", MessageBoxButton.YesNoCancel);
        if (res == MessageBoxResult.Yes) { store.ApplyMerge(inc, overwriteConflicts: false); changed = true; }
        else if (res == MessageBoxResult.No) { store.State = inc; store.Normalize(); store.Save(touch: false); changed = true; }
        return changed;
    }
}
