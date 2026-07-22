import { motion } from "framer-motion";
import { Activity, BarChart3, Zap, Layout } from "lucide-react";

export function AuthIllustration() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#05060c] p-8 perspective-[1000px]">
      {/* Aurora Lighting & Blobs */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-[#6C5CE7] blur-[120px] aurora-blob float-a" />
        <div className="absolute top-[40%] right-[0%] h-[40%] w-[40%] rounded-full bg-[#0891CF] blur-[120px] aurora-blob float-b" />
        <div className="absolute -bottom-[20%] left-[20%] h-[50%] w-[50%] rounded-full bg-[#EC4899] blur-[120px] aurora-blob float-c opacity-50" />
      </div>
      
      {/* Noise layer */}
      <div className="world-noise" aria-hidden />

      {/* Main 3D Dashboard Card */}
      <motion.div
        initial={{ opacity: 0, rotateX: 15, y: 30, z: -100 }}
        animate={{ opacity: 1, rotateX: 0, y: 0, z: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px] rounded-3xl border border-white/10 glass-deep p-6 shadow-2xl preserve-3d"
      >
        <div className="holo-sheen absolute inset-0 rounded-3xl" />
        
        {/* Dashboard Header */}
        <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#6C5CE7] to-[#8A7BEF] shadow-[0_0_20px_rgba(108,92,231,0.5)]">
               <Layout className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Executive Dashboard</div>
              <div className="text-xs text-[#a395f4] flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live Sync
              </div>
            </div>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
               <div key={i} className={`h-8 w-8 rounded-full border-2 border-[#12141F] bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-crew-500 to-crew-800 z-[${5-i}]`}>
                  A{i}
               </div>
            ))}
          </div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            whileHover={{ scale: 1.05, y: -4 }}
            className="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md transition-all cursor-pointer float-a"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg bg-green-500/20 p-2 text-green-400">
                <Activity className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-green-400">+14.2%</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">98.5</div>
              <div className="text-xs text-gray-400">Health Score</div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.05, y: -4 }}
            className="flex flex-col justify-between rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md transition-all cursor-pointer float-b"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="rounded-lg bg-blue-500/20 p-2 text-blue-400">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-xs font-bold text-green-400">+24%</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">Rs 124k</div>
              <div className="text-xs text-gray-400">ARR Runway</div>
            </div>
          </motion.div>
        </div>

        {/* Dash-flow connection */}
        <div className="relative mt-6 h-[80px] w-full overflow-hidden rounded-xl border border-white/5 bg-white/[0.02]">
           <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <path d="M-10,40 Q100,20 200,40 T500,40" fill="none" stroke="rgba(138, 123, 239, 0.4)" strokeWidth="2" className="dash-flow" />
           </svg>
           <div className="absolute inset-0 bg-gradient-to-t from-[#0B0D14] to-transparent" />
        </div>
      </motion.div>

      {/* Floating UI Elements Around */}
      <motion.div
         initial={{ opacity: 0, x: 40 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.6, duration: 1 }}
         className="absolute right-[5%] top-[20%] z-20 flex items-center gap-3 rounded-2xl border border-white/10 glass px-4 py-3 shadow-2xl float-c"
      >
         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-crew-400 to-[#0891CF]">
            <Zap className="h-4 w-4 text-white" />
         </div>
         <div>
            <div className="text-xs font-bold text-white">Strategy Agent</div>
            <div className="text-[10px] text-crew-300">Optimizing funnel...</div>
         </div>
      </motion.div>

      {/* Footer Copy */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="relative z-10 mt-16 text-center"
      >
        <h3 className="text-2xl font-bold tracking-tight text-white mb-2 text-aurora">
          Your AI Executive Team is waiting.
        </h3>
        <p className="text-sm text-gray-400 max-w-sm mx-auto">
          Sign in to deploy agents, analyze data, and accelerate your business growth.
        </p>
      </motion.div>
    </div>
  );
}
