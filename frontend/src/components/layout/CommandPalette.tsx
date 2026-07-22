import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Command,
  FileText,
  History,
  Search,
  Sparkles,
  Star,
  SunMedium,
  UploadCloud,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { listDocuments } from "#/api/documents";
import { NAV_ENTRIES } from "#/lib/navigation";
import { AGENTS } from "#/types";
import { useUiStore } from "#/stores/uiStore";
import { cn } from "#/lib/utils";

interface Item {
  id: string;
  label: string;
  hint: string;
  to?: string;
  perform?: () => void;
  icon: React.ReactNode;
  group: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: documents } = useQuery({ queryKey: ["documents"], queryFn: listDocuments, enabled: open });

  const { recents, bookmarks, theme, toggleTheme, setAssistantOpen } = useUiStore();

  const items = useMemo<Item[]>(() => {
    const nav: Item[] = NAV_ENTRIES.map((e) => ({
      id: e.to,
      label: e.label,
      hint: e.chord ? `${e.hint} · g ${e.chord}` : e.hint,
      to: e.to,
      icon: <e.icon className="h-4 w-4" />,
      group: "Navigate",
    }));
    nav.push(
      { id: "upload", label: "Upload a document", hint: "PDF, DOCX, PPTX, XLSX, CSV", to: "/documents", icon: <UploadCloud className="h-4 w-4" />, group: "Actions" },
      { id: "run", label: "Run crew analysis", hint: "All five agents + coordinator", to: "/agents", icon: <Zap className="h-4 w-4" />, group: "Actions" },
      { id: "theme", label: theme === "dark" ? "Switch to bright theme" : "Switch to dark theme", hint: "Shift+D", perform: toggleTheme, icon: <SunMedium className="h-4 w-4" />, group: "Actions" },
      { id: "assistant", label: "Ask Nexus", hint: "Floating AI assistant · Shift+A", perform: () => setAssistantOpen(true), icon: <Sparkles className="h-4 w-4" />, group: "Actions" },
    );
    const marks: Item[] = bookmarks.map((b) => ({
      id: `mark-${b.to}`,
      label: b.label,
      hint: "Bookmarked",
      to: b.to,
      icon: <Star className="h-4 w-4" />,
      group: "Bookmarks",
    }));
    const recent: Item[] = recents.slice(0, 5).map((r) => ({
      id: `recent-${r.to}`,
      label: r.label,
      hint: "Recently visited",
      to: r.to,
      icon: <History className="h-4 w-4" />,
      group: "Recent",
    }));
    nav.push(...marks, ...recent);
    const agents: Item[] = AGENTS.map((a) => ({
      id: `agent-${a.key}`,
      label: `${a.persona} — ${a.name} Agent`,
      hint: a.title,
      to: `/agents/${a.key}`,
      icon: (
        <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold" style={{ backgroundColor: `${a.color}30`, color: a.color }}>
          {a.persona[0]}
        </span>
      ),
      group: "Executives",
    }));
    const docs: Item[] = (documents ?? []).slice(0, 6).map((d) => ({
      id: `doc-${d.id}`,
      label: d.filename,
      hint: `${d.file_type.toUpperCase()} · ${d.status}`,
      to: "/documents",
      icon: <FileText className="h-4 w-4" />,
      group: "Documents",
    }));
    return [...nav, ...agents, ...docs];
  }, [documents, theme, toggleTheme, setAssistantOpen, bookmarks, recents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => `${i.label} ${i.hint} ${i.group}`.toLowerCase().includes(q));
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => setActive(0), [query]);

  function run(item: Item) {
    onClose();
    if (item.perform) item.perform();
    else if (item.to) navigate(item.to);
  }

  const groups = filtered.reduce<Record<string, Item[]>>((acc, i) => {
    (acc[i.group] ??= []).push(i);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-[#020308]/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-[14vh] z-[95] w-[min(92vw,620px)] -translate-x-1/2"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="glass-deep conic-ring overflow-hidden rounded-3xl">
              <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
                <Search className="h-4 w-4 shrink-0 text-crew-300" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setActive((a) => Math.min(a + 1, filtered.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setActive((a) => Math.max(a - 1, 0));
                    } else if (e.key === "Enter" && filtered[active]) {
                      run(filtered[active]);
                    } else if (e.key === "Escape") {
                      onClose();
                    }
                  }}
                  placeholder="Search pages, executives, documents…"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
                <kbd className="rounded-md border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">esc</kbd>
              </div>

              <div className="max-h-[46vh] overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <Command className="h-6 w-6 text-slate-600" />
                    <p className="text-sm text-slate-500">Nothing matches “{query}”.</p>
                  </div>
                )}
                {Object.entries(groups).map(([group, groupItems]) => (
                  <div key={group} className="mb-1">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{group}</p>
                    {groupItems.map((item) => {
                      const idx = filtered.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => run(item)}
                          onMouseEnter={() => setActive(idx)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                            idx === active ? "bg-crew-500/15 text-white" : "text-slate-300",
                          )}
                        >
                          <span className={cn("text-slate-400", idx === active && "text-crew-300")}>{item.icon}</span>
                          <span className="flex-1 truncate text-sm font-semibold">{item.label}</span>
                          <span className="truncate text-xs text-slate-500">{item.hint}</span>
                          {idx === active && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-crew-300" />}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-2.5">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">crewmind command</span>
                <span className="flex items-center gap-2 text-[10px] text-slate-500">
                  <kbd className="rounded border border-white/10 bg-white/[0.05] px-1 py-0.5 font-mono">↑↓</kbd> navigate
                  <kbd className="rounded border border-white/10 bg-white/[0.05] px-1 py-0.5 font-mono">↵</kbd> open
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
