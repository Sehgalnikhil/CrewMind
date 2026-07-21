import { motion } from "framer-motion";
import { BarChart3, Lock, Shield, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: <Sparkles className="h-6 w-6 text-purple-500" />,
    title: "Multi-Agent Intelligence",
    description: "Five AI executives working together to analyze every angle of your business.",
    color: "bg-purple-500",
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-blue-500" />,
    title: "Business Health Score",
    description: "Get a real-time score that reflects your overall business performance.",
    color: "bg-blue-500",
  },
  {
    icon: <Shield className="h-6 w-6 text-green-500" />,
    title: "Actionable Insights",
    description: "Clear recommendations that help you grow faster and reduce risks.",
    color: "bg-green-500",
  },
  {
    icon: <Lock className="h-6 w-6 text-rose-500" />,
    title: "Secure & Private",
    description: "Your data is encrypted and never used to train public models.",
    color: "bg-rose-500",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 bg-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(#f9f9fb_1px,transparent_1px)] [background-size:16px_16px] opacity-50" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Why teams love <span className="text-[#6C5CE7]">CrewMind</span>
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative group rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-gray-200/60 transition-all duration-300"
            >
              {/* Abstract 3D shape behind icon */}
              <div className={`${feat.color}/20 absolute top-6 left-8 w-16 h-16 rounded-full blur-xl transition-transform group-hover:scale-150`} />
              
              <div className="relative mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-gray-100">
                 {feat.icon}
              </div>
              <h3 className="mb-3 text-lg font-bold text-gray-900">{feat.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
