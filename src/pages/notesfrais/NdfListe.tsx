import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Eye, Plus, ReceiptText, RefreshCw, Wallet, X } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { NdfNav, NdfOutils } from '@/components/notesfrais/NdfNav'
import { WorkflowStepper, cleStatutNote } from '@/components/notesfrais/Workflow'
import { useNotesFrais } from '@/context/NotesFraisContext'
import { useToast } from '@/context/ToastContext'
import { depassePlafond, type NoteFrais } from '@/lib/notesFrais'
import { formatDate, formatMoney } from '@/lib/utils'

export type VueNdf = 'mes-notes' | 'a-valider' | 'validees' | 'rejetees' | 'remboursements'

const titres: Record<VueNdf, { titre: string; description: string; vide: string }> = {
  'mes-notes': {
    titre: 'Mes notes de frais',
    description: 'Les notes que vous avez saisies, quel que soit leur statut. Une note rejetée peut être corrigée puis resoumise.',
    vide: 'Vous n’avez déclaré aucune dépense. Créez une note pour vous faire rembourser une avance.',
  },
  'a-valider': {
    titre: 'Notes à valider',
    description: 'Les notes en attente d’une décision, du responsable puis du trésorier. Le stepper indique où en est chacune.',
    vide: 'Aucune note n’attend de validation. Le circuit est à jour.',
  },
  validees: {
    titre: 'Notes validées',
    description: 'Validées par le trésorier, en attente de mise en paiement.',
    vide: 'Aucune note validée en attente de remboursement.',
  },
  rejetees: {
    titre: 'Notes rejetées',
    description: 'Chaque rejet porte un motif : le demandeur sait exactement quoi corriger avant de resoumettre.',
    vide: 'Aucune note rejetée. Les demandes passent le circuit sans accroc.',
  },
  remboursements: {
    titre: 'Remboursements',
    description: 'Les notes validées à mettre en paiement, et celles déjà remboursées.',
    vide: 'Aucun remboursement en attente.',
  },
}

export function NdfListe({ vue }: { vue: VueNdf }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    notes, natures, projets, demandeurs, utilisateurId, chargement, erreur, recharger,
    validerResponsable, validerTresorier, rejeter, rembourser,
  } = useNotesFrais()

  const [aRejeter, setARejeter] = useState<NoteFrais | null>(null)
  const [motif, setMotif] = useState('')
  const [aRembourser, setARembourser] = useState<NoteFrais[] | null>(null)
  const [reference, setReference] = useState('')
  const [enCours, setEnCours] = useState(false)

  const lignes = notes.filter((n) => {
    if (vue === 'mes-notes') return n.demandeurId === utilisateurId
    if (vue === 'a-valider') return n.statut === 'soumise' || n.statut === 'validee_responsable'
    if (vue === 'validees') return n.statut === 'validee'
    if (vue === 'rejetees') return n.statut === 'rejetee'
    return n.statut === 'validee' || n.statut === 'remboursee'
  })

  const nomDemandeur = (id: string) => demandeurs.find((d) => d.id === id)?.nom ?? '—'
  const nomNature = (id: string) => natures.find((n) => n.id === id)?.nom ?? '—'
  const nomProjet = (id: string | null) => projets.find((p) => p.id === id)?.nom ?? '—'

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

  const valider = (n: NoteFrais) => {
    if (n.statut === 'soumise') {
      void executer(() => validerResponsable(n.id), {
        titre: 'Validée par le responsable',
        detail: `${n.numero} passe à l’étape du trésorier.`,
      })
    } else {
      void executer(() => validerTresorier(n.id), {
        titre: 'Validée par le trésorier',
        detail: `${n.numero} est bonne à rembourser.`,
      })
    }
  }

  const columns: Column<NoteFrais>[] = [
    {
      id: 'note',
      header: 'Note',
      sortValue: (r) => r.numero,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.libelle}</p>
          <p className="ac-num truncate text-xs text-ink-500">
            {r.numero} · {nomNature(r.natureId)}
          </p>
        </div>
      ),
    },
    ...(vue === 'mes-notes'
      ? []
      : [{ id: 'demandeur', header: 'Demandeur', sortValue: (r: NoteFrais) => nomDemandeur(r.demandeurId), cell: (r: NoteFrais) => nomDemandeur(r.demandeurId) } as Column<NoteFrais>]),
    { id: 'date', header: 'Date', sortValue: (r) => r.dateDepense, cell: (r) => <span className="ac-num">{formatDate(r.dateDepense)}</span> },
    { id: 'projet', header: 'Projet', optional: true, cell: (r) => nomProjet(r.projetId) },
    {
      id: 'montant',
      header: 'Montant TTC',
      align: 'right',
      sortValue: (r) => r.montantTTC,
      cell: (r) => (
        <span className="ac-num font-medium text-ink-900">
          {formatMoney(r.montantTTC)}
          {depassePlafond(r, natures) && <span className="ml-1.5 text-xs font-normal text-warning-600">plafond</span>}
        </span>
      ),
    },
    {
      id: 'justificatif',
      header: 'Justificatif',
      optional: true,
      cell: (r) => <StatusBadge status={r.justificatif ? 'justificatif_fourni' : 'justificatif_manquant'} />,
    },
    {
      id: 'etape',
      header: 'Étape',
      optional: true,
      cell: (r) => <WorkflowStepper note={r} compact />,
    },
    {
      id: 'statut',
      header: 'Statut',
      align: 'right',
      sortValue: (r) => r.statut,
      cell: (r) => <StatusBadge status={cleStatutNote(r)} />,
    },
  ]

  const filters: FilterDef<NoteFrais>[] = [
    { id: 'nature', label: 'Nature', options: natures.map((n) => ({ value: n.id, label: n.nom })), match: (r, v) => r.natureId === v },
    { id: 'projet', label: 'Projet', options: projets.map((p) => ({ value: p.id, label: p.nom })), match: (r, v) => r.projetId === v },
    {
      id: 'justificatif',
      label: 'Justificatif',
      options: [
        { value: 'oui', label: 'Fourni' },
        { value: 'non', label: 'Manquant' },
      ],
      match: (r, v) => (v === 'oui' ? !!r.justificatif : !r.justificatif),
    },
  ]

  const meta = titres[vue]
  const totalValidees = lignes.filter((n) => n.statut === 'validee')

  const enTete = (
    <PageHeader
      eyebrow="Notes de frais"
      title={meta.titre}
      description={meta.description}
      meta={<Badge variant="brand">{lignes.length} notes</Badge>}
      actions={
        <>
          <NdfOutils />
          {vue === 'remboursements' && totalValidees.length > 0 && (
            <Button
              onClick={() => {
                setReference('')
                setARembourser(totalValidees)
              }}
              iconLeft={<Wallet aria-hidden className="h-4 w-4" />}
            >
              Rembourser les {totalValidees.length} notes
            </Button>
          )}
          <Button variant="primary" onClick={() => navigate('/notes-de-frais/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouvelle note
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <NdfNav />
        <Alert tone="danger" titre="La liste n'a pas pu être chargée" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && lignes.length === 0) {
    return (
      <Page header={enTete}>
        <NdfNav />
        <Card>
          <EmptyState
            icon={<ReceiptText />}
            title="Aucune note ici"
            description={meta.vide}
            action={
              vue === 'mes-notes' ? (
                <Button variant="primary" onClick={() => navigate('/notes-de-frais/nouvelle')}>Créer une note</Button>
              ) : (
                <Button variant="primary" onClick={() => navigate('/notes-de-frais')}>Retour au tableau de bord</Button>
              )
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <NdfNav />

      {vue === 'a-valider' && lignes.some((n) => !n.justificatif) && (
        <Alert tone="warning" titre="Des notes n'ont pas de justificatif">
          Le trésorier ne peut pas valider une note sans pièce jointe. Rejetez-la en expliquant ce qui manque, ou
          demandez au responsable de relancer le demandeur.
        </Alert>
      )}

      {vue === 'rejetees' && lignes.length > 0 && (
        <Alert tone="neutral" titre="Une note rejetée n'est pas perdue">
          Le demandeur peut la corriger et la resoumettre : le circuit repart de l'étape de soumission.
        </Alert>
      )}

      <DataGrid
        rows={lignes}
        columns={columns}
        filters={filters}
        loading={chargement}
        caption={meta.titre}
        searchKeys={(r) => `${r.numero} ${r.libelle} ${nomDemandeur(r.demandeurId)} ${nomNature(r.natureId)}`}
        searchPlaceholder="Rechercher un libellé, un numéro, un demandeur…"
        getRowLabel={(r) => `${r.numero} — ${r.libelle}`}
        onRowClick={(r) => navigate(`/notes-de-frais/${r.id}`)}
        emptyIcon={<ReceiptText />}
        emptyTitle="Aucune note ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre."
        rowActions={[
          { label: 'Ouvrir le détail', icon: <Eye />, onSelect: (r) => navigate(`/notes-de-frais/${r.id}`) },
          ...(vue === 'a-valider'
            ? [
                { label: 'Valider', icon: <Check />, onSelect: valider },
                {
                  label: 'Rejeter',
                  icon: <X />,
                  danger: true,
                  onSelect: (r: NoteFrais) => {
                    setMotif('')
                    setARejeter(r)
                  },
                },
              ]
            : []),
          ...(vue === 'remboursements' || vue === 'validees'
            ? [
                {
                  label: 'Rembourser',
                  icon: <Wallet />,
                  onSelect: (r: NoteFrais) => {
                    setReference('')
                    setARembourser([r])
                  },
                },
              ]
            : []),
        ]}
        bulkActions={(selected, clear) =>
          vue === 'a-valider' ? (
            <>
              <Button
                size="sm"
                iconLeft={<Check aria-hidden className="h-3.5 w-3.5" />}
                onClick={() => {
                  void executer(
                    async () => {
                      for (const n of selected) {
                        if (n.statut === 'soumise') await validerResponsable(n.id)
                        else if (n.justificatif) await validerTresorier(n.id)
                      }
                    },
                    { titre: 'Validations enregistrées', detail: 'Les notes sans justificatif ont été ignorées.' },
                  )
                  clear()
                }}
              >
                Valider la sélection
              </Button>
              <Button size="sm" variant="ghost" onClick={clear}>Vider la sélection</Button>
            </>
          ) : vue === 'remboursements' || vue === 'validees' ? (
            <>
              <Button
                size="sm"
                iconLeft={<Wallet aria-hidden className="h-3.5 w-3.5" />}
                onClick={() => {
                  setReference('')
                  setARembourser(selected.filter((n) => n.statut === 'validee'))
                  clear()
                }}
              >
                Rembourser la sélection
              </Button>
              <Button size="sm" variant="ghost" onClick={clear}>Vider la sélection</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={clear}>Vider la sélection</Button>
          )
        }
      />

      {/* Rejet — motif obligatoire */}
      <Modal
        open={!!aRejeter}
        onClose={() => setARejeter(null)}
        title={`Rejeter la note ${aRejeter?.numero} ?`}
        description="Le motif est transmis au demandeur : il doit lui permettre de corriger sans revenir vers vous."
        footer={
          <>
            <Button variant="ghost" onClick={() => setARejeter(null)} disabled={enCours}>Annuler</Button>
            <Button
              variant="danger"
              loading={enCours}
              disabled={!motif.trim()}
              onClick={() => {
                const n = aRejeter!
                const m = motif
                setARejeter(null)
                void executer(() => rejeter(n.id, m, n.statut === 'soumise' ? 'responsable' : 'tresorier'), {
                  titre: 'Note rejetée',
                  detail: `${n.numero} est renvoyée à son auteur avec le motif.`,
                })
              }}
            >
              Rejeter la note
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          {aRejeter && (
            <div className="rounded-lg border border-ink-200 bg-ink-25 p-3 text-[0.8125rem]">
              <p className="font-medium text-ink-900">{aRejeter.libelle}</p>
              <p className="ac-num mt-0.5 text-xs text-ink-500">
                {nomDemandeur(aRejeter.demandeurId)} · {formatMoney(aRejeter.montantTTC)} · {formatDate(aRejeter.dateDepense)}
              </p>
              <div className="mt-3"><WorkflowStepper note={aRejeter} compact /></div>
            </div>
          )}
          <Field label="Motif du rejet" required hint="Sans motif, le demandeur ne saura pas quoi corriger.">
            {(p) => (
              <Textarea
                {...p}
                rows={3}
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Justificatif illisible : merci de joindre une photo nette du ticket."
              />
            )}
          </Field>
          {!motif.trim() && <p className="text-xs font-medium text-warning-600">Le motif est obligatoire pour rejeter.</p>}
        </div>
      </Modal>

      {/* Remboursement */}
      <ConfirmDialog
        open={!!aRembourser && aRembourser.length > 0}
        tone="primary"
        loading={enCours}
        onClose={() => setARembourser(null)}
        onConfirm={() => {
          const cibles = aRembourser ?? []
          const ref = reference
          setARembourser(null)
          void executer(() => rembourser(cibles.map((n) => n.id), ref), {
            titre: cibles.length > 1 ? `${cibles.length} notes remboursées` : 'Note remboursée',
            detail: `${formatMoney(cibles.reduce((s, n) => s + n.montantTTC, 0))} versés aux demandeurs.`,
          })
        }}
        title={aRembourser && aRembourser.length > 1 ? `Rembourser ${aRembourser.length} notes ?` : 'Rembourser cette note ?'}
        description={`Un virement de ${formatMoney((aRembourser ?? []).reduce((s, n) => s + n.montantTTC, 0))} sera consigné. Les notes passeront au statut remboursé.`}
        confirmLabel="Enregistrer le remboursement"
      >
        <div className="flex flex-col gap-3">
          <Field label="Référence du virement" hint="Générée automatiquement si laissée vide.">
            {(p) => <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="VIR-2026-742" />}
          </Field>
        </div>
      </ConfirmDialog>
    </Page>
  )
}
