using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using FamilyGuide.Core;

namespace FamilyGuide.Windows;

public partial class MainWindow : Window
{
    private readonly GuideStore _store = new();
    private string? _sessionLockPassphrase;
    private bool _suppressNavEvents;

    private static readonly string[] RegionOrder = { "us", "us_in", "in", "visa_intl", "uk", "ca", "au", "eu", "generic" };
    private static readonly string[] PlaybookOrder = { "hurt", "illness", "gone", "windfall", "money", "caregiver", "visa" };

    private static Brush Br(string key) => (Brush)Application.Current.Resources[key];
    private static FontFamily Serif => (FontFamily)Application.Current.Resources["SerifFont"];
    private static FontFamily Mono => (FontFamily)Application.Current.Resources["MonoFont"];
    private double Scale(double size) => _store.State.largeText ? size * 1.15 : size;

    public MainWindow()
    {
        InitializeComponent();
        BuildRegionList();
        ApplyThemeAppearance();
        RebuildSidebar();
        RenderActiveTab();
    }

    private void ApplyThemeAppearance()
    {
        bool hc = _store.State.highContrast;
        Background = hc ? Brushes.White : Br("PaperBrush");
        SidebarBorder.Background = hc ? Brushes.White : Br("Paper2Brush");
        TopBarBorder.Background = hc ? Brushes.White : Br("CardBrush");
        MainScroll.SetValue(TextElement.FontSizeProperty, Scale(14));
    }

    private void BuildRegionList()
    {
        _suppressNavEvents = true;
        RegionCombo.Items.Clear();
        foreach (var key in RegionOrder)
        {
            if (_store.Data.REGIONS.TryGetValue(key, out var preset))
                RegionCombo.Items.Add(new ComboBoxItem { Tag = key, Content = preset.label });
        }
        foreach (ComboBoxItem item in RegionCombo.Items)
        {
            if ((string)item.Tag == _store.State.region)
            {
                RegionCombo.SelectedItem = item;
                break;
            }
        }
        ReadModeToggle.IsChecked = _store.State.readMode;
        LargeTextToggle.IsChecked = _store.State.largeText;
        ContrastToggle.IsChecked = _store.State.highContrast;
        _suppressNavEvents = false;
    }

    private void RebuildSidebar()
    {
        _suppressNavEvents = true;
        TabList.Items.Clear();
        foreach (var t in _store.Data.TABS)
            TabList.Items.Add(new ListBoxItem { Tag = t.id, Content = t.label, Padding = new Thickness(8, 6, 8, 6) });
        foreach (var c in _store.State.customTabs)
            TabList.Items.Add(new ListBoxItem { Tag = c.id, Content = "• " + c.label, Padding = new Thickness(8, 6, 8, 6) });
        foreach (ListBoxItem item in TabList.Items)
        {
            if ((string)item.Tag == _store.State.tab)
            {
                TabList.SelectedItem = item;
                break;
            }
        }
        UpdateMeter();
        _suppressNavEvents = false;
    }

    private void UpdateMeter()
    {
        int pct = _store.CompletionPercent;
        PctText.Text = $"{pct}% filled";
        PctBar.Value = pct;
    }

    private void RenderActiveTab()
    {
        ContentHost.Children.Clear();
        AddReadModeBanner();
        AddDemoBanner();

        var stdTab = _store.Data.TABS.FirstOrDefault(t => t.id == _store.State.tab);
        if (stdTab != null)
        {
            ContentHost.Children.Add(new TextBlock
            {
                Text = stdTab.title,
                FontFamily = Serif,
                FontSize = Scale(26),
                FontWeight = FontWeights.Bold,
                Foreground = Br("InkBrush"),
                Margin = new Thickness(0, 0, 0, 4)
            });
            ContentHost.Children.Add(new TextBlock
            {
                Text = stdTab.lede,
                FontSize = Scale(14),
                Foreground = Br("Ink2Brush"),
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(0, 0, 0, 14)
            });
            foreach (var b in stdTab.blocks) RenderBlock(b);
            RenderExtras(stdTab.id, "More details");
        }
        else if (_store.State.customTabs.FirstOrDefault(c => c.id == _store.State.tab) is { } ct)
        {
            var hdrBar = new DockPanel { Margin = new Thickness(0, 0, 0, 14) };
            if (!_store.State.readMode)
            {
                var delBtn = new Button
                {
                    Content = "Delete section",
                    Padding = new Thickness(10, 4, 10, 4),
                    Foreground = Br("TomatoBrush")
                };
                string delId = ct.id;
                delBtn.Click += (_, _) => { _store.DeleteCustomSection(delId); RebuildSidebar(); RenderActiveTab(); };
                DockPanel.SetDock(delBtn, Dock.Right);
                hdrBar.Children.Add(delBtn);
            }
            hdrBar.Children.Add(new TextBlock
            {
                Text = ct.title,
                FontFamily = Serif,
                FontSize = Scale(26),
                FontWeight = FontWeights.Bold,
                Foreground = Br("InkBrush")
            });
            ContentHost.Children.Add(hdrBar);
            RenderExtras(ct.id, "Details");
        }
        UpdateMeter();
    }

    private void AddReadModeBanner()
    {
        if (!_store.State.readMode) return;
        var bar = new Border
        {
            Background = Br("InfoBgBrush"),
            BorderBrush = Br("SkyBrush"),
            BorderThickness = new Thickness(4, 0, 0, 0),
            CornerRadius = new CornerRadius(4),
            Padding = new Thickness(12),
            Margin = new Thickness(0, 0, 0, 12)
        };
        var sp = new DockPanel();
        var btn = new Button { Content = "Back to Edit Mode", Padding = new Thickness(10, 4, 10, 4) };
        btn.Click += (_, _) => { _store.State.readMode = false; ReadModeToggle.IsChecked = false; _store.Save(touch: false); RenderActiveTab(); };
        DockPanel.SetDock(btn, Dock.Right);
        sp.Children.Add(btn);
        sp.Children.Add(new TextBlock { Text = "Read Mode — showing only filled-in answers so nothing gets edited by accident.", VerticalAlignment = VerticalAlignment.Center });
        bar.Child = sp;
        ContentHost.Children.Add(bar);
    }

    private void AddDemoBanner()
    {
        if (_store.State.isDemo)
        {
            var bar = new Border { Background = Br("DemoActiveBgBrush"), BorderBrush = Br("TomatoBrush"), BorderThickness = new Thickness(4, 0, 0, 0), CornerRadius = new CornerRadius(4), Padding = new Thickness(12), Margin = new Thickness(0, 0, 0, 12) };
            var sp = new DockPanel();
            var btn = new Button { Content = "Clear sample & start my guide", Padding = new Thickness(10, 4, 10, 4) };
            btn.Click += (_, _) => { _store.ClearDemo(); RebuildSidebar(); RenderActiveTab(); };
            DockPanel.SetDock(btn, Dock.Right);
            sp.Children.Add(btn);
            sp.Children.Add(new TextBlock { Text = $"Sample family ({_store.CurrentRegion.label}) — explore freely.", VerticalAlignment = VerticalAlignment.Center });
            bar.Child = sp;
            ContentHost.Children.Add(bar);
        }
        else if (!_store.HasAnyContent && !_store.State.readMode && !_store.State.dismissDemo)
        {
            var bar = new Border { Background = Br("DemoIdleBgBrush"), BorderBrush = Br("OkGreenBrush"), BorderThickness = new Thickness(4, 0, 0, 0), CornerRadius = new CornerRadius(4), Padding = new Thickness(12), Margin = new Thickness(0, 0, 0, 12) };
            var sp = new DockPanel();
            var btn = new Button { Content = "Load sample family", Padding = new Thickness(10, 4, 10, 4) };
            btn.Click += (_, _) => { _store.LoadDemo(); RebuildSidebar(); RenderActiveTab(); };
            DockPanel.SetDock(btn, Dock.Right);
            sp.Children.Add(btn);
            sp.Children.Add(new TextBlock { Text = "New here? Preview how the guide looks filled out (US + India H-1B or Standard).", VerticalAlignment = VerticalAlignment.Center });
            bar.Child = sp;
            ContentHost.Children.Add(bar);
        }
    }

    private Border MakeCard(bool dark = false) => new()
    {
        Background = dark ? Br("InkBrush") : (_store.State.highContrast ? Brushes.White : Br("CardBrush")),
        BorderBrush = dark ? Br("TomatoBrush") : (_store.State.highContrast ? Brushes.Black : Br("RuleBrush")),
        BorderThickness = new Thickness(dark || _store.State.highContrast ? 2 : 1),
        CornerRadius = new CornerRadius(6),
        Padding = new Thickness(16),
        Margin = new Thickness(0, 0, 0, 14)
    };

    private void RenderBlock(BlockDef b)
    {
        switch (b.type)
        {
            case "glance":
            {
                var card = MakeCard(dark: true);
                var sp = new StackPanel();
                sp.Children.Add(new TextBlock { Text = "If you read nothing else", FontFamily = Serif, FontSize = 18, FontWeight = FontWeights.Bold, Foreground = Br("PaperBrush"), Margin = new Thickness(0, 0, 0, 8) });
                foreach (var g in _store.Data.GLANCE)
                {
                    var rf = _store.LocalizedField(new FieldDef(g.id, g.label, g.placeholder));
                    string val = _store.State.f.TryGetValue(rf.id, out var v) ? v : "";
                    if (_store.State.readMode && string.IsNullOrWhiteSpace(val)) continue;
                    sp.Children.Add(new TextBlock { Text = rf.label.ToUpperInvariant(), FontSize = 10, FontWeight = FontWeights.Bold, Foreground = Br("Paper2Brush") });
                    if (_store.State.readMode)
                    {
                        sp.Children.Add(new TextBox { Text = val, IsReadOnly = true, BorderThickness = new Thickness(0), Background = Brushes.Transparent, Foreground = Br("PaperBrush"), Margin = new Thickness(0, 2, 0, 8) });
                    }
                    else
                    {
                        var tb = new TextBox { Text = val, Padding = new Thickness(6, 4, 6, 4), Margin = new Thickness(0, 2, 0, 8) };
                        tb.TextChanged += (_, _) => { _store.State.f[rf.id] = tb.Text; _store.Save(); UpdateMeter(); };
                        sp.Children.Add(tb);
                    }
                }
                card.Child = sp;
                ContentHost.Children.Add(card);
                break;
            }
            case "playbook":
            {
                var card = MakeCard();
                var sp = new StackPanel();
                sp.Children.Add(new TextBlock { Text = "What's happening?", FontFamily = Serif, FontSize = 18, FontWeight = FontWeights.Bold, Foreground = Br("InkBrush"), Margin = new Thickness(0, 0, 0, 8) });
                var wp = new WrapPanel { Margin = new Thickness(0, 0, 0, 10) };
                foreach (var key in PlaybookOrder)
                {
                    if (!_store.Data.PLAYBOOK.TryGetValue(key, out var trackVal)) continue;
                    bool on = key == _store.State.track;
                    var btn = new Button
                    {
                        Content = trackVal.label,
                        Padding = new Thickness(10, 5, 10, 5),
                        Margin = new Thickness(0, 0, 6, 6),
                        Background = on ? Br("TomatoBrush") : Br("Paper2Brush"),
                        Foreground = on ? Brushes.White : Br("InkBrush")
                    };
                    string picked = key;
                    btn.Click += (_, _) => { _store.State.track = picked; _store.Save(touch: false); RenderActiveTab(); };
                    wp.Children.Add(btn);
                }
                sp.Children.Add(wp);

                if (_store.Data.PLAYBOOK.TryGetValue(_store.State.track, out var pb))
                {
                    foreach (var ph in pb.phases)
                    {
                        sp.Children.Add(new TextBlock { Text = ph.whenLabel, FontFamily = Serif, FontStyle = FontStyles.Italic, FontSize = 17, Foreground = Br("TomatoBrush"), Margin = new Thickness(0, 8, 0, 4) });
                        foreach (var rawS in ph.steps)
                        {
                            var s = _store.LocalizedStep(rawS);
                            bool chk = _store.State.checks.TryGetValue(s.id, out var c) && c;
                            var cb = new CheckBox { IsChecked = chk, Margin = new Thickness(0, 4, 0, 4) };
                            var row = new StackPanel();
                            row.Children.Add(new TextBlock { Text = s.t, FontWeight = FontWeights.SemiBold, TextWrapping = TextWrapping.Wrap });
                            row.Children.Add(new TextBlock { Text = s.d, Foreground = Br("Ink2Brush"), FontSize = 13, TextWrapping = TextWrapping.Wrap });
                            if (!string.IsNullOrEmpty(s.@ref) && !string.IsNullOrEmpty(s.refTab))
                            {
                                var jump = new Button { Content = $"↳ {s.@ref}", Background = Brushes.Transparent, BorderThickness = new Thickness(0), Foreground = Br("SkyBrush"), HorizontalAlignment = HorizontalAlignment.Left, Padding = new Thickness(0, 2, 0, 0) };
                                string rt = s.refTab;
                                jump.Click += (_, _) => { _store.State.tab = rt; _store.Save(touch: false); RebuildSidebar(); RenderActiveTab(); };
                                row.Children.Add(jump);
                            }
                            cb.Content = row;
                            string sid = s.id;
                            cb.Checked += (_, _) => { _store.State.checks[sid] = true; _store.Save(); };
                            cb.Unchecked += (_, _) => { _store.State.checks[sid] = false; _store.Save(); };
                            sp.Children.Add(cb);
                        }
                    }
                }
                card.Child = sp;
                ContentHost.Children.Add(card);
                break;
            }
            case "fields":
            {
                var fields = (b.fields ?? new()).Select(f => _store.LocalizedField(f)).ToList();
                var visible = _store.State.readMode
                    ? fields.Where(f => _store.State.f.TryGetValue(f.id, out var v) && !string.IsNullOrWhiteSpace(v)).ToList()
                    : fields;
                if (visible.Count == 0) return;

                var card = MakeCard();
                var sp = new StackPanel();
                sp.Children.Add(new TextBlock { Text = b.title ?? "", FontFamily = Serif, FontSize = 18, FontWeight = FontWeights.Bold, Foreground = Br("InkBrush") });
                if (!string.IsNullOrEmpty(b.hint))
                    sp.Children.Add(new TextBlock { Text = b.hint, FontSize = 12, Foreground = Br("Ink2Brush"), TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 2, 0, 8) });
                foreach (var rf in visible)
                {
                    string val = _store.State.f.TryGetValue(rf.id, out var v) ? v : "";
                    sp.Children.Add(new TextBlock { Text = rf.label.ToUpperInvariant(), FontSize = 10, FontWeight = FontWeights.Bold, Foreground = Br("Ink2Brush"), Margin = new Thickness(0, 6, 0, 2) });
                    var tb = new TextBox
                    {
                        Text = val,
                        IsReadOnly = _store.State.readMode,
                        AcceptsReturn = rf.wide,
                        TextWrapping = rf.wide ? TextWrapping.Wrap : TextWrapping.NoWrap,
                        MinHeight = rf.wide ? 54 : 26,
                        Padding = new Thickness(6, 4, 6, 4)
                    };
                    if (!_store.State.readMode)
                        tb.TextChanged += (_, _) => { _store.State.f[rf.id] = tb.Text; _store.Save(); UpdateMeter(); };
                    sp.Children.Add(tb);
                }
                card.Child = sp;
                ContentHost.Children.Add(card);
                break;
            }
            case "list":
            {
                if (b.id == null) return;
                string bid = b.id;
                var loc = _store.LocalizedList(b);
                bool editable = !_store.State.readMode || (b.crisisEditable == true);
                var rows = _store.State.lists.TryGetValue(bid, out var rs) ? rs : new();
                var filledIdx = rows.Select((r, i) => (r, i)).Where(x => _store.IsRowUserEdited(bid, x.r)).Select(x => x.i).ToList();
                if (!editable && filledIdx.Count == 0) return;

                var card = MakeCard();
                var sp = new StackPanel();
                sp.Children.Add(new TextBlock { Text = b.title ?? "", FontFamily = Serif, FontSize = 18, FontWeight = FontWeights.Bold, Foreground = Br("InkBrush") });
                if (!string.IsNullOrEmpty(loc.hint))
                    sp.Children.Add(new TextBlock { Text = loc.hint, FontSize = 12, Foreground = Br("Ink2Brush"), TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 2, 0, 8) });

                var indices = editable ? Enumerable.Range(0, rows.Count).ToList() : filledIdx;
                foreach (int idx in indices)
                {
                    var rowBox = new Border { Background = Br("PaperBrush"), BorderBrush = Br("RuleBrush"), BorderThickness = new Thickness(1), Padding = new Thickness(10), Margin = new Thickness(0, 4, 0, 4) };
                    var rowSp = new StackPanel();
                    if (editable)
                    {
                        var del = new Button { Content = "✕", HorizontalAlignment = HorizontalAlignment.Right, Background = Brushes.Transparent, BorderThickness = new Thickness(0), Foreground = Br("TomatoBrush") };
                        int delIdx = idx;
                        del.Click += (_, _) => { rows.RemoveAt(delIdx); if (rows.Count == 0 && b.crisisEditable == true) rows.Add(new()); _store.Save(); RenderActiveTab(); };
                        rowSp.Children.Add(del);
                    }
                    foreach (var col in loc.cols)
                    {
                        string val = rows[idx].TryGetValue(col.key, out var cv) ? cv : "";
                        if (!editable && string.IsNullOrWhiteSpace(val)) continue;
                        rowSp.Children.Add(new TextBlock { Text = col.label.ToUpperInvariant(), FontSize = 10, FontWeight = FontWeights.Bold, Foreground = Br("Ink2Brush") });
                        var tb = new TextBox { Text = val, IsReadOnly = !editable, Padding = new Thickness(6, 3, 6, 3), Margin = new Thickness(0, 1, 0, 5) };
                        if (editable)
                        {
                            int rIdx = idx; string cKey = col.key;
                            tb.TextChanged += (_, _) => { if (rIdx < rows.Count) { rows[rIdx][cKey] = tb.Text; _store.Save(); UpdateMeter(); } };
                        }
                        rowSp.Children.Add(tb);
                    }
                    rowBox.Child = rowSp;
                    sp.Children.Add(rowBox);
                }

                if (editable)
                {
                    var addBtn = new Button { Content = "+ Add a row", Padding = new Thickness(10, 4, 10, 4), Margin = new Thickness(0, 6, 0, 4), HorizontalAlignment = HorizontalAlignment.Left };
                    addBtn.Click += (_, _) => { rows.Add(new()); _store.Save(); RenderActiveTab(); };
                    sp.Children.Add(addBtn);

                    if (loc.suggestions.Count > 0 && !_store.State.readMode)
                    {
                        var qw = new WrapPanel { Margin = new Thickness(0, 4, 0, 0) };
                        string scol = b.suggestCol ?? loc.cols.FirstOrDefault()?.key ?? "";
                        foreach (var lbl in loc.suggestions)
                        {
                            var qbtn = new Button { Content = "+ " + lbl, FontSize = 11, Padding = new Thickness(8, 2, 8, 2), Margin = new Thickness(0, 0, 5, 5) };
                            string pick = lbl;
                            qbtn.Click += (_, _) => { rows.Add(new Dictionary<string, string> { [scol] = pick }); _store.Save(); RenderActiveTab(); };
                            qw.Children.Add(qbtn);
                        }
                        sp.Children.Add(qw);
                    }
                }
                card.Child = sp;
                ContentHost.Children.Add(card);
                break;
            }
            case "money_guide":
            {
                var card = MakeCard();
                var sp = new StackPanel();
                sp.Children.Add(new TextBlock { Text = b.title ?? "Beginner's guide: handling big money", FontFamily = Serif, FontSize = 18, FontWeight = FontWeights.Bold, Foreground = Br("InkBrush"), Margin = new Thickness(0, 0, 0, 8) });
                if (_store.CurrentRegion.moneyGuide is { } mg)
                {
                    var banner = new Border { Background = Br("WarnBgBrush"), Padding = new Thickness(10), Margin = new Thickness(0, 0, 0, 8) };
                    var bsp = new StackPanel();
                    if (!string.IsNullOrEmpty(mg.depositCap)) bsp.Children.Add(new TextBlock { Text = $"Deposit Cap ({_store.CurrentRegion.label}): {mg.depositCap}", TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 0, 0, 3) });
                    if (!string.IsNullOrEmpty(mg.fiduciaryName)) bsp.Children.Add(new TextBlock { Text = $"Who to Hire: {mg.fiduciaryName}", TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 0, 0, 3) });
                    if (!string.IsNullOrEmpty(mg.taxNote)) bsp.Children.Add(new TextBlock { Text = $"Tax Note: {mg.taxNote}", TextWrapping = TextWrapping.Wrap });
                    banner.Child = bsp;
                    sp.Children.Add(banner);
                }
                foreach (var c in _store.Data.MONEY_GUIDE) AddGuideCard(sp, c);
                card.Child = sp;
                ContentHost.Children.Add(card);
                break;
            }
            case "pro_finder":
            {
                var card = MakeCard();
                var sp = new StackPanel();
                sp.Children.Add(new TextBlock { Text = b.title ?? "How to find vetted & low-cost help", FontFamily = Serif, FontSize = 18, FontWeight = FontWeights.Bold, Foreground = Br("InkBrush"), Margin = new Thickness(0, 0, 0, 8) });
                if (_store.CurrentRegion.proFinder is { } pf)
                {
                    var banner = new Border { Background = Br("WarnBgBrush"), Padding = new Thickness(10), Margin = new Thickness(0, 0, 0, 8) };
                    var bsp = new StackPanel();
                    if (!string.IsNullOrEmpty(pf.legal)) bsp.Children.Add(new TextBlock { Text = $"Legal / Estate: {pf.legal}", TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 0, 0, 2) });
                    if (!string.IsNullOrEmpty(pf.visa)) bsp.Children.Add(new TextBlock { Text = $"Immigration / Visa: {pf.visa}", TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 0, 0, 2) });
                    if (!string.IsNullOrEmpty(pf.money)) bsp.Children.Add(new TextBlock { Text = $"Financial Advisor: {pf.money}", TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 0, 0, 2) });
                    if (!string.IsNullOrEmpty(pf.tax)) bsp.Children.Add(new TextBlock { Text = $"Taxes & Free Aid: {pf.tax}", TextWrapping = TextWrapping.Wrap });
                    banner.Child = bsp;
                    sp.Children.Add(banner);
                }
                foreach (var c in _store.Data.PRO_FINDER) AddGuideCard(sp, c);
                card.Child = sp;
                ContentHost.Children.Add(card);
                break;
            }
            case "scripts":
            {
                var card = MakeCard();
                var sp = new StackPanel();
                sp.Children.Add(new TextBlock { Text = "What to say", FontFamily = Serif, FontSize = 18, FontWeight = FontWeights.Bold, Foreground = Br("InkBrush"), Margin = new Thickness(0, 0, 0, 8) });
                foreach (var sc in _store.Data.SCRIPTS)
                {
                    sp.Children.Add(new TextBlock { Text = sc.title.ToUpperInvariant(), FontSize = 10, FontWeight = FontWeights.Bold, Foreground = Br("Ink2Brush") });
                    sp.Children.Add(new TextBlock { Text = sc.body, FontFamily = Serif, FontStyle = FontStyles.Italic, TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 2, 0, 10) });
                }
                card.Child = sp;
                ContentHost.Children.Add(card);
                break;
            }
            case "letter":
            {
                string val = _store.State.f.TryGetValue("letter", out var lv) ? lv : "";
                if (_store.State.readMode && string.IsNullOrWhiteSpace(val)) return;
                var card = MakeCard();
                var sp = new StackPanel();
                sp.Children.Add(new TextBlock { Text = "A note to you", FontFamily = Serif, FontSize = 18, FontWeight = FontWeights.Bold, Foreground = Br("InkBrush"), Margin = new Thickness(0, 0, 0, 8) });
                var tb = new TextBox { Text = val, IsReadOnly = _store.State.readMode, AcceptsReturn = true, TextWrapping = TextWrapping.Wrap, MinHeight = 110, Padding = new Thickness(8) };
                if (!_store.State.readMode) tb.TextChanged += (_, _) => { _store.State.f["letter"] = tb.Text; _store.Save(); UpdateMeter(); };
                sp.Children.Add(tb);
                card.Child = sp;
                ContentHost.Children.Add(card);
                break;
            }
            case "kids":
            {
                var card = MakeCard();
                var sp = new StackPanel();
                foreach (var k in _store.Data.KIDS)
                {
                    var rf = _store.LocalizedField(new FieldDef(k.id, k.label, k.placeholder, true));
                    string val = _store.State.f.TryGetValue(rf.id, out var kv) ? kv : "";
                    if (_store.State.readMode && string.IsNullOrWhiteSpace(val)) continue;
                    sp.Children.Add(new TextBlock { Text = $"{k.emoji} {rf.label}", FontSize = 15, FontWeight = FontWeights.Bold, Foreground = Br("InkBrush"), Margin = new Thickness(0, 4, 0, 2) });
                    var tb = new TextBox { Text = val, IsReadOnly = _store.State.readMode, AcceptsReturn = true, TextWrapping = TextWrapping.Wrap, MinHeight = 46, Padding = new Thickness(6), Margin = new Thickness(0, 0, 0, 8) };
                    if (!_store.State.readMode) tb.TextChanged += (_, _) => { _store.State.f[rf.id] = tb.Text; _store.Save(); UpdateMeter(); };
                    sp.Children.Add(tb);
                }
                card.Child = sp;
                ContentHost.Children.Add(card);
                break;
            }
        }
    }

    private void AddGuideCard(StackPanel host, GuideCard c)
    {
        var box = new Border { Background = Br("PaperBrush"), BorderBrush = Br("RuleBrush"), BorderThickness = new Thickness(1), Padding = new Thickness(10), Margin = new Thickness(0, 0, 0, 8) };
        var sp = new StackPanel();
        sp.Children.Add(new TextBlock { Text = $"{c.title} [{c.badge}]", FontWeight = FontWeights.Bold, Foreground = Br("InkBrush"), TextWrapping = TextWrapping.Wrap });
        sp.Children.Add(new TextBlock { Text = c.summary, FontSize = 12, Foreground = Br("Ink2Brush"), TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 2, 0, 4) });
        foreach (var b in c.bullets)
            sp.Children.Add(new TextBlock { Text = "• " + b, FontSize = 12, TextWrapping = TextWrapping.Wrap, Margin = new Thickness(4, 1, 0, 1) });
        if (!string.IsNullOrEmpty(c.note))
            sp.Children.Add(new TextBlock { Text = c.note, FontSize = 11.5, Foreground = Br("SkyBrush"), TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 4, 0, 0) });
        box.Child = sp;
        host.Children.Add(box);
    }

    private void RenderExtras(string tabId, string title)
    {
        if (!_store.State.extra.TryGetValue(tabId, out var items) || items.Count == 0) return;
        var fields = items.Where(x => x.type == "field").ToList();
        if (fields.Count > 0)
        {
            var card = MakeCard();
            var sp = new StackPanel();
            sp.Children.Add(new TextBlock { Text = title, FontFamily = Serif, FontSize = Scale(18), FontWeight = FontWeights.Bold, Foreground = Br("InkBrush") });
            foreach (var x in fields)
            {
                string val = _store.State.f.TryGetValue(x.id, out var fv) ? fv : "";
                sp.Children.Add(new TextBlock { Text = (x.label ?? "").ToUpperInvariant(), FontFamily = Mono, FontSize = Scale(10), FontWeight = FontWeights.Bold, Foreground = Br("Ink2Brush"), Margin = new Thickness(0, 6, 0, 2) });
                var tb = new TextBox { Text = val, IsReadOnly = _store.State.readMode, Padding = new Thickness(6, 4, 6, 4) };
                if (!_store.State.readMode) tb.TextChanged += (_, _) => { _store.State.f[x.id] = tb.Text; _store.Save(); UpdateMeter(); };
                sp.Children.Add(tb);
            }
            card.Child = sp;
            ContentHost.Children.Add(card);
        }
        foreach (var x in items.Where(i => i.type == "list"))
        {
            var rows = _store.State.lists.TryGetValue(x.id, out var lr) ? lr : new List<Dictionary<string, string>> { new() };
            var card = MakeCard();
            var sp = new StackPanel();
            sp.Children.Add(new TextBlock { Text = x.title ?? "Table", FontFamily = Serif, FontSize = Scale(18), FontWeight = FontWeights.Bold, Foreground = Br("InkBrush"), Margin = new Thickness(0, 0, 0, 6) });
            for (int r = 0; r < rows.Count; r++)
            {
                var rowBox = new Border { Background = Br("PaperBrush"), BorderBrush = Br("RuleBrush"), BorderThickness = new Thickness(1), Padding = new Thickness(10), Margin = new Thickness(0, 4, 0, 4) };
                var rowSp = new StackPanel();
                foreach (var col in x.cols ?? new())
                {
                    string cval = rows[r].TryGetValue(col.key, out var cv) ? cv : "";
                    rowSp.Children.Add(new TextBlock { Text = col.label.ToUpperInvariant(), FontFamily = Mono, FontSize = Scale(10), FontWeight = FontWeights.Bold, Foreground = Br("Ink2Brush") });
                    var tb = new TextBox { Text = cval, IsReadOnly = _store.State.readMode, Padding = new Thickness(6, 3, 6, 3), Margin = new Thickness(0, 1, 0, 5) };
                    if (!_store.State.readMode)
                    {
                        int rIdx = r; string cKey = col.key;
                        tb.TextChanged += (_, _) => { if (rIdx < rows.Count) { rows[rIdx][cKey] = tb.Text; _store.Save(); UpdateMeter(); } };
                    }
                    rowSp.Children.Add(tb);
                }
                rowBox.Child = rowSp;
                sp.Children.Add(rowBox);
            }
            if (!_store.State.readMode)
            {
                string lid = x.id;
                var addBtn = new Button { Content = "+ Add a row", Padding = new Thickness(10, 4, 10, 4), Margin = new Thickness(0, 6, 0, 0), HorizontalAlignment = HorizontalAlignment.Left };
                addBtn.Click += (_, _) => { _store.State.lists[lid].Add(new()); _store.Save(); RenderActiveTab(); };
                sp.Children.Add(addBtn);
            }
            card.Child = sp;
            ContentHost.Children.Add(card);
        }
    }

    private void OnTabSelected(object sender, SelectionChangedEventArgs e)
    {
        if (_suppressNavEvents || TabList.SelectedItem is not ListBoxItem item) return;
        _store.State.tab = (string)item.Tag;
        _store.Save(touch: false);
        RenderActiveTab();
        MainScroll.ScrollToTop();
    }

    private void OnRegionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (_suppressNavEvents || RegionCombo.SelectedItem is not ComboBoxItem item) return;
        _store.State.region = (string)item.Tag;
        _store.Save(touch: false);
        RenderActiveTab();
    }

    private void OnReadModeToggled(object sender, RoutedEventArgs e)
    {
        if (_suppressNavEvents) return;
        _store.State.readMode = ReadModeToggle.IsChecked == true;
        _store.Save(touch: false);
        RenderActiveTab();
    }

    private void OnLargeTextToggled(object sender, RoutedEventArgs e)
    {
        if (_suppressNavEvents) return;
        _store.State.largeText = LargeTextToggle.IsChecked == true;
        _store.Save(touch: false);
        ApplyThemeAppearance();
        RenderActiveTab();
    }

    private void OnContrastToggled(object sender, RoutedEventArgs e)
    {
        if (_suppressNavEvents) return;
        _store.State.highContrast = ContrastToggle.IsChecked == true;
        _store.Save(touch: false);
        ApplyThemeAppearance();
        RenderActiveTab();
    }

    private void OnSearchKeyDown(object sender, KeyEventArgs e) { if (e.Key == Key.Enter) OnSearchClick(sender, e); }

    private void OnSearchClick(object sender, RoutedEventArgs e)
    {
        var hits = _store.Search(SearchBox.Text);
        if (hits.Count == 0) { MessageBox.Show("No matching entries found.", "Search"); return; }
        var dlg = Dialogs.ShowListPicker("Search Results", hits.Select(h => ($"[{h.tabLabel}] {h.title}", h.sub)).ToList(), this);
        if (dlg >= 0)
        {
            var pick = hits[dlg];
            _store.State.tab = pick.tabId;
            if (!string.IsNullOrEmpty(pick.trackKey) && _store.Data.PLAYBOOK.ContainsKey(pick.trackKey))
                _store.State.track = pick.trackKey;
            _store.Save(touch: false);
            RebuildSidebar();
            RenderActiveTab();
        }
    }

    private void OnSummaryClick(object sender, RoutedEventArgs e) => Dialogs.ShowTextSheet("1-Page Executive Summary", _store.ExportExecutiveSummaryText(), this);
    private void OnErGrabClick(object sender, RoutedEventArgs e) => Dialogs.ShowTextSheet("1-Page ER & Medical Grab Sheet", _store.ExportErGrabSheetText(), this);
    private void OnReadinessClick(object sender, RoutedEventArgs e) => Dialogs.ShowReadiness(_store, this, (t) => { if (t != null) { _store.State.tab = t; _store.Save(touch: false); RebuildSidebar(); RenderActiveTab(); } });
    private void OnAddSectionClick(object sender, RoutedEventArgs e)
    {
        if (Dialogs.ShowNewSection(_store, this)) { RebuildSidebar(); RenderActiveTab(); }
    }

    private void OnBackupClick(object sender, RoutedEventArgs e) => Dialogs.ShowBackup(_store, this);
    private void OnRestoreClick(object sender, RoutedEventArgs e)
    {
        if (Dialogs.ShowRestore(_store, this)) { RebuildSidebar(); RenderActiveTab(); }
    }

    private void OnPrintSummaryClick(object sender, RoutedEventArgs e)
    {
        var pd = new PrintDialog();
        if (pd.ShowDialog() != true) return;
        var doc = new FlowDocument(new Paragraph(new Run(_store.ExportExecutiveSummaryText()))) { FontFamily = new FontFamily("Consolas"), FontSize = 11, PagePadding = new Thickness(40) };
        pd.PrintDocument(((IDocumentPaginatorSource)doc).DocumentPaginator, "Our Family Field Guide Summary");
    }

    private void OnLockClick(object sender, RoutedEventArgs e)
    {
        string? pw = Dialogs.PromptText("Lock App", "Set a quick passphrase to lock this window:", "", isPassword: true, owner: this);
        if (string.IsNullOrEmpty(pw)) return;
        _sessionLockPassphrase = pw;
        LockPassBox.Password = "";
        LockErrText.Text = "";
        LockOverlay.Visibility = Visibility.Visible;
    }

    private void OnUnlockAttempt(object sender, RoutedEventArgs e)
    {
        if (LockPassBox.Password == _sessionLockPassphrase)
        {
            LockOverlay.Visibility = Visibility.Collapsed;
            LockPassBox.Password = "";
            LockErrText.Text = "";
        }
        else LockErrText.Text = "Wrong passphrase.";
    }
}
