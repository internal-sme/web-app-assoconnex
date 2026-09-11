import { useId, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type FieldRenderProps = {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
  required?: boolean
}

export function Field({
  label,
  hint,
  error,
  required,
  className,
  labelSuffix,
  children,
}: {
  label: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  labelSuffix?: ReactNode
  children: (props: FieldRenderProps) => ReactNode
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink-800">
          {label}
          {required && (
            <span className="ml-1 text-danger-500" aria-hidden>
              *
            </span>
          )}
          {required && <span className="sr-only"> (obligatoire)</span>}
        </label>
        {labelSuffix}
      </div>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        required,
      })}

      {hint && !error && (
        <p id={hintId} className="text-xs text-ink-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errId} className="flex items-start gap-1.5 text-xs font-medium text-danger-600">
          <AlertCircle aria-hidden className="mt-px h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

export const controlBase =
  'w-full rounded-lg border bg-white text-sm text-ink-900 placeholder:text-ink-500 ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-500 ' +
  'border-ink-200 hover:border-ink-300 focus:border-brand-400 ' +
  'aria-[invalid=true]:border-danger-500 aria-[invalid=true]:hover:border-danger-600'
