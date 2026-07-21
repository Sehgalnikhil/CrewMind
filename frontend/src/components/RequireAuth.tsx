import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuthStore } from "#/stores/authStore";

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
