import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Badge({
  children,
  variant = 'neutral',
  className,
}: {
  children: ReactNode
  variant?: 'neutral' | 'brand' | 'outline' | 'solid'
  className?: string
}) {
  const styles = {
    neutral: 'bg-ink-100 text-ink-700 border-transparent',
    brand: 'bg-brand-50 text-brand-700 border-brand-100',
    outline: 'bg-white text-ink-700 border-ink-200',
    solid: 'bg-ink-900 text-white border-transparent',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Chip({
  children,
  onRemove,
  icon,
  className,
}: {
  children: ReactNode
  onRemove?: () => void
  icon?: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white py-1 pl-2.5 text-[0.8125rem] text-ink-700 shadow-xs',
        onRemove ? 'pr-1' : 'pr-2.5',
        className,
      )}
    >
      {icon}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-0.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
          aria-label={`Retirer le filtre ${typeof children === 'string' ? children : ''}`}
        >
          <X aria-hidden className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
