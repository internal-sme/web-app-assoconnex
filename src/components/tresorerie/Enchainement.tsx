import { ArrowRight, Minus, Plus, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Enchainement as Donnees } from '@/lib/tresorerie'
import { formatMoney } from '@/lib/utils'

/**
 * L'enchaînement du tableau de bord : solde actuel → entrées prévues → sorties
 * prévues → solde prévisionnel. La lecture se fait de gauche à droite, chaque
 * étape porte son opérateur.
 */
export function EnchainementTresorerie({ donnees, horizon }: { donnees: Donnees; horizon: number }) {
  const negatif = donnees.soldePrevisionnel < 0
  const etapes = [
    {
      cle: 'actuel',
      label: 'Solde actuel',
      valeur: donnees.soldeActuel,
      detail: 'Tous comptes, mouvements enregistrés',
      operateur: null as null | 'plus' | 'moins' | 'egal',
    },
    {
      cle: 'entrees',
      label: 'Entrées prévues',
      valeur: donnees.entreesPrevues,
      detail: `dont ${formatMoney(donnees.entreesConfirmees)} confirmées`,
      operateur: 'plus' as const,
    },
    {
      cle: 'sorties',
      label: 'Sorties prévues',
      valeur: donnees.sortiesPrevues,
      detail: 'échéances connues sur la période',
      operateur: 'moins' as const,
    },
    {
      cle: 'previsionnel',
      label: 'Solde prévisionnel',
      valeur: donnees.soldePrevisionnel,
      detail: `à ${horizon} jours`,
      operateur: 'egal' as const,
    },
  ]

  const Icone = { plus: Plus, moins: Minus, egal: ArrowRight }

  return (
    <section aria-label={`Projection de trésorerie à ${horizon} jours`} className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
      {etapes.map((e) => {
        const Op = e.operateur ? Icone[e.operateur] : null
        const final = e.cle === 'previsionnel'
        return (
          <div key={e.cle} className="flex flex-1 items-stretch gap-2">
            {Op && (
              <span aria-hidden className="flex shrink-0 items-center justify-center px-1 text-ink-500">
                <Op className="h-4 w-4" />
              </span>
            )}
            <div
              className={cn(
                'flex-1 rounded-xl border p-4 shadow-xs',
                final
                  ? negatif
                    ? 'border-danger-100 bg-danger-50'
                    : 'border-brand-200 bg-brand-50'
                  : 'border-ink-200 bg-white',
              )}
            >
              <p className={cn('flex items-center gap-1.5 text-[0.8125rem] font-medium', final ? (negatif ? 'text-danger-700' : 'text-brand-700') : 'text-ink-500')}>
                {e.cle === 'actuel' && <Wallet aria-hidden className="h-3.5 w-3.5" />}
                {e.label}
              </p>
              <p
                className={cn(
                  'ac-num mt-2 font-display text-[1.5rem] font-semibold leading-none tracking-tight',
                  final ? (negatif ? 'text-danger-700' : 'text-brand-800') : 'text-ink-900',
                )}
              >
                {e.operateur === 'plus' ? '+' : e.operateur === 'moins' ? '−' : ''}
                {formatMoney(e.valeur)}
              </p>
              <p className={cn('mt-2 text-xs', final ? (negatif ? 'text-danger-700' : 'text-brand-700') : 'text-ink-500')}>{e.detail}</p>
            </div>
          </div>
        )
      })}
    </section>
  )
}
