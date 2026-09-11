import { useNavigate } from 'react-router-dom'
import { AlertTriangle, FolderKanban, Plus, RefreshCw, Target } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { GroupedBars } from '@/components/ui/Chart'
import { StatusBadge } from '@/components/ui/Status'
import { ProjetsNav, ProjetsOutils, cleStatutProjet } from '@/components/projets/ProjetsNav'
import { useProjets } from '@/context/ProjetsContext'
import { useTaches } from '@/context/TachesContext'
import {
  AUJOURDHUI_PROJET,
  avancementTemporel,
  budgetProjet,
  calculerKpisProjets,
  joursAvantFin,
  niveauRisque,
  statutProjetLabels,
  type Projet,
} from '@/lib/projets'
import { formatDate, formatMoney } from '@/lib/utils'

export function CarteProjet({ projet, onOuvrir, nbTaches }: { projet: Projet; onOuvrir: () => void; nbTaches: number }) {
  const b = budgetProjet(projet)
  const temps = avancementTemporel(projet)
  const jours = joursAvantFin(projet)
  const risques = projet.risques.filter((r) => r.statut === 'ouvert' && niveauRisque(r) === 'eleve').length

  return (
    <button
      type="button"
      onClick={onOuvrir}
      className="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-ink-300 hover:bg-ink-25"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="ac-num text-2xs font-semibold uppercase tracking-wide text-ink-500">{projet.code}</p>
          <p className="mt-0.5 truncate font-display text-[0.9375rem] font-semibold text-ink-900">{projet.nom}</p>
        </div>
        <StatusBadge status={cleStatutProjet[projet.statut]} />
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-ink-500">{projet.description}</p>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-2xs">
        <div className="flex justify-between">
          <dt className="text-ink-500">Tâches</dt>
          <dd className="ac-num font-medium text-ink-800">{nbTaches}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Échéance</dt>
          <dd className="ac-num font-medium text-ink-800">{formatDate(projet.dateFin)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Budget</dt>
          <dd className={cn('ac-num font-medium', b.depasse ? 'text-danger-600' : 'text-ink-800')}>{b.consomme} %</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-ink-500">Temps écoulé</dt>
          <dd className="ac-num font-medium text-ink-800">{temps} %</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-1.5">
        <span aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <span className={cn('block h-full rounded-full', b.depasse ? 'bg-danger-500' : 'bg-brand-500')} style={{ width: `${Math.min(b.consomme, 100)}%` }} />
        </span>
        <span className="ac-num text-2xs text-ink-500">
          {formatMoney(b.depensesRealisees)} engagés sur {formatMoney(b.depensesPrevues)}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-ink-100 pt-2.5">
        {b.depasse && <StatusBadge status="budget_depasse" />}
        {risques > 0 && <Badge variant="outline">{risques} risque(s) élevé(s)</Badge>}
        {projet.statut !== 'cloture' && jours >= 0 && jours <= 30 && <Badge variant="outline">Fin dans {jours} j</Badge>}
      </div>
    </button>
  )
}

export function ProjetsDashboard() {
  const navigate = useNavigate()
  const { projets, chargement, erreur, recharger } = useProjets()
  const { taches } = useTaches()

  const kpis = calculerKpisProjets(projets)
  const actifs = projets.filter((p) => p.statut !== 'cloture')
  const nbTaches = (id: string) => taches.filter((t) => t.projetId === id).length

  const comparatif = actifs.map((p) => {
    const b = budgetProjet(p)
    return { label: p.code, prevu: Math.round(b.depensesPrevues), realise: Math.round(b.depensesRealisees) }
  })

  const alertes = actifs.flatMap((p) => {
    const b = budgetProjet(p)
    const out: { projet: Projet; texte: string; tone: 'danger' | 'warning' }[] = []
    if (b.depasse) out.push({ projet: p, texte: `Budget dépassé de ${formatMoney(b.ecart)}`, tone: 'danger' })
    for (const j of p.jalons.filter((x) => x.statut === 'manque')) out.push({ projet: p, texte: `Jalon manqué : ${j.nom}`, tone: 'danger' })
    for (const r of p.risques.filter((x) => x.statut === 'ouvert' && niveauRisque(x) === 'eleve'))
      out.push({ projet: p, texte: `Risque élevé : ${r.libelle}`, tone: 'warning' })
    return out
  })

  const enTete = (
    <PageHeader
      eyebrow="Projets"
      title="Tableau de bord des projets"
      description="Où en est chaque projet : avancement dans le temps, consommation du budget, jalons et risques."
      actions={
        <>
          <ProjetsOutils />
          <Button variant="primary" onClick={() => navigate('/projets/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouveau projet
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <ProjetsNav />
        <Alert tone="danger" titre="Les projets n'ont pas pu être chargés" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucun projet n'a été perdu.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <ProjetsNav />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-16" />
            </Card>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-2 h-4 w-40" />
              <Skeleton className="mt-4 h-2 w-full" />
            </Card>
          ))}
        </div>
      </Page>
    )
  }

  if (projets.length === 0) {
    return (
      <Page header={enTete}>
        <ProjetsNav />
        <Card>
          <EmptyState
            icon={<FolderKanban />}
            title="Aucun projet"
            description="Un projet regroupe des tâches, un budget, une équipe et des jalons. Créez le premier pour piloter une action de bout en bout."
            action={
              <Button variant="primary" onClick={() => navigate('/projets/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Créer un projet
              </Button>
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ProjetsNav />

      {kpis.budgetsDepasses > 0 && (
        <Alert
          tone="warning"
          titre={`${kpis.budgetsDepasses} projet(s) au-delà de leur budget`}
          action={<Button size="sm" onClick={() => navigate('/projets/liste')}>Voir la liste</Button>}
        >
          Les dépenses engagées dépassent l'enveloppe votée. Arbitrez ou demandez un budget rectificatif au bureau.
        </Alert>
      )}

      <section aria-label="Indicateurs des projets" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Projets actifs" value={String(kpis.enCours + kpis.enPreparation)} hint={`${kpis.enCours} en cours, ${kpis.enPreparation} en préparation`} />
        <KpiCard label="Budget engagé" value={formatMoney(kpis.depenseTotale)} hint={`sur ${formatMoney(kpis.budgetTotal)} prévus`} />
        <KpiCard label="Budgets dépassés" value={String(kpis.budgetsDepasses)} hint="Projets en cours" />
        <KpiCard label="Projets clôturés" value={String(kpis.clotures)} hint="Consultables en lecture seule" />
        <KpiCard label="Risques élevés" value={String(kpis.risquesEleves)} hint="Ouverts, probabilité et impact forts" />
        <KpiCard label="Jalons manqués" value={String(kpis.jalonsManques)} hint="Échéance dépassée sans livrable" />
        <KpiCard label="Jalons à venir" value={String(kpis.jalonsProches)} hint="Dans les trente prochains jours" />
        <KpiCard label="Tâches rattachées" value={String(taches.filter((t) => t.projetId).length)} hint="Sur l'ensemble des projets" />
      </section>

      <Card>
        <CardHeader title="Budget prévu et engagé" description="Par projet actif, en euros." />
        <CardBody>
          <GroupedBars
            titre="Comparaison du budget prévu et engagé par projet"
            colonneLabel="Projet"
            formatValeur={(v) => formatMoney(v)}
            data={comparatif}
            series={[
              { key: 'prevu', label: 'Prévu', couleur: '#8DB5DE', motif: true },
              { key: 'realise', label: 'Engagé', couleur: '#2364AA' },
            ]}
          />
        </CardBody>
      </Card>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold tracking-tight text-ink-950">Projets actifs</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {actifs.map((p) => (
            <CarteProjet key={p.id} projet={p} nbTaches={nbTaches(p.id)} onOuvrir={() => navigate(`/projets/${p.id}`)} />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title="Points d'attention" description="Dépassements, jalons manqués et risques élevés sur les projets actifs." />
        {alertes.length === 0 ? (
          <EmptyState icon={<Target />} title="Aucun point d'attention" description="Tous les projets tiennent leur budget et leurs jalons." compact />
        ) : (
          <ul className="divide-y divide-ink-100">
            {alertes.map((a, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => navigate(`/projets/${a.projet.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                >
                  <AlertTriangle aria-hidden className={cn('h-4 w-4 shrink-0', a.tone === 'danger' ? 'text-danger-600' : 'text-warning-600')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{a.texte}</span>
                    <span className="ac-num block truncate text-xs text-ink-500">
                      {a.projet.code} · {a.projet.nom}
                    </span>
                  </span>
                  <StatusBadge status={cleStatutProjet[a.projet.statut]} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  )
}
