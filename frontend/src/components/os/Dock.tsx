import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { MoonStar, Sparkles, SunMedium } from "lucide-react";
import { useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";

import { useAllowedNav } from "#/core/permissions/useNav";
import { useUiStore } from "#/stores/uiStore";
import { cn } from "#/lib/utils";

function DockIcon({
  mouseX,
  active,
  label,
  children,
}: {
  mouseX: MotionValue<number>;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const distance = useTransform(mouseX, (x) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return 999;
    return x - (bounds.x + bounds.width / 2);
  });
  const size = useSpring(useTransform(distance, [-110, 0, 110], [40, 58, 40]), {
    stiffness: 320,
    damping: 22,
  });
  const y = useSpring(useTransform(distance, [-110, 0, 110], [0, -10, 0]), {
    stiffness: 320,
    damping: 22,
  });

  return (
    <motion.div ref={ref} style={{ width: size, height: size, y }} className="group relative flex items-end">
      <div
        className={cn(
          "flex h-full w-full items-center justify-center rounded-2xl border transition-colors",
          active
            ? "border-crew-500/40 bg-crew-500/20 text-crew-300 shadow-[0_0_28px_-8px_rgba(108,92,231,0.9)]"
            : "border-white/10 bg-white/[0.05] text-slate-300 hover:border-white/25 hover:text-white",
        )}
      >
        {children}
      </div>
      <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0a0c16]/95 px-2.5 py-1 text-[11px] font-bold text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
        {label}
      </span>
      {active && <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-crew-300" />}
    </motion.div>
  );
}

/** Floating macOS-style dock — the OS's fastest way between workspaces. */
export function Dock() {
  const mouseX = useMotionValue<number>(9999);
  const location = useLocation();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const setAssistantOpen = useUiStore((s) => s.setAssistantOpen);
  const assistantOpen = useUiStore((s) => s.assistantOpen);
  const dockItems = useAllowedNav().filter((e) => e.dock);

  return (
    <motion.nav
      initial={{ y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(9999)}
      aria-label="Workspace dock"
      className="glass-deep fixed bottom-4 left-1/2 z-40 hidden -translate-x-1/2 items-end gap-2 rounded-3xl px-3 pb-2 pt-2 lg:flex"
    >
      {dockItems.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} aria-label={item.label}>
          {({ isActive }) => (
            <DockIcon mouseX={mouseX} active={isActive} label={item.label}>
              <item.icon className="h-[45%] w-[45%]" />
            </DockIcon>
          )}
        </NavLink>
      ))}

      <span className="mx-1 mb-1 h-8 w-px self-end bg-white/10" />

      <button onClick={() => setAssistantOpen(!assistantOpen)} aria-label="AI assistant">
        <DockIcon mouseX={mouseX} label="Nexus — AI assistant" active={assistantOpen}>
          <Sparkles className="h-[45%] w-[45%]" />
        </DockIcon>
      </button>
      <button onClick={toggleTheme} aria-label="Switch theme">
        <DockIcon mouseX={mouseX} label={theme === "dark" ? "Bright theme" : "Dark theme"}>
          {theme === "dark" ? <SunMedium className="h-[45%] w-[45%]" /> : <MoonStar className="h-[45%] w-[45%]" />}
        </DockIcon>
      </button>
      <span className="sr-only">Current page: {location.pathname}</span>
    </motion.nav>
  );
}
