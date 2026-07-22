import { motion } from "framer-motion";
import {
  Activity,
  BrainCircuit,
  Building2,
  Factory,
  FileSearch,
  Fingerprint,
  Globe2,
  HeartPulse,
  KeyRound,
  Lock,
  MessagesSquare,
  Quote,
  Rocket,
  ServerCog,
  ShieldCheck,
  ShoppingBag,
  Stethoscope,
  Store,
  Target,
  Users,
} from "lucide-react";
import { AGENTS } from "./data";
import { Aurora, CountUp, Reveal, SectionHeading, TiltCard } from "./primitives";

/* ================================================================ */
/* Trusted companies marquee                                         */
/* ================================================================ */
const COMPANIES = ["Northwind", "Vantage Labs", "Helios", "Foundry & Co", "Meridian", "Bluepeak", "Arcadia", "Quantex", "Solstice", "Ironclad Goods"];

export function TrustedMarquee() {
  return (
    <section className="relative border-y border-white/[0.05] bg-white/[0.015] py-10 backdrop-blur-sm">
      <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        Trusted by operators at
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_15%,black_85%,transparent)]">
        <div className="flex w-max animate-marquee gap-16 pr-16">
          {[...COMPANIES, ...COMPANIES].map((c, i) => (
            <span key={i} className="whitespace-nowrap text-lg font-bold tracking-tight text-slate-500 transition-colors hover:text-slate-200">
              {c}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Why CrewMind                                                      */
/* ================================================================ */
const WHY = [
  { icon: BrainCircuit, title: "Executives, not chatbots", body: "Each agent holds long-term memory of your business, owns a mandate, and is accountable for a domain — not a prompt window that forgets you." },
  { icon: MessagesSquare, title: "They debate before you decide", body: "Recommendations are stress-tested in an internal boardroom. You see the disagreement, the resolution, and the dissenting view." },
  { icon: FileSearch, title: "Every claim is cited", body: "Numbers trace to your ledger. Market claims trace to sources. Nothing reaches your report without a receipt." },
  { icon: Activity, title: "Always on, never idle", body: "The crew works while you sleep — monitoring metrics, contracts and competitors, and waking you only when it matters." },
];

export function WhySection() {
  return (
    <section className="relative px-6 py-32">
      <Aurora variant="emerald" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why CrewMind"
          title={
            <>
              Software gave you data. <span className="text-aurora">This gives you judgment.</span>
            </>
          }
          sub="Dashboards tell you what happened. An executive team tells you what to do about it."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {WHY.map((w, i) => (
            <Reveal key={w.title} delay={i * 0.08}>
              <TiltCard maxTilt={5} className="h-full">
                <div className="glass holo-sheen group h-full rounded-3xl p-7">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-crew-500/30 bg-crew-500/10 text-crew-300 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <w.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-white">{w.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{w.body}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================ */
/* AI Capabilities                                                   */
/* ================================================================ */
const CAPABILITIES = [
  { icon: Target, title: "Scenario planning", body: "Model three futures for any decision — priced, ranked and reversible." },
  { icon: FileSearch, title: "Document intelligence", body: "Contracts, decks, spreadsheets — parsed, indexed and cross-referenced." },
  { icon: Globe2, title: "Market surveillance", body: "Competitors, pricing moves and regulation, watched around the clock." },
  { icon: Activity, title: "Anomaly detection", body: "Metric drift caught in hours, not at the end of the quarter." },
  { icon: Users, title: "Boardroom debate", body: "Agents argue opposing positions so blind spots surface before you commit." },
  { icon: Rocket, title: "Playbook execution", body: "Approved decisions become tracked action plans with owners and deadlines." },
];

export function CapabilitiesSection() {
  return (
    <section id="features" className="relative px-6 py-32">
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Capabilities"
          title={
            <>
              What five tireless minds <span className="text-aurora">can actually do.</span>
            </>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c.title} delay={(i % 3) * 0.1}>
              <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 260, damping: 18 }} className="glass group h-full rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-crew-300 transition-colors group-hover:bg-crew-500/20">
                    <c.icon className="h-[18px] w-[18px]" />
                  </span>
                  <h3 className="text-sm font-bold text-white">{c.title}</h3>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-400">{c.body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Live Executive Report — a typed-out report artifact                */
/* ================================================================ */
const REPORT_LINES = [
  { agent: AGENTS[4], text: "Scanned 212 sources. Two competitors cut mid-tier pricing by ~15% this week." },
  { agent: AGENTS[1], text: "Modelled impact: matching the cut costs Rs 410K ARR; holding costs an estimated 2.1% churn." },
  { agent: AGENTS[0], text: "Recommend holding price and shipping the retention bundle. Expected net: +Rs 180K ARR." },
  { agent: AGENTS[2], text: "Bundle rollout drafted: 3 sprints, no new headcount. Owners assigned." },
  { agent: AGENTS[3], text: "No contractual barriers. Two enterprise MSAs need 30-day notice for packaging changes — filed." },
];

export function LiveReportSection() {
  return (
    <section className="relative overflow-hidden px-6 py-32">
      <Aurora variant="pink" />
      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            align="left"
            eyebrow="Live Executive Reports"
            title={
              <>
                Not a summary. <span className="text-aurora">A verdict.</span>
              </>
            }
            sub="Every morning, the crew hands you one report: what changed, what it means, what they recommend — and who disagreed. Signed by all five."
          />
          <div className="flex flex-wrap gap-6">
            {[
              { v: 6, suffix: " hrs", label: "saved per exec, per week" },
              { v: 92, suffix: "%", label: "recommendations accepted" },
              { v: 100, suffix: "%", label: "claims with citations" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-white">
                  <CountUp to={s.v} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <Reveal delay={0.15}>
          <TiltCard maxTilt={6}>
            <div className="glass-deep scanline conic-ring relative overflow-hidden rounded-3xl p-6">
              <div className="mb-4 flex items-center justify-between border-b border-white/[0.07] pb-4">
                <div>
                  <p className="text-sm font-bold text-white">Morning brief — pricing pressure</p>
                  <p className="font-mono text-[10px] text-slate-500">Compiled 06:00 · 5/5 agents signed</p>
                </div>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold text-emerald-400">
                  ACTION READY
                </span>
              </div>
              <div className="space-y-4">
                {REPORT_LINES.map((l, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.25, duration: 0.6 }}
                    className="flex gap-3"
                  >
                    <span
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold"
                      style={{ backgroundColor: `${l.agent.color}22`, color: l.agent.color, boxShadow: `0 0 14px -4px ${l.agent.glow}` }}
                    >
                      {l.agent.name[0]}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: l.agent.color }}>
                        {l.agent.name} · {l.agent.role}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-slate-300">{l.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TiltCard>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================================ */
/* KPI Analytics + Business Health                                   */
/* ================================================================ */
export function AnalyticsSection() {
  const bars = [64, 78, 58, 88, 71, 95, 82];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <section className="relative px-6 py-32">
      <Aurora variant="cyan" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="KPI Analytics"
          title={
            <>
              Metrics that <span className="text-aurora">explain themselves.</span>
            </>
          }
          sub="Every number carries the agent's read on it. Hover a metric, get the why."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Reveal className="md:col-span-2">
            <div className="glass h-full rounded-3xl p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Decisions processed — this week</p>
                  <p className="text-xs text-slate-500">Peak Saturday: quarterly close simulations</p>
                </div>
                <span className="text-2xl font-extrabold text-white">
                  <CountUp to={536} />
                </span>
              </div>
              <div className="flex h-40 items-end gap-3" role="img" aria-label="Bar chart of decisions per day, peaking Saturday at 95">
                {bars.map((v, i) => (
                  <div key={i} className="group flex h-full w-full flex-col items-center justify-end gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      whileInView={{ height: `${v}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                      className="w-full rounded-t-md bg-gradient-to-t from-crew-600/70 to-crew-400 transition-all group-hover:from-crew-500 group-hover:to-[#67c7f5] group-hover:shadow-glow"
                    />
                    <span className="text-[10px] font-medium text-slate-500">{days[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="grid gap-4">
            {[
              { label: "Signals monitored", v: 1842, suffix: "", note: "across finance, ops & market" },
              { label: "Risks intercepted", v: 47, suffix: "", note: "before they reached the P&L" },
              { label: "Median response", v: 3.2, suffix: " min", note: "from anomaly to briefing", decimals: 1 },
            ].map((k, i) => (
              <Reveal key={k.label} delay={i * 0.1}>
                <div className="glass holo-sheen rounded-2xl p-5">
                  <p className="text-[11px] font-medium text-slate-400">{k.label}</p>
                  <p className="mt-1 text-2xl font-extrabold text-white">
                    <CountUp to={k.v} suffix={k.suffix} decimals={k.decimals ?? 0} />
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">{k.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Business health constellation */}
        <Reveal className="mt-4">
          <div className="glass-deep grid-lines relative overflow-hidden rounded-3xl p-7">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex items-center gap-3">
                  <HeartPulse className="h-5 w-5 text-crew-300" />
                  <h3 className="text-lg font-bold text-white">Business Health, as a living system</h3>
                </div>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                  Forty-two signals — cash, pipeline, churn, hiring, legal exposure — fused into one score you can
                  interrogate. Tap any organ of the business and the responsible agent explains its state.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {AGENTS.map((a) => (
                    <span
                      key={a.id}
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold"
                      style={{ borderColor: `${a.color}44`, color: a.color, backgroundColor: `${a.color}10` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: a.color }} />
                      {a.role.replace(" Agent", "")} {["94", "97", "92", "96", "91"][AGENTS.indexOf(a)]}
                    </span>
                  ))}
                </div>
              </div>
              {/* pulse rings */}
              <div className="relative mx-auto h-44 w-44">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-full border border-crew-400/40"
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, delay: i, ease: "easeOut" }}
                  />
                ))}
                <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md">
                  <span className="text-4xl font-extrabold text-white">
                    <CountUp to={87} />
                  </span>
                  <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500">health</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Industry solutions                                                */
/* ================================================================ */
const INDUSTRIES = [
  { icon: Rocket, name: "SaaS & Startups", body: "Runway, burn and PLG funnels — with a CFO agent that has seen a thousand board decks." },
  { icon: ShoppingBag, name: "E-commerce", body: "Inventory, CAC and margin per SKU, reconciled nightly across every channel." },
  { icon: Building2, name: "Professional services", body: "Utilization, pipeline and contract exposure across every engagement." },
  { icon: Factory, name: "Manufacturing", body: "Supply risk, unit economics and supplier contracts under one roof." },
  { icon: Stethoscope, name: "Healthcare", body: "Compliance-first operations with an always-on regulatory watch." },
  { icon: Store, name: "Franchise & retail", body: "Location-level P&L, staffing signals and lease intelligence." },
];

export function IndustriesSection() {
  return (
    <section className="relative px-6 py-32">
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Industry Solutions"
          title={
            <>
              The same crew, <span className="text-aurora">fluent in your world.</span>
            </>
          }
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((ind, i) => (
            <Reveal key={ind.name} delay={(i % 3) * 0.08}>
              <motion.div
                whileHover={{ scale: 1.03, rotate: i % 2 ? 0.4 : -0.4 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="glass holo-sheen h-full rounded-2xl p-6"
              >
                <ind.icon className="h-6 w-6 text-crew-300" />
                <h3 className="mt-4 text-base font-bold text-white">{ind.name}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{ind.body}</p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Security                                                          */
/* ================================================================ */
const SECURITY = [
  { icon: ShieldCheck, title: "SOC 2 Type II", body: "Audited controls across availability, confidentiality and security." },
  { icon: Lock, title: "Encryption everywhere", body: "AES-256 at rest, TLS 1.3 in transit, customer-scoped keys." },
  { icon: Fingerprint, title: "Zero training on your data", body: "Your documents never train shared models. Ever." },
  { icon: KeyRound, title: "SSO & SCIM", body: "SAML, OIDC and directory sync on every business plan." },
  { icon: ServerCog, title: "Region pinning", body: "Keep data resident in the US or EU — your choice." },
  { icon: FileSearch, title: "Full audit trail", body: "Every agent action logged, exportable and reviewable." },
];

export function SecuritySection() {
  return (
    <section className="relative overflow-hidden px-6 py-32">
      <Aurora variant="emerald" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Security & Compliance"
          title={
            <>
              Paranoid by design. <span className="text-aurora">Audited to prove it.</span>
            </>
          }
          sub="Your executives see everything, so we treat their memory like a vault."
        />
        <div className="grid gap-px overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.05] sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group bg-[#090b13] p-7 transition-colors hover:bg-[#0e1120]"
            >
              <s.icon className="h-5 w-5 text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
              <h3 className="mt-4 text-sm font-bold text-white">{s.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Customer stories                                                  */
/* ================================================================ */
const STORIES = [
  {
    quote: "Our Monday exec meeting used to be an hour of reading dashboards. Now it's fifteen minutes of deciding. CrewMind's brief is the agenda.",
    name: "Priya Raman",
    role: "CEO, Meridian Logistics",
    metric: "-70% meeting prep",
  },
  {
    quote: "Ledger caught a billing misconfiguration that three humans and two tools had missed for a year. It paid for itself in week two.",
    name: "Daniel Okafor",
    role: "CFO, Vantage Labs",
    metric: "Rs 220K recovered",
  },
  {
    quote: "I don't have a general counsel. I have Clause. Our vendor renewals stopped being a place where money quietly leaks.",
    name: "Sofia Marchetti",
    role: "Founder, Arcadia Goods",
    metric: "12 contracts renegotiated",
  },
];

export function StoriesSection() {
  return (
    <section className="relative px-6 py-32">
      <Aurora variant="violet" />
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Customer Stories"
          title={
            <>
              Small teams. <span className="text-aurora">Executive-grade decisions.</span>
            </>
          }
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {STORIES.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.12}>
              <TiltCard maxTilt={6} className="h-full">
                <div className="glass flex h-full flex-col rounded-3xl p-7">
                  <Quote className="h-6 w-6 text-crew-400/60" />
                  <p className="mt-4 flex-1 text-[15px] leading-relaxed text-slate-300">“{s.quote}”</p>
                  <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-4">
                    <div>
                      <p className="text-sm font-bold text-white">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.role}</p>
                    </div>
                    <span className="rounded-full border border-crew-500/30 bg-crew-500/10 px-3 py-1 text-[10px] font-bold text-crew-300">
                      {s.metric}
                    </span>
                  </div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================ */
/* Integrations orbit                                                */
/* ================================================================ */
const INTEGRATIONS = ["Slack", "QuickBooks", "Stripe", "HubSpot", "Notion", "Google Drive", "Salesforce", "Xero", "Linear", "Snowflake", "Gmail", "Shopify"];

export function IntegrationsSection() {
  const [ringA, ringB] = [INTEGRATIONS.slice(0, 6), INTEGRATIONS.slice(6)];
  return (
    <section className="relative overflow-hidden px-6 py-32">
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Integrations"
          title={
            <>
              Plugged into <span className="text-aurora">everything you run.</span>
            </>
          }
          sub="Two-way connections. The crew reads from your stack — and writes decisions back into it."
        />
        <Reveal>
          <div className="relative mx-auto flex h-[420px] max-w-2xl items-center justify-center">
            {/* core */}
            <div className="conic-ring relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl">
              <div className="glass-deep flex h-full w-full items-center justify-center rounded-3xl">
                <BrainCircuit className="h-9 w-9 text-crew-300" />
              </div>
            </div>
            {/* orbit rings */}
            {[ringA, ringB].map((ring, r) => (
              <motion.div
                key={r}
                className="absolute rounded-full border border-white/[0.06]"
                style={{ width: r === 0 ? 260 : 400, height: r === 0 ? 260 : 400 }}
                animate={{ rotate: r === 0 ? 360 : -360 }}
                transition={{ repeat: Infinity, duration: r === 0 ? 40 : 60, ease: "linear" }}
              >
                {ring.map((name, i) => {
                  const angle = (i / ring.length) * Math.PI * 2;
                  const radius = r === 0 ? 130 : 200;
                  return (
                    <motion.div
                      key={name}
                      className="absolute left-1/2 top-1/2"
                      style={{ x: Math.cos(angle) * radius - 44, y: Math.sin(angle) * radius - 16 }}
                      animate={{ rotate: r === 0 ? -360 : 360 }}
                      transition={{ repeat: Infinity, duration: r === 0 ? 40 : 60, ease: "linear" }}
                    >
                      <span className="glass block w-[88px] truncate rounded-xl px-3 py-2 text-center text-[11px] font-semibold text-slate-300 transition-colors hover:text-white">
                        {name}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>
            ))}
            {/* glow */}
            <div aria-hidden className="absolute h-64 w-64 rounded-full bg-crew-500/15 blur-3xl" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
