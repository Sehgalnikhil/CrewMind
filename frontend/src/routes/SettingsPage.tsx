import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";

import { getStatus } from "#/api/status";
import { AppShell } from "#/components/layout/AppShell";
import { Badge } from "#/components/ui/Badge";
import { Card } from "#/components/ui/Card";
import { Spinner } from "#/components/ui/Spinner";
import { useAuthStore } from "#/stores/authStore";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const { data: status, isLoading } = useQuery({ queryKey: ["status"], queryFn: getStatus });

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

        <Card>
          <h3 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
            AI Agents
          </h3>
          {isLoading ? (
            <Spinner />
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400">Anthropic API key</dt>
                <dd>
                  {status?.llm_configured ? (
                    <Badge tone="success">
                      <CheckCircle2 className="h-3 w-3" /> Configured
                    </Badge>
                  ) : (
                    <Badge tone="danger">
                      <XCircle className="h-3 w-3" /> Not configured
                    </Badge>
                  )}
                </dd>
              </div>
              {status?.llm_configured && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Model</dt>
                  <dd className="text-slate-100">{status.llm_model}</dd>
                </div>
              )}
              {!status?.llm_configured && (
                <p className="text-xs text-slate-500">
                  Add <code className="text-slate-400">ANTHROPIC_API_KEY</code> to{" "}
                  <code className="text-slate-400">backend/.env</code> and restart the server to
                  enable your executive team.
                </p>
              )}
            </dl>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
