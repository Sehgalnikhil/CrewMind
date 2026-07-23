import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "#/lib/utils";
import { useAllowedNav } from "#/core/permissions/useNav";
import { AGENTS } from "#/types";

const GROUPS: { key: string; label: string | null; paths: string[] }[] = [
  { key: "command", label: null, paths: ["/dashboard", "/war-room", "/feed", "/timeline"] },
  { key: "intelligence", label: "Intelligence", paths: ["/wiki", "/twin", "/memory", "/simulator", "/brain"] },
  { key: "operate", label: "Operate", paths: ["/chat", "/documents", "/reports"] },
  { key: "system", label: "System", paths: ["/notifications", "/organization", "/billing", "/admin", "/profile", "/settings"] },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const allowedNav = useAllowedNav();
  return (
    <>
      {/* logo */}
      <NavLink to="/dashboard" className="flex items-center gap-2.5 px-6 py-6">
        <div className="conic-ring flex h-9 w-9 items-center justify-center rounded-xl">
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#0B0D14]">
            <span className="bg-gradient-to-br from-crew-300 to-[#67c7f5] bg-clip-text text-sm font-extrabold text-transparent">C</span>
          </div>
        </div>
        <div>
          <span className="block text-lg font-extrabold leading-tight tracking-tight text-white">CrewMind</span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">executive os</span>
        </div>
      </NavLink>

      <div className="flex-1 overflow-y-auto">
        {GROUPS.map((group) => {
          const visiblePaths = group.paths.filter((path) => allowedNav.some((e) => e.to === path));
          if (visiblePaths.length === 0) return null;
          return (
          <div key={group.key}>
            {group.label && (
              <p className="px-6 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{group.label}</p>
            )}
            <nav className="flex flex-col gap-0.5 px-3 pt-1">
              {visiblePaths.map((path) => {
                const item = allowedNav.find((e) => e.to === path)!;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200",
                        isActive ? "text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active"
                            className="absolute inset-0 rounded-2xl border border-crew-500/30 bg-crew-500/15 shadow-[0_0_30px_-10px_rgba(108,92,231,0.7)]"
                            transition={{ type: "spring", stiffness: 380, damping: 32 }}
                          />
                        )}
                        <Icon className={cn("relative z-10 h-[18px] w-[18px] transition-colors", isActive ? "text-crew-300" : "text-slate-500 group-hover:text-slate-300")} />
                        <span className="relative z-10">{item.label}</span>
                        {item.chord && (
                          <kbd className="relative z-10 ml-auto rounded border border-white/10 bg-white/[0.04] px-1 py-0.5 font-mono text-[9px] text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                            g {item.chord}
                          </kbd>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
          );
        })}

        {/* executive roster */}
        <div className="mt-5 px-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">Your executives</p>
        </div>
        <div className="mt-2 flex flex-col gap-0.5 px-3 pb-4">
          {AGENTS.map((a) => (
            <NavLink
              key={a.key}
              to={`/agents/${a.key}`}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-1.5 text-[13px] transition-colors",
                  isActive ? "bg-white/[0.05] text-white" : "text-slate-400 hover:bg-white/[0.03] hover:text-slate-200",
                )
              }
            >
              <span
                className="relative flex h-2 w-2 shrink-0 rounded-full status-ping"
                style={{ backgroundColor: a.color, color: a.color }}
              />
              <span className="font-semibold">{a.persona}</span>
              <span className="ml-auto text-[10px] text-slate-600 transition-colors group-hover:text-slate-500">{a.name}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1 px-3 pb-4 pt-2">
        <div className="glass holo-sheen relative mx-1 overflow-hidden rounded-2xl p-4">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-crew-500/25 blur-2xl" />
          <p className="text-sm font-bold text-white">Boardroom plan</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">All five executives online and reading your business.</p>
          <div className="mt-3 flex items-center gap-1.5">
            {AGENTS.map((a) => (
              <span key={a.key} className="h-1 flex-1 rounded-full" style={{ backgroundColor: a.color, opacity: 0.8 }} />
            ))}
          </div>
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
      <aside className="relative z-20 hidden h-screen w-64 shrink-0 flex-col border-r border-white/[0.06] bg-[#07080f]/70 backdrop-blur-2xl lg:flex">
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
              className="fixed inset-0 z-40 bg-[#020308]/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/[0.06] bg-[#07080f]/95 backdrop-blur-2xl lg:hidden"
            >
              <button
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="absolute right-4 top-6 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
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
