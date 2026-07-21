/**
 * Validated categorical palette for the dark surface #05060C–#0B0D14.
 * Order is fixed (never cycle): operations, strategy, finance, legal, research.
 * The research↔legal tritan pair sits in the 6–8 CVD floor band, so agent
 * marks always ship with a label or icon, never color alone.
 */
export const AGENTS = [
  {
    id: "strategy",
    name: "Atlas",
    role: "Strategy Agent",
    title: "Chief Strategy Officer",
    color: "#8A7BEF",
    glow: "rgba(138,123,239,0.35)",
    tagline: "Sees three quarters ahead.",
    description:
      "Synthesizes market signals, competitor moves and your own trajectory into board-ready strategic options — with the tradeoffs already priced in.",
    stats: { decisions: "1,204", confidence: 94, focus: "Market expansion" },
  },
  {
    id: "finance",
    name: "Ledger",
    role: "Finance Agent",
    title: "Chief Financial Officer",
    color: "#D97706",
    glow: "rgba(217,119,6,0.35)",
    tagline: "Every dollar, accounted for.",
    description:
      "Reads your P&L, runway and unit economics in real time. Flags margin drift weeks before it shows up in the monthly close.",
    stats: { decisions: "3,911", confidence: 97, focus: "Runway modelling" },
  },
  {
    id: "operations",
    name: "Flux",
    role: "Operations Agent",
    title: "Chief Operating Officer",
    color: "#059669",
    glow: "rgba(5,150,105,0.35)",
    tagline: "Friction is a bug. Flux fixes it.",
    description:
      "Maps every process across your stack, finds the bottlenecks, and drafts the playbook to remove them — then tracks whether it worked.",
    stats: { decisions: "2,652", confidence: 92, focus: "Cycle-time cuts" },
  },
  {
    id: "legal",
    name: "Clause",
    role: "Legal Agent",
    title: "General Counsel",
    color: "#EC4899",
    glow: "rgba(236,72,153,0.35)",
    tagline: "Reads the fine print so you don't.",
    description:
      "Reviews contracts, monitors regulatory changes across your jurisdictions, and surfaces exposure before a human lawyer would open the file.",
    stats: { decisions: "864", confidence: 96, focus: "Contract risk" },
  },
  {
    id: "research",
    name: "Scout",
    role: "Research Agent",
    title: "Chief Research Officer",
    color: "#0891CF",
    glow: "rgba(8,145,207,0.35)",
    tagline: "Nothing ships un-researched.",
    description:
      "Continuously scans markets, papers and customer signals. Every claim in every report traces back to a cited, verifiable source.",
    stats: { decisions: "5,340", confidence: 91, focus: "Signal scanning" },
  },
] as const;

export type Agent = (typeof AGENTS)[number];

export const SURFACE = "#05060C";
export const VIOLET = "#8A7BEF";
export const CYAN = "#0891CF";

export const REVENUE_SERIES = [42, 48, 45, 61, 58, 72, 69, 84, 91, 88, 104, 121];
export const HEALTH_SCORE = 87;
