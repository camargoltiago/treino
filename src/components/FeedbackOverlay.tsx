import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Trash2, HelpCircle } from 'lucide-react';
import { feedback, ToastItem, ConfirmDialogOptions } from '../services/feedback';

export const FeedbackOverlay: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<(ConfirmDialogOptions & { resolve: (val: boolean) => void }) | null>(null);

  useEffect(() => {
    const unsubToasts = feedback.subscribeToasts(setToasts);
    const unsubConfirm = feedback.subscribeConfirm(setConfirmDialog);
    return () => {
      unsubToasts();
      unsubConfirm();
    };
  }, []);

  return (
    <>
      {/* ================= CONTAINER DE TOASTS FLUTUANTES ================= */}
      <div className="fixed top-14 left-0 right-0 z-50 pointer-events-none flex flex-col items-center px-4 space-y-2 select-none">
        {toasts.map(t => {
          let icon = <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
          let borderClass = 'border-cyan-500/30';
          let glowClass = 'shadow-lg';

          if (t.type === 'success') {
            icon = <CheckCircle2 className="w-5 h-5 text-mint-400 shrink-0" />;
            borderClass = 'border-mint-500/40 shadow-mint-glow-sm';
          } else if (t.type === 'error') {
            icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
            borderClass = 'border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
          } else if (t.type === 'warning') {
            icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
            borderClass = 'border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
          }

          return (
            <div
              key={t.id}
              onClick={() => feedback.dismissToast(t.id)}
              className={`pointer-events-auto max-w-sm w-full bg-dark-card/95 backdrop-blur-xl border ${borderClass} rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold transition-all transform animate-in slide-in-from-top-3 fade-in duration-200 cursor-pointer active:scale-95`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {icon}
                <span className="text-white leading-snug">{t.message}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  feedback.dismissToast(t.id);
                }}
                className="p-1 rounded-lg hover:bg-dark-surface text-slate-400 hover:text-white transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* ================= MODAL DE CONFIRMAÇÃO ESTILIZADO ================= */}
      {confirmDialog && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-dark-card border border-dark-borderLight rounded-3xl max-w-sm w-full p-6 flex flex-col items-center text-center shadow-2xl relative animate-in zoom-in-95 duration-150">
            
            {/* Ícone de Destaque */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border ${
              confirmDialog.variant === 'danger'
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
                : confirmDialog.variant === 'primary'
                ? 'bg-mint-500/15 border-mint-500/30 text-mint-400 shadow-mint-glow-sm'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            }`}>
              {confirmDialog.variant === 'danger' ? (
                <Trash2 className="w-7 h-7 stroke-[2]" />
              ) : confirmDialog.variant === 'primary' ? (
                <CheckCircle2 className="w-7 h-7 stroke-[2]" />
              ) : (
                <AlertTriangle className="w-7 h-7 stroke-[2]" />
              )}
            </div>

            {/* Título & Mensagem */}
            <h3 className="text-lg font-black text-white">{confirmDialog.title}</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {confirmDialog.message}
            </p>

            {/* Botões de Ação */}
            <div className="mt-6 grid grid-cols-2 gap-3 w-full">
              <button
                onClick={() => confirmDialog.resolve(false)}
                className="h-12 rounded-2xl bg-dark-surface hover:bg-dark-cardHover text-slate-300 hover:text-white font-bold text-xs sm:text-sm border border-dark-border transition active:scale-95"
              >
                {confirmDialog.cancelText || 'Cancelar'}
              </button>

              <button
                onClick={() => confirmDialog.resolve(true)}
                className={`h-12 rounded-2xl font-black text-xs sm:text-sm transition active:scale-95 shadow-lg ${
                  confirmDialog.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                    : confirmDialog.variant === 'primary'
                    ? 'bg-mint-500 hover:bg-mint-400 text-slate-950 shadow-mint-glow-sm'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/30'
                }`}
              >
                {confirmDialog.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
