/*
  FAMILY FIELD GUIDE · CONTENT
  ----------------------------------------------------------------
  Everything you see in the app is defined here, so you can extend it
  in code (see README.md → "Extending the guide").

  Block types you can use inside a tab's `blocks`:
    { type:"fields", title, hint?, fields:[ [id, label, placeholder?, wide?] ] }
    { type:"list",   id, title, hint?, crisisEditable?, cols:[ [key, label] ], seed:[ {key:value} ] }
    { type:"glance" }  { type:"playbook" }  { type:"scripts" }  { type:"letter" }  { type:"kids" }

  Rules: every id must be unique and never renamed once you've used it
  (saved answers are keyed by id). This file holds no personal data.
  General guidance only, not legal, tax or financial advice.
*/

const PLAYBOOK = {
  hurt: {
    label: "I'm in the hospital or can't communicate",
    phases: [
      { when: "First hours", steps: [
        { id: "h1", t: "Make sure you and the kids are safe", d: "Call 911 if anyone is in danger. It's okay to let someone else drive or make calls for you.", ref: "Contacts → First people to call", refTab: "contacts", refBlock: "first" },
        { id: "h2", t: "Arrange care for the kids", d: "Call the person listed for school pickup and overnight care. Use the safe word.", ref: "For the kids", refTab: "kids", refBlock: "" },
        { id: "h3", t: "Bring my medical papers to the hospital", d: "My healthcare directive and medical power of attorney let you speak for me. Bring my insurance card, ID, and medication list.", ref: "Health → My medical info", refTab: "health", refBlock: "My medical info" },
        { id: "h3b", t: "Start a call log", d: "Write down who you talked to, when, and what they said. Hospitals and insurers will ask.", ref: "Start here → Call & claim log", refTab: "start", refBlock: "call_log" }
      ]},
      { when: "First day or two", steps: [
        { id: "h4", t: "Call my employer's HR", d: "Ask about sick leave, short‑term disability, FMLA job protection, and how my paycheck continues.", ref: "Money → Work benefits", refTab: "money", refBlock: "Work benefits" },
        { id: "h5", t: "Check that bills are still on autopay", d: "Nothing needs to change right away. Look over the bills list so nothing is missed.", ref: "Money → Bills & autopay", refTab: "money", refBlock: "bills" },
        { id: "h6", t: "Pick one person to share updates", d: "They tell everyone else, so you're not repeating hard news.", ref: "Contacts → First people to call", refTab: "contacts", refBlock: "first" }
      ]},
      { when: "First weeks", steps: [
        { id: "h7", t: "Use the financial power of attorney if needed", d: "If you need to manage accounts only in my name, this document lets you act for me. Call our attorney if a bank pushes back.", ref: "Documents → Legal papers", refTab: "docs", refBlock: "Legal papers" },
        { id: "h8", t: "File disability or insurance claims", d: "Check my disability and any accident or critical‑illness policies.", ref: "Money → Insurance", refTab: "money", refBlock: "insurance" },
        { id: "h9", t: "Ask the hospital for a social worker", d: "They help with insurance questions, rehab placement, and paperwork. It's a free service.", ref: "" }
      ]}
    ]
  },
  gone: {
    label: "I have passed away",
    phases: [
      { when: "First hours", steps: [
        { id: "g1", t: "Let yourself stop", d: "You don't have to decide anything big today. Call the first person on the list and let them help.", ref: "Contacts → First people to call", refTab: "contacts", refBlock: "first" },
        { id: "g2", t: "Arrange care for the kids", d: "Ask someone they trust to be with them. There's a page written for them.", ref: "For the kids", refTab: "kids", refBlock: "" },
        { id: "g3", t: "Read my wishes", d: "My preferences for a funeral, burial or cremation, and a service are written down.", ref: "Documents → My wishes", refTab: "docs", refBlock: "My wishes" }
      ]},
      { when: "First 72 hours", steps: [
        { id: "g4", t: "Contact the funeral home", d: "They help with arrangements and ordering death certificates. Ask for 10 to 15 certified copies; banks and insurers each want one.", ref: "Documents → My wishes", refTab: "docs", refBlock: "My wishes" },
        { id: "g5", t: "Call my employer's HR", d: "Ask about final pay, group life insurance, retirement accounts, and health coverage for you and the kids.", ref: "Money → Work benefits", refTab: "money", refBlock: "Work benefits" },
        { id: "g6", t: "Keep the home running", d: "Keep paying the mortgage or rent, insurance, and utilities. Keep joint checking open so final paychecks or reimbursements can be deposited; solo accounts may freeze when notified.", ref: "Money → Bills & autopay", refTab: "money", refBlock: "bills" },
        { id: "g6b", t: "Keep my phone charged and on", d: "Many accounts send login codes to it. Don't cancel the line yet.", ref: "Documents → Getting into things", refTab: "docs", refBlock: "Getting into things" }
      ]},
      { when: "First weeks", steps: [
        { id: "g7", t: "Call our estate attorney", d: "They'll walk you through the will or trust and what happens next. Bring the will.", ref: "Contacts → Professionals", refTab: "contacts", refBlock: "pros" },
        { id: "g8", t: "File life insurance claims", d: "Each policy needs a claim form and a death certificate.", ref: "Money → Insurance", refTab: "money", refBlock: "insurance" },
        { id: "g8b", t: "Don't rush to pay solo unsecured debts", d: "Credit cards and medical bills solely in my name belong to the estate, not you personally. Keep paying joint bills and essentials, and ask our attorney before paying solo debts.", ref: "Money → Credit cards", refTab: "money", refBlock: "cards" },
        { id: "g9", t: "Contact Social Security", d: "You and the kids may be eligible for survivor benefits. Call 1‑800‑772‑1213.", ref: "" },
        { id: "g10", t: "Get help with accounts and taxes", d: "Our financial advisor and accountant can help move accounts and plan the tax return.", ref: "Contacts → Professionals", refTab: "contacts", refBlock: "pros" }
      ]},
      { when: "First 90 days", steps: [
        { id: "g11", t: "Protect my identity", d: "Send a death certificate to Equifax, Experian, and TransUnion so no one opens credit in my name.", ref: "" },
        { id: "g12", t: "Retitle the house and cars", d: "Our attorney can tell you what's needed for each.", ref: "Money → Property & vehicles", refTab: "money", refBlock: "property" },
        { id: "g13", t: "Cancel my subscriptions and memberships", d: "Use the list so nothing keeps charging.", ref: "Money → Subscriptions", refTab: "money", refBlock: "subs" },
        { id: "g14", t: "Update your own beneficiaries and will", d: "Your accounts probably name me. Update them when you're ready.", ref: "" },
        { id: "g15", t: "Hold off on big decisions", d: "Selling the house, moving, or large money choices can wait several months. Grief support helps; you don't have to do this alone.", ref: "" }
      ]}
    ]
  },
  money: {
    label: "Money emergency (job loss, big bill)",
    phases: [
      { when: "First week", steps: [
        { id: "m1", t: "Know your runway", d: "Compare emergency savings to our monthly spending. That's how many months you have.", ref: "Money → The big picture", refTab: "money", refBlock: "The big picture" },
        { id: "m2", t: "File for unemployment", d: "Apply with the state right away if a job ended; benefits usually start from the date you file.", ref: "" },
        { id: "m3", t: "Sort out health insurance", d: "Ask about COBRA (you usually have 60 days to elect it) and compare marketplace plans.", ref: "Money → Work benefits", refTab: "money", refBlock: "Work benefits" }
      ]},
      { when: "First month", steps: [
        { id: "m4", t: "Trim to the essentials", d: "Housing, food, utilities, insurance, minimum debt payments. Pause the rest.", ref: "Money → Subscriptions", refTab: "money", refBlock: "subs" },
        { id: "m5", t: "Call lenders before you miss a payment", d: "Ask about hardship programs. They're more flexible when you call early.", ref: "Money → Debts & loans", refTab: "money", refBlock: "debts" },
        { id: "m6", t: "Avoid cashing out retirement", d: "Early withdrawals usually come with taxes and penalties. Talk to our advisor first.", ref: "Contacts → Professionals", refTab: "contacts", refBlock: "pros" }
      ]}
    ]
  },
  caregiver: {
    label: "Both of us are unreachable (Caregiver)",
    phases: [
      { when: "Right now", steps: [
        { id: "c1", t: "Make sure everyone is safe", d: "If there's a medical or safety emergency, call 911 and read our home address from the kids page.", ref: "For the kids", refTab: "kids", refBlock: "" },
        { id: "c2", t: "Call our first emergency contact", d: "Let a trusted local adult know where we are and ask them to come over or coordinate.", ref: "Contacts → First people to call", refTab: "contacts", refBlock: "first" },
        { id: "c3", t: "Reassure the kids", d: "Use our safe word so they know you're a trusted helper, and stick to their comfort routine.", ref: "For the kids", refTab: "kids", refBlock: "" }
      ]},
      { when: "First hours", steps: [
        { id: "c4", t: "Find medical consent and guardian papers", d: "Hospitals need a signed medical consent or temporary guardian letter before treating the kids.", ref: "Documents → Legal papers", refTab: "docs", refBlock: "Legal papers" },
        { id: "c5", t: "Check allergies, medications, and school pickup", d: "Review everyone's medical details and let the school know who is picking up.", ref: "Health → Everyone in the family", refTab: "health", refBlock: "fam_health" },
        { id: "c6", t: "Take care of pets and the house", d: "Check feeding schedules, medications, and alarm/key notes.", ref: "Documents → Pets", refTab: "docs", refBlock: "pets" }
      ]},
      { when: "If we're delayed or hospitalized", steps: [
        { id: "c7", t: "Notify our estate attorney and backup guardian", d: "They can step in with legal authority if both of us are incapacitated.", ref: "Contacts → Professionals", refTab: "contacts", refBlock: "pros" },
        { id: "c8", t: "Keep a log of calls and decisions", d: "Note who you spoke with, medical updates, and expenses.", ref: "Start here → Call & claim log", refTab: "start", refBlock: "call_log" }
      ]}
    ]
  },
  visa: {
    label: "Work visa / cross-border emergency (H-1B, NRI, Expat)",
    phases: [
      { when: "First 48 hours", steps: [
        { id: "v1", t: "Check dependent visa status & grace-period clock", d: "If a primary visa holder (e.g., H-1B, L-1, Skilled Worker) passes away or loses employment, dependents (e.g., H-4, L-2) can face an immediate status change or 60-day clock. Contact an immigration attorney before leaving the country.", ref: "Contacts → Professionals", refTab: "contacts", refBlock: "pros" },
        { id: "v2", t: "Secure passports, visa papers & kids' temporary care", d: "Locate I-797/I-94/I-140, passports, EADs, and OCI/residency cards. If both parents are incapacitated, call the local temporary guardian right away so kids stay with trusted adults while overseas family arranges visas.", ref: "Documents → Where every document is", refTab: "docs", refBlock: "doclocs" },
        { id: "v3", t: "Contact the home-country Embassy or Consulate if needed", d: "Embassies assist with emergency travel documents, repatriation of remains, and notarized cross-border letters.", ref: "Contacts → Professionals", refTab: "contacts", refBlock: "pros" }
      ]},
      { when: "First weeks", steps: [
        { id: "v4", t: "Call employer HR & company immigration counsel", d: "Request copies of all immigration filings (I-140, PERM, I-485, I-797) and ask about survivor relief (e.g., INA § 204(l)), final pay, and group life insurance.", ref: "Money → Work benefits", refTab: "money", refBlock: "Work benefits" },
        { id: "v5", t: "Check both host-country and home-country wills", d: "Cross-border families often have separate wills for each country. Confirm neither revokes the other, and ask a cross-border attorney about non-citizen estate tax rules (e.g., $60k NRA threshold in the US) before moving assets.", ref: "Documents → Legal papers", refTab: "docs", refBlock: "Legal papers" },
        { id: "v6", t: "Map overseas accounts, nominees & property", d: "List NRE/NRO/FCNR, Demat, EPF/PPF, foreign bank accounts, and property. Note that in countries like India, a bank/demat nominee is often only a custodian—legal heirs/will govern final ownership.", ref: "Money → Bank accounts", refTab: "money", refBlock: "accounts" }
      ]}
    ]
  }
};

const SCRIPTS = [
  ["Calling a bank or insurer", "\"I'm calling about my spouse's account. They are [in the hospital / have passed away]. I have [power of attorney / a death certificate]. What do you need from me, and can you send it in writing?\""],
  ["Calling an immigration attorney about dependent status", "\"My spouse is on [H-1B / L-1 / work visa] and [is hospitalized / lost their job / has passed away]. I am on [H-4 / dependent status] and our pending filings are [I-140 / I-485 / none]. What are our exact deadlines and options before we make any travel or filing moves?\""],
  ["When someone pushes you to decide", "\"I'm not making any decisions right now. Please send me the details and I'll get back to you.\""],
  ["When a debt collector calls about a solo debt", "\"This account was solely in my spouse's name. Please send all documentation in writing to the estate, and I will have our attorney review it.\""],
  ["Asking a friend for help", "\"Could you take over [meals / school runs / phone calls] this week? It would help me a lot.\""],
  ["Telling the kids", "\"Something hard happened. You are safe and you are loved, and we'll take care of each other. You can ask me anything.\""]
];

const TABS = [
  { id: "start", label: "Start here", title: "Start here", lede: "The most important things first. Then pick what's happening and check things off as you go.",
    blocks: [
      { type: "glance" },
      { type: "playbook" },
      { type: "list", id: "call_log", title: "Call & claim log", hint: "Keep track of hospitals, banks, insurers, and reference numbers. Editable even in Read mode.",
        cols: [["date","Date"],["who","Who / Organization"],["ref","Case / Ref #"],["note","What they said & next step"]], seed: [{}], crisisEditable: true },
      { type: "scripts" },
      { type: "letter" }
    ] },

  { id: "contacts", label: "Contacts", title: "Who to call", lede: "The people who can help, and what each one is for.",
    blocks: [
      { type: "list", id: "first", title: "First people to call", hint: "Calm, trusted people who can come over or take charge of calls.",
        cols: [["name","Name"],["rel","Relationship"],["phone","Phone"],["why","They can help with"]], seed: [{}, {}] },
      { type: "list", id: "pros", title: "Professionals", hint: "Add each person's firm and phone. Delete any you don't have.",
        cols: [["role","Role"],["name","Name / firm"],["phone","Phone"],["email","Email"],["note","Notes"]],
        seed: [{role:"Estate attorney"},{role:"Financial advisor"},{role:"Accountant / tax preparer"},{role:"Employer HR"},{role:"Insurance agent"},{role:"Primary doctor"}],
        suggestCol: "role",
        suggestions: ["Immigration attorney", "Pediatrician", "Dentist", "Optometrist", "Mortgage broker", "Property manager", "Veterinarian", "Trusted tech helper"] },
      { type: "list", id: "circle", title: "Wider circle to notify", hint: "Family, close friends, my manager, groups I'm part of, and any online friends or communities (Discord, gaming, forums).",
        cols: [["name","Name / group"],["phone","Phone or email"],["who","Who should tell them"]], seed: [{}] }
    ]},

  { id: "money", label: "Money", title: "Money & insurance", lede: "What we have, where it is, and what keeps getting paid. Last 4 digits only.",
    blocks: [
      { type: "fields", title: "The big picture", fields: [
        ["m_monthly","Our usual monthly spending","e.g. about $6,500 / month"],
        ["m_runway","Emergency savings & months it covers","e.g. $20,000 ≈ 3 months"],
        ["m_cash","Emergency cash and where it is","e.g. $1,000 in the safe"],
        ["m_tax","Where tax returns are kept","e.g. accountant's portal + filing cabinet"],
        ["m_income","Income sources","My salary, your salary, rental…", true],
        ["m_first","What to do with money first","e.g. Move $X from savings to checking to cover 3 months", true]
      ]},
      { type: "fields", title: "Work benefits", hint: "Check my employer's benefits site or HR for exact amounts.", fields: [
        ["w_employer","Employer & benefits website",""],["w_life","Group life insurance amount",""],
        ["w_disab","Short / long‑term disability",""],["w_hsa","HSA / FSA balance & provider",""],
        ["w_stock","Stock options / RSUs / bonus owed","", true]
      ]},
      { type: "list", id: "accounts", title: "Bank accounts", hint: "Note Joint vs. Solo: solo accounts often freeze upon death; keep joint checking open for incoming paychecks.",
        cols: [["inst","Bank"],["type","Type"],["own","Owner / joint"],["last4","Last 4"],["access","How to access"]],
        seed: [{type:"Checking"},{type:"Savings"}],
        suggestCol: "type",
        suggestions: ["High-Yield Savings", "Money Market", "CD / Fixed Deposit", "Joint Bill-Pay Checking", "HSA / FSA Cash", "Kids Savings", "NRE / NRO / Foreign Bank"] },
      { type: "list", id: "invest", title: "Retirement & investments", hint: "Named beneficiaries on retirement accounts override your will—verify them annually.",
        cols: [["inst","Company"],["type","Type (401k, IRA…)"],["benef","Beneficiary"],["last4","Last 4"]], seed: [{}],
        suggestCol: "type",
        suggestions: ["401(k) / 403(b)", "Traditional / Roth IRA", "Taxable Brokerage", "529 College Plan", "HSA Investments", "RSUs / ESPP / Stock Options", "Pension / Annuity", "Crypto / TreasuryDirect"] },
      { type: "list", id: "insurance", title: "Insurance", hint: "Health, Dental, Vision, Life, Disability, Accident (AD&D), Hospital Indemnity, Critical Illness, Home, Auto, Umbrella. Named beneficiaries override your will—verify annually.",
        cols: [["type","Type"],["co","Company"],["amt","Coverage"],["benef","Beneficiary"],["pol","Policy (last 4)"],["phone","Claims phone"],["renew","Renews"]],
        seed: [{type:"Life (work)"},{type:"Life (personal)"},{type:"Health"},{type:"Dental"},{type:"Vision"},{type:"Disability (STD / LTD)"},{type:"Accident (AD&D)"},{type:"Hospital Indemnity / Critical Illness"},{type:"Home / renters"},{type:"Auto"}],
        suggestCol: "type",
        suggestions: ["Umbrella Liability", "Long-Term Care", "Pet Insurance", "Flood / Earthquake", "Travel / Credit-Card Protection", "Jewelry / Valuables Rider", "Term Life (Spouse)", "Home Warranty"] },
      { type: "list", id: "bills", title: "Bills & autopay",
        cols: [["name","Bill"],["amt","Amount"],["due","Due"],["how","Paid from / autopay?"]],
        seed: [{name:"Mortgage / rent"},{name:"Electric"},{name:"Gas (Natural gas / propane)"},{name:"Water"},{name:"Trash / sewer"},{name:"Phone"},{name:"Internet"}],
        suggestCol: "name",
        suggestions: ["HOA / Condo dues", "Property tax (if not escrowed)", "Home security / alarm", "Childcare / Tuition", "Lawn / Snow / Pest control", "Car payment", "Solar / Lease", "Storage unit"] },
      { type: "list", id: "cards", title: "Credit cards", hint: "Authorized users lose access upon death. Solo unsecured card balances belong to the estate—ask the attorney before paying.",
        cols: [["issuer","Issuer"],["last4","Last 4"],["own","Whose name / joint"],["autopay","Autopay?"]], seed: [{}] },
      { type: "list", id: "debts", title: "Debts & loans", hint: "Mortgage, HELOC, auto, student, personal, or money someone owes you. Note whether each debt is Joint or Solo.",
        cols: [["name","Lender"],["type","Type"],["bal","Approx. balance"],["note","Notes"]],
        seed: [{type:"Mortgage"},{type:"HELOC"},{type:"Auto loan"}],
        suggestCol: "type",
        suggestions: ["Second Mortgage / Home Equity", "Student Loan", "Personal Loan", "401(k) Loan", "Solar / Home Improvement Loan", "Business Loan", "Money Owed TO Us (Loaned Out)"] },
      { type: "list", id: "property", title: "Property & vehicles",
        cols: [["what","What"],["title","Whose name on title"],["loan","Loan?"],["where","Where the title is"]],
        seed: [{what:"Home"},{what:"Car 1"}],
        suggestCol: "what",
        suggestions: ["Car 2", "Motorcycle / Boat / RV", "Rental / Investment Property", "Safe Deposit Box (Bank & Key)", "Storage Unit", "Jewelry / Gold / Heirlooms", "Firearms / Collectibles"] },
      { type: "list", id: "subs", title: "Subscriptions", hint: "Streaming, software, gyms, memberships. Things to cancel or keep.",
        cols: [["name","Service"],["cost","Cost"],["card","Charged to"],["keep","Keep or cancel"]], seed: [{}],
        suggestCol: "name",
        suggestions: ["Cloud Storage (iCloud / Google / Dropbox)", "Password Manager", "Amazon Prime / Costco", "Streaming (Netflix / Spotify)", "Gym / Club", "Domain / Web Hosting", "News / Software"] }
    ]},

  { id: "health", label: "Health", title: "Health", lede: "What a doctor or hospital will ask about each of us.",
    blocks: [
      { type: "fields", title: "My medical info", fields: [
        ["d_hcd","Healthcare directive / living will: where",""],["d_mpoa","Medical power of attorney: who",""],
        ["d_ins","Health insurance card & member portal",""],["h_pharm","Pharmacy",""],
        ["d_meds","My medications, conditions & allergies","",true],["h_wishes","My wishes about life support","",true]
      ]},
      { type: "list", id: "fam_health", title: "Everyone in the family", cols: [["name","Name"],["meds","Medications"],["allergy","Allergies"],["doc","Doctor & phone"],["note","Notes"]], seed: [{}, {}] }
    ]},

  { id: "docs", label: "Documents & home", title: "Papers, passwords & the house", lede: "Where the originals live and how to get into things.",
    blocks: [
      { type: "fields", title: "Legal papers", fields: [
        ["d_will","Will / trust: where the original is",""],["d_exec","Executor / trustee",""],
        ["d_fpoa","Financial power of attorney",""],["d_guard","Guardian named for the kids",""]
      ]},
      { type: "fields", title: "Getting into things", hint: "Instructions only. Never the passwords themselves.", fields: [
        ["d_pm","Password manager & emergency access","e.g. you're set as my emergency contact"],
        ["d_phone","My phone: how to unlock","e.g. code is in the sealed envelope in the safe"],
        ["d_2fa","Two‑factor / recovery codes","where they're kept"],
        ["d_safe","Safe / lockbox: location & key",""],
        ["d_email","My main email account",""],
        ["d_legacy","Legacy contacts set up","e.g. Apple, Google, Facebook"],
        ["d_sim","Mobile carrier & account / SIM PIN","where the PIN is kept so the phone number isn't lost"],
        ["d_keys","Hardware security keys / passkeys","e.g. YubiKey location & PIN"],
        ["d_photos","Where family photos & videos live","e.g. iCloud, Google Photos, NAS, external hard drive"],
        ["d_social","Social media wishes","memorialize, download archive, or delete"]
      ]},
      { type: "list", id: "doclocs", title: "Where every document is", cols: [["doc","Document"],["where","Location"],["orig","Original or copy"]],
        seed: [{doc:"Birth certificates"},{doc:"Passports"},{doc:"Social Security cards"},{doc:"Marriage certificate"},{doc:"Deed / lease"},{doc:"Car titles"},{doc:"Recent tax returns"}],
        suggestCol: "doc",
        suggestions: ["Mortgage / HELOC note", "Insurance policy packets", "Car registration", "Vaccination / immunization records", "Citizenship / Naturalization / Visa / OCI", "Divorce / Adoption decrees", "Military DD-214", "Safe deposit box key"] },
      { type: "fields", title: "My wishes", fields: [
        ["d_funeral","Preferred funeral home",""],
        ["d_organ","Organ donation",""],
        ["d_prepaid","Pre‑paid funeral / plot receipts","where receipts or contracts are kept"],
        ["d_charity","Charity in lieu of flowers","exact charity name"],
        ["d_wishes","Burial or cremation, the service, music, who should speak","",true]
      ]},
      { type: "list", id: "home", title: "Running the house", hint: "Utilities, repairs, cars, yard, security.",
        cols: [["what","What"],["who","Company / person"],["phone","Phone"],["note","Notes"]],
        seed: [{what:"Electric"},{what:"Gas"},{what:"Water"},{what:"Internet"},{what:"Plumber / handyman"},{what:"HVAC / furnace"},{what:"Car service"},{what:"Alarm / security"}],
        suggestCol: "what",
        suggestions: ["Electrician", "Roofer", "HOA Management", "Lawn / Landscaping", "Pest Control", "Pool / Septic / Well", "Appliance Warranties"] },
      { type: "fields", title: "House know‑how", fields: [
        ["hk_water","Water shut‑off valve",""],
        ["hk_gas","Gas shut‑off valve",""],
        ["hk_breaker","Breaker panel",""],
        ["hk_spare","Spare keys",""],
        ["hk_trash","Trash & recycling days",""],
        ["hk_quirks","House quirks, alarm & smart lock overrides","e.g. how to open smart lock if battery dies, alarm disarm", true]
      ]},
      { type: "photos", id: "visual_refs", title: "Visual reference photos", hint: "Optional encrypted photos of your water/gas shut‑off valve, breaker panel, health insurance cards, or pet meds. Compressed locally (~80–120 KB each) and encrypted inside your backups." },
      { type: "list", id: "pets", title: "Pets", hint: "Food brand, schedule, medications, vet, microchip number, and behavioral quirks.", cols: [["name","Name"],["food","Food & schedule"],["meds","Meds"],["vet","Vet & phone"],["sitter","Backup caretaker"]], seed: [{}] }
    ]},

  { id: "kids", label: "For the kids", title: "For the kids", lede: "A page written for them. Simple words, big letters.",
    blocks: [
      { type: "kids" },
      { type: "list", id: "kids_info", title: "School & care details (for grown‑ups)", cols: [["child","Child"],["school","School / daycare"],["teacher","Teacher & phone"],["pickup","Authorized pickup"],["comfort","Comfort item / what helps"]], seed: [{}] }
    ]}
];

const GLANCE = [
  ["q_first","Call first","Name & phone"],
  ["q_binder","Where the papers are","e.g. fireproof box, hall closet"],
  ["q_attorney","Our attorney","Name & phone"],
  ["q_life","Total life insurance","e.g. $1M across 2 policies"],
  ["q_runway","Months of savings","e.g. about 4 months"]
];

const KIDS = [
  ["k_call","📞","Grown‑ups you can call","Grandma: 555‑…"],
  ["k_home","🏠","Our address","So you can tell a helper or 911"],
  ["k_911","🚑","If someone is hurt","Call 911. Say your name, our address, and what happened."],
  ["k_school","🎒","Who picks you up","Their name and phone"],
  ["k_safe","🔑","Our safe word","Only trusted grown‑ups know it"],
  ["k_routine","🌙","Your routine","Bedtime, favorite things, what helps you feel better"],
  ["k_note","💛","A note from me","Something you want them to hear"]
];

const ESSENTIALS = [
  { id: "q_first", type: "field", label: "First person to call", tab: "start", block: "If you read nothing else" },
  { id: "q_binder", type: "field", label: "Where papers live", tab: "start", block: "If you read nothing else" },
  { id: "d_phone", type: "field", label: "How to unlock my phone", tab: "docs", block: "Getting into things" },
  { id: "d_pm", type: "field", label: "Password manager access", tab: "docs", block: "Getting into things" },
  { id: "d_hcd", type: "field", label: "Healthcare directive", tab: "health", block: "My medical info" },
  { id: "accounts", type: "list", label: "Bank accounts", tab: "money", block: "accounts" },
  { id: "insurance", type: "list", label: "Insurance policies", tab: "money", block: "insurance" },
  { id: "bills", type: "list", label: "Bills & autopay", tab: "money", block: "bills" },
  { id: "d_will", type: "field", label: "Will / trust location", tab: "docs", block: "Legal papers" },
  { id: "letter", type: "field", label: "A note to you", tab: "start", block: "A note to you" }
];

const SECTION_TEMPLATES = [
  {
    name: "Visa, Immigration & Cross-Border (H-1B / NRI)",
    desc: "Visa filings, dependent status, OCI, separate wills, NRE/NRO & local guardian",
    fields: [
      { label: "Visa type, I-797 / I-94 / I-140 / EAD copies location", wide: true },
      { label: "Employer immigration firm & personal immigration attorney", wide: false },
      { label: "Dependent visa (H-4 / L-2) & grace-period / INA 204(l) notes", wide: false },
      { label: "Kids' passports, OCI cards & local temporary guardian (while overseas family travels)", wide: true },
      { label: "Separate wills (Host country & Home country — non-revoking)", wide: false },
      { label: "Home-country Embassy / Consulate emergency contact", wide: false }
    ],
    lists: [
      { title: "Overseas accounts (NRE/NRO, Demat, EPF/PPF, PAN/Aadhaar)", cols: ["Institution / Type", "Account (last 4)", "Nominee / Joint", "How to access"] },
      { title: "Home-country property & trusted local contacts", cols: ["Property / Contact", "City", "Phone / Details", "Notes"] }
    ]
  },
  {
    name: "Smart Home & Wi‑Fi",
    desc: "Router, smart locks, alarm codes, cameras, automations",
    fields: [
      { label: "Wi‑Fi network & router admin location", wide: false },
      { label: "Smart lock physical key / battery override", wide: false },
      { label: "Alarm & security camera disarm instructions", wide: true },
      { label: "Smart hubs or automations to turn off", wide: true }
    ],
    lists: [
      { title: "Smart devices & apps", cols: ["Device / system", "App / account", "Where override is"] }
    ]
  },
  {
    name: "Crypto, Domains & Homelab",
    desc: "Hardware wallets (map only), domains, servers, tech helper",
    fields: [
      { label: "Hardware wallet & seed phrase map (NEVER raw seed)", wide: true },
      { label: "Domains, registrar & hosting location", wide: false },
      { label: "Tech‑savvy friend to call for help", wide: false },
      { label: "Servers / NAS graceful shutdown plan", wide: true }
    ],
    lists: [
      { title: "Crypto & tech accounts", cols: ["Service / wallet", "Where keys live", "What to do"] }
    ]
  },
  {
    name: "Small Business / Freelance",
    desc: "Business partner, bank, payroll, clients, succession plan",
    fields: [
      { label: "Business partner & phone", wide: false },
      { label: "Business bank (last 4 only)", wide: false },
      { label: "Payroll & business tax contact", wide: false },
      { label: "Succession or wind‑down plan", wide: true }
    ],
    lists: [
      { title: "Key clients & contracts", cols: ["Client", "Contact", "Notes"] }
    ]
  },
  {
    name: "Traveling / Caregiver Info",
    desc: "Trip itinerary, medical consent, temporary guardian, local backup",
    fields: [
      { label: "Current trip itinerary, flights & hotel", wide: true },
      { label: "Notarized medical consent location", wide: false },
      { label: "Temporary guardian letter location", wide: false },
      { label: "Local backup adult (within 15 min)", wide: true }
    ],
    lists: [
      { title: "Caregiver & medical contacts", cols: ["Role / name", "Phone", "Notes"] }
    ]
  },
  {
    name: "International / Expat Assets",
    desc: "Visas/citizenship, foreign legal/tax contacts, overseas accounts",
    fields: [
      { label: "Citizenship / visa / passport / OCI notes", wide: true },
      { label: "Foreign legal or tax contact", wide: false },
      { label: "Repatriation & money transfer notes", wide: true }
    ],
    lists: [
      { title: "Overseas banks, property & investments", cols: ["Country & institution", "Type / last 4", "How to access"] }
    ]
  },
  {
    name: "Aging Parents / Caregiving",
    desc: "Parents' doctors, POA/proxy, care facility, medications",
    fields: [
      { label: "Parents' primary doctor & preferred hospital", wide: false },
      { label: "POA / healthcare proxy location", wide: false },
      { label: "Care facility or home aide contact", wide: false },
      { label: "Daily routine & special care notes", wide: true }
    ],
    lists: [
      { title: "Parents' medications & doctors", cols: ["Parent", "Medication / doctor", "Notes"] }
    ]
  }
];

const FIRE_DRILL = [
  { id: "fd_unlock", t: "Spouse unlocked the standalone .html copy on their own device", d: "Hand them the locked .html file and passphrase to verify they can open it without your help." },
  { id: "fd_papers", t: "Spouse found the original will, passports & safe key in under 2 minutes", d: "Walk physically to the exact safe, drawer, or filing box together." },
  { id: "fd_phone", t: "Spouse unlocked your phone right now", d: "Confirm the passcode works and they know where authenticator / 2FA codes live." },
  { id: "fd_legacy", t: "Password manager emergency access & Apple/Google Legacy Contacts are active", d: "Verify invitations are accepted and not stuck in pending." },
  { id: "fd_pickup", t: "School/daycare authorized pickup & emergency contacts are current", d: "Confirm listed names and numbers match who you would call today." }
];
