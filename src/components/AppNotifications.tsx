import React, { useEffect, useRef, useState } from 'react';
import toast, { Toaster, Toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircleFill,
  XCircleFill,
  ExclamationTriangleFill,
  InfoCircleFill,
  ArrowRepeat,
  PlusCircleFill,
  PencilSquare,
  Trash3,
  XLg,
} from 'react-bootstrap-icons';

type NotifyKind = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface NotifyOptions {
  title?: string;
  id?: string;
  duration?: number;
}

const KIND_STYLES: Record<NotifyKind, { icon: React.ReactNode; accent: string; title: string }> = {
  success: { icon: <CheckCircleFill className="w-5 h-5 text-emerald-500" />, accent: 'bg-emerald-500', title: 'Success' },
  error: { icon: <XCircleFill className="w-5 h-5 text-rose-500" />, accent: 'bg-rose-500', title: 'Something went wrong' },
  warning: { icon: <ExclamationTriangleFill className="w-5 h-5 text-amber-500" />, accent: 'bg-amber-500', title: 'Attention' },
  info: { icon: <InfoCircleFill className="w-5 h-5 text-blue-500" />, accent: 'bg-blue-500', title: 'Notice' },
  loading: { icon: <ArrowRepeat className="w-5 h-5 text-slate-500 animate-spin" />, accent: 'bg-slate-400', title: 'Please wait' },
};

const DEFAULT_DURATION: Record<NotifyKind, number> = {
  success: 3500,
  info: 4000,
  warning: 5000,
  error: 6000,
  loading: Infinity,
};

const NotificationCard: React.FC<{ t: Toast; kind: NotifyKind; title: string; message: string }> = ({
  t,
  kind,
  title,
  message,
}) => {
  const style = KIND_STYLES[kind];
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto w-[calc(100vw-2rem)] max-w-sm bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex transition-all duration-200 ${
        t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className={`w-1.5 shrink-0 ${style.accent}`} />
      <div className="flex-1 flex items-start gap-3 p-3.5">
        <div className="shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-900">{title}</p>
          {message && <p className="text-xs text-slate-600 mt-0.5 break-words">{message}</p>}
        </div>
        {kind !== 'loading' && (
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className="shrink-0 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <XLg className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

const show = (kind: NotifyKind, message: string, options: NotifyOptions = {}) =>
  toast.custom(
    (t) => <NotificationCard t={t} kind={kind} title={options.title || KIND_STYLES[kind].title} message={message} />,
    { id: options.id, duration: options.duration ?? DEFAULT_DURATION[kind] }
  );

export const notify = {
  success: (message: string, options?: NotifyOptions) => show('success', message, options),
  error: (message: string, options?: NotifyOptions) => show('error', message, options),
  warning: (message: string, options?: NotifyOptions) => show('warning', message, options),
  info: (message: string, options?: NotifyOptions) => show('info', message, options),
  loading: (message: string, options?: NotifyOptions) => show('loading', message, options),
  dismiss: (id?: string) => toast.dismiss(id),
};

export type ConfirmVariant = 'add' | 'update' | 'delete' | 'warning';

export interface ConfirmOptions {
  title: string;
  message?: string;
  details?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

let showConfirm: ((pending: PendingConfirm) => void) | null = null;

export const confirmAction = (options: ConfirmOptions): Promise<boolean> =>
  new Promise((resolve) => {
    if (!showConfirm) {
      resolve(window.confirm(options.message ? `${options.title}\n\n${options.message}` : options.title));
      return;
    }
    showConfirm({ ...options, resolve });
  });

const VARIANT_STYLES: Record<ConfirmVariant, { icon: React.ReactNode; iconBg: string; button: string; defaultText: string }> = {
  add: {
    icon: <PlusCircleFill className="w-5 h-5" />,
    iconBg: 'bg-emerald-100 text-emerald-600',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    defaultText: 'Yes, Add',
  },
  update: {
    icon: <PencilSquare className="w-5 h-5" />,
    iconBg: 'bg-blue-100 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
    defaultText: 'Yes, Save',
  },
  delete: {
    icon: <Trash3 className="w-5 h-5" />,
    iconBg: 'bg-rose-100 text-rose-600',
    button: 'bg-rose-600 hover:bg-rose-700',
    defaultText: 'Yes, Delete',
  },
  warning: {
    icon: <ExclamationTriangleFill className="w-5 h-5" />,
    iconBg: 'bg-amber-100 text-amber-600',
    button: 'bg-amber-600 hover:bg-amber-700',
    defaultText: 'Yes, Continue',
  },
};

const ConfirmDialogHost: React.FC = () => {
  const [queue, setQueue] = useState<PendingConfirm[]>([]);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const current = queue[0];

  useEffect(() => {
    showConfirm = (pending) => setQueue((prev) => [...prev, pending]);
    return () => {
      showConfirm = null;
    };
  }, []);

  const close = (confirmed: boolean) => {
    if (!current) return;
    current.resolve(confirmed);
    setQueue((prev) => prev.slice(1));
  };

  useEffect(() => {
    if (!current) return;
    confirmButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const variant = VARIANT_STYLES[current?.variant || 'warning'];

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="confirm-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => close(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="app-confirm-title"
            className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${variant.iconBg}`}>
                {variant.icon}
              </div>
              <div className="min-w-0">
                <h3 id="app-confirm-title" className="font-bold text-base text-slate-900">
                  {current.title}
                </h3>
                {current.message && <p className="text-xs text-slate-500 mt-0.5">{current.message}</p>}
              </div>
            </div>

            {current.details && (
              <div className="p-5 bg-slate-50 text-xs text-slate-700">
                <div className="p-3.5 bg-white rounded-lg border border-slate-200 space-y-1">{current.details}</div>
              </div>
            )}

            <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => close(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {current.cancelText || 'No, Cancel'}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={() => close(true)}
                className={`px-4 py-2 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs ${variant.button}`}
              >
                {current.confirmText || variant.defaultText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const AppNotificationsHost: React.FC = () => (
  <>
    <Toaster position="top-right" gutter={10} containerStyle={{ zIndex: 1100 }} />
    <ConfirmDialogHost />
  </>
);
