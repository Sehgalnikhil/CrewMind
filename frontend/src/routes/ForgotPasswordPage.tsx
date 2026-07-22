import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { AuthLayout } from "#/components/auth/AuthLayout";
import { AuthField, AuthSubmit } from "#/components/auth/controls";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <Link
          to="/login"
          className="mb-7 inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>

        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-[0_0_40px_-10px_rgba(5,150,105,0.8)]"
            >
              <CheckCircle2 className="h-8 w-8" />
            </motion.div>
            <h2 className="mb-3 text-2xl font-extrabold tracking-tight text-white">Check your email.</h2>
            <p className="mb-8 text-sm leading-relaxed text-slate-400">
              We sent a password reset link to
              <br />
              <span className="font-bold text-white">{email}</span>
            </p>
            <p className="text-sm text-slate-500">
              Didn't receive it?{" "}
              <button className="font-bold text-crew-300 hover:text-crew-200" onClick={() => setSuccess(false)}>
                Resend the link
              </button>
            </p>
          </motion.div>
        ) : (
          <>
            <div className="mb-8">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-crew-500/30 bg-crew-500/10 text-crew-300 shadow-[0_0_36px_-10px_rgba(108,92,231,0.9)]">
                <KeyRound className="h-5 w-5" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">Locked out?</h1>
              <p className="mt-2 text-sm text-slate-400">No worries — we'll send you reset instructions.</p>
            </div>

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
              <AuthSubmit loading={loading}>
                Send reset link <ArrowRight className="h-4 w-4" />
              </AuthSubmit>
            </form>
          </>
        )}
      </motion.div>
    </AuthLayout>
  );
}
