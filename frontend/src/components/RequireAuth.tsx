import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@clerk/react";

import { setGetTokenFn } from "#/api/client";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, userId, getToken } = useAuth();
  
  useEffect(() => {
    setGetTokenFn(() => getToken());
  }, [getToken]);

  if (!isLoaded) return null;
  
  if (!userId) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}
