import { motion } from "framer-motion";
import { FileUp, Brain, LineChart, FileCheck2 } from "lucide-react";

const STEPS = [
  {
    icon: <FileUp className="h-6 w-6 text-white" />,
    title: "Upload Documents",
    desc: "Add PDFs, Excel sheets, reports, contracts, CRM exports and more.",
    color: "from-blue-400 to-blue-600",
  },
  {
    icon: <Brain className="h-6 w-6 text-white" />,
    title: "AI Agents Analyze",
    desc: "Our five AI executives analyze your data in parallel.",
    color: "from-[#6C5CE7] to-purple-600",
  },
  {
    icon: <LineChart className="h-6 w-6 text-white" />,
    title: "Insights Generated",
    desc: "We uncover patterns, risks, opportunities, and KPIs.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: <FileCheck2 className="h-6 w-6 text-white" />,
    title: "Executive Report",
    desc: "Get a unified executive summary with recommendations.",
    color: "from-green-400 to-green-600",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            How <span className="text-[#6C5CE7]">CrewMind</span> works
          </h2>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-10 left-[10%] right-[10%] hidden h-0.5 bg-gray-200 md:block">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-400 via-[#6C5CE7] to-green-500"
            />
          </div>

          <div className="grid gap-12 md:grid-cols-4 md:gap-6 relative z-10">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${step.color} shadow-xl shadow-gray-300 transition-transform group-hover:scale-110 ring-8 ring-gray-50`}>
                  {step.icon}
                </div>
                <div className="mb-2 flex items-center justify-center h-6 w-6 rounded-full bg-[#6C5CE7] text-[10px] font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{step.title}</h3>
                <p className="text-sm text-gray-500 max-w-[200px] mx-auto leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
