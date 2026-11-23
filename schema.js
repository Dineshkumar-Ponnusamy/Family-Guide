/*
  FAMILY FIELD GUIDE · CONTENT
  ----------------------------------------------------------------
  Everything you see in the app is defined here, so you can extend it
  in code (see README.md → "Extending the guide").

  Block types you can use inside a tab's `blocks`:
    { type:"fields", title, hint?, fields:[ [id, label, placeholder?, wide?] ] }
    { type:"list",   id, title, hint?, cols:[ [key, label] ], seed:[ {key:value} ] }
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
        { id: "h1", t: "Make sure you and the kids are safe", d: "Call 911 if anyone is in danger. It's okay to let someone else drive or make calls for you.", ref: "Contacts → First people to call" },
        { id: "h2", t: "Arrange care for the kids", d: "Call the person listed for school pickup and overnight care. Use the safe word.", ref: "For the kids" },
        { id: "h3", t: "Bring my medical papers to the hospital", d: "My healthcare directive and medical power of attorney let you speak for me. Bring my insurance card, ID, and medication list.", ref: "Health → My medical info" },
        { id: "h3b", t: "Start a call log", d: "Write down who you talked to, when, and what they said. Hospitals and insurers will ask.", ref: "" }
      ]},
      { when: "First day or two", steps: [
        { id: "h4", t: "Call my employer's HR", d: "Ask about sick leave, short‑term disability, FMLA job protection, and how my paycheck continues.", ref: "Money → Work benefits" },
        { id: "h5", t: "Check that bills are still on autopay", d: "Nothing needs to change right away. Look over the bills list so nothing is missed.", ref: "Money → Bills & autopay" },
        { id: "h6", t: "Pick one person to share updates", d: "They tell everyone else, so you're not repeating hard news.", ref: "Contacts → First people to call" }
      ]},
      { when: "First weeks", steps: [
        { id: "h7", t: "Use the financial power of attorney if needed", d: "If you need to manage accounts only in my name, this document lets you act for me. Call our attorney if a bank pushes back.", ref: "Documents → Legal papers" },
        { id: "h8", t: "File disability or insurance claims", d: "Check my disability and any accident or critical‑illness policies.", ref: "Money → Insurance" },
        { id: "h9", t: "Ask the hospital for a social worker", d: "They help with insurance questions, rehab placement, and paperwork. It's a free service.", ref: "" }
      ]}
    ]
  },
  gone: {
    label: "I have passed away",
    phases: [
      { when: "First hours", steps: [
        { id: "g1", t: "Let yourself stop", d: "You don't have to decide anything big today. Call the first person on the list and let them help.", ref: "Contacts → First people to call" },
        { id: "g2", t: "Arrange care for the kids", d: "Ask someone they trust to be with them. There's a page written for them.", ref: "For the kids" },
        { id: "g3", t: "Read my wishes", d: "My preferences for a funeral, burial or cremation, and a service are written down.", ref: "Documents → My wishes" }
      ]},
      { when: "First 72 hours", steps: [
        { id: "g4", t: "Contact the funeral home", d: "They help with arrangements and ordering death certificates. Ask for 10 to 15 certified copies; banks and insurers each want one.", ref: "Documents → My wishes" },
        { id: "g5", t: "Call my employer's HR", d: "Ask about final pay, group life insurance, retirement accounts, and health coverage for you and the kids.", ref: "Money → Work benefits" },
        { id: "g6", t: "Keep the home running", d: "Keep paying the mortgage or rent, insurance, and utilities. Don't close joint accounts yet.", ref: "Money → Bills & autopay" },
        { id: "g6b", t: "Keep my phone charged and on", d: "Many accounts send login codes to it. Don't cancel the line yet.", ref: "Documents → Getting into things" }
      ]},
      { when: "First weeks", steps: [
        { id: "g7", t: "Call our estate attorney", d: "They'll walk you through the will or trust and what happens next. Bring the will.", ref: "Contacts → Professionals" },
        { id: "g8", t: "File life insurance claims", d: "Each policy needs a claim form and a death certificate.", ref: "Money → Insurance" },
        { id: "g9", t: "Contact Social Security", d: "You and the kids may be eligible for survivor benefits. Call 1‑800‑772‑1213.", ref: "" },
        { id: "g10", t: "Get help with accounts and taxes", d: "Our financial advisor and accountant can help move accounts and plan the tax return.", ref: "Contacts → Professionals" }
      ]},
      { when: "First 90 days", steps: [
        { id: "g11", t: "Protect my identity", d: "Send a death certificate to Equifax, Experian, and TransUnion so no one opens credit in my name.", ref: "" },
        { id: "g12", t: "Retitle the house and cars", d: "Our attorney can tell you what's needed for each.", ref: "Money → Property & vehicles" },
        { id: "g13", t: "Cancel my subscriptions and memberships", d: "Use the list so nothing keeps charging.", ref: "Money → Subscriptions" },
        { id: "g14", t: "Update your own beneficiaries and will", d: "Your accounts probably name me. Update them when you're ready.", ref: "" },
        { id: "g15", t: "Hold off on big decisions", d: "Selling the house, moving, or large money choices can wait several months. Grief support helps; you don't have to do this alone.", ref: "" }
      ]}
    ]
  },
  money: {
    label: "Money emergency (job loss, big bill)",
    phases: [
      { when: "First week", steps: [
        { id: "m1", t: "Know your runway", d: "Compare emergency savings to our monthly spending. That's how many months you have.", ref: "Money → The big picture" },
        { id: "m2", t: "File for unemployment", d: "Apply with the state right away if a job ended; benefits usually start from the date you file.", ref: "" },
        { id: "m3", t: "Sort out health insurance", d: "Ask about COBRA (you usually have 60 days to elect it) and compare marketplace plans.", ref: "Money → Work benefits" }
      ]},
      { when: "First month", steps: [
        { id: "m4", t: "Trim to the essentials", d: "Housing, food, utilities, insurance, minimum debt payments. Pause the rest.", ref: "Money → Subscriptions" },
        { id: "m5", t: "Call lenders before you miss a payment", d: "Ask about hardship programs. They're more flexible when you call early.", ref: "Money → Debts & loans" },
        { id: "m6", t: "Avoid cashing out retirement", d: "Early withdrawals usually come with taxes and penalties. Talk to our advisor first.", ref: "Contacts → Professionals" }
      ]}
    ]
  }
};

const SCRIPTS = [
  ["Calling a bank or insurer", "\"I'm calling about my spouse's account. They are [in the hospital / have passed away]. I have [power of attorney / a death certificate]. What do you need from me, and can you send it in writing?\""],
  ["When someone pushes you to decide", "\"I'm not making any decisions right now. Please send me the details and I'll get back to you.\""],
  ["Asking a friend for help", "\"Could you take over [meals / school runs / phone calls] this week? It would help me a lot.\""],
  ["Telling the kids", "\"Something hard happened. You are safe and you are loved, and we'll take care of each other. You can ask me anything.\""]
];

const TABS = [
  { id: "start", label: "Start here", title: "Start here", lede: "The most important things first. Then pick what's happening and check things off as you go.",
    blocks: [{ type: "glance" }, { type: "playbook" }, { type: "scripts" }, { type: "letter" }] },

  { id: "contacts", label: "Contacts", title: "Who to call", lede: "The people who can help, and what each one is for.",
    blocks: [
      { type: "list", id: "first", title: "First people to call", hint: "Calm, trusted people who can come over or take charge of calls.",
        cols: [["name","Name"],["rel","Relationship"],["phone","Phone"],["why","They can help with"]], seed: [{}, {}] },
      { type: "list", id: "pros", title: "Professionals", hint: "Add each person's firm and phone. Delete any you don't have.",
        cols: [["role","Role"],["name","Name / firm"],["phone","Phone"],["email","Email"],["note","Notes"]],
        seed: [{role:"Estate attorney"},{role:"Financial advisor"},{role:"Accountant / tax preparer"},{role:"Employer HR"},{role:"Insurance agent"},{role:"Primary doctor"}] },
      { type: "list", id: "circle", title: "Wider circle to notify", hint: "Family, close friends, my manager, groups I'm part of.",
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
      { type: "list", id: "accounts", title: "Bank accounts", cols: [["inst","Bank"],["type","Type"],["own","Owner / joint"],["last4","Last 4"],["access","How to access"]], seed: [{type:"Checking"},{type:"Savings"}] },
      { type: "list", id: "invest", title: "Retirement & investments", cols: [["inst","Company"],["type","Type (401k, IRA…)"],["benef","Beneficiary"],["last4","Last 4"]], seed: [{}] },
      { type: "list", id: "insurance", title: "Insurance", hint: "Life, disability, health, home, auto, umbrella.", cols: [["type","Type"],["co","Company"],["amt","Coverage"],["pol","Policy (last 4)"],["phone","Claims phone"],["renew","Renews"]], seed: [{type:"Life (work)"},{type:"Life (personal)"},{type:"Disability"},{type:"Health"},{type:"Home / renters"},{type:"Auto"}] },
      { type: "list", id: "bills", title: "Bills & autopay", cols: [["name","Bill"],["amt","Amount"],["due","Due"],["how","Paid from / autopay?"]], seed: [{name:"Mortgage / rent"},{name:"Electric"},{name:"Water"},{name:"Phone"},{name:"Internet"}] },
      { type: "list", id: "cards", title: "Credit cards", cols: [["issuer","Issuer"],["last4","Last 4"],["own","Whose name"],["autopay","Autopay?"]], seed: [{}] },
      { type: "list", id: "debts", title: "Debts & loans", cols: [["name","Lender"],["type","Type"],["bal","Approx. balance"],["note","Notes"]], seed: [{}] },
      { type: "list", id: "property", title: "Property & vehicles", cols: [["what","What"],["title","Whose name on title"],["loan","Loan?"],["where","Where the title is"]], seed: [{what:"Home"},{what:"Car"}] },
      { type: "list", id: "subs", title: "Subscriptions", hint: "Streaming, software, gyms, memberships. Things to cancel or keep.", cols: [["name","Service"],["cost","Cost"],["card","Charged to"],["keep","Keep or cancel"]], seed: [{}] }
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
        ["d_legacy","Legacy contacts set up","e.g. Apple, Google, Facebook"]
      ]},
      { type: "list", id: "doclocs", title: "Where every document is", cols: [["doc","Document"],["where","Location"],["orig","Original or copy"]],
        seed: [{doc:"Birth certificates"},{doc:"Passports"},{doc:"Social Security cards"},{doc:"Marriage certificate"},{doc:"Deed / lease"},{doc:"Car titles"},{doc:"Recent tax returns"}] },
      { type: "fields", title: "My wishes", fields: [["d_funeral","Preferred funeral home",""],["d_organ","Organ donation",""],["d_wishes","Burial or cremation, the service, music, who should speak","",true]] },
      { type: "list", id: "home", title: "Running the house", hint: "Utilities, repairs, cars, yard, security.", cols: [["what","What"],["who","Company / person"],["phone","Phone"],["note","Notes"]], seed: [{what:"Electric / gas"},{what:"Internet"},{what:"Plumber / handyman"},{what:"Car service"},{what:"Alarm / security"}] },
      { type: "fields", title: "House know‑how", fields: [["hk_water","Water shut‑off valve",""],["hk_breaker","Breaker panel",""],["hk_spare","Spare keys",""],["hk_trash","Trash & recycling days",""]] },
      { type: "list", id: "pets", title: "Pets", cols: [["name","Name"],["food","Food & schedule"],["meds","Meds"],["vet","Vet & phone"],["sitter","Backup caretaker"]], seed: [{}] }
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
