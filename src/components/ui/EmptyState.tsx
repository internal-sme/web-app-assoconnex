import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
  secondaryAction?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-6 py-10' : 'px-6 py-16',
        className,
      )}
    >
      <span
        aria-hidden
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-ink-200 bg-ink-50 text-ink-500 [&>svg]:h-5 [&>svg]:w-5"
      >
        {icon}
      </span>
      <h3 className="font-display text-[0.9375rem] font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 max-w-sm text-[0.8125rem] leading-relaxed text-ink-500">{description}</p>
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  )
}
