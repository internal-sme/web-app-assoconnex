import { Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ETAPES_WORKFLOW, etapeCourante, statutNoteLabels, type NoteFrais } from '@/lib/notesFrais'
import { formatDate } from '@/lib/utils'

type EtatEtape = 'faite' | 'courante' | 'a_venir' | 'rejetee'

/**
 * Stepper du circuit de validation. Il apparaît à chaque étape : sur la fiche,
 * dans les listes en version compacte, et sur le formulaire de saisie.
 * Un rejet marque l'étape concernée en rouge et interrompt la suite.
 */
export function WorkflowStepper({ note, compact = false }: { note: NoteFrais; compact?: boolean }) {
  const rang = etapeCourante(note)
  const rejetee = note.statut === 'rejetee'
  const rangRejet = rejetee ? (note.rejeteeA === 'tresorier' ? 4 : 3) : -1

  const dates: (string | null)[] = [
    note.historique[note.historique.length - 1]?.quand ?? null,
    note.soumiseLe,
    note.valideeResponsableLe,
    note.valideeTresorierLe,
    note.rembourseeLe,
  ]

  const etat = (i: number): EtatEtape => {
    const n = i + 1
    if (rejetee && n === rangRejet) return 'rejetee'
    if (rejetee && n > rangRejet) return 'a_venir'
    if (n < rang) return 'faite'
    if (n === rang) return 'courante'
    return 'a_venir'
  }

  return (
    <div className={cn('w-full', compact ? '' : 'rounded-xl border border-ink-200 bg-white p-4 shadow-xs')}>
      {!compact && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-[0.9375rem] font-semibold text-ink-900">Circuit de validation</h3>
          <p className="text-[0.8125rem] text-ink-500">
            Étape en cours : <span className="font-medium text-ink-800">{statutNoteLabels[note.statut]}</span>
          </p>
        </div>
      )}

      <ol className={cn('flex', compact ? 'items-center gap-1' : 'flex-col gap-0 sm:flex-row sm:items-start')}>
        {ETAPES_WORKFLOW.map((e, i) => {
          const s = etat(i)
          const dernier = i === ETAPES_WORKFLOW.length - 1
          const quand = dates[i]

          const pastille = cn(
            'flex shrink-0 items-center justify-center rounded-full border font-semibold transition-colors',
            compact ? 'h-4 w-4 text-[0.5rem]' : 'h-7 w-7 text-2xs',
            s === 'faite' && 'border-success-500 bg-success-500 text-white',
            s === 'courante' && 'border-brand-500 bg-brand-500 text-white',
            s === 'rejetee' && 'border-danger-500 bg-danger-500 text-white',
            s === 'a_venir' && 'border-ink-300 bg-white text-ink-500',
          )

          const trait = cn(
            compact ? 'h-px w-3' : 'hidden h-px flex-1 sm:block',
            s === 'faite' ? 'bg-success-500' : s === 'rejetee' ? 'bg-danger-300' : 'bg-ink-200',
          )

          return (
            <li key={e.id} className={cn('flex', compact ? 'items-center' : 'flex-1 items-start gap-3 pb-4 sm:pb-0')}>
              <div className={cn('flex', compact ? 'items-center gap-1' : 'w-full flex-col')}>
                <div className={cn('flex items-center', compact ? 'gap-1' : 'w-full gap-2')}>
                  <span className={pastille} aria-hidden>
                    {s === 'faite' ? (
                      <Check className={compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} strokeWidth={3} />
                    ) : s === 'rejetee' ? (
                      <X className={compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {!compact && !dernier && <span aria-hidden className={trait} />}
                  {compact && !dernier && <span aria-hidden className={trait} />}
                </div>

                {!compact && (
                  <div className="mt-2 pr-4">
                    <p
                      className={cn(
                        'text-[0.8125rem] font-medium',
                        s === 'courante' ? 'text-ink-900' : s === 'rejetee' ? 'text-danger-700' : s === 'faite' ? 'text-ink-800' : 'text-ink-500',
                      )}
                    >
                      {s === 'rejetee' ? `${e.label} — rejetée` : e.label}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{e.description}</p>
                    {quand && s !== 'a_venir' && (
                      <p className="ac-num mt-1 text-2xs text-ink-500">{formatDate(quand)}</p>
                    )}
                  </div>
                )}
              </div>
              <span className="sr-only">
                {e.label} —{' '}
                {s === 'faite' ? 'étape terminée' : s === 'courante' ? 'étape en cours' : s === 'rejetee' ? 'étape rejetée' : 'étape à venir'}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function cleStatutNote(n: NoteFrais) {
  switch (n.statut) {
    case 'brouillon':
      return 'ndf_brouillon' as const
    case 'soumise':
      return 'ndf_soumise' as const
    case 'validee_responsable':
      return 'ndf_responsable' as const
    case 'validee':
      return 'ndf_validee' as const
    case 'rejetee':
      return 'ndf_rejetee' as const
    case 'remboursee':
      return 'ndf_remboursee' as const
  }
}
