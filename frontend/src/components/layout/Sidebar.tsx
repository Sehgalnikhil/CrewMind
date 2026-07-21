import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "#/lib/utils";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agents", label: "Agent Panel", icon: Users },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/reports", label: "Reports", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <div className="flex items-center gap-2 px-6 py-5">
        <svg viewBox="0 0 148 100" className="h-6 w-6 shrink-0">
          <g stroke="#6C5CE7" strokeWidth="10" strokeLinecap="round">
            <line x1="40" y1="64" x2="72" y2="30" />
            <line x1="108" y1="64" x2="76" y2="30" />
            <line x1="44" y1="72" x2="104" y2="72" />
          </g>
          <circle cx="74" cy="26" r="18" fill="#6C5CE7" />
          <circle cx="30" cy="72" r="15" fill="#6C5CE7" />
          <circle cx="118" cy="72" r="15" fill="#6C5CE7" />
        </svg>
        <span className="text-lg font-semibold text-white">CrewMind</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-crew-500/15 text-crew-300"
                  : "text-slate-400 hover:bg-surface-card hover:text-slate-200"
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 text-xs text-slate-500">
        Your AI executive team, in one app.
      </div>
    </>
  );
}

export function Sidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {/* Desktop: static, always in-flow */}
      <aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-surface-border bg-surface-raised lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile: off-canvas drawer over a backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-surface-border bg-surface-raised lg:hidden"
            >
              <button
                onClick={onCloseMobile}
                className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-surface-card hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarContent onNavigate={onCloseMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
