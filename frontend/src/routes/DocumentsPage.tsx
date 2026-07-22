import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FolderOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { listDocuments } from "#/api/documents";
import { AppShell } from "#/components/layout/AppShell";
import { DocumentCard } from "#/components/documents/DocumentCard";
import { UploadDropzone } from "#/components/documents/UploadDropzone";
import { BlockTitle, EmptyState, OrbitalLoader, Panel } from "#/components/os/ui";
import { CountUp } from "#/components/world/primitives";
import { AGENTS } from "#/types";

export function DocumentsPage() {
  const [query, setQuery] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
    refetchInterval: (q) => {
      const docs = q.state.data ?? [];
      const hasPending = docs.some((d) => d.status === "uploaded" || d.status === "parsing");
      return hasPending ? 1500 : false;
    },
  });

  const documents = data ?? [];
  const indexed = documents.filter((d) => d.status === "indexed");
  const processing = documents.filter((d) => d.status === "uploaded" || d.status === "parsing");
  const chunks = documents.reduce((sum, d) => sum + d.chunk_count, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => `${d.filename} ${d.file_type} ${d.status}`.toLowerCase().includes(q));
  }, [documents, query]);

  const stats = [
    { label: "Documents", value: documents.length, color: "#8A7BEF" },
    { label: "Indexed & readable", value: indexed.length, color: "#059669" },
    { label: "Knowledge chunks", value: chunks, color: "#0891CF" },
    { label: "Processing", value: processing.length, color: "#D97706" },
  ];

  return (
    <AppShell title="Documents">
      <div className="mx-auto flex max-w-5xl flex-col gap-5">
        {/* header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">knowledge base</p>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
            Everything your crew <span className="text-aurora">has read.</span>
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Drop in financials, contracts, decks and exports — all five executives read every page.
          </p>
        </motion.div>

        {/* stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s, i) => (
            <Panel key={s.label} delay={0.06 + i * 0.06} className="relative overflow-hidden p-4">
              <span aria-hidden className="absolute inset-x-5 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${s.color}77, transparent)` }} />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
              <p className="mt-1 text-2xl font-extrabold text-white">
                <CountUp to={s.value} duration={1.2} />
              </p>
            </Panel>
          ))}
        </div>

        {/* upload */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
          <UploadDropzone />
        </motion.div>

        {/* library */}
        <Panel delay={0.25} className="p-6">
          <BlockTitle
            label="library"
            title="Your documents"
            action={
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search files…"
                  className="w-44 rounded-xl border border-white/10 bg-white/[0.04] py-1.5 pl-8 pr-3 text-xs text-white outline-none transition-all placeholder:text-slate-600 focus:border-crew-500/50 focus:ring-2 focus:ring-crew-500/20 sm:w-56"
                />
              </div>
            }
          />

          {isLoading ? (
            <OrbitalLoader label="loading library" />
          ) : filtered.length === 0 ? (
            query ? (
              <p className="py-10 text-center text-sm text-slate-500">No documents match “{query}”.</p>
            ) : (
              <EmptyState
                icon={<FolderOpen className="h-6 w-6" />}
                title="The library is empty"
                body="Upload your first document above — the crew starts reading the moment it lands."
              />
            )
          ) : (
            <div className="flex flex-col gap-2.5">
              {filtered.map((doc, i) => (
                <motion.div key={doc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.05, 0.4) }}>
                  <DocumentCard document={doc} />
                </motion.div>
              ))}
            </div>
          )}

          {indexed.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-600">being read by</span>
              {AGENTS.map((a) => (
                <span
                  key={a.key}
                  className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold"
                  style={{ borderColor: `${a.color}40`, color: a.color, backgroundColor: `${a.color}10` }}
                >
                  <span className="relative h-1.5 w-1.5 rounded-full status-ping" style={{ backgroundColor: a.color, color: a.color }} />
                  {a.persona}
                </span>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}
