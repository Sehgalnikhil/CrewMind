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

export interface ReasoningStep {
  agent: CrewAgentKey;
  monologue: string[];
  critic: string | null;
  confidence: number;
}

export type WsMessage =
  | { type: "run_status"; status: AgentRunStatus }
  | { type: "agent_status"; agent_key: AgentKey; status: "running" | "done" }
  | { type: "reasoning_step"; agent: CrewAgentKey; monologue: string[]; critic: string | null; confidence: number }
  | { type: "completed"; report_id: string }
  | { type: "failed"; message: string }
  | { type: "agent_message"; id: string; sender: AgentKey; receiver: AgentKey; intent: string; content: string; confidence: number; priority: number; evidence: string[]; thread_id: string; timestamp: string }
  | { type: "dashboard_metrics"; metrics: any };

export interface AgentRun {
  id: string;
  status: "pending" | "researching" | "analyzing" | "synthesizing" | "completed" | "failed";
  trigger: string;
  error_message: string | null;
  created_at: string;
}

export interface AgentState {
  id: string;
  agent_key: AgentKey;
  goals: string[];
  observations: string[];
  confidence: number;
  personality: Record<string, any>;
  reasoning_history: any[];
  last_active_at: string;
  created_at: string;
}

export interface AgentTask {
  id: string;
  agent_key: AgentKey;
  title: string;
  description: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  priority: number;
  source: string;
  due_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  result_json: string | null;
  parent_task_id: string | null;
  error_message: string | null;
  created_at: string;
}

export interface TaskQueueStats {
  queued: number;
  running: number;
  completed: number;
  failed: number;
  total: number;
}

export interface AgentMessage {
  id: string;
  sender: AgentKey;
  receiver: AgentKey;
  intent: string;
  content: string;
  confidence: number;
  priority: number;
  evidence: string[];
  thread_id: string | null;
  execution_id: string | null;
  result_json: string | null;
  created_at: string;
}

export interface MemoryRecord {
  id: string;
  agent_source: AgentKey;
  kind: string;
  content: string;
  title: string;
  tier: "working" | "short_term" | "long_term" | "semantic" | "executive";
  importance: number;
  linked_memory_ids: string[];
  access_count: number;
  expires_at: string | null;
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
