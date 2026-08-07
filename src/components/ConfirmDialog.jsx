import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * Themed confirmation dialog — drop-in replacement for window.confirm().
 *
 * Props:
 *  isOpen      {boolean}
 *  title       {string}   — dialog heading
 *  message     {string}   — body text
 *  confirmLabel{string}   — confirm button text (default "Delete")
 *  cancelLabel {string}   — cancel button text (default "Cancel")
 *  variant     {string}   — "danger" (red) | "primary" (blue, default)
 *  onConfirm   {fn}
 *  onCancel    {fn}
 */
const ConfirmDialog = ({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onCancel?.(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog card */}
      <div className="relative z-10 w-full max-w-sm transform rounded-2xl border border-slate-100 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${
            isDanger
              ? 'bg-red-50 dark:bg-red-950/30'
              : 'bg-primary/10 dark:bg-primary/20'
          }`}>
            {isDanger
              ? <Trash2 className="h-6 w-6 text-red-500" />
              : <AlertTriangle className="h-6 w-6 text-primary" />
            }
          </div>

          {/* Title */}
          <h3 className="mt-4 text-center text-base font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h3>

          {/* Message */}
          {message && (
            <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-all dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
                isDanger
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-red-900/30'
                  : 'bg-primary hover:bg-primary-dark shadow-primary/20'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;