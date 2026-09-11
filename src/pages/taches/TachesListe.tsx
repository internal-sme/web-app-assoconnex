import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Eye, ListChecks, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/ui/Avatar'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { TachesNav, TachesOutils } from '@/components/taches/TachesNav'
import { BadgeStatut, EtatVide, SelecteurVue, VueCalendrier, VueKanban } from '@/components/taches/Vues'
import { useTaches } from '@/context/TachesContext'
import { useToast } from '@/context/ToastContext'
import {
  AUJOURDHUI_TACHE,
  COLONNES,
  MOI_TACHE,
  avancementChecklist,
  enRetard,
  equipe,
  etiquettesDisponibles,
  joursRestants,
  prioriteLabels,
  statutTacheLabels,
  type Priorite,
  type StatutTache,
  type Tache,
} from '@/lib/taches'
import { formatDate } from '@/lib/utils'

export type VueTaches = 'mes-taches' | 'toutes' | 'equipe' | 'retard' | 'terminees'

const meta: Record<VueTaches, { titre: string; description: string; vide: string }> = {
  'mes-taches': {
    titre: 'Mes tâches',
    description: 'Les tâches dont vous êtes responsable, hors tâches closes.',
    vide: 'Aucune tâche ne vous est assignée. Profitez-en.',
  },
  toutes: {
    titre: 'Toutes les tâches',
    description: 'L’ensemble des tâches de l’association, tous responsables et tous statuts confondus.',
    vide: 'Aucune tâche enregistrée pour l’instant.',
  },
  equipe: {
    titre: 'Tâches de l’équipe',
    description: 'Les tâches confiées aux autres membres, pour savoir qui fait quoi.',
    vide: 'Aucune tâche assignée à un autre membre de l’équipe.',
  },
  retard: {
    titre: 'Tâches en retard',
    description: 'Échéance dépassée sans que la tâche soit close. À traiter en priorité.',
    vide: 'Aucun retard. Toutes les échéances sont tenues.',
  },
  terminees: {
    titre: 'Tâches terminées',
    description: 'Les tâches closes et validées, conservées pour mémoire.',
    vide: 'Aucune tâche terminée pour l’instant.',
  },
}

export function TachesListe({ vue }: { vue: VueTaches }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { taches, chargement, erreur, recharger, changerStatut, supprimer } = useTaches()

  const [affichage, setAffichage] = useState<'kanban' | 'liste' | 'calendrier'>(vue === 'terminees' ? 'liste' : 'kanban')
  const [aSupprimer, setASupprimer] = useState<Tache | null>(null)
  const [enCours, setEnCours] = useState(false)

  const lignes = taches.filter((t) => {
    if (vue === 'mes-taches') return t.responsable === MOI_TACHE && t.statut !== 'termine'
    if (vue === 'equipe') return t.responsable !== MOI_TACHE && t.statut !== 'termine'
    if (vue === 'retard') return enRetard(t)
    if (vue === 'terminees') return t.statut === 'termine'
    return true
  })

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const deplacer = (id: string, statut: StatutTache) => {
    const t = taches.find((x) => x.id === id)
    if (!t || t.statut === statut) return
    void executer(() => changerStatut(id, statut), {
      titre: 'Tâche déplacée',
      detail: `« ${t.titre} » passe en ${statutTacheLabels[statut].toLowerCase()}.`,
    })
  }

  const columns: Column<Tache>[] = [
    {
      id: 'titre',
      header: 'Tâche',
      sortValue: (r) => r.titre,
      cell: (r) => {
        const c = avancementChecklist(r)
        return (
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{r.titre}</p>
            <p className="ac-num truncate text-xs text-ink-500">
              {r.reference}
              {c ? ` · checklist ${c.faits}/${c.total}` : ''}
            </p>
          </div>
        )
      },
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
      id: 'echeance',
      header: 'Échéance',
      sortValue: (r) => r.echeance,
      cell: (r) => {
        const j = joursRestants(r)
        return (
          <span className="ac-num">
            {formatDate(r.echeance)}
            {r.statut !== 'termine' && (
              <span className={`ml-1.5 text-xs ${j < 0 ? 'font-medium text-danger-600' : j <= 7 ? 'text-warning-600' : 'text-ink-500'}`}>
                {j < 0 ? `+${-j} j` : `dans ${j} j`}
              </span>
            )}
          </span>
        )
      },
    },
    {
      id: 'priorite',
      header: 'Priorité',
      optional: true,
      sortValue: (r) => ['basse', 'normale', 'haute', 'critique'].indexOf(r.priorite),
      cell: (r) => <Badge variant="outline">{prioriteLabels[r.priorite]}</Badge>,
    },
    { id: 'charge', header: 'Charge', align: 'right', optional: true, defaultHidden: true, sortValue: (r) => r.chargeEstimee, cell: (r) => <span className="ac-num">{r.chargeEstimee} h</span> },
    {
      id: 'statut',
      header: 'Statut',
      align: 'right',
      sortValue: (r) => r.statut,
      cell: (r) => <BadgeStatut statut={r.statut} />,
    },
  ]

  const filters: FilterDef<Tache>[] = [
    { id: 'statut', label: 'Statut', options: COLONNES.map((c) => ({ value: c.id, label: c.label })), match: (r, v) => r.statut === v },
    { id: 'responsable', label: 'Responsable', options: equipe.map((e) => ({ value: e.nom, label: e.nom })), match: (r, v) => r.responsable === v },
    {
      id: 'priorite',
      label: 'Priorité',
      options: (Object.keys(prioriteLabels) as Priorite[]).map((p) => ({ value: p, label: prioriteLabels[p] })),
      match: (r, v) => r.priorite === v,
    },
    { id: 'etiquette', label: 'Étiquette', options: etiquettesDisponibles.map((e) => ({ value: e, label: e })), match: (r, v) => r.etiquettes.includes(v) },
  ]

  const m = meta[vue]

  const enTete = (
    <PageHeader
      eyebrow="Tâches"
      title={m.titre}
      description={m.description}
      meta={<Badge variant="brand">{lignes.length} tâches</Badge>}
      actions={
        <>
          <SelecteurVue vue={affichage} onChange={setAffichage} />
          <TachesOutils />
          <Button variant="primary" onClick={() => navigate('/taches/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouvelle tâche
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <TachesNav />
        <Alert tone="danger" titre="Les tâches n'ont pas pu être chargées" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucune tâche n'a été perdue.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <TachesNav />
        <Card>
          <SkeletonTable rows={7} />
        </Card>
      </Page>
    )
  }

  if (taches.length === 0) {
    return (
      <Page header={enTete}>
        <TachesNav />
        <Card>
          <EtatVide onCreer={() => navigate('/taches/nouvelle')} />
        </Card>
      </Page>
    )
  }

  if (lignes.length === 0) {
    return (
      <Page header={enTete}>
        <TachesNav />
        <Card>
          <EmptyState
            icon={vue === 'retard' ? <CheckCircle2 /> : <ListChecks />}
            title="Rien à afficher ici"
            description={m.vide}
            action={<Button variant="primary" onClick={() => navigate('/taches/toutes')}>Voir toutes les tâches</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <TachesNav />

      {vue === 'retard' && (
        <Alert tone="danger" titre={`${lignes.length} tâche(s) au-delà de leur échéance`}>
          Reprogrammez l'échéance ou faites avancer la tâche. Une échéance dépassée qui traîne fausse tout le pilotage.
        </Alert>
      )}

      {affichage === 'kanban' && (
        <VueKanban taches={lignes} onDeplacer={deplacer} onCreer={() => navigate('/taches/nouvelle')} />
      )}

      {affichage === 'liste' && (
        <DataGrid
          rows={lignes}
          columns={columns}
          filters={filters}
          caption={m.titre}
          searchKeys={(r) => `${r.titre} ${r.reference} ${r.description} ${r.responsable} ${r.etiquettes.join(' ')}`}
          searchPlaceholder="Rechercher un titre, un responsable, une étiquette…"
          getRowLabel={(r) => r.titre}
          onRowClick={(r) => navigate(`/taches/${r.id}`)}
          emptyIcon={<ListChecks />}
          emptyTitle="Aucune tâche ne correspond"
          emptyDescription="Élargissez la recherche ou retirez un filtre."
          rowActions={[
            { label: 'Ouvrir la fiche', icon: <Eye />, onSelect: (r) => navigate(`/taches/${r.id}`) },
            { label: 'Modifier', icon: <Pencil />, onSelect: (r) => navigate(`/taches/${r.id}/modifier`) },
            {
              label: 'Marquer comme terminée',
              icon: <CheckCircle2 />,
              onSelect: (r) => void executer(() => changerStatut(r.id, 'termine'), { titre: 'Tâche terminée', detail: r.titre }),
            },
            { label: 'Supprimer', icon: <Trash2 />, danger: true, separatorBefore: true, onSelect: (r) => setASupprimer(r) },
          ]}
          bulkActions={(selected, clear) => (
            <>
              <Button
                size="sm"
                iconLeft={<CheckCircle2 aria-hidden className="h-3.5 w-3.5" />}
                onClick={() => {
                  void executer(
                    async () => {
                      for (const t of selected) await changerStatut(t.id, 'termine')
                    },
                    { titre: `${selected.length} tâche(s) terminées`, detail: 'Elles passent en colonne Terminé.' },
                  )
                  clear()
                }}
              >
                Marquer terminées
              </Button>
              <Button size="sm" variant="ghost" onClick={clear}>Vider la sélection</Button>
            </>
          )}
        />
      )}

      {affichage === 'calendrier' && <VueCalendrier taches={lignes} reference={AUJOURDHUI_TACHE} />}

      <ConfirmDialog
        open={!!aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const t = aSupprimer!
          setASupprimer(null)
          void executer(() => supprimer(t.id), { titre: 'Tâche supprimée', detail: `« ${t.titre} » a été retirée.` })
        }}
        title={`Supprimer « ${aSupprimer?.titre} » ?`}
        description="La tâche, ses commentaires, sa checklist et son historique seront définitivement supprimés."
        confirmLabel="Supprimer définitivement"
      />
    </Page>
  )
}
