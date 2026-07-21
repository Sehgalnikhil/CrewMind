import { motion, useInView } from "framer-motion";
import { Zap, Target, Database, Clock } from "lucide-react";
import { useRef, useEffect, useState } from "react";

const METRICS = [
  { icon: <Zap className="h-6 w-6 text-purple-500" />, value: 10, suffix: "x", label: "Faster Analysis", desc: "Save hours on manual data analysis", color: "bg-purple-500" },
  { icon: <Target className="h-6 w-6 text-[#6C5CE7]" />, value: 98, suffix: "%", label: "Insight Accuracy", desc: "AI models trained for business context", color: "bg-[#6C5CE7]" },
  { icon: <Database className="h-6 w-6 text-blue-500" />, value: 500, suffix: "+", label: "Data Sources", desc: "Supports all major file types and platforms", color: "bg-blue-500" },
  { icon: <Clock className="h-6 w-6 text-green-500" />, value: 24, suffix: "/7", label: "AI Executive Team", desc: "Always-on insights whenever you need", color: "bg-green-500" },
];

function Counter({ value, suffix }: { value: number, suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.ceil(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
      {count}{suffix}
    </span>
  );
}

export function MetricsCounters() {
  return (
    <section className="py-24 bg-white relative">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-center gap-6"
            >
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${metric.color}/10 shadow-inner`}>
                 {metric.icon}
              </div>
              <div>
                <Counter value={metric.value} suffix={metric.suffix} />
                <p className="mt-1 font-bold text-gray-900">{metric.label}</p>
                <p className="text-sm text-gray-500">{metric.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
