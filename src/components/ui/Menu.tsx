import { useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useEscape, useOnClickOutside } from '@/lib/hooks'

export type MenuItem =
  | { type: 'separator' }
  | { type?: 'item'; label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; shortcut?: string }

export function Menu({
  trigger,
  items,
  align = 'end',
  label,
  className,
  width = 'w-56',
}: {
  trigger: (props: { open: boolean; toggle: () => void; ref: React.RefObject<HTMLButtonElement> }) => ReactNode
  items: MenuItem[]
  align?: 'start' | 'end'
  label: string
  className?: string
  width?: string
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  useOnClickOutside([wrapRef], () => setOpen(false), open)
  useEscape(() => {
    setOpen(false)
    triggerRef.current?.focus()
  }, open)

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((o) => !o), ref: triggerRef })}
      {open && items.length > 0 && (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            'absolute z-40 mt-1.5 rounded-xl border border-ink-200 bg-white p-1 shadow-lg animate-scale-in',
            width,
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) =>
            'type' in item && item.type === 'separator' ? (
              <div key={i} role="separator" className="my-1 h-px bg-ink-100" />
            ) : (
              <button
                key={i}
                role="menuitem"
                type="button"
                onClick={() => {
                  setOpen(false)
                  ;(item as Extract<MenuItem, { onSelect: () => void }>).onSelect()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[0.8125rem] transition-colors',
                  (item as any).danger
                    ? 'text-danger-600 hover:bg-danger-50'
                    : 'text-ink-700 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                <span aria-hidden className="[&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0">{(item as any).icon}</span>
                <span className="flex-1">{(item as any).label}</span>
                {(item as any).shortcut && (
                  <kbd className="font-mono text-2xs text-ink-500">{(item as any).shortcut}</kbd>
                )}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
