import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Cloud, CloudRain, Loader2, RefreshCw, Sparkles, Sun } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatInr, formatNumber } from '../lib/format';
import { tDict } from '../lib/i18n';
import type { DashboardPayload } from '../types';

export function DashboardPage() {
  const { language } = useApp();
  const dict = tDict(language);

  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await api.getDashboard();
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleGenerateAi = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.generateAiInsights();
      setData((prev) =>
        prev ? { ...prev, insights: res.insights, lastAiUpdatedAt: res.updatedAt } : prev
      );
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Failed to generate Gemini insights.');
    } finally {
      setAiLoading(false);
    }
  };

  const renderWeatherIcon = (condition: string) => {
    if (condition === 'Rainy') return <CloudRain className="h-5 w-5 text-sky-400 shrink-0" />;
    if (condition === 'Cloudy') return <Cloud className="h-5 w-5 text-slate-300 shrink-0" />;
    return <Sun className="h-5 w-5 text-[#A3E635] shrink-0" />;
  };

  return (
    <AppShell
      title={dict.dashboard.title}
      subtitle={dict.dashboard.subtitle}
      actions={
        <button
          type="button"
          onClick={loadDashboard}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/[0.08] transition-colors whitespace-nowrap"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300 flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            type="button"
            onClick={loadDashboard}
            className="rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-28 rounded-xl border border-white/8 bg-[#111827] animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-72 rounded-xl border border-white/8 bg-[#111827] animate-pulse" />
            <div className="h-72 rounded-xl border border-white/8 bg-[#111827] animate-pulse" />
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Weather & Shift Signal */}
          <div className="rounded-xl border border-white/8 bg-[#111827] px-5 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {renderWeatherIcon(data.weather.condition)}
              <div>
                <p className="text-sm font-semibold text-white">
                  {data.weather.city} · {data.weather.condition}{' '}
                  <span className="font-mono text-[#A3E635] tabular-nums">{data.weather.tempC}°C</span>
                  <span className="text-slate-400 font-normal"> · {data.weather.humidityPct}% humidity</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{data.weather.demandSignal}</p>
              </div>
            </div>
            <Link
              to="/forecast"
              className="rounded-lg bg-[#A3E635] px-3.5 py-2 text-xs font-bold text-[#0B1120] hover:bg-[#bef264] transition-colors whitespace-nowrap"
            >
              Run Demand Forecast
            </Link>
          </div>

          {/* 6 KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">{dict.dashboard.todayRevenue}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                {formatInr(data.kpis.todayRevenue)}
              </p>
              <p className="mt-1.5 text-xs text-slate-400 font-mono tabular-nums">
                <span className={data.kpis.todayRevenueDeltaPct >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {data.kpis.todayRevenueDeltaPct >= 0 ? '+' : ''}
                  {data.kpis.todayRevenueDeltaPct}%
                </span>{' '}
                vs yesterday
              </p>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">{dict.dashboard.totalSales}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                {formatNumber(data.kpis.totalUnitsSold)}
              </p>
              <p className="mt-1.5 text-xs text-slate-400">Units served across all SKUs</p>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">{dict.dashboard.predictedDemand}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-[#A3E635] tabular-nums">
                {formatNumber(data.kpis.predictedDemandToday)} units
              </p>
              <p className="mt-1.5 text-xs text-slate-400">Projected across {data.kpis.totalSkus} active SKUs</p>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">{dict.dashboard.inventoryStatus}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                {data.kpis.lowStockCount > 0 ? (
                  <span className="text-amber-400">{data.kpis.lowStockCount} Attention</span>
                ) : (
                  <span className="text-emerald-400">Healthy</span>
                )}
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                {data.kpis.lowStockCount} low or out-of-stock of {data.kpis.totalSkus} items
              </p>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">{dict.dashboard.wasteReduction}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                {formatInr(data.kpis.wasteLoss7d)}
              </p>
              <p className="mt-1.5 text-xs text-slate-400 font-mono tabular-nums">
                <span className={data.kpis.wasteReductionPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {data.kpis.wasteReductionPct >= 0
                    ? `${data.kpis.wasteReductionPct}% lower`
                    : `${Math.abs(data.kpis.wasteReductionPct)}% higher`}
                </span>{' '}
                vs prior 7 days
              </p>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">{dict.dashboard.customerFootfall}</p>
              <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                {formatNumber(data.kpis.zoneDailyFootfall)}
              </p>
              <p className="mt-1.5 text-xs text-slate-400">{data.kpis.zoneName}, Lucknow benchmark</p>
            </div>
          </div>

          {/* Primary Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <h2 className="font-display text-base font-bold text-white mb-1">
                {dict.dashboard.weeklySales}
              </h2>
              <p className="text-xs text-slate-400 mb-4">Daily recorded revenue & gross profit (₹)</p>
              <div className="h-68 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.weeklySales}>
                    <defs>
                      <linearGradient id="bbRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A3E635" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#A3E635" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue (₹)"
                      stroke="#A3E635"
                      fill="url(#bbRevGrad)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      name="Gross Profit (₹)"
                      stroke="#38BDF8"
                      fill="transparent"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <h2 className="font-display text-base font-bold text-white mb-1">
                {dict.dashboard.monthlyRevenue}
              </h2>
              <p className="text-xs text-slate-400 mb-4">4-week sales inflow vs mandi & stall costs (₹)</p>
              <div className="h-68 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyRevenueVsExpenses}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="week" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="revenue" name="Revenue (₹)" fill="#A3E635" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses (₹)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Secondary Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <h2 className="font-display text-base font-bold text-white mb-1">
                {dict.dashboard.productDemand}
              </h2>
              <p className="text-xs text-slate-400 mb-4">On-hand units vs today’s demand target by SKU</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.stockVsDemand} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                    <YAxis type="category" dataKey="name" stroke="#CBD5E1" fontSize={11} width={110} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="stock" name="Current Stock" fill="#38BDF8" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="demand" name="Predicted Demand" fill="#A3E635" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <h2 className="font-display text-base font-bold text-white mb-1">
                {dict.dashboard.footfallTrend}
              </h2>
              <p className="text-xs text-slate-400 mb-4">Lucknow shift footfall index vs average stall units</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.peakHours}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="slot" stroke="#94A3B8" fontSize={11} />
                    <YAxis yAxisId="left" stroke="#94A3B8" fontSize={11} />
                    <YAxis yAxisId="right" orientation="right" stroke="#A3E635" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="footfall"
                      name="Zone Footfall"
                      stroke="#38BDF8"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      name="Avg Units Sold"
                      stroke="#A3E635"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Best Products + Gemini AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-xl border border-white/8 bg-[#111827] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-bold text-white">
                  {dict.dashboard.bestProducts}
                </h2>
                <Link to="/sales" className="text-xs font-medium text-[#A3E635] hover:underline">
                  View Ledger
                </Link>
              </div>
              {data.bestProducts.length === 0 ? (
                <p className="py-10 text-center text-sm text-slate-400">
                  Log your first sale to see top-performing items here.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/8 text-xs text-slate-400">
                        <th className="py-2.5 pr-3 font-medium">Product</th>
                        <th className="py-2.5 px-3 font-medium text-right">Units</th>
                        <th className="py-2.5 px-3 font-medium text-right">Revenue</th>
                        <th className="py-2.5 px-3 font-medium text-right">Profit</th>
                        <th className="py-2.5 pl-3 font-medium text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/6">
                      {data.bestProducts.map((p) => (
                        <tr key={p.name} className="hover:bg-white/[0.02]">
                          <td className="py-2.5 pr-3">
                            <p className="font-medium text-white">{p.name}</p>
                            <p className="text-xs text-slate-400">{p.category}</p>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">
                            {formatNumber(p.unitsSold)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-white">
                            {formatInr(p.revenue)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-400">
                            {formatInr(p.profit)}
                          </td>
                          <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-slate-300">
                            {p.marginPct}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-xl border border-white/8 bg-[#111827] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-display text-base font-bold text-white">
                      {dict.dashboard.aiInsights}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {data.lastAiUpdatedAt
                        ? `Updated ${new Date(data.lastAiUpdatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}`
                        : 'Operational baseline · Click for live Gemini analysis'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#A3E635] px-3 py-1.5 text-xs font-bold text-[#0B1120] hover:bg-[#bef264] transition-colors whitespace-nowrap disabled:opacity-60"
                  >
                    {aiLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>{dict.dashboard.refreshAi}</span>
                  </button>
                </div>

                {aiError && (
                  <div
                    role="alert"
                    className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
                  >
                    {aiError}
                  </div>
                )}

                <div className="divide-y divide-white/8">
                  {data.insights.map((ins, i) => (
                    <div key={`${ins.title}-${i}`} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                        <span className="font-medium text-[#A3E635]">{ins.category}</span>
                        <span className="font-mono tabular-nums text-slate-300">{ins.impact}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-white">{ins.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-300">{ins.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
