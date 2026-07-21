import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useRef } from "react";

import { DashboardPreview } from "#/components/landing/DashboardPreview";

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);

  return (
    <section ref={containerRef} className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32 bg-white min-h-[90vh]">
      {/* Background gradients and grid */}
      <motion.div style={{ opacity, y: useTransform(scrollYProgress, [0, 1], [0, 100]) }} className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute -top-40 left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-[#6C5CE7]/20 to-purple-300/20 opacity-50 blur-3xl mix-blend-multiply" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-blue-100/40 blur-3xl mix-blend-multiply" />
      </motion.div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-center">
          
          {/* Left Column: Copy */}
          <motion.div style={{ opacity, y, scale }} className="w-full lg:w-1/2 perspective-[1000px]">
            <motion.div
              initial={{ opacity: 0, z: -100, rotateX: 10 }}
              animate={{ opacity: 1, z: 0, rotateX: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#6C5CE7]/20 bg-[#6C5CE7]/5 px-3 py-1 text-sm font-medium text-[#6C5CE7] backdrop-blur-sm shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-[#6C5CE7] animate-pulse" />
                CrewMind OS 2.0 is now live
              </div>
              
              <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl xl:text-7xl leading-[1.1]">
                Your <span className="bg-gradient-to-r from-[#6C5CE7] to-purple-500 bg-clip-text text-transparent">AI Executive</span> Team for Smarter Decisions
              </h1>
              
              <p className="mb-8 max-w-xl text-lg text-gray-500 sm:text-xl leading-relaxed">
                CrewMind brings together five specialized AI agents that analyze your data, uncover hidden opportunities, and deliver executive-level insights in seconds.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  to="/register"
                  className="group flex h-14 items-center justify-center gap-2 rounded-xl bg-[#6C5CE7] px-8 text-base font-bold text-white shadow-xl shadow-[#6C5CE7]/30 transition-all hover:bg-[#5a4cdb] hover:shadow-2xl hover:shadow-[#6C5CE7]/40 hover:-translate-y-0.5 active:scale-95"
                >
                  Start free
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <button className="flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-gray-100 bg-white px-8 text-base font-bold text-gray-700 shadow-sm transition-all hover:border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200">
                  <Play className="h-5 w-5" />
                  Book a demo
                </button>
              </div>

              <div className="mt-10 flex items-center gap-4 text-sm text-gray-500 font-medium">
                 <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                       <div key={i} className={`h-8 w-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm z-[${5-i}]`}>
                          {String.fromCharCode(64 + i)}
                       </div>
                    ))}
                 </div>
                 <div className="flex flex-col">
                    <div className="flex items-center text-yellow-400">
                       {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                    </div>
                    <span>Trusted by 10,000+ executives</span>
                 </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column: Visuals */}
          <div className="w-full lg:w-1/2 relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#6C5CE7]/10 to-transparent blur-3xl" />
             <DashboardPreview />
             
             {/* Floating Elements */}
             <motion.div
               animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
               transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
               className="absolute -left-12 top-1/4 hidden md:flex h-24 w-24 items-center justify-center rounded-2xl border border-white/40 bg-white/60 shadow-xl backdrop-blur-md"
             >
                <div className="text-center">
                   <p className="text-2xl font-bold text-gray-900">94</p>
                   <p className="text-[10px] font-bold uppercase tracking-wider text-green-600">Health</p>
                </div>
             </motion.div>

             <motion.div
               animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
               transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute -right-8 bottom-1/4 hidden md:flex h-20 w-48 items-center gap-3 rounded-2xl border border-white/40 bg-white/60 px-4 shadow-xl backdrop-blur-md z-20"
             >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#6C5CE7] to-purple-400 flex items-center justify-center text-white font-bold shadow-inner">
                   S
                </div>
                <div>
                   <p className="text-sm font-bold text-gray-900 leading-none mb-1">Strategy Agent</p>
                   <p className="text-xs font-medium text-green-600 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Online</p>
                </div>
             </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
