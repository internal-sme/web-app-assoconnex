import { useNavigate } from 'react-router-dom'
import { CalendarDays, List, Plus, RefreshCw, Target } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { AnneauProgression, CourbesSuperposees, HorizontalBars } from '@/components/ui/Chart'
import { StatusBadge } from '@/components/ui/Status'
import { ActionsNav, ActionsOutils, cleAvancement } from '@/components/actions/ActionsNav'
import { useActions } from '@/context/ActionsContext'
import {
  avancementDe,
  calculerKpisActions,
  categorieDe,
  labelsMois,
  repartitionParCategorie,
  repartitionParType,
  serieParAnnee,
  typeDe,
} from '@/lib/actions'
import { formatDate } from '@/lib/utils'

export function ActionsDashboard() {
  const navigate = useNavigate()
  const { actions, chargement, erreur, recharger } = useActions()

  const kpis = calculerKpisActions(actions)
  const series = serieParAnnee(actions)
  const parType = repartitionParType(actions)
  const parCategorie = repartitionParCategorie(actions)

  const aVenir = actions
    .filter((a) => avancementDe(a) === 'a_venir')
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(0, 5)

  const dernieresPubliees = actions
    .filter((a) => a.publiee && a.publieeLe)
    .sort((a, b) => (a.publieeLe! < b.publieeLe! ? 1 : -1))
    .slice(0, 5)

  const enTete = (
    <PageHeader
      eyebrow="Actions associatives"
      title="Tableau de bord des actions"
      description="Ce que l'association a mené, seule ou avec les associations de la ville, et ce qui est publié sur l'application mobile."
      actions={
        <>
          <ActionsOutils />
          <Button onClick={() => navigate('/actions/liste')} iconLeft={<List aria-hidden className="h-4 w-4" />}>
            Liste des actions
          </Button>
          <Button variant="primary" onClick={() => navigate('/actions/liste?nouvelle=1')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Ajouter une action
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <ActionsNav />
        <Alert tone="danger" titre="Les actions n'ont pas pu être chargées" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucune action n'a été perdue.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <ActionsNav />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-16" />
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-4 h-48 w-full" />
        </Card>
      </Page>
    )
  }

  if (actions.length === 0) {
    return (
      <Page header={enTete}>
        <ActionsNav />
        <Card>
          <EmptyState
            icon={<Target />}
            title="Aucune action enregistrée"
            description="Les actions associatives constituent la mémoire de ce que fait l'association, et alimentent le rapport d'activité comme les dossiers de subvention."
            action={
              <Button variant="primary" onClick={() => navigate('/actions/liste?nouvelle=1')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Ajouter une action
              </Button>
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ActionsNav />

      <section aria-label="Indicateurs des actions" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Actions enregistrées" value={String(kpis.total)} hint={`${kpis.realisees} réalisées`} />
        <KpiCard label="Publiées sur l'application" value={String(kpis.publiees)} hint="Visibles du public" />
        <KpiCard label="Menées en partenariat" value={String(kpis.partenariats)} hint="Avec d'autres associations de la ville" />
        <KpiCard label="À venir" value={String(kpis.aVenir)} hint="Programmées, pas encore tenues" />
        <KpiCard label="Bénéficiaires touchés" value={String(kpis.beneficiaires)} hint="Cumul des bilans renseignés" />
        <KpiCard label="Heures de bénévolat" value={String(kpis.heuresBenevolat)} unit="h" hint="Valorisables au rapport d'activité" />
        <KpiCard label="Types d'action" value={String(parType.length)} hint="Chacun porte son appel à l'action" />
        <KpiCard label="Catégories couvertes" value={String(parCategorie.length)} hint="Champs d'intervention" />
      </section>

      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Réalisés" description="Part des actions tenues, publiées et menées en partenariat." />
          <CardBody className="flex flex-col gap-4">
            <AnneauProgression
              titre="Part des actions réalisées, publiées et menées en partenariat"
              valeur={kpis.realisees}
              segments={[
                { label: 'Réalisées', part: kpis.total === 0 ? 0 : kpis.realisees / kpis.total, couleur: '#2364AA' },
                { label: 'Publiées', part: kpis.total === 0 ? 0 : kpis.publiees / kpis.total, couleur: '#5892C9' },
                { label: 'En partenariat', part: kpis.total === 0 ? 0 : kpis.partenariats / kpis.total, couleur: '#8DB5DE' },
              ]}
            />
            <ul className="flex flex-col gap-1.5">
              {[
                ['Réalisées', kpis.realisees, '#2364AA'],
                ['Publiées', kpis.publiees, '#5892C9'],
                ['En partenariat', kpis.partenariats, '#8DB5DE'],
              ].map(([label, valeur, couleur]) => (
                <li key={String(label)} className="flex items-center gap-2 text-xs text-ink-600">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: String(couleur) }} />
                  <span className="flex-1">{label}</span>
                  <span className="ac-num font-medium text-ink-800">{valeur}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Nombre total d'actions par année" description="Par mois, sur les trois dernières années." />
          <CardBody>
            <CourbesSuperposees labels={labelsMois} series={series} titre="Nombre d'actions par mois et par année" />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Répartition par type" description="Chaque type porte son appel à l'action sur le mobile." />
          <CardBody>
            <HorizontalBars titre="Répartition des actions par type" data={parType} total={parType.reduce((s, x) => s + x.valeur, 0)} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Répartition par catégorie" description="Champs d'intervention de l'association." />
          <CardBody>
            <HorizontalBars titre="Répartition des actions par catégorie" data={parCategorie} total={parCategorie.reduce((s, x) => s + x.valeur, 0)} />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Actions à venir"
            description={aVenir.length === 0 ? 'Aucune action programmée.' : `${aVenir.length} action(s) programmées.`}
            action={<Button size="sm" onClick={() => navigate('/actions/liste')}>Tout voir</Button>}
          />
          {aVenir.length === 0 ? (
            <EmptyState icon={<CalendarDays />} title="Rien de programmé" description="Ajoutez une action pour la faire connaître au public." compact />
          ) : (
            <ul className="divide-y divide-ink-100">
              {aVenir.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/actions/${a.id}`)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                  >
                    <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-25 text-base">
                      {a.visuel}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{a.titre}</span>
                      <span className="ac-num block truncate text-xs text-ink-500">
                        {formatDate(a.date)} · {a.ville} · {typeDe(a)?.nom}
                      </span>
                    </span>
                    <StatusBadge status={cleAvancement[avancementDe(a)]} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Dernières publications" description="Actions rendues visibles du public sur l'application." />
          {dernieresPubliees.length === 0 ? (
            <EmptyState icon={<Target />} title="Aucune publication" description="Aucune action n'est encore visible du public." compact />
          ) : (
            <ul className="divide-y divide-ink-100">
              {dernieresPubliees.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/actions/${a.id}`)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                  >
                    <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-25 text-base">
                      {a.visuel}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{a.titre}</span>
                      <span className="ac-num block truncate text-xs text-ink-500">
                        Publiée le {a.publieeLe ? formatDate(a.publieeLe) : '—'} · {categorieDe(a)?.nom}
                      </span>
                    </span>
                    <Badge variant="outline">{typeDe(a)?.callToAction}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}
