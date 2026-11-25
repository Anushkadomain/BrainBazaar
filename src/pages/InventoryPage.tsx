import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Edit3, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { formatInr, formatNumber, todayIso } from '../lib/format';
import type { Product, StockRecommendation, StockStatus } from '../types';

const EMPTY_FORM = {
  name: '',
  category: 'Chaat & Street Snacks',
  unit: 'plates',
  availableQuantity: 40,
  costPrice: 20,
  sellingPrice: 50,
  minStockThreshold: 20,
  expiryDate: todayIso(),
};

const STATUS_FILTERS: Array<'All' | StockStatus> = [
  'All',
  'In Stock',
  'Low Stock',
  'Out of Stock',
  'Overstocked',
];

const CATEGORIES = [
  'Chaat & Street Snacks',
  'Beverages & Chai',
  'Morning Breakfast & Chai',
  'Sweets & Desserts',
  'Kulfi & Cold Drinks',
  'Kebab & Rolls',
];

export function InventoryPage() {
  const { language } = useApp();
  const [items, setItems] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [summary, setSummary] = useState({
    totalSkus: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    overstocked: 0,
    inventoryValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | StockStatus>('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getInventory();
      setItems(res.items);
      setRecommendations(res.recommendations);
      setSummary(res.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
        const q = search.trim().toLowerCase();
        const matchesQuery =
          !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
        return matchesStatus && matchesQuery;
      }),
    [items, search, statusFilter]
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      unit: p.unit,
      availableQuantity: p.availableQuantity,
      costPrice: p.costPrice,
      sellingPrice: p.sellingPrice,
      minStockThreshold: p.minStockThreshold,
      expiryDate: p.expiryDate,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await api.updateProduct(editingId, form);
      } else {
        await api.createProduct(form);
      }
      setModalOpen(false);
      await loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteProduct(id);
      await loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete product.');
    }
  };

  const handleApplyRecommendation = async (rec: StockRecommendation) => {
    setSyncingId(rec.productId);
    try {
      await api.updateProduct(rec.productId, { availableQuantity: rec.predictedDemand });
      await loadInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update stock quantity.');
    } finally {
      setSyncingId(null);
    }
  };

  const statusTone = (status: StockStatus) => {
    switch (status) {
      case 'In Stock':
        return 'text-emerald-400';
      case 'Low Stock':
        return 'text-amber-400';
      case 'Out of Stock':
        return 'text-rose-400';
      case 'Overstocked':
        return 'text-sky-400';
    }
  };

  return (
    <AppShell
      title={language === 'hi' ? 'स्मार्ट इन्वेंटरी प्रबंधन' : 'Smart Inventory Management'}
      subtitle={
        language === 'hi'
          ? 'स्टॉक स्तर ट्रैक करें और आज की अनुमानित मांग के अनुसार तैयारी सुझाव देखें'
          : 'Manage SKUs, restock thresholds, expiry dates, and AI-driven batch prep targets'
      }
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[#A3E635] px-3.5 py-2 text-xs font-bold text-[#0B1120] hover:bg-[#bef264] transition-colors whitespace-nowrap"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Product</span>
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Active SKUs</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-white tabular-nums">
            {summary.totalSkus}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Low Stock</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-amber-400 tabular-nums">
            {summary.lowStock}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Out of Stock</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-rose-400 tabular-nums">
            {summary.outOfStock}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Overstocked</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-sky-400 tabular-nums">
            {summary.overstocked}
          </p>
        </div>
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-white/8 bg-[#111827] p-4">
          <p className="text-xs text-slate-400">Stock Cost Value</p>
          <p className="mt-1.5 font-mono text-xl font-bold text-[#A3E635] tabular-nums">
            {formatInr(summary.inventoryValue)}
          </p>
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="mb-6 rounded-xl border border-white/8 bg-[#111827] p-5">
          <h2 className="font-display text-base font-bold text-white mb-1">
            Evening Shift Prep Recommendations
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Align on-hand quantities with today’s demand forecast before peak hours
          </p>
          <div className="divide-y divide-white/8">
            {recommendations.map((rec) => (
              <div
                key={rec.productId}
                className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {rec.productName}{' '}
                    <span className="font-mono text-xs font-normal text-slate-400 tabular-nums">
                      ({rec.currentStock} → {rec.predictedDemand} {rec.unit})
                    </span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{rec.reason}</p>
                </div>
                <button
                  type="button"
                  disabled={syncingId === rec.productId}
                  onClick={() => handleApplyRecommendation(rec)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#A3E635]/35 bg-[#A3E635]/10 px-3 py-1.5 text-xs font-semibold text-[#A3E635] hover:bg-[#A3E635]/20 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {syncingId === rec.productId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  <span>Apply Target ({rec.predictedDemand})</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/8 bg-[#111827] p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or category..."
              className="w-full rounded-lg border border-white/10 bg-[#0B1120] pl-9 pr-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-[#0B1120] p-1">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-[#A3E635] text-[#0B1120] font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-40 rounded-lg bg-white/5 animate-pulse" />
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">No inventory products match this filter.</p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-3 rounded-lg bg-[#A3E635] px-4 py-2 text-xs font-bold text-[#0B1120]"
            >
              Add Your First SKU
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/8 text-xs text-slate-400">
                  <th className="py-2.5 pr-3 font-medium">Product</th>
                  <th className="py-2.5 px-3 font-medium">Status</th>
                  <th className="py-2.5 px-3 font-medium text-right">Stock</th>
                  <th className="py-2.5 px-3 font-medium text-right">Proj. Demand</th>
                  <th className="py-2.5 px-3 font-medium text-right">Cost / Sell</th>
                  <th className="py-2.5 px-3 font-medium text-right">Margin</th>
                  <th className="py-2.5 px-3 font-medium">Expiry</th>
                  <th className="py-2.5 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-white">{item.name}</p>
                      <p className="text-xs text-slate-400">{item.category}</p>
                    </td>
                    <td className={`py-3 px-3 text-xs font-semibold ${statusTone(item.status)}`}>
                      {item.status}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-white">
                      {formatNumber(item.availableQuantity)} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      {formatNumber(item.predictedDailyDemand)} {item.unit}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200 whitespace-nowrap">
                      {formatInr(item.costPrice)} / {formatInr(item.sellingPrice)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400">
                      {item.marginPct}%
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-400 whitespace-nowrap">
                      {item.expiryDate}
                    </td>
                    <td className="py-3 pl-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        aria-label={`Edit ${item.name}`}
                        className="p-1.5 rounded text-slate-400 hover:text-white"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        aria-label={`Delete ${item.name}`}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-400 ml-1"
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold text-white">
                {editingId ? 'Edit Product SKU' : 'Add New Menu Product'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Kulhad Masala Chai"
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="plates / cups"
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.availableQuantity}
                    onChange={(e) => setForm({ ...form, availableQuantity: Number(e.target.value) })}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Min Alert</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.minStockThreshold}
                    onChange={(e) => setForm({ ...form, minStockThreshold: Number(e.target.value) })}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Sell Price (₹)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={form.sellingPrice}
                    onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-3 py-2 text-sm font-mono text-white focus:border-[#A3E635] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#A3E635] px-5 py-2 text-xs font-bold text-[#0B1120] hover:bg-[#bef264] disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{editingId ? 'Save Changes' : 'Add Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
