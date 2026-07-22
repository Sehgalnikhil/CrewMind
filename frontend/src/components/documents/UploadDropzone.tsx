import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Sparkles, UploadCloud } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import { uploadDocument } from "#/api/documents";
import { extractErrorMessage } from "#/lib/utils";

const ACCEPT = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/csv": [".csv"],
};

const FORMATS = ["PDF", "DOCX", "PPTX", "XLSX", "CSV"];

export function UploadDropzone() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [inFlight, setInFlight] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      acceptedFiles.forEach((file) => {
        setInFlight((f) => [...f, file.name]);
        mutation.mutate(file, {
          onSettled: () => setInFlight((f) => f.filter((n) => n !== file.name)),
        });
      });
    },
    [mutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: 25 * 1024 * 1024,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`group relative cursor-pointer overflow-hidden rounded-3xl transition-all duration-300 ${isDragActive ? "conic-ring" : ""}`}
      >
        <div
          className={`glass-deep scanline relative flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed px-6 py-14 text-center transition-colors duration-300 ${
            isDragActive ? "border-crew-400/70 bg-crew-500/[0.08]" : "border-white/10 group-hover:border-crew-500/40"
          }`}
        >
          <input {...getInputProps()} />

          <motion.div
            animate={isDragActive ? { scale: 1.15, y: -6 } : { y: [0, -8, 0] }}
            transition={isDragActive ? { type: "spring", stiffness: 260, damping: 16 } : { repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="flex h-16 w-16 items-center justify-center rounded-3xl border border-crew-500/30 bg-crew-500/15 text-crew-300 shadow-[0_0_50px_-12px_rgba(108,92,231,0.9)]"
          >
            <UploadCloud className="h-7 w-7" />
          </motion.div>

          <div>
            <p className="text-base font-bold text-white">
              {isDragActive ? "Release — the crew is ready." : "Drop your business documents here"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              or <span className="font-bold text-crew-300">browse files</span> · up to 25 MB each
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {FORMATS.map((f) => (
              <span key={f} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-400">
                {f}
              </span>
            ))}
          </div>

          <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.25em] text-slate-600">
            <Sparkles className="h-3 w-3 text-crew-400" />
            parsed, chunked & indexed for all five agents
          </p>
        </div>
      </div>

      {/* in-flight uploads */}
      <AnimatePresence>
        {inFlight.map((name) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass mt-3 flex items-center gap-3 rounded-2xl px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-crew-500/15 text-crew-300">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{name}</p>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-gradient-to-r from-crew-500 to-[#0891CF]"
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  />
                </div>
              </div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-crew-300">uploading</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-2xl border border-[#EC4899]/30 bg-[#EC4899]/10 px-4 py-3 text-sm text-[#f5a9cf]">
          {error}
        </motion.p>
      )}
    </div>
  );
}
