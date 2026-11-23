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
    fieldOverrides: {},
    listOverrides: {},
    stepOverrides: {}
  },
  us_in: {
    label: "US + India (H-1B / Visa / NRI)",
    emergency: "911",
    currency: "$ / ₹",
    crossBorder: true,
    indiaNotes: true,
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
      doclocs: { hint: "Include I-797, I-94, I-140/I-485, EAD, Passports, OCI cards, PAN, Aadhaar, and both US & India Wills.", extraSuggestions: ["PAN Card", "Aadhaar Card", "OCI Card", "I-797 / I-94 / I-140", "India Property Sale Deed"] }
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
      doclocs: { hint: "Include PAN card, Aadhaar card, Passports, Property sale deed, Demat/Share details, and latest ITRs.", extraSuggestions: ["PAN Card", "Aadhaar Card", "Property Sale Deed", "Demat / Share Certificates", "Ration / Voter ID"] }
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
    fieldOverrides: {
      d_will: { label: "Host-country & Home-country Wills: where originals are" },
      d_guard: { label: "Local temporary guardian & permanent guardian" }
    },
    listOverrides: {
      accounts: { hint: "List both host-country and home-country bank accounts. Mark Joint vs. Solo." },
      doclocs: { hint: "Include visas/residence permits, work permits, passports, birth/marriage certificates (apostilled), and both country wills." }
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
    fieldOverrides: {
      m_monthly: { ph: "e.g. about £4,200 / month" },
      w_hsa: { label: "Private health / dental / cash plan" },
      d_hcd: { label: "Advance Decision / Lasting Power of Attorney (Health & Welfare)" },
      d_fpoa: { label: "Lasting Power of Attorney (Property & Financial Affairs)" },
      k_911: { label: "If someone is hurt", ph: "Call 999 (or 112). Say your name, our address, and what happened." }
    },
    listOverrides: {
      invest: { hint: "Workplace pensions, SIPP, Stocks & Shares ISA, LISA, Premium Bonds. Check Expression of Wishes forms.", extraSuggestions: ["Stocks & Shares ISA", "SIPP", "Workplace Pension", "Premium Bonds"] },
      doclocs: { hint: "Include Passports, Birth/Marriage certificates, NI numbers, Property title deeds, and LPA documents.", extraSuggestions: ["National Insurance #", "LPA Documents"] }
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
    fieldOverrides: {
      w_hsa: { label: "Extended health / HSA / group benefits" },
      d_hcd: { label: "Personal / Healthcare Directive & Representation Agreement" },
      d_fpoa: { label: "Enduring Power of Attorney (Financial)" }
    },
    listOverrides: {
      invest: { hint: "RRSP, TFSA, RESP, FHSA, LIRA, non-registered accounts. Verify designated beneficiaries.", extraSuggestions: ["RRSP", "TFSA", "RESP", "FHSA"] },
      doclocs: { hint: "Include SIN cards, Passports, Birth/Marriage certificates, Provincial health cards, and NOAs (CRA).", extraSuggestions: ["SIN Card", "CRA Notice of Assessment"] }
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
    fieldOverrides: {
      w_hsa: { label: "Private hospital / extras cover" },
      d_hcd: { label: "Advance Care Directive & Enduring Guardian" },
      k_911: { label: "If someone is hurt", ph: "Call 000 (Triple Zero). Say your name, our address, and what happened." }
    },
    listOverrides: {
      invest: { hint: "Superannuation funds, SMSF, shares/ETFs. Check whether Super has a Binding Death Benefit Nomination (super sits outside the will!).", extraSuggestions: ["Superannuation", "SMSF", "Shares / ETFs"] },
      doclocs: { hint: "Include Passports, Birth/Marriage certificates, TFN, Medicare card, Super statements, and Title deeds.", extraSuggestions: ["TFN / Medicare Card", "Super Binding Nomination"] }
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
    fieldOverrides: {
      w_hsa: { label: "Supplemental health insurance" },
      k_911: { label: "If someone is hurt", ph: "Call 112. Say your name, our address, and what happened." }
    },
    listOverrides: {
      invest: { hint: "State/occupational pensions, brokerage, savings. Check inheritance/forced-heirship rules in your country." }
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
    fieldOverrides: {
      w_hsa: { label: "Health savings / medical benefits" },
      k_911: { label: "If someone is hurt", ph: "Call local emergency services. Say your name, our address, and what happened." }
    },
    listOverrides: {},
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
      d_hcd: "Signed copy in lockbox + saved on primary doctor's portal",
      d_mpoa: "Alex (primary), Jordan Lee (backup)",
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
