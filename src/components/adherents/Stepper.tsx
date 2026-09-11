import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Stepper({
  etapes,
  courante,
  onAller,
}: {
  etapes: string[]
  courante: number
  onAller?: (i: number) => void
}) {
  return (
    <nav aria-label="Étapes de l'adhésion">
      <ol className="flex flex-wrap items-center gap-1">
        {etapes.map((label, i) => {
          const n = i + 1
          const faite = n < courante
          const active = n === courante
          const cliquable = !!onAller && faite
          const Balise = cliquable ? 'button' : 'div'
          return (
            <li key={label} className="flex items-center">
              <Balise
                {...(cliquable ? { type: 'button' as const, onClick: () => onAller!(n) } : {})}
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.8125rem] transition-colors',
                  cliquable && 'hover:bg-ink-100',
                  active ? 'font-semibold text-ink-900' : faite ? 'text-ink-700' : 'text-ink-500',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'ac-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-2xs font-semibold',
                    faite
                      ? 'border-brand-500 bg-brand-500 text-white'
                      : active
                        ? 'border-brand-500 text-brand-700'
                        : 'border-ink-300 text-ink-500',
                  )}
                >
                  {faite ? <Check className="h-3 w-3" strokeWidth={3} /> : n}
                </span>
                {label}
                <span className="sr-only">
                  {faite ? ' — étape terminée' : active ? ' — étape en cours' : ' — étape à venir'}
                </span>
              </Balise>
              {n < etapes.length && <span aria-hidden className="mx-1 h-px w-5 bg-ink-200" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
