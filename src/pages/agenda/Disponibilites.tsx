import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { AgendaNav, AgendaOutils } from '@/components/agenda/AgendaNav'
import { useAgenda } from '@/context/AgendaContext'
import {
  AUJOURDHUI_AGENDA,
  NOMS_JOURS,
  NOMS_MOIS,
  heureDe,
  memeJour,
  occupationDuJour,
  personnes,
  sallesInitiales,
} from '@/lib/agenda'

const HEURE_DEBUT = 8
const HEURE_FIN = 22

export function Disponibilites() {
  const navigate = useNavigate()
  const { evenements, chargement } = useAgenda()

  const [jour, setJour] = useState(new Date(AUJOURDHUI_AGENDA))
  const [choisis, setChoisis] = useState<string[]>(personnes.slice(0, 4).map((p) => p.email))
  const [duree, setDuree] = useState('90')

  const heures = Array.from({ length: HEURE_FIN - HEURE_DEBUT }, (_, i) => HEURE_DEBUT + i)
  const equipe = personnes.filter((p) => choisis.includes(p.email))

  const occupe = (email: string, heure: number) =>
    occupationDuJour(email, jour, evenements).some((e) => {
      if (e.journeeEntiere) return true
      const d = new Date(e.debut)
      const f = new Date(e.fin)
      const debutHeure = d.getUTCHours() + d.getUTCMinutes() / 60
      const finHeure = f.getUTCHours() + f.getUTCMinutes() / 60
      return heure + 1 > debutHeure && heure < finHeure
    })

  // Créneaux où tout le monde est libre, de la durée demandée
  const creneauxLibres: { debut: number; fin: number }[] = []
  const pas = Math.max(1, Math.round(Number(duree) / 60))
  for (let h = HEURE_DEBUT; h + pas <= HEURE_FIN; h++) {
    const libre = Array.from({ length: pas }, (_, k) => h + k).every((x) => equipe.every((p) => !occupe(p.email, x)))
    if (libre) creneauxLibres.push({ debut: h, fin: h + pas })
  }

  const sallesLibres = sallesInitiales.filter(
    (s) =>
      !evenements.some(
        (e) => e.statut !== 'annule' && e.salleId === s.id && memeJour(e.debut, jour),
      ),
  )

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Agenda"
          title="Participants et disponibilités"
          description="Croisez les agendas de plusieurs personnes pour trouver un créneau où tout le monde est libre."
          actions={
            <>
              <AgendaOutils />
              <Button variant="primary" onClick={() => navigate('/agenda/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouvel événement
              </Button>
            </>
          }
        />
      }
    >
      <AgendaNav />

      <Card>
        <CardHeader title="Critères" />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Personnes à croiser" className="lg:col-span-2">
            {(p) => (
              <MultiSelect
                {...p}
                value={choisis}
                onChange={setChoisis}
                options={personnes.map((x) => ({ value: x.email, label: x.nom }))}
                placeholder="Choisir les personnes"
              />
            )}
          </Field>
          <Field label="Durée souhaitée" hint="Sert à repérer les créneaux assez longs.">
            {(p) => <Input {...p} type="number" min={30} step={30} suffix="min" value={duree} onChange={(e) => setDuree(e.target.value)} />}
          </Field>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="icon" size="sm" label="Jour précédent" onClick={() => setJour((d) => new Date(d.getTime() - 86400000))}>
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setJour(new Date(AUJOURDHUI_AGENDA))}>
            Aujourd'hui
          </Button>
          <Button variant="icon" size="sm" label="Jour suivant" onClick={() => setJour((d) => new Date(d.getTime() + 86400000))}>
            <ChevronRight aria-hidden className="h-4 w-4" />
          </Button>
          <h2 aria-live="polite" className="ml-2 font-display text-[0.9375rem] font-semibold capitalize text-ink-900">
            {NOMS_JOURS[(jour.getUTCDay() + 6) % 7]} {jour.getUTCDate()} {NOMS_MOIS[jour.getUTCMonth()]} {jour.getUTCFullYear()}
          </h2>
        </div>
        <Badge variant="brand">{creneauxLibres.length} créneau(x) commun(s)</Badge>
      </div>

      {equipe.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users />}
            title="Aucune personne sélectionnée"
            description="Choisissez au moins une personne pour afficher son agenda."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Grille des disponibilités" description="Une case pleine signale un engagement déjà pris." />
          <CardBody>
            <div className="ac-scroll overflow-x-auto">
              <table className="w-full min-w-[46rem] border-collapse text-left">
                <caption className="sr-only">
                  Disponibilités du {jour.getUTCDate()} {NOMS_MOIS[jour.getUTCMonth()]} {jour.getUTCFullYear()}
                </caption>
                <thead>
                  <tr>
                    <th scope="col" className="w-44 border-b border-ink-100 px-2 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">
                      Personne
                    </th>
                    {heures.map((h) => (
                      <th key={h} scope="col" className="ac-num border-b border-ink-100 px-0 py-2 text-center text-2xs font-semibold text-ink-500">
                        {h}h
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {equipe.map((p) => (
                    <tr key={p.email}>
                      <th scope="row" className="border-b border-ink-100 px-2 py-2">
                        <span className="flex items-center gap-2">
                          <Avatar name={p.nom} size="xs" />
                          <span className="truncate text-[0.8125rem] font-medium text-ink-900">{p.nom}</span>
                        </span>
                      </th>
                      {heures.map((h) => {
                        const pris = occupe(p.email, h)
                        return (
                          <td key={h} className="border-b border-l border-ink-100 p-0">
                            <span
                              className={cn('block h-8', pris ? 'bg-brand-500/70' : 'bg-success-50')}
                              title={`${p.nom} — ${h}h : ${pris ? 'occupé' : 'libre'}`}
                            >
                              <span className="sr-only">
                                {p.nom}, {h} heures : {pris ? 'occupé' : 'libre'}
                              </span>
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-ink-100 pt-3 text-2xs text-ink-500">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-4 rounded-sm bg-success-50 ring-1 ring-ink-200" />
                Libre
              </span>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-4 rounded-sm bg-brand-500/70" />
                Occupé
              </span>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Créneaux communs" description={`Plages de ${duree} minutes où tout le monde est libre.`} />
          {creneauxLibres.length === 0 ? (
            <EmptyState
              icon={<CalendarDays />}
              title="Aucun créneau commun"
              description="Réduisez la durée, retirez une personne facultative, ou essayez un autre jour."
              compact
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {creneauxLibres.map((c) => (
                <li key={c.debut} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="ac-num flex-1 text-[0.8125rem] font-medium text-ink-900">
                    {String(c.debut).padStart(2, '0')}:00 – {String(c.fin).padStart(2, '0')}:00
                  </span>
                  <Button size="sm" onClick={() => navigate('/agenda/nouveau')}>
                    Planifier ici
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Salles disponibles" description="Aucune réservation ce jour-là." />
          {sallesLibres.length === 0 ? (
            <EmptyState icon={<CalendarDays />} title="Toutes les salles sont prises" description="Chaque salle porte au moins une réservation ce jour." compact />
          ) : (
            <ul className="divide-y divide-ink-100">
              {sallesLibres.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{s.nom}</span>
                    <span className="ac-num block truncate text-xs text-ink-500">
                      {s.capacite} places · {s.equipements.join(', ')}
                    </span>
                  </span>
                  {s.capacite < equipe.length && <Badge variant="outline">Trop petite</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader title="Engagements du jour" description="Le détail de ce qui occupe chacun." />
        <CardBody className="flex flex-col gap-4">
          {equipe.map((p) => {
            const liste = occupationDuJour(p.email, jour, evenements)
            return (
              <div key={p.email}>
                <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-900">
                  <Avatar name={p.nom} size="xs" />
                  {p.nom}
                </p>
                {liste.length === 0 ? (
                  <p className="ml-7 mt-1 text-xs text-ink-500">Journée libre.</p>
                ) : (
                  <ul className="ml-7 mt-1 flex flex-col gap-1">
                    {liste.map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => navigate(`/agenda/${e.id}`)}
                          className="ac-num text-xs text-ink-600 underline-offset-2 hover:text-ink-900 hover:underline"
                        >
                          {e.journeeEntiere ? 'Journée entière' : `${heureDe(e.debut)} – ${heureDe(e.fin)}`} · {e.titre}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </CardBody>
      </Card>
      <span className="sr-only" aria-live="polite">{chargement ? 'Chargement' : ''}</span>
    </Page>
  )
}
