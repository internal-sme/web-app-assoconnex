import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Link2, Paperclip, Unlink } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { ComptaNav, ComptaOutils } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import { useToast } from '@/context/ToastContext'
import { totalDebit, type Piece } from '@/lib/comptabilite'
import { formatDate, formatMoney } from '@/lib/utils'

export function Pieces() {
  usePageTitle('Pièces justificatives')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { pieces, ecritures, exerciceId, chargement, lectureSeule, rattacherPiece } = useCompta()

  const [aRattacher, setARattacher] = useState<Piece | null>(null)
  const [ecritureChoisie, setEcritureChoisie] = useState('')
  const [enCours, setEnCours] = useState(false)

  const orphelines = pieces.filter((p) => !p.ecritureId)
  const candidates = ecritures.filter((e) => e.exerciceId === exerciceId).slice(0, 60)

  const columns: Column<Piece>[] = [
    {
      id: 'nom',
      header: 'Pièce',
      sortValue: (r) => r.nom,
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{r.nom}</p>
            <p className="truncate text-xs text-ink-500">{r.fournisseur}</p>
          </div>
        </div>
      ),
    },
    { id: 'type', header: 'Type', sortValue: (r) => r.type, cell: (r) => <Badge variant="outline">{r.type}</Badge> },
    { id: 'date', header: 'Date', sortValue: (r) => r.date, cell: (r) => <span className="ac-num">{formatDate(r.date)}</span> },
    {
      id: 'montant',
      header: 'Montant',
      align: 'right',
      sortValue: (r) => r.montant,
      cell: (r) => <span className="ac-num font-medium">{formatMoney(r.montant)}</span>,
    },
    {
      id: 'ecriture',
      header: 'Écriture',
      optional: true,
      cell: (r) => {
        const e = ecritures.find((x) => x.id === r.ecritureId)
        return e ? <span className="ac-num text-ink-700">{e.numero}</span> : <span className="text-ink-500">—</span>
      },
    },
    {
      id: 'statut',
      header: 'État',
      align: 'right',
      sortValue: (r) => (r.ecritureId ? 'a' : 'b'),
      cell: (r) => <StatusBadge status={r.ecritureId ? 'piece_rattachee' : 'piece_orpheline'} />,
    },
  ]

  const filters: FilterDef<Piece>[] = [
    {
      id: 'etat',
      label: 'État',
      options: [
        { value: 'rattachee', label: 'Rattachée' },
        { value: 'orpheline', label: 'À rattacher' },
      ],
      match: (r, v) => (v === 'rattachee' ? !!r.ecritureId : !r.ecritureId),
    },
    {
      id: 'type',
      label: 'Type',
      options: Array.from(new Set(pieces.map((p) => p.type))).map((t) => ({ value: t, label: t })),
      match: (r, v) => r.type === v,
    },
  ]

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Comptabilité"
          title="Pièces comptables"
          description="Factures, reçus et relevés reçus par l'association. Chaque pièce doit être rattachée à une écriture pour justifier les comptes."
          meta={<Badge variant="brand">{pieces.length} pièces</Badge>}
          actions={<ComptaOutils />}
        />
      }
    >
      <ComptaNav />

      {orphelines.length > 0 && (
        <Alert tone="warning" titre={`${orphelines.length} pièce(s) à rattacher`}>
          Une pièce sans écriture signale souvent une opération non saisie. Rattachez-la ou créez l'écriture
          correspondante.
        </Alert>
      )}

      {pieces.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Paperclip />}
            title="Aucune pièce déposée"
            description="Les factures et reçus déposés apparaîtront ici, prêts à être rattachés aux écritures."
            action={<Button variant="primary" onClick={() => navigate('/comptabilite/journal')}>Ouvrir le journal</Button>}
          />
        </Card>
      ) : (
        <DataGrid
          rows={pieces}
          columns={columns}
          filters={filters}
          loading={chargement}
          caption="Pièces comptables reçues par l'association"
          searchKeys={(r) => `${r.nom} ${r.type} ${r.fournisseur}`}
          searchPlaceholder="Rechercher une pièce, un fournisseur…"
          getRowLabel={(r) => r.nom}
          emptyIcon={<Paperclip />}
          emptyTitle="Aucune pièce ne correspond"
          emptyDescription="Élargissez la recherche ou retirez un filtre."
          rowActions={[
            {
              label: 'Rattacher à une écriture',
              icon: <Link2 />,
              onSelect: (r) => {
                setEcritureChoisie('')
                setARattacher(r)
              },
            },
            {
              label: 'Ouvrir l’écriture',
              icon: <FileText />,
              onSelect: (r) =>
                r.ecritureId
                  ? navigate(`/comptabilite/ecritures/${r.ecritureId}`)
                  : toast({ titre: 'Aucune écriture', detail: 'Cette pièce n’est rattachée à aucune écriture.', tone: 'warning' }),
            },
            {
              label: 'Détacher',
              icon: <Unlink />,
              danger: true,
              separatorBefore: true,
              onSelect: (r) => {
                if (!r.ecritureId) {
                  toast({ titre: 'Rien à détacher', detail: 'Cette pièce est déjà libre.', tone: 'neutral' })
                  return
                }
                void (async () => {
                  try {
                    await rattacherPiece(r.id, null)
                    toast({ titre: 'Pièce détachée', detail: `${r.nom} n’est plus rattachée à une écriture.`, tone: 'neutral' })
                  } catch (e) {
                    toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
                  }
                })()
              },
            },
          ]}
        />
      )}

      <Modal
        open={!!aRattacher}
        onClose={() => setARattacher(null)}
        size="lg"
        title={`Rattacher « ${aRattacher?.nom} »`}
        description="Choisissez l'écriture que cette pièce justifie."
        footer={
          <>
            <Button variant="ghost" onClick={() => setARattacher(null)} disabled={enCours}>
              Annuler
            </Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!ecritureChoisie || lectureSeule}
              onClick={() => {
                const p = aRattacher!
                setEnCours(true)
                void (async () => {
                  try {
                    await rattacherPiece(p.id, ecritureChoisie)
                    toast({ titre: 'Pièce rattachée', detail: `${p.nom} justifie désormais cette écriture.`, tone: 'success' })
                    setARattacher(null)
                  } catch (e) {
                    toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
                  } finally {
                    setEnCours(false)
                  }
                })()
              }}
            >
              Rattacher
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          {aRattacher && (
            <div className="rounded-lg border border-ink-200 bg-ink-25 p-3 text-[0.8125rem] text-ink-700">
              <p className="ac-num">
                {aRattacher.type} · {formatMoney(aRattacher.montant)} · {formatDate(aRattacher.date)} ·{' '}
                {aRattacher.fournisseur}
              </p>
            </div>
          )}
          {lectureSeule && (
            <Alert tone="neutral" titre="Exercice clôturé">
              Sélectionnez un exercice ouvert dans la barre d'outils pour rattacher une pièce.
            </Alert>
          )}
          <Field label="Écriture" required hint="Les écritures de l’exercice sélectionné sont proposées.">
            {(p) => (
              <Select
                {...p}
                value={ecritureChoisie}
                onChange={(e) => setEcritureChoisie(e.target.value)}
                placeholder="Choisir une écriture"
                options={candidates.map((e) => ({
                  value: e.id,
                  label: `${e.numero} · ${formatDate(e.date)} · ${e.libelle} · ${formatMoney(totalDebit(e))}`,
                }))}
              />
            )}
          </Field>
        </div>
      </Modal>
    </Page>
  )
}
