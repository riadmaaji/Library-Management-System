import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Toast } from '../components/ui/Toast';
import toastStyles from '../components/ui/Toast.module.css';
import { ToastContext } from './toastContext';

const DEFAULT_DURATION_MS = 5000;
const EXIT_ANIMATION_BUFFER_MS = 340;

function createToastId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const pending = timeoutsRef.current.get(id);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const dismissToast = useCallback((id) => {
    const pending = timeoutsRef.current.get(id);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      timeoutsRef.current.delete(id);
    }

    let shouldScheduleFallback = false;
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id !== id) {
          return t;
        }

        if (t.exiting) {
          return t;
        }

        shouldScheduleFallback = true;
        return { ...t, exiting: true };
      })
    );

    // Safety-net removal in case animationend is skipped.
    if (shouldScheduleFallback) {
      const fallbackId = window.setTimeout(() => {
        timeoutsRef.current.delete(id);
        removeToast(id);
      }, EXIT_ANIMATION_BUFFER_MS);
      timeoutsRef.current.set(id, fallbackId);
    }
  }, [removeToast]);

  const handleExitComplete = useCallback(
    (id) => {
      removeToast(id);
    },
    [removeToast]
  );

  const showToast = useCallback(
    ({ message, type = 'info', duration = DEFAULT_DURATION_MS }) => {
      const id = createToastId();
      const next = { id, message, type, duration };

      setToasts((prev) => [next, ...prev]);

      if (duration > 0) {
        const timeoutId = window.setTimeout(() => {
          timeoutsRef.current.delete(id);
          dismissToast(id);
        }, duration);
        timeoutsRef.current.set(id, timeoutId);
      }

      return id;
    },
    [dismissToast]
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((tid) => window.clearTimeout(tid));
      timeouts.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [showToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={toastStyles.region}
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <Toast
            key={t.id}
            id={t.id}
            message={t.message}
            type={t.type}
            exiting={Boolean(t.exiting)}
            onDismiss={dismissToast}
            onExitComplete={handleExitComplete}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
