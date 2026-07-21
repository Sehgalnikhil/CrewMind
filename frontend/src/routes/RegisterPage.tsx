import { motion } from "framer-motion";
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchMe, registerRequest } from "#/api/auth";
import { Button } from "#/components/ui/Button";
import { Card } from "#/components/ui/Card";
import { Input } from "#/components/ui/Input";
import { extractErrorMessage } from "#/lib/utils";
import { useAuthStore } from "#/stores/authStore";

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
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
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
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-crew-500/15">
            <svg viewBox="0 0 148 100" className="h-6 w-6">
              <g stroke="#6C5CE7" strokeWidth="10" strokeLinecap="round">
                <line x1="40" y1="64" x2="72" y2="30" />
                <line x1="108" y1="64" x2="76" y2="30" />
                <line x1="44" y1="72" x2="104" y2="72" />
              </g>
              <circle cx="74" cy="26" r="18" fill="#6C5CE7" />
              <circle cx="30" cy="72" r="15" fill="#6C5CE7" />
              <circle cx="118" cy="72" r="15" fill="#6C5CE7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">Build your executive team</h1>
          <p className="text-sm text-slate-400">Start making faster, better-informed decisions</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="full_name"
              label="Full name"
              required
              value={form.full_name}
              onChange={update("full_name")}
              placeholder="Ada Founder"
            />
            <Input
              id="organization_name"
              label="Company name"
              required
              value={form.organization_name}
              onChange={update("organization_name")}
              placeholder="Acme Inc"
            />
            <Input
              id="email"
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder="you@company.com"
            />
            <Input
              id="password"
              label="Password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update("password")}
              placeholder="At least 8 characters"
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button
              type="submit"
              loading={loading}
              icon={<UserPlus className="h-4 w-4" />}
              className="mt-2"
            >
              Create account
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-crew-400 hover:text-crew-300">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
