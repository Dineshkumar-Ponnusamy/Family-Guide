/*
  FAMILY FIELD GUIDE · REGIONS, DEMO FAMILIES & PASSPHRASE WORDS
  ----------------------------------------------------------------
  Adapts emergency numbers, retirement/tax/benefit terminology, and
  cross-border/visa steps without changing any saved field or list IDs.
*/

const REGIONS = {
  us: {
    label: "United States",
    emergency: "911",
    currency: "$",
    crossBorder: false,
    indiaNotes: false,
    moneyGuide: {
      depositCap: "FDIC $250,000 per depositor, per insured bank (joint accounts cover $500,000).",
      taxNote: "Life insurance death benefits are generally federal income-tax-free (IRC §101), and inherited investments/home usually receive a step-up in cost basis. Talk to a CPA about surviving-spouse tax filing before selling assets.",
      fiduciaryName: "Fee-Only Fiduciary CFP® (search NAPFA.org or XYPlanningNetwork.com)",
      safeCash: "2–4 FDIC-insured High-Yield Savings Accounts (under $250k each), Treasury Money Market fund, or short-term U.S. Treasury bills.",
      sampleTitle: "Sample $1,000,000 Allocation (US)",
      sampleLines: [
        "12-month safety cash ($120,000) across FDIC High-Yield Savings accounts.",
        "Pay off high-interest joint debts only (up to $80,000); pause on low-rate mortgages and verify solo debts with your attorney.",
        "Near-term 1–5 year buffer ($100,000) in Treasury bills / short-term CDs for kids or home repairs.",
        "Long-term index portfolio ($700,000) paying ~3.5%–4% ($24,500–$28,000/yr sustainable) before Social Security survivor benefits or salary."
      ]
    },
    proFinder: {
      legal: "State Bar Lawyer Referral Service (findlegalhelp.org) · Legal Aid (LawHelp.org) · Employer EAP",
      visa: "AILA Lawyer Directory (ailalawyer.com) · ImmigrationLawHelp.org (free/low-cost clinics)",
      money: "Garrett Planning Network (hourly) · NAPFA / AdviceOnlyNetwork · Foundation for Financial Planning (pro-bono)",
      tax: "IRS VITA / TCE & AARP Tax-Aide (free) · NAEA.org (Enrolled Agents) · Dollar For (free hospital charity care)"
    },
    fieldOverrides: {},
    listOverrides: {
      gov_ids: {
        hint: "Safety rule: enter ONLY the last 4 digits of SSNs, Passports, or Driver's Licenses and where the physical card lives. NEVER type full 9-digit SSNs.",
        extraSuggestions: ["SSN (Child)", "Global Entry / TSA PreCheck", "ITIN / EIN", "Medicare Card"]
      }
    },
    stepOverrides: {}
  },
  us_in: {
    label: "US + India (H-1B / Visa / NRI)",
    emergency: "911",
    currency: "$ / ₹",
    crossBorder: true,
    indiaNotes: true,
    moneyGuide: {
      depositCap: "US FDIC $250,000 per bank · India DICGC ₹5 lakh per bank.",
      taxNote: "US life insurance payouts are generally income-tax-free, and India Section 10(10D) exempts qualifying policies—HOWEVER, non-US citizens can face a tiny $60,000 US estate-tax threshold on US-situs assets without proper treaties/trusts, and repatriating large India sums has FEMA/LRS & FBAR/FATCA rules. Consult a cross-border CPA before wiring large payouts internationally.",
      fiduciaryName: "Cross-border Fee-Only Fiduciary CFP® (US) & SEBI-Registered Investment Adviser / RIA (India)",
      safeCash: "US insured High-Yield Savings / Treasury Money Market (keep under $250k/bank) and India PSU/top-bank FDs split under ₹5L per bank or Liquid Debt funds.",
      sampleTitle: "Sample $1,000,000 / ₹2 Cr Cross-Border Allocation",
      sampleLines: [
        "US 12-month cash cushion ($120,000) + India parents/emergency reserve (₹15–20L) in separate safe liquid accounts.",
        "Pause before wiring payouts between US and India until your visa status and cross-border tax residency are confirmed.",
        "Near-term transition / education fund ($130,000) in short-term T-Bills or CDs.",
        "Long-term global diversified index portfolio ($750,000) yielding ~3.5%–4% ($26k–$30k/yr) to support family stability in either country."
      ]
    },
    proFinder: {
      legal: "US State Bar Referral (findlegalhelp.org) + India High Court / Succession Advocate (keep wills separate & non-revoking)",
      visa: "AILA Independent H-1B/INA 204(l) Counsel (ailalawyer.com) + nearest Indian Consulate / Embassy",
      money: "Fee-Only CFP® in US (Garrett/NAPFA) + SEBI-Registered Investment Adviser (feeonlyindia.com) in India",
      tax: "Cross-border CPA / CA skilled in FBAR, FATCA (Form 8938), Form 3520 & US-India DTAA treaty"
    },
    fieldOverrides: {
      m_monthly: { ph: "e.g. $5,500 US + ₹45,000 India" },
      d_hcd: { label: "US Healthcare directive & India medical notes" },
      d_will: { label: "US Will/Trust & separate India Will: where originals are" },
      d_guard: { label: "Local temporary guardian & permanent guardian (US / India)" },
      d_legacy: { label: "Legacy contacts & Embassy/Consulate contacts", ph: "Apple, Google, Indian Consulate" }
    },
    listOverrides: {
      accounts: { hint: "List both US (checking/savings) and India (NRE/NRO/FCNR) accounts. Mark Joint vs. Solo; in India, check Nominee vs. Legal Heir.", extraSuggestions: ["NRE Account", "NRO Account", "FCNR Deposit"] },
      invest: { hint: "US (401k, IRA, HSA, brokerage) & India (EPF, PPF, NPS, Mutual Funds, Demat). Beneficiaries/nominees matter—separate US & India wills prevent probate delays.", extraSuggestions: ["EPF / VPF", "PPF", "NPS", "Mutual Funds / Demat", "Sovereign Gold Bonds"] },
      property: { extraSuggestions: ["India Property / Flat", "Gold / Bank Locker"] },
      doclocs: { hint: "Include I-797, I-94, I-140/I-485, EAD, Passports, OCI cards, PAN, Aadhaar, and both US & India Wills.", extraSuggestions: ["PAN Card", "Aadhaar Card", "OCI Card", "I-797 / I-94 / I-140", "India Property Sale Deed"] },
      gov_ids: {
        hint: "Safety rule: enter ONLY the last 4 digits of SSN, Aadhaar, PAN, Passport, or USCIS/I-94 numbers and where originals live. Never type full SSN or 12-digit Aadhaar numbers.",
        extraSuggestions: ["PAN Card (last 4 + location)", "Aadhaar Card (last 4 ONLY)", "OCI Card", "USCIS / A-Number (last 4)", "Passport (Spouse / Child)", "UAN (EPFO)"]
      }
    },
    stepOverrides: {
      g9: { d: "Contact US Social Security (1-800-772-1213) for survivor benefits, and contact the Indian Embassy/Consulate for death registration, OCI/passport cancellation, or repatriation support." },
      g11: { d: "Notify US credit bureaus (Equifax, Experian, TransUnion) and protect India PAN/Aadhaar/CIBIL from misuse." },
      m2: { t: "Check H-1B 60-day grace period & unemployment rules", d: "If on an employment visa (H-1B/L-1), contact an immigration attorney immediately about the 60-day grace period and dependent (H-4/L-2) options before applying for state benefits." }
    }
  },
  in: {
    label: "India",
    emergency: "112",
    currency: "₹",
    crossBorder: false,
    indiaNotes: true,
    moneyGuide: {
      depositCap: "₹5 lakh per depositor, per bank (including principal & interest) under DICGC.",
      taxNote: "Life insurance proceeds are generally exempt under Section 10(10D). Nominees receive funds as custodians—legal heirs/will determine final ownership, so keep the will and bank/demat transmission papers handy.",
      fiduciaryName: "SEBI-Registered Investment Adviser (RIA — fee-only). Strictly avoid bank RMs pitching ULIPs, endowment plans, or NFOs.",
      safeCash: "PSU / top-tier bank Fixed Deposits split across several banks (under ₹5L per bank), Post Office schemes, or Liquid / Overnight Mutual Funds.",
      sampleTitle: "Sample ₹2 Crore Allocation (India)",
      sampleLines: [
        "12-month household reserve (₹20–25 lakh) across safe bank FDs / Liquid Funds.",
        "Clear high-interest personal/credit-card loans first; consult your CA before prepaying a subsidized home loan.",
        "Near-term 1–5 year goals (₹30–40 lakh) in short-duration Debt Funds or staggered FDs for tuition and family milestones.",
        "Long-term diversified portfolio (₹1.25–1.35 Cr in broad index/hybrid funds) supporting ~3.5%–4% annual withdrawal (₹4.5–5.4L/yr sustainable) before pension or salary."
      ]
    },
    proFinder: {
      legal: "State Bar Council Succession Advocate · NALSA / DLSA (free legal aid) · Court Legal Heir / Succession Certificate",
      visa: "Indian Embassy / Consulate & MEA Madad Portal (for overseas family members)",
      money: "SEBI-Registered Investment Adviser (RIA) via SEBI website or feeonlyindia.com (never bank RMs / ULIPs)",
      tax: "ICAI Chartered Accountant (CA) directory · Income Tax India e-Filing Portal"
    },
    fieldOverrides: {
      m_monthly: { ph: "e.g. about ₹1,20,000 / month" },
      m_runway: { ph: "e.g. ₹8,00,000 ≈ 6 months" },
      m_cash: { ph: "e.g. ₹25,000 in cupboard locker" },
      w_hsa: { label: "Group medical cover / Corporate Mediclaim" },
      w_stock: { label: "ESOPs / Gratuity / Bonus / PF owed" },
      d_hcd: { label: "Advance medical directive / hospital preference" },
      k_911: { label: "If someone is hurt", ph: "Call 112 (or 102 / 108 ambulance). Say your name, our address, and what happened." }
    },
    listOverrides: {
      accounts: { hint: "Mark Joint (Either or Survivor) vs. Single, and verify the registered Nominee (note: a bank nominee is a custodian; legal heirs/will govern final ownership).", extraSuggestions: ["NRE / NRO Account", "Fixed Deposit (FD)", "PPF Account"] },
      invest: { hint: "EPF, PPF, NPS, Mutual Funds, Demat, Fixed Deposits, Sovereign Gold Bonds. Verify registered Nominees & legal will.", extraSuggestions: ["EPF / VPF", "PPF", "NPS", "Mutual Funds / Demat", "Sovereign Gold Bonds"] },
      property: { extraSuggestions: ["Gold / Bank Locker", "Ancestral Property"] },
      doclocs: { hint: "Include PAN card, Aadhaar card, Passports, Property sale deed, Demat/Share details, and latest ITRs.", extraSuggestions: ["PAN Card", "Aadhaar Card", "Property Sale Deed", "Demat / Share Certificates", "Ration / Voter ID"] },
      gov_ids: {
        hint: "Safety rule: enter ONLY the last 4 characters/digits of Aadhaar, PAN, Passport, or UAN and where the original card lives. NEVER type full 12-digit Aadhaar or full PAN numbers.",
        extraSuggestions: ["PAN Card (last 4 + location)", "Aadhaar Card (last 4 ONLY)", "UAN (EPFO)", "ABHA Health ID", "Voter ID"]
      }
    },
    stepOverrides: {
      h1: { d: "Call 112 (or 100/102/108) if anyone is in danger. It's okay to let someone else drive or make calls for you." },
      h4: { d: "Ask about medical leave, corporate group Mediclaim, and salary continuation." },
      g9: { t: "Contact EPFO, Pension & Bank/Demat transmission", d: "File EPF/EDLI/EPS claims via EPFO and initiate bank/demat transmission with the death certificate, legal heir certificate, or will." },
      g11: { t: "Protect my identity (PAN, Aadhaar & CIBIL)", d: "Update/deactivate PAN & Aadhaar as required and alert CIBIL, Experian, and CRIF so no credit is opened in my name." },
      m2: { t: "Review severance, EPF & notice pay", d: "Check employer severance/gratuity eligibility and avoid breaking long-term PF/PPF unless needed." },
      m3: { t: "Sort out health insurance", d: "If employer Mediclaim ends, verify personal/family floater coverage or port your policy before the grace period ends." },
      c1: { d: "If there's a medical or safety emergency, call 112 (or 102/108) and read our home address from the kids page." }
    }
  },
  visa_intl: {
    label: "Cross-Border / Work Visa (Any 2 Countries)",
    emergency: "112 / 911",
    currency: "$ / € / £",
    crossBorder: true,
    indiaNotes: false,
    moneyGuide: {
      depositCap: "Check bank deposit insurance in BOTH countries (e.g., US $250k FDIC, UK £85k FSCS, EU €100k DGS, India ₹5L DICGC).",
      taxNote: "Cross-border payouts can trigger currency, reporting, or estate-tax rules depending on domicile and citizenship. Consult a cross-border tax advisor before transferring large sums across borders.",
      fiduciaryName: "Cross-border Fee-Only Fiduciary Advisor familiar with both countries' tax treaties",
      safeCash: "Keep short-term living expenses in the host country's insured high-yield cash account while residency status is settled.",
      sampleTitle: "Sample Cross-Border Allocation",
      sampleLines: [
        "Keep 12 months of living costs in the currency where you are currently paying bills.",
        "Pause international wire transfers until an immigration & tax specialist confirms your best long-term country of residence.",
        "Hold 1–5 year repatriation/education cash in short-term insured government bills or fixed deposits.",
        "Invest the remaining long-term core (60%–75%) in globally diversified, tax-treaty-friendly low-cost funds."
      ]
    },
    proFinder: {
      legal: "National Bar Lawyer Referral & Legal Aid (check both host and home country bar associations)",
      visa: "Licensed Independent Immigration Attorney (never unlicensed agents) + Home-Country Embassy/Consulate",
      money: "Cross-border Fee-Only Fiduciary Planner familiar with tax treaties in both countries",
      tax: "Licensed Cross-Border CPA / Chartered Accountant + Employer EAP & Hospital Social Worker (free)"
    },
    fieldOverrides: {
      d_will: { label: "Host-country & Home-country Wills: where originals are" },
      d_guard: { label: "Local temporary guardian & permanent guardian" }
    },
    listOverrides: {
      accounts: { hint: "List both host-country and home-country bank accounts. Mark Joint vs. Solo." },
      doclocs: { hint: "Include visas/residence permits, work permits, passports, birth/marriage certificates (apostilled), and both country wills." },
      gov_ids: {
        hint: "Safety rule: enter ONLY the last 4 digits/characters of national IDs, tax IDs, passports, and visa/residence permit numbers.",
        extraSuggestions: ["Residence Permit / Visa (last 4)", "Home-Country National ID (last 4)", "Tax ID (Host & Home)"]
      }
    },
    stepOverrides: {
      h1: { d: "Call local emergency services (911 / 112 / 999) if anyone is in danger." },
      g9: { t: "Contact host & home-country social security / Embassy", d: "Notify local social security/pension and your home-country Embassy or Consulate for civil registration and repatriation help." },
      g11: { t: "Protect identity in both countries", d: "Send death certificate to credit bureaus and tax/ID agencies in both host and home countries." },
      m2: { t: "Check work-visa grace period & residency rules", d: "If residency depends on employment, contact an immigration lawyer before leaving or changing status." },
      c1: { d: "If there's a medical or safety emergency, call local emergency services and read our home address from the kids page." }
    }
  },
  uk: {
    label: "United Kingdom",
    emergency: "999",
    currency: "£",
    crossBorder: false,
    indiaNotes: false,
    moneyGuide: {
      depositCap: "FSCS £85,000 per banking group (Temporary High Balance protection up to £1M for 6 months after a life insurance payout).",
      taxNote: "Life policies written 'in trust' usually pay out quickly outside probate and Inheritance Tax (IHT). Ask a solicitor/accountant before moving trust proceeds.",
      fiduciaryName: "Chartered Independent Financial Adviser (IFA — fee-based, whole of market, CII/PFS verified)",
      safeCash: "NS&I Premium Bonds / Direct Saver (100% HM Treasury backed) or multiple FSCS-protected Easy Access savings accounts.",
      sampleTitle: "Sample £500,000 Allocation (UK)",
      sampleLines: [
        "12-month emergency cash (£50,000) in NS&I or FSCS Easy Access savings.",
        "Clear expensive joint credit/car finance (£25,000–£50,000); review mortgage rate before overpaying.",
        "Near-term 1–5 year buffer (£75,000) in Cash ISAs / short-dated Gilts.",
        "Long-term diversified core (£350,000 across Stocks & Shares ISAs/GIA) yielding ~3.5%–4% (£12,250–£14,000/yr) alongside pension/survivor benefits."
      ]
    },
    proFinder: {
      legal: "Law Society 'Find a Solicitor' · STEP (estate specialists) · Citizens Advice (free)",
      visa: "IAA (formerly OISC) Regulated Advisers & Law Society Immigration Solicitors",
      money: "Chartered Independent Financial Adviser (PFS / CII / Unbiased) · MoneyHelper (free government guidance)",
      tax: "ICAEW / ATT Chartered Tax Advisers · TaxAid (free help for lower incomes)"
    },
    fieldOverrides: {
      m_monthly: { ph: "e.g. about £4,200 / month" },
      w_hsa: { label: "Private health / dental / cash plan" },
      d_hcd: { label: "Advance Decision / Lasting Power of Attorney (Health & Welfare)" },
      d_fpoa: { label: "Lasting Power of Attorney (Property & Financial Affairs)" },
      k_911: { label: "If someone is hurt", ph: "Call 999 (or 112). Say your name, our address, and what happened." }
    },
    listOverrides: {
      invest: { hint: "Workplace pensions, SIPP, Stocks & Shares ISA, LISA, Premium Bonds. Check Expression of Wishes forms.", extraSuggestions: ["Stocks & Shares ISA", "SIPP", "Workplace Pension", "Premium Bonds"] },
      doclocs: { hint: "Include Passports, Birth/Marriage certificates, NI numbers, Property title deeds, and LPA documents.", extraSuggestions: ["National Insurance #", "LPA Documents"] },
      gov_ids: {
        hint: "Safety rule: enter ONLY the last 4 characters/digits of National Insurance, NHS, or Passport numbers and where the original lives.",
        extraSuggestions: ["National Insurance # (last 4)", "NHS Number (last 4)", "HMRC UTR"]
      }
    },
    stepOverrides: {
      h1: { d: "Call 999 if anyone is in danger. It's okay to let someone else drive or make calls for you." },
      h4: { d: "Ask about Statutory Sick Pay (SSP), occupational sick pay, and income protection." },
      g9: { t: "Use GOV.UK 'Tell Us Once' & Bereavement Support", d: "Use the Tell Us Once service (with the registrar's code) to notify HMRC, DWP, DVLA, and Passport Office, and check Bereavement Support Payment." },
      g11: { d: "Register with Bereavement Register & credit bureaus", d: "Notify Experian, Equifax, and TransUnion UK plus The Bereavement Register to stop mail and fraud." },
      m2: { t: "Check Universal Credit / New Style JSA", d: "Apply promptly if employment ends, as claims are generally not backdated." },
      m3: { t: "Review private health & protection policies", d: "Note NHS coverage continues; check whether employer private medical or life cover can be converted." },
      c1: { d: "If there's a medical or safety emergency, call 999 and read our home address from the kids page." }
    }
  },
  ca: {
    label: "Canada",
    emergency: "911",
    currency: "CA$",
    crossBorder: false,
    indiaNotes: false,
    moneyGuide: {
      depositCap: "CDIC CA$100,000 per insured category, per member institution.",
      taxNote: "Life insurance proceeds to named beneficiaries are generally tax-free and bypass probate in Canada. RRSP/TFSA transfers to a spouse can often roll over tax-deferred—speak to an accountant first.",
      fiduciaryName: "Advice-Only / Fee-Only CFP® (look for directories with zero product sales)",
      safeCash: "High-Interest Savings Accounts across multiple CDIC-insured banks or Government of Canada T-Bills / GICs.",
      sampleTitle: "Sample CA$1,000,000 Allocation (Canada)",
      sampleLines: [
        "12-month safety reserve (CA$100,000) across CDIC-insured High-Interest Savings.",
        "Clear high-interest joint debts first; compare mortgage renewal rate before lump-sum prepayment.",
        "Near-term 1–5 year needs (CA$120,000) in GIC ladder or T-Bills (maximizing TFSA/RESP room first).",
        "Long-term diversified portfolio (CA$780,000) generating ~3.5%–4% (CA$27k–CA$31k/yr) alongside CPP survivor benefits."
      ]
    },
    proFinder: {
      legal: "Provincial Law Society Referral Service (often free 30-min consult) & Legal Aid",
      visa: "CICC Licensed Consultants (RCIC) & Provincial Law Society Immigration Lawyers",
      money: "Advice-Only / Fee-Only CFP® directories (zero product commissions)",
      tax: "CPA Canada · CVITP Free Community Volunteer Tax Clinics"
    },
    fieldOverrides: {
      w_hsa: { label: "Extended health / HSA / group benefits" },
      d_hcd: { label: "Personal / Healthcare Directive & Representation Agreement" },
      d_fpoa: { label: "Enduring Power of Attorney (Financial)" }
    },
    listOverrides: {
      invest: { hint: "RRSP, TFSA, RESP, FHSA, LIRA, non-registered accounts. Verify designated beneficiaries.", extraSuggestions: ["RRSP", "TFSA", "RESP", "FHSA"] },
      doclocs: { hint: "Include SIN cards, Passports, Birth/Marriage certificates, Provincial health cards, and NOAs (CRA).", extraSuggestions: ["SIN Card", "CRA Notice of Assessment"] },
      gov_ids: {
        hint: "Safety rule: enter ONLY the last 4 digits of SIN, Passport, or Provincial Health cards and where the card lives. Never type full 9-digit SINs.",
        extraSuggestions: ["SIN (last 4 ONLY)", "Provincial Health Card (last 4)", "PR Card / Citizenship"]
      }
    },
    stepOverrides: {
      h4: { d: "Ask HR about short-term disability, EI sickness benefits, and salary continuation." },
      g9: { t: "Contact Service Canada (CPP Survivor Benefits)", d: "Call 1-800-277-9914 to apply for the CPP Death Benefit and Survivor's Pension, and notify CRA." },
      g11: { d: "Send a death certificate to Equifax Canada and TransUnion Canada so no credit is opened in my name." },
      m2: { t: "Apply for Employment Insurance (EI)", d: "Apply with Service Canada right away if a job ended." },
      m3: { t: "Sort out extended health & dental coverage", d: "Provincial health continues; check conversion options for employer extended health/drug plans." }
    }
  },
  au: {
    label: "Australia",
    emergency: "000",
    currency: "A$",
    crossBorder: false,
    indiaNotes: false,
    moneyGuide: {
      depositCap: "Financial Claims Scheme (FCS): A$250,000 per account holder, per Authorised Deposit-taking Institution (ADI).",
      taxNote: "Life insurance payouts are generally tax-free, though life/TPD insurance paid out through Superannuation can have different tax rules for adult non-dependents—check with a tax accountant.",
      fiduciaryName: "Independent Fee-Only Financial Adviser (check ASIC Financial Advisers Register — strictly zero commissions)",
      safeCash: "High-Interest Savings or Term Deposits split under A$250k per Australian ADI bank (or mortgage offset account if appropriate).",
      sampleTitle: "Sample A$1,000,000 Allocation (Australia)",
      sampleLines: [
        "12-month emergency cash (A$120,000) under A$250k ADI cap.",
        "Pay high-interest joint credit/personal debt; check mortgage offset benefit vs. paying down.",
        "Near-term 1–5 year buffer (A$130,000) in short-term Deposits / high-grade bonds.",
        "Long-term diversified portfolio (A$750,000 across Super/ETF core) providing ~3.5%–4% (A$26k–A$30k/yr sustainable)."
      ]
    },
    proFinder: {
      legal: "State Law Society Referral Service & Community Legal Centres (free)",
      visa: "OMARA Registered Migration Agents & Law Society Accredited Immigration Specialists",
      money: "ASIC Financial Advisers Register (fee-only) · Moneysmart & National Debt Helpline (1800 007 007, free)",
      tax: "Tax Practitioners Board (TPB) Register · ATO Tax Help (free volunteer program)"
    },
    fieldOverrides: {
      w_hsa: { label: "Private hospital / extras cover" },
      d_hcd: { label: "Advance Care Directive & Enduring Guardian" },
      k_911: { label: "If someone is hurt", ph: "Call 000 (Triple Zero). Say your name, our address, and what happened." }
    },
    listOverrides: {
      invest: { hint: "Superannuation funds, SMSF, shares/ETFs. Check whether Super has a Binding Death Benefit Nomination (super sits outside the will!).", extraSuggestions: ["Superannuation", "SMSF", "Shares / ETFs"] },
      doclocs: { hint: "Include Passports, Birth/Marriage certificates, TFN, Medicare card, Super statements, and Title deeds.", extraSuggestions: ["TFN / Medicare Card", "Super Binding Nomination"] },
      gov_ids: {
        hint: "Safety rule: enter ONLY the last 4 digits of TFN, Medicare, or Passport numbers and where the card lives.",
        extraSuggestions: ["TFN (last 4 ONLY)", "Medicare Card (last 4)", "Centrelink CRN (last 4)"]
      }
    },
    stepOverrides: {
      h1: { d: "Call 000 if anyone is in danger. It's okay to let someone else drive or make calls for you." },
      g9: { t: "Notify Services Australia & Superannuation funds", d: "Contact Centrelink/Medicare and submit claims to each Super fund (including insurance held inside Super)." },
      g11: { d: "Send a death certificate to Equifax Australia, Illion, and Experian Australia to prevent credit fraud." },
      m2: { t: "Check Centrelink JobSeeker & Income Protection", d: "Check redundancy payouts, waiting periods, and any income protection held inside Super." },
      m3: { t: "Review private health & Super insurance", d: "Medicare continues; review private hospital cover and any life/TPD insurance inside Super." },
      c1: { d: "If there's a medical or safety emergency, call 000 and read our home address from the kids page." }
    }
  },
  eu: {
    label: "European Union",
    emergency: "112",
    currency: "€",
    crossBorder: false,
    indiaNotes: false,
    moneyGuide: {
      depositCap: "EU Deposit Guarantee Scheme (DGS): €100,000 per depositor, per bank (many EU states offer temporary higher limits after insurance payouts).",
      taxNote: "Inheritance tax and forced-heirship rules vary widely across EU countries. Speak with a local notary / tax lawyer before distributing payouts or signing estate papers.",
      fiduciaryName: "Fee-Only Independent Fiduciary Financial Planner (no bank sales commissions)",
      safeCash: "High-grade government money market / short-term EU sovereign bills or savings split under €100k per bank.",
      sampleTitle: "Sample €500,000 Allocation (EU)",
      sampleLines: [
        "12-month emergency cushion (€60,000) under €100k DGS bank limits.",
        "Pay off expensive consumer loans; keep low-rate fixed mortgages unless advised otherwise.",
        "Near-term 1–5 year goals (€70,000) in short-term deposits or sovereign bills.",
        "Long-term global diversified ETF core (€370,000) yielding ~3.5%–4% (€13k–€15k/yr) alongside state survivor pensions."
      ]
    },
    proFinder: {
      legal: "National Bar Association & Public Notary Chamber (notaries draft wills & handle succession across most of the EU)",
      visa: "Licensed Local Immigration Attorney + Home-Country Consulate / Embassy",
      money: "Independent Fee-Only Financial Planner (honorarium/flat-fee, zero bank commissions)",
      tax: "Licensed Tax Advisor (Steuerberater / Expert-Comptable / Gestor) & Employer EAP"
    },
    fieldOverrides: {
      w_hsa: { label: "Supplemental health insurance" },
      k_911: { label: "If someone is hurt", ph: "Call 112. Say your name, our address, and what happened." }
    },
    listOverrides: {
      invest: { hint: "State/occupational pensions, brokerage, savings. Check inheritance/forced-heirship rules in your country." },
      gov_ids: {
        hint: "Safety rule: enter ONLY the last 4 digits of National ID, Tax ID, or Passports and where the physical card lives.",
        extraSuggestions: ["National ID Card (last 4)", "Tax ID / BSN / Steuer-ID (last 4)", "EU Health Insurance Card (EHIC)"]
      }
    },
    stepOverrides: {
      h1: { d: "Call 112 if anyone is in danger. It's okay to let someone else drive or make calls for you." },
      h4: { d: "Ask HR/employer about statutory sick leave and family/caregiver leave." },
      g9: { t: "Contact Civil Registry & Pension / Social Security", d: "Obtain official death certificates via the local municipality/registry and apply for survivor pension benefits." },
      g11: { t: "Notify national ID / tax & credit registries", d: "Update national population/tax registry and local credit bureaus so accounts cannot be misused." },
      m2: { t: "Register with national unemployment office", d: "Register promptly after job loss as statutory benefits often depend on registration date." },
      m3: { t: "Check public & supplemental health insurance", d: "Notify your statutory health fund of any household or employment change." },
      c1: { d: "If there's a medical or safety emergency, call 112 and read our home address from the kids page." }
    }
  },
  generic: {
    label: "International / Generic",
    emergency: "Local emergency #",
    currency: "$",
    crossBorder: false,
    indiaNotes: false,
    moneyGuide: {
      depositCap: "Check your country's national bank deposit-insurance cap and split large payouts across multiple strong institutions.",
      taxNote: "Confirm local inheritance/tax rules with a qualified accountant or estate lawyer before making large transfers or selling inherited property.",
      fiduciaryName: "Fee-Only Independent Fiduciary Advisor (paid flat/hourly, zero product commissions)",
      safeCash: "Government-insured savings accounts (under local cap) or short-term sovereign treasury bills while pausing major decisions.",
      sampleTitle: "Sample $1,000,000 Allocation (General)",
      sampleLines: [
        "12-month emergency cash (10%–15% / $100k–$150k) in insured liquid savings.",
        "High-interest joint debt payoff only (0%–10%); review mortgage/solo debt with your lawyer first.",
        "Near-term 1–5 year needs (10%–15% / $100k–$150k) in short-term government bills or deposits.",
        "Long-term diversified portfolio (60%–75% / $600k–$750k) using a ~3.5%–4% annual withdrawal guide ($24k–$30k/yr sustainable)."
      ]
    },
    proFinder: {
      legal: "National or Regional Bar Association Referral Service & Legal Aid / Community Legal Clinics",
      visa: "Licensed Immigration Attorney (verify bar/regulator license) + Home-Country Embassy",
      money: "Independent Fee-Only Fiduciary Financial Advisor (hourly or flat fee, zero commissions)",
      tax: "Licensed CPA / Chartered Accountant · Employer EAP & Hospital Social Worker (free)"
    },
    fieldOverrides: {
      w_hsa: { label: "Health savings / medical benefits" },
      k_911: { label: "If someone is hurt", ph: "Call local emergency services. Say your name, our address, and what happened." }
    },
    listOverrides: {
      gov_ids: {
        hint: "Safety rule: enter ONLY the last 4 digits of National IDs, Tax IDs, or Passports and where the physical card lives.",
        extraSuggestions: ["National ID (last 4)", "Tax ID (last 4)"]
      }
    },
    stepOverrides: {
      h1: { d: "Call local emergency services if anyone is in danger. Let someone else drive or make calls for you." },
      h4: { d: "Ask about paid sick leave, disability benefits, and salary continuation." },
      g9: { t: "Contact government survivor & pension agencies", d: "Check whether your spouse and children qualify for state survivor or pension benefits." },
      g11: { t: "Protect my identity with credit & ID agencies", d: "Notify national credit bureaus and tax/ID authorities with a certified death certificate." },
      m2: { t: "Check unemployment & severance benefits", d: "Register promptly with your local employment agency if a job ended." },
      m3: { t: "Sort out health insurance", d: "Verify continuation or replacement health coverage before employer coverage lapses." },
      c1: { d: "If there's a medical or safety emergency, call local emergency services and read our home address from the kids page." }
    }
  }
};

const DEMO_FAMILIES = {
  us_in: {
    track: "visa",
    f: {
      q_first: "Priya Sharma (sister, Seattle) · 206-555-0148",
      q_binder: "Blue fireproof safe in master bedroom closet (key on top shelf)",
      q_attorney: "Meera Patel Esq. (Cross-Border Estate) · 425-555-0192",
      q_life: "$1.2M ($500k work + $700k personal term) + ₹1 Cr India term plan",
      q_runway: "~6 months ($34,000 US savings + ₹6L liquid in NRE)",
      m_monthly: "$5,600 / month (US) + ₹35,000 / month (parents support)",
      m_runway: "$34,000 in Ally HYSA ≈ 6 months",
      m_cash: "$800 USD + ₹15,000 in fireproof safe",
      m_tax: "Accountant portal (CPA Raj) + Google Drive 'Tax Archive' folder",
      m_income: "Rohan salary (CloudCorp H-1B) + Priya part-time consulting (EAD)",
      m_first: "Keep Chase Joint Checking funded from Ally HYSA; DO NOT move India NRE funds before talking to Meera Patel.",
      m_payout_first: "Split payout across 3–4 FDIC High-Yield Savings accounts ($250k max each) + wait 6–12 months before moving house or wiring large sums to India.",
      m_payout_payoff: "Pay off car loan only; keep mortgage unless CPA recommends; ask Meera Patel about non-citizen estate tax before investing.",
      m_payout_advisor: "Call our Fee-Only Fiduciary CFP (NOT bank relationship managers or insurance salespeople pitching annuities/ULIPs).",
      m_payout_monthly: "Auto-transfer $5,600/month on the 1st from Ally HYSA to Chase Joint Checking.",
      w_employer: "CloudCorp · benefits.cloudcorp.example (HR: hr@cloudcorp.example)",
      w_life: "$500,000 (MetLife group term — Beneficiary: Priya)",
      w_disab: "60% salary STD/LTD via MetLife",
      w_hsa: "$4,800 at Fidelity HSA (Family)",
      w_stock: "Unvested RSUs vest quarterly; check HR on death acceleration clause.",
      d_hcd: "Signed copies in blue fireproof safe + uploaded to MyChart",
      d_mpoa: "Priya (primary), Sister Ananya (backup)",
      d_ins: "Premera Blue Cross · Member ID in Apple Wallet & safe",
      h_pharm: "Walgreens on 148th Ave NE",
      d_meds: "No daily meds. Allergic to Penicillin.",
      h_triage: "Overlake Medical Center (Bellevue) · 425-688-5000",
      h_portal: "Priya has MyChart proxy access for Rohan & Aarav",
      h_wishes: "Please follow my healthcare directive; prioritize comfort.",
      d_will: "US Will & Trust: Blue safe (original). Separate India Will: parents' locker in Pune + scanned copy in safe.",
      d_exec: "Priya (US) · Brother Vikram (India)",
      d_fpoa: "Durable Financial POA in blue safe (covers US accounts)",
      d_guard: "Local temp guardian (first 72h): Neighbors Sam & Claire (555-0188). Permanent: Ananya Sharma.",
      d_pm: "1Password Family vault — Emergency Kit printed in blue safe + Priya is Family Organizer",
      d_phone: "6-digit passcode written inside sealed envelope #2 in the safe",
      d_2fa: "1Password TOTP + 2 YubiKeys (one on keychain, backup in blue safe)",
      d_safe: "Master closet top shelf; spare key taped behind hall bookshelf",
      d_email: "rohan.sample@example.com (Google Inactive Account Manager set to 3 months → Priya)",
      d_legacy: "Apple Legacy Contact: Priya (printout in safe). Google Inactive Account Manager active.",
      d_sim: "T-Mobile family plan (account PIN is in 1Password → 'T-Mobile')",
      d_keys: "YubiKey 5C NFC on keyring + backup in safe (PIN in sealed envelope #2)",
      d_photos: "iCloud Photos (shared family library) + Synology NAS in home office",
      d_social: "Download archive, then memorialize LinkedIn and delete others.",
      d_funeral: "Simple cremation; ashes taken to Rishikesh when family is ready.",
      d_organ: "Yes — registered organ donor on WA driver's license.",
      hk_water: "Front crawlspace hatch, red lever handle",
      hk_gas: "West exterior wall next to meter (wrench hangs on peg)",
      hk_breaker: "Garage south wall behind gray door",
      hk_spare: "Hidden lockbox under back deck stairs (code = kids' birth years)",
      hk_trash: "Tuesday morning (put bins out Monday night)",
      hk_quirks: "August smart lock has physical key inside keybox; SimpliSafe disarm code is in 1Password.",
      k_call: "Aunt Ananya: 206-555-0148 · Neighbor Sam: 425-555-0188",
      k_home: "1420 Cedar Ridge Lane, Bellevue, WA 98007",
      k_911: "Call 911. Say your name, '1420 Cedar Ridge Lane, Bellevue', and what happened.",
      k_school: "Neighbor Sam or Aunt Ananya (both are on school pickup list)",
      k_safe: "Blue Mango",
      k_routine: "8:00 PM story + nightlight on; stuffed elephant 'Ellie' is in top bunk.",
      k_note: "We love you to the moon and back. Be brave and ask grown-ups for hugs.",
      letter: "Priya — take a deep breath. You don't have to figure out immigration, taxes, and India accounts this week. Call Meera Patel and our immigration lawyer first before booking international flights. Everything we built is mapped here for you and Aarav."
    },
    lists: {
      first: [
        { name: "Sam & Claire Ortiz", rel: "Neighbors (2 doors down)", phone: "425-555-0188", why: "Immediate Aarav pickup & stay overnight" },
        { name: "Ananya Sharma", rel: "Sister (Seattle)", phone: "206-555-0148", why: "Hospital support, calls & family updates" }
      ],
      pros: [
        { role: "Estate attorney", name: "Meera Patel, Cross-Border Law", phone: "425-555-0192", email: "meera@example.com", note: "Handles US + India wills" },
        { role: "Immigration attorney", name: "David Chen Law (H-1B / I-140)", phone: "206-555-0177", email: "dchen@example.com", note: "Call before any travel / status change" },
        { role: "Accountant / tax preparer", name: "Rajesh Nair CPA (FBAR/FATCA)", phone: "425-555-0161", email: "raj@example.com", note: "Files US + India DTAA" }
      ],
      accounts: [
        { inst: "Chase", type: "Checking", own: "Joint (Rohan & Priya)", last4: "4821", access: "Both have logins + debit cards" },
        { inst: "Ally Bank", type: "Savings (HYSA)", own: "Joint", last4: "9034", access: "1Password → 'Ally'" },
        { inst: "HDFC India", type: "NRE / NRO", own: "Solo (Nominee: Priya)", last4: "7712", access: "Indian SIM on roaming + 1Password" }
      ],
      invest: [
        { inst: "Fidelity", type: "401(k)", benef: "Priya (100%)", last4: "3310" },
        { inst: "ICICI Direct", type: "Demat / MF", benef: "Nominee: Priya", last4: "8820" }
      ],
      crypto: [
        { platform: "Ledger Nano X + Coinbase", assets: "~0.25 BTC (long-term hold)", access: "Ledger device in blue safe; sealed 24-word metal plate in Pune locker + PIN in 1Password", helper: "Tech friend Arjun Verma (206-555-0139)" }
      ],
      insurance: [
        { type: "Life (work)", co: "MetLife", amt: "$500,000", benef: "Priya", pol: "9102", phone: "800-638-5433", renew: "Employer" },
        { type: "Life (personal)", co: "Banner Life", amt: "$700,000", benef: "Priya", pol: "4418", phone: "800-638-8428", renew: "Oct" },
        { type: "Health", co: "Premera", amt: "Family PPO", benef: "Family", pol: "2219", phone: "800-722-1471", renew: "Jan" }
      ],
      bills: [
        { name: "Rent", amt: "$3,200", due: "1st", how: "Chase Joint auto-debit" },
        { name: "Electric / PSE", amt: "$145", due: "15th", how: "Chase Joint autopay" }
      ],
      call_log: [
        { date: "Sample", who: "David Chen (Immigration)", ref: "Case #I140-882", note: "Confirmed INA 204(l) options and H-4 stay rules" }
      ],
      doclocs: [
        { doc: "Passports, I-797, I-140, OCI cards", where: "Blue fireproof safe (folder #1)", orig: "Originals" },
        { doc: "PAN, Aadhaar & India Will copy", where: "Blue fireproof safe (folder #2)", orig: "Copies + Pune locker" }
      ],
      gov_ids: [
        { who: "Rohan", idtype: "SSN / National ID (Me)", last4: "4812", where: "Card in blue safe + 1Password", exp: "US SSN" },
        { who: "Rohan", idtype: "PAN / Aadhaar (India)", last4: "9034", where: "Blue safe folder #2 + DigiLocker", exp: "India tax/KYC" }
      ],
      kids_info: [
        { child: "Aarav (7)", school: "Cedar Elementary", teacher: "Ms. Brooks · 425-555-0115", pickup: "Priya, Rohan, Sam Ortiz, Ananya", comfort: "Stuffed elephant Ellie + bedtime audiobooks" }
      ],
      fam_health: [
        { name: "Aarav", meds: "Children's Cetirizine (spring)", allergy: "Tree nuts (EpiPen in kitchen drawer)", doc: "Dr. Kim · 425-555-0130", note: "" }
      ],
      pets: [
        { name: "Milo (Golden)", food: "1.5 cups Kirkland Salmon 7am / 6pm", meds: "Heartgard 1st of month", vet: "Eastside Vet · 425-555-0155", sitter: "Sam Ortiz" }
      ]
    },
    customTabs: [
      { id: "tab_demo_visa", label: "Visa & India", title: "Visa, Immigration & Cross-Border" }
    ],
    extra: {
      tab_demo_visa: [
        { type: "field", id: "xd_v1", label: "Visa type, I-797 / I-94 / I-140 / EAD copies location", wide: true },
        { type: "field", id: "xd_v2", label: "Local temporary guardian (while India family travels)", wide: false }
      ]
    },
    f_extra_patch: {
      xd_v1: "H-1B (valid thru 2028) + approved I-140 (EB-2). PDFs in Google Drive 'Immigration' + paper originals in Blue Safe folder #1.",
      xd_v2: "Sam & Claire Ortiz (425-555-0188) have signed notarized WA Temporary Medical Consent letter in safe."
    }
  },
  default: {
    track: "hurt",
    f: {
      q_first: "Jordan Lee (sibling) · 555-0142",
      q_binder: "Fireproof lockbox on top shelf of hall closet",
      q_attorney: "Morgan & Reyes Law · 555-0190",
      q_life: "$750,000 across 2 policies",
      q_runway: "~4 months in joint savings",
      m_monthly: "4,800 / month",
      m_runway: "20,000 in High-Yield Savings ≈ 4 months",
      m_cash: "500 in hall closet lockbox",
      m_tax: "Accountant portal + filing cabinet drawer 2",
      m_first: "Keep joint checking funded from savings so mortgage/rent and utilities clear smoothly.",
      m_payout_first: "Split life insurance payout across 3 FDIC High-Yield Savings accounts ($250k max each) and wait 6–12 months before any big purchases or selling the house.",
      m_payout_payoff: "Pay off high-interest cards or auto loan; pause before paying off a low-rate mortgage.",
      m_payout_advisor: "Hire ONLY a Fee-Only Fiduciary CFP® (paid flat/hourly, zero commissions). Say no to annuities or whole life pitches.",
      m_payout_monthly: "Auto-transfer $4,800/month on the 1st from High-Yield Savings to Joint Checking.",
      d_hcd: "Signed copy in lockbox + saved on primary doctor's portal",
      d_mpoa: "Alex (primary), Jordan Lee (backup)",
      h_portal: "Alex has MyChart proxy access for family records",
      d_will: "Original signed will is in the hall closet lockbox",
      d_exec: "Alex (primary)",
      d_fpoa: "Durable Financial POA in lockbox",
      d_pm: "Bitwarden Family — Emergency Access (3-day wait) set up for Alex",
      d_phone: "Passcode is inside sealed envelope in lockbox",
      d_2fa: "Recovery codes printed inside lockbox folder #2",
      d_sim: "Carrier PIN stored in Bitwarden under 'Mobile Carrier'",
      d_photos: "Shared family photo library + external backup drive in desk drawer",
      hk_water: "Basement stairwell, blue shut-off valve",
      hk_breaker: "Garage right wall behind coat rack",
      hk_spare: "With neighbor Pat (#14)",
      k_call: "Aunt Jordan: 555-0142 · Neighbor Pat: 555-0180",
      k_home: "42 Oak Street, Apt 2B",
      k_safe: "Red Lantern",
      letter: "Take one day at a time. Everything important is mapped out here so you never have to guess."
    },
    lists: {
      first: [
        { name: "Jordan Lee", rel: "Sibling", phone: "555-0142", why: "Hospital support & family updates" },
        { name: "Pat Rivera", rel: "Neighbor", phone: "555-0180", why: "Kids pickup & pet care" }
      ],
      pros: [
        { role: "Estate attorney", name: "Morgan & Reyes Law", phone: "555-0190", email: "estate@example.com", note: "Holds digital copy of will" }
      ],
      accounts: [
        { inst: "Main Street Bank", type: "Checking", own: "Joint", last4: "3190", access: "Joint login in Bitwarden" },
        { inst: "Main Street Bank", type: "Savings", own: "Joint", last4: "7741", access: "Joint login in Bitwarden" }
      ],
      invest: [
        { inst: "Vanguard", type: "Retirement", benef: "Spouse (100%)", last4: "5520" }
      ],
      crypto: [
        { platform: "Ledger Hardware Wallet", assets: "~0.1 BTC", access: "Device + metal backup sheet inside hall closet lockbox (PIN in Bitwarden)", helper: "Jordan Lee (555-0142) knows steps" }
      ],
      gov_ids: [
        { who: "Me", idtype: "SSN / National ID (Me)", last4: "6719", where: "Card in hall closet lockbox", exp: "Never type full SSN" }
      ],
      insurance: [
        { type: "Life (personal)", co: "TermCo", amt: "750,000", benef: "Spouse", pol: "6012", phone: "555-0170", renew: "Nov" }
      ],
      bills: [
        { name: "Mortgage / rent", amt: "2,100", due: "1st", how: "Joint checking autopay" },
        { name: "Electric", amt: "120", due: "14th", how: "Joint checking autopay" }
      ],
      kids_info: [
        { child: "Leo (6)", school: "Oakview Primary", teacher: "Mr. Diaz · 555-0112", pickup: "Parents, Jordan Lee, Pat Rivera", comfort: "Blue blanket + bedtime story" }
      ],
      fam_health: [
        { name: "Leo", meds: "None", allergy: "Peanuts (EpiPen in pantry)", doc: "Dr. Patel · 555-0133", note: "" }
      ],
      pets: [
        { name: "Pepper (Cat)", food: "1/2 cup kibble morning & night", meds: "None", vet: "Oak Vet · 555-0166", sitter: "Pat Rivera" }
      ]
    }
  }
};

const DICE_WORDS = [
  "acorn","amber","anchor","apple","apron","arbor","arrow","aspen","atlas","attic","audio","autumn","avocado","award","awning","azalea",
  "badge","bagel","baker","bamboo","banana","banner","banjo","banyan","barley","barrel","basket","beacon","beaver","beetle","belfry","bench",
  "berry","bicycle","birch","biscuit","bison","blanket","blazer","blossom","bluejay","bobcat","bonnet","bonsai","boulder","branch","breeze","bridge",
  "bright","brook","bucket","buckle","buffalo","bullet","bundle","bunker","butter","button","cabin","cactus","candle","canopy","canyon","canvas",
  "caper","capsule","captain","carbon","carpet","carrot","carton","cascade","cashew","castle","catalog","cattle","cedar","celery","cement","center",
  "ceramic","chalet","chalk","chance","channel","chapter","charm","cherry","chess","chimney","chisel","cider","cinema","circle","citron","citrus",
  "clamor","clasp","clever","cliff","climate","clover","cluster","cobalt","cobble","coconut","coffee","collar","colony","column","comet","compass",
  "condor","copper","coral","cornet","cotton","cougar","county","couple","cousin","covert","cradle","crafty","crater","crayon","creek","cricket",
  "crimson","crystal","cuckoo","cupcake","curtain","cushion","custom","cypress","dagger","dahlia","daisy","dancer","dandelion","daring","dawn","dewdrop",
  "decoy","deer","delta","denim","desert","design","dial","diamond","diesel","dinner","diploma","direct","dolphin","domino","donkey","double",
  "dragon","drawer","drift","drizzle","drum","dugong","dune","eagle","early","earth","easel","echo","eddy","elder","ember","emerald",
  "empire","encore","engine","enigma","envy","epoch","equinox","ermine","estate","everest","fable","fabric","falcon","famous","farmer","fathom",
  "feather","fennel","ferret","ferry","festival","fiber","fiddle","field","figment","filter","finch","firefly","fjord","flannel","flavor","flicker",
  "flight","flint","flower","flute","foam","focus","folder","foliage","fondant","forest","fossil","fountain","foxglove","frame","frost","fudge",
  "funnel","future","gadget","galaxy","gallery","gallon","garden","garland","garlic","garnet","gazebo","gecko","gemstone","genius","gentle","gerbil",
  "geyser","ginger","giraffe","glacier","glade","glider","glitter","globe","gopher","gospel","gossip","gourd","granite","grape","gravel","gravity"
];
