import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";

import { listDocuments } from "#/api/documents";
import { DocumentCard } from "#/components/documents/DocumentCard";
import { Spinner } from "#/components/ui/Spinner";

export function DocumentList() {
  const { data, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: listDocuments,
    refetchInterval: (query) => {
      const docs = query.state.data ?? [];
      const hasPending = docs.some((d) => d.status === "uploaded" || d.status === "parsing");
      return hasPending ? 1500 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center text-slate-500">
        <FolderOpen className="h-8 w-8" />
        <p className="text-sm">No documents yet. Upload one to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {data.map((doc, i) => (
        <motion.div
          key={doc.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <DocumentCard document={doc} />
        </motion.div>
      ))}
    </div>
  );
}
