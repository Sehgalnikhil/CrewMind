import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchMe, registerRequest } from "#/api/auth";
import { extractErrorMessage } from "#/lib/utils";
import { useAuthStore } from "#/stores/authStore";
import { AuthLayout } from "#/components/auth/AuthLayout";
import { AuthDivider, AuthError, AuthField, AuthSubmit } from "#/components/auth/controls";
import { GoogleButton, MicrosoftButton } from "#/components/auth/SocialButtons";

export function RegisterPage() {
  const navigate = useNavigate();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser = useAuthStore((s) => s.setUser);
  const [form, setForm] = useState({
    full_name: "",
    organization_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await registerRequest(form);
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
        <div className="mb-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-crew-300">
            <Sparkles className="h-3 w-3" />
            14-day free trial
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            Assemble your <span className="text-aurora">crew.</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">Five executives, hired in fifteen minutes. No credit card.</p>
        </div>

        <div className="flex flex-col gap-3">
          <GoogleButton label="Sign up with Google" />
          <MicrosoftButton label="Sign up with Microsoft" />
        </div>

        <AuthDivider>or register with email</AuthDivider>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthField label="Full name" id="full_name" required value={form.full_name} onChange={update("full_name")} placeholder="Ada Founder" />
            <AuthField label="Company" id="organization_name" required value={form.organization_name} onChange={update("organization_name")} placeholder="Acme Inc" />
          </div>
          <AuthField label="Email address" id="email" type="email" required value={form.email} onChange={update("email")} placeholder="you@company.com" />
          <AuthField
            label="Password"
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
            placeholder="At least 8 characters"
          />

          <label className="group flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              required
              className="peer mt-0.5 h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-md border border-white/20 bg-white/[0.04] transition-all checked:border-crew-400 checked:bg-crew-500 focus:outline-none focus:ring-2 focus:ring-crew-500/40"
            />
            <span className="text-xs font-medium leading-relaxed text-slate-400">
              I agree to the{" "}
              <a href="#" className="font-bold text-crew-300 hover:text-crew-200">Terms of Service</a> and{" "}
              <a href="#" className="font-bold text-crew-300 hover:text-crew-200">Privacy Policy</a>
            </span>
          </label>

          {error && <AuthError message={error} />}

          <AuthSubmit loading={loading}>
            <Sparkles className="h-4 w-4" /> Create my executive team
          </AuthSubmit>
        </form>

        <p className="mt-7 text-center text-sm font-medium text-slate-500">
          Already have a crew?{" "}
          <Link to="/login" className="font-bold text-crew-300 transition-colors hover:text-crew-200">
            Sign in
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
