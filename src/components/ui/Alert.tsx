import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { toneStyles } from './Status'
import type { StatusTone } from '@/lib/mock'

/** Bandeau d'information persistant : erreur de chargement, échec de sauvegarde, confirmation. */
export function Alert({
  tone = 'neutral',
  titre,
  children,
  action,
  className,
}: {
  tone?: StatusTone
  titre: string
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const style = toneStyles[tone]
  const Icon = style.icon
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex flex-wrap items-start gap-3 rounded-xl border p-3.5', style.soft, className)}
    >
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[0.8125rem] font-semibold">{titre}</p>
        {children && <div className="mt-1 text-[0.8125rem] leading-relaxed opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
