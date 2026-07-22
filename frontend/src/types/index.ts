export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  org_id: string;
  org_name: string;
}

export type AgentKey = "research" | "strategy" | "finance" | "operations" | "legal";

// A message in an "all agents" conversation may come from the synthesis step
// rather than one of the five named agents.
export type CrewAgentKey = AgentKey | "coordinator";

export interface AgentMeta {
  key: AgentKey;
  name: string;
  /** Persona name used across the product (matches the landing page). */
  persona: string;
  title: string;
  /** Validated categorical color for the dark surface — do not eyeball-edit. */
  color: string;
  description: string;
  focus: string[];
}

export const AGENTS: AgentMeta[] = [
  {
    key: "research",
    name: "Research",
    persona: "Scout",
    title: "Chief Research Officer",
    color: "#0891CF",
    description: "External context: market trends, competitors, industry signals.",
    focus: ["Market research", "Competitor monitoring", "Industry trends", "News intelligence", "External insights"],
  },
  {
    key: "strategy",
    name: "Strategy",
    persona: "Atlas",
    title: "Chief Strategy Officer",
    color: "#8A7BEF",
    description: "Growth, competitive position, business strategy.",
    focus: ["Business strategy", "Growth opportunities", "SWOT analysis", "Market positioning", "Executive recommendations"],
  },
  {
    key: "finance",
    name: "Finance",
    persona: "Ledger",
    title: "Chief Financial Officer",
    color: "#D97706",
    description: "Revenue, KPIs, forecasting, financial health.",
    focus: ["Revenue analysis", "KPI tracking", "Cash flow", "Forecasting", "Cost optimization"],
  },
  {
    key: "operations",
    name: "Operations",
    persona: "Flux",
    title: "Chief Operating Officer",
    color: "#059669",
    description: "Workflow, productivity, inventory, execution.",
    focus: ["Workflow analysis", "Process optimization", "Inventory management", "Bottleneck detection", "Efficiency"],
  },
  {
    key: "legal",
    name: "Legal",
    persona: "Clause",
    title: "General Counsel",
    color: "#EC4899",
    description: "Contracts, compliance, legal risk.",
    focus: ["Contract review", "Compliance analysis", "Legal summaries", "Risk identification", "Policy validation"],
  },
];

export const COORDINATOR_META = {
  key: "coordinator" as const,
  name: "Coordinator",
  persona: "Nexus",
  title: "AI Coordinator",
  color: "#A395F4",
  description: "Combines every agent's findings into one executive report.",
};

export type DocumentStatus = "uploaded" | "parsing" | "indexed" | "failed";

export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  status: DocumentStatus;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
}

export type ConversationMode = "single_agent" | "all_agents";

export interface Conversation {
  id: string;
  title: string;
  mode: ConversationMode;
  agent_key: AgentKey | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent" | "system";
  agent_key: CrewAgentKey | null;
  content: string;
  created_at: string;
}

export type AgentRunStatus =
  | "pending"
  | "researching"
  | "analyzing"
  | "synthesizing"
  | "completed"
  | "failed";

export interface AgentRun {
  id: string;
  status: AgentRunStatus;
  trigger: string;
  error_message: string | null;
  created_at: string;
}

export interface Report {
  id: string;
  agent_run_id: string;
  business_health_score: number;
  summary: string;
  risks: string[];
  opportunities: string[];
  recommendations: string[];
  title: string;
  created_at: string;
}
