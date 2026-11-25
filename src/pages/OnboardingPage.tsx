import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import type { Language } from '../types';

const ZONES = ['Hazratganj', 'Aminabad', 'Chowk', 'Aliganj', 'Indira Nagar', 'Gomti Nagar'];
const CATEGORIES = [
  'Chaat & Street Snacks',
  'Beverages & Chai',
  'Sweets & Desserts',
  'Morning Breakfast & Chai',
  'Kebab & Rolls',
  'Kulfi & Cold Drinks',
];

export function OnboardingPage() {
  const { vendor, updateVendorState } = useApp();
  const navigate = useNavigate();

  const [businessName, setBusinessName] = useState(vendor?.businessName || '');
  const [ownerName, setOwnerName] = useState(vendor?.ownerName || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [foodCategory, setFoodCategory] = useState(vendor?.foodCategory || CATEGORIES[0]);
  const [zone, setZone] = useState(vendor?.zone || ZONES[0]);
  const [address, setAddress] = useState(vendor?.address || '');
  const [openingHours, setOpeningHours] = useState(vendor?.openingHours || '8:00 AM – 10:00 PM');
  const [dailyTargetInr, setDailyTargetInr] = useState(vendor?.dailyTargetInr || 10000);
  const [language, setLanguage] = useState<Language>(vendor?.language || 'en');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.completeOnboarding({
        businessName,
        ownerName,
        phone,
        foodCategory,
        zone,
        address,
        openingHours,
        dailyTargetInr: Number(dailyTargetInr) || 8000,
        language,
      });
      updateVendorState(res.vendor);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save stall profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 py-12 px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <BrandLogo showSubtext />
          <span className="text-xs text-slate-400">Vendor Setup</span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111827] p-7">
          <h1 className="font-display text-2xl font-bold text-white">Configure your Lucknow stall</h1>
          <p className="mt-1 text-sm text-slate-400">
            BrainBazaar uses your zone and food category to calibrate demand forecasts and footfall benchmarks.
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Business / Stall Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Owner Name *</label>
                <input
                  type="text"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Food Category</label>
                <select
                  value={foodCategory}
                  onChange={(e) => setFoodCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Stall Landmark / Street Address *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Near Janpath Market Gate 2, Hazratganj, Lucknow"
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98390 XXXXX"
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Operating Hours</label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Daily Revenue Target (₹)</label>
                <input
                  type="number"
                  min={500}
                  value={dailyTargetInr}
                  onChange={(e) => setDailyTargetInr(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2.5 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Preferred Language</label>
              <div className="inline-flex rounded-lg border border-white/10 bg-[#0B1120] p-1">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    language === 'en' ? 'bg-[#A3E635] text-[#0B1120] font-semibold' : 'text-slate-300'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    language === 'hi' ? 'bg-[#A3E635] text-[#0B1120] font-semibold' : 'text-slate-300'
                  }`}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#A3E635] px-6 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-[#bef264] transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>Finish Setup & Open Dashboard</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
