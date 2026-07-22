import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BadgeDollarSign,
  Bell,
  BrainCircuit,
  Building2,
  FileText,
  FlaskConical,
  LayoutDashboard,
  MessageSquare,
  Network,
  Radar,
  Rss,
  Settings,
  ShieldCheck,
  Sparkles,
  Swords,
  User,
  Zap,
} from "lucide-react";

export interface NavEntry {
  to: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  group: NavGroup;
  /** Show in the floating dock. */
  dock?: boolean;
  /** Exact match for active state. */
  end?: boolean;
  /** Single-key `g` chord shortcut, e.g. "d" → g d. */
  chord?: string;
}

export type NavGroup = "Command" | "Intelligence" | "Operate" | "System";

export const NAV_GROUPS: NavGroup[] = ["Command", "Intelligence", "Operate", "System"];

export const NAV_ENTRIES: NavEntry[] = [
  { to: "/dashboard", label: "Mission Control", hint: "Live executive command center", icon: LayoutDashboard, group: "Command", dock: true, chord: "d" },
  { to: "/war-room", label: "War Room", hint: "Five executives, one strategy table", icon: Swords, group: "Command", dock: true, chord: "w" },
  { to: "/feed", label: "Executive Feed", hint: "What the crew is thinking, live", icon: Rss, group: "Command", chord: "f" },
  { to: "/timeline", label: "Timeline", hint: "Every decision on one axis", icon: Activity, group: "Command", chord: "l" },

  { to: "/graph", label: "Knowledge Graph", hint: "Everything your company knows, connected", icon: Network, group: "Intelligence", dock: true, chord: "g" },
  { to: "/twin", label: "Digital Twin", hint: "A living map of the organization", icon: Radar, group: "Intelligence", chord: "t" },
  { to: "/memory", label: "Executive Memory", hint: "Search all organizational memory", icon: BrainCircuit, group: "Intelligence", chord: "m" },
  { to: "/simulator", label: "Scenario Simulator", hint: "Stress-test decisions before making them", icon: FlaskConical, group: "Intelligence", chord: "s" },
  { to: "/brain", label: "AI Brain", hint: "Inside the mind of the crew", icon: BrainCircuit, group: "Intelligence", chord: "b" },

  { to: "/agents", label: "AI Workspace", hint: "Run a full crew analysis", icon: Zap, group: "Operate", dock: true, end: true, chord: "a" },
  { to: "/chat", label: "Boardroom Chat", hint: "Talk to your executives", icon: MessageSquare, group: "Operate", dock: true, chord: "c" },
  { to: "/documents", label: "Documents", hint: "Upload & manage knowledge", icon: FileText, group: "Operate", dock: true, chord: "u" },
  { to: "/reports", label: "Reports", hint: "Signed crew verdicts", icon: Sparkles, group: "Operate", chord: "r" },

  { to: "/notifications", label: "Notifications", hint: "Everything that needs your eyes", icon: Bell, group: "System", chord: "n" },
  { to: "/organization", label: "Organization", hint: "Company, teams & workspaces", icon: Building2, group: "System", chord: "o" },
  { to: "/billing", label: "Billing", hint: "Plan, usage & invoices", icon: BadgeDollarSign, group: "System" },
  { to: "/admin", label: "Admin Console", hint: "Members, roles & audit log", icon: ShieldCheck, group: "System" },
  { to: "/profile", label: "Profile", hint: "You, on CrewMind", icon: User, group: "System", chord: "p" },
  { to: "/settings", label: "Settings", hint: "Profile, org & system", icon: Settings, group: "System", chord: "," },
];

export function navByPath(path: string): NavEntry | undefined {
  return NAV_ENTRIES.find((e) => e.to === path);
}
