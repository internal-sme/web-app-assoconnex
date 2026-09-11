import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  description?: string
  indeterminate?: boolean
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, label, description, indeterminate, id: idProp, ...props },
  ref,
) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <span className="relative flex h-5 items-center">
        <input
          ref={(node) => {
            if (node) node.indeterminate = !!indeterminate
            if (typeof ref === 'function') ref(node)
            else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
          }}
          id={id}
          type="checkbox"
          className="peer h-[1.125rem] w-[1.125rem] shrink-0 cursor-pointer appearance-none rounded-[5px] border border-ink-300 bg-white transition-colors checked:border-brand-500 checked:bg-brand-500 indeterminate:border-brand-500 indeterminate:bg-brand-500 hover:border-ink-400 checked:hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-ink-100"
          {...props}
        />
        {indeterminate ? (
          <Minus aria-hidden className="pointer-events-none absolute left-[0.1875rem] h-3 w-3 text-white" strokeWidth={3} />
        ) : (
          <Check
            aria-hidden
            className="pointer-events-none absolute left-[0.1875rem] h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
            strokeWidth={3.5}
          />
        )}
      </span>
      {(label || description) && (
        <span className="flex flex-col gap-0.5">
          {label && (
            <label htmlFor={id} className="cursor-pointer text-sm text-ink-800">
              {label}
            </label>
          )}
          {description && <span className="text-xs text-ink-500">{description}</span>}
        </span>
      )}
    </div>
  )
})

export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled,
  className,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <span className="flex flex-col gap-0.5">
        <label htmlFor={id} className="cursor-pointer text-sm font-medium text-ink-800">
          {label}
        </label>
        {description && <span className="text-xs text-ink-500">{description}</span>}
      </span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative mt-0.5 inline-flex h-[1.375rem] w-9 shrink-0 items-center rounded-full border transition-colors duration-150',
          checked ? 'border-brand-600 bg-brand-500' : 'border-ink-300 bg-ink-200',
          disabled && 'cursor-not-allowed opacity-45',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'ml-0.5 h-[1.125rem] w-[1.125rem] rounded-full bg-white shadow-xs transition-transform duration-150',
            checked && 'translate-x-[0.875rem]',
          )}
        />
      </button>
    </div>
  )
}
