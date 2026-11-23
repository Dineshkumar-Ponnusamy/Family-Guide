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
  },
  illness: {
    label: "Chronic or critical illness treatment",
    phases: [
      { when: "Setting up your care system", steps: [
        { id: "il1", t: "Keep a 1-page ER & Medical Grab Sheet ready", d: "Record exact diagnosis, active protocol, allergies, implants/ports/lines, red-flag thresholds, 24/7 specialist triage line, and preferred hospital/ER.", ref: "Health → Chronic / critical illness & ER care", refTab: "health", refBlock: "Chronic / critical illness & ER care" },
        { id: "il2", t: "Set up patient portal proxy & HIPAA / medical release", d: "Enable caregiver proxy access on MyChart/hospital portals and sign medical release forms so doctors and insurers can legally talk to your spouse or advocate.", ref: "Health → Chronic / critical illness & ER care", refTab: "health", refBlock: "Chronic / critical illness & ER care" },
        { id: "il3", t: "Check Critical Illness, Hospital Indemnity, Disability & FMLA", d: "A major diagnosis often triggers lump-sum Critical Illness or Hospital Indemnity payouts, plus Short/Long-Term Disability and intermittent FMLA for both patient and caregiving spouse.", ref: "Money → Insurance", refTab: "money", refBlock: "insurance" }
      ]},
      { when: "2 AM ER trip or sudden flare-up", steps: [
        { id: "il4", t: "Follow the specialist's red-flag rule first", d: "Check exact fever, blood pressure, oxygen, or glucose thresholds and call the 24/7 specialist triage line BEFORE taking fever-reducers (which can mask a dangerous infection) or going to an unlinked ER.", ref: "Health → Chronic / critical illness & ER care", refTab: "health", refBlock: "Chronic / critical illness & ER care" },
        { id: "il5", t: "Alert triage immediately about implants, ports, lines & arm limits", d: "Point out port-a-cath, PICC line, pacemaker/ICD, dialysis fistula, insulin pump, or lymphedema arm restrictions (no blood pressure cuffs, IVs, or blood draws on restricted arm).", ref: "Health → Chronic / critical illness & ER care", refTab: "health", refBlock: "Chronic / critical illness & ER care" },
        { id: "il6", t: "Grab the hospital go-bag & log every update", d: "Bring phone + long charger, typed medication list, rescue meds, insurance card, button-up shirt, and lip balm. Log doctors' names and instructions in the Call & claim log.", ref: "Start here → Call & claim log", refTab: "start", refBlock: "call_log" }
      ]},
      { when: "Ongoing treatment & caregiver survival", steps: [
        { id: "il7", t: "Appoint a Communication Captain & Care Squad", d: "Pick one trusted friend or relative to post updates so neither of you repeats draining news 20 times. Delegate rides, school runs, groceries, and meals.", ref: "Contacts → First people to call", refTab: "contacts", refBlock: "first" },
        { id: "il8", t: "Ask for a hospital social worker, palliative care & financial aid", d: "Social workers unlock free parking passes, gas cards, meal vouchers, charity care, and manufacturer drug copay cards. Palliative care relieves pain, nausea, and fatigue during active treatment (it is not hospice).", ref: "Start here → What to say", refTab: "start", refBlock: "What to say" },
        { id: "il9", t: "Cross-check every hospital bill against the Insurance EOB", d: "Wait until your insurer's Explanation of Benefits (EOB) settles before paying provider bills so you catch duplicate charges, coding errors, and prior-auth denials.", ref: "Start here → Call & claim log", refTab: "start", refBlock: "call_log" },
        { id: "il10", t: "Protect the caregiver & kids", d: "Give kids' teachers and school counselors an early heads-up so they watch for quiet stress, enforce germ/visitor boundaries, and accept respite help without guilt.", ref: "For the kids", refTab: "kids", refBlock: "" }
      ]}
    ]
  },
  windfall: {
    label: "Handling big money (e.g. $1M payout)",
    phases: [
      { when: "First 30 days — Pause & Park Safely", steps: [
        { id: "wf1", t: "Commit to a 6-to-12 month 'No Big Decisions' freeze", d: "Grief and stress make big financial choices risky. Do not buy or sell a house, buy a luxury car, invest in anyone's business, or lend large sums right away.", ref: "Money → Beginner's guide: handling big money", refTab: "money", refBlock: "money_guide" },
        { id: "wf2", t: "Tell almost nobody the payout amount", d: "Privacy protects you from relatives asking for loans, pushy salespeople, and bereavement scammers.", ref: "Start here → What to say", refTab: "start", refBlock: "What to say" },
        { id: "wf3", t: "Park the payout safely under bank deposit-insurance limits", d: "Do not leave $1M sitting in one checking account. Split across government-insured High-Yield Savings Accounts or short-term Treasury money market/bills, and check interest rates before leaving it in an insurer's 'retained asset' checkbook.", ref: "Money → Beginner's guide: handling big money", refTab: "money", refBlock: "money_guide" }
      ]},
      { when: "Months 2 to 6 — Pay Yourself & Organize", steps: [
        { id: "wf4", t: "Set up an automatic 'Monthly Paycheck' to checking", d: "Auto-transfer only your usual monthly spending from savings into checking each month so household bills run calmly without dipping impulsively into the lump sum.", ref: "Money → My instructions for big money / insurance payouts", refTab: "money", refBlock: "My instructions for big money / insurance payouts" },
        { id: "wf5", t: "Only pay high-interest joint debts; hold off on everything else", d: "Pay off high-interest joint credit cards (>10%). Wait before paying off a low-rate mortgage, and never pay solo unsecured debts solely in the deceased's name until our estate attorney reviews them.", ref: "Money → Debts & loans", refTab: "money", refBlock: "debts" },
        { id: "wf6", t: "Talk to a CPA/tax advisor before selling investments or a home", d: "Life insurance payouts are usually income-tax-free, and inherited assets often get a 'step-up in cost basis.' Ask about surviving-spouse tax status before triggering capital gains.", ref: "Contacts → Professionals", refTab: "contacts", refBlock: "pros" }
      ]},
      { when: "Months 6 to 12 — Hire Safe Help & Build a Plan", steps: [
        { id: "wf7", t: "Only hire a Fee-Only Fiduciary advisor (zero commissions)", d: "Pay by the hour or flat annual fee—never commission. Walk out immediately if anyone pitches whole/indexed life insurance, variable annuities, ULIPs, or 'expires this Friday' deals.", ref: "Money → Beginner's guide: handling big money", refTab: "money", refBlock: "money_guide" },
        { id: "wf8", t: "Divide the money into 4 clear buckets", d: "Keep 12 months in cash, pay high-interest joint debt, set aside 1–5 year needs in safe short-term instruments, and invest the rest in a simple low-cost diversified portfolio using a ~3.5%–4% annual withdrawal rule.", ref: "Money → Beginner's guide: handling big money", refTab: "money", refBlock: "money_guide" }
      ]},
      { when: "Year 1 & Beyond — Stay Steady", steps: [
        { id: "wf9", t: "Follow a simple 15-minute monthly money routine", d: "Check your checking buffer, keep credit cards on full-statement autopay, drop tax letters into one folder, and meet your fee-only advisor once a year.", ref: "Money → Bills & autopay", refTab: "money", refBlock: "bills" },
        { id: "wf10", t: "Update your own beneficiaries, will & kids' guardian", d: "Ensure your new accounts, insurance, and estate documents reflect your updated wishes.", ref: "Documents & home → Legal papers", refTab: "docs", refBlock: "Legal papers" }
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
  ["Telling the kids", "\"Something hard happened. You are safe and you are loved, and we'll take care of each other. You can ask me anything.\""],
  ["Setting visitor, germ & energy boundaries", "\"Thank you so much for wanting to visit. Right now our medical team needs us to avoid anyone with even mild sniffles, strong scents, or surprise drop-ins. Text [Communication Captain] to schedule a short window on a good day.\""],
  ["Asking a hospital social worker for financial & practical aid", "\"We're navigating ongoing [diagnosis/treatment]. Could you connect us with hospital financial aid/charity care, manufacturer drug copay assistance, parking/gas/meal vouchers, palliative symptom support, and FMLA/disability paperwork help?\""],
  ["Updating a child's teacher or school counselor", "\"Wanted to share privately that [child's name]'s parent is going through serious medical treatment right now. Things at home feel heavy—please let me or the counselor know if you notice any quiet withdrawal, tiredness, or anxiety at school.\""],
  ["Saying no to salespeople or relatives asking for money", "\"Our estate attorney and fee-only advisor have everything frozen in a waiting period for the next year, and I can't lend money, buy new policies, or sign any investments until they approve it in writing.\""]
];

const MONEY_GUIDE = [
  {
    id: "pause",
    title: "1. Rule #1: The 6-to-12 Month Freeze",
    badge: "First 30 days",
    summary: "If you have never managed money before and just received a large payout (like $1M), your single most powerful financial move is doing very little for 6 to 12 months while you heal.",
    bullets: [
      "Do NOT sell your home or buy a new house right away—renting or staying put for 1 year avoids costly mistakes.",
      "Do NOT buy annuities, whole/indexed life insurance, crypto, timeshares, or invest in anyone's business.",
      "Do NOT lend large sums to family or friends; once money leaves, it rarely comes back.",
      "Keep all big-decision answers simple: \"Our advisor has us in a 12-month freeze before we decide anything.\""
    ]
  },
  {
    id: "park",
    title: "2. Where to Park a Big Payout Safely Today",
    badge: "Day 1–14",
    summary: "Life insurance payouts are usually income-tax-free, but leaving $1,000,000 sitting in a single checking account is risky and earns near zero.",
    bullets: [
      "Watch deposit-insurance limits: never hold more than the government-insured cap in a single bank institution.",
      "Beware the insurer's 'Retained Asset Account' (checkbook they mail you)—it often pays much lower interest and isn't always bank-insured; transfer funds to your own safe accounts.",
      "Park cash safely in 2–4 insured High-Yield Savings Accounts or a government Treasury Money Market / short-term government bills while you pause.",
      "Pay yourself a 'Monthly Paycheck': set an automatic monthly transfer from savings to your bill-pay checking account matching your usual monthly budget so daily life stays calm."
    ]
  },
  {
    id: "buckets",
    title: "3. The 4-Bucket Plan (How to Allocate $1,000,000)",
    badge: "Months 3–6",
    summary: "Think of a lump sum as four simple jars—never one giant pile to spend down:",
    bullets: [
      "Bucket 1 — 12-Month Safety Cash (10%–15% / ~$100k–$150k): Covers 1 full year of bills in insured High-Yield Savings so you never panic if something breaks.",
      "Bucket 2 — High-Interest Joint Debt Only (0%–10%): Pay off joint credit cards (>10%). Do NOT rush to pay off a 3%–5% mortgage, and ask our attorney before paying any solo debt only in the deceased's name.",
      "Bucket 3 — Near-Term 1–5 Year Goals (10%–15% / ~$100k–$150k): Upcoming tuition, reliable car replacement, or medical buffer in safe CDs, Treasury bills, or short-term government bonds.",
      "Bucket 4 — Long-Term Income Engine (60%–75% / ~$600k–$750k): Broad low-cost index funds managed with a fee-only advisor so it grows faster than inflation."
    ],
    note: "The ~3.5%–4% Rule: Every $100,000 invested long-term can sustainably pay about $3,500–$4,000 per year (~$290–$330/mo) for 30+ years without running out. At 4%, $750,000 generates ~$30,000/yr ($2,500/mo) — and $1,000,000 generates ~$40,000/yr ($3,333/mo) — alongside survivor pensions or your own income. General education only, not personal financial advice."
  },
  {
    id: "advisor",
    title: "4. How to Hire Help Without Getting Ripped Off",
    badge: "Months 4–9",
    summary: "Grieving survivors are the #1 target of commission-based salespeople posing as 'advisors.' Hire slowly and verify credentials in writing.",
    bullets: [
      "ONLY hire a Fee-Only Fiduciary (paid a flat project fee, hourly rate, or transparent flat annual fee—zero product commissions).",
      "Walk away immediately from: Whole/Indexed Universal Life insurance (IUL), Variable Annuities with 7-year surrender fees, ULIPs, or anyone saying 'sign before Friday.'",
      "Ask these 3 exact questions before hiring anyone: (1) 'Will you sign a written Fiduciary Oath putting my interests first 100% of the time?' (2) 'Do you earn ANY commission, kickback, or referral fee from products you recommend?' (3) 'What is your total all-in dollar fee per year?'"
    ]
  },
  {
    id: "protect",
    title: "5. Protecting Yourself From Relatives & Scammers",
    badge: "Always on",
    summary: "Keep the payout size strictly private. Even kind relatives make bad assumptions when they hear a big number.",
    bullets: [
      "Never tell extended family, neighbors, or social media how much insurance paid out.",
      "Watch out for the 4 classic bereavement scams: (1) fake overdue funeral/cremation invoices, (2) callers claiming unpaid deceased taxes demanding immediate wire/Zelle/UPI/gift cards, (3) fake 'urgent' collectors for solo credit cards, and (4) sudden 'investment mentors' or romance contacts.",
      "Keep a simple safety rule: NEVER wire money, buy gift cards, or approve crypto transfers under phone urgency. Hang up and verify independently."
    ]
  },
  {
    id: "routine",
    title: "6. Your 15-Minute Monthly Money Routine",
    badge: "Ongoing",
    summary: "If you have never managed household bills before, this simple checklist keeps everything running smoothly:",
    bullets: [
      "Keep ~1.5x your normal monthly budget in your bill-pay checking account; auto-transfer the same 'paycheck' from savings once a month.",
      "Put credit cards on autopay for the FULL statement balance (never just minimum) so you pay $0 interest.",
      "Create one folder (physical + digital) called 'Tax Letters This Year' and drop every 1099 / W-2 / Form 16 / receipt into it.",
      "Before selling any stocks, mutual funds, or real estate, ask a CPA about 'Step-Up in Cost Basis' and Surviving Spouse tax rules—selling too fast can trigger unnecessary taxes."
    ]
  }
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
      { type: "fields", title: "My instructions for big money / insurance payouts", hint: "For a spouse who hasn't managed a large lump sum before: leave plain-English steps here.", fields: [
        ["m_payout_first","First thing to do with a life insurance or big payout","e.g. Put it in 3 insured High-Yield Savings accounts & wait 6 months before any big decision", true],
        ["m_payout_payoff","Debts to pay off vs. leave alone","e.g. Pay off car loan; keep our 3.2% mortgage as-is; ask attorney about solo debts", true],
        ["m_payout_advisor","Who to trust for money advice (and who NOT to)","e.g. Call our Fee-Only Fiduciary advisor; NEVER buy annuities or whole life insurance", true],
        ["m_payout_monthly","How to pay yourself a monthly 'paycheck'","e.g. Set up automatic $5,500/mo transfer on the 1st from HYSA to Joint Checking", true]
      ]},
      { type: "money_guide", id: "money_guide", title: "Beginner's guide: handling big money (e.g. $1M payout)" },
      { type: "list", id: "accounts", title: "Bank accounts", hint: "Note Joint vs. Solo: solo accounts often freeze upon death; keep joint checking open for incoming paychecks.",
        cols: [["inst","Bank"],["type","Type"],["own","Owner / joint"],["last4","Last 4"],["access","How to access"]],
        seed: [{type:"Checking"},{type:"Savings"}],
        suggestCol: "type",
        suggestions: ["High-Yield Savings", "Money Market", "CD / Fixed Deposit", "Joint Bill-Pay Checking", "HSA / FSA Cash", "Kids Savings", "NRE / NRO / Foreign Bank"] },
      { type: "list", id: "invest", title: "Retirement & investments", hint: "Named beneficiaries on retirement accounts override your will—verify them annually.",
        cols: [["inst","Company"],["type","Type (401k, IRA…)"],["benef","Beneficiary"],["last4","Last 4"]], seed: [{}],
        suggestCol: "type",
        suggestions: ["401(k) / 403(b)", "Traditional / Roth IRA", "Taxable Brokerage", "529 College Plan", "HSA Investments", "RSUs / ESPP / Stock Options", "Pension / Annuity", "Crypto / TreasuryDirect"] },
      { type: "list", id: "crypto", title: "Crypto & digital assets", hint: "Safety rule: NEVER type 12/24-word seed phrases or private keys here! Record only the wallet/exchange, approximate holdings, where the seed/PIN is physically stored, and who can help cash out safely.",
        cols: [["platform","Exchange / Wallet"],["assets","Coins / approx. value"],["access","Where seed / PIN / login lives (NEVER raw seed)"],["helper","Trusted tech helper & instructions"]],
        seed: [{}],
        suggestCol: "platform",
        suggestions: ["Coinbase / Exchange", "Kraken / Gemini / Binance", "Ledger / Trezor Hardware Wallet", "MetaMask / Phantom / Self-Custody", "Bitcoin Multisig / Cold Storage", "Staking / DeFi / Yield Account", "Indian Exchange (CoinDCX / CoinSwitch)"] },
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
      { type: "fields", title: "Chronic / critical illness & ER care", hint: "Fill this in if anyone has a chronic condition, cancer, heart/kidney/autoimmune care, or active treatment. Powers the 1-page ER & Medical Grab Sheet.", fields: [
        ["h_diag","Diagnosis, condition & active treatment / protocol","e.g. Stage II / Type 1 diabetes / Heart failure — protocol & last treatment date"],
        ["h_triage","24/7 specialist triage line & preferred hospital / ER","Direct nurse line + ER linked to oncology/cardiology records"],
        ["h_redflag","Red-flag symptoms & ER rules","e.g. Fever ≥ 100.4°F / 38°C: call specialist BEFORE taking Tylenol/Advil!", true],
        ["h_devices","Implants, ports, lines & 'do not touch' warnings","e.g. Right chest port-a-cath, pacemaker, dialysis fistula, NO BP/IVs on left arm", true],
        ["h_rescue","Rescue / 'just-in-case' meds & when to take them","e.g. Zofran, nitroglycerin, EpiPen, rescue inhaler — exact doses & triggers", true],
        ["h_portal","Patient portal proxy & HIPAA / medical release","e.g. MyChart proxy set for spouse; signed HIPAA release on file"],
        ["h_comfort","Food/drug interactions, visitor boundaries & comfort wishes","e.g. Avoid grapefruit/raw foods; no surprise visits or strong scents; palliative team contact", true]
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
      { type: "list", id: "gov_ids", title: "Key IDs & government numbers (SSN / PAN / Passport)", hint: "Safety rule: enter ONLY the last 4 digits and where the original card or full number is stored (safe, password manager). NEVER type full SSNs or national IDs.",
        cols: [["who","Family member"],["idtype","ID type (SSN, Passport…)"],["last4","Last 4 digits only"],["where","Where full # / card is"],["exp","Expiry / notes"]],
        seed: [{idtype:"SSN / National ID (Me)"},{idtype:"SSN / National ID (Spouse)"},{idtype:"Passport (Me)"},{idtype:"Driver's License / State ID"}],
        suggestCol: "idtype",
        suggestions: ["SSN / National ID (Child)", "Passport (Spouse / Child)", "Tax ID / EIN / ITIN", "Medicare / Health Card ID", "Birth Certificate #", "Global Entry / TSA PreCheck", "Military / Veteran ID"] },
      { type: "fields", title: "My wishes", fields: [
        ["d_funeral","Preferred funeral home",""],
        ["d_organ","Organ donation",""],
        ["d_prepaid","Pre‑paid funeral / plot receipts","where receipts or contracts are kept"],
        ["d_charity","Charity in lieu of flowers","exact charity name"],
        ["d_wishes","Burial or cremation, the service, music, who should speak","",true],
        ["d_keepsakes","\"Open When\" letters, voice notes & keepsakes","where letters, recordings, videos, or family recipes are saved"],
        ["d_caregiver","Permission & respite note for my caregiver","e.g. Please accept help and hire cleaning/respite care from our savings—taking care of yourself IS taking care of me",true]
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
    name: "Chronic & Critical Illness Care Plan",
    desc: "Specialists, symptom/question log, Care Squad, Go-Bag, medical billing/EOBs & comfort wishes",
    fields: [
      { label: "Hospital & clinic Go-Bag checklist (charger, button-up shirt, med list, snacks)", wide: true },
      { label: "Communication Captain (1 person who sends family/friend updates)", wide: false },
      { label: "Kids' teachers/counselor contacts & age-appropriate language notes", wide: true },
      { label: "Financial aid, drug copay cards & hospital social worker notes", wide: true },
      { label: "Work leave (FMLA / STD / LTD) & immigration/visa leave notes", wide: true },
      { label: "Palliative care, visitor/germ boundaries & comfort wishes", wide: true }
    ],
    lists: [
      { title: "Specialist Care Team", cols: ["Role (Oncologist/Cardiologist/Navigator/Social Worker)", "Name / Clinic", "Direct / 24-7 Phone", "Notes"] },
      { title: "Symptom, Side-Effect & Doctor Questions Log", cols: ["Date", "Symptom / Reading", "What helped", "Question for next visit"] },
      { title: "Care Squad (Rides, Meals, Kids & Respite)", cols: ["Person", "Phone", "Can help with", "Availability"] },
      { title: "Medical Bills, Prior Auths & EOB Tracker", cols: ["Date / Provider", "Prior Auth #", "EOB You Owe vs. Bill", "Status / Notes"] }
    ]
  },
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
