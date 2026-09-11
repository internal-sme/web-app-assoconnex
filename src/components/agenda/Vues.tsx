import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  AUJOURDHUI_AGENDA,
  NOMS_JOURS,
  NOMS_MOIS,
  creneauDe,
  debutSemaine,
  detecterConflits,
  heureDe,
  memeJour,
  type Calendrier,
  type EvenementAgenda,
} from '@/lib/agenda'

export type Vue = 'jour' | 'semaine' | 'mois'

const HEURE_DEBUT = 7
const HEURE_FIN = 23
const HAUTEUR_HEURE = 52

function couleurDe(e: EvenementAgenda, calendriers: Calendrier[]) {
  return calendriers.find((c) => c.id === e.calendrierId)?.couleur ?? '#2364AA'
}

/* ------------------------- Barre de période ------------------------- */

export function BarrePeriode({
  vue,
  onVue,
  reference,
  onDecaler,
  onAujourdhui,
}: {
  vue: Vue
  onVue: (v: Vue) => void
  reference: Date
  onDecaler: (n: number) => void
  onAujourdhui: () => void
}) {
  const debut = debutSemaine(reference)
  const fin = new Date(debut.getTime() + 6 * 86400000)

  const titre =
    vue === 'jour'
      ? `${NOMS_JOURS[(reference.getUTCDay() + 6) % 7]} ${reference.getUTCDate()} ${NOMS_MOIS[reference.getUTCMonth()]} ${reference.getUTCFullYear()}`
      : vue === 'semaine'
        ? `${debut.getUTCDate()} ${NOMS_MOIS[debut.getUTCMonth()]} – ${fin.getUTCDate()} ${NOMS_MOIS[fin.getUTCMonth()]} ${fin.getUTCFullYear()}`
        : `${NOMS_MOIS[reference.getUTCMonth()]} ${reference.getUTCFullYear()}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        <Button variant="icon" size="sm" label="Période précédente" onClick={() => onDecaler(-1)}>
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onAujourdhui}>
          Aujourd’hui
        </Button>
        <Button variant="icon" size="sm" label="Période suivante" onClick={() => onDecaler(1)}>
          <ChevronRight aria-hidden className="h-4 w-4" />
        </Button>
        <h2 aria-live="polite" className="ml-2 font-display text-[0.9375rem] font-semibold capitalize text-ink-900">
          {titre}
        </h2>
      </div>

      <div role="group" aria-label="Vue de l’agenda" className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5">
        {(['jour', 'semaine', 'mois'] as Vue[]).map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={vue === v}
            onClick={() => onVue(v)}
            className={cn(
              'h-7 rounded-md px-2.5 text-xs font-medium capitalize transition-colors',
              vue === v ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100',
            )}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------ Pastille ---------------------------- */

function Pastille({
  evenement,
  calendriers,
  tous,
  compact,
  style,
}: {
  evenement: EvenementAgenda
  calendriers: Calendrier[]
  tous: EvenementAgenda[]
  compact?: boolean
  style?: React.CSSProperties
}) {
  const navigate = useNavigate()
  const couleur = couleurDe(evenement, calendriers)
  const conflits = detecterConflits(evenement, tous)
  const annule = evenement.statut === 'annule'

  return (
    <button
      type="button"
      onClick={() => navigate(`/agenda/${evenement.id}`)}
      style={{ ...style, borderLeftColor: couleur, backgroundColor: annule ? undefined : `${couleur}14` }}
      className={cn(
        'overflow-hidden rounded border-l-[3px] px-1.5 text-left transition-colors',
        annule ? 'bg-ink-100 text-ink-500 line-through' : 'hover:brightness-95',
        compact ? 'w-full py-0.5' : 'py-1',
      )}
      title={`${evenement.titre} — ${creneauDe(evenement)}${conflits.length > 0 ? ' — conflit d’horaire' : ''}`}
    >
      <span className={cn('flex items-center gap-1 truncate font-medium', compact ? 'text-2xs' : 'text-xs')}>
        {conflits.length > 0 && !annule && <AlertTriangle aria-hidden className="h-3 w-3 shrink-0 text-danger-600" />}
        {evenement.titre}
      </span>
      {!compact && (
        <span className="ac-num block truncate text-2xs text-ink-600">
          {evenement.journeeEntiere ? 'Journée entière' : `${heureDe(evenement.debut)} – ${heureDe(evenement.fin)}`}
          {evenement.lieu ? ` · ${evenement.lieu}` : ''}
        </span>
      )}
      {compact && !evenement.journeeEntiere && (
        <span className="ac-num block text-[0.5rem] text-ink-600">{heureDe(evenement.debut)}</span>
      )}
    </button>
  )
}

/* ------------------------------ Vue jour ---------------------------- */

export function VueJour({
  jour,
  evenements,
  calendriers,
  tous,
}: {
  jour: Date
  evenements: EvenementAgenda[]
  calendriers: Calendrier[]
  tous: EvenementAgenda[]
}) {
  const duJour = evenements.filter((e) => memeJour(e.debut, jour))
  const journee = duJour.filter((e) => e.journeeEntiere)
  const horaires = duJour.filter((e) => !e.journeeEntiere)
  const heures = Array.from({ length: HEURE_FIN - HEURE_DEBUT }, (_, i) => HEURE_DEBUT + i)

  if (duJour.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-300 bg-ink-25 px-4 py-12 text-center">
        <CalendarDays aria-hidden className="mx-auto h-7 w-7 text-ink-500" />
        <p className="mt-2 text-[0.8125rem] font-medium text-ink-800">Aucun événement ce jour</p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-500">
          La journée est libre. Créez un événement ou changez de date.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white">
      {journee.length > 0 && (
        <div className="flex flex-col gap-1 border-b border-ink-100 p-2">
          <p className="px-1 text-2xs font-semibold uppercase tracking-wide text-ink-500">Journée entière</p>
          {journee.map((e) => (
            <Pastille key={e.id} evenement={e} calendriers={calendriers} tous={tous} />
          ))}
        </div>
      )}

      <div className="relative" style={{ height: `${heures.length * HAUTEUR_HEURE}px` }}>
        {heures.map((h, i) => (
          <div key={h} className="absolute inset-x-0 border-t border-ink-100" style={{ top: `${i * HAUTEUR_HEURE}px` }}>
            <span className="ac-num absolute -top-2 left-2 bg-white px-1 text-2xs text-ink-500">{String(h).padStart(2, '0')}:00</span>
          </div>
        ))}

        <div className="absolute inset-y-0 left-16 right-2">
          {horaires.map((e) => {
            const d = new Date(e.debut)
            const f = new Date(e.fin)
            const minutesDebut = (d.getUTCHours() - HEURE_DEBUT) * 60 + d.getUTCMinutes()
            const duree = Math.max((f.getTime() - d.getTime()) / 60000, 30)
            return (
              <Pastille
                key={e.id}
                evenement={e}
                calendriers={calendriers}
                tous={tous}
                style={{
                  position: 'absolute',
                  top: `${Math.max((minutesDebut / 60) * HAUTEUR_HEURE, 0)}px`,
                  height: `${(duree / 60) * HAUTEUR_HEURE}px`,
                  left: 0,
                  right: 0,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------- Vue semaine --------------------------- */

export function VueSemaine({
  reference,
  evenements,
  calendriers,
  tous,
}: {
  reference: Date
  evenements: EvenementAgenda[]
  calendriers: Calendrier[]
  tous: EvenementAgenda[]
}) {
  const debut = debutSemaine(reference)
  const jours = Array.from({ length: 7 }, (_, i) => new Date(debut.getTime() + i * 86400000))
  const heures = Array.from({ length: HEURE_FIN - HEURE_DEBUT }, (_, i) => HEURE_DEBUT + i)

  return (
    <div className="ac-scroll overflow-x-auto rounded-xl border border-ink-200 bg-white">
      <div className="min-w-[52rem]">
        <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-ink-100">
          <span />
          {jours.map((j) => {
            const estAujourdhui = memeJour(j, AUJOURDHUI_AGENDA)
            return (
              <div key={j.toISOString()} className="border-l border-ink-100 px-2 py-2 text-center">
                <p className="text-2xs uppercase tracking-wide text-ink-500">{NOMS_JOURS[(j.getUTCDay() + 6) % 7].slice(0, 3)}</p>
                <p
                  className={cn(
                    'ac-num mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[0.8125rem] font-semibold',
                    estAujourdhui ? 'bg-brand-500 text-white' : 'text-ink-800',
                  )}
                >
                  {j.getUTCDate()}
                </p>
              </div>
            )
          })}
        </div>

        {/* Événements sur la journée entière */}
        <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-ink-100">
          <span className="px-2 py-1 text-right text-2xs text-ink-500">journée</span>
          {jours.map((j) => (
            <div key={j.toISOString()} className="flex flex-col gap-0.5 border-l border-ink-100 p-1">
              {evenements
                .filter((e) => e.journeeEntiere && memeJour(e.debut, j))
                .map((e) => (
                  <Pastille key={e.id} evenement={e} calendriers={calendriers} tous={tous} compact />
                ))}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))]">
          <div className="relative" style={{ height: `${heures.length * HAUTEUR_HEURE}px` }}>
            {heures.map((h, i) => (
              <span key={h} className="ac-num absolute right-2 text-2xs text-ink-500" style={{ top: `${i * HAUTEUR_HEURE - 6}px` }}>
                {String(h).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {jours.map((j) => (
            <div
              key={j.toISOString()}
              className="relative border-l border-ink-100"
              style={{ height: `${heures.length * HAUTEUR_HEURE}px` }}
            >
              {heures.map((h, i) => (
                <div key={h} aria-hidden className="absolute inset-x-0 border-t border-ink-100" style={{ top: `${i * HAUTEUR_HEURE}px` }} />
              ))}
              {evenements
                .filter((e) => !e.journeeEntiere && memeJour(e.debut, j))
                .map((e) => {
                  const d = new Date(e.debut)
                  const f = new Date(e.fin)
                  const minutesDebut = (d.getUTCHours() - HEURE_DEBUT) * 60 + d.getUTCMinutes()
                  const duree = Math.max((f.getTime() - d.getTime()) / 60000, 30)
                  return (
                    <Pastille
                      key={e.id}
                      evenement={e}
                      calendriers={calendriers}
                      tous={tous}
                      compact
                      style={{
                        position: 'absolute',
                        top: `${Math.max((minutesDebut / 60) * HAUTEUR_HEURE, 0)}px`,
                        height: `${(duree / 60) * HAUTEUR_HEURE}px`,
                        left: '2px',
                        right: '2px',
                      }}
                    />
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ Vue mois ---------------------------- */

export function VueMois({
  reference,
  evenements,
  calendriers,
  tous,
}: {
  reference: Date
  evenements: EvenementAgenda[]
  calendriers: Calendrier[]
  tous: EvenementAgenda[]
}) {
  const annee = reference.getUTCFullYear()
  const mois = reference.getUTCMonth()
  const premier = (new Date(Date.UTC(annee, mois, 1)).getUTCDay() + 6) % 7
  const nbJours = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate()

  const cellules: (Date | null)[] = [
    ...Array.from({ length: premier }, () => null),
    ...Array.from({ length: nbJours }, (_, i) => new Date(Date.UTC(annee, mois, i + 1))),
  ]
  while (cellules.length % 7 !== 0) cellules.push(null)

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">
          Agenda de {NOMS_MOIS[mois]} {annee}
        </caption>
        <thead>
          <tr>
            {NOMS_JOURS.map((j) => (
              <th key={j} scope="col" className="border-b border-ink-100 px-2 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">
                {j.slice(0, 3)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cellules.length / 7 }, (_, s) => (
            <tr key={s}>
              {cellules.slice(s * 7, s * 7 + 7).map((j, i) => {
                const duJour = j ? evenements.filter((e) => memeJour(e.debut, j)) : []
                const estAujourdhui = j ? memeJour(j, AUJOURDHUI_AGENDA) : false
                return (
                  <td key={i} className={cn('h-28 border border-ink-100 align-top p-1', !j && 'bg-ink-25')}>
                    {j && (
                      <>
                        <span
                          className={cn(
                            'ac-num inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-2xs font-semibold',
                            estAujourdhui ? 'bg-brand-500 text-white' : 'text-ink-600',
                          )}
                        >
                          {j.getUTCDate()}
                        </span>
                        <div className="mt-1 flex flex-col gap-0.5">
                          {duJour.slice(0, 3).map((e) => (
                            <Pastille key={e.id} evenement={e} calendriers={calendriers} tous={tous} compact />
                          ))}
                          {duJour.length > 3 && <span className="px-1 text-[0.5rem] text-ink-500">+{duJour.length - 3} autre(s)</span>}
                        </div>
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

/* ------------------------ Équivalent textuel ------------------------ */

export function ListeEvenements({ evenements, calendriers }: { evenements: EvenementAgenda[]; calendriers: Calendrier[] }) {
  const navigate = useNavigate()
  if (evenements.length === 0) return null
  return (
    <ul className="divide-y divide-ink-100 rounded-xl border border-ink-200 bg-white">
      {evenements.map((e) => (
        <li key={e.id}>
          <button
            type="button"
            onClick={() => navigate(`/agenda/${e.id}`)}
            className="flex w-full flex-wrap items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-ink-25"
          >
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: couleurDe(e, calendriers) }} />
            <span className="ac-num w-28 shrink-0 text-xs text-ink-500">{creneauDe(e)}</span>
            <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-ink-900">{e.titre}</span>
            {e.lieu && (
              <span className="hidden items-center gap-1 text-xs text-ink-500 sm:flex">
                <MapPin aria-hidden className="h-3 w-3" />
                {e.lieu}
              </span>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}
