import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ToastOptions {
  id?: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms; 0 = persistent
  dismissible?: boolean;
  position?: ToastPosition; // overrides provider position
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface InternalToast extends Required<Omit<ToastOptions, 'action' | 'onClose' | 'position' | 'title'>> {
  id: string;
  title?: string;
  position?: ToastPosition;
  action?: ToastOptions['action'];
  onClose?: () => void;
}

interface ToastContextValue {
  show: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
  success: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => string;
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => string;
  info: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => string;
  warning: (message: string, options?: Omit<ToastOptions, 'message' | 'variant'>) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
  defaultDuration?: number; // ms
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  position = 'bottom-right',
  maxToasts = 5,
  defaultDuration = 3000,
}) => {
  const [toasts, setToasts] = useState<InternalToast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const scheduleAutoDismiss = useCallback((toast: InternalToast) => {
    if (toast.duration > 0) {
      const timerId = window.setTimeout(() => {
        dismiss(toast.id);
        toast.onClose?.();
      }, toast.duration);
      timers.current.set(toast.id, timerId);
    }
  }, [dismiss]);

  const show = useCallback((opts: ToastOptions) => {
    const id = opts.id || Math.random().toString(36).slice(2);
    const t: InternalToast = {
      id,
      title: opts.title,
      message: opts.message,
      variant: opts.variant ?? 'info',
      duration: typeof opts.duration === 'number' ? opts.duration : defaultDuration,
      dismissible: opts.dismissible ?? true,
      position: opts.position || position,
      action: opts.action,
      onClose: opts.onClose,
    };

    setToasts(prev => {
      const next = [t, ...prev];
      // cap to maxToasts per position
      const grouped = new Map<ToastPosition, InternalToast[]>();
      for (const toast of next) {
        const pos = toast.position || position;
        const arr = grouped.get(pos) || [];
        arr.push(toast);
        grouped.set(pos, arr);
      }
      const flattened: InternalToast[] = [];
      for (const [pos, arr] of grouped) {
        flattened.push(...arr.slice(0, maxToasts));
      }
      return flattened;
    });

    // schedule dismiss outside setState to ensure latest
    setTimeout(() => {
      const latest = toasts.find(t => t.id === id);
      scheduleAutoDismiss(latest || t);
    }, 0);

    return id;
  }, [defaultDuration, maxToasts, position, scheduleAutoDismiss, toasts]);

  const api = useMemo<ToastContextValue>(() => ({
    show,
    dismiss,
    clear: () => setToasts([]),
    success: (message, options) => show({ ...options, message, variant: 'success' }),
    error: (message, options) => show({ ...options, message, variant: 'error' }),
    info: (message, options) => show({ ...options, message, variant: 'info' }),
    warning: (message, options) => show({ ...options, message, variant: 'warning' }),
  }), [show, dismiss]);

  const renderToast = (toast: InternalToast) => {
    const baseColor = {
      success: 'badge-brand',
      error: 'badge-error',
      info: 'badge-info',
      warning: 'badge-warning',
    }[toast.variant];

    return (
      <div
        key={toast.id}
        className={`shadow-md rounded-md px-4 py-3 mb-2 w-80 ${baseColor} transition-all duration-200`}
        role="status"
      >
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {toast.title && <div className="font-semibold leading-5 mb-0.5">{toast.title}</div>}
            <div className="text-sm leading-5 opacity-95">{toast.message}</div>
          </div>
          <div className="flex items-center gap-2">
            {toast.action && (
              <button
                className="text-xs underline decoration-2 underline-offset-2"
                onClick={toast.action.onClick}
              >
                {toast.action.label}
              </button>
            )}
            {toast.dismissible && (
              <button
                aria-label="Dismiss"
                className="text-white/80 hover:text-white text-lg leading-none"
                onClick={() => dismiss(toast.id)}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const containers = useMemo(() => {
    const byPos = new Map<ToastPosition, InternalToast[]>();
    for (const t of toasts) {
      const pos = t.position || position;
      const arr = byPos.get(pos) || [];
      arr.push(t);
      byPos.set(pos, arr);
    }
    return Array.from(byPos.entries());
  }, [toasts, position]);

  const portal = createPortal(
    <>
      {containers.map(([pos, list]) => {
        const vertical = pos.startsWith('top') ? 'top-4' : 'bottom-4';
        const horizontal = pos.endsWith('right') ? 'right-4' : 'left-4';
        return (
          <div
            key={pos}
            className={`fixed z-[10000] ${vertical} ${horizontal} flex flex-col`}
          >
            {list.map(renderToast)}
          </div>
        );
      })}
    </>,
    document.body
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {portal}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
