import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toneStyles } from './Status'
import type { StatusTone } from '@/lib/mock'

export type ToastData = {
  id: string
  titre: string
  detail?: string
  tone?: StatusTone
  duration?: number
  action?: { label: string; onClick: () => void }
}

export function Toast({ data, onDismiss }: { data: ToastData; onDismiss: () => void }) {
  const tone = data.tone ?? 'neutral'
  const style = toneStyles[tone]
  const Icon = style.icon
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-ink-200 bg-white p-3 shadow-lg animate-toast-in"
    >
      <span className={cn('mt-0.5 shrink-0', style.text)}>
        <Icon aria-hidden className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-semibold text-ink-900">{data.titre}</p>
        {data.detail && <p className="mt-0.5 text-[0.8125rem] leading-snug text-ink-500">{data.detail}</p>}
        {data.action && (
          <button
            type="button"
            onClick={data.action.onClick}
            className="mt-1.5 text-[0.8125rem] font-semibold text-brand-600 underline-offset-2 hover:underline"
          >
            {data.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Fermer la notification"
        className="rounded-md p-1 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
      >
        <X aria-hidden className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
