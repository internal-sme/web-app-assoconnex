import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarDays, Plus, RefreshCw } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Checkbox } from '@/components/ui/Toggle'
import { AgendaNav, AgendaOutils } from '@/components/agenda/AgendaNav'
import { BarrePeriode, ListeEvenements, VueJour, VueMois, VueSemaine, type Vue } from '@/components/agenda/Vues'
import { useAgenda } from '@/context/AgendaContext'
import {
  AUJOURDHUI_AGENDA,
  MOI_AGENDA,
  calculerKpisAgenda,
  creneauDe,
  detecterConflits,
  memeJour,
} from '@/lib/agenda'
import { formatDate } from '@/lib/utils'

export type PortefeuilleAgenda = 'personnel' | 'association' | 'partages'

const meta: Record<PortefeuilleAgenda, { titre: string; description: string; vide: string }> = {
  personnel: {
    titre: 'Mon agenda',
    description: 'Vos rendez-vous personnels et les événements auxquels vous êtes convié.',
    vide: 'Aucun événement vous concernant. Créez-en un ou attendez une invitation.',
  },
  association: {
    titre: 'Agenda de l’association',
    description: 'Assemblées, conseils, permanences et événements publics, visibles de tous les membres.',
    vide: 'Aucun événement associatif planifié.',
  },
  partages: {
    titre: 'Agendas partagés',
    description: 'Les agendas des sections. Cochez ceux que vous souhaitez superposer.',
    vide: 'Aucun événement sur les agendas partagés actifs.',
  },
}

export function AgendaVues({ portefeuille }: { portefeuille: PortefeuilleAgenda }) {
  usePageTitle('Agenda')

  const navigate = useNavigate()
  const { evenements, calendriers, chargement, erreur, recharger, basculerCalendrier } = useAgenda()

  const [vue, setVue] = useState<Vue>(portefeuille === 'personnel' ? 'semaine' : 'mois')
  const [reference, setReference] = useState(new Date(AUJOURDHUI_AGENDA))

  const calendriersVisibles = calendriers.filter((c) => {
    if (portefeuille === 'personnel') return c.actif
    if (portefeuille === 'association') return c.visibilite === 'association' && c.actif
    return c.visibilite === 'partage' && c.actif
  })

  const lignes = evenements.filter((e) => {
    if (!calendriersVisibles.some((c) => c.id === e.calendrierId)) return false
    if (portefeuille === 'personnel') {
      return e.organisateur === MOI_AGENDA.nom || e.participants.some((p) => p.estMoi)
    }
    return true
  })

  const kpis = calculerKpisAgenda(lignes)
  const conflits = lignes.filter((e) => e.statut !== 'annule' && detecterConflits(e, evenements).length > 0)
  const aujourdhui = lignes.filter((e) => memeJour(e.debut, AUJOURDHUI_AGENDA) && e.statut !== 'annule')
  const invitations = lignes.filter(
    (e) => e.statut !== 'annule' && new Date(e.debut) >= AUJOURDHUI_AGENDA && e.participants.some((p) => p.estMoi && p.reponse === 'attente'),
  )

  const decaler = (n: number) => {
    setReference((d) => {
      if (vue === 'jour') return new Date(d.getTime() + n * 86400000)
      if (vue === 'semaine') return new Date(d.getTime() + n * 7 * 86400000)
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))
    })
  }

  const enTete = (
    <PageHeader
      eyebrow="Agenda"
      title={meta[portefeuille].titre}
      description={meta[portefeuille].description}
      meta={<Badge variant="brand">{lignes.length} événements</Badge>}
      actions={
        <>
          <AgendaOutils />
          <Button variant="primary" onClick={() => navigate('/agenda/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouvel événement
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <AgendaNav />
        <Alert tone="danger" titre="L'agenda n'a pas pu être chargé" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucun événement n'a été perdu.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <AgendaNav />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-14" />
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-4 h-64 w-full" />
        </Card>
      </Page>
    )
  }

  if (evenements.length === 0) {
    return (
      <Page header={enTete}>
        <AgendaNav />
        <Card>
          <EmptyState
            icon={<CalendarDays />}
            title="Agenda vide"
            description="Aucun événement n'est enregistré. Créez le premier, ou connectez un agenda externe pour importer les vôtres."
            action={
              <Button variant="primary" onClick={() => navigate('/agenda/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Créer un événement
              </Button>
            }
            secondaryAction={<Button onClick={() => navigate('/agenda/synchronisation')}>Connecter un agenda</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <AgendaNav />

      {conflits.length > 0 && (
        <Alert tone="warning" titre={`${conflits.length} événement(s) en conflit d'horaire`}>
          Une salle réservée deux fois, ou un participant requis attendu à deux endroits. Les créneaux concernés portent
          un triangle d'alerte dans les vues ci-dessous.
        </Alert>
      )}

      {invitations.length > 0 && (
        <Alert
          tone="warning"
          titre={`${invitations.length} invitation(s) sans réponse`}
          action={<Button size="sm" onClick={() => navigate(`/agenda/${invitations[0].id}`)}>Répondre</Button>}
        >
          L'organisateur attend votre réponse pour arrêter le nombre de participants.
        </Alert>
      )}

      <section aria-label="Indicateurs de l’agenda" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Aujourd'hui" value={String(kpis.aujourdhui)} hint={formatDate(AUJOURDHUI_AGENDA.toISOString())} />
        <KpiCard label="Cette semaine" value={String(kpis.cetteSemaine)} hint="Du lundi au dimanche" />
        <KpiCard label="Sans réponse" value={String(kpis.sansReponse)} hint="Invitations en attente de votre part" />
        <KpiCard label="Conflits" value={String(kpis.conflits)} hint="Salle ou participant en double" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="flex flex-col gap-3">
          <BarrePeriode
            vue={vue}
            onVue={setVue}
            reference={reference}
            onDecaler={decaler}
            onAujourdhui={() => setReference(new Date(AUJOURDHUI_AGENDA))}
          />

          {vue === 'jour' && <VueJour jour={reference} evenements={lignes} calendriers={calendriers} tous={evenements} />}
          {vue === 'semaine' && <VueSemaine reference={reference} evenements={lignes} calendriers={calendriers} tous={evenements} />}
          {vue === 'mois' && <VueMois reference={reference} evenements={lignes} calendriers={calendriers} tous={evenements} />}

          {lignes.length === 0 && (
            <Card>
              <EmptyState
                icon={<CalendarDays />}
                title="Rien à afficher ici"
                description={meta[portefeuille].vide}
                compact
                action={<Button variant="primary" onClick={() => navigate('/agenda/nouveau')}>Créer un événement</Button>}
              />
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Calendriers" description="Cochez pour superposer." />
            <CardBody className="flex flex-col gap-2.5">
              {calendriers.map((c) => (
                <div key={c.id} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: c.couleur }} />
                  <Checkbox
                    checked={c.actif}
                    onChange={() => basculerCalendrier(c.id)}
                    label={c.nom}
                    description={c.description}
                  />
                </div>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Aujourd'hui" description={aujourdhui.length === 0 ? 'Journée libre.' : `${aujourdhui.length} événement(s).`} />
            {aujourdhui.length === 0 ? (
              <EmptyState icon={<CalendarDays />} title="Rien de prévu" description="Aucun événement aujourd'hui." compact />
            ) : (
              <ul className="divide-y divide-ink-100">
                {aujourdhui.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/agenda/${e.id}`)}
                      className="flex w-full flex-col gap-0.5 px-5 py-2.5 text-left transition-colors hover:bg-ink-25"
                    >
                      <span className="truncate text-[0.8125rem] font-medium text-ink-900">{e.titre}</span>
                      <span className="ac-num truncate text-xs text-ink-500">{creneauDe(e)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {conflits.length > 0 && (
            <Card>
              <CardHeader title="Conflits détectés" />
              <ul className="divide-y divide-ink-100">
                {conflits.slice(0, 4).map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/agenda/${e.id}`)}
                      className="flex w-full items-start gap-2 px-5 py-2.5 text-left transition-colors hover:bg-ink-25"
                    >
                      <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-600" />
                      <span className="min-w-0">
                        <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{e.titre}</span>
                        <span className="ac-num block truncate text-xs text-ink-500">
                          {formatDate(e.debut)} · {creneauDe(e)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader
          title="Prochains événements"
          description="Liste des créneaux à venir, utile en complément des vues calendaires."
        />
        <CardBody>
          <ListeEvenements
            evenements={lignes
              .filter((e) => new Date(e.debut) >= AUJOURDHUI_AGENDA)
              .slice(0, 10)}
            calendriers={calendriers}
          />
        </CardBody>
      </Card>
    </Page>
  )
}
