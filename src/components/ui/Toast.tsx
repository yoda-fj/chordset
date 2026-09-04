'use client'

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import { Toaster, toast } from 'sonner'

type ToastType = 'success' | 'error' | 'info'

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

/**
 * Provider de toast baseado em sonner (Fase 1.4).
 * Mantém a API antiga (useToast().showToast) — call sites não mudam.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    if (type === 'success') toast.success(message)
    else if (type === 'info') toast.info(message)
    else toast.error(message)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgb(var(--surface-raised))',
            color: 'rgb(var(--ink))',
            border: '1px solid rgb(var(--ink) / 0.12)',
          },
        }}
      />
    </ToastContext.Provider>
  )
}
