import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Check, Download } from "lucide-react";
import { useRazorpay } from "react-razorpay";

import { listDocuments } from "#/api/documents";
import { createSubscription, verifyPayment } from "#/api/billing";
import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, Panel } from "#/components/os/ui";
import { PageHero, MeterBar } from "#/components/system/shared";
import { AGENTS } from "#/types";
import { cn } from "#/lib/utils";

const PLANS = [
  { name: "Founder", price: "₹4,900", per: "/mo", features: ["2 executives", "100 documents", "Weekly analysis", "Email support"], current: false },
  { name: "Boardroom", price: "₹14,900", per: "/mo", features: ["All 5 executives + Nexus", "Unlimited documents", "War Room & Simulator", "Live executive feed", "Priority support"], current: true },
  { name: "Enterprise", price: "Custom", per: "", features: ["Dedicated model capacity", "SSO & audit exports", "Custom executives", "White-glove onboarding"], current: false },
];

const INVOICES = [
  { date: "Jul 1, 2026", amount: "₹14,900", status: "paid" },
  { date: "Jun 1, 2026", amount: "₹14,900", status: "paid" },
  { date: "May 1, 2026", amount: "₹14,900", status: "paid" },
  { date: "Apr 1, 2026", amount: "₹14,900", status: "paid" },
  { date: "Mar 1, 2026", amount: "₹9,900", status: "paid" },
  { date: "Feb 1, 2026", amount: "₹9,900", status: "paid" },
  { date: "Jan 1, 2026", amount: "₹9,900", status: "paid" },
  { date: "Dec 1, 2025", amount: "₹4,900", status: "paid" },
];

export function BillingPage() {
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });
  const docCount = documents?.length ?? 0;
  
  const { Razorpay } = useRazorpay();

  const { mutate: subscribe, isPending } = useMutation({
    mutationFn: async (planName: string) => {
      if (planName === "Enterprise") return; // Open modal or mailto
      
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
    { label: "AI analyses", used: 34, limit: 100, color: "#8A7BEF" },
    { label: "Documents indexed", used: docCount, limit: 500, color: "#0891CF" },
    { label: "Seats", used: 7, limit: 15, color: "#059669" },
    { label: "Memory storage", used: 61, limit: 100, color: "#D97706", unit: "GB" },
  ];

  return (
    <AppShell title="Billing" wide>
      <PageHero
        label="plan & usage"
        title="Fuel for the"
        accent="boardroom."
        body="Your plan, what you've used, and where the money went."
      />

      <div className="grid gap-5 xl:grid-cols-3">
        {/* current plan */}
        <Panel deep delay={0.05} className="conic-ring relative overflow-hidden p-7 xl:col-span-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">current plan</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl font-extrabold tracking-tight text-white">Boardroom</h3>
            <GlowChip color="#059669">active</GlowChip>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            ₹14,900<span className="text-slate-500">/mo · renews Aug 1, 2026</span>
          </p>
          <div className="mt-4 flex items-center gap-1.5">
            {AGENTS.map((a) => (
              <span key={a.key} className="flex h-7 w-7 items-center justify-center rounded-lg text-[9px] font-extrabold" style={{ backgroundColor: `${a.color}22`, color: a.color }}>
                {a.persona[0]}
              </span>
            ))}
            <span className="ml-2 font-mono text-[9px] uppercase tracking-widest text-slate-500">full crew online</span>
          </div>
          <div className="mt-6 flex gap-2">
            <button className="flex-1 rounded-2xl bg-white py-2.5 text-sm font-bold text-black shadow-[0_0_36px_-10px_rgba(138,123,239,0.9)] transition-transform hover:-translate-y-0.5">
              Manage plan
            </button>
            <button className="flex-1 rounded-2xl border border-white/12 bg-white/[0.05] py-2.5 text-sm font-bold text-white transition-colors hover:border-crew-500/40">
              Payment method
            </button>
          </div>
        </Panel>

        {/* usage */}
        <Panel delay={0.1} className="p-6 xl:col-span-2">
          <BlockTitle label="this cycle" title="Usage" />
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {usage.map((u, i) => {
              const pct = Math.round((u.used / u.limit) * 100);
              const warn = pct >= 85;
              return (
                <div key={u.label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-slate-300">{u.label}</span>
                    <span className={cn("font-mono text-[11px] font-bold", warn ? "text-[#f5a9cf]" : "text-slate-400")}>
                      {u.used}{u.unit ?? ""} / {u.limit}{u.unit ?? ""}
                    </span>
                  </div>
                  <MeterBar pct={pct} color={u.color} over={warn} delay={0.1 + i * 0.07} />
                  {warn && <p className="mt-1 text-[10px] font-semibold text-[#f5a9cf]">Approaching limit — Ledger suggests reviewing before renewal.</p>}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {/* plans */}
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <Panel key={p.name} delay={0.15 + i * 0.06} hover className={cn("relative p-6", p.current && "conic-ring")}>
            {p.current && (
              <span className="absolute right-4 top-4">
                <GlowChip color="#8A7BEF">current</GlowChip>
              </span>
            )}
            <p className="text-sm font-bold text-white">{p.name}</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-white">
              {p.price}
              <span className="text-sm font-semibold text-slate-500">{p.per}</span>
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[12.5px] text-slate-300">
                  <Check className="h-3.5 w-3.5 shrink-0 text-crew-300" /> {f}
                </li>
              ))}
            </ul>
            {!p.current && (
              <button 
                onClick={() => handleSubscribe(p.name)}
                disabled={isPending}
                className="mt-5 w-full rounded-2xl border border-white/12 bg-white/[0.05] py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:border-crew-500/40 disabled:opacity-50"
              >
                {p.name === "Enterprise" ? "Talk to us" : (isPending ? "Processing..." : "Switch plan")}
              </button>
            )}
          </Panel>
        ))}
      </div>

      {/* invoices */}
      <div className="mt-5">
        <Panel delay={0.3} className="p-6">
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
