import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, LayoutDashboard, Mail, Plus, RefreshCw, RotateCw, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { cleAdhesion } from '@/components/adherents/statuts'
import { useAdherents } from '@/context/AdherentsContext'
import { useToast } from '@/context/ToastContext'
import { EXERCICES, joursAvant, resteDu, statutAdhesion, type Adherent } from '@/lib/adherents'
import { formatDate, formatMoney } from '@/lib/utils'

export function AdherentsListe() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { adherents, types, chargement, erreur, recharger } = useAdherents()

  const columns: Column<Adherent>[] = [
    {
      id: 'adherent',
      header: 'Adhérent',
      sortValue: (r) => `${r.nom} ${r.prenom}`,
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={`${r.prenom} ${r.nom}`} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">
              {r.prenom} {r.nom}
            </p>
            <p className="ac-num truncate text-xs text-ink-500">{r.numero}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type d’adhésion',
      sortValue: (r) => r.typeId,
      cell: (r) => <Badge variant="outline">{types.find((t) => t.id === r.typeId)?.nom ?? '—'}</Badge>,
    },
    {
      id: 'echeance',
      header: 'Échéance',
      sortValue: (r) => r.dateFin,
      cell: (r) => {
        const j = joursAvant(r.dateFin)
        return (
          <span className="ac-num">
            {formatDate(r.dateFin)}
            <span className="ml-1.5 text-xs text-ink-500">
              {r.resilieeLe ? '' : j < 0 ? `(il y a ${-j} j)` : `(dans ${j} j)`}
            </span>
          </span>
        )
      },
    },
    {
      id: 'reste',
      header: 'Reste dû',
      align: 'right',
      sortValue: (r) => resteDu(r),
      cell: (r) => {
        const reste = resteDu(r)
        return (
          <span className={reste > 0 ? 'ac-num font-medium text-warning-600' : 'ac-num text-ink-500'}>
            {reste > 0 ? formatMoney(reste) : '—'}
          </span>
        )
      },
    },
    { id: 'ville', header: 'Ville', optional: true, sortValue: (r) => r.ville, cell: (r) => r.ville },
    {
      id: 'depuis',
      header: 'Adhérent depuis',
      optional: true,
      defaultHidden: true,
      sortValue: (r) => r.premiereAdhesion,
      cell: (r) => <span className="ac-num">{formatDate(r.premiereAdhesion)}</span>,
    },
    {
      id: 'statut',
      header: 'Statut',
      align: 'right',
      sortValue: (r) => statutAdhesion(r),
      cell: (r) => <StatusBadge status={cleAdhesion(r)} />,
    },
  ]

  const filters: FilterDef<Adherent>[] = [
    {
      id: 'type',
      label: 'Type d’adhésion',
      options: types.map((t) => ({ value: t.id, label: t.nom })),
      match: (r, v) => r.typeId === v,
    },
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'expirant', label: 'Expire bientôt' },
        { value: 'expiree', label: 'Expirée' },
        { value: 'resiliee', label: 'Résiliée' },
      ],
      match: (r, v) => statutAdhesion(r) === v,
    },
    {
      id: 'periode',
      label: 'Exercice',
      options: EXERCICES.map((e) => ({ value: e, label: e })),
      match: (r, v) => r.cotisations.some((c) => c.exercice === v),
    },
  ]

  const enTete = (
    <PageHeader
      eyebrow="Adhésions"
      title="Adhérents"
      description="Toutes les adhésions, en cours ou échues. Le reste dû agrège les cotisations non soldées, tous exercices confondus."
      meta={<Badge variant="brand">{adherents.length} adhérents</Badge>}
      actions={
        <>
          <Button onClick={() => navigate('/adherents')} iconLeft={<LayoutDashboard aria-hidden className="h-4 w-4" />}>
            Tableau de bord
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
          titre="La liste des adhérents n'a pas pu être chargée"
          action={
            <Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>
              Réessayer
            </Button>
          }
        >
          {erreur} Réessayez dans un instant.
        </Alert>
      </Page>
    )
  }

  if (!chargement && adherents.length === 0) {
    return (
      <Page header={enTete}>
        <Card>
          <EmptyState
            icon={<Users />}
            title="Aucune adhésion enregistrée"
            description="Enregistrez la première adhésion pour ouvrir l'exercice. Le paiement peut être saisi dans la foulée ou plus tard."
            action={
              <Button variant="primary" onClick={() => navigate('/adherents/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouvelle adhésion
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
      <DataGrid
        rows={adherents}
        columns={columns}
        filters={filters}
        loading={chargement}
        caption="Liste des adhérents, triable et filtrable par type, statut et exercice"
        searchKeys={(r) => `${r.prenom} ${r.nom} ${r.numero} ${r.email} ${r.ville} ${r.telephone}`}
        searchPlaceholder="Rechercher un nom, un numéro d’adhérent, une ville…"
        getRowLabel={(r) => `${r.prenom} ${r.nom}`}
        onRowClick={(r) => navigate(`/adherents/${r.id}`)}
        emptyIcon={<Users />}
        emptyTitle="Aucun adhérent ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre. Les adhésions résiliées n'apparaissent que si le filtre Statut est réglé sur « Résiliée »."
        rowActions={[
          { label: 'Ouvrir la fiche', icon: <Users />, onSelect: (r) => navigate(`/adherents/${r.id}`) },
          { label: 'Renouveler l’adhésion', icon: <RotateCw />, onSelect: (r) => navigate(`/adherents/${r.id}/renouveler`) },
          { label: 'Enregistrer un paiement', icon: <CreditCard />, onSelect: (r) => navigate(`/adherents/${r.id}/paiement`) },
          {
            label: 'Envoyer un e-mail',
            icon: <Mail />,
            separatorBefore: true,
            onSelect: (r) => toast({ titre: 'Brouillon préparé', detail: `Destinataire : ${r.email}`, tone: 'neutral' }),
          },
        ]}
        bulkActions={(selected, clear) => (
          <>
            <Button
              size="sm"
              iconLeft={<Mail aria-hidden className="h-3.5 w-3.5" />}
              onClick={() => {
                toast({ titre: `Relance de ${selected.length} adhérents`, detail: 'Le brouillon groupé est prêt à être relu.', tone: 'neutral' })
                clear()
              }}
            >
              Relancer par e-mail
            </Button>
            <Button
              size="sm"
              iconLeft={<RotateCw aria-hidden className="h-3.5 w-3.5" />}
              onClick={() => {
                toast({
                  titre: 'Renouvellement groupé',
                  detail: 'Le renouvellement se confirme fiche par fiche pour éviter les erreurs de montant.',
                  tone: 'warning',
                })
                clear()
              }}
            >
              Proposer un renouvellement
            </Button>
            <Button size="sm" variant="ghost" onClick={() => navigate('/adherents')} iconLeft={<ArrowLeft aria-hidden className="h-3.5 w-3.5" />}>
              Tableau de bord
            </Button>
          </>
        )}
      />
    </Page>
  )
}
