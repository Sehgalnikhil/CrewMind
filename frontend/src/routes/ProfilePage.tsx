import { motion } from "framer-motion";
import { History, LogOut, MoonStar, Star, SunMedium } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { AppShell } from "#/components/layout/AppShell";
import { BlockTitle, GlowChip, Panel } from "#/components/os/ui";
import { Kbd, PageHero, Toggle, timeAgo } from "#/components/system/shared";
import { NAV_ENTRIES } from "#/lib/navigation";
import { useAuthStore } from "#/stores/authStore";
import { useUiStore } from "#/stores/uiStore";
import { cn } from "#/lib/utils";

const SESSIONS = [
  { device: "MacBook Pro · Chrome", place: "Mumbai, IN", current: true, hoursAgo: 0 },
  { device: "iPhone 16 · Safari", place: "Mumbai, IN", current: false, hoursAgo: 26 },
  { device: "iPad · Safari", place: "Pune, IN", current: false, hoursAgo: 180 },
];

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const { theme, setTheme, bookmarks, recents } = useUiStore();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compact, setCompact] = useState(false);
  const [sessions, setSessions] = useState(SESSIONS);

  const initials = (user?.full_name ?? "You")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <AppShell title="Profile" wide>
      <PageHero label="you, on crewmind" title="Operator" accent="profile." />

      <div className="grid gap-5 xl:grid-cols-3">
        {/* identity */}
        <Panel deep delay={0.05} className="conic-ring flex flex-col items-center p-8 text-center">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-crew-500 to-[#0891CF] text-2xl font-extrabold text-white shadow-glow"
          >
            {initials}
          </motion.div>
          <h3 className="mt-4 text-xl font-extrabold tracking-tight text-white">{user?.full_name ?? "Executive"}</h3>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <div className="mt-3 flex items-center gap-2">
            <GlowChip color="#8A7BEF">Owner</GlowChip>
            <GlowChip color="#0891CF">{user?.org_name ?? "Your Company"}</GlowChip>
          </div>
          <p className="mt-5 text-[11px] leading-relaxed text-slate-500">
            The five executives report to you. Everything they learn, decide and recommend is scoped to your organization.
          </p>
        </Panel>

        {/* preferences */}
        <Panel delay={0.1} className="p-6">
          <BlockTitle label="how the os feels" title="Preferences" />
          <p className="mb-2 text-[11px] font-semibold text-slate-400">Theme</p>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { key: "dark", label: "Dark", icon: MoonStar, swatch: "bg-[#0B0D14]" },
                { key: "bright", label: "Bright", icon: SunMedium, swatch: "bg-[#f3f0e9]" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                aria-pressed={theme === t.key}
                className={cn(
                  "rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5",
                  theme === t.key ? "border-crew-500/60 bg-crew-500/10" : "border-white/10 bg-white/[0.03]",
                )}
              >
                <span className={cn("block h-14 w-full rounded-xl border border-white/10", t.swatch)}>
                  <span className="mt-2 ml-2 block h-2 w-10 rounded-full bg-crew-500/60" />
                  <span className={cn("mt-1.5 ml-2 block h-1.5 w-14 rounded-full", t.key === "dark" ? "bg-white/20" : "bg-black/20")} />
                </span>
                <span className="mt-2 flex items-center gap-1.5 text-xs font-bold text-white">
                  <t.icon className="h-3.5 w-3.5 text-crew-300" /> {t.label}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-3.5">
            <label className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-300">Reduce motion</span>
              <Toggle on={reducedMotion} onChange={setReducedMotion} label="Reduce motion" />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-slate-300">Compact density</span>
              <Toggle on={compact} onChange={setCompact} label="Compact density" />
            </label>
          </div>

          <div className="mt-6 border-t border-white/[0.07] pt-5">
            <p className="mb-3 text-[11px] font-semibold text-slate-400">Security</p>
            <div className="flex flex-col gap-2">
              <input type="password" placeholder="Current password" aria-label="Current password" className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white outline-none focus:border-crew-500/40" />
              <input type="password" placeholder="New password" aria-label="New password" className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white outline-none focus:border-crew-500/40" />
              <button className="rounded-xl border border-white/12 bg-white/[0.05] py-2 text-xs font-bold text-white transition-colors hover:border-crew-500/40">
                Update password
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              {sessions.map((s) => (
                <div key={s.device} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] px-3 py-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", s.current ? "bg-emerald-400" : "bg-slate-600")} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-200">{s.device}</span>
                    <span className="block font-mono text-[9px] text-slate-600">
                      {s.place} · {s.current ? "this session" : timeAgo(new Date(Date.now() - s.hoursAgo * 3600000).toISOString())}
                    </span>
                  </span>
                  {!s.current && (
                    <button
                      onClick={() => setSessions(sessions.filter((x) => x !== s))}
                      aria-label={`Revoke ${s.device}`}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 hover:text-[#EC4899]"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <div className="flex flex-col gap-5">
          {/* shortcuts */}
          <Panel delay={0.15} className="p-6">
            <BlockTitle label="fly the os" title="Keyboard shortcuts" />
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                <span className="text-[12px] font-semibold text-slate-300">Command palette</span>
                <span className="flex gap-1"><Kbd>⌘</Kbd><Kbd>K</Kbd></span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                <span className="text-[12px] font-semibold text-slate-300">Toggle theme</span>
                <span className="flex gap-1"><Kbd>⇧</Kbd><Kbd>D</Kbd></span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                <span className="text-[12px] font-semibold text-slate-300">Ask Nexus</span>
                <span className="flex gap-1"><Kbd>⇧</Kbd><Kbd>A</Kbd></span>
              </div>
              <p className="mt-2 mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">go to · press g then…</p>
              <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto pr-1">
                {NAV_ENTRIES.filter((e) => e.chord).map((e) => (
                  <div key={e.to} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-1.5">
                    <span className="text-[12px] font-semibold text-slate-300">{e.label}</span>
                    <span className="flex gap-1"><Kbd>g</Kbd><Kbd>{e.chord}</Kbd></span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          {/* bookmarks & recents */}
          <Panel delay={0.2} className="p-6">
            <BlockTitle label="your trail" title="Bookmarks & recents" />
            {bookmarks.length === 0 && recents.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">
                Star a workspace from the top bar and it lands here.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {bookmarks.map((b) => (
                  <Link key={b.to} to={b.to} className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/[0.04]">
                    <Star className="h-3.5 w-3.5 fill-current text-amber-300" />
                    <span className="text-[12.5px] font-semibold text-slate-200">{b.label}</span>
                  </Link>
                ))}
                {recents.slice(0, 5).map((r) => (
                  <Link key={r.to} to={r.to} className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-white/[0.04]">
                    <History className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-[12.5px] font-semibold text-slate-300">{r.label}</span>
                    <span className="ml-auto font-mono text-[9px] text-slate-600">{timeAgo(r.at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
