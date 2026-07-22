import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "#/lib/utils";

export interface MenuAction {
  label: string;
  icon?: LucideIcon;
  danger?: boolean;
  divider?: boolean;
  shortcut?: string;
  onSelect: () => void;
}

interface MenuState {
  x: number;
  y: number;
  actions: MenuAction[];
}

const ContextMenuCtx = createContext<(e: React.MouseEvent, actions: MenuAction[]) => void>(() => {});

export function useContextMenu() {
  return useContext(ContextMenuCtx);
}

/** App-level provider: right-click anywhere a component registers actions. */
export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<MenuState | null>(null);

  const open = useCallback((e: React.MouseEvent, actions: MenuAction[]) => {
    e.preventDefault();
    e.stopPropagation();
    const pad = 8;
    const w = 224;
    const h = actions.length * 38 + 12;
    setMenu({
      x: Math.min(e.clientX, window.innerWidth - w - pad),
      y: Math.min(e.clientY, window.innerHeight - h - pad),
      actions,
    });
  }, []);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  return (
    <ContextMenuCtx.Provider value={open}>
      {children}
      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            style={{ left: menu.x, top: menu.y }}
            className="glass-deep fixed z-[100] w-56 origin-top-left overflow-hidden rounded-2xl p-1.5"
            role="menu"
          >
            {menu.actions.map((a, i) =>
              a.divider ? (
                <div key={i} className="mx-2 my-1 h-px bg-white/[0.07]" />
              ) : (
                <button
                  key={i}
                  role="menuitem"
                  onClick={() => {
                    setMenu(null);
                    a.onSelect();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold transition-colors",
                    a.danger
                      ? "text-[#EC4899] hover:bg-[#EC4899]/10"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white",
                  )}
                >
                  {a.icon && <a.icon className="h-4 w-4 shrink-0 opacity-70" />}
                  <span className="flex-1">{a.label}</span>
                  {a.shortcut && (
                    <kbd className="rounded border border-white/10 bg-white/[0.05] px-1 py-0.5 font-mono text-[9px] text-slate-500">
                      {a.shortcut}
                    </kbd>
                  )}
                </button>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </ContextMenuCtx.Provider>
  );
}
