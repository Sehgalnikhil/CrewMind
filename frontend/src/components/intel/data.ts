import type { AgentKey, DocumentItem, Report } from "#/types";
import { AGENTS, COORDINATOR_META } from "#/types";

/* ============================================================
   Shared deterministic demo data for the intelligence pages.
   No Math.random anywhere — everything derives from string
   hashes or fixed script arrays so renders are stable.
   ============================================================ */

export type CrewKey = AgentKey | "coordinator";

export function agentMeta(key: CrewKey) {
  if (key === "coordinator") return COORDINATOR_META;
  return AGENTS.find((a) => a.key === key) ?? AGENTS[0];
}

/** Small deterministic hash → [0, 1) */
export function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/** Deterministic int in [min, max] from a seed string */
export function hashInt(s: string, min: number, max: number): number {
  return min + Math.floor(hash01(s) * (max - min + 1));
}

const DAY = 24 * 60 * 60 * 1000;

/** Anchor "now" once per module load so a page render is stable */
export const NOW = Date.now();

export function daysAgoIso(days: number, hourOffset = 0): string {
  return new Date(NOW - days * DAY - hourOffset * 60 * 60 * 1000).toISOString();
}

export function timeAgo(iso: string): string {
  const ms = NOW - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ------------------------------------------------------------
   MEMORY — simulated organizational memories
   ------------------------------------------------------------ */

export type MemoryKind =
  | "document"
  | "chat"
  | "report"
  | "decision"
  | "meeting"
  | "prediction"
  | "recommendation"
  | "task";

export interface MemoryRecord {
  id: string;
  kind: MemoryKind;
  title: string;
  snippet: string;
  agent: CrewKey;
  createdAt: string;
  /** ids of linked memories — the chain of evidence */
  links: string[];
  simulated: boolean;
}

export const MEMORY_KIND_META: Record<MemoryKind, { label: string; color: string }> = {
  document: { label: "Document", color: "#0891CF" },
  chat: { label: "Chat", color: "#8A7BEF" },
  report: { label: "Report", color: "#A395F4" },
  decision: { label: "Decision", color: "#D97706" },
  meeting: { label: "Meeting", color: "#059669" },
  prediction: { label: "Prediction", color: "#67c7f5" },
  recommendation: { label: "Recommendation", color: "#EC4899" },
  task: { label: "Task", color: "#34d399" },
};

export const SIM_MEMORIES: MemoryRecord[] = [
  { id: "m-01", kind: "decision", title: "Approved EU market entry pilot", agent: "strategy", createdAt: daysAgoIso(2, 3), links: ["m-05", "m-11", "m-18"], simulated: true, snippet: "Board-level decision: launch a 90-day EU pilot targeting DACH mid-market accounts. Atlas modelled a 14% revenue uplift with a controlled CAC ceiling of ₹38K per logo." },
  { id: "m-02", kind: "chat", title: "Boardroom: pricing elasticity debate", agent: "finance", createdAt: daysAgoIso(1, 6), links: ["m-01", "m-09"], simulated: true, snippet: "Ledger argued a 12% price increase on the Growth tier would clear churn-adjusted break-even in 4.2 months. Scout countered with competitor pricing pressure signals from two rivals." },
  { id: "m-03", kind: "meeting", title: "Weekly ops sync — fulfilment latency", agent: "operations", createdAt: daysAgoIso(3, 1), links: ["m-14", "m-20"], simulated: true, snippet: "Flux traced the 18% cycle-time regression to a queue misconfiguration in the Chennai warehouse routing layer. Fix scoped at 2 engineer-days; expected recovery within one sprint." },
  { id: "m-04", kind: "prediction", title: "Q3 churn will dip below 2.4%", agent: "research", createdAt: daysAgoIso(4), links: ["m-02", "m-16"], simulated: true, snippet: "Scout forecasts churn easing to 2.3–2.4% in Q3 based on NPS momentum, renewal cohort behaviour, and reduced competitor discounting observed across 47 industry signals." },
  { id: "m-05", kind: "recommendation", title: "Localize onboarding for DACH accounts", agent: "strategy", createdAt: daysAgoIso(5, 4), links: ["m-01", "m-18"], simulated: true, snippet: "Atlas recommends German-language onboarding flows and invoice-first billing before the EU pilot scales — the two highest-friction moments in trial-to-paid conversion for the region." },
  { id: "m-06", kind: "task", title: "Renegotiate cloud committed-use discount", agent: "finance", createdAt: daysAgoIso(6), links: ["m-09"], simulated: true, snippet: "Ledger opened a task to renegotiate the committed-use discount before the November renewal. Current utilization sits at 91% of commitment — leverage for a deeper tier." },
  { id: "m-07", kind: "meeting", title: "Legal review: DPA template refresh", agent: "legal", createdAt: daysAgoIso(7, 2), links: ["m-13"], simulated: true, snippet: "Clause walked through the refreshed data-processing addendum covering the new EU sub-processors. Two clauses need customer-facing plain-language summaries before rollout." },
  { id: "m-08", kind: "chat", title: "Scout briefing: competitor price cut", agent: "research", createdAt: daysAgoIso(1, 14), links: ["m-02", "m-04"], simulated: true, snippet: "Competitor Northwind cut list pricing 9% on their mid tier. Scout assesses this as a retention play after their churn spike, not a land-grab — recommends holding price." },
  { id: "m-09", kind: "decision", title: "Held Growth-tier pricing for Q3", agent: "coordinator", createdAt: daysAgoIso(1, 2), links: ["m-02", "m-08"], simulated: true, snippet: "Nexus synthesized the pricing debate: hold Growth-tier pricing through Q3, revisit after the EU pilot's first cohort renews. Ledger and Scout both signed the verdict." },
  { id: "m-10", kind: "prediction", title: "Runway extends to 19 months by December", agent: "finance", createdAt: daysAgoIso(8), links: ["m-06"], simulated: true, snippet: "Ledger projects runway extending from 16 to 19 months by December, assuming the cloud renegotiation lands and hiring stays at the approved plan of 4 net adds." },
  { id: "m-11", kind: "meeting", title: "EU pilot kickoff standup", agent: "strategy", createdAt: daysAgoIso(1, 20), links: ["m-01", "m-05"], simulated: true, snippet: "Cross-functional kickoff for the EU pilot. Owners assigned: Atlas on GTM sequencing, Clause on GDPR posture, Flux on support coverage for CET business hours." },
  { id: "m-12", kind: "task", title: "Ship SOC 2 evidence collection automation", agent: "operations", createdAt: daysAgoIso(9), links: ["m-13"], simulated: true, snippet: "Flux scoped automation for SOC 2 evidence collection — currently 11 hours/month of manual screenshots. Target: cut to under 1 hour with scheduled exports." },
  { id: "m-13", kind: "recommendation", title: "Accelerate SOC 2 Type II before enterprise push", agent: "legal", createdAt: daysAgoIso(10), links: ["m-07", "m-12"], simulated: true, snippet: "Clause recommends completing SOC 2 Type II observation before the enterprise segment push — 3 of the last 5 enterprise deals stalled on security review." },
  { id: "m-14", kind: "chat", title: "Flux diagnosis: warehouse routing fix", agent: "operations", createdAt: daysAgoIso(2, 8), links: ["m-03"], simulated: true, snippet: "Follow-up thread on the fulfilment regression: routing weights were inverted after the March deploy. Flux shipped the corrected config; cycle time already down 11%." },
  { id: "m-15", kind: "meeting", title: "Quarterly board prep session", agent: "coordinator", createdAt: daysAgoIso(12), links: ["m-09", "m-10"], simulated: true, snippet: "Nexus assembled the quarterly board narrative: revenue momentum, the pricing hold rationale, EU pilot thesis, and the runway extension path. Deck owners assigned." },
  { id: "m-16", kind: "prediction", title: "Support volume spike expected mid-August", agent: "operations", createdAt: daysAgoIso(13), links: ["m-04"], simulated: true, snippet: "Flux predicts a 30% support-ticket spike mid-August when the pricing-page redesign ships, based on the last two launch patterns. Recommends pre-staffing 2 contractors." },
  { id: "m-17", kind: "chat", title: "Clause flag: vendor contract auto-renewal", agent: "legal", createdAt: daysAgoIso(14), links: ["m-06"], simulated: true, snippet: "Clause flagged that the analytics vendor contract auto-renews in 21 days with a 60-day termination notice clause — decision needed this week to preserve optionality." },
  { id: "m-18", kind: "decision", title: "Selected Berlin as EU pilot hub", agent: "strategy", createdAt: daysAgoIso(4, 6), links: ["m-01", "m-05", "m-11"], simulated: true, snippet: "Decision: Berlin over Amsterdam as the EU pilot hub. Talent density, customer concentration, and Clause's read on works-council requirements tipped the analysis." },
  { id: "m-19", kind: "task", title: "Build churn early-warning dashboard", agent: "research", createdAt: daysAgoIso(15), links: ["m-04"], simulated: true, snippet: "Scout is assembling a churn early-warning dashboard combining login decay, seat contraction, and support sentiment — the three strongest leading indicators found." },
  { id: "m-20", kind: "recommendation", title: "Consolidate fulfilment vendors from 4 to 2", agent: "operations", createdAt: daysAgoIso(16), links: ["m-03", "m-14"], simulated: true, snippet: "Flux recommends consolidating fulfilment vendors from four to two. Modelled savings of ₹340K/yr with a single-point-of-failure risk mitigated by dual-sourcing." },
  { id: "m-21", kind: "meeting", title: "Finance deep-dive: unit economics review", agent: "finance", createdAt: daysAgoIso(18), links: ["m-02", "m-10"], simulated: true, snippet: "Ledger's monthly deep-dive: blended CAC down 8%, payback at 11.3 months, net revenue retention holding at 114%. Gross margin pressure from support costs noted." },
  { id: "m-22", kind: "prediction", title: "Regulatory change likely in data residency", agent: "legal", createdAt: daysAgoIso(20), links: ["m-07", "m-13"], simulated: true, snippet: "Clause is tracking a probable data-residency amendment across 3 jurisdictions — 70% likelihood of enactment within two quarters. EU pilot architecture should assume it." },
  { id: "m-23", kind: "chat", title: "Atlas scenario: land-and-expand math", agent: "strategy", createdAt: daysAgoIso(21), links: ["m-01", "m-21"], simulated: true, snippet: "Atlas walked through land-and-expand economics for EU accounts: land at 8 seats, expand to 22 within 14 months in comparable cohorts. NRR upside of 6 points." },
  { id: "m-24", kind: "decision", title: "Paused paid social experiments", agent: "coordinator", createdAt: daysAgoIso(24), links: ["m-21"], simulated: true, snippet: "Decision to pause paid social experiments after 3 cohorts showed CAC 2.1x above blended average. Budget reallocated to partner-sourced pipeline." },
  { id: "m-25", kind: "task", title: "Draft EU pilot success criteria", agent: "coordinator", createdAt: daysAgoIso(3, 9), links: ["m-01", "m-11", "m-18"], simulated: true, snippet: "Nexus drafting the EU pilot scorecard: 12 qualified logos, sub-₹40K CAC, and one lighthouse case study within 90 days — the bar for scaling investment." },
];

export function memoriesFromDocuments(docs: DocumentItem[]): MemoryRecord[] {
  return docs.map((d) => ({
    id: `doc-${d.id}`,
    kind: "document" as const,
    title: d.filename,
    snippet: `Indexed ${d.file_type.toUpperCase()} · ${d.chunk_count} knowledge chunks · status ${d.status}. Part of the organizational knowledge base the crew reasons over.`,
    agent: "research" as const,
    createdAt: d.created_at,
    links: SIM_MEMORIES.slice(hashInt(d.id, 0, 20), hashInt(d.id, 0, 20) + 2).map((m) => m.id),
    simulated: false,
  }));
}

export function memoriesFromReports(reports: Report[]): MemoryRecord[] {
  return reports.map((r) => ({
    id: `rep-${r.id}`,
    kind: "report" as const,
    title: r.title || "Executive report",
    snippet: r.summary,
    agent: "coordinator" as const,
    createdAt: r.created_at,
    links: SIM_MEMORIES.slice(hashInt(r.id, 0, 21), hashInt(r.id, 0, 21) + 3).map((m) => m.id),
    simulated: false,
  }));
}

/* ------------------------------------------------------------
   TIMELINE — simulated organizational events
   ------------------------------------------------------------ */

export type EventKind = "report" | "document" | "decision" | "meeting" | "alert";

export interface TimelineEvent {
  id: string;
  kind: EventKind;
  title: string;
  summary: string;
  createdAt: string;
  agents: CrewKey[];
  link: string;
}

export const EVENT_KIND_META: Record<EventKind, { label: string; color: string }> = {
  report: { label: "Report", color: "#A395F4" },
  document: { label: "Document", color: "#0891CF" },
  decision: { label: "Decision", color: "#D97706" },
  meeting: { label: "Meeting", color: "#059669" },
  alert: { label: "Alert", color: "#EC4899" },
};

export const SIM_EVENTS: TimelineEvent[] = [
  { id: "ev-01", kind: "decision", title: "EU market entry pilot approved", summary: "90-day DACH pilot green-lit with a ₹38K CAC ceiling and a 12-logo success bar.", createdAt: daysAgoIso(2, 3), agents: ["strategy", "finance", "coordinator"], link: "/reports" },
  { id: "ev-02", kind: "meeting", title: "Weekly ops sync", summary: "Fulfilment cycle-time regression traced to routing misconfiguration; fix scoped.", createdAt: daysAgoIso(3, 1), agents: ["operations"], link: "/agents/operations" },
  { id: "ev-03", kind: "alert", title: "Competitor price cut detected", summary: "Northwind dropped mid-tier list pricing 9%. Scout assesses it as a retention play.", createdAt: daysAgoIso(1, 14), agents: ["research"], link: "/agents/research" },
  { id: "ev-04", kind: "decision", title: "Growth-tier pricing held for Q3", summary: "Crew verdict: hold pricing, revisit after the first EU cohort renews.", createdAt: daysAgoIso(1, 2), agents: ["finance", "research", "coordinator"], link: "/reports" },
  { id: "ev-05", kind: "meeting", title: "EU pilot kickoff standup", summary: "Owners assigned across GTM sequencing, GDPR posture and CET support coverage.", createdAt: daysAgoIso(1, 20), agents: ["strategy", "legal", "operations"], link: "/agents/strategy" },
  { id: "ev-06", kind: "alert", title: "Vendor auto-renewal window closing", summary: "Analytics vendor renews in 21 days; termination notice requires action this week.", createdAt: daysAgoIso(14), agents: ["legal", "finance"], link: "/agents/legal" },
  { id: "ev-07", kind: "meeting", title: "Legal review: DPA refresh", summary: "New EU sub-processor addendum reviewed; two clauses need plain-language summaries.", createdAt: daysAgoIso(7, 2), agents: ["legal"], link: "/agents/legal" },
  { id: "ev-08", kind: "decision", title: "Berlin selected as EU hub", summary: "Berlin over Amsterdam on talent density, customer concentration and works-council read.", createdAt: daysAgoIso(4, 6), agents: ["strategy", "legal"], link: "/agents/strategy" },
  { id: "ev-09", kind: "meeting", title: "Quarterly board prep", summary: "Nexus assembled the board narrative: momentum, pricing hold, EU thesis, runway path.", createdAt: daysAgoIso(12), agents: ["coordinator", "finance", "strategy"], link: "/reports" },
  { id: "ev-10", kind: "alert", title: "Support volume spike forecast", summary: "Flux predicts a 30% ticket spike mid-August; recommends pre-staffing 2 contractors.", createdAt: daysAgoIso(13), agents: ["operations"], link: "/agents/operations" },
  { id: "ev-11", kind: "meeting", title: "Unit economics deep-dive", summary: "CAC down 8%, payback 11.3 months, NRR 114%. Support-cost margin pressure flagged.", createdAt: daysAgoIso(18), agents: ["finance"], link: "/agents/finance" },
  { id: "ev-12", kind: "decision", title: "Paid social experiments paused", summary: "Three cohorts at 2.1x blended CAC; budget shifted to partner-sourced pipeline.", createdAt: daysAgoIso(24), agents: ["coordinator", "finance"], link: "/reports" },
  { id: "ev-13", kind: "alert", title: "Data-residency amendment tracking", summary: "70% likelihood of enactment across 3 jurisdictions within two quarters.", createdAt: daysAgoIso(20), agents: ["legal"], link: "/agents/legal" },
  { id: "ev-14", kind: "meeting", title: "Churn early-warning workshop", summary: "Login decay, seat contraction and support sentiment chosen as leading indicators.", createdAt: daysAgoIso(15), agents: ["research", "operations"], link: "/agents/research" },
  { id: "ev-15", kind: "decision", title: "Fulfilment vendor consolidation", summary: "Four vendors to two; ₹340K/yr modelled savings with dual-sourcing mitigation.", createdAt: daysAgoIso(34), agents: ["operations", "finance"], link: "/agents/operations" },
  { id: "ev-16", kind: "meeting", title: "SOC 2 Type II planning", summary: "Observation window scheduled ahead of the enterprise push; evidence automation scoped.", createdAt: daysAgoIso(38), agents: ["legal", "operations"], link: "/agents/legal" },
  { id: "ev-17", kind: "alert", title: "Cloud commitment at 91% utilization", summary: "Renegotiation leverage identified before the November renewal window.", createdAt: daysAgoIso(42), agents: ["finance"], link: "/agents/finance" },
  { id: "ev-18", kind: "decision", title: "Hiring plan locked at 4 net adds", summary: "Headcount held to protect the runway extension path to 19 months.", createdAt: daysAgoIso(47), agents: ["finance", "coordinator"], link: "/reports" },
  { id: "ev-19", kind: "meeting", title: "Partner pipeline review", summary: "Partner-sourced deals now 22% of pipeline; enablement kit refresh commissioned.", createdAt: daysAgoIso(55), agents: ["strategy"], link: "/agents/strategy" },
  { id: "ev-20", kind: "alert", title: "NPS inflection detected", summary: "Rolling NPS crossed 52 for the first time; renewal cohorts strengthening.", createdAt: daysAgoIso(61), agents: ["research"], link: "/agents/research" },
];

/* ------------------------------------------------------------
   FEED — scripted live insight stream
   ------------------------------------------------------------ */

export type FeedKind = "observation" | "warning" | "opportunity" | "prediction" | "question";

export interface FeedItem {
  id: string;
  kind: FeedKind;
  agent: AgentKey;
  body: string;
  confidence?: number;
}

export const FEED_KIND_META: Record<FeedKind, { label: string; color: string }> = {
  observation: { label: "Observation", color: "#0891CF" },
  warning: { label: "Warning", color: "#EC4899" },
  opportunity: { label: "Opportunity", color: "#059669" },
  prediction: { label: "Prediction", color: "#8A7BEF" },
  question: { label: "Question for you", color: "#D97706" },
};

export const FEED_SCRIPT: FeedItem[] = [
  { id: "f-01", kind: "observation", agent: "research", body: "Three of your top five competitors published AI-roadmap posts this week — the category narrative is shifting from features to autonomy.", confidence: 82 },
  { id: "f-02", kind: "warning", agent: "finance", body: "Support costs grew 2.3x faster than revenue this quarter. If the trend holds, gross margin dips below 70% by October.", confidence: 74 },
  { id: "f-03", kind: "opportunity", agent: "strategy", body: "Partner-sourced deals close 31% faster than outbound. Doubling the enablement budget could pull ₹1.2L of pipeline into this fiscal year.", confidence: 68 },
  { id: "f-04", kind: "question", agent: "legal", body: "The analytics vendor auto-renews in 21 days. Do you want me to draft the termination notice as a negotiating position?" },
  { id: "f-05", kind: "prediction", agent: "operations", body: "Warehouse routing fix is compounding — I project cycle time fully recovered within 9 days, two ahead of plan.", confidence: 88 },
  { id: "f-06", kind: "observation", agent: "finance", body: "Cloud utilization hit 91% of commitment. That's the strongest renegotiation posture we've had in six quarters.", confidence: 91 },
  { id: "f-07", kind: "opportunity", agent: "research", body: "Northwind's price cut is churning their power users — 14 of them follow our changelog. A targeted migration offer could convert 5-8 accounts.", confidence: 63 },
  { id: "f-08", kind: "warning", agent: "legal", body: "The data-residency amendment moved to committee stage in a second jurisdiction. EU pilot architecture should assume enactment.", confidence: 71 },
  { id: "f-09", kind: "prediction", agent: "strategy", body: "At current velocity the EU pilot hits its 12-logo bar in week 11 of 13 — tight but achievable if onboarding localization ships on time.", confidence: 66 },
  { id: "f-10", kind: "question", agent: "finance", body: "Runway models diverge 3 months depending on the contractor decision for the August support spike. Want the side-by-side?" },
  { id: "f-11", kind: "observation", agent: "operations", body: "SOC 2 evidence automation saved 9.5 hours in its first month — slightly better than the scoped estimate.", confidence: 95 },
  { id: "f-12", kind: "opportunity", agent: "strategy", body: "Two lighthouse-quality logos in the DACH pipeline have public AI mandates. Case-study rights could be worth more than the ARR.", confidence: 59 },
  { id: "f-13", kind: "warning", agent: "research", body: "Category search volume for your core keyword fell 8% month-over-month. The demand narrative may be moving upstream.", confidence: 61 },
  { id: "f-14", kind: "prediction", agent: "finance", body: "If the cloud renegotiation lands the deeper tier, runway extends to 19.4 months — past the next raise window with margin.", confidence: 77 },
  { id: "f-15", kind: "question", agent: "operations", body: "Vendor consolidation is ready to execute. Do you want the transition sequenced before or after the August spike?" },
  { id: "f-16", kind: "observation", agent: "legal", body: "All 14 active customer contracts are now within the refreshed DPA framework. Zero legacy paper remaining.", confidence: 99 },
  { id: "f-17", kind: "opportunity", agent: "operations", body: "CET support coverage for the EU pilot can be piloted with staggered shifts before hiring — zero incremental cost for 6 weeks.", confidence: 72 },
  { id: "f-18", kind: "prediction", agent: "research", body: "NPS momentum plus reduced competitor discounting points to churn landing at 2.3% in Q3 — the lowest in company history.", confidence: 69 },
  { id: "f-19", kind: "warning", agent: "strategy", body: "The pricing hold means the EU pilot lands with legacy packaging. If cohort-one feedback flags it, repackaging mid-pilot gets expensive.", confidence: 57 },
  { id: "f-20", kind: "observation", agent: "finance", body: "Net revenue retention held at 114% for a third consecutive month. Expansion revenue now outpaces new-logo revenue.", confidence: 93 },
  { id: "f-21", kind: "question", agent: "strategy", body: "Board prep is drafted. Should the EU pilot be framed as a growth bet or an optionality purchase? The narrative differs materially." },
  { id: "f-22", kind: "opportunity", agent: "legal", body: "Completing SOC 2 Type II unblocks an estimated ₹2.8L of stalled enterprise pipeline based on the last five security reviews.", confidence: 76 },
  { id: "f-23", kind: "prediction", agent: "operations", body: "The pricing-page redesign will spike support tickets 30% for roughly 12 days based on the last two launch patterns.", confidence: 81 },
  { id: "f-24", kind: "observation", agent: "research", body: "47 fresh industry signals processed overnight. The strongest cluster: enterprise buyers consolidating AI vendors from 5+ to 2.", confidence: 85 },
];

/* ------------------------------------------------------------
   BRAIN — cognition log script
   ------------------------------------------------------------ */

export interface Thought {
  id: string;
  agent: CrewKey;
  text: string;
}

export const COGNITION_SCRIPT: Thought[] = [
  { id: "t-01", agent: "research", text: "Cross-referencing Northwind's price cut against their hiring freeze…" },
  { id: "t-02", agent: "finance", text: "Recomputing runway under the 4-net-adds hiring plan…" },
  { id: "t-03", agent: "coordinator", text: "Reconciling Scout and Ledger's pricing positions into one verdict…" },
  { id: "t-04", agent: "strategy", text: "Stress-testing the Berlin hub thesis against talent-cost drift…" },
  { id: "t-05", agent: "operations", text: "Replaying warehouse telemetry to confirm cycle-time recovery…" },
  { id: "t-06", agent: "legal", text: "Diffing the amended data-residency draft against pilot architecture…" },
  { id: "t-07", agent: "research", text: "Clustering 47 overnight signals into demand-narrative themes…" },
  { id: "t-08", agent: "finance", text: "Scoring the cloud renegotiation leverage at 91% utilization…" },
  { id: "t-09", agent: "strategy", text: "Sequencing land-and-expand milestones for DACH cohort one…" },
  { id: "t-10", agent: "operations", text: "Simulating August ticket spike against staggered CET shifts…" },
  { id: "t-11", agent: "legal", text: "Drafting plain-language summaries for two DPA clauses…" },
  { id: "t-12", agent: "coordinator", text: "Weighting five executive signals into the health composite…" },
];
