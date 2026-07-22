import type { DocumentItem } from "#/types";

export type NodeType =
  | "document"
  | "report"
  | "decision"
  | "person"
  | "project"
  | "customer"
  | "competitor"
  | "risk"
  | "metric";

export const NODE_TYPE_META: Record<NodeType, { label: string; color: string }> = {
  document: { label: "Document", color: "#0891CF" },
  report: { label: "Report", color: "#A395F4" },
  decision: { label: "Decision", color: "#D97706" },
  person: { label: "Person", color: "#67c7f5" },
  project: { label: "Project", color: "#8A7BEF" },
  customer: { label: "Customer", color: "#059669" },
  competitor: { label: "Competitor", color: "#EC4899" },
  risk: { label: "Risk", color: "#f5a9cf" },
  metric: { label: "Metric", color: "#34d399" },
};

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  /** 0-11: months ago the node was created — drives the timeline scrubber. */
  month: number;
  x: number;
  y: number;
  degree: number;
}

export interface GraphEdge {
  a: string;
  b: string;
  rel: string;
}

/** Mulberry32 — seeded PRNG so the layout is stable across renders. */
function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RAW: [string, NodeType, number][] = [
  ["EU Expansion Pilot", "project", 2], ["Pricing Refresh", "project", 1], ["SOC 2 Type II", "project", 4],
  ["Warehouse Routing Fix", "project", 0], ["Onboarding Localization", "project", 1],
  ["Acme Industries", "customer", 8], ["Borealis Labs", "customer", 6], ["Cinder & Co", "customer", 5],
  ["Deltaline", "customer", 3], ["Everfield", "customer", 2], ["Fjord Systems", "customer", 1],
  ["Northwind", "competitor", 9], ["Skyforge", "competitor", 7], ["Quantel", "competitor", 4],
  ["Priya Raman", "person", 11], ["Dev Kapoor", "person", 10], ["Sana Iyer", "person", 9],
  ["Marco Silva", "person", 7], ["Lena Fischer", "person", 2],
  ["Churn Rate", "metric", 11], ["Net Revenue Retention", "metric", 11], ["Cash Runway", "metric", 11],
  ["Gross Margin", "metric", 10], ["Pipeline Coverage", "metric", 8],
  ["EU entry approved", "decision", 2], ["Pricing hold Q2", "decision", 3], ["Cloud renegotiation", "decision", 1],
  ["Vendor consolidation", "decision", 0],
  ["GDPR readiness gap", "risk", 2], ["Support cost drift", "risk", 1], ["Key-person dependency", "risk", 5],
  ["Data-residency amendment", "risk", 1], ["Cloud commit overage", "risk", 3],
  ["Q2 Board Deck", "document", 1], ["Master Services Agreement", "document", 6], ["DACH Market Study", "document", 2],
  ["FY Revenue Model", "document", 3], ["Competitor Teardown: Northwind", "document", 1], ["Hiring Plan v3", "document", 2],
  ["Q2 Executive Verdict", "report", 1], ["Pricing Elasticity Review", "report", 2], ["Ops Efficiency Audit", "report", 3],
];

const RAW_EDGES: [number, number, string][] = [
  [0, 24, "authorized by"], [0, 36, "informed by"], [0, 28, "exposes"], [0, 4, "depends on"], [0, 18, "led by"],
  [1, 25, "paused by"], [1, 41, "analysed in"], [1, 11, "pressured by"], [1, 19, "moves"],
  [2, 31, "mitigates"], [2, 35, "evidenced by"], [2, 9, "unblocks"],
  [3, 42, "audited in"], [3, 17, "owned by"], [3, 20, "improves"],
  [4, 0, "supports"], [4, 18, "owned by"],
  [5, 35, "signed"], [6, 35, "signed"], [7, 29, "raises"], [8, 40, "cited in"],
  [9, 2, "waiting on"], [10, 0, "prospect of"],
  [11, 38, "profiled in"], [11, 1, "undercuts"], [12, 24, "considered in"], [13, 36, "compared in"],
  [14, 26, "decided"], [14, 39, "owns"], [15, 3, "fixed"], [16, 30, "flagged"], [17, 42, "presented"],
  [18, 36, "authored"], [19, 40, "tracked in"], [20, 40, "tracked in"], [21, 39, "modelled in"],
  [22, 29, "dented by"], [23, 43, "reviewed in"],
  [24, 40, "recorded in"], [25, 41, "recorded in"], [26, 33, "leverages"], [27, 42, "recommended by"],
  [28, 32, "compounded by"], [29, 22, "threatens"], [30, 26, "mitigated by"], [31, 34, "governed by"],
  [33, 21, "affects"], [34, 5, "binds"], [36, 24, "justified"], [37, 21, "feeds"], [38, 27, "supports"],
  [39, 14, "reviewed by"], [40, 19, "scores"], [41, 25, "led to"], [42, 3, "triggered"],
];

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** Deterministic force layout in a WIDTH×HEIGHT space. */
export function buildGraph(documents: DocumentItem[] = [], width = 1600, height = 1100): GraphData {
  const rand = prng(42);
  const nodes: GraphNode[] = RAW.map(([label, type, month], i) => ({
    id: `n${i}`,
    label,
    type,
    month,
    x: width * (0.15 + rand() * 0.7),
    y: height * (0.15 + rand() * 0.7),
    degree: 0,
  }));
  const edges: GraphEdge[] = RAW_EDGES.map(([a, b, rel]) => ({ a: `n${a}`, b: `n${b}`, rel }));

  // merge real documents in, linked to the knowledge projects
  documents.slice(0, 6).forEach((d, i) => {
    const id = `doc-${d.id}`;
    nodes.push({ id, label: d.filename, type: "document", month: 0, x: width * (0.2 + rand() * 0.6), y: height * (0.2 + rand() * 0.6), degree: 0 });
    edges.push({ a: id, b: `n${i % 5}`, rel: "informs" });
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  // force simulation
  for (let iter = 0; iter < 220; iter++) {
    const t = 1 - iter / 220;
    // repulsion
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        const d2 = Math.max(dx * dx + dy * dy, 100);
        const f = (9000 / d2) * t;
        const d = Math.sqrt(d2);
        dx /= d; dy /= d;
        a.x += dx * f; a.y += dy * f;
        b.x -= dx * f; b.y -= dy * f;
      }
    // springs
    for (const e of edges) {
      const a = byId.get(e.a)!, b = byId.get(e.b)!;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const f = ((d - 130) / d) * 0.04 * t;
      a.x += dx * f; a.y += dy * f;
      b.x -= dx * f; b.y -= dy * f;
    }
    // gravity + bounds
    for (const n of nodes) {
      n.x += (width / 2 - n.x) * 0.012 * t;
      n.y += (height / 2 - n.y) * 0.012 * t;
      n.x = Math.min(Math.max(n.x, 60), width - 60);
      n.y = Math.min(Math.max(n.y, 60), height - 60);
    }
  }
  for (const e of edges) {
    byId.get(e.a)!.degree++;
    byId.get(e.b)!.degree++;
  }
  return { nodes, edges };
}
