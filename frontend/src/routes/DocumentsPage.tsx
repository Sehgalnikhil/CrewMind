import { AppShell } from "#/components/layout/AppShell";
import { DocumentList } from "#/components/documents/DocumentList";
import { UploadDropzone } from "#/components/documents/UploadDropzone";
import { Card } from "#/components/ui/Card";

export function DocumentsPage() {
  return (
    <AppShell title="Documents">
      <div className="mx-auto max-w-3xl space-y-6">
        <UploadDropzone />
        <Card>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
            Your documents
          </h3>
          <DocumentList />
        </Card>
      </div>
    </AppShell>
  );
}
