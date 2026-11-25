import { useCallback, useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { daysAgoIso, exportRowsToCsv, formatInr, formatNumber, todayIso } from '../lib/format';
import type { ExpenseRecord, SaleRecord } from '../types';

export function ReportsPage() {
  const { language, vendor } = useApp();
  const [fromDate, setFromDate] = useState(daysAgoIso(28));
  const [toDate, setToDate] = useState(todayIso());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<{
    summary: {
      grossRevenue: number;
      cogs: number;
      grossProfit: number;
      operatingExpenses: number;
      wasteLoss: number;
      netProfit: number;
      netMarginPct: number;
      totalUnits: number;
      upiSharePct: number;
      upiRevenue: number;
      cashRevenue: number;
    };
    categoryBreakdown: Array<{ category: string; revenue: number; profit: number; units: number }>;
    sales: SaleRecord[];
    expenses: ExpenseRecord[];
  } | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getReports({ from: fromDate, to: toDate });
      setReport(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load financial report.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportSummary = () => {
    if (!report) return;
    exportRowsToCsv(
      `brainbazaar-pnl-${fromDate}-to-${toDate}.csv`,
      ['Metric', 'Amount / Value'],
      [
        ['Stall Name', vendor?.businessName || 'BrainBazaar Stall'],
        ['Period', `${fromDate} to ${toDate}`],
        ['Gross Revenue (INR)', report.summary.grossRevenue],
        ['Ingredient Cost / COGS (INR)', report.summary.cogs],
        ['Gross Profit (INR)', report.summary.grossProfit],
        ['Operating Expenses (INR)', report.summary.operatingExpenses],
        ['Logged Food Waste Loss (INR)', report.summary.wasteLoss],
        ['Net Profit After Waste (INR)', report.summary.netProfit],
        ['Net Margin (%)', `${report.summary.netMarginPct}%`],
        ['UPI Revenue (INR)', report.summary.upiRevenue],
        ['Cash Revenue (INR)', report.summary.cashRevenue],
        ['Total Units Sold', report.summary.totalUnits],
      ]
    );
  };

  return (
    <AppShell
      title={language === 'hi' ? 'बिज़नेस और मुनाफा रिपोर्ट्स' : 'Business & Financial Reports'}
      subtitle={
        language === 'hi'
          ? 'सकल आय, मंडी खर्च, बर्बादी नुकसान और शुद्ध मुनाफे का पूरा विवरण'
          : 'Period P&L statement, category margin breakdown, and downloadable CSV summaries'
      }
      actions={
        <button
          type="button"
          onClick={handleExportSummary}
          disabled={!report}
          className="inline-flex items-center gap-2 rounded-lg bg-[#A3E635] px-3.5 py-2 text-xs font-bold text-[#0B1120] hover:bg-[#bef264] whitespace-nowrap disabled:opacity-50"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export P&L CSV</span>
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/8 bg-[#111827] px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="text-slate-400">Report Period</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0B1120] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#A3E635] focus:outline-none"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0B1120] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#A3E635] focus:outline-none"
          />
        </div>
        {report && (
          <p className="text-xs font-mono text-slate-400 tabular-nums">
            {formatNumber(report.summary.totalUnits)} units · UPI {report.summary.upiSharePct}%
          </p>
        )}
      </div>

      {loading || !report ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl border border-white/8 bg-[#111827] animate-pulse" />
            ))}
          </div>
          <div className="h-72 rounded-xl border border-white/8 bg-[#111827] animate-pulse" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">Gross Revenue</p>
              <p className="mt-2 font-mono text-2xl font-bold text-white tabular-nums">
                {formatInr(report.summary.grossRevenue)}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">Operating Expenses</p>
              <p className="mt-2 font-mono text-2xl font-bold text-amber-400 tabular-nums">
                {formatInr(report.summary.operatingExpenses)}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">Food Waste Loss</p>
              <p className="mt-2 font-mono text-2xl font-bold text-rose-400 tabular-nums">
                {formatInr(report.summary.wasteLoss)}
              </p>
            </div>
            <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
              <p className="text-xs text-slate-400">Net Profit (After Waste)</p>
              <p
                className={`mt-2 font-mono text-2xl font-bold tabular-nums ${
                  report.summary.netProfit >= 0 ? 'text-[#A3E635]' : 'text-rose-400'
                }`}
              >
                {formatInr(report.summary.netProfit)}
              </p>
              <p className="mt-1 text-xs font-mono text-slate-400 tabular-nums">
                Net Margin: {report.summary.netMarginPct}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-xl border border-white/8 bg-[#111827] p-5">
              <h2 className="font-display text-base font-bold text-white mb-1">
                Revenue & Gross Profit by Food Category
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Compare top-earning stall categories in selected range
              </p>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.categoryBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="category" stroke="#94A3B8" fontSize={11} />
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
                    <Bar dataKey="profit" name="Gross Profit (₹)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-white/8 bg-[#111827] p-5">
              <h2 className="font-display text-base font-bold text-white mb-4">
                Statement Summary
              </h2>
              <div className="divide-y divide-white/8 text-sm">
                <div className="py-3 flex justify-between">
                  <span className="text-slate-400">Gross Sales Revenue</span>
                  <span className="font-mono tabular-nums text-white">
                    {formatInr(report.summary.grossRevenue)}
                  </span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-400">Estimated Ingredient Cost (COGS)</span>
                  <span className="font-mono tabular-nums text-slate-300">
                    -{formatInr(report.summary.cogs)}
                  </span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-400">Gross Contribution Profit</span>
                  <span className="font-mono tabular-nums text-emerald-400">
                    {formatInr(report.summary.grossProfit)}
                  </span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-400">Logged Operating Expenses</span>
                  <span className="font-mono tabular-nums text-amber-400">
                    -{formatInr(report.summary.operatingExpenses)}
                  </span>
                </div>
                <div className="py-3 flex justify-between">
                  <span className="text-slate-400">Logged Food Waste Cost</span>
                  <span className="font-mono tabular-nums text-rose-400">
                    -{formatInr(report.summary.wasteLoss)}
                  </span>
                </div>
                <div className="py-3 flex justify-between font-semibold">
                  <span className="text-white">Net Surplus (Revenue − Expenses − Waste)</span>
                  <span className="font-mono tabular-nums text-[#A3E635]">
                    {formatInr(report.summary.netProfit)}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/8 text-xs text-slate-400 flex items-center justify-between">
                <span>UPI Payments: {formatInr(report.summary.upiRevenue)}</span>
                <span>Cash Payments: {formatInr(report.summary.cashRevenue)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
