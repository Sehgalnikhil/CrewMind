import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "#/components/layout/Sidebar";
import { Topbar } from "#/components/layout/Topbar";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={title} onOpenMenu={() => setMobileNavOpen(true)} />
        <motion.main
          key={title}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex-1 overflow-y-auto p-4 sm:p-8"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
