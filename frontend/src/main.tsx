import {ClerkProvider} from "@clerk/react";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "#/App";
import { queryClient } from "#/api/client";
import "#/index.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClerkProvider
          publishableKey={PUBLISHABLE_KEY}
          afterSignOutUrl="/"
          signInFallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/dashboard"
        >
          <App />
        </ClerkProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);