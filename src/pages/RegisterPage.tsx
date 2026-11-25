import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

const ZONES = ['Hazratganj', 'Aminabad', 'Chowk', 'Aliganj', 'Indira Nagar', 'Gomti Nagar'];

export function RegisterPage() {
  const { setSession } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [zone, setZone] = useState('Hazratganj');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.register({ name, businessName, zone, email, password });
      setSession(res.token, res.user, res.vendor);
      navigate('/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to register account.');
    } finally {
      setLoading(false);
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
          <h1 className="font-display text-xl font-bold text-white">Create your BrainBazaar account</h1>
          <p className="mt-1 text-sm text-slate-400">
            Start forecasting daily demand and tracking stall margins in minutes.
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Owner Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Suresh Gupta"
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Stall Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Awadh Chaat House"
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Lucknow Zone</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                >
                  {ZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@stall.in"
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password (min 6 chars) *
              </label>
              <input
                type="password"
                required
                minLength={6}
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
              <span>Continue to Stall Setup</span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#A3E635] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
