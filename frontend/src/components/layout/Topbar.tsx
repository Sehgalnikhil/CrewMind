import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronDown, FileText, LogOut, Menu, MoonStar, Search, Settings, Sparkles, Star, SunMedium, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { listDocuments } from "#/api/documents";
import { listReports } from "#/api/reports";
import { navByPath } from "#/lib/navigation";
import { useAuthStore } from "#/stores/authStore";
import { useUiStore } from "#/stores/uiStore";
import { cn } from "#/lib/utils";

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: reports } = useQuery({ queryKey: ["reports"], queryFn: listReports });
  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments });

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const items = [
    ...(reports ?? []).slice(0, 3).map((r) => ({
      id: `r-${r.id}`,
      icon: <Sparkles className="h-3.5 w-3.5" />,
      color: "#8A7BEF",
      title: "Executive report ready",
      body: `Health score ${r.business_health_score} · ${r.title}`,
      at: r.created_at,
      to: "/reports",
    })),
    ...(documents ?? []).slice(0, 3).map((d) => ({
      id: `d-${d.id}`,
      icon: <FileText className="h-3.5 w-3.5" />,
      color: "#0891CF",
      title: d.status === "indexed" ? "Document indexed" : d.status === "failed" ? "Document failed" : "Document processing",
      body: d.filename,
      at: d.created_at,
      to: "/documents",
    })),
  ]
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 6);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur-md transition-all hover:border-white/25 hover:text-white"
      >
        <Bell className="h-[18px] w-[18px]" />
        {items.length > 0 && (
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-crew-400 shadow-[0_0_8px_rgba(138,123,239,0.9)]" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="glass-deep absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
              <p className="text-sm font-bold text-white">Activity</p>
              <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-emerald-400">
                <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400 status-ping" /> live
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {items.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-slate-500">
                  Quiet for now — your crew will post here as it works.
                </p>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${n.color}20`, color: n.color }}
                    >
                      {n.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-white">{n.title}</span>
                      <span className="block truncate text-[11px] text-slate-400">{n.body}</span>
                      <span className="block font-mono text-[9px] uppercase tracking-wider text-slate-600">{timeAgo(n.at)}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Topbar({
  title,
  onOpenMenu,
  onOpenPalette,
}: {
  title: string;
  onOpenMenu: () => void;
  onOpenPalette: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleBookmark = useUiStore((s) => s.toggleBookmark);
  const bookmarked = useUiStore((s) => s.bookmarks.some((b) => b.to === location.pathname));
  const currentNav = navByPath(location.pathname);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-white/[0.06] bg-[#05060c]/60 px-4 backdrop-blur-2xl sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-slate-500">crewmind · executive os</p>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-extrabold tracking-tight text-white">{title}</h1>
            {currentNav && (
              <button
                onClick={() => toggleBookmark({ id: currentNav.to, label: currentNav.label, to: currentNav.to })}
                aria-label={bookmarked ? "Remove bookmark" : "Bookmark this workspace"}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-lg transition-colors",
                  bookmarked ? "text-amber-300" : "text-slate-600 hover:text-slate-300",
                )}
              >
                <Star className={cn("h-3.5 w-3.5", bookmarked && "fill-current")} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Switch to bright theme" : "Switch to dark theme"}
          title="Shift+D"
          className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur-md transition-all hover:border-white/25 hover:text-white sm:flex"
        >
          {theme === "dark" ? <SunMedium className="h-[18px] w-[18px]" /> : <MoonStar className="h-[18px] w-[18px]" />}
        </button>
        {/* command palette trigger */}
        <button
          onClick={onOpenPalette}
          className="group hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] py-2 pl-4 pr-2.5 text-sm text-slate-400 backdrop-blur-md transition-all hover:border-crew-500/40 hover:text-slate-200 md:flex lg:w-72"
        >
          <Search className="h-4 w-4 text-slate-500 transition-colors group-hover:text-crew-300" />
          <span className="flex-1 truncate text-left text-[13px]">Search or command…</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">⌘K</kbd>
          </span>
        </button>
        <button
          onClick={onOpenPalette}
          aria-label="Search"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:text-white md:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <NotificationsMenu />

        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 pr-3 backdrop-blur-md transition-all hover:border-white/25"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-crew-500 to-[#0891CF] text-xs font-extrabold text-white shadow-glow">
                {user.full_name.charAt(0)}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold leading-tight text-white">{user.full_name}</p>
                <p className="text-[10px] leading-tight text-slate-500">{user.org_name}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-deep absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl"
                >
                  <div className="border-b border-white/[0.07] px-4 py-3">
                    <p className="text-sm font-bold text-white">{user.full_name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                    >
                      <User className="h-4 w-4 text-slate-500" /> Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/[0.05] hover:text-white"
                    >
                      <Settings className="h-4 w-4 text-slate-500" /> Settings
                    </Link>
                  </div>
                  <div className="border-t border-white/[0.07] p-2">
                    <button
                      onClick={() => {
                        logout();
                        navigate("/login");
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-[#EC4899] transition-colors hover:bg-[#EC4899]/10"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
}
