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
  title: string;
  color: string;
  description: string;
}

export const AGENTS: AgentMeta[] = [
  {
    key: "research",
    name: "Research",
    title: "Market Intelligence",
    color: "#22C1C3",
    description: "External context: market trends, competitors, industry signals.",
  },
  {
    key: "strategy",
    name: "Strategy",
    title: "CEO",
    color: "#6C5CE7",
    description: "Growth, competitive position, business strategy.",
  },
  {
    key: "finance",
    name: "Finance",
    title: "CFO",
    color: "#2ECC71",
    description: "Revenue, KPIs, forecasting, financial health.",
  },
  {
    key: "operations",
    name: "Operations",
    title: "COO",
    color: "#F5A623",
    description: "Workflow, productivity, inventory, execution.",
  },
  {
    key: "legal",
    name: "Legal",
    title: "General Counsel",
    color: "#E74C3C",
    description: "Contracts, compliance, legal risk.",
  },
];

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
