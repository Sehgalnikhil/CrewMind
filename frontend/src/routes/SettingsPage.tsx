import { AppShell } from "#/components/layout/AppShell";
import { Card } from "#/components/ui/Card";
import { useAuthStore } from "#/stores/authStore";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
            Profile
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Name</dt>
              <dd className="text-slate-100">{user?.full_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Email</dt>
              <dd className="text-slate-100">{user?.email}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
            Organization
          </h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Company</dt>
              <dd className="text-slate-100">{user?.org_name}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </AppShell>
  );
}
