import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { controlBase } from './Field'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: ReactNode
  suffix?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, iconLeft, suffix, ...props },
  ref,
) {
  return (
    <div className="relative flex items-center">
      {iconLeft && (
        <span aria-hidden className="pointer-events-none absolute left-3 text-ink-500 [&>svg]:h-4 [&>svg]:w-4">
          {iconLeft}
        </span>
      )}
      <input
        ref={ref}
        className={cn(controlBase, 'h-9 px-3', iconLeft && 'pl-9', suffix && 'pr-16', className)}
        {...props}
      />
      {suffix && <span className="pointer-events-none absolute right-3 text-xs text-ink-500">{suffix}</span>}
    </div>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={cn(controlBase, 'resize-y px-3 py-2 leading-relaxed', className)} {...props} />
  },
)

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, placeholder, ...props },
  ref,
) {
  return (
    <div className="relative flex items-center">
      <select ref={ref} className={cn(controlBase, 'h-9 appearance-none pl-3 pr-9', className)} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 h-4 w-4 text-ink-500" />
    </div>
  )
})
