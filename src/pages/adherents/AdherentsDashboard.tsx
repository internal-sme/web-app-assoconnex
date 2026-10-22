import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, FlaskConical, List, Plus, RefreshCw, Settings2, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge, Chip } from '@/components/ui/Badge'
import { Menu } from '@/components/ui/Menu'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { GroupedBars, HorizontalBars, LineChart } from '@/components/ui/Chart'
import { StatusBadge } from '@/components/ui/Status'
import { useAdherents, type ModeDemoAdherents } from '@/context/AdherentsContext'
import {
  EXERCICE_COURANT,
  calculerKpis,
  serieAges,
  serieEvolution,
  serieNouveauxVsRenouvellements,
  statutAdhesion,
} from '@/lib/adherents'
import { formatMoney } from '@/lib/utils'

const modes: { value: ModeDemoAdherents; label: string }[] = [
  { value: 'normal', label: 'Données normales' },
  { value: 'chargement', label: 'Chargement' },
  { value: 'vide', label: 'Aucun adhérent' },
  { value: 'erreur', label: 'Erreur de chargement' },
  { value: 'echec', label: 'Échec de sauvegarde' },
]

export function AdherentsDashboard() {
  usePageTitle('Adhésions')

  const navigate = useNavigate()
  const { adherents, types, chargement, erreur, recharger, mode, setMode } = useAdherents()

  const kpis = calculerKpis(adherents, types)
  const evolution = serieEvolution(adherents)
  const nouveauxVsRenouv = serieNouveauxVsRenouvellements(adherents)
  const ages = serieAges(adherents)

  const aRelancer = adherents
    .filter((a) => ['expirant', 'expiree'].includes(statutAdhesion(a)))
    .sort((a, b) => (a.dateFin < b.dateFin ? -1 : 1))
    .slice(0, 6)

  const enTete = (
    <PageHeader
      eyebrow="Adhésions"
      title="Tableau de bord des adhérents"
      description={`Vue d'ensemble de l'exercice ${EXERCICE_COURANT} : effectifs, renouvellements et encaissements.`}
      meta={
        mode !== 'normal' ? (
          <Chip icon={<FlaskConical aria-hidden className="h-3 w-3" />}>
            Démo : {modes.find((m) => m.value === mode)?.label}
          </Chip>
        ) : undefined
      }
      actions={
        <>
          <Menu
            label="États de démonstration"
            width="w-60"
            items={modes.map((m) => ({ label: (mode === m.value ? '✓ ' : '') + m.label, onSelect: () => setMode(m.value) }))}
            trigger={({ toggle, open, ref }) => (
              <Button ref={ref} onClick={toggle} aria-expanded={open} aria-haspopup="menu" iconLeft={<FlaskConical aria-hidden className="h-4 w-4" />}>
                États
              </Button>
            )}
          />
          <Button onClick={() => navigate('/adherents/types')} iconLeft={<Settings2 aria-hidden className="h-4 w-4" />}>
            Types d'adhésion
          </Button>
          <Button onClick={() => navigate('/adherents/liste')} iconLeft={<List aria-hidden className="h-4 w-4" />}>
            Liste des adhérents
          </Button>
          <Button variant="primary" onClick={() => navigate('/adherents/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouvelle adhésion
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <Alert
          tone="danger"
          titre="Les adhésions n'ont pas pu être chargées"
          action={
            <Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>
              Réessayer
            </Button>
          }
        >
          {erreur} Aucune donnée n'a été perdue.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-16" />
              <Skeleton className="mt-3 h-3 w-32" />
            </Card>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="p-5 lg:col-span-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-40 w-full" />
          </Card>
        </div>
      </Page>
    )
  }

  if (adherents.length === 0) {
    return (
      <Page header={enTete}>
        <Card>
          <EmptyState
            icon={<Users />}
            title="Aucun adhérent enregistré"
            description="Les indicateurs et les graphiques s'afficheront dès la première adhésion. Vérifiez d'abord que vos types d'adhésion sont configurés."
            action={
              <Button variant="primary" onClick={() => navigate('/adherents/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Enregistrer une adhésion
              </Button>
            }
            secondaryAction={<Button onClick={() => navigate('/adherents/types')}>Configurer les types</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <section aria-label="Indicateurs des adhésions" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Adhérents" value={String(kpis.actifs)} hint={`sur ${kpis.total} fiches, désactivations comprises`} />
        <KpiCard label="Nouveaux adhérents" value={String(kpis.nouveaux)} hint="sur les douze derniers mois" />
        <KpiCard label="Renouvellements" value={String(kpis.renouvellements)} hint="sur les douze derniers mois" />
        <KpiCard
          label="Taux de renouvellement"
          value={String(kpis.tauxRenouvellement)}
          unit="%"
          trend={{
            direction: kpis.tauxRenouvellement >= 75 ? 'up' : 'down',
            value: kpis.tauxRenouvellement >= 75 ? 'bon' : 'à surveiller',
            description: 'des adhérents éligibles',
          }}
        />
        <KpiCard label="Expirent bientôt" value={String(kpis.expirantBientot)} hint="dans les 45 prochains jours" />
        <KpiCard label="Adhésions expirées" value={String(kpis.expirees)} hint="échéance dépassée, à relancer" />
        <KpiCard label="Cotisations encaissées" value={formatMoney(kpis.encaisse)} hint="sur les douze derniers mois" />
        <KpiCard label="Reste à encaisser" value={formatMoney(kpis.aEncaisser)} hint="toutes cotisations non soldées" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader title="Évolution des adhérents" description="Adhésions en cours à la fin de chaque mois, sur douze mois." />
          <CardBody>
            <LineChart points={evolution} titre="Évolution du nombre d'adhérents sur douze mois" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Nouveaux et renouvellements" description="Par exercice, du plus ancien au plus récent." />
          <CardBody>
            <GroupedBars
              titre="Nouvelles adhésions et renouvellements par exercice"
              colonneLabel="Exercice"
              data={nouveauxVsRenouv}
              series={[
                { key: 'nouveaux', label: 'Nouveaux', couleur: '#2364AA' },
                { key: 'renouvellements', label: 'Renouvellements', couleur: '#8DB5DE', motif: true },
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Répartition par âge" description="Tranches calculées à la date du jour." />
          <CardBody>
            <HorizontalBars titre="Répartition des adhérents par tranche d'âge" data={ages} total={adherents.length} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="À relancer en priorité"
          description="Adhésions expirées ou arrivant à échéance."
          action={
            <Button size="sm" onClick={() => navigate('/adherents/liste')}>
              Voir toute la liste
            </Button>
          }
        />
        {aRelancer.length === 0 ? (
          <EmptyState icon={<AlertTriangle />} title="Rien à relancer" description="Toutes les adhésions sont à jour." compact />
        ) : (
          <ul className="divide-y divide-ink-100">
            {aRelancer.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/adherents/${a.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium text-ink-900">
                      {a.prenom} {a.nom}
                    </p>
                    <p className="ac-num truncate text-xs text-ink-500">
                      {a.numero} · échéance le {new Date(a.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Badge variant="outline">{a.cotisations[a.cotisations.length - 1]?.typeNom}</Badge>
                  <StatusBadge status={statutAdhesion(a) === 'expirant' ? 'adhesion_expirant' : 'adhesion_expiree'} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  )
}
