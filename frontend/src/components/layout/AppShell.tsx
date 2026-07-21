import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";

import { Sidebar } from "#/components/layout/Sidebar";
import { Topbar } from "#/components/layout/Topbar";

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 selection:bg-[#6C5CE7] selection:text-white">
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden relative">
         <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(#6C5CE7 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <Topbar title={title} onOpenMenu={() => setMobileNavOpen(true)} />
        <motion.main
          key={title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-8"
        >
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </motion.main>
      </div>
    </div>
  );
}
