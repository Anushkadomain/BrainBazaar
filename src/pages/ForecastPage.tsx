import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatInr, formatNumber } from '../lib/format';
import type { ForecastRecord, Product } from '../types';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEATHERS = ['Clear & Pleasant', 'Cool Evening', 'Warm Afternoon', 'Cloudy', 'Rainy'];
const EVENTS = [
  'Normal Weekday',
  'Evening Market Rush',
  'Weekend Ganjing Promenade',
  'Lucknow Mahotsav / Festival',
  'Ekana Stadium Match Day',
  'College Exam Week',
];
const ZONES = ['Hazratganj', 'Aminabad', 'Chowk', 'Aliganj', 'Indira Nagar', 'Gomti Nagar'];
const CATEGORIES = [
  'Beverages & Chai',
  'Chaat & Street Snacks',
  'Morning Breakfast & Chai',
  'Sweets & Desserts',
  'Kulfi & Cold Drinks',
  'Kebab & Rolls',
];

export function ForecastPage() {
  const { vendor, language } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<ForecastRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState('');
  const [productName, setProductName] = useState('Kulhad Masala Chai');
  const [category, setCategory] = useState('Beverages & Chai');
  const [historicalDailyAvg, setHistoricalDailyAvg] = useState(140);
  const [sellingPrice, setSellingPrice] = useState(20);
  const [dayOfWeek, setDayOfWeek] = useState(
    new Date().toLocaleDateString('en-US', { weekday: 'long' })
  );
  const [weather, setWeather] = useState('Cool Evening');
  const [localEvent, setLocalEvent] = useState('Evening Market Rush');
  const [expectedFootfall, setExpectedFootfall] = useState(5200);
  const [zone, setZone] = useState(vendor?.zone || 'Hazratganj');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ forecast: ForecastRecord; dataPointsUsed: number } | null>(
    null
  );

  useEffect(() => {
    Promise.all([api.getInventory(), api.getForecastHistory(), api.getWeather()])
      .then(([inv, hist, w]) => {
        setProducts(inv.items);
        setHistory(hist.forecasts);
        setWeather(w.condition);
        if (inv.items.length > 0) {
          const first = inv.items[0];
          setProductId(first.id);
          setProductName(first.name);
          setCategory(first.category);
          setSellingPrice(first.sellingPrice);
          setHistoricalDailyAvg(first.predictedDailyDemand || 80);
        }
        if (hist.forecasts.length > 0) {
          setResult({
            forecast: hist.forecasts[0],
            dataPointsUsed: hist.forecasts[0].isBaseline ? 0 : 28,
          });
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load forecast data.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectProduct = (id: string) => {
    setProductId(id);
    const match = products.find((p) => p.id === id);
    if (match) {
      setProductName(match.name);
      setCategory(match.category);
      setSellingPrice(match.sellingPrice);
      setHistoricalDailyAvg(match.predictedDailyDemand || 80);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.createForecast({
        productId: productId || null,
        productName: productName.trim(),
        category,
        historicalDailyAvg: Number(historicalDailyAvg),
        sellingPrice: Number(sellingPrice),
        dayOfWeek,
        weather,
        localEvent,
        expectedFootfall: Number(expectedFootfall),
        zone,
      });
      setResult(res);
      setHistory((prev) => [res.forecast, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Forecast failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const active = result?.forecast;

  return (
    <AppShell
      title={language === 'hi' ? 'एआई मांग पूर्वानुमान' : 'AI Demand Forecasting'}
      subtitle={
        language === 'hi'
          ? 'पिछली बिक्री, मौसम, दिन और लखनऊ के स्थानीय आयोजनों से सटीक मांग की भविष्यवाणी करें'
          : 'Forecast daily unit demand, expected revenue, and optimal batch prep for your Lucknow stall'
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 rounded-xl border border-white/8 bg-[#111827] p-6 space-y-4"
        >
          <div>
            <h2 className="font-display text-base font-bold text-white">Forecast Parameters</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a menu SKU or custom item to simulate shift demand
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Menu Product</label>
            <select
              value={productId}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
            >
              <option value="">Custom Menu Item</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatInr(p.sellingPrice)} / {p.unit})
                </option>
              ))}
            </select>
          </div>

          {!productId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Baseline Daily Units
              </label>
              <input
                type="number"
                min={5}
                required
                value={historicalDailyAvg}
                onChange={(e) => setHistoricalDailyAvg(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                min={1}
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Day of Week</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Weather</label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              >
                {WEATHERS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Lucknow Zone</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
              >
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Expected Footfall
              </label>
              <input
                type="number"
                min={500}
                step={100}
                value={expectedFootfall}
                onChange={(e) => setExpectedFootfall(Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Local Market Event</label>
            <select
              value={localEvent}
              onChange={(e) => setLocalEvent(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
            >
              {EVENTS.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A3E635] px-4 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-[#bef264] transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />}
            <span>Generate Demand Forecast</span>
          </button>
        </form>

        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-white/8 bg-[#111827] p-6">
            {loading ? (
              <div className="h-52 rounded-lg bg-white/5 animate-pulse" />
            ) : active ? (
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/8 pb-4">
                  <div>
                    <p className="text-xs text-[#A3E635] font-medium">
                      {active.zone} · {active.dayOfWeek} · {active.weather}
                    </p>
                    <h2 className="mt-1 font-display text-xl font-bold text-white">
                      {active.productName}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    Confidence {active.confidencePct}% · {result?.dataPointsUsed || 0} sales logs
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-white/8 bg-[#0B1120] p-4">
                    <p className="text-xs text-slate-400">Predicted Demand</p>
                    <p className="mt-1.5 font-mono text-2xl font-bold text-[#A3E635] tabular-nums">
                      {formatNumber(active.predictedUnits)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">units expected</p>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-[#0B1120] p-4">
                    <p className="text-xs text-slate-400">Optimal Stock Prep</p>
                    <p className="mt-1.5 font-mono text-2xl font-bold text-white tabular-nums">
                      {formatNumber(active.optimalPrepUnits)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">incl. 4% safety buffer</p>
                  </div>
                  <div className="rounded-lg border border-white/8 bg-[#0B1120] p-4">
                    <p className="text-xs text-slate-400">Projected Revenue</p>
                    <p className="mt-1.5 font-mono text-2xl font-bold text-emerald-400 tabular-nums">
                      {formatInr(active.expectedRevenue)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">at {formatInr(active.sellingPrice)} / unit</p>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-medium text-slate-400 mb-2">Demand Drivers</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                    {active.factors.length > 0 ? (
                      active.factors.map((f, idx) => (
                        <span key={idx} className="text-slate-300">
                          {f.label}:{' '}
                          <strong
                            className={`font-mono ${
                              f.impact.startsWith('-') ? 'text-amber-400' : 'text-[#A3E635]'
                            }`}
                          >
                            {f.impact}
                          </strong>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400">Baseline weekday demand curve</span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/8">
                  <p className="text-xs font-medium text-slate-400">Prep Recommendation</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-200">{active.advisory}</p>
                </div>
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-slate-400">
                Choose parameters on the left to run your first BrainBazaar demand forecast.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
            <h3 className="font-display text-base font-bold text-white mb-4">
              Recent Forecast Runs ({history.length})
            </h3>
            {history.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No forecast history yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/8 text-xs text-slate-400">
                      <th className="py-2 pr-3 font-medium">Product</th>
                      <th className="py-2 px-3 font-medium">Scenario</th>
                      <th className="py-2 px-3 font-medium text-right">Predicted</th>
                      <th className="py-2 px-3 font-medium text-right">Prep Target</th>
                      <th className="py-2 pl-3 font-medium text-right">Proj. Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {history.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setResult({ forecast: item, dataPointsUsed: item.isBaseline ? 0 : 28 })}
                        className="cursor-pointer hover:bg-white/[0.03]"
                      >
                        <td className="py-2.5 pr-3 font-medium text-white">{item.productName}</td>
                        <td className="py-2.5 px-3 text-xs text-slate-400">
                          {item.zone} · {item.dayOfWeek} · {item.weather}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#A3E635]">
                          {formatNumber(item.predictedUnits)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">
                          {formatNumber(item.optimalPrepUnits)}
                        </td>
                        <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-white">
                          {formatInr(item.expectedRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
