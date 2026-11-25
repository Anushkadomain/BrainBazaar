import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { daysAgoIso, exportRowsToCsv, formatInr, formatNumber, todayIso } from '../lib/format';
import type { ExpenseRecord, Product, SaleRecord } from '../types';

const EXPENSE_CATEGORIES: ExpenseRecord['category'][] = [
  'Mandi Ingredients',
  'Fuel & Gas',
  'Packaging & Kulhad',
  'Staff & Helper',
  'Stall Utilities',
];

const HOUR_SLOTS = ['8–11 AM', '11 AM–2 PM', '2–5 PM', '5–8 PM', '8–10 PM'];

export function SalesPage() {
  const { language } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [totals, setTotals] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalUnits: 0,
    upiRevenue: 0,
    cashRevenue: 0,
  });

  const [fromDate, setFromDate] = useState(daysAgoIso(14));
  const [toDate, setToDate] = useState(todayIso());
  const [tab, setTab] = useState<'sales' | 'expenses'>('sales');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sale form
  const [saleProdId, setSaleProdId] = useState('');
  const [saleName, setSaleName] = useState('');
  const [saleQty, setSaleQty] = useState(10);
  const [salePrice, setSalePrice] = useState(20);
  const [saleMethod, setSaleMethod] = useState<'UPI' | 'Cash'>('UPI');
  const [saleSlot, setSaleSlot] = useState('5–8 PM');
  const [saleDate, setSaleDate] = useState(todayIso());
  const [savingSale, setSavingSale] = useState(false);

  // Expense form
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] = useState<ExpenseRecord['category']>('Mandi Ingredients');
  const [expAmount, setExpAmount] = useState(1200);
  const [expDate, setExpDate] = useState(todayIso());
  const [expNotes, setExpNotes] = useState('');
  const [savingExp, setSavingExp] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [inv, data] = await Promise.all([
        api.getInventory(),
        api.getSales({ from: fromDate, to: toDate }),
      ]);
      setProducts(inv.items);
      setSales(data.sales);
      setExpenses(data.expenses);
      setTotals(data.totals);
      if (!saleProdId && inv.items.length > 0) {
        setSaleProdId(inv.items[0].id);
        setSaleName(inv.items[0].name);
        setSalePrice(inv.items[0].sellingPrice);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales & expense records.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, saleProdId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleProductPick = (id: string) => {
    setSaleProdId(id);
    const p = products.find((item) => item.id === id);
    if (p) {
      setSaleName(p.name);
      setSalePrice(p.sellingPrice);
    }
  };

  const handleLogSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSale(true);
    setError('');
    try {
      await api.createSale({
        productId: saleProdId || null,
        productName: saleName || 'Walk-in Order',
        quantity: Number(saleQty),
        unitPrice: Number(salePrice),
        paymentMethod: saleMethod,
        hourSlot: saleSlot,
        saleDate,
      });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record sale.');
    } finally {
      setSavingSale(false);
    }
  };

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingExp(true);
    setError('');
    try {
      await api.createExpense({
        title: expTitle.trim(),
        category: expCategory,
        amount: Number(expAmount),
        expenseDate: expDate,
        notes: expNotes.trim(),
      });
      setExpTitle('');
      setExpNotes('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log expense.');
    } finally {
      setSavingExp(false);
    }
  };

  const upiPct = useMemo(
    () => (totals.totalRevenue > 0 ? Math.round((totals.upiRevenue / totals.totalRevenue) * 100) : 0),
    [totals]
  );

  const handleExport = () => {
    exportRowsToCsv(
      `brainbazaar-sales-${fromDate}-to-${toDate}.csv`,
      ['Date', 'Product', 'Category', 'Quantity', 'Unit Price (INR)', 'Revenue (INR)', 'Profit (INR)', 'Payment', 'Slot'],
      sales.map((s) => [
        s.saleDate,
        s.productName,
        s.category,
        s.quantity,
        s.unitPrice,
        s.totalRevenue,
        s.totalProfit,
        s.paymentMethod,
        s.hourSlot,
      ])
    );
  };

  return (
    <AppShell
      title={language === 'hi' ? 'बिक्री और खर्च खाता' : 'Sales & Expense Ledger'}
      subtitle={
        language === 'hi'
          ? 'UPI व नकद बिक्री और दैनिक मंडी खर्च दर्ज करें'
          : 'Record daily stall sales, mandi purchases, and calculate real-time net profit'
      }
      actions={
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/[0.08] whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export CSV</span>
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Date Range + Summary */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/8 bg-[#111827] px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <label className="text-slate-400">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0B1120] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#A3E635] focus:outline-none"
          />
          <label className="text-slate-400">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-white/10 bg-[#0B1120] px-2.5 py-1.5 font-mono text-xs text-white focus:border-[#A3E635] focus:outline-none"
          />
        </div>
        <p className="text-xs text-slate-400 font-mono tabular-nums">
          UPI Share: <strong className="text-[#A3E635]">{upiPct}%</strong> ({formatInr(totals.upiRevenue)}) · Cash:{' '}
          <strong className="text-white">{formatInr(totals.cashRevenue)}</strong>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Total Revenue</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-white tabular-nums">
            {formatInr(totals.totalRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Gross Profit</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-emerald-400 tabular-nums">
            {formatInr(totals.totalProfit)}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Operating Expenses</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-amber-400 tabular-nums">
            {formatInr(totals.totalExpenses)}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Net Cash Surplus</p>
          <p
            className={`mt-1.5 font-mono text-xl font-bold tabular-nums ${
              totals.netProfit >= 0 ? 'text-[#A3E635]' : 'text-rose-400'
            }`}
          >
            {formatInr(totals.netProfit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entry Form */}
        <div className="lg:col-span-4 rounded-xl border border-white/8 bg-[#111827] p-5">
          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0B1120] p-1 mb-5">
            <button
              type="button"
              onClick={() => setTab('sales')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                tab === 'sales' ? 'bg-[#A3E635] text-[#0B1120]' : 'text-slate-300 hover:text-white'
              }`}
            >
              Log Sale
            </button>
            <button
              type="button"
              onClick={() => setTab('expenses')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                tab === 'expenses' ? 'bg-[#A3E635] text-[#0B1120]' : 'text-slate-300 hover:text-white'
              }`}
            >
              Log Expense
            </button>
          </div>

          {tab === 'sales' ? (
            <form onSubmit={handleLogSale} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Product</label>
                <select
                  value={saleProdId}
                  onChange={(e) => handleProductPick(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                >
                  <option value="">Custom Sale Item</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatInr(p.sellingPrice)})
                    </option>
                  ))}
                </select>
              </div>
              {!saleProdId && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={saleName}
                    onChange={(e) => setSaleName(e.target.value)}
                    placeholder="e.g., Special Dahi Vada"
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={saleQty}
                    onChange={(e) => setSaleQty(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit Price (₹)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment</label>
                  <select
                    value={saleMethod}
                    onChange={(e) => setSaleMethod(e.target.value as 'UPI' | 'Cash')}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hour Slot</label>
                  <select
                    value={saleSlot}
                    onChange={(e) => setSaleSlot(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                  >
                    {HOUR_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingSale}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A3E635] px-4 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-[#bef264] disabled:opacity-60"
              >
                {savingSale ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>Record Sale ({formatInr(saleQty * salePrice)})</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Expense Title *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g., Dubagga Mandi Potatoes & Milk"
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseRecord['category'])}
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Optional supplier or batch note"
                  className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingExp}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A3E635] px-4 py-2.5 text-sm font-bold text-[#0B1120] hover:bg-[#bef264] disabled:opacity-60"
              >
                {savingExp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>Record Expense</span>
              </button>
            </form>
          )}
        </div>

        {/* Ledger Table */}
        <div className="lg:col-span-8 rounded-xl border border-white/8 bg-[#111827] p-5">
          <h2 className="font-display text-base font-bold text-white mb-4">
            {tab === 'sales' ? `Sales Ledger (${sales.length})` : `Expense Ledger (${expenses.length})`}
          </h2>
          {loading ? (
            <div className="h-48 rounded-lg bg-white/5 animate-pulse" />
          ) : tab === 'sales' ? (
            sales.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                No sales logged in this date range yet.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-[#111827]">
                    <tr className="border-b border-white/8 text-xs text-slate-400">
                      <th className="py-2.5 pr-3 font-medium">Date</th>
                      <th className="py-2.5 px-3 font-medium">Product</th>
                      <th className="py-2.5 px-3 font-medium text-right">Qty</th>
                      <th className="py-2.5 px-3 font-medium text-right">Revenue</th>
                      <th className="py-2.5 px-3 font-medium text-right">Profit</th>
                      <th className="py-2.5 px-3 font-medium">Mode</th>
                      <th className="py-2.5 pl-2 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/6">
                    {sales.slice(0, 60).map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                          {s.saleDate}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-medium text-white">{s.productName}</p>
                          <p className="text-xs text-slate-500">{s.hourSlot}</p>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">
                          {formatNumber(s.quantity)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-white">
                          {formatInr(s.totalRevenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-400">
                          {formatInr(s.totalProfit)}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-300">{s.paymentMethod}</td>
                        <td className="py-2.5 pl-2 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              await api.deleteSale(s.id);
                              loadData();
                            }}
                            aria-label="Delete sale"
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
            )
          ) : expenses.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">
              No expenses recorded in this date range.
            </p>
          ) : (
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-[#111827]">
                  <tr className="border-b border-white/8 text-xs text-slate-400">
                    <th className="py-2.5 pr-3 font-medium">Date</th>
                    <th className="py-2.5 px-3 font-medium">Expense</th>
                    <th className="py-2.5 px-3 font-medium">Category</th>
                    <th className="py-2.5 px-3 font-medium text-right">Amount</th>
                    <th className="py-2.5 pl-2 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/6">
                  {expenses.map((ex) => (
                    <tr key={ex.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-3 font-mono text-xs text-slate-300 whitespace-nowrap">
                        {ex.expenseDate}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-white">{ex.title}</p>
                        {ex.notes && <p className="text-xs text-slate-500">{ex.notes}</p>}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-slate-300">{ex.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-400">
                        {formatInr(ex.amount)}
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            await api.deleteExpense(ex.id);
                            loadData();
                          }}
                          aria-label="Delete expense"
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
      </div>
    </AppShell>
  );
}
