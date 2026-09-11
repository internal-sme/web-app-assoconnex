import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Toast, type ToastData } from '@/components/ui/Toast'
import { uid } from '@/lib/utils'

type Ctx = { toast: (t: Omit<ToastData, 'id'>) => void; dismiss: (id: string) => void }

const ToastContext = createContext<Ctx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastData[]>([])

  const dismiss = useCallback((id: string) => setItems((l) => l.filter((t) => t.id !== id)), [])

  const toast = useCallback(
    (t: Omit<ToastData, 'id'>) => {
      const id = uid('toast')
      setItems((l) => [...l, { ...t, id }])
      window.setTimeout(() => dismiss(id), t.duration ?? 5000)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions text"
        className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
      >
        {items.map((t) => (
          <Toast key={t.id} data={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans ToastProvider')
  return ctx
}
