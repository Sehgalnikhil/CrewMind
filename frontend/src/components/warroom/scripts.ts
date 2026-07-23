import type { AgentKey, CrewAgentKey } from "#/types";

/* ============================================================
   War Room deliberation scripts — deterministic, no backend.
   ============================================================ */

export type Stance = "support" | "caution" | "oppose";
export type PhaseKey = "framing" | "positions" | "challenge" | "synthesis" | "verdict";

export const PHASES: { key: PhaseKey; label: string }[] = [
  { key: "framing", label: "Framing" },
  { key: "positions", label: "Positions" },
  { key: "challenge", label: "Challenge" },
  { key: "synthesis", label: "Synthesis" },
  { key: "verdict", label: "Verdict" },
];

export const STANCE_COLOR: Record<Stance, string> = {
  support: "#059669",
  caution: "#D97706",
  oppose: "#EC4899",
};

export interface ScriptTurn {
  speaker: CrewAgentKey;
  /** Who this turn is answering — draws the dashed connector. */
  respondingTo?: CrewAgentKey | "user";
  phase: PhaseKey;
  /** Shown with ThinkingDots while the executive "prepares" the turn. */
  reasoning: string;
  text: string;
  stance: Stance;
  confidence: number;
  evidence: string[];
}

export interface Verdict {
  recommendation: string;
  confidence: number;
  /** Agents who stayed opposed at the end, if any. */
  dissent?: { agent: AgentKey; note: string };
}

export interface DeliberationScript {
  id: string;
  question: string;
  turns: ScriptTurn[];
  verdict: Verdict;
}

/* ------------------------------------------------------------
   Script 1 — EU market expansion
   ------------------------------------------------------------ */
const EU_EXPANSION: DeliberationScript = {
  id: "eu-expansion",
  question: "Should we expand to the EU market next year?",
  verdict: {
    recommendation:
      "Proceed with a phased EU entry: land in Ireland and the Netherlands in Q2 with a two-person GTM pod, cap incremental burn at ₹40K/mo, and gate the wider rollout on 25 qualified pipeline accounts and completed GDPR readiness by end of Q3.",
    confidence: 81,
  },
  turns: [
    {
      speaker: "coordinator",
      phase: "framing",
      reasoning: "decomposing the question into market, capital, execution and compliance workstreams",
      text: "Table is open. The question before us: should we expand to the EU market next year? I want each of you to state a position with evidence — market window from Scout, capital exposure from Ledger, strategic fit from Atlas, delivery capacity from Flux, regulatory posture from Clause. Then we pressure-test.",
      stance: "caution",
      confidence: 50,
      evidence: ["Board-Memo-Q3.pdf", "Strategy offsite notes"],
    },
    {
      speaker: "research",
      phase: "positions",
      reasoning: "scanning 3 competitor filings and EU demand signals from the last two quarters",
      text: "The window is real and it is closing. Inbound from EU domains grew 34% quarter over quarter with zero spend, and our two closest competitors both announced Dublin offices in the last 90 days. Waiting a year likely means entering as the third mover in every deal. I support going.",
      stance: "support",
      confidence: 84,
      evidence: ["EU-Market-Scan.pdf", "Competitor filing digest", "Inbound +34% QoQ"],
    },
    {
      speaker: "finance",
      phase: "positions",
      reasoning: "recomputing runway under an EU entry burn profile",
      text: "The numbers make me nervous. A credible EU launch costs ₹55–70K a month fully loaded — entity setup, two hires, localized billing. That takes runway from 19 months to roughly 14. Doable, but it eats the buffer we hold for a downturn. I am at caution until someone shows me a cheaper wedge.",
      stance: "caution",
      confidence: 62,
      evidence: ["Q3-Financial-Model.xlsx", "Runway 19.2 mo", "Burn ₹210K/mo"],
    },
    {
      speaker: "strategy",
      phase: "positions",
      reasoning: "mapping EU entry against the three-year positioning thesis",
      text: "Strategically this is the strongest move on the board. Our category is consolidating, and the winners will be whoever owns the mid-market in two regions, not one. EU revenue also diversifies us away from a single-market concentration the board flagged last quarter. I support, with sequencing discipline.",
      stance: "support",
      confidence: 78,
      evidence: ["3-Year-Strategy-Deck.pdf", "Board risk register"],
    },
    {
      speaker: "operations",
      phase: "positions",
      reasoning: "stress-testing support coverage and onboarding load across time zones",
      text: "Execution is where this gets ugly. We currently resolve tickets in 4.1 hours because everyone is in one timezone. EU customers on the current roster means overnight queues and a support SLA we will miss in month one. I need either a follow-the-sun rota or an EU support hire before I can say yes.",
      stance: "caution",
      confidence: 58,
      evidence: ["Support-SLA-Dashboard", "Avg resolution 4.1h", "Capacity plan Q4"],
    },
    {
      speaker: "legal",
      phase: "positions",
      reasoning: "reviewing GDPR readiness and data-residency obligations against current architecture",
      text: "Two hard blockers before a single EU contract is signed: we need a GDPR-compliant data processing agreement and our data residency story is currently 'everything in one US region.' That is a deal-killer for regulated buyers. Neither is fatal — both are roughly a quarter of work — but they are prerequisites, not nice-to-haves.",
      stance: "caution",
      confidence: 65,
      evidence: ["GDPR-Gap-Analysis.pdf", "DPA template v2", "Data residency audit"],
    },
    {
      speaker: "finance",
      respondingTo: "strategy",
      phase: "challenge",
      reasoning: "cross-referencing Atlas's sequencing claim against the hiring plan",
      text: "Atlas, sequencing discipline is exactly what worries me — our track record on phased rollouts is that they un-phase themselves. The Q2 partner program was scoped at ₹20K and closed at ₹47K. If we go, I want a hard monthly cap with an automatic pause trigger, not a plan that assumes restraint.",
      stance: "caution",
      confidence: 66,
      evidence: ["Partner-Program-Postmortem.md", "Actuals vs plan Q2"],
    },
    {
      speaker: "strategy",
      respondingTo: "finance",
      phase: "challenge",
      reasoning: "restructuring the entry plan around Ledger's cap-and-gate objection",
      text: "Fair hit, Ledger. So let's design for it: a two-person GTM pod, no entity until we clear 25 qualified accounts, billing through our existing merchant-of-record. That structure caps exposure near ₹40K a month and gives you a kill switch at the Q3 gate. The strategic upside survives; the blank check does not.",
      stance: "support",
      confidence: 82,
      evidence: ["EU-Entry-Options.pdf", "MoR pricing sheet"],
    },
    {
      speaker: "legal",
      respondingTo: "strategy",
      phase: "challenge",
      reasoning: "checking whether the merchant-of-record wedge changes the compliance surface",
      text: "The merchant-of-record route helps more than you may realize — it shifts VAT and consumer-law exposure to the provider and buys us time on entity formation. But it does not touch GDPR. If engineering commits the data-residency work to this roadmap, I move from caution toward support.",
      stance: "caution",
      confidence: 71,
      evidence: ["MoR-Terms-Review.pdf", "GDPR-Gap-Analysis.pdf"],
    },
    {
      speaker: "operations",
      respondingTo: "legal",
      phase: "challenge",
      reasoning: "sizing the residency workstream against current sprint velocity",
      text: "I can absorb the residency work — it is about six engineer-weeks and it dovetails with the storage refactor already on the Q1 board. What I cannot absorb silently is support. One EU-timezone support hire, roughly ₹6K a month, and my objection collapses. Cheaper than a missed-SLA churn spiral.",
      stance: "support",
      confidence: 74,
      evidence: ["Sprint velocity report", "Storage-Refactor-RFC.md", "Hire req: EU support"],
    },
    {
      speaker: "research",
      respondingTo: "finance",
      phase: "challenge",
      reasoning: "pricing the cost of delay using competitor land-grab velocity",
      text: "Ledger, one more input for your model: cost of waiting. Both competitors are converting EU trials at list price with no localization at all — meaning demand is ahead of supply right now. My estimate is that every quarter of delay cedes 8 to 12 winnable mid-market logos. Inaction has a burn rate too.",
      stance: "support",
      confidence: 86,
      evidence: ["Competitor trial data", "Win/loss notes EU", "TAM model v3"],
    },
    {
      speaker: "finance",
      phase: "synthesis",
      reasoning: "rerunning the model with the capped pod structure and MoR billing",
      text: "With the pod structure, merchant-of-record billing, and a hard ₹40K monthly cap, the model holds: runway stays above 16 months in the base case and the Q3 gate protects the downside. Scout's cost-of-delay estimate tips it. I am moving to support — conditional on the cap being enforced in the budget, not the slide deck.",
      stance: "support",
      confidence: 77,
      evidence: ["Q3-Financial-Model.xlsx", "Scenario B: capped entry"],
    },
    {
      speaker: "legal",
      phase: "synthesis",
      reasoning: "confirming the compliance runway fits the proposed Q2 timeline",
      text: "With Flux committing the residency work to Q1 and the DPA finalized in parallel, we are compliant before the first EU signature. I withdraw my objection. One standing condition: no regulated-industry customers until the residency migration is verified — I will keep that on my watchlist.",
      stance: "support",
      confidence: 79,
      evidence: ["Compliance timeline v2", "DPA template v2"],
    },
    {
      speaker: "coordinator",
      phase: "verdict",
      reasoning: "weighing five positions and drafting the table's verdict",
      text: "Convergence reached. Five positions, four support, one conditional support resolved through the capped-pod structure. The table recommends a phased EU entry with hard financial gates and compliance prerequisites sequenced ahead of the first contract. Drafting the signed verdict now.",
      stance: "support",
      confidence: 81,
      evidence: ["Session transcript", "Consensus 81%"],
    },
  ],
};

/* ------------------------------------------------------------
   Script 2 — pricing change debate
   ------------------------------------------------------------ */
const PRICING_CHANGE: DeliberationScript = {
  id: "pricing-change",
  question: "Should we raise Pro plan pricing by 20% this quarter?",
  verdict: {
    recommendation:
      "Raise Pro pricing by 20% for new customers only, effective next month, paired with the analytics add-on as headline justification. Grandfather existing customers for 12 months with a 90-day notice, and hold a rollback trigger if trial-to-paid conversion drops more than 15%.",
    confidence: 74,
    dissent: {
      agent: "research",
      note: "Scout remained opposed: competitor promotional pricing this quarter makes the timing needlessly risky; recommends deferring one quarter.",
    },
  },
  turns: [
    {
      speaker: "coordinator",
      phase: "framing",
      reasoning: "framing the pricing question across willingness-to-pay, revenue, churn and contract exposure",
      text: "Next item: a 20% increase on the Pro plan this quarter. This touches everything — Ledger on revenue mechanics, Scout on market timing, Atlas on positioning, Flux on churn and support blast radius, Clause on what our contracts actually let us do. Positions, please.",
      stance: "caution",
      confidence: 50,
      evidence: ["Pricing-Review-Brief.pdf"],
    },
    {
      speaker: "finance",
      phase: "positions",
      reasoning: "modeling net revenue impact across churn sensitivity bands",
      text: "The math is compelling. At current volumes a 20% Pro increase adds roughly ₹31K MRR. Even in my bearish band — 6% incremental churn — we net positive within two months. Our gross margin on Pro is 84%, so nearly all of it drops through. Strong support from me.",
      stance: "support",
      confidence: 85,
      evidence: ["Pricing-Elasticity-Model.xlsx", "MRR +₹31K est.", "Gross margin 84%"],
    },
    {
      speaker: "research",
      phase: "positions",
      reasoning: "reviewing competitor pricing pages captured over the last 60 days",
      text: "Timing is the problem. Two of our three main competitors are running aggressive promotions right now — one is at 30% off annual plans through end of quarter. Raising list price into a discount war hands their sales teams a talking point. The increase is right; this quarter is wrong. I oppose the timing.",
      stance: "oppose",
      confidence: 76,
      evidence: ["Competitor-Pricing-Tracker.pdf", "Promo scan: 30% off annual"],
    },
    {
      speaker: "strategy",
      phase: "positions",
      reasoning: "testing the increase against the premium positioning thesis",
      text: "We are underpriced for the value we ship — win/loss interviews say price is a deciding factor in under 10% of losses. A higher price actually reinforces the premium position we have been building all year. But naked increases read as greed; paired with the analytics add-on launching next month, it reads as value. Support, with packaging.",
      stance: "support",
      confidence: 79,
      evidence: ["Win-Loss-Interviews-H2.pdf", "Positioning survey", "Price cited in <10% of losses"],
    },
    {
      speaker: "operations",
      phase: "positions",
      reasoning: "estimating the support-ticket and cancellation-flow load of a price change",
      text: "Operationally survivable, but not free. Last pricing email drove a 3x ticket spike for two weeks and our cancellation flow still has the broken downgrade path — customers who want to react by downgrading currently have to contact support. Fix that first or the spike doubles. Caution until the flow ships.",
      stance: "caution",
      confidence: 63,
      evidence: ["Ticket volume history", "Downgrade-Flow-Bug #482"],
    },
    {
      speaker: "legal",
      phase: "positions",
      reasoning: "auditing subscription terms for price-change notice obligations",
      text: "Our terms allow price changes with 30 days' notice for monthly plans, but 22% of Pro revenue sits on annual contracts with fixed pricing until renewal — those cannot move mid-term, full stop. And several enterprise riders require 90-day notice. Legal path exists, but the rollout must respect three different notice clocks.",
      stance: "caution",
      confidence: 72,
      evidence: ["ToS-v4-Section-8.pdf", "Annual contract audit", "22% revenue on fixed terms"],
    },
    {
      speaker: "finance",
      respondingTo: "research",
      phase: "challenge",
      reasoning: "quantifying the cost of deferring a quarter against Scout's timing risk",
      text: "Scout, deferring one quarter costs roughly ₹93K in foregone revenue. For that price, the promo-war risk has to be worth more than ₹93K of expected churn — which requires believing a fifth of our Pro base is shopping competitors this quarter. Retention data says under 4% even open competitor emails. I do not buy it.",
      stance: "support",
      confidence: 83,
      evidence: ["Deferral cost model", "Email engagement data", "Logo retention 96.4%"],
    },
    {
      speaker: "research",
      respondingTo: "finance",
      phase: "challenge",
      reasoning: "separating existing-customer churn risk from new-buyer conversion risk",
      text: "Ledger, you are modeling the wrong cohort. Existing customers will mostly grumble and stay — agreed. The exposure is new buyers, who compare pricing pages side by side during a promo quarter. Our trial-to-paid rate is the number at risk, and that is the one your churn bands do not cover. Still opposed on timing.",
      stance: "oppose",
      confidence: 74,
      evidence: ["Trial-to-paid 22.8%", "Pricing page A/B history"],
    },
    {
      speaker: "strategy",
      respondingTo: "research",
      phase: "challenge",
      reasoning: "splitting the rollout to isolate Scout's new-buyer exposure",
      text: "Scout's cohort split points at the answer: decouple the two. Raise for new customers with the add-on as the story, grandfather existing customers for twelve months. New-buyer risk gets a rollback trigger on conversion; existing revenue is untouched this quarter. We capture most of the upside and fence the exact risk Scout named.",
      stance: "support",
      confidence: 84,
      evidence: ["Rollout-Options-Memo.md", "Grandfathering cost model"],
    },
    {
      speaker: "legal",
      respondingTo: "strategy",
      phase: "challenge",
      reasoning: "validating the grandfathering structure against existing notice obligations",
      text: "Atlas's structure neatly sidesteps my notice-clock problem — new-customer pricing needs no notice at all, and grandfathering means no mid-term changes on annual contracts. One requirement: the 90-day enterprise riders still bind whenever we do touch existing accounts, so the 12-month grandfather clause must carry a 90-day notice tail. Draftable this week.",
      stance: "support",
      confidence: 80,
      evidence: ["ToS-v4-Section-8.pdf", "Enterprise rider index"],
    },
    {
      speaker: "operations",
      respondingTo: "strategy",
      phase: "challenge",
      reasoning: "re-estimating ticket load under a new-customers-only rollout",
      text: "New-customers-only also shrinks my problem by an order of magnitude — no angry install-base email, no cancellation stampede. I still want the downgrade flow fixed as a condition; it is a three-day fix already ticketed. With that, operations is clear. Moving to support.",
      stance: "support",
      confidence: 78,
      evidence: ["Downgrade-Flow-Bug #482", "Revised ticket forecast"],
    },
    {
      speaker: "finance",
      phase: "synthesis",
      reasoning: "re-running revenue impact for the grandfathered rollout",
      text: "The grandfathered version keeps about 70% of the upside — roughly ₹22K MRR in year one, ramping to full value as the base renews. Slower, but the risk profile is dramatically better and the rollback trigger makes it reversible. I endorse Atlas's structure over my original blanket increase.",
      stance: "support",
      confidence: 81,
      evidence: ["Pricing-Elasticity-Model.xlsx", "Scenario C: grandfathered"],
    },
    {
      speaker: "research",
      phase: "synthesis",
      reasoning: "final read on whether the fenced rollout clears the timing objection",
      text: "The structure is better and the rollback trigger is a real safeguard — credit where due. But new buyers still land on a higher price during the loudest promo quarter our competitors have run in two years. I will not block the table, and I will watch conversion daily, but my position stays opposed on timing. Note my dissent.",
      stance: "oppose",
      confidence: 68,
      evidence: ["Competitor-Pricing-Tracker.pdf", "Conversion watchlist"],
    },
    {
      speaker: "coordinator",
      phase: "verdict",
      reasoning: "consolidating four supports and one standing dissent into a verdict",
      text: "Position check: four in support of the grandfathered, new-customers-only increase with a conversion rollback trigger; Scout dissents on timing and the dissent will be recorded on the verdict. That is a decisive majority with a monitored risk. Preparing the signed verdict.",
      stance: "support",
      confidence: 74,
      evidence: ["Session transcript", "Dissent recorded: Scout"],
    },
  ],
};

export const SCRIPTS: DeliberationScript[] = [EU_EXPANSION, PRICING_CHANGE];

/* ------------------------------------------------------------
   Generic template — used when the user types a custom question
   ------------------------------------------------------------ */
export function buildCustomScript(question: string): DeliberationScript {
  const q = question.trim().replace(/\s+/g, " ");
  return {
    id: `custom-${Date.now()}`,
    question: q,
    verdict: {
      recommendation: `Proceed on "${q}" — but as a staged commitment, not a leap: run a four-week scoped pilot with a named owner, a hard budget ceiling, and pre-agreed success metrics reviewed at the table before any full rollout.`,
      confidence: 76,
    },
    turns: [
      {
        speaker: "coordinator",
        phase: "framing",
        reasoning: "decomposing the question into evidence, capital, strategy, execution and risk workstreams",
        text: `Table is open. The question the user has brought us: "${q}". Each of you, take it through your own lens — Scout on external evidence, Ledger on the money, Atlas on strategic fit, Flux on whether we can actually execute, Clause on what could bite us. Positions first, then we fight about it.`,
        stance: "caution",
        confidence: 50,
        evidence: ["User-submitted question", "Session brief"],
      },
      {
        speaker: "research",
        phase: "positions",
        reasoning: "pulling market signals and precedent cases relevant to the question",
        text: "The external evidence leans favorable. I found three comparable companies that made a similar call in the last 18 months; two saw measurable upside within two quarters. Market signals on our side — search interest and analyst chatter — are trending up, not down. Directionally, I support.",
        stance: "support",
        confidence: 72,
        evidence: ["Market-Signal-Digest.pdf", "Precedent case notes", "Trend index +18%"],
      },
      {
        speaker: "finance",
        phase: "positions",
        reasoning: "sketching the capital exposure and payback window",
        text: "My first-pass model says this is affordable but not cheap — meaningful upfront cost with payback landing somewhere between two and four quarters depending on adoption. That range is too wide to green-light unconditionally. I am at caution until we tighten the assumptions or cap the exposure.",
        stance: "caution",
        confidence: 61,
        evidence: ["Q3-Financial-Model.xlsx", "Payback range 2–4 qtrs"],
      },
      {
        speaker: "strategy",
        phase: "positions",
        reasoning: "testing the proposal against this year's strategic priorities",
        text: "This aligns with two of our three stated priorities for the year, and the opportunity cost of not deciding is real — questions like this get more expensive the longer they sit. My concern is focus dilution: we have limited leadership bandwidth this quarter. Support, if it comes with a named owner.",
        stance: "support",
        confidence: 75,
        evidence: ["Annual-Priorities-Memo.pdf", "Initiative load review"],
      },
      {
        speaker: "operations",
        phase: "positions",
        reasoning: "checking team capacity and delivery risk for the next two quarters",
        text: "Execution reality check: the teams that would carry this are at 85% utilization and the Q1 roadmap is already contested. We can do it, but something visible slips. I want to know what we are explicitly deprioritizing before I sign — otherwise this becomes the fourth 'top priority.' Caution.",
        stance: "caution",
        confidence: 58,
        evidence: ["Capacity-Dashboard", "Utilization 85%", "Q1 roadmap draft"],
      },
      {
        speaker: "legal",
        phase: "positions",
        reasoning: "scanning for regulatory, contractual and reputational exposure",
        text: "Nothing here is a blocker, but two exposures need eyes: any external commitments we make should carry standard exit clauses, and if customer data is touched in any way, that triggers a privacy review before launch, not after. Manageable with a week of lead time. Cautious green from me.",
        stance: "caution",
        confidence: 67,
        evidence: ["Risk-Register.xlsx", "Privacy review checklist"],
      },
      {
        speaker: "finance",
        respondingTo: "research",
        phase: "challenge",
        reasoning: "pressure-testing Scout's precedent cases against our cost base",
        text: "Scout, your two success cases were both operating with materially lower cost bases than ours — the third comparable, the one that struggled, looks the most like us. I am not dismissing the signal, but I want the optimistic case to survive contact with our actual numbers before it drives the decision.",
        stance: "caution",
        confidence: 64,
        evidence: ["Comparable cost analysis", "Case study notes"],
      },
      {
        speaker: "research",
        respondingTo: "finance",
        phase: "challenge",
        reasoning: "re-weighting the precedent set against Ledger's objection",
        text: "Fair challenge, Ledger — the third case is the closest analogue. But dig into why it struggled: they committed everything upfront with no checkpoint. The failure mode was structure, not the decision itself. Which argues for going ahead with stage gates, not for not going. My support stands, reshaped.",
        stance: "support",
        confidence: 76,
        evidence: ["Case study postmortem", "Stage-gate precedent"],
      },
      {
        speaker: "strategy",
        respondingTo: "operations",
        phase: "challenge",
        reasoning: "resolving Flux's capacity objection with an explicit trade",
        text: "Flux, here is your explicit trade: we pause the internal tooling refresh — it is the lowest-leverage item on the Q1 board — and that frees the capacity this needs. Painful but honest. A scoped four-week pilot with a hard budget ceiling also answers Ledger: small enough to be safe, real enough to generate the numbers we are missing.",
        stance: "support",
        confidence: 81,
        evidence: ["Q1 roadmap draft", "Pilot-Charter-Template.md"],
      },
      {
        speaker: "operations",
        respondingTo: "strategy",
        phase: "challenge",
        reasoning: "validating the pilot scope against the freed capacity",
        text: "If the tooling refresh is genuinely paused — announced, not whispered — then yes, a four-week pilot fits the freed capacity with margin. I will own the delivery plan and report weekly. That converts my caution to support. But the first time someone un-pauses that refresh, I pull the cord.",
        stance: "support",
        confidence: 77,
        evidence: ["Capacity-Dashboard", "Pilot delivery plan v1"],
      },
      {
        speaker: "finance",
        phase: "synthesis",
        reasoning: "re-running the model with a capped pilot instead of full commitment",
        text: "A capped pilot changes my answer. Exposure drops to a rounding error, and in four weeks we replace my two-to-four-quarter guess with observed data. Conditional support: the cap is fixed at pilot approval, and full rollout comes back to this table with real numbers.",
        stance: "support",
        confidence: 78,
        evidence: ["Q3-Financial-Model.xlsx", "Pilot budget cap"],
      },
      {
        speaker: "legal",
        phase: "synthesis",
        reasoning: "confirming the pilot structure clears the compliance checklist",
        text: "A pilot with standard exit clauses and the privacy review scheduled up front clears everything on my list. I will pre-draft the paperwork so legal is never the bottleneck. Support. One reminder for the record: success metrics agreed before the pilot starts, or we will argue about what the results mean.",
        stance: "support",
        confidence: 80,
        evidence: ["Pilot terms draft", "Privacy review checklist"],
      },
      {
        speaker: "coordinator",
        phase: "verdict",
        reasoning: "consolidating the table's positions into a verdict",
        text: `Convergence reached on "${q}": unanimous support for a staged commitment — a scoped pilot with a hard cap, a named owner, an explicit deprioritization, and a return to this table before full rollout. Drafting the signed verdict now.`,
        stance: "support",
        confidence: 76,
        evidence: ["Session transcript"],
      },
    ],
  };
}

/* ------------------------------------------------------------
   Follow-up round — a shorter deliberation after the verdict
   ------------------------------------------------------------ */
export function buildFollowUpTurns(question: string): { turns: ScriptTurn[]; verdict: Verdict } {
  const q = question.trim().replace(/\s+/g, " ");
  return {
    verdict: {
      recommendation: `On the follow-up — "${q}" — the table holds its original verdict and folds this in as an execution amendment: assign it to the initiative owner, track it as a named risk, and review at the next checkpoint.`,
      confidence: 78,
    },
    turns: [
      {
        speaker: "coordinator",
        respondingTo: "user",
        phase: "framing",
        reasoning: "scoping the follow-up against the verdict just signed",
        text: `Reopening the table for a follow-up: "${q}". We will keep this round short — direct responses only, then I fold it into the standing verdict. Who has signal on this?`,
        stance: "caution",
        confidence: 55,
        evidence: ["Signed verdict", "Follow-up question"],
      },
      {
        speaker: "research",
        respondingTo: "coordinator",
        phase: "positions",
        reasoning: "checking whether the follow-up changes the external picture",
        text: "It sharpens rather than changes my read. The follow-up touches an area where the external data is thinner, so I would treat any assumption there as low-confidence and instrument it early — measure it in week one of execution rather than debate it now.",
        stance: "support",
        confidence: 73,
        evidence: ["Market-Signal-Digest.pdf", "Instrumentation plan"],
      },
      {
        speaker: "finance",
        respondingTo: "coordinator",
        phase: "positions",
        reasoning: "checking the follow-up against the approved budget envelope",
        text: "From the money side: whatever we decide here fits inside the envelope we just approved, provided it is treated as a reallocation and not an addition. The moment it needs net-new budget, it comes back to this table. Within that constraint, no objection.",
        stance: "support",
        confidence: 75,
        evidence: ["Approved budget envelope"],
      },
      {
        speaker: "strategy",
        respondingTo: "finance",
        phase: "challenge",
        reasoning: "testing whether the follow-up shifts the original recommendation",
        text: "The important question is whether this changes the verdict, and my answer is no — it changes the execution plan. It belongs on the initiative owner's risk list with a named checkpoint, not in a reopened debate. I recommend we amend, not relitigate.",
        stance: "support",
        confidence: 80,
        evidence: ["Signed verdict", "Execution risk list"],
      },
      {
        speaker: "coordinator",
        phase: "verdict",
        reasoning: "folding the follow-up into the standing verdict",
        text: "Agreed across the table: the follow-up is absorbed as an execution amendment — instrumented early per Scout, funded by reallocation per Ledger, tracked as a named risk per Atlas. Updating the signed verdict accordingly.",
        stance: "support",
        confidence: 78,
        evidence: ["Amended verdict draft"],
      },
    ],
  };
}

/* ------------------------------------------------------------
   Interjection acknowledgments — next speaker quotes the user
   ------------------------------------------------------------ */
const ACK_TEMPLATES: Array<(quote: string) => { reasoning: string; text: string }> = [
  (quote) => ({
    reasoning: "folding the interjection into the working position",
    text: `Before we continue — the user just put something on the table: "${quote}". That is a material input, and I am adjusting my framing to account for it rather than talking past it.`,
  }),
  (quote) => ({
    reasoning: "weighing the user's point against the evidence so far",
    text: `Noted from the head of the table: "${quote}". Taking that seriously — it cuts across part of what we assumed, so let me address it directly before the debate moves on.`,
  }),
  (quote) => ({
    reasoning: "reconciling the interjection with the current phase of debate",
    text: `The user interjects: "${quote}". Good timing — that is exactly the kind of constraint this table exists to absorb. Factoring it in; my next point will reflect it.`,
  }),
];

export function buildAckTurn(userText: string, speaker: CrewAgentKey, ackIndex: number, phase: PhaseKey): ScriptTurn {
  const quote = userText.trim().length > 140 ? `${userText.trim().slice(0, 137)}…` : userText.trim();
  const t = ACK_TEMPLATES[ackIndex % ACK_TEMPLATES.length](quote);
  return {
    speaker,
    respondingTo: "user",
    phase,
    reasoning: t.reasoning,
    text: t.text,
    stance: "caution",
    confidence: 60,
    evidence: ["User interjection"],
  };
}

export const SUGGESTED_QUESTIONS = [
  "Should we expand to the EU market next year?",
  "Should we raise Pro plan pricing by 20% this quarter?",
  "Should we acquihire the 4-person analytics startup?",
];

/** Match a submitted question to a canned script, else build a custom one. */
export function resolveScript(question: string): DeliberationScript {
  const norm = question.trim().toLowerCase();
  const hit = SCRIPTS.find((s) => s.question.toLowerCase() === norm);
  if (hit) return hit;
  if (norm.includes("eu") || norm.includes("europe")) return { ...EU_EXPANSION, question };
  if (norm.includes("pricing") || norm.includes("price")) return { ...PRICING_CHANGE, question };
  return buildCustomScript(question);
}
