import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, FileSpreadsheet, FileText, Loader2, Presentation, Trash2 } from "lucide-react";

import { deleteDocument } from "#/api/documents";
import type { DocumentItem } from "#/types";

const TYPE_META: Record<string, { icon: typeof FileText; color: string }> = {
  pdf: { icon: FileText, color: "#EC4899" },
  docx: { icon: FileText, color: "#0891CF" },
  pptx: { icon: Presentation, color: "#D97706" },
  xlsx: { icon: FileSpreadsheet, color: "#059669" },
  csv: { icon: FileSpreadsheet, color: "#059669" },
};

const STATUS_META: Record<DocumentItem["status"], { label: string; color: string }> = {
  uploaded: { label: "queued", color: "#aab0c4" },
  parsing: { label: "processing", color: "#D97706" },
  indexed: { label: "indexed", color: "#34d399" },
  failed: { label: "failed", color: "#EC4899" },
};

export function DocumentCard({ document }: { document: DocumentItem }) {
  const queryClient = useQueryClient();
  const { icon: Icon, color } = TYPE_META[document.file_type] ?? { icon: FileText, color: "#8A7BEF" };
  const status = STATUS_META[document.status];

  const mutation = useMutation({
    mutationFn: () => deleteDocument(document.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="glass holo-sheen group relative flex items-center gap-4 overflow-hidden rounded-2xl px-4 py-3.5"
    >
      {document.status === "parsing" && (
        <motion.span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, #D97706, transparent)" }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
      )}

      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${color}18`, color, boxShadow: `0 0 22px -10px ${color}` }}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{document.filename}</p>
        <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-wider text-slate-500">
          {document.file_type}
          {document.chunk_count > 0 && ` · ${document.chunk_count} chunk${document.chunk_count === 1 ? "" : "s"}`}
          {document.error_message && ` · ${document.error_message}`}
          {" · "}
          {new Date(document.created_at).toLocaleDateString()}
        </p>
      </div>

      <span
        className="flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold"
        style={{ borderColor: `${status.color}44`, color: status.color, backgroundColor: `${status.color}10` }}
      >
        {document.status === "parsing" && <Loader2 className="h-3 w-3 animate-spin" />}
        {document.status === "indexed" && <CheckCircle2 className="h-3 w-3" />}
        {document.status === "failed" && <AlertCircle className="h-3 w-3" />}
        {status.label}
      </span>

      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-600 opacity-0 transition-all hover:bg-[#EC4899]/15 hover:text-[#EC4899] focus:opacity-100 group-hover:opacity-100 disabled:opacity-40"
        title="Delete"
        aria-label={`Delete ${document.filename}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
