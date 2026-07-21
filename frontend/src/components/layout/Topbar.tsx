import { LogOut, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuthStore } from "#/stores/authStore";

export function Topbar({ title, onOpenMenu }: { title: string; onOpenMenu: () => void }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-border bg-surface px-4 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-surface-card hover:text-slate-200 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-200">{user.full_name}</p>
            <p className="text-xs text-slate-500">{user.org_name}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-surface-card hover:text-slate-200"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
