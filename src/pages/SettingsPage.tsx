import React, { useState } from 'react';
import { Check, Loader2, RotateCcw } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';

export function SettingsPage() {
  const { user, vendor, language, setLanguage, updateVendorState } = useApp();

  const [lowStockAlertPct, setLowStockAlertPct] = useState(vendor?.lowStockAlertPct || 25);
  const [wasteAlertInr, setWasteAlertInr] = useState(vendor?.wasteAlertInr || 450);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsMsg, setPrefsMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPass, setSavingPass] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [error, setError] = useState('');

  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  const handleSavePrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    setPrefsMsg('');
    setError('');
    try {
      const res = await api.updateSettings({
        lowStockAlertPct: Number(lowStockAlertPct),
        wasteAlertInr: Number(wasteAlertInr),
        language,
      });
      updateVendorState(res.vendor);
      setPrefsMsg('Alert preferences saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPass(true);
    setPassMsg('');
    setError('');
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPassMsg('Password updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSavingPass(false);
    }
  };

  const handleResetDemo = async () => {
    setResetting(true);
    setResetMsg('');
    setError('');
    try {
      const res = await api.resetDemoData();
      updateVendorState(res.vendor);
      setResetMsg('28-day Lucknow Chaat & Chai Corner demo dataset restored cleanly.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo reset failed.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppShell
      title={language === 'hi' ? 'सेटिंग्स' : 'Workspace Settings'}
      subtitle={
        language === 'hi'
          ? 'भाषा, अलर्ट सीमा और खाता सुरक्षा प्रबंधित करें'
          : 'Configure language, alert thresholds, security, and demo data reset'
      }
    >
      <div className="max-w-3xl space-y-6">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSavePrefs}
          className="rounded-xl border border-white/8 bg-[#111827] p-6 space-y-5"
        >
          <div>
            <h2 className="font-display text-base font-bold text-white">
              Language & Operational Alerts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize BrainBazaar thresholds for low-stock warnings and daily waste alerts
            </p>
          </div>

          {prefsMsg && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              {prefsMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">Interface Language</label>
            <div className="inline-flex rounded-lg border border-white/10 bg-[#0B1120] p-1">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md ${
                  language === 'en' ? 'bg-[#A3E635] text-[#0B1120] font-semibold' : 'text-slate-300'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-4 py-1.5 text-xs font-medium rounded-md ${
                  language === 'hi' ? 'bg-[#A3E635] text-[#0B1120] font-semibold' : 'text-slate-300'
                }`}
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Low Stock Warning Buffer (%)
              </label>
              <input
                type="number"
                min={5}
                max={80}
                value={lowStockAlertPct}
                onChange={(e) => setLowStockAlertPct(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Daily Waste Alert Threshold (₹)
              </label>
              <input
                type="number"
                min={50}
                value={wasteAlertInr}
                onChange={(e) => setWasteAlertInr(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPrefs}
              className="inline-flex items-center gap-2 rounded-lg bg-[#A3E635] px-5 py-2 text-xs font-bold text-[#0B1120] hover:bg-[#bef264] disabled:opacity-60"
            >
              {savingPrefs ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span>Save Preferences</span>
            </button>
          </div>
        </form>

        <form
          onSubmit={handlePasswordChange}
          className="rounded-xl border border-white/8 bg-[#111827] p-6 space-y-4"
        >
          <div>
            <h2 className="font-display text-base font-bold text-white">Change Account Password</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Update login credentials for {user?.email}
            </p>
          </div>

          {passMsg && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              {passMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                New Password (min 6 chars)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3.5 py-2.5 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPass}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-5 py-2 text-xs font-semibold text-white hover:bg-white/[0.08] disabled:opacity-60"
            >
              {savingPass && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Update Password</span>
            </button>
          </div>
        </form>

        {user?.isDemo && (
          <div className="rounded-xl border border-white/8 bg-[#111827] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-white">Reset Demo Dataset</h2>
              <p className="text-xs text-slate-400 mt-1">
                Restore the original 28-day Lucknow Chaat & Chai Corner records for fresh testing.
              </p>
              {resetMsg && <p className="mt-2 text-xs text-emerald-400">{resetMsg}</p>}
            </div>
            <button
              type="button"
              onClick={handleResetDemo}
              disabled={resetting}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-400/35 bg-amber-400/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/20 whitespace-nowrap disabled:opacity-60"
            >
              {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              <span>Reset Demo Data</span>
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
