import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg ' +
  'font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-150 ' +
  'active:translate-y-px disabled:pointer-events-none disabled:opacity-45 disabled:active:translate-y-0'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-500 text-white shadow-xs hover:bg-brand-600 active:bg-brand-700 ' +
    'border border-brand-600/60',
  secondary:
    'bg-white text-ink-800 border border-ink-200 shadow-xs hover:bg-ink-50 hover:border-ink-300 active:bg-ink-100',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200',
  danger:
    'bg-danger-500 text-white shadow-xs hover:bg-danger-600 active:bg-danger-700 border border-danger-600/60',
  icon: 'bg-transparent text-ink-600 hover:bg-ink-100 hover:text-ink-900 active:bg-ink-200',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-2.5 text-[0.8125rem]',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-11 px-5 text-[0.9375rem]',
}

const iconSizes: Record<ButtonSize, string> = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' }

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  /** Obligatoire pour la variante « icon » : le nom accessible du bouton. */
  label?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', loading, iconLeft, iconRight, label, children, disabled, ...props },
  ref,
) {
  const isIcon = variant === 'icon'
  return (
    <button
      ref={ref}
      type={props.type ?? 'button'}
      disabled={disabled || loading}
      aria-label={isIcon ? label : props['aria-label']}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], isIcon ? iconSizes[size] : sizes[size], className)}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
      {!loading && iconLeft}
      {!isIcon && children}
      {isIcon && !loading && children}
      {!loading && iconRight}
      {loading && !isIcon && <span className="sr-only">Chargement en cours</span>}
    </button>
  )
})
