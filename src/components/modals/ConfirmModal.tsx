import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200 ring-1 ring-white/10">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              variant === 'danger'
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-rose-500/20'
                : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-amber-500/20'
            }`}
          >
            {variant === 'danger' ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="text-base font-bold text-zinc-100 leading-snug">{title}</h3>
            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">{message}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 rounded-xl transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 ${
              variant === 'danger'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
