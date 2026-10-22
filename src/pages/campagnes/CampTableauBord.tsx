import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Megaphone, Plus, RefreshCw, Send, UserRound } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { CourbesSuperposees } from '@/components/ui/Chart'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid } from '@/components/data/DataGrid'
import { CampNav, CampOutils } from '@/components/campagnes/CampNav'
import { useCampagnes } from '@/context/CampagnesContext'
import {
  calculerKpis,
  cibleNom,
  serieEnvoisOuvertures,
  statutCampagneStatusKey,
  statsCampagne,
  statutCampagneLabels,
  type Campagne,
} from '@/lib/campagnes'
import { formatDate, cn } from '@/lib/utils'

function Preparations({ campagnes }: { campagnes: Campagne[] }) {
  const navigate = useNavigate()
  const { envoiEnCours } = useCampagnes()
  const ordre: Record<string, number> = { brouillon: 0, programmee: 1, en_cours: 2 }
  const classes: Record<string, string> = {
    brouillon: 'text-ink-500',
    programmee: 'text-warning-600',
    en_cours: 'text-success-600',
  }

  if (campagnes.length === 0) {
    return (
      <p className="text-[0.8125rem] text-ink-500">
        Aucune campagne en préparation. Lancez la première pour tester le circuit d’envoi.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-ink-100">
      {campagnes
        .slice()
        .sort((a, b) => ordre[a.statut] - ordre[b.statut] || (a.creeLe < b.creeLe ? -1 : 1))
        .map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => navigate(`/campagnes-emailing/${c.id}`)}
              className="flex w-full flex-col gap-1.5 px-1 py-3 text-left"
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className={cn('min-w-0 flex-1 truncate text-[0.8125rem] font-medium', classes[c.statut])}>
                  {c.nom}
                </span>
                <StatusBadge status={statutCampagneStatusKey[c.statut]} />
              </span>

              {c.statut === 'en_cours' && (
                <span className="flex items-center gap-2 text-2xs text-ink-500">
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span className="block h-full rounded-full bg-brand-500" style={{ width: `${c.envoiProgression}%` }} />
                  </span>
                  {envoiEnCours ? 'Envoi en cours…' : `${c.envoiProgression} %`}
                </span>
              )}

              <span className="text-2xs text-ink-500">
                {c.statut === 'programmee' && c.programmeeLe
                  ? `Départ programmé le ${formatDate(c.programmeeLe)} à ${c.programmeeLe.slice(11, 16)}`
                  : c.statut === 'brouillon'
                    ? `Brouillon — ${c.objet ? 'prêt à finaliser' : 'sans objet : impossible d’envoyer'}`
                    : 'En cours de départ'}
              </span>
            </button>
          </li>
        ))}
    </ul>
  )
}

export function CampTableauBord() {
  usePageTitle("Campagnes d'emailing")

  const navigate = useNavigate()
  const { campagnes, desinscriptions, chargement, erreur, recharger } = useCampagnes()

  if (erreur && !chargement) {
    return (
      <Page
        header={
          <PageHeader
            eyebrow="Campagne d’emailing"
            title="Tableau de bord"
            description="Vue d'ensemble des envois groupés de l'association."
            actions={<CampOutils />}
          />
        }
      >
        <CampNav />
        <Alert tone="danger" titre="Les campagnes n'ont pas pu être chargées" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucune campagne n'a été perdue.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page
        header={
          <PageHeader
            eyebrow="Campagne d’emailing"
            title="Tableau de bord"
            description="Vue d'ensemble des envois groupés de l'association."
            actions={<CampOutils />}
          />
        }
      >
        <CampNav />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="mb-2 h-3 w-24" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="mt-3 h-3 w-32" />
            </Card>
          ))}
        </div>
        <Card className="p-4">
          <Skeleton className="h-48 w-full" />
        </Card>
      </Page>
    )
  }

  if (campagnes.length === 0) {
    return (
      <Page
        header={
          <PageHeader
            eyebrow="Campagne d’emailing"
            title="Tableau de bord"
            description="Vue d'ensemble des envois groupés de l'association."
            actions={
              <>
                <CampOutils />
                <Button variant="primary" onClick={() => navigate('/campagnes-emailing/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                  Nouvelle campagne
                </Button>
              </>
            }
          />
        }
      >
        <CampNav />
        <Card>
          <EmptyState
            icon={<Megaphone />}
            title="Aucune campagne"
            description="Les envois groupés aux adhérents et aux contacts apparaîtront ici, avec leur taux d'ouverture et de clic."
            action={<Button variant="primary" onClick={() => navigate('/campagnes-emailing/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>Créer une campagne</Button>}
          />
        </Card>
      </Page>
    )
  }

  const kpis = calculerKpis(campagnes, desinscriptions)
  const serie = serieEnvoisOuvertures(campagnes)
  const enPreparation = campagnes.filter((c) => ['brouillon', 'programmee', 'en_cours'].includes(c.statut))
  const envoyees = campagnes
    .filter((c) => c.statut === 'envoyee')
    .sort((a, b) => (a.envoyeLe! < b.envoyeLe! ? 1 : -1))
  const enEchec = campagnes.find((c) => c.statut === 'echec')

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Campagne d’emailing"
          title="Tableau de bord"
          description="Vue d'ensemble des envois groupés : ce qui est parti, lu, cliqué, et ce qui se prépare."
          actions={
            <>
              <CampOutils />
              <Button variant="primary" onClick={() => navigate('/campagnes-emailing/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouvelle campagne
              </Button>
            </>
          }
        />
      }
    >
      <CampNav />

      {enEchec && (
        <Alert
          tone="danger"
          titre="Un envoi est resté en échec"
          action={<Button onClick={() => navigate(`/campagnes-emailing/${enEchec.id}`)} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Relancer l’envoi</Button>}
        >
          « {enEchec.nom} » n'a pas atteint ses destinataires. Vous pouvez le relancer sans reconstruire la campagne.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Campagnes envoyées"
          value={String(kpis.envoyees)}
          hint="sur les six derniers mois"
        />
        <KpiCard
          label="Destinataires atteints"
          value={kpis.destinataires.toLocaleString('fr-FR')}
          hint="toutes campagnes confondues"
        />
        <KpiCard
          label="Taux d’ouverture moyen"
          value={String(kpis.tauxOuvertureMoyen)}
          unit="%"
          hint="sur les campagnes envoyées"
        />
        <KpiCard
          label="Taux de clic moyen"
          value={String(kpis.tauxClicMoyen)}
          unit="%"
          hint="sur les campagnes envoyées"
        />
        <KpiCard
          label="Désinscriptions"
          value={String(kpis.desinscriptions)}
          hint="retraits définitifs recueillis"
        />
        <KpiCard
          label="En préparation"
          value={String(kpis.enPreparation)}
          hint="brouillons, programmées, en cours"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Envois et ouvertures"
            description="Nombre de messages envoyés et ouverts, mois après mois."
          />
          <CardBody>
            <CourbesSuperposees
              labels={serie.labels}
              titre="Envois et ouvertures des six derniers mois"
              series={[
                { nom: 'Envoyés', couleur: '#2364AA', valeurs: serie.envois },
                { nom: 'Ouverts', couleur: '#12A07B', valeurs: serie.ouvertures },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="En préparation" description="Ce qui n'est pas encore parti." />
          <CardBody className="pt-2">
            <Preparations campagnes={enPreparation} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Dernières campagnes envoyées"
          description="Cliquez sur une campagne pour en ouvrir le détail."
          action={<Button size="sm" variant="ghost" onClick={() => navigate('/campagnes-emailing/liste')}>Toutes les campagnes</Button>}
        />
        <CardBody>
          <DataGrid
            rows={envoyees}
            caption="Campagnes envoyées récemment."
            searchKeys={(r) => `${r.nom} ${cibleNom(r.cible)}`}
            searchPlaceholder="Rechercher une campagne…"
            onRowClick={(r) => navigate(`/campagnes-emailing/${r.id}`)}
            getRowLabel={(r) => r.nom}
            columns={[
              {
                id: 'nom',
                header: 'Campagne',
                cell: (r) => <span className="font-medium text-ink-900">{r.nom}</span>,
                sortValue: (r) => r.nom,
              },
              {
                id: 'cible',
                header: 'Destinataires',
                cell: (r) => (
                  <span className="flex items-center gap-1.5">
                    <UserRound aria-hidden className="h-3.5 w-3.5 text-ink-400" />
                    {r.destinataires.length}
                  </span>
                ),
                sortValue: (r) => r.destinataires.length,
              },
              {
                id: 'ouverture',
                header: 'Ouverture',
                cell: (r) => `${statsCampagne(r).tauxOuverture} %`,
                sortValue: (r) => statsCampagne(r).tauxOuverture,
                align: 'right',
              },
              {
                id: 'clics',
                header: 'Clics',
                cell: (r) => `${statsCampagne(r).tauxClic} %`,
                sortValue: (r) => statsCampagne(r).tauxClic,
                align: 'right',
              },
              {
                id: 'statut',
                header: 'Statut',
                cell: (r) => <StatusBadge status={statutCampagneStatusKey[r.statut]} />,
              },
              {
                id: 'date',
                header: 'Envoyée le',
                cell: (r) => (
                  <span className="flex items-center gap-1.5 text-ink-600">
                    <Send aria-hidden className="h-3.5 w-3.5 text-ink-400" />
                    {r.envoyeLe ? formatDate(r.envoyeLe) : '—'}
                  </span>
                ),
                sortValue: (r) => r.envoyeLe ?? '',
              },
            ]}
          />
        </CardBody>
      </Card>
    </Page>
  )
}