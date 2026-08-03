// src/context/ToastContext.jsx
import { createContext, useCallback, useContext, useState, useMemo } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: { Icon: CheckCircle, color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
  error:   { Icon: XCircle,     color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)'  },
  info:    { Icon: Info,        color: '#06B6D4', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.35)'  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const push = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, message, type }])
    if (duration) setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast stack */}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(({ id, message, type }) => {
          const cfg = ICONS[type] ?? ICONS.info
          const { Icon } = cfg
          return (
            <div
              key={id}
              role="status"
              className="flex items-start gap-3 rounded-xl border shadow-2xl px-4 py-3 animate-toast-in"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: cfg.border,
              }}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: cfg.bg }}
              >
                <Icon size={15} style={{ color: cfg.color }} aria-hidden="true" />
              </div>
              <p className="text-sm theme-text flex-1 leading-snug pt-0.5">{message}</p>
              <button
                onClick={() => dismiss(id)}
                className="theme-muted hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
