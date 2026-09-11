import { useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEscape, useOnClickOutside } from '@/lib/hooks'
import { controlBase } from './Field'

export type Option = { value: string; label: string }

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Sélectionner…',
  id,
  'aria-describedby': describedBy,
  disabled,
}: {
  options: Option[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  id?: string
  'aria-describedby'?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const listId = `${id ?? 'ms'}-list`

  useOnClickOutside([wrapRef], () => setOpen(false), open)
  useEscape(() => setOpen(false), open)

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setOpen(true)
      return
    }
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, options.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(options[active].value)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(controlBase, 'flex min-h-9 items-center gap-1.5 py-1 pl-2 pr-9 text-left')}
      >
        {value.length === 0 && <span className="pl-1 text-ink-500">{placeholder}</span>}
        <span className="flex flex-wrap gap-1">
          {value.map((v) => {
            const opt = options.find((o) => o.value === v)
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-1.5 py-0.5 text-xs font-medium text-ink-700"
              >
                {opt?.label ?? v}
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Retirer ${opt?.label ?? v}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(v)
                  }}
                  className="rounded hover:text-ink-900"
                >
                  <X aria-hidden className="h-3 w-3" />
                </span>
              </span>
            )
          })}
        </span>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 h-4 w-4 text-ink-500" />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable
          aria-label="Options"
          className="ac-scroll absolute z-30 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-ink-200 bg-white p-1 shadow-lg animate-scale-in"
        >
          {options.map((o, i) => {
            const selected = value.includes(o.value)
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => toggle(o.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-800',
                    i === active && 'bg-ink-100',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      selected ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300',
                    )}
                  >
                    {selected && <Check aria-hidden className="h-3 w-3" strokeWidth={3.5} />}
                  </span>
                  {o.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
