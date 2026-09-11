import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, ArchiveRestore, BarChart3, ClipboardList, Copy, Eye, Inbox, Plus, RefreshCw, SquarePen, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { FormulairesNav, FormulairesOutils } from '@/components/formulaires/FormulairesNav'
import { cleStatutFormulaire } from '@/components/formulaires/statuts'
import { useFormulaires } from '@/context/FormulairesContext'
import { useToast } from '@/context/ToastContext'
import {
  categoriesFormulaire,
  champsSaisissables,
  statutFormulaireLabels,
  type Formulaire,
} from '@/lib/formulaires'
import { formatDate } from '@/lib/utils'

function useColonnes(): Column<Formulaire>[] {
  return [
    {
      id: 'titre',
      header: 'Formulaire',
      sortValue: (r) => r.titre,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.titre || 'Sans titre'}</p>
          {r.description && <p className="truncate text-xs text-ink-500">{r.description}</p>}
        </div>
      ),
    },
    {
      id: 'categorie',
      header: 'Catégorie',
      optional: true,
      sortValue: (r) => r.categorie,
      cell: (r) => (r.categorie ? <Badge variant="outline">{r.categorie}</Badge> : <span className="text-ink-400">Non classé</span>),
    },
    { id: 'champs', header: 'Champs', align: 'right', optional: true, sortValue: (r) => champsSaisissables(r).length, cell: (r) => <span className="ac-num">{champsSaisissables(r).length}</span> },
    { id: 'reponses', header: 'Réponses', align: 'right', sortValue: (r) => r.reponses.length, cell: (r) => <span className="ac-num">{r.reponses.length}</span> },
    { id: 'modifie', header: 'Modifié le', sortValue: (r) => r.modifieLe, cell: (r) => <span className="ac-num">{formatDate(r.modifieLe)}</span> },
    { id: 'statut', header: 'Statut', align: 'right', sortValue: (r) => r.statut, cell: (r) => <StatusBadge status={cleStatutFormulaire[r.statut]} /> },
  ]
}

export function ListeFormulaires() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { formulaires, chargement, erreur, recharger, dupliquer, archiver } = useFormulaires()
  const [enCours, setEnCours] = useState(false)
  const colonnes = useColonnes()

  const lignes = formulaires.filter((f) => f.statut !== 'archive')

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

  const filters: FilterDef<Formulaire>[] = [
    {
      id: 'statut',
      label: 'Statut',
      options: (['brouillon', 'publie', 'ferme'] as const).map((s) => ({ value: s, label: statutFormulaireLabels[s] })),
      match: (r, v) => r.statut === v,
    },
    {
      id: 'categorie',
      label: 'Catégorie',
      options: categoriesFormulaire.map((c) => ({ value: c, label: c })),
      match: (r, v) => r.categorie === v,
    },
  ]

  const enTete = (
    <PageHeader
      eyebrow="Formulaires"
      title="Formulaires"
      description="Formulaires d'adhésion, d'inscription ou de contact, à publier par lien public ou à intégrer sur votre site."
      meta={<Badge variant="brand">{lignes.length} formulaire(s)</Badge>}
      actions={
        <>
          <FormulairesOutils />
          <Button variant="primary" onClick={() => navigate('/formulaires/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouveau formulaire
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <FormulairesNav />
        <Alert tone="danger" titre="La liste n'a pas pu être chargée" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && lignes.length === 0) {
    return (
      <Page header={enTete}>
        <FormulairesNav />
        <Card>
          <EmptyState
            icon={<ClipboardList />}
            title="Aucun formulaire pour l'instant"
            description="Créez votre premier formulaire : adhésion en ligne, inscription à un atelier, appel à bénévoles."
            action={
              <Button variant="primary" onClick={() => navigate('/formulaires/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Créer un formulaire
              </Button>
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <FormulairesNav />

      <DataGrid
        rows={lignes}
        columns={colonnes}
        filters={filters}
        loading={chargement}
        caption="Formulaires"
        searchKeys={(r) => `${r.titre} ${r.description} ${r.categorie}`}
        searchPlaceholder="Rechercher un formulaire…"
        getRowLabel={(r) => r.titre || 'Sans titre'}
        onRowClick={(r) => navigate(`/formulaires/${r.id}/editeur`)}
        emptyIcon={<ClipboardList />}
        emptyTitle="Aucun formulaire ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre."
        rowActions={[
          { label: 'Ouvrir l’éditeur', icon: <SquarePen />, onSelect: (r) => navigate(`/formulaires/${r.id}/editeur`) },
          { label: 'Prévisualiser', icon: <Eye />, onSelect: (r) => navigate(`/formulaires/${r.id}/apercu`) },
          { label: 'Voir les réponses', icon: <Inbox />, onSelect: (r) => navigate(`/formulaires/${r.id}/reponses`) },
          { label: 'Statistiques', icon: <BarChart3 />, onSelect: (r) => navigate(`/formulaires/${r.id}/statistiques`) },
          {
            label: 'Dupliquer',
            icon: <Copy />,
            separatorBefore: true,
            onSelect: (r: Formulaire) =>
              void executer(async () => {
                const copie = await dupliquer(r.id)
                navigate(`/formulaires/${copie.id}/editeur`)
              }, { titre: 'Formulaire dupliqué', detail: `« Copie de ${r.titre} » a été créée en brouillon.` }),
          },
          {
            label: 'Archiver',
            icon: <Archive />,
            onSelect: (r: Formulaire) =>
              void executer(() => archiver(r.id), { titre: 'Formulaire archivé', detail: `${r.titre} a été déplacé vers les archives.` }),
          },
        ]}
      />
      <p className="text-xs text-ink-500">La suppression d’un formulaire se fait depuis ses paramètres.</p>
      <span className="sr-only" aria-live="polite">{enCours ? 'Traitement en cours' : ''}</span>
    </Page>
  )
}

export function FormulairesArchives() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { formulaires, chargement, erreur, recharger, desarchiver, supprimer } = useFormulaires()
  const [aSupprimer, setASupprimer] = useState<Formulaire | null>(null)
  const [enCours, setEnCours] = useState(false)
  const colonnes = useColonnes()

  const lignes = formulaires.filter((f) => f.statut === 'archive')

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

  const enTete = (
    <PageHeader
      eyebrow="Formulaires"
      title="Formulaires archivés"
      description="Formulaires clos et rangés. Leurs réponses restent consultables ; désarchivez-les pour les modifier à nouveau."
      meta={<Badge variant="brand">{lignes.length} formulaire(s)</Badge>}
      actions={<FormulairesOutils />}
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <FormulairesNav />
        <Alert tone="danger" titre="La liste n'a pas pu être chargée" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && lignes.length === 0) {
    return (
      <Page header={enTete}>
        <FormulairesNav />
        <Card>
          <EmptyState icon={<Archive />} title="Aucun formulaire archivé" description="Les formulaires que vous archivez apparaîtront ici." />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <FormulairesNav />

      <DataGrid
        rows={lignes}
        columns={colonnes}
        loading={chargement}
        caption="Formulaires archivés"
        searchKeys={(r) => `${r.titre} ${r.description} ${r.categorie}`}
        searchPlaceholder="Rechercher un formulaire archivé…"
        getRowLabel={(r) => r.titre || 'Sans titre'}
        onRowClick={(r) => navigate(`/formulaires/${r.id}/reponses`)}
        emptyIcon={<Archive />}
        emptyTitle="Aucun formulaire ne correspond"
        emptyDescription="Élargissez la recherche."
        rowActions={[
          { label: 'Voir les réponses', icon: <Inbox />, onSelect: (r) => navigate(`/formulaires/${r.id}/reponses`) },
          { label: 'Statistiques', icon: <BarChart3 />, onSelect: (r) => navigate(`/formulaires/${r.id}/statistiques`) },
          {
            label: 'Désarchiver',
            icon: <ArchiveRestore />,
            onSelect: (r: Formulaire) =>
              void executer(() => desarchiver(r.id), { titre: 'Formulaire désarchivé', detail: `${r.titre} est revenu en brouillon.` }),
          },
          { label: 'Supprimer', icon: <Trash2 />, danger: true, separatorBefore: true, onSelect: (r: Formulaire) => setASupprimer(r) },
        ]}
      />

      <ConfirmDialog
        open={!!aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const f = aSupprimer
          setASupprimer(null)
          if (f) void executer(() => supprimer(f.id), { titre: 'Formulaire supprimé', detail: `${f.titre} a été supprimé définitivement.` })
        }}
        title="Supprimer définitivement ce formulaire ?"
        description={`« ${aSupprimer?.titre} », ses ${aSupprimer?.reponses.length ?? 0} réponse(s) et son historique seront définitivement supprimés.`}
        confirmLabel="Supprimer définitivement"
      />
      <span className="sr-only" aria-live="polite">{enCours ? 'Traitement en cours' : ''}</span>
    </Page>
  )
}
