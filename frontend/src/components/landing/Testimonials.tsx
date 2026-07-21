import { motion } from "framer-motion";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "CrewMind gives me the clarity I need to make decisions faster. It's like having a full executive team by my side.",
    author: "Sarah J.",
    title: "CEO, Acme Inc.",
    avatar: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    quote: "The financial insights alone have helped us improve margins by 18% in just one quarter.",
    author: "Michael T.",
    title: "CFO, StartHub",
    avatar: "https://i.pravatar.cc/150?u=michael"
  },
  {
    quote: "Operations bottlenecks, legal risks, market trends – everything in one place. Incredible.",
    author: "Priya K.",
    title: "COO, Peakline",
    avatar: "https://i.pravatar.cc/150?u=priya"
  }
];

export function Testimonials() {
  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Loved by business leaders
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/40"
            >
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(star => <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="mb-8 text-gray-600 leading-relaxed font-medium">"{t.quote}"</p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.author} className="h-12 w-12 rounded-full bg-gray-100 object-cover ring-2 ring-gray-50" />
                <div>
                  <h4 className="font-bold text-gray-900">{t.author}</h4>
                  <p className="text-sm text-gray-500">{t.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-10">
           <div className="h-2 w-6 rounded-full bg-[#6C5CE7]" />
           <div className="h-2 w-2 rounded-full bg-gray-300" />
           <div className="h-2 w-2 rounded-full bg-gray-300" />
        </div>
      </div>
    </section>
  );
}
