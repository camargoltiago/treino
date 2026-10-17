// Sistema global de Feedback (Toasts e Confirmações bonitas e modernas)

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

type ToastListener = (toasts: ToastItem[]) => void;
type ConfirmListener = (dialog: (ConfirmDialogOptions & { resolve: (val: boolean) => void }) | null) => void;

let toasts: ToastItem[] = [];
let toastListeners: ToastListener[] = [];
let confirmListener: ConfirmListener | null = null;

export const feedback = {
  // Disparar toast
  toast(message: string, type: ToastType = 'info') {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const item: ToastItem = { id, message, type };
    toasts = [...toasts.slice(-2), item]; // mantém no máximo os 3 mais recentes
    toastListeners.forEach(fn => fn(toasts));

    setTimeout(() => {
      this.dismissToast(id);
    }, 3800);
  },

  success(message: string) {
    this.toast(message, 'success');
  },

  error(message: string) {
    this.toast(message, 'error');
  },

  warning(message: string) {
    this.toast(message, 'warning');
  },

  info(message: string) {
    this.toast(message, 'info');
  },

  dismissToast(id: string) {
    toasts = toasts.filter(t => t.id !== id);
    toastListeners.forEach(fn => fn(toasts));
  },

  subscribeToasts(listener: ToastListener) {
    toastListeners.push(listener);
    listener(toasts);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  },

  // Modal de confirmação assíncrono (substitui window.confirm)
  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise(resolve => {
      if (confirmListener) {
        confirmListener({
          ...options,
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          variant: options.variant || 'warning',
          resolve: (val: boolean) => {
            if (confirmListener) confirmListener(null);
            resolve(val);
          }
        });
      } else {
        // Fallback caso o componente não esteja montado
        resolve(window.confirm(options.message));
      }
    });
  },

  subscribeConfirm(listener: ConfirmListener) {
    confirmListener = listener;
    return () => {
      confirmListener = null;
    };
  }
};
