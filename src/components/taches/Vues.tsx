import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Flag, GripVertical, ListChecks, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Status'
import {
  COLONNES,
  avancementChecklist,
  enRetard,
  joursRestants,
  prioriteLabels,
  type Priorite,
  type StatutTache,
  type Tache,
} from '@/lib/taches'
import { formatDate } from '@/lib/utils'

export const cleStatutTache: Record<StatutTache, 'actif' | 'en_attente' | 'echeance_proche' | 'valide' | 'brouillon'> = {
  a_faire: 'brouillon',
  en_cours: 'actif',
  en_attente: 'en_attente',
  a_valider: 'echeance_proche',
  termine: 'valide',
}

const couleursPriorite: Record<Priorite, string> = {
  basse: 'text-ink-500',
  normale: 'text-ink-600',
  haute: 'text-warning-600',
  critique: 'text-danger-600',
}

/* -------------------------------- Carte -------------------------------- */

export function CarteTache({ tache, onOuvrir, draggable }: { tache: Tache; onOuvrir: () => void; draggable?: boolean }) {
  const check = avancementChecklist(tache)
  const retard = enRetard(tache)
  const jours = joursRestants(tache)

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', tache.id)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={cn(
        'group rounded-lg border bg-white p-3 shadow-xs transition-colors',
        retard ? 'border-danger-200' : 'border-ink-200',
        draggable && 'cursor-grab active:cursor-grabbing hover:border-ink-300',
      )}
    >
      <div className="flex items-start gap-2">
        {draggable && (
          <GripVertical aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300 group-hover:text-ink-500" />
        )}
        <button type="button" onClick={onOuvrir} className="min-w-0 flex-1 text-left">
          <p className="text-[0.8125rem] font-medium leading-snug text-ink-900">{tache.titre}</p>
          <p className="ac-num mt-1 text-2xs text-ink-500">{tache.reference}</p>
        </button>
      </div>

      {tache.etiquettes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tache.etiquettes.slice(0, 3).map((e) => (
            <Badge key={e} variant="outline">
              {e}
            </Badge>
          ))}
        </div>
      )}

      {check && (
        <div className="mt-2.5 flex items-center gap-2">
          <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
            <span className="block h-full rounded-full bg-brand-500" style={{ width: `${check.pourcentage}%` }} />
          </span>
          <span className="ac-num text-2xs text-ink-500">
            {check.faits}/{check.total}
          </span>
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-2.5">
        <Avatar name={tache.responsable} size="xs" />
        <span className={cn('flex items-center gap-1 text-2xs font-medium', couleursPriorite[tache.priorite])}>
          <Flag aria-hidden className="h-3 w-3" />
          {prioriteLabels[tache.priorite]}
        </span>
        <span
          className={cn(
            'ac-num ml-auto flex items-center gap-1 text-2xs',
            retard ? 'font-semibold text-danger-600' : jours <= 7 ? 'text-warning-600' : 'text-ink-500',
          )}
        >
          {retard && <AlertTriangle aria-hidden className="h-3 w-3" />}
          {formatDate(tache.echeance)}
        </span>
      </div>
    </article>
  )
}

/* -------------------------------- Kanban ------------------------------- */

export function VueKanban({
  taches,
  onDeplacer,
  onCreer,
}: {
  taches: Tache[]
  onDeplacer: (id: string, statut: StatutTache) => void
  onCreer: (statut: StatutTache) => void
}) {
  const navigate = useNavigate()
  const [survol, setSurvol] = useState<StatutTache | null>(null)

  return (
    <div className="ac-scroll -mx-1 overflow-x-auto px-1 pb-2">
      <div className="flex min-w-max gap-3">
        {COLONNES.map((col) => {
          const lignes = taches.filter((t) => t.statut === col.id)
          const actif = survol === col.id
          return (
            <section
              key={col.id}
              aria-label={`Colonne ${col.label}`}
              onDragOver={(e) => {
                e.preventDefault()
                setSurvol(col.id)
              }}
              onDragLeave={() => setSurvol((s) => (s === col.id ? null : s))}
              onDrop={(e) => {
                e.preventDefault()
                setSurvol(null)
                const id = e.dataTransfer.getData('text/plain')
                if (id) onDeplacer(id, col.id)
              }}
              className={cn(
                'flex w-72 shrink-0 flex-col rounded-xl border p-2 transition-colors',
                actif ? 'border-brand-400 bg-brand-50' : 'border-ink-200 bg-ink-25',
              )}
            >
              <header className="flex items-center gap-2 px-1.5 py-1.5">
                <h3 className="text-[0.8125rem] font-semibold text-ink-900">{col.label}</h3>
                <span className="ac-num rounded bg-white px-1.5 py-0.5 text-2xs font-semibold text-ink-600 ring-1 ring-ink-200">
                  {lignes.length}
                </span>
                <Button
                  variant="icon"
                  size="sm"
                  label={`Créer une tâche dans ${col.label}`}
                  className="ml-auto"
                  onClick={() => onCreer(col.id)}
                >
                  <Plus aria-hidden className="h-3.5 w-3.5" />
                </Button>
              </header>

              <div className="flex flex-1 flex-col gap-2 p-1">
                {lignes.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-ink-300 px-3 py-6 text-center">
                    <p className="text-xs font-medium text-ink-700">Colonne vide</p>
                    <p className="mx-auto mt-1 max-w-[12rem] text-2xs leading-relaxed text-ink-500">
                      {col.description} Déposez une carte ici ou créez une tâche.
                    </p>
                  </div>
                ) : (
                  lignes.map((t) => (
                    <CarteTache key={t.id} tache={t} draggable onOuvrir={() => navigate(`/taches/${t.id}`)} />
                  ))
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------ Calendrier ----------------------------- */

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const JOURS = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.']

export function VueCalendrier({ taches, reference }: { taches: Tache[]; reference: Date }) {
  const navigate = useNavigate()
  const [decalage, setDecalage] = useState(0)

  const base = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + decalage, 1))
  const annee = base.getUTCFullYear()
  const mois = base.getUTCMonth()
  const premierJour = (new Date(Date.UTC(annee, mois, 1)).getUTCDay() + 6) % 7
  const nbJours = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate()

  const cellules: (number | null)[] = [
    ...Array.from({ length: premierJour }, () => null),
    ...Array.from({ length: nbJours }, (_, i) => i + 1),
  ]
  while (cellules.length % 7 !== 0) cellules.push(null)

  const tachesDuJour = (j: number) =>
    taches.filter((t) => {
      const d = new Date(t.echeance)
      return d.getUTCFullYear() === annee && d.getUTCMonth() === mois && d.getUTCDate() === j
    })

  const aujourdhui = reference

  return (
    <div className="rounded-xl border border-ink-200 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <h3 className="font-display text-[0.9375rem] font-semibold capitalize text-ink-900">
          {MOIS[mois]} {annee}
        </h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setDecalage((d) => d - 1)}>
            Mois précédent
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDecalage(0)}>
            Aujourd'hui
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDecalage((d) => d + 1)}>
            Mois suivant
          </Button>
        </div>
      </div>

      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Échéances des tâches pour {MOIS[mois]} {annee}
        </caption>
        <thead>
          <tr>
            {JOURS.map((j) => (
              <th key={j} scope="col" className="border-b border-ink-100 px-2 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">
                {j}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cellules.length / 7 }, (_, semaine) => (
            <tr key={semaine}>
              {cellules.slice(semaine * 7, semaine * 7 + 7).map((j, i) => {
                const estAujourdhui =
                  j !== null && annee === aujourdhui.getUTCFullYear() && mois === aujourdhui.getUTCMonth() && j === aujourdhui.getUTCDate()
                const liste = j === null ? [] : tachesDuJour(j)
                return (
                  <td key={i} className={cn('h-28 border border-ink-100 align-top p-1.5', j === null && 'bg-ink-25')}>
                    {j !== null && (
                      <>
                        <span
                          className={cn(
                            'ac-num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-2xs font-semibold',
                            estAujourdhui ? 'bg-brand-500 text-white' : 'text-ink-600',
                          )}
                        >
                          {j}
                        </span>
                        <ul className="mt-1 flex flex-col gap-1">
                          {liste.slice(0, 3).map((t) => (
                            <li key={t.id}>
                              <button
                                type="button"
                                onClick={() => navigate(`/taches/${t.id}`)}
                                className={cn(
                                  'w-full truncate rounded px-1.5 py-0.5 text-left text-2xs',
                                  enRetard(t) ? 'bg-danger-50 text-danger-700' : t.statut === 'termine' ? 'bg-success-50 text-success-700' : 'bg-brand-50 text-brand-800',
                                )}
                                title={`${t.titre} — ${t.responsable}`}
                              >
                                {t.titre}
                              </button>
                            </li>
                          ))}
                          {liste.length > 3 && <li className="px-1.5 text-2xs text-ink-500">+{liste.length - 3} autre(s)</li>}
                        </ul>
                      </>
                    )}
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

/* ------------------------- Sélecteur de vue ---------------------------- */

export function SelecteurVue({ vue, onChange }: { vue: 'kanban' | 'liste' | 'calendrier'; onChange: (v: 'kanban' | 'liste' | 'calendrier') => void }) {
  const options = [
    { id: 'kanban', label: 'Kanban', icone: ListChecks },
    { id: 'liste', label: 'Liste', icone: User },
    { id: 'calendrier', label: 'Calendrier', icone: CalendarDays },
  ] as const
  return (
    <div role="group" aria-label="Mode d'affichage des tâches" className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={vue === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
            vue === o.id ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100',
          )}
        >
          <o.icone aria-hidden className="h-3.5 w-3.5" />
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function EtatVide({ onCreer }: { onCreer: () => void }) {
  return (
    <EmptyState
      icon={<ListChecks />}
      title="Aucune tâche"
      description="Les tâches permettent de répartir le travail et de suivre les échéances. Créez la première pour démarrer."
      action={
        <Button variant="primary" onClick={onCreer} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
          Créer une tâche
        </Button>
      }
    />
  )
}

export function BadgeStatut({ statut }: { statut: StatutTache }) {
  return <StatusBadge status={cleStatutTache[statut]} />
}
