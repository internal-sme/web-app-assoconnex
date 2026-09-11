import { useRef } from 'react'
import { cn } from '@/lib/utils'

export type TabItem = { id: string; label: string; count?: number }

export function Tabs({
  items,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
  ariaLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = items.findIndex((i) => i.id === value)
    let next = -1
    if (e.key === 'ArrowRight') next = (idx + 1) % items.length
    if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = items.length - 1
    if (next >= 0) {
      e.preventDefault()
      onChange(items[next].id)
      ref.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
    }
  }

  return (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={cn('flex items-center gap-1 border-b border-ink-200', className)}
    >
      {items.map((item) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative -mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-[0.8125rem] font-medium transition-colors',
              selected
                ? 'border-brand-500 text-ink-900'
                : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'ac-num rounded px-1.5 py-0.5 text-2xs font-semibold',
                  selected ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-600',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
