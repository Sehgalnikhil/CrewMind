import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { Users, AlertTriangle } from "lucide-react";
import { useAuth } from "@clerk/react";

import { getInviteLinkInfo, acceptInviteLink } from "#/api/rbac";
import { usePermissionStore } from "#/stores/permissionStore";
import { OrbitalLoader } from "#/components/os/ui";

export function InviteLinkPage() {
  const { token } = useParams<{ token: string }>();
  const context = usePermissionStore((s) => s.context);
  const { isSignedIn } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["invite-link", token],
    queryFn: () => getInviteLinkInfo(token!),
    enabled: !!token,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: () => acceptInviteLink(token!),
    onSuccess: () => {
      // Invalidate context to reload workspaces, then navigate to dashboard
      // The simplest way to refresh context is to reload the window to dashboard
      window.location.href = "/dashboard";
    },
  });

  if (!token) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05060A] p-4 text-white">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0B0D14] shadow-2xl">
        <div className="p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-crew-500/10">
            <Users className="h-8 w-8 text-crew-400" />
          </div>
          
          {isLoading ? (
            <div className="py-8">
              <OrbitalLoader label="Loading invitation..." />
            </div>
          ) : isError ? (
            <div>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <h2 className="mb-2 text-xl font-bold">Invalid or Expired Link</h2>
              <p className="mb-6 text-sm text-slate-400">
                This invitation link is no longer valid. Please ask your administrator for a new one.
              </p>
              <Link
                to="/"
                className="inline-block rounded-xl bg-white/5 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Go Home
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="mb-2 text-2xl font-bold">You've been invited</h2>
              <p className="mb-8 text-sm text-slate-400">
                Join <strong className="text-white">{data?.workspace_name}</strong> on CrewMind.
              </p>

              {!isSignedIn ? (
                <div>
                  <p className="mb-4 text-xs text-slate-500">You need to log in or create an account to join this workspace.</p>
                  <div className="flex flex-col gap-3">
                    <Link
                      to={`/auth?next=/join/${token}`}
                      className="rounded-xl bg-crew-500 py-3 text-sm font-bold text-white transition-colors hover:bg-crew-400"
                    >
                      Log In / Sign Up
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {context?.user && (
                    <div className="mb-4 rounded-xl border border-white/5 bg-white/5 py-3 text-sm">
                      Joining as <strong className="text-white">{context.user.email}</strong>
                    </div>
                  )}
                  
                  {acceptMutation.isError && (
                    <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                      {(acceptMutation.error as any)?.response?.data?.detail || "Failed to join workspace. You may already be a member."}
                    </div>
                  )}

                  <button
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                    className="flex w-full items-center justify-center rounded-xl bg-crew-500 py-3 text-sm font-bold text-white transition-colors hover:bg-crew-400 disabled:opacity-50"
                  >
                    {acceptMutation.isPending ? "Joining..." : "Join Workspace"}
                  </button>
                  <Link
                    to="/dashboard"
                    className="text-xs font-semibold text-slate-500 hover:text-white"
                  >
                    Cancel
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
