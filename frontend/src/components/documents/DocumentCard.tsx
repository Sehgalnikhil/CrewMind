import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, FileSpreadsheet, FileText, Loader2, Trash2 } from "lucide-react";

import { deleteDocument } from "#/api/documents";
import { Badge } from "#/components/ui/Badge";
import type { DocumentItem } from "#/types";

const ICONS: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  pptx: FileText,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
};

const STATUS_TONE: Record<DocumentItem["status"], "neutral" | "warning" | "success" | "danger"> = {
  uploaded: "neutral",
  parsing: "warning",
  indexed: "success",
  failed: "danger",
};

export function DocumentCard({ document }: { document: DocumentItem }) {
  const queryClient = useQueryClient();
  const Icon = ICONS[document.file_type] ?? FileText;

  const mutation = useMutation({
    mutationFn: () => deleteDocument(document.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });

  return (
    <div className="flex items-center gap-4 rounded-xl border border-surface-border bg-surface-raised px-4 py-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-card text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">{document.filename}</p>
        <p className="text-xs text-slate-500">
          {document.file_type.toUpperCase()}
          {document.chunk_count > 0 &&
            ` · ${document.chunk_count} chunk${document.chunk_count === 1 ? "" : "s"} indexed`}
          {document.error_message && ` · ${document.error_message}`}
        </p>
      </div>
      <Badge tone={STATUS_TONE[document.status]}>
        {document.status === "parsing" && <Loader2 className="h-3 w-3 animate-spin" />}
        {document.status === "failed" && <AlertCircle className="h-3 w-3" />}
        {document.status}
      </Badge>
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
