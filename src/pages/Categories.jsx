import React, { useState } from 'react';
import { useCategories } from '../contexts/CategoryContext';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  Tag, Plus, Pencil, Trash2, Check, X, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';

const CategoryBadge = ({ type }) =>
  type === 'income' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
      <ArrowUpRight className="h-3 w-3" /> Income
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-500 dark:bg-red-950/30 dark:text-red-400">
      <ArrowDownRight className="h-3 w-3" /> Expense
    </span>
  );

const CategoryRow = ({ name, type, onRename, onDelete, canEdit }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = async () => {
    if (value.trim() === name) { setEditing(false); return; }
    setBusy(true);
    const res = await onRename(type, name, value);
    setBusy(false);
    if (res.success) { setEditing(false); setErr(''); }
    else setErr(res.error);
  };

  const handleDelete = async () => {
    setBusy(true);
    await onDelete(type, name);
    setBusy(false);
    setConfirmOpen(false);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete Category"
        message={`Are you sure you want to delete "${name}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Tag className={`h-4 w-4 ${type === 'income' ? 'text-emerald-500' : 'text-red-400'}`} />
      </div>

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-1">
            <input
              autoFocus
              value={value}
              onChange={e => { setValue(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setEditing(false); setValue(name); } }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            {err && <p className="text-[11px] text-red-500">{err}</p>}
          </div>
        ) : (
          <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{name}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={busy}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => { setEditing(false); setValue(name); setErr(''); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : canEdit ? (
          <>
            <button
              onClick={() => setEditing(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800 dark:hover:text-primary-light"
              title="Rename"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 disabled:opacity-50"
              title="Delete"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </button>
          </>
        ) : null}
      </div>
    </div>
    </>
  );
};

const AddCategoryForm = ({ type, onAdd }) => {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleAdd = async () => {
    setBusy(true);
    const res = await onAdd(type, value);
    setBusy(false);
    if (res.success) { setValue(''); setErr(''); }
    else setErr(res.error);
  };

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => { setValue(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder={`New ${type} category name…`}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          onClick={handleAdd}
          disabled={busy || !value.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark transition disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Add
        </button>
      </div>
      {err && <p className="mt-1.5 text-xs text-red-500">{err}</p>}
    </div>
  );
};

const Categories = () => {
  const { incomeCategories, expenseCategories, loading, addCategory, renameCategory, deleteCategory } = useCategories();
  const [activeTab, setActiveTab] = useState('income');

  const tabs = [
    { key: 'income', label: 'Income Categories', icon: ArrowUpRight, color: 'emerald' },
    { key: 'expense', label: 'Expense Categories', icon: ArrowDownRight, color: 'red' },
  ];

  const categories = activeTab === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="min-h-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">Categories</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Customise income and expense categories used across the app
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 rounded-full bg-slate-100 p-1 dark:bg-slate-800 self-start md:self-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? tab.key === 'income'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-red-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex gap-4">
        <div className={`flex-1 rounded-2xl border p-5 ${
          activeTab === 'income'
            ? 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-white dark:border-emerald-900/30 dark:from-emerald-950/20 dark:to-slate-900'
            : 'border-red-100 bg-gradient-to-br from-red-50 to-white dark:border-red-900/30 dark:from-red-950/20 dark:to-slate-900'
        }`}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {activeTab === 'income' ? 'Income' : 'Expense'} Categories
          </p>
          <p className={`mt-1 text-3xl font-bold ${activeTab === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {categories.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Total defined</p>
        </div>
        <div className="flex-1 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Categories
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-700 dark:text-slate-200">
            {incomeCategories.length + expenseCategories.length}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Income + Expense</p>
        </div>
      </div>

      {/* Category list */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 sm:p-6 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mb-4 flex items-center gap-2">
          <CategoryBadge type={activeTab} />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {activeTab === 'income' ? 'Income' : 'Expense'} Categories
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center">
            <Tag className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" />
            <p className="text-sm text-slate-400">No categories yet. Add one below.</p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map(cat => (
              <CategoryRow
                key={cat}
                name={cat}
                type={activeTab}
                onRename={renameCategory}
                onDelete={deleteCategory}
                canEdit={true}
              />
            ))}
          </div>
        )}

        <AddCategoryForm type={activeTab} onAdd={addCategory} />
      </div>
    </div>
  );
};

export default Categories;