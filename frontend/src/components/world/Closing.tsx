import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Check, ChevronDown, Sparkles } from "lucide-react";
import { AGENTS } from "./data";
import { Aurora, MagneticButton, Reveal, SectionHeading, TiltCard } from "./primitives";

/* ================================================================ */
/* Pricing                                                           */
/* ================================================================ */
const PLANS = [
  {
    name: "Solo",
    price: 49,
    blurb: "For founders flying without a boardroom.",
    features: ["2 agents (Finance + Strategy)", "50 documents / month", "Weekly executive brief", "Email support"],
    featured: false,
  },
  {
    name: "Boardroom",
    price: 199,
    blurb: "The full five-agent executive suite.",
    features: [
      "All 5 executive agents",
      "Unlimited documents",
      "Daily briefs + real-time alerts",
      "Agent debate transcripts",
      "All integrations",
      "Priority support",
    ],
    featured: true,
  },
  {
    name: "Enterprise",
    price: null,
    blurb: "Your crew, governed your way.",
    features: ["Custom agents & mandates", "SSO, SCIM & audit exports", "Region pinning (US/EU)", "Dedicated success architect"],
    featured: false,
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(true);
  return (
    <section id="pricing" className="relative px-6 py-32">
      <Aurora variant="violet" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Pricing"
          title={
            <>
              Five executives for less than <span className="text-aurora">one lunch meeting.</span>
            </>
          }
        />

        <Reveal className="mb-10 flex items-center justify-center gap-3">
          <span className={`text-sm font-semibold ${!yearly ? "text-white" : "text-slate-500"}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            aria-label="Toggle yearly billing"
            className="relative h-7 w-13 rounded-full border border-white/10 bg-white/[0.06] px-1"
            style={{ width: 52 }}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="block h-5 w-5 rounded-full bg-gradient-to-br from-crew-400 to-[#0891CF] shadow-glow"
              style={{ marginLeft: yearly ? "auto" : 0 }}
            />
          </button>
          <span className={`text-sm font-semibold ${yearly ? "text-white" : "text-slate-500"}`}>
            Yearly <span className="ml-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">−20%</span>
          </span>
        </Reveal>

        <div className="grid items-stretch gap-6 lg:grid-cols-3">
          {PLANS.map((p, i) => {
            const price = p.price === null ? null : yearly ? Math.round(p.price * 0.8) : p.price;
            return (
              <Reveal key={p.name} delay={i * 0.1} className={p.featured ? "lg:-mt-6" : ""}>
                <TiltCard maxTilt={4} className="h-full">
                  <div
                    className={`relative flex h-full flex-col rounded-3xl p-8 ${
                      p.featured ? "glass-deep conic-ring" : "glass"
                    }`}
                  >
                    {p.featured && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-crew-500 to-[#0891CF] px-4 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-glow">
                        Most hired
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-white">{p.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{p.blurb}</p>
                    <div className="mt-6 flex items-baseline gap-1.5">
                      {price === null ? (
                        <span className="text-4xl font-extrabold text-white">Let's talk</span>
                      ) : (
                        <>
                          <span className="text-5xl font-extrabold tracking-tight text-white">${price}</span>
                          <span className="text-sm text-slate-500">/ month</span>
                        </>
                      )}
                    </div>
                    <ul className="mt-7 flex-1 space-y-3">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-[13px] text-slate-300">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-crew-300" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={p.price === null ? "mailto:sales@crewmind.ai" : "/register"}
                      className={`mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                        p.featured
                          ? "bg-white text-black shadow-[0_0_40px_-8px_rgba(138,123,239,0.7)]"
                          : "border border-white/15 bg-white/[0.04] text-white hover:border-white/30"
                      }`}
                    >
                      {p.price === null ? "Contact sales" : "Start free trial"} <ArrowRight className="h-4 w-4" />
                    </a>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={0.2}>
          <p className="mt-8 text-center text-xs text-slate-500">
            14-day free trial on every plan · No credit card required · Cancel anytime
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================================ */
/* FAQ                                                               */
/* ================================================================ */
const FAQS = [
  {
    q: "Is this just ChatGPT with a business skin?",
    a: "No. Each agent is a persistent specialist with long-term memory of your business, a defined mandate, and access to your live data. They collaborate and challenge each other before anything reaches you — a workflow, not a chat window.",
  },
  {
    q: "How does CrewMind connect to my data?",
    a: "Native two-way integrations with your accounting, CRM, docs and comms stack, plus drag-and-drop uploads. Ingestion is read-only by default; write access is opt-in, per integration.",
  },
  {
    q: "Can I trust the numbers?",
    a: "Every figure in a report links back to its source — a ledger line, a contract clause, a CRM record. If the crew can't verify a claim, it's flagged as unverified rather than presented as fact.",
  },
  {
    q: "Is my data used to train models?",
    a: "Never. Your data is encrypted, region-pinned if you choose, and excluded from any shared model training. Delete your workspace and it's gone within 30 days, backups included.",
  },
  {
    q: "What if the agents disagree with each other?",
    a: "That's a feature. Disagreements are surfaced in the report with each agent's position and reasoning, so you decide with full sight of the tradeoffs — like a real boardroom, minus the politics.",
  },
  {
    q: "How long does setup take?",
    a: "About 15 minutes. Connect your tools, drop in key documents, and the crew begins its first full read of your business. Your first executive brief lands within 24 hours.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={index * 0.05}>
      <div className={`glass overflow-hidden rounded-2xl transition-all duration-300 ${open ? "border-crew-500/30" : ""}`}>
        <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left" aria-expanded={open}>
          <span className="text-sm font-bold text-white md:text-[15px]">{q}</span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className={`h-4 w-4 ${open ? "text-crew-300" : "text-slate-500"}`} />
          </motion.span>
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="px-6 pb-5 text-sm leading-relaxed text-slate-400">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reveal>
  );
}

export function FaqSection() {
  return (
    <section className="relative px-6 py-32">
      <div className="relative z-10 mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title={<>Fair questions.</>} />
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <FaqItem key={f.q} q={f.q} a={f.a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Final CTA                                                         */
/* ================================================================ */
export function FinalCta() {
  return (
    <section className="relative overflow-hidden px-6 py-40">
      <Aurora variant="violet" />
      <div aria-hidden className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-crew-600/20 blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <Reveal>
          <div className="mx-auto mb-8 flex w-fit -space-x-2">
            {AGENTS.map((a) => (
              <span
                key={a.id}
                className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#05060C] text-sm font-extrabold"
                style={{ backgroundColor: `${a.color}30`, color: a.color, boxShadow: `0 0 20px -4px ${a.glow}` }}
                title={a.role}
              >
                {a.name[0]}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl">
            Your boardroom is <span className="text-aurora">waiting.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400">
            Five executives. Fifteen minutes to hire. The first brief lands tomorrow morning.
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <MagneticButton href="/register" className="px-9 py-4 text-base">
              <Sparkles className="h-4 w-4" /> Assemble your crew
            </MagneticButton>
            <MagneticButton href="/login" variant="ghost">
              I already have one <ArrowRight className="h-4 w-4" />
            </MagneticButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Footer                                                            */
/* ================================================================ */
const FOOTER_COLS = [
  { title: "Product", links: ["The Agents", "Dashboard", "Integrations", "Pricing", "Changelog"] },
  { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { title: "Resources", links: ["Docs", "API", "Guides", "Status"] },
  { title: "Legal", links: ["Privacy", "Terms", "Security", "DPA"] },
];

export function WorldFooter() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-[#04050a]/80 px-6 pb-10 pt-16 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="conic-ring flex h-9 w-9 items-center justify-center rounded-xl">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#0B0D14]">
                  <span className="bg-gradient-to-br from-crew-300 to-[#67c7f5] bg-clip-text text-sm font-extrabold text-transparent">C</span>
                </div>
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white">CrewMind</span>
            </div>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-slate-500">
              The AI executive team for companies that can't hire one yet — and for the ones that can, but want a
              sharper one.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {AGENTS.map((a) => (
                <span key={a.id} className="h-1.5 w-6 rounded-full" style={{ backgroundColor: a.color, opacity: 0.7 }} title={a.role} />
              ))}
            </div>
          </div>
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[13px] text-slate-500 transition-colors hover:text-white">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/[0.05] pt-6 md:flex-row">
          <p className="text-xs text-slate-600">© 2026 CrewMind, Inc. All five agents approved this message.</p>
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-slate-600">
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500 status-ping text-emerald-500" />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
