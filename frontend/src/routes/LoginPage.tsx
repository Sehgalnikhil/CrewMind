import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchMe, loginRequest } from "#/api/auth";
import { extractErrorMessage } from "#/lib/utils";
import { useAuthStore } from "#/stores/authStore";
import { AuthLayout } from "#/components/auth/AuthLayout";
import { AuthDivider, AuthError, AuthField, AuthSubmit } from "#/components/auth/controls";
import { GoogleButton, MicrosoftButton } from "#/components/auth/SocialButtons";

export function LoginPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await loginRequest({ email, password });
      setToken(access_token);
      const me = await fetchMe();
      setUser(me);
      navigate("/dashboard");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-crew-300">
            <span className="relative h-1.5 w-1.5 rounded-full bg-crew-400 status-ping" />
            secure access
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">Welcome back.</h1>
          <p className="mt-2 text-sm text-slate-400">Your crew kept working while you were away.</p>
        </div>

        <div className="flex flex-col gap-3">
          <GoogleButton />
          <MicrosoftButton />
        </div>

        <AuthDivider>or continue with email</AuthDivider>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthField
            label="Email address"
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          <AuthField
            label="Password"
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          <div className="flex items-center justify-between text-sm">
            <label className="group flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="peer h-4 w-4 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/[0.04] transition-all checked:border-crew-400 checked:bg-crew-500 focus:outline-none focus:ring-2 focus:ring-crew-500/40"
              />
              <span className="text-xs font-semibold text-slate-400 transition-colors group-hover:text-slate-200">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-xs font-bold text-crew-300 transition-colors hover:text-crew-200">
              Forgot password?
            </Link>
          </div>

          {error && <AuthError message={error} />}

          <AuthSubmit loading={loading}>
            Enter the boardroom <ArrowRight className="h-4 w-4" />
          </AuthSubmit>
        </form>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          No crew yet?{" "}
          <Link to="/register" className="font-bold text-crew-300 transition-colors hover:text-crew-200">
            Assemble one free
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
