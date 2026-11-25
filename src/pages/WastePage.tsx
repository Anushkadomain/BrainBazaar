import React, { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatInr, formatNumber, todayIso } from '../lib/format';
import type { Product, WasteRecord } from '../types';

export function WastePage() {
  const { language } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [summary, setSummary] = useState({
    totalLoss: 0,
    totalUnitsWasted: 0,
    topWasteShift: 'Night',
    potentialMonthlySavings: 0,
  });
  const [dailyTrend, setDailyTrend] = useState<Array<{ date: string; loss: number; units: number }>>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [productId, setProductId] = useState('');
  const [customName, setCustomName] = useState('');
  const [quantityWasted, setQuantityWasted] = useState(5);
  const [shift, setShift] = useState<WasteRecord['shift']>('Night');
  const [wasteDate, setWasteDate] = useState(todayIso());
  const [customLoss, setCustomLoss] = useState('');
  const [reason, setReason] = useState('Unsold late-night batch after 9:30 PM drop-off');
  const [submitting, setSubmitting] = useState(false);

  const loadWaste = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [inv, w] = await Promise.all([api.getInventory(), api.getWaste()]);
      setProducts(inv.items);
      setRecords(w.records);
      setSummary(w.summary);
      setDailyTrend(w.dailyTrend);
      setRecommendations(w.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load waste analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWaste();
  }, [loadWaste]);

  const selectedProduct = products.find((p) => p.id === productId);
  const autoLoss = selectedProduct ? quantityWasted * selectedProduct.costPrice : quantityWasted * 18;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.createWaste({
        productId: productId || null,
        productName: selectedProduct?.name || customName.trim(),
        quantityWasted: Number(quantityWasted),
        estimatedLoss: customLoss ? Number(customLoss) : autoLoss,
        shift,
        reason: reason.trim(),
        wasteDate,
      });
      setCustomLoss('');
      await loadWaste();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log waste record.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell
      title={language === 'hi' ? 'खाने की बर्बादी ट्रैकर' : 'Food Waste Tracker'}
      subtitle={
        language === 'hi'
          ? 'बिना बिके बैच का नुकसान दर्ज करें और शिफ्ट-वार बचत सुझाव पाएं'
          : 'Log unsold items by shift, track cost loss, and trim perishable over-preparation'
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Logged Waste Loss</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-rose-400 tabular-nums">
            {formatInr(summary.totalLoss)}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Units Wasted</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-white tabular-nums">
            {formatNumber(summary.totalUnitsWasted)}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Highest Loss Shift</p>
          <p className="mt-1.5 font-display text-xl font-bold text-amber-400">
            {summary.topWasteShift}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Est. Savings Opportunity</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-[#A3E635] tabular-nums">
            {formatInr(summary.potentialMonthlySavings)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 rounded-xl border border-white/8 bg-[#111827] p-5 space-y-4"
        >
          <div>
            <h2 className="font-display text-base font-bold text-white">Log Unsold / Wasted Batch</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cost loss auto-calculates from your inventory cost price
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Product</label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const found = products.find((p) => p.id === e.target.value);
                if (found) setCustomName(found.name);
              }}
              className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
            >
              <option value="">Custom item</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Cost: {formatInr(p.costPrice)} / {p.unit})
                </option>
              ))}
            </select>
          </div>

          {!productId && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Custom Item Name *
              </label>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., Mint Chutney Batch"
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantity Wasted *
              </label>
              <input
                type="number"
                required
                min={1}
                value={quantityWasted}
                onChange={(e) => setQuantityWasted(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Shift</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as WasteRecord['shift'])}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              >
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Date *</label>
              <input
                type="date"
                required
                value={wasteDate}
                onChange={(e) => setWasteDate(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Est. Loss (₹) {selectedProduct ? `(Auto: ${formatInr(autoLoss)})` : ''}
              </label>
              <input
                type="number"
                min={0}
                value={customLoss}
                onChange={(e) => setCustomLoss(e.target.value)}
                placeholder={String(Math.round(autoLoss))}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Reason *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A3E635] px-4 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-[#bef264] disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>Log Waste Record</span>
          </button>
        </form>

        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
            <h2 className="font-display text-base font-bold text-white mb-1">
              Daily Waste Financial Loss (₹)
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Cost value of unsold batches recorded over time
            </p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="loss" name="Financial Loss (₹)" fill="#FB7185" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
            <h3 className="font-display text-sm font-bold text-white mb-3">
              Shift Batch-Sizing Recommendations
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="font-mono text-[#A3E635]">0{i + 1}.</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
        <h2 className="font-display text-base font-bold text-white mb-4">
          Waste Ledger ({records.length})
        </h2>
        {loading ? (
          <div className="h-32 rounded-lg bg-white/5 animate-pulse" />
        ) : records.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">
            No food waste logged yet. Great job keeping batches lean.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-xs text-slate-400">
                  <th className="py-2.5 pr-3 font-medium">Date</th>
                  <th className="py-2.5 px-3 font-medium">Product</th>
                  <th className="py-2.5 px-3 font-medium">Shift</th>
                  <th className="py-2.5 px-3 font-medium text-right">Wasted</th>
                  <th className="py-2.5 px-3 font-medium text-right">Est. Loss</th>
                  <th className="py-2.5 px-3 font-medium">Reason</th>
                  <th className="py-2.5 pl-2 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                      {rec.wasteDate}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white">{rec.productName}</td>
                    <td className="py-2.5 px-3 text-xs text-slate-300">{rec.shift}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-200 tabular-nums">
                      {rec.quantityWasted} {rec.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-400 tabular-nums">
                      {formatInr(rec.estimatedLoss)}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-slate-400 max-w-xs truncate">
                      {rec.reason}
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          await api.deleteWaste(rec.id);
                          loadWaste();
                        }}
                        aria-label="Delete waste record"
                        className="p-1.5 rounded text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
