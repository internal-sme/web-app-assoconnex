import { useNavigate } from 'react-router-dom'
import { Eye, FolderKanban, Plus, RefreshCw } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { ProjetsNav, ProjetsOutils, cleStatutProjet } from '@/components/projets/ProjetsNav'
import { useProjets } from '@/context/ProjetsContext'
import { useTaches } from '@/context/TachesContext'
import { avancementTemporel, budgetProjet, statutProjetLabels, type Projet, type StatutProjet } from '@/lib/projets'
import { equipe } from '@/lib/taches'
import { formatDate, formatMoney } from '@/lib/utils'

export function ProjetsListe() {
  const navigate = useNavigate()
  const { projets, chargement, erreur, recharger } = useProjets()
  const { taches } = useTaches()

  const columns: Column<Projet>[] = [
    {
      id: 'nom',
      header: 'Projet',
      sortValue: (r) => r.nom,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.nom}</p>
          <p className="ac-num truncate text-xs text-ink-500">
            {r.code} · {taches.filter((t) => t.projetId === r.id).length} tâche(s)
          </p>
        </div>
      ),
    },
    {
      id: 'responsable',
      header: 'Responsable',
      sortValue: (r) => r.responsable,
      cell: (r) => (
        <span className="flex items-center gap-2">
          <Avatar name={r.responsable} size="xs" />
          <span className="truncate">{r.responsable}</span>
        </span>
      ),
    },
    {
      id: 'periode',
      header: 'Période',
      optional: true,
      sortValue: (r) => r.dateDebut,
      cell: (r) => (
        <span className="ac-num">
          {formatDate(r.dateDebut)} → {formatDate(r.dateFin)}
        </span>
      ),
    },
    {
      id: 'avancement',
      header: 'Temps écoulé',
      align: 'right',
      sortValue: (r) => avancementTemporel(r),
      cell: (r) => {
        const t = avancementTemporel(r)
        return (
          <span className="flex items-center justify-end gap-2">
            <span aria-hidden className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
              <span className="block h-full rounded-full bg-ink-500" style={{ width: `${t}%` }} />
            </span>
            <span className="ac-num w-10 text-right">{t} %</span>
          </span>
        )
      },
    },
    {
      id: 'budget',
      header: 'Budget consommé',
      align: 'right',
      sortValue: (r) => budgetProjet(r).consomme,
      cell: (r) => {
        const b = budgetProjet(r)
        return (
          <span className="flex items-center justify-end gap-2">
            <span aria-hidden className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
              <span className={`block h-full rounded-full ${b.depasse ? 'bg-danger-500' : 'bg-brand-500'}`} style={{ width: `${Math.min(b.consomme, 100)}%` }} />
            </span>
            <span className={`ac-num w-10 text-right ${b.depasse ? 'font-semibold text-danger-600' : ''}`}>{b.consomme} %</span>
          </span>
        )
      },
    },
    {
      id: 'montant',
      header: 'Dépenses',
      align: 'right',
      optional: true,
      defaultHidden: true,
      sortValue: (r) => budgetProjet(r).depensesRealisees,
      cell: (r) => <span className="ac-num">{formatMoney(budgetProjet(r).depensesRealisees)}</span>,
    },
    {
      id: 'statut',
      header: 'Statut',
      align: 'right',
      sortValue: (r) => r.statut,
      cell: (r) => <StatusBadge status={cleStatutProjet[r.statut]} />,
    },
  ]

  const filters: FilterDef<Projet>[] = [
    {
      id: 'statut',
      label: 'Statut',
      options: (Object.keys(statutProjetLabels) as StatutProjet[]).map((s) => ({ value: s, label: statutProjetLabels[s] })),
      match: (r, v) => r.statut === v,
    },
    { id: 'responsable', label: 'Responsable', options: equipe.map((e) => ({ value: e.nom, label: e.nom })), match: (r, v) => r.responsable === v },
    {
      id: 'budget',
      label: 'Budget',
      options: [
        { value: 'depasse', label: 'Dépassé' },
        { value: 'tenu', label: 'Tenu' },
      ],
      match: (r, v) => (v === 'depasse' ? budgetProjet(r).depasse : !budgetProjet(r).depasse),
    },
  ]

  const enTete = (
    <PageHeader
      eyebrow="Projets"
      title="Liste des projets"
      description="Tous les projets, actifs et clôturés. Le budget consommé rapporte les dépenses engagées à l'enveloppe votée."
      meta={<Badge variant="brand">{projets.length} projets</Badge>}
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
        <Alert tone="danger" titre="La liste n'a pas pu être chargée" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && projets.length === 0) {
    return (
      <Page header={enTete}>
        <ProjetsNav />
        <Card>
          <EmptyState
            icon={<FolderKanban />}
            title="Aucun projet"
            description="Créez un projet pour regrouper des tâches, un budget, une équipe et des jalons."
            action={<Button variant="primary" onClick={() => navigate('/projets/nouveau')}>Créer un projet</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ProjetsNav />

      <DataGrid
        rows={projets}
        columns={columns}
        filters={filters}
        loading={chargement}
        caption="Liste des projets de l'association"
        searchKeys={(r) => `${r.nom} ${r.code} ${r.description} ${r.responsable} ${r.objectif}`}
        searchPlaceholder="Rechercher un nom, un code, un responsable…"
        getRowLabel={(r) => r.nom}
        onRowClick={(r) => navigate(`/projets/${r.id}`)}
        emptyIcon={<FolderKanban />}
        emptyTitle="Aucun projet ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre."
        rowActions={[
          { label: 'Ouvrir la fiche', icon: <Eye />, onSelect: (r) => navigate(`/projets/${r.id}`) },
          { label: 'Voir les tâches', icon: <FolderKanban />, onSelect: (r) => navigate(`/projets/${r.id}?onglet=taches`) },
        ]}
      />
    </Page>
  )
}
