import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const TEAM = [
  {
    name: "Strategy Agent",
    role: "CEO",
    desc: "Trends, market analysis, growth opportunities, and strategic direction.",
    color: "#6C5CE7",
    avatar: "/avatars/avatar_strategy_1784629082272.png",
  },
  {
    name: "Finance Agent",
    role: "CFO",
    desc: "Financial analysis, forecasting, KPIs, cash flow, profitability and performance.",
    color: "#2ECC71",
    avatar: "/avatars/avatar_finance_1784629093299.png",
  },
  {
    name: "Operations Agent",
    role: "COO",
    desc: "Operations efficiency, workflows, productivity, inventory and processes.",
    color: "#F5A623",
    avatar: "/avatars/avatar_operations_1784629103411.png",
  },
  {
    name: "Legal Agent",
    role: "General Counsel",
    desc: "Contracts, compliance, risk analysis, legal documents review.",
    color: "#E74C3C",
    avatar: "/avatars/avatar_legal_1784629113492.png",
  },
  {
    name: "Research Agent",
    role: "Chief Research Officer",
    desc: "Market research, competitor intelligence, industry trends, and external data.",
    color: "#22C1C3",
    avatar: "/avatars/avatar_research_1784629124469.png",
  },
];

export function TeamSection() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Meet Your <span className="text-[#6C5CE7]">AI Executive</span> Team
          </h2>
        </div>

        <div className="flex flex-nowrap overflow-x-auto pb-8 pt-4 gap-6 scrollbar-hide snap-x md:grid md:grid-cols-5 md:overflow-visible">
          {TEAM.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, type: "spring" }}
              className="group relative min-w-[280px] snap-center rounded-3xl border border-gray-100 bg-white p-6 shadow-xl shadow-gray-200/40 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#6C5CE7]/20 md:min-w-0"
            >
              {/* Status Indicator */}
              <div className="absolute right-4 top-4 flex h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              
              {/* Colored Glow behind avatar */}
              <div 
                 className="absolute left-1/2 top-20 h-24 w-24 -translate-x-1/2 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-30"
                 style={{ backgroundColor: agent.color }}
              />

              <div className="mb-6 h-40 w-full overflow-hidden rounded-2xl bg-gray-50 flex items-end justify-center relative">
                 <img 
                   src={agent.avatar} 
                   alt={agent.name} 
                   className="h-44 w-auto object-cover object-bottom transition-transform duration-500 group-hover:scale-110 relative z-10 drop-shadow-xl" 
                 />
              </div>

              <h3 className="mb-1 text-lg font-bold text-gray-900" style={{ color: agent.color }}>
                 {agent.name}
              </h3>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                 {agent.role}
              </p>
              <p className="mb-6 text-sm text-gray-500 leading-relaxed h-20">
                 {agent.desc}
              </p>
              
              <button 
                 className="flex items-center text-sm font-semibold transition-colors group-hover:underline"
                 style={{ color: agent.color }}
              >
                 Learn more <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
