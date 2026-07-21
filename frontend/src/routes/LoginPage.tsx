import { motion } from "framer-motion";
import { LogIn, Layout } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchMe, loginRequest } from "#/api/auth";
import { extractErrorMessage } from "#/lib/utils";
import { useAuthStore } from "#/stores/authStore";

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
    <div className="flex min-h-screen bg-white font-sans selection:bg-[#6C5CE7] selection:text-white">
      {/* Left Side: Illustration / Dashboard Preview */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gray-50 p-12 lg:flex border-r border-gray-100">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#6C5CE7 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C5CE7] text-white">
            <Layout className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">CrewMind</span>
        </div>

        <div className="relative z-10">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 leading-tight">
            Your executive board,<br /> always online.
          </h2>
          <p className="text-lg text-gray-500 max-w-md">
            Sign in to collaborate with your AI agents and get real-time insights on your business performance.
          </p>
        </div>

        {/* Abstract dashboard graphic */}
        <div className="relative z-10 -ml-12 -mb-24 mt-12 overflow-hidden rounded-tr-3xl border border-gray-200 bg-white shadow-2xl shadow-[#6C5CE7]/10 p-8">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
               <div className="h-6 w-32 rounded bg-gray-100 animate-pulse" />
               <div className="h-8 w-8 rounded-full bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="h-24 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                 <div className="mb-2 h-4 w-16 rounded bg-gray-200" />
                 <div className="h-6 w-24 rounded bg-[#6C5CE7]/20" />
               </div>
               <div className="h-24 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                 <div className="mb-2 h-4 w-16 rounded bg-gray-200" />
                 <div className="h-6 w-24 rounded bg-green-500/20" />
               </div>
            </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex w-full flex-col justify-center px-8 sm:px-16 lg:w-1/2 xl:px-32">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto w-full max-w-sm"
        >
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900">Welcome back</h1>
            <p className="text-gray-500">Enter your details to access your dashboard.</p>
          </div>

          <button className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:ring-offset-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>

          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs font-medium uppercase text-gray-400">Or continue with</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Email address</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-[#6C5CE7] focus:ring-2 focus:ring-[#6C5CE7]/20"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-[#6C5CE7] focus:ring-[#6C5CE7]" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a href="#" className="font-medium text-[#6C5CE7] hover:text-[#5a4cdb]">Forgot password?</a>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6C5CE7] px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-[#6C5CE7]/20 transition-all hover:bg-[#5a4cdb] hover:shadow-lg hover:shadow-[#6C5CE7]/30 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>Sign in <LogIn className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-[#6C5CE7] hover:text-[#5a4cdb]">
              Sign up for free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
