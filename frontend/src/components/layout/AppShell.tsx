import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { CommandPalette } from "#/components/layout/CommandPalette";
import { OsBackground } from "#/components/layout/OsBackground";
import { Sidebar } from "#/components/layout/Sidebar";
import { Topbar } from "#/components/layout/Topbar";
import { Assistant } from "#/components/os/Assistant";
import { ContextMenuProvider } from "#/components/os/ContextMenu";
import { Dock } from "#/components/os/Dock";
import { useShortcuts } from "#/hooks/useShortcuts";
import { navByPath } from "#/lib/navigation";
import { useUiStore } from "#/stores/uiStore";
import { cn } from "#/lib/utils";

export function AppShell({
  title,
  children,
  wide = false,
  flush = false,
}: {
  title: string;
  children: ReactNode;
  /** Allow the content column to stretch to the full shell width. */
  wide?: boolean;
  /** Fill the viewport height with no scroll padding (chat-style pages). */
  flush?: boolean;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const theme = useUiStore((s) => s.theme);
  const pushRecent = useUiStore((s) => s.pushRecent);
  const location = useLocation();
  useShortcuts();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const entry = navByPath(location.pathname);
    if (entry) pushRecent({ id: entry.to, label: entry.label, to: entry.to });
  }, [location.pathname, pushRecent]);

  return (
    <ContextMenuProvider>
      <div
        className={cn(
          "world flex h-screen overflow-hidden font-sans text-slate-100 antialiased selection:bg-crew-500 selection:text-white",
          theme === "bright" && "bright",
        )}
      >
        <OsBackground />
        <div className="world-noise" aria-hidden />
        <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

        <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />

        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <Topbar title={title} onOpenMenu={() => setMobileNavOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
          <motion.main
            key={title}
            initial={{ opacity: 0, y: 16, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className={
              flush
                ? "relative z-10 flex-1 overflow-hidden"
                : "relative z-10 flex-1 overflow-y-auto p-4 pb-28 sm:p-8"
            }
          >
            <div className={flush ? "h-full" : wide ? "mx-auto h-full max-w-[1400px]" : "mx-auto h-full max-w-7xl"}>
              {children}
            </div>
          </motion.main>
        </div>

        <Dock />
        <Assistant />
      </div>
    </ContextMenuProvider>
  );
}
