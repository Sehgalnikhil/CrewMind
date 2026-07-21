import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export function DashboardPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // 3D Transforms based on scroll
  // As user scrolls down, the dashboard rotates back to flat and the layers separate
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [25, 0]);
  const rotateY = useTransform(scrollYProgress, [0, 0.5], [-15, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
  
  // Z-axis separation for the explosion effect
  const sidebarZ = useTransform(scrollYProgress, [0, 0.5], [80, 0]);
  const topbarZ = useTransform(scrollYProgress, [0, 0.5], [40, 0]);
  const chartZ = useTransform(scrollYProgress, [0, 0.5], [120, 0]);
  const cardsZ = useTransform(scrollYProgress, [0, 0.5], [60, 0]);

  return (
    <div ref={containerRef} className="relative w-full h-full perspective-[2000px] flex items-center justify-center p-8">
      <motion.div
        style={{ rotateX, rotateY, scale, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-4xl rounded-3xl border border-white/40 bg-white/40 p-4 shadow-2xl shadow-[#6C5CE7]/30 backdrop-blur-2xl"
      >
        {/* Fake Browser Chrome */}
        <div className="mb-4 flex items-center gap-2 px-2" style={{ transform: "translateZ(10px)" }}>
          <div className="h-3 w-3 rounded-full bg-red-400 shadow-sm" />
          <div className="h-3 w-3 rounded-full bg-yellow-400 shadow-sm" />
          <div className="h-3 w-3 rounded-full bg-green-400 shadow-sm" />
        </div>

        <div className="relative rounded-2xl bg-white/80 p-6 shadow-inner ring-1 ring-gray-100/50 backdrop-blur-xl" style={{ transformStyle: "preserve-3d" }}>
          
          {/* Fake Topbar */}
          <motion.div style={{ z: topbarZ }} className="mb-8 flex items-center justify-between border-b border-gray-100/50 pb-4 bg-white/50 backdrop-blur-md rounded-xl p-2 shadow-sm">
            <div className="h-6 w-32 rounded-lg bg-gray-200/50" />
            <div className="flex gap-3">
               <div className="h-8 w-8 rounded-full bg-gray-200/50" />
               <div className="h-8 w-8 rounded-full bg-[#6C5CE7]/20" />
            </div>
          </motion.div>

          {/* Fake Content */}
          <div className="grid gap-6 md:grid-cols-3" style={{ transformStyle: "preserve-3d" }}>
            {/* Main Chart Area */}
            <div className="col-span-2 space-y-6" style={{ transformStyle: "preserve-3d" }}>
              <motion.div style={{ z: chartZ }} className="h-48 rounded-xl bg-gradient-to-br from-gray-50/50 to-white p-6 shadow-xl ring-1 ring-gray-200/50">
                 <div className="mb-4 h-5 w-40 rounded bg-gray-200/50" />
                 <div className="flex h-24 items-end gap-2">
                    {[40, 70, 45, 90, 65, 100, 85].map((h, i) => (
                      <motion.div 
                        key={i}
                        className="w-full rounded-t-md bg-[#6C5CE7]/40 shadow-sm"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                 </div>
              </motion.div>
              <div className="grid grid-cols-2 gap-4" style={{ transformStyle: "preserve-3d" }}>
                 <motion.div style={{ z: cardsZ }} className="h-32 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200/50">
                    <div className="mb-2 h-4 w-24 rounded bg-gray-200/50" />
                    <div className="h-8 w-16 rounded bg-green-500/30" />
                 </motion.div>
                 <motion.div style={{ z: cardsZ }} className="h-32 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200/50">
                    <div className="mb-2 h-4 w-24 rounded bg-gray-200/50" />
                    <div className="h-8 w-16 rounded bg-red-500/30" />
                 </motion.div>
              </div>
            </div>
            
            {/* Sidebar Area */}
            <div className="space-y-4" style={{ transformStyle: "preserve-3d" }}>
               <motion.div style={{ z: sidebarZ }} className="h-32 rounded-xl bg-white p-4 shadow-xl ring-1 ring-gray-200/50">
                  <div className="mb-4 h-4 w-24 rounded bg-gray-200/50" />
                  <div className="mx-auto h-16 w-16 rounded-full border-4 border-[#6C5CE7]/30 shadow-inner" />
               </motion.div>
               <motion.div style={{ z: sidebarZ }} className="h-48 rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-200/50 flex flex-col gap-3">
                  <div className="mb-2 h-4 w-20 rounded bg-gray-200/50" />
                  {[1, 2, 3, 4].map(i => (
                     <div key={i} className="h-6 w-full rounded bg-gray-100/50" />
                  ))}
               </motion.div>
            </div>
          </div>

          {/* Floating Abstract Element */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-8 -top-8 h-32 w-32 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-purple-400 opacity-30 blur-2xl pointer-events-none"
            style={{ transform: "translateZ(-50px)" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
