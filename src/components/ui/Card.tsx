import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return <Tag className={cn('rounded-xl border border-ink-200 bg-white shadow-xs', className)}>{children}</Tag>
}

export function CardHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
      <div className="min-w-0">
        <h3 className="font-display text-[0.9375rem] font-semibold text-ink-900">{title}</h3>
        {description && <p className="mt-0.5 text-[0.8125rem] text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}

export function KpiCard({
  label,
  value,
  unit,
  trend,
  hint,
}: {
  label: string
  value: string
  unit?: string
  trend?: { direction: 'up' | 'down' | 'flat'; value: string; description: string }
  hint?: string
}) {
  const icons = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus }
  const tones = { up: 'text-success-600', down: 'text-danger-600', flat: 'text-ink-500' }
  const TrendIcon = trend ? icons[trend.direction] : null
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-xs">
      <p className="text-[0.8125rem] font-medium text-ink-500">{label}</p>
      <p className="ac-num mt-2 font-display text-[1.75rem] font-semibold leading-none tracking-tight text-ink-900">
        {value}
        {unit && <span className="ml-1 text-base font-medium text-ink-500">{unit}</span>}
      </p>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {trend && TrendIcon && (
          <span className={cn('inline-flex items-center gap-0.5 font-semibold', tones[trend.direction])}>
            <TrendIcon aria-hidden className="h-3.5 w-3.5" />
            {trend.value}
          </span>
        )}
        <span className="text-ink-500">{trend?.description ?? hint}</span>
      </div>
    </div>
  )
}
