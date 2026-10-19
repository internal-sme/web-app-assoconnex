import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Structure de page normalisée AssoConnex°.
 * Titre → description → actions → filtres → contenu → pagination.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: string
  title: string
  description?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-ink-100 pb-5 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-2xs font-semibold uppercase tracking-[0.08em] text-ink-500">{eyebrow}</p>
        )}
        <h1 className="font-display text-[1.375rem] font-semibold leading-tight tracking-tight text-ink-950">{title}</h1>
        {description && (
          typeof description === 'string' ? (
            <p className="mt-1.5 max-w-2xl text-[0.875rem] leading-relaxed text-ink-500">{description}</p>
          ) : (
            <div className="mt-1.5 max-w-2xl text-[0.875rem] leading-relaxed text-ink-500">{description}</div>
          )
        )}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PageFilters({ children }: { children: ReactNode }) {
  return (
    <div role="search" className="flex flex-wrap items-center gap-2">
      {children}
    </div>
  )
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-4', className)}>{children}</div>
}

export function Page({
  header,
  filters,
  children,
  footer,
  width = 'wide',
}: {
  header: ReactNode
  filters?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: 'wide' | 'narrow'
}) {
  return (
    <div className={cn('mx-auto flex w-full flex-col gap-5 px-5 py-6', width === 'narrow' ? 'max-w-3xl' : 'max-w-[86rem]')}>
      {header}
      {filters && <PageFilters>{filters}</PageFilters>}
      <PageBody>{children}</PageBody>
      {footer}
    </div>
  )
}
