import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

const ZONES = ['Hazratganj', 'Aminabad', 'Chowk', 'Aliganj', 'Indira Nagar', 'Gomti Nagar'];
const CATEGORIES = [
  'Chaat & Street Snacks',
  'Beverages & Chai',
  'Sweets & Desserts',
  'Morning Breakfast & Chai',
  'Kebab & Rolls',
  'Kulfi & Cold Drinks',
];

export function ProfilePage() {
  const { vendor, user, updateVendorState, language } = useApp();
  const [businessName, setBusinessName] = useState(vendor?.businessName || '');
  const [ownerName, setOwnerName] = useState(vendor?.ownerName || '');
  const [phone, setPhone] = useState(vendor?.phone || '');
  const [foodCategory, setFoodCategory] = useState(vendor?.foodCategory || CATEGORIES[0]);
  const [zone, setZone] = useState(vendor?.zone || ZONES[0]);
  const [address, setAddress] = useState(vendor?.address || '');
  const [openingHours, setOpeningHours] = useState(vendor?.openingHours || '');
  const [dailyTargetInr, setDailyTargetInr] = useState(vendor?.dailyTargetInr || 10000);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    setError('');
    try {
      const res = await api.updateProfile({
        businessName,
        ownerName,
        phone,
        foodCategory,
        zone,
        address,
        openingHours,
        dailyTargetInr: Number(dailyTargetInr),
      });
      updateVendorState(res.vendor);
      setSavedMsg('Vendor profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title={language === 'hi' ? 'वेंडर प्रोफ़ाइल' : 'Vendor Profile'}
      subtitle={
        language === 'hi'
          ? 'अपने स्टॉल का नाम, लखनऊ ज़ोन और संचालन समय अपडेट करें'
          : 'Manage your stall identity, Lucknow locality, and daily revenue goal'
      }
    >
      <div className="max-w-3xl rounded-xl border border-white/8 bg-[#111827] p-6">
        <div className="pb-5 border-b border-white/8 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-white">{vendor?.businessName}</h2>
            <p className="text-xs text-slate-400">Account Email: {user?.email}</p>
          </div>
          <span className="font-mono text-xs text-slate-400">
            Coordinates: {vendor?.lat.toFixed(4)}, {vendor?.lng.toFixed(4)}
          </span>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            {error}
          </div>
        )}
        {savedMsg && (
          <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            {savedMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Business Name *</label>
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
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Food Category</label>
              <select
                value={foodCategory}
                onChange={(e) => setFoodCategory(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
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
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
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
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Street Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Opening Hours</label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Daily Target (₹)
              </label>
              <input
                type="number"
                min={500}
                value={dailyTargetInr}
                onChange={(e) => setDailyTargetInr(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#A3E635] px-5 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-[#bef264] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
