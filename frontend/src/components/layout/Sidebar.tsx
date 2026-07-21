import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
  X,
  Layout
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
      <div className="flex items-center gap-3 px-6 py-6 border-b border-gray-100">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7] text-white shadow-md shadow-[#6C5CE7]/20">
          <Layout className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-gray-900">CrewMind</span>
      </div>

      <div className="px-6 pt-6 pb-2">
         <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Workspace</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-4 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#6C5CE7]/10 text-[#6C5CE7] shadow-sm ring-1 ring-[#6C5CE7]/20"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-[#6C5CE7]" : "text-gray-400 group-hover:text-gray-600")} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-6">
         <div className="rounded-2xl border border-[#6C5CE7]/10 bg-[#6C5CE7]/5 p-4 relative overflow-hidden">
             <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#6C5CE7]/10 blur-xl" />
            <h4 className="mb-1 text-sm font-bold text-gray-900">Pro Plan</h4>
            <p className="mb-3 text-xs text-gray-500 leading-relaxed">Your AI executive team is running smoothly.</p>
            <button className="w-full rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#6C5CE7] shadow-sm ring-1 ring-gray-200 transition-all hover:bg-gray-50 hover:shadow-md">
               Manage Billing
            </button>
         </div>
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
      {/* Desktop */}
      <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-gray-100 bg-white shadow-xl shadow-gray-200/20 lg:flex z-20">
        <SidebarContent />
      </aside>

      {/* Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl lg:hidden"
            >
              <button
                onClick={onCloseMobile}
                className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={onCloseMobile} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
