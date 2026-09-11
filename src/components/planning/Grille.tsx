import { useState } from 'react'
import { AlertTriangle, GripVertical, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  AUJOURDHUI_PLANNING,
  NOMS_JOURS_PLANNING,
  cleJour,
  conflitsDe,
  creneaux,
  personnesPlanning,
  postes,
  ressources,
  type Absence,
  type Affectation,
  type ConflitAffectation,
  type Disponibilite,
} from '@/lib/planning'

export type LigneGrille = { id: string; label: string; sous?: string; couleur?: string }

/**
 * Grille du planning : créneaux (ou personnes, ou ressources) en lignes,
 * jours en colonnes, personnes affectées dans les cellules.
 * L'affectation se fait par glisser-déposer, depuis la réserve latérale ou
 * d'une cellule vers une autre.
 */
export function GrillePlanning({
  lignes,
  jours,
  affectations,
  absences,
  disponibilites,
  cellulesDe,
  onDeposer,
  onOuvrir,
  onRetirer,
  lectureSeule = false,
  legendeLigne = 'Créneau',
}: {
  lignes: LigneGrille[]
  jours: Date[]
  affectations: Affectation[]
  absences: Absence[]
  disponibilites: Disponibilite[]
  /** Affectations à placer dans la cellule (ligne, jour). */
  cellulesDe: (ligneId: string, jour: string) => Affectation[]
  /** Dépôt d'une personne (personneId) ou d'une affectation existante (affectationId). */
  onDeposer: (charge: { affectationId?: string; personneId?: string }, ligneId: string, jour: string) => void
  onOuvrir?: (a: Affectation) => void
  onRetirer?: (a: Affectation) => void
  lectureSeule?: boolean
  legendeLigne?: string
}) {
  const [survol, setSurvol] = useState<string | null>(null)

  const nomPersonne = (id: string) => personnesPlanning.find((p) => p.id === id)?.nom ?? id
  const poste = (id: string) => postes.find((p) => p.id === id)

  return (
    <div className="ac-scroll overflow-x-auto rounded-xl border border-ink-200 bg-white">
      <table className="w-full min-w-[56rem] border-collapse">
        <caption className="sr-only">
          Planning par {legendeLigne.toLowerCase()} et par jour, du {cleJour(jours[0])} au {cleJour(jours[jours.length - 1])}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="w-40 border-b border-ink-100 bg-ink-25 px-3 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-ink-500">
              {legendeLigne}
            </th>
            {jours.map((j) => {
              const estAujourdhui = cleJour(j) === cleJour(AUJOURDHUI_PLANNING)
              return (
                <th key={cleJour(j)} scope="col" className="border-b border-l border-ink-100 bg-ink-25 px-2 py-2 text-center">
                  <span className="block text-2xs uppercase tracking-wide text-ink-500">
                    {NOMS_JOURS_PLANNING[(j.getUTCDay() + 6) % 7].slice(0, 3)}
                  </span>
                  <span
                    className={cn(
                      'ac-num mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[0.8125rem] font-semibold',
                      estAujourdhui ? 'bg-brand-500 text-white' : 'text-ink-800',
                    )}
                  >
                    {j.getUTCDate()}
                  </span>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => (
            <tr key={ligne.id}>
              <th scope="row" className="border-b border-ink-100 px-3 py-2 text-left align-top">
                <span className="flex items-start gap-2">
                  {ligne.couleur && <span aria-hidden className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: ligne.couleur }} />}
                  <span className="min-w-0">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{ligne.label}</span>
                    {ligne.sous && <span className="ac-num block truncate text-2xs text-ink-500">{ligne.sous}</span>}
                  </span>
                </span>
              </th>

              {jours.map((j) => {
                const cle = cleJour(j)
                const cellule = `${ligne.id}|${cle}`
                const contenu = cellulesDe(ligne.id, cle)
                const actif = survol === cellule
                return (
                  <td
                    key={cle}
                    onDragOver={(e) => {
                      if (lectureSeule) return
                      e.preventDefault()
                      setSurvol(cellule)
                    }}
                    onDragLeave={() => setSurvol((s) => (s === cellule ? null : s))}
                    onDrop={(e) => {
                      if (lectureSeule) return
                      e.preventDefault()
                      setSurvol(null)
                      const brut = e.dataTransfer.getData('text/plain')
                      if (!brut) return
                      try {
                        onDeposer(JSON.parse(brut), ligne.id, cle)
                      } catch {
                        /* charge non reconnue */
                      }
                    }}
                    className={cn(
                      'h-24 min-w-[7.5rem] border-b border-l border-ink-100 align-top transition-colors',
                      actif ? 'bg-brand-50 ring-1 ring-inset ring-brand-400' : undefined,
                    )}
                  >
                    <div className="flex h-full flex-col gap-1 p-1">
                      {contenu.length === 0 && !actif && (
                        <span className="sr-only">Aucune affectation</span>
                      )}
                      {contenu.map((a) => {
                        const conflits: ConflitAffectation[] = conflitsDe(a, affectations, absences, disponibilites)
                        const p = poste(a.posteId)
                        return (
                          <div
                            key={a.id}
                            draggable={!lectureSeule}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', JSON.stringify({ affectationId: a.id }))
                              e.dataTransfer.effectAllowed = 'move'
                            }}
                            className={cn(
                              'group flex items-start gap-1 rounded border-l-[3px] px-1.5 py-1 text-left',
                              !lectureSeule && 'cursor-grab active:cursor-grabbing',
                              conflits.length > 0 ? 'bg-danger-50 ring-1 ring-danger-200' : 'bg-ink-50',
                              a.statut === 'remplacement' && conflits.length === 0 && 'bg-warning-50 ring-1 ring-warning-200',
                            )}
                            style={{ borderLeftColor: p?.couleur ?? '#2364AA' }}
                            title={`${nomPersonne(a.personneId)} — ${p?.nom}${conflits.length > 0 ? ` — ${conflits[0].detail}` : ''}`}
                          >
                            {!lectureSeule && <GripVertical aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-ink-300 group-hover:text-ink-500" />}
                            <button type="button" onClick={() => onOuvrir?.(a)} className="min-w-0 flex-1 text-left">
                              <span className="flex items-center gap-1">
                                {conflits.length > 0 && <AlertTriangle aria-hidden className="h-3 w-3 shrink-0 text-danger-600" />}
                                <span className="truncate text-2xs font-medium text-ink-900">{nomPersonne(a.personneId)}</span>
                              </span>
                              <span className="block truncate text-[0.5rem] text-ink-600">{p?.nom}</span>
                              {a.ressourceId && (
                                <span className="block truncate text-[0.5rem] text-ink-500">
                                  {ressources.find((r) => r.id === a.ressourceId)?.nom}
                                </span>
                              )}
                            </button>
                            {!lectureSeule && onRetirer && (
                              <button
                                type="button"
                                onClick={() => onRetirer(a)}
                                aria-label={`Retirer ${nomPersonne(a.personneId)} de ce créneau`}
                                className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                              >
                                <X aria-hidden className="h-3 w-3 text-ink-500 hover:text-danger-600" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                      {actif && (
                        <span className="flex items-center justify-center gap-1 rounded border border-dashed border-brand-400 py-1 text-[0.5rem] font-medium text-brand-700">
                          <Plus aria-hidden className="h-2.5 w-2.5" />
                          Déposer ici
                        </span>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Réserve latérale : les personnes que l'on fait glisser vers la grille. */
export function ReservePersonnes({ heuresDe }: { heuresDe: (personneId: string) => number }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {personnesPlanning.map((p) => {
        const heures = heuresDe(p.id)
        const surcharge = heures > p.quotaHebdo
        return (
          <li
            key={p.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', JSON.stringify({ personneId: p.id }))
              e.dataTransfer.effectAllowed = 'copy'
            }}
            className="cursor-grab rounded-lg border border-ink-200 bg-white p-2 active:cursor-grabbing hover:border-ink-300"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: p.couleur }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{p.nom}</span>
                <span className="block truncate text-2xs text-ink-500">{p.competences.join(' · ')}</span>
              </span>
            </span>
            <span className="mt-1.5 flex items-center gap-2">
              <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                <span
                  className={cn('block h-full rounded-full', surcharge ? 'bg-warning-500' : 'bg-brand-500')}
                  style={{ width: `${Math.min((heures / p.quotaHebdo) * 100, 100)}%` }}
                />
              </span>
              <span className={cn('ac-num text-2xs', surcharge ? 'font-semibold text-warning-600' : 'text-ink-500')}>
                {heures}/{p.quotaHebdo} h
              </span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function LegendePostes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {postes.map((p) => (
        <span key={p.id} className="flex items-center gap-1.5 text-2xs text-ink-600">
          <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.couleur }} />
          {p.nom}
        </span>
      ))}
      <span className="flex items-center gap-1.5 text-2xs text-ink-600">
        <AlertTriangle aria-hidden className="h-3 w-3 text-danger-600" />
        Conflit d’affectation
      </span>
    </div>
  )
}

export { creneaux }
