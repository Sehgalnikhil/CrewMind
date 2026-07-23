import { Suspense, lazy, useEffect, useState } from "react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Hero } from "#/components/world/Hero";
import { DashboardSection } from "#/components/world/DashboardSection";
import { TeamSection } from "#/components/world/TeamSection";
import { WorkflowSection } from "#/components/world/WorkflowSection";
import {
  AnalyticsSection,
  CapabilitiesSection,
  IndustriesSection,
  IntegrationsSection,
  LiveReportSection,
  SecuritySection,
  StoriesSection,
  TrustedMarquee,
  WhySection,
} from "#/components/world/Sections";
import { FaqSection, FinalCta, PricingSection, WorldFooter } from "#/components/world/Closing";

const WorldCanvas = lazy(() =>
  import("#/components/world/WorldCanvas").then((m) => ({ default: m.WorldCanvas })),
);

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "border-b border-white/[0.06] bg-[#05060c]/70 backdrop-blur-xl" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex items-center gap-2.5">
          <div className="conic-ring flex h-9 w-9 items-center justify-center rounded-xl">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-[#0B0D14]">
              <span className="bg-gradient-to-br from-crew-300 to-[#67c7f5] bg-clip-text text-sm font-extrabold text-transparent">
                C
              </span>
            </div>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white">CrewMind</span>
        </a>
        <nav className="hidden items-center gap-8 md:flex">
          {[
            ["The Agents", "#agents"],
            ["Dashboard", "#dashboard"],
            ["Capabilities", "#features"],
            ["Pricing", "#pricing"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="group relative text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              {label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-crew-400 to-[#0891CF] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="hidden text-sm font-semibold text-slate-300 transition-colors hover:text-white sm:block">
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black shadow-[0_0_30px_-8px_rgba(138,123,239,0.6)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_-6px_rgba(138,123,239,0.9)]">
                Get started
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </motion.header>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-crew-500 via-[#0891CF] to-[#EC4899]"
      style={{ scaleX }}
    />
  );
}

export function LandingPage() {
  return (
    <div className="world relative min-h-screen overflow-x-clip font-sans antialiased selection:bg-crew-500 selection:text-white">
      {/* persistent 3D world behind everything */}
      <Suspense fallback={null}>
        <WorldCanvas />
      </Suspense>
      <div className="world-noise" aria-hidden />
      <ScrollProgress />
      <Navbar />

      <main className="relative z-10">
        <Hero />
        <TrustedMarquee />
        <DashboardSection />
        <TeamSection />
        <WorkflowSection />
        <WhySection />
        <CapabilitiesSection />
        <LiveReportSection />
        <AnalyticsSection />
        <IndustriesSection />
        <SecuritySection />
        <StoriesSection />
        <IntegrationsSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>

      <div className="relative z-10">
        <WorldFooter />
      </div>
    </div>
  );
}
