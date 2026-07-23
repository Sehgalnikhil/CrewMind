import { useMutation, useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Check, Download, Shield, ShieldCheck, Zap, Users, Brain, Cpu, Database, 
  X, Mic, Code, Cloud, MessageSquare, Briefcase, Calculator, Building2 
} from "lucide-react";
import { useRazorpay } from "react-razorpay";
import { useState } from "react";

import { listDocuments } from "#/api/documents";
import { createSubscription, verifyPayment } from "#/api/billing";
import { Can } from "#/components/auth/Can";
import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, Panel } from "#/components/os/ui";
import { PageHero, MeterBar } from "#/components/system/shared";
import { AGENTS } from "#/types";
import { cn } from "#/lib/utils";

const PLANS = [
  {
    name: "Starter",
    priceMonthly: "Free",
    priceAnnual: "Free",
    description: "For students and evaluation.",
    features: ["AI Chat", "20 documents", "1 workspace", "Basic Executive Memory", "Limited AI requests", "Community support"],
    buttonText: "Start Free",
    popular: false,
    color: "#8A7BEF",
  },
  {
    name: "Founder",
    priceMonthly: "₹1,499",
    priceAnnual: "₹1,199",
    description: "For solo founders and startups.",
    features: ["All 5 AI Executives", "250 documents", "Executive Memory", "Reports", "Knowledge Graph", "Up to 5 users"],
    buttonText: "Upgrade to Founder",
    popular: false,
    color: "#0891CF",
  },
  {
    name: "Growth",
    priceMonthly: "₹4,999",
    priceAnnual: "₹3,999",
    description: "For scaling teams and organizations.",
    features: ["Everything in Founder", "War Room", "Scenario Simulator", "Digital Twin", "Unlimited documents", "Advanced analytics", "Team collaboration", "Priority support"],
    buttonText: "Upgrade to Growth",
    popular: true,
    color: "#059669",
  },
  {
    name: "Enterprise",
    priceMonthly: "Custom",
    priceAnnual: "Custom",
    description: "For large enterprises.",
    features: ["Everything in Growth", "SSO", "Audit Logs", "API Access", "Custom integrations", "Dedicated onboarding", "White-label deployment", "SLA support"],
    buttonText: "Talk to Sales",
    popular: false,
    color: "#D97706",
  },
];

const ADD_ONS = [
  {
    name: "AI Executive Marketplace",
    icon: Building2,
    price: "Coming Soon",
    description: "Install specialized AI Executives & domain-specific AI capabilities.",
    status: "Coming Soon",
    color: "#8A7BEF",
  },
  {
    name: "Custom AI Models",
    icon: Cpu,
    price: "₹999/mo",
    description: "Bring your own model, custom prompts, and organization-specific AI behavior.",
    status: "Available",
    color: "#0891CF",
  },
  {
    name: "Voice Executive",
    icon: Mic,
    price: "₹499/mo",
    description: "Voice conversations, executive meeting mode, and speech-to-speech interaction.",
    status: "Available",
    color: "#059669",
  },
  {
    name: "GitHub Integration",
    icon: Code,
    price: "₹299/mo",
    description: "Repository analysis, code intelligence, and development insights.",
    status: "Available",
    color: "#D97706",
  },
  {
    name: "Google Workspace Integration",
    icon: Cloud,
    price: "₹299/mo",
    description: "Google Docs, Drive, Gmail, and Calendar synchronization.",
    status: "Available",
    color: "#f43f5e",
  },
  {
    name: "Slack Integration",
    icon: MessageSquare,
    price: "₹299/mo",
    description: "Team notifications, AI summaries, and channel intelligence.",
    status: "Available",
    color: "#8b5cf6",
  },
  {
    name: "CRM Integration",
    icon: Briefcase,
    price: "₹499/mo",
    description: "Supports future integrations such as Salesforce, HubSpot, and Zoho.",
    status: "Coming Soon",
    color: "#ec4899",
  }
];

const INVOICES = [
  { date: "Jul 1, 2026", amount: "₹4,999", status: "paid" },
  { date: "Jun 1, 2026", amount: "₹4,999", status: "paid" },
  { date: "May 1, 2026", amount: "₹4,999", status: "paid" },
];

export function BillingPage() {
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const docCount = documents?.length ?? 0;
  
  const { Razorpay } = useRazorpay();
  const [isAnnual, setIsAnnual] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // ROI Calculator State
  const [teamSize, setTeamSize] = useState(10);
  const [avgSalary, setAvgSalary] = useState(80000); // 80k INR/month
  const [repetitiveHours, setRepetitiveHours] = useState(15); // hours/week

  // ROI Logic
  const monthlyRepetitiveHours = teamSize * repetitiveHours * 4.33;
  const hoursSaved = Math.round(monthlyRepetitiveHours * 0.30); // Assume 30% automation
  const productivityValue = Math.round((hoursSaved / 173) * avgSalary);

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: async (planName: string) => {
      if (planName === "Enterprise") {
        window.location.href = "mailto:sales@crewmind.com";
        return;
      }
      if (planName === "Starter") return;
      
      const { subscription_id, key_id } = await createSubscription({ plan_name: planName });
      
      const options = {
        key: key_id,
        subscription_id: subscription_id,
        name: "CrewMind",
        description: `${planName} Plan`,
        handler: async (response: any) => {
          await verifyPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_subscription_id: response.razorpay_subscription_id,
            razorpay_signature: response.razorpay_signature,
          });
          alert("Subscription successful!");
        },
        theme: {
          color: "#8A7BEF",
        },
      };

      const rzp = new Razorpay(options as any);
      rzp.open();
    },
  });

  const handleSubscribe = (planName: string) => {
    subscribe(planName);
  };

  const usage = [
    { label: "AI Requests Used", used: 34, limit: 100, color: "#8A7BEF", unit: "" },
    { label: "Documents Indexed", used: docCount, limit: 250, color: "#0891CF", unit: "" },
    { label: "Active AI Executives", used: 5, limit: 5, color: "#059669", unit: "" },
    { label: "Memory Storage", used: 61, limit: 100, color: "#D97706", unit: "GB" },
    { label: "Team Members", used: 3, limit: 5, color: "#f43f5e", unit: "" },
    { label: "Workspaces", used: 1, limit: 1, color: "#8b5cf6", unit: "" },
  ];

  return (
    <AppShell title="Billing" wide>
      <AnimatePresence>
        {showBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-8 relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-crew-600/30 to-crew-900/30 p-1 border border-crew-500/30 shadow-[0_0_40px_-10px_rgba(138,123,239,0.2)]"
          >
            <div className="flex items-center gap-4 px-5 py-3 w-full justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">Start building your AI organization today</h3>
                <p className="mt-0.5 text-xs font-medium text-crew-200/80">No credit card required. Deploy your first AI Executive in under a minute.</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowBanner(false)} className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black shadow-glow transition-transform hover:-translate-y-0.5">
                  Create Free Workspace
                </button>
                <button onClick={() => setShowBanner(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHero
        label="Pricing & Usage"
        title="Scale your"
        accent="organization."
        body="An AI Executive Operating System designed to run your business."
      />

      {/* Usage Dashboard */}
      <div className="mb-8 mt-4">
        <Panel delay={0.1} className="p-6">
          <BlockTitle label="this cycle" title="Usage Dashboard" />
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {usage.map((u, i) => {
              const pct = Math.round((u.used / u.limit) * 100);
              const warn = pct >= 85;
              return (
                <div key={u.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-slate-300">{u.label}</span>
                    <span className={cn("font-mono text-[11px] font-bold", warn ? "text-[#f5a9cf]" : "text-slate-400")}>
                      {u.used}{u.unit} / {u.limit}{u.unit}
                    </span>
                  </div>
                  <MeterBar pct={pct} color={u.color} over={warn} delay={0.1 + i * 0.04} />
                  {warn && <p className="mt-1.5 text-[10px] font-semibold text-[#f5a9cf]">Approaching limit. Consider upgrading your plan.</p>}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* Toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur-xl">
          <button
            onClick={() => setIsAnnual(false)}
            className={cn("rounded-full px-5 py-2 text-sm font-bold transition-all", !isAnnual ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white")}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={cn("rounded-full px-5 py-2 text-sm font-bold transition-all flex items-center gap-2", isAnnual ? "bg-white text-black shadow-lg" : "text-slate-400 hover:text-white")}
          >
            Annual <GlowChip color="#059669">Save 20%</GlowChip>
          </button>
        </div>
      </div>

      {/* Plans */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((p, i) => (
          <Panel key={p.name} delay={0.15 + i * 0.06} hover className={cn("relative p-6 flex flex-col", p.popular && "conic-ring")}>
            {p.popular && (
              <span className="absolute right-4 top-4">
                <GlowChip color="#059669">Most Popular</GlowChip>
              </span>
            )}
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: p.color }}>{p.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <p className="text-3xl font-extrabold tracking-tight text-white">
                  {isAnnual ? p.priceAnnual : p.priceMonthly}
                </p>
                {p.priceMonthly !== "Free" && p.priceMonthly !== "Custom" && (
                  <span className="text-sm font-semibold text-slate-500">/mo</span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">{isAnnual && p.priceAnnual !== "Free" && p.priceAnnual !== "Custom" ? "billed annually" : p.description}</p>
              
              <ul className="mt-6 flex flex-col gap-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[13px] font-medium text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.color }} /> 
                    <span className="leading-tight">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8">
              <Can permission="billing.manage">
                <button
                  onClick={() => handleSubscribe(p.name)}
                  disabled={isPending}
                  className={cn(
                    "w-full rounded-2xl py-3 text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50",
                    p.popular 
                      ? "bg-white text-black shadow-[0_0_36px_-10px_rgba(5,150,105,0.6)] hover:shadow-[0_0_46px_-8px_rgba(5,150,105,0.8)]" 
                      : "border border-white/12 bg-white/[0.05] text-white hover:border-white/30 hover:bg-white/10"
                  )}
                >
                  {isPending ? "Processing..." : p.buttonText}
                </button>
              </Can>
            </div>
          </Panel>
        ))}
      </div>

      {/* AI Executives Grid */}
      <div className="mt-12">
        <Panel delay={0.2} className="p-6">
          <BlockTitle label="the crew" title="Included AI Executives" />
          <p className="mt-[-10px] mb-6 text-sm text-slate-400">CrewMind isn't a chatbot. It's an entire organization working in parallel for you.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {AGENTS.map((a, i) => (
              <motion.div
                key={a.key}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center transition-colors hover:bg-white/[0.04]"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold shadow-lg"
                  style={{ backgroundColor: `${a.color}20`, color: a.color, boxShadow: `0 0 24px -8px ${a.color}` }}
                >
                  {a.persona[0]}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-white">{a.persona}</p>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">{a.name}</p>
                </div>
                <div className="mt-2 w-full rounded-lg bg-white/[0.03] py-1.5 text-[10px] font-medium text-slate-400">
                  Included in Founder+
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Feature-Based Upsells (Marketplace) */}
      <div className="mt-12">
        <Panel delay={0.22} className="p-6 border border-crew-500/20 bg-gradient-to-b from-crew-900/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <BlockTitle label="addons" title="Extend Your AI Workforce" />
          </div>
          <p className="mt-[-10px] mb-6 text-sm text-slate-400">Optional paid add-ons that can be purchased independently to supercharge your organization.</p>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {ADD_ONS.map((addon, i) => (
              <motion.div
                key={addon.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${addon.color}20`, color: addon.color }}
                    >
                      <addon.icon className="h-5 w-5" />
                    </div>
                    {addon.status === "Coming Soon" && (
                      <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <h4 className="mt-4 text-[15px] font-bold text-white">{addon.name}</h4>
                  <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{addon.description}</p>
                </div>
                
                <div className="mt-6">
                  <div className="mb-3 text-[13px] font-extrabold" style={{ color: addon.color }}>
                    {addon.price !== "Coming Soon" ? `Starting at ${addon.price}` : ""}
                  </div>
                  <button 
                    disabled={addon.status === "Coming Soon"}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2 text-[13px] font-bold text-white transition-colors hover:bg-white/[0.08] disabled:opacity-40 disabled:hover:bg-white/[0.03]"
                  >
                    {addon.status === "Coming Soon" ? "Coming Soon" : "Add to Plan"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>

      {/* ROI Calculator */}
      <div className="mt-12">
        <Panel delay={0.24} className="p-8 border border-white/5 bg-gradient-to-br from-[#0B0D14] to-[#121626]">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-1">
                <Calculator className="h-5 w-5 text-emerald-500" />
                <h3 className="text-xl font-extrabold text-white">Estimate Your Productivity Impact</h3>
              </div>
              <p className="text-sm text-slate-400 mb-8">See how CrewMind's automated workflows translate to organizational momentum.</p>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-300">Team Size</label>
                    <span className="font-mono text-xs text-emerald-400">{teamSize} members</span>
                  </div>
                  <input 
                    type="range" min="1" max="100" value={teamSize} 
                    onChange={(e) => setTeamSize(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-300">Avg. Monthly Salary (₹)</label>
                    <span className="font-mono text-xs text-emerald-400">₹{avgSalary.toLocaleString()}</span>
                  </div>
                  <input 
                    type="range" min="10000" max="500000" step="5000" value={avgSalary} 
                    onChange={(e) => setAvgSalary(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-semibold text-slate-300">Repetitive Knowledge Work</label>
                    <span className="font-mono text-xs text-emerald-400">{repetitiveHours} hrs/week</span>
                  </div>
                  <input 
                    type="range" min="0" max="40" value={repetitiveHours} 
                    onChange={(e) => setRepetitiveHours(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="w-full lg:w-96 shrink-0 rounded-2xl bg-white/[0.03] p-6 border border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-5">Estimated Monthly Value</h4>
              
              <div className="space-y-5">
                <div>
                  <p className="text-3xl font-extrabold text-emerald-400">{hoursSaved.toLocaleString()}</p>
                  <p className="text-xs font-medium text-slate-400">Potential hours saved / month</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-white">₹{productivityValue.toLocaleString()}</p>
                  <p className="text-xs font-medium text-slate-400">Estimated productivity gain value</p>
                </div>
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-slate-500 leading-relaxed italic">
                    * This is an illustrative planning tool assuming ~30% automation of repetitive tasks. It does not guarantee specific financial returns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* Business Value */}
      <div className="mt-12">
        <Panel delay={0.25} className="p-6 flex flex-col">
          <BlockTitle label="value" title="Why Businesses Choose CrewMind" />
          <p className="text-sm text-slate-400 mb-6">Compare the cost of scaling human operations with deploying a dedicated AI executive.</p>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <h4 className="text-[13px] font-bold text-white mb-3">Research Work</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-white/5 pr-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Traditional Hiring</p>
                  <p className="text-[13px] text-slate-300">Typical salary range:</p>
                  <p className="text-sm font-bold text-white mt-0.5">₹6–12 LPA</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A7BEF] mb-1">CrewMind Scout</p>
                  <p className="text-[12px] text-slate-300 leading-snug">Available instantly to assist with research and document analysis.</p>
                  <p className="text-[10px] font-bold text-[#8A7BEF] mt-2 bg-[#8A7BEF]10 py-0.5 px-2 rounded-md inline-block">Included in Growth Plan</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 rounded-xl border border-white/5 bg-white/[0.02] p-4">
              <h4 className="text-[13px] font-bold text-white mb-3">Strategy Work</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="border-r border-white/5 pr-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Traditional Hiring</p>
                  <p className="text-[13px] text-slate-300">Typical salary range:</p>
                  <p className="text-sm font-bold text-white mt-0.5">₹8–15 LPA</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#059669] mb-1">CrewMind Atlas</p>
                  <p className="text-[12px] text-slate-300 leading-snug">Helps analyze business data, generate insights, and support planning.</p>
                  <p className="text-[10px] font-bold text-[#059669] mt-2 bg-[#059669]10 py-0.5 px-2 rounded-md inline-block">Included in Growth Plan</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="mt-5 text-[11px] text-slate-500 leading-relaxed border-l-2 border-white/10 pl-3">
            <strong>Important:</strong> CrewMind is designed to automate portions of repetitive knowledge work and support decision-making. It is not presented as a replacement for employees or professional expertise.
          </p>
        </Panel>
      </div>

      {/* Competitive Comparison & Billing Transparency */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Competitive Comparison */}
        <Panel delay={0.26} className="p-6">
          <BlockTitle label="advantage" title="Why Teams Choose CrewMind" />
          <p className="text-sm text-slate-400 mb-6">Built from the ground up as a multi-agent system, not a simple chat wrapper.</p>
          <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="py-3 px-4 font-bold text-white">CrewMind</th>
                  <th className="py-3 px-4 font-bold text-slate-400">Traditional AI Assistants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  ["Multiple specialized AI Executives", "General-purpose assistant"],
                  ["Organizational Memory", "Limited conversation context"],
                  ["Knowledge Graph", "Not typically available"],
                  ["Digital Twin", "Not typically available"],
                  ["War Room Collaboration", "Single-user chat"],
                  ["Enterprise RBAC", "Basic account permissions"],
                  ["Workspace Isolation", "Account-based organization"]
                ].map(([crew, trad], i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-medium text-crew-200 flex items-center gap-2">
                      <Check className="h-4 w-4 text-crew-400" /> {crew}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{trad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Transparency */}
        <Panel delay={0.3} className="p-6">
          <BlockTitle label="value" title="Billing Transparency" />
          <p className="text-sm text-slate-400 mb-6">When you upgrade to a paid plan, you are investing in an entire AI organization, not just token limits. Your subscription includes:</p>
          <ul className="space-y-5">
            {[
              { icon: Users, title: "Access to all enabled AI Executives", desc: "Your dedicated team of AI specialists working in parallel.", color: "#8A7BEF" },
              { icon: Brain, title: "Organizational Memory", desc: "Persistent memory that spans across documents and conversations.", color: "#0891CF" },
              { icon: ShieldCheck, title: "Secure Workspace", desc: "Private, isolated environments for your teams and data.", color: "#059669" },
              { icon: Shield, title: "Enterprise Security", desc: "Role-based access control and compliance-ready infrastructure.", color: "#D97706" },
              { icon: Zap, title: "Continuous Platform Updates", desc: "Automatic upgrades to models and new executive capabilities.", color: "#f43f5e" }
            ].map((item, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      
      {/* Premium Closing CTA */}
      <div className="mt-16 mb-16 text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-10 shadow-2xl"
        >
          <h2 className="text-3xl font-extrabold text-white mb-4">Build Your AI Leadership Team</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
            Deploy specialized AI executives, organize your company's knowledge, and help your team work more efficiently from a single platform.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button className="w-full sm:w-auto rounded-full bg-white px-8 py-3.5 text-sm font-bold text-black shadow-glow transition-transform hover:-translate-y-1">
              Start Free
            </button>
            <button className="w-full sm:w-auto rounded-full border border-white/20 bg-white/[0.03] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
              Book Enterprise Demo
            </button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[12px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-crew-400" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-crew-400" /> Upgrade anytime</span>
            <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-crew-400" /> Secure workspace</span>
            <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-crew-400" /> Enterprise-ready architecture</span>
          </div>
        </motion.div>
      </div>

      {/* Trust & Enterprise Badges */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 opacity-60">
        {[
          { icon: Shield, label: "Enterprise Security" },
          { icon: Users, label: "RBAC" },
          { icon: Database, label: "Audit Logs" },
          { icon: ShieldCheck, label: "Workspace Isolation" },
          { icon: Cpu, label: "Secure Authentication" }
        ].map((badge, i) => (
          <div key={i} className="flex items-center gap-2 text-slate-400">
            <badge.icon className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">{badge.label}</span>
          </div>
        ))}
      </div>
      
      {/* Invoices */}
      <div className="mt-12">
        <Panel delay={0.4} className="p-6">
          <BlockTitle label="history" title="Invoices" />
          <div className="flex flex-col">
            {INVOICES.map((inv, i) => (
              <motion.div
                key={inv.date}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 border-b border-white/[0.05] py-3 last:border-0"
              >
                <span className="w-28 text-[12.5px] font-semibold text-slate-300">{inv.date}</span>
                <span className="flex-1 font-mono text-[12px] font-bold text-white">{inv.amount}</span>
                <GlowChip color="#059669">{inv.status}</GlowChip>
                <button aria-label={`Download invoice ${inv.date}`} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white">
                  <Download className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>

    </AppShell>
  );
}
