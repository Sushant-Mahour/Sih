import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

let toastListeners = [];

export const showToast = (message, type = 'info', duration = 4000) => {
  const id = Date.now() + Math.random().toString(36).slice(2, 6);
  toastListeners.forEach((listener) => listener({ id, message, type, duration }));
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (toast) => {
      setToasts((prev) => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
      }
    };

    toastListeners.push(handleToast);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== handleToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[2500] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isDanger = toast.type === 'danger' || toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-lg flex items-start gap-3 bg-bg-elevated transition-all transform translate-y-0 ${
              isSuccess
                ? 'border-success/30 text-text-primary'
                : isDanger
                ? 'border-danger/30 text-text-primary'
                : isWarning
                ? 'border-warning/30 text-text-primary'
                : 'border-border-subtle text-text-primary'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 text-success" />}
              {isDanger && <AlertOctagon className="w-4 h-4 text-danger" />}
              {isWarning && <AlertTriangle className="w-4 h-4 text-warning" />}
              {!isSuccess && !isDanger && !isWarning && <Info className="w-4 h-4 text-accent" />}
            </div>

            <div className="flex-1 text-xs leading-normal">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss toast"
              className="text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
