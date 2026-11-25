import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

export function LoginPage() {
  const { setSession, loginAsDemo } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('demo@brainbazaar.in');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      setSession(res.token, res.user, res.vendor);
      navigate(res.vendor.onboardingComplete ? '/dashboard' : '/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await loginAsDemo();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <BrandLogo showSubtext />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111827] p-7">
          <h1 className="font-display text-xl font-bold text-white">Sign in to BrainBazaar</h1>
          <p className="mt-1 text-sm text-slate-400">
            Access your demand forecasts, smart inventory, and daily stall ledger.
          </p>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs text-rose-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@brainbazaar.in"
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A3E635] px-4 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-[#bef264] transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Sign In</span>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <div className="h-px flex-1 bg-white/8" />
            <span>or explore immediately</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <button
            type="button"
            onClick={handleDemo}
            disabled={demoLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors disabled:opacity-60"
          >
            {demoLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>Enter Lucknow Demo Vendor Mode</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <p className="mt-6 text-center text-xs text-slate-400">
            New to BrainBazaar?{' '}
            <Link to="/register" className="font-semibold text-[#A3E635] hover:underline">
              Create a free vendor account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
