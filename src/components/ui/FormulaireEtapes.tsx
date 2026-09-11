import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'

/** Fil d'étapes réutilisable, indépendant du module. */
export function FilEtapes({
  etapes,
  courante,
  onAller,
  label = 'Étapes du formulaire',
}: {
  etapes: string[]
  courante: number
  onAller?: (i: number) => void
  label?: string
}) {
  return (
    <nav aria-label={label} className="ac-scroll -mx-1 overflow-x-auto">
      <ol className="flex min-w-max flex-nowrap items-center gap-1 px-1">
        {etapes.map((texte, i) => {
          const n = i + 1
          const faite = n < courante
          const active = n === courante
          const cliquable = !!onAller && faite
          const Balise = cliquable ? 'button' : 'div'
          return (
            <li key={texte} className="flex items-center">
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
                    faite ? 'border-brand-500 bg-brand-500 text-white' : active ? 'border-brand-500 text-brand-700' : 'border-ink-300 text-ink-500',
                  )}
                >
                  {faite ? <Check className="h-3 w-3" strokeWidth={3} /> : n}
                </span>
                <span className="whitespace-nowrap">{texte}</span>
                <span className="sr-only">{faite ? ' — étape terminée' : active ? ' — étape en cours' : ' — étape à venir'}</span>
              </Balise>
              {n < etapes.length && <span aria-hidden className="mx-1 h-px w-5 shrink-0 bg-ink-200" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export type EtapeFormulaire = {
  /** Titre court affiché dans le fil d'étapes. */
  titre: string
  /** Sous-titre de la carte, facultatif. */
  description?: string
  contenu: ReactNode
  /** Renvoie les erreurs bloquant le passage à l'étape suivante. */
  valider?: () => Record<string, string>
}

/**
 * Coquille de formulaire en étapes : fil d'étapes, carte de contenu, barre
 * d'actions fixe en bas. Le passage à l'étape suivante est bloqué tant que la
 * validation de l'étape courante échoue.
 */
export function FormulaireEtapes({
  etapes,
  onAnnuler,
  onTerminer,
  libelleTerminer,
  enCours,
  onErreurs,
  labelFil,
  resume,
}: {
  etapes: EtapeFormulaire[]
  onAnnuler: () => void
  onTerminer: () => void
  libelleTerminer: string
  enCours: boolean
  /** Remonte les erreurs de l'étape pour les afficher dans les champs. */
  onErreurs?: (e: Record<string, string>) => void
  labelFil?: string
  /** Texte affiché à gauche de la barre d'actions. */
  resume?: ReactNode
}) {
  const [courante, setCourante] = useState(1)
  const ancre = useRef<HTMLHeadingElement>(null)
  const etape = etapes[courante - 1]
  const derniere = courante === etapes.length

  // Le focus revient en tête à chaque changement d'étape
  useEffect(() => {
    ancre.current?.focus()
  }, [courante])

  const avancer = () => {
    const erreurs = etape.valider?.() ?? {}
    onErreurs?.(erreurs)
    if (Object.keys(erreurs).length > 0) return
    if (derniere) {
      onTerminer()
      return
    }
    setCourante((c) => c + 1)
  }

  return (
    <>
      <FilEtapes etapes={etapes.map((e) => e.titre)} courante={courante} onAller={setCourante} label={labelFil} />

      <Card>
        <div className="border-b border-ink-100 px-5 py-4">
          <h2 ref={ancre} tabIndex={-1} className="font-display text-[0.9375rem] font-semibold text-ink-900 outline-none">
            {etape.titre}
          </h2>
          {etape.description && <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-500">{etape.description}</p>}
        </div>
        <CardBody>{etape.contenu}</CardBody>
      </Card>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours ? 'Enregistrement en cours…' : resume ?? `Étape ${courante} sur ${etapes.length}`}
        </p>

        {courante > 1 ? (
          <Button onClick={() => setCourante((c) => c - 1)} disabled={enCours} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
            Précédent
          </Button>
        ) : (
          <Button variant="ghost" onClick={onAnnuler} disabled={enCours}>
            Annuler
          </Button>
        )}

        <Button
          variant="primary"
          loading={enCours}
          onClick={avancer}
          iconRight={!derniere ? <ArrowRight aria-hidden className="h-4 w-4" /> : undefined}
        >
          {derniere ? libelleTerminer : 'Continuer'}
        </Button>
      </div>
    </>
  )
}
