import { motion } from "framer-motion";
import { ArrowRight, Github, Linkedin, Twitter, Layout } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <>
      {/* Final CTA Section */}
      <section className="relative overflow-hidden py-32 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#6C5CE7]/10 via-white to-white" />
        
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#6C5CE7] to-purple-600 px-8 py-20 text-center shadow-2xl shadow-[#6C5CE7]/30 relative"
          >
             {/* Abstract Rocket / Illustration Placeholder */}
             <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
             <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-purple-400/20 blur-3xl" />
             
             <h2 className="mx-auto max-w-2xl text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6 relative z-10">
                Ready to transform your business with AI?
             </h2>
             <p className="mx-auto max-w-xl text-lg text-purple-100 mb-10 relative z-10">
                Join hundreds of companies using CrewMind to make smarter, data-driven decisions.
             </p>
             <Link
                to="/register"
                className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-white px-8 text-base font-bold text-[#6C5CE7] shadow-xl transition-all hover:bg-gray-50 hover:shadow-2xl hover:-translate-y-1 relative z-10"
              >
                Start free now
                <ArrowRight className="h-5 w-5" />
              </Link>
          </motion.div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="border-t border-gray-100 bg-white pt-20 pb-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5 xl:gap-8 mb-16">
             
             <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7] text-white">
                    <Layout className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold tracking-tight text-gray-900">CrewMind</span>
                </div>
                <p className="text-sm text-gray-500 mb-8 max-w-xs">
                   Your AI Executive Team for Smarter Business Decisions.
                </p>
                <div className="flex gap-4">
                   <a href="#" className="text-gray-400 hover:text-[#6C5CE7] transition-colors"><Twitter className="h-5 w-5" /></a>
                   <a href="#" className="text-gray-400 hover:text-[#6C5CE7] transition-colors"><Linkedin className="h-5 w-5" /></a>
                   <a href="#" className="text-gray-400 hover:text-[#6C5CE7] transition-colors"><Github className="h-5 w-5" /></a>
                </div>
             </div>

             <div>
                <h4 className="font-bold text-gray-900 mb-6">Product</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Overview</a></li>
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Features</a></li>
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Agents</a></li>
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Integrations</a></li>
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Security</a></li>
                </ul>
             </div>

             <div>
                <h4 className="font-bold text-gray-900 mb-6">Company</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">About Us</a></li>
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Careers</a></li>
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Blog</a></li>
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Contact</a></li>
                </ul>
             </div>

             <div>
                <h4 className="font-bold text-gray-900 mb-6">Legal</h4>
                <ul className="space-y-4 text-sm text-gray-500">
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Privacy Policy</a></li>
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Terms of Service</a></li>
                   <li><a href="#" className="hover:text-[#6C5CE7] transition-colors">Cookies Policy</a></li>
                </ul>
             </div>
          </div>

          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
             <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} CrewMind. All rights reserved.
             </p>
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-gray-500">All systems operational</span>
             </div>
          </div>
        </div>
      </footer>
    </>
  );
}
