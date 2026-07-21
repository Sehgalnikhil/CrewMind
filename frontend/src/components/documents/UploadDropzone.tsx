import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadCloud } from "lucide-react";
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

export function UploadDropzone() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      acceptedFiles.forEach((file) => mutation.mutate(file));
    },
    [mutation]
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
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          isDragActive
            ? "border-crew-500 bg-crew-500/5"
            : "border-surface-border hover:border-crew-500/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crew-500/15 text-crew-300">
          <UploadCloud className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium text-white">
            {isDragActive ? "Drop to upload" : "Drag & drop files, or click to browse"}
          </p>
          <p className="mt-1 text-sm text-slate-500">PDF, DOCX, PPTX, XLSX, CSV — up to 25 MB</p>
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
