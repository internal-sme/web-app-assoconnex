import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, Copy, Download, Eye, FileText, Plus, RefreshCw, Send, Wallet } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { FactNav, FactOutils } from '@/components/facturation/FactNav'
import { cleFacture } from '@/components/facturation/statuts'
import { useFacturation } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'
import { joursRetard, resteDuFacture, statutFacture, totalTTC, type Facture } from '@/lib/facturation'
import { formatDate, formatMoney } from '@/lib/utils'

export function FacturesListe({ type = 'facture' }: { type?: 'facture' | 'avoir' }) {
  usePageTitle('Factures')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { factures, clients, chargement, erreur, recharger, dupliquer, envoyer, annuler } = useFacturation()

  const [aAnnuler, setAAnnuler] = useState<Facture | null>(null)
  const [motif, setMotif] = useState('')
  const [enCours, setEnCours] = useState(false)

  const lignes = factures.filter((f) => f.type === type)
  const avoir = type === 'avoir'

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

  const nomClient = (id: string) => clients.find((c) => c.id === id)?.nom ?? '—'

  const columns: Column<Facture>[] = [
    {
      id: 'numero',
      header: avoir ? 'Avoir' : 'Facture',
      sortValue: (r) => r.numero,
      cell: (r) => (
        <div className="min-w-0">
          <p className="ac-num truncate font-medium text-ink-900">{r.numero}</p>
          <p className="truncate text-xs text-ink-500">{r.objet}</p>
        </div>
      ),
    },
    { id: 'client', header: 'Client', sortValue: (r) => nomClient(r.clientId), cell: (r) => nomClient(r.clientId) },
    { id: 'date', header: 'Date', sortValue: (r) => r.date, cell: (r) => <span className="ac-num">{formatDate(r.date)}</span> },
    {
      id: 'echeance',
      header: 'Échéance',
      optional: true,
      sortValue: (r) => r.echeance,
      cell: (r) => {
        const j = joursRetard(r)
        const enRetard = statutFacture(r) === 'retard'
        return (
          <span className="ac-num">
            {formatDate(r.echeance)}
            {enRetard && <span className="ml-1.5 text-xs font-medium text-danger-600">+{j} j</span>}
          </span>
        )
      },
    },
    {
      id: 'ttc',
      header: 'Total TTC',
      align: 'right',
      sortValue: (r) => totalTTC(r),
      cell: (r) => <span className="ac-num font-medium">{formatMoney(totalTTC(r))}</span>,
    },
    {
      id: 'reste',
      header: 'Reste dû',
      align: 'right',
      optional: true,
      sortValue: (r) => resteDuFacture(r),
      cell: (r) => {
        const reste = resteDuFacture(r)
        return <span className={reste > 0 ? 'ac-num text-warning-600' : 'ac-num text-ink-500'}>{reste > 0 ? formatMoney(reste) : '—'}</span>
      },
    },
    {
      id: 'statut',
      header: 'Statut',
      align: 'right',
      sortValue: (r) => statutFacture(r),
      cell: (r) => <StatusBadge status={cleFacture(r)} />,
    },
  ]

  const filters: FilterDef<Facture>[] = [
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'brouillon', label: 'Brouillon' },
        { value: 'envoyee', label: 'Envoyée' },
        { value: 'payee', label: 'Payée' },
        { value: 'retard', label: 'En retard' },
        { value: 'annulee', label: 'Annulée' },
      ],
      match: (r, v) => statutFacture(r) === v,
    },
    {
      id: 'client',
      label: 'Client',
      options: clients.map((c) => ({ value: c.id, label: c.nom })),
      match: (r, v) => r.clientId === v,
    },
  ]

  const enTete = (
    <PageHeader
      eyebrow="Facturation"
      title={avoir ? 'Avoirs' : 'Factures'}
      description={
        avoir
          ? "Documents émis pour corriger ou annuler tout ou partie d'une facture déjà envoyée."
          : "Toutes les factures émises, du plus récent au plus ancien. Le statut « en retard » se déduit de l'échéance."
      }
      meta={<Badge variant="brand">{lignes.length} documents</Badge>}
      actions={
        <>
          <FactOutils />
          {!avoir && (
            <Button variant="primary" onClick={() => navigate('/facturation/factures/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
              Nouvelle facture
            </Button>
          )}
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <FactNav />
        <Alert tone="danger" titre="La liste n'a pas pu être chargée" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && lignes.length === 0) {
    return (
      <Page header={enTete}>
        <FactNav />
        <Card>
          <EmptyState
            icon={<FileText />}
            title={avoir ? 'Aucun avoir émis' : 'Aucune facture émise'}
            description={
              avoir
                ? "Un avoir se crée depuis la facture qu'il corrige, ce qui garantit le lien entre les deux documents."
                : 'Créez votre première facture à partir du catalogue de prestations.'
            }
            action={
              avoir ? (
                <Button variant="primary" onClick={() => navigate('/facturation/factures')}>Voir les factures</Button>
              ) : (
                <Button variant="primary" onClick={() => navigate('/facturation/factures/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                  Créer une facture
                </Button>
              )
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <FactNav />

      <DataGrid
        rows={lignes}
        columns={columns}
        filters={filters}
        loading={chargement}
        caption={avoir ? 'Liste des avoirs' : 'Liste des factures émises'}
        searchKeys={(r) => `${r.numero} ${r.objet} ${r.reference} ${nomClient(r.clientId)}`}
        searchPlaceholder="Rechercher un numéro, un client, un objet…"
        getRowLabel={(r) => `${r.numero} — ${nomClient(r.clientId)}`}
        onRowClick={(r) => navigate(`/facturation/factures/${r.id}`)}
        emptyIcon={<FileText />}
        emptyTitle="Aucun document ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre."
        rowActions={[
          { label: 'Ouvrir', icon: <Eye />, onSelect: (r) => navigate(`/facturation/factures/${r.id}`) },
          { label: 'Aperçu du document', icon: <FileText />, onSelect: (r) => navigate(`/facturation/factures/${r.id}/apercu`) },
          {
            label: 'Dupliquer',
            icon: <Copy />,
            onSelect: (r) =>
              void (async () => {
                try {
                  const copie = await dupliquer(r.id)
                  toast({ titre: 'Facture dupliquée', detail: `${copie.numero} créée en brouillon.`, tone: 'success' })
                  navigate(`/facturation/factures/${copie.id}/modifier`)
                } catch (e) {
                  toast({ titre: 'Duplication impossible', detail: (e as Error).message, tone: 'danger' })
                }
              })(),
          },
          {
            label: 'Envoyer au client',
            icon: <Send />,
            onSelect: (r) =>
              void executer(() => envoyer(r.id), { titre: 'Facture envoyée', detail: `${r.numero} transmise au client.` }),
          },
          {
            label: 'Enregistrer un règlement',
            icon: <Wallet />,
            onSelect: (r) => navigate(`/facturation/factures/${r.id}?reglement=1`),
          },
          {
            label: 'Télécharger le PDF',
            icon: <Download />,
            onSelect: (r) =>
              toast({ titre: 'Génération du PDF', detail: `${r.numero} — la génération de document arrive en V2.`, tone: 'neutral' }),
          },
          {
            label: 'Annuler',
            icon: <Ban />,
            danger: true,
            separatorBefore: true,
            onSelect: (r) => {
              setMotif('')
              setAAnnuler(r)
            },
          },
        ]}
        bulkActions={(selected, clear) => (
          <>
            <Button
              size="sm"
              iconLeft={<Send aria-hidden className="h-3.5 w-3.5" />}
              onClick={() => {
                const brouillons = selected.filter((f) => f.statut === 'brouillon' && f.lignes.length > 0)
                void executer(
                  async () => {
                    for (const f of brouillons) await envoyer(f.id)
                  },
                  { titre: `${brouillons.length} facture(s) envoyée(s)`, detail: 'Les brouillons sans ligne ont été ignorés.' },
                )
                clear()
              }}
            >
              Envoyer les brouillons
            </Button>
            <Button size="sm" variant="ghost" onClick={clear}>
              Vider la sélection
            </Button>
          </>
        )}
      />

      {/* Annulation — action sensible */}
      <ConfirmDialog
        open={!!aAnnuler}
        loading={enCours}
        onClose={() => setAAnnuler(null)}
        onConfirm={() => {
          const f = aAnnuler!
          const m = motif
          setAAnnuler(null)
          void executer(() => annuler(f.id, m), {
            titre: 'Facture annulée',
            detail: `${f.numero} ne compte plus dans le chiffre d'affaires.`,
          })
        }}
        title={`Annuler la facture ${aAnnuler?.numero} ?`}
        description={`${nomClient(aAnnuler?.clientId ?? '')} — ${formatMoney(totalTTC(aAnnuler ?? ({ lignes: [] } as unknown as Facture)))}. La facture sortira du chiffre d'affaires et des relances.`}
        confirmLabel="Annuler la facture"
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
            Une facture déjà réglée, même partiellement, ne peut pas être annulée : elle se corrige par un avoir. Le
            document reste conservé et numéroté, conformément aux obligations de séquentialité.
          </div>
          <Field label="Motif d’annulation" hint="Consigné dans l’historique de la facture.">
            {(p) => <Textarea {...p} rows={2} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Prestation annulée par le client." />}
          </Field>
        </div>
      </ConfirmDialog>
    </Page>
  )
}

export function AvoirsListe() {
  return <FacturesListe type="avoir" />
}
