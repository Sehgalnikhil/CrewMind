import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";

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

export function AgentDeck() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // The section is very tall so you can scroll through it
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-gray-900">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        
        {/* Background Ambient Glow based on scroll */}
        <motion.div 
          className="absolute inset-0 opacity-40 blur-[100px]"
          style={{
            background: useTransform(
              scrollYProgress,
              [0, 0.25, 0.5, 0.75, 1],
              [
                `radial-gradient(circle at 50% 50%, ${TEAM[0].color}40, transparent 60%)`,
                `radial-gradient(circle at 50% 50%, ${TEAM[1].color}40, transparent 60%)`,
                `radial-gradient(circle at 50% 50%, ${TEAM[2].color}40, transparent 60%)`,
                `radial-gradient(circle at 50% 50%, ${TEAM[3].color}40, transparent 60%)`,
                `radial-gradient(circle at 50% 50%, ${TEAM[4].color}40, transparent 60%)`
              ]
            )
          }}
        />

        <div className="absolute top-12 md:top-24 text-center z-50">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            Meet Your <span className="text-[#6C5CE7]">AI Executive</span> Team
          </h2>
          <p className="mt-4 text-gray-400 max-w-xl mx-auto">
            Scroll to dive deep into the capabilities of each autonomous agent.
          </p>
        </div>

        <div className="relative h-[500px] w-full max-w-sm md:max-w-md perspective-[2000px]">
          {TEAM.map((agent, index) => {
            // Calculate ranges so each card peels off sequentially
            const startScroll = index * 0.2;
            const peelScroll = startScroll + 0.15;
            const endScroll = startScroll + 0.2;

            // Z-index: Back cards are lower in array, we want them rendered first but displayed behind
            // React naturally stacks them. 
            // The top card is index 0. We want index 0 to peel off first.
            
            // As user scrolls, the card flies UP and Towards the camera, fading out.
            const y = useTransform(
              scrollYProgress,
              [startScroll, peelScroll, endScroll],
              [index * 20, index * 20 - 200, index * 20 - 800]
            );

            const z = useTransform(
              scrollYProgress,
              [startScroll, peelScroll, endScroll],
              [-index * 50, -index * 50 + 200, -index * 50 + 800]
            );

            const rotateX = useTransform(
              scrollYProgress,
              [startScroll, peelScroll],
              [10, 45]
            );

            const opacity = useTransform(
              scrollYProgress,
              [peelScroll, endScroll],
              [1, 0]
            );

            return (
              <motion.div
                key={agent.name}
                style={{
                  y,
                  z,
                  rotateX,
                  opacity,
                  zIndex: TEAM.length - index,
                  transformStyle: "preserve-3d"
                }}
                className="absolute inset-0 flex flex-col justify-between rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-3xl overflow-hidden origin-bottom"
              >
                {/* Agent Card Inner Content */}
                <div className="relative z-10 flex items-center justify-between">
                   <div>
                      <h3 className="text-2xl font-bold text-white">{agent.name}</h3>
                      <p className="font-bold uppercase tracking-wider" style={{ color: agent.color }}>
                         {agent.role}
                      </p>
                   </div>
                   <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white shadow-inner border border-white/10">
                      {agent.role.charAt(0)}
                   </div>
                </div>

                <div className="relative z-10 my-8 flex-1">
                   <p className="text-lg text-gray-300 leading-relaxed">
                      {agent.desc}
                   </p>
                </div>

                <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6">
                   <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium text-green-500">Active</span>
                   </div>
                   <button className="flex items-center text-sm font-semibold text-white transition-colors hover:text-gray-300">
                      View Capabilities <ArrowRight className="ml-1 h-4 w-4" />
                   </button>
                </div>

                {/* Big Avatar rendering in background of card */}
                <img 
                  src={agent.avatar} 
                  alt={agent.name} 
                  className="absolute bottom-0 right-[-10%] w-[120%] object-cover object-bottom opacity-20 transition-transform duration-500 hover:scale-110 pointer-events-none z-0 mix-blend-screen"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
