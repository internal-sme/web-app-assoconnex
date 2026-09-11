import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Paperclip, Pencil, ReceiptText, Send, Upload, Wallet, X } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Status'
import { Timeline } from '@/components/ui/Timeline'
import { NdfNav } from '@/components/notesfrais/NdfNav'
import { WorkflowStepper, cleStatutNote } from '@/components/notesfrais/Workflow'
import { useNotesFrais } from '@/context/NotesFraisContext'
import { useToast } from '@/context/ToastContext'
import { depassePlafond, moyenNdfLabels, statutNoteLabels } from '@/lib/notesFrais'
import { formatDate, formatDateLong, formatMoney } from '@/lib/utils'

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
      <dt className="text-[0.8125rem] text-ink-500">{label}</dt>
      <dd className="ac-num text-right text-[0.8125rem] font-medium text-ink-900">{children}</dd>
    </div>
  )
}

export function NdfDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    noteParId, natures, projets, centres, demandeurs, utilisateurId, chargement,
    soumettre, validerResponsable, validerTresorier, rejeter, rembourser, attacherJustificatif,
  } = useNotesFrais()

  const [rejetOuvert, setRejetOuvert] = useState(false)
  const [motif, setMotif] = useState('')
  const [pieceOuverte, setPieceOuverte] = useState(false)
  const [nomPiece, setNomPiece] = useState('')
  const [enCours, setEnCours] = useState(false)

  const n = noteParId(id)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Note de frais" />}>
        <Card className="p-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </Card>
      </Page>
    )
  }

  if (!n) {
    return (
      <Page header={<PageHeader title="Note introuvable" />}>
        <Card>
          <EmptyState
            icon={<ReceiptText />}
            title="Cette note n'existe plus"
            description="Elle a peut-être été supprimée alors qu'elle était encore en brouillon."
            action={<Button variant="primary" onClick={() => navigate('/notes-de-frais/mes-notes')}>Retour à mes notes</Button>}
          />
        </Card>
      </Page>
    )
  }

  const nature = natures.find((x) => x.id === n.natureId)
  const projet = projets.find((p) => p.id === n.projetId)
  const centre = centres.find((c) => c.id === n.centreCoutId)
  const demandeur = demandeurs.find((d) => d.id === n.demandeurId)
  const estAuteur = n.demandeurId === utilisateurId
  const plafondDepasse = depassePlafond(n, natures)

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

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Notes de frais"
          title={n.libelle}
          description={`${nature?.nom} · ${demandeur?.nom} · dépense du ${formatDateLong(n.dateDepense)}`}
          meta={
            <>
              <StatusBadge status={cleStatutNote(n)} />
              <span className="ac-num text-2xs text-ink-500">{n.numero}</span>
              <Badge variant="outline">{formatMoney(n.montantTTC)} TTC</Badge>
              {!n.justificatif && <StatusBadge status="justificatif_manquant" />}
            </>
          }
          actions={
            <>
              <Button onClick={() => navigate('/notes-de-frais/mes-notes')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Liste
              </Button>

              {(n.statut === 'brouillon' || n.statut === 'rejetee') && estAuteur && (
                <>
                  <Button onClick={() => navigate(`/notes-de-frais/${n.id}/modifier`)} iconLeft={<Pencil aria-hidden className="h-4 w-4" />}>
                    Modifier
                  </Button>
                  <Button
                    variant="primary"
                    loading={enCours}
                    onClick={() =>
                      void executer(() => soumettre(n.id), {
                        titre: 'Note soumise',
                        detail: 'Elle attend maintenant la validation du responsable.',
                      })
                    }
                    iconLeft={<Send aria-hidden className="h-4 w-4" />}
                  >
                    {n.statut === 'rejetee' ? 'Resoumettre' : 'Soumettre'}
                  </Button>
                </>
              )}

              {n.statut === 'soumise' && (
                <>
                  <Button variant="danger" onClick={() => { setMotif(''); setRejetOuvert(true) }} iconLeft={<X aria-hidden className="h-4 w-4" />}>
                    Rejeter
                  </Button>
                  <Button
                    variant="primary"
                    loading={enCours}
                    onClick={() => void executer(() => validerResponsable(n.id), { titre: 'Validée par le responsable', detail: 'La note passe au trésorier.' })}
                    iconLeft={<Check aria-hidden className="h-4 w-4" />}
                  >
                    Valider comme responsable
                  </Button>
                </>
              )}

              {n.statut === 'validee_responsable' && (
                <>
                  <Button variant="danger" onClick={() => { setMotif(''); setRejetOuvert(true) }} iconLeft={<X aria-hidden className="h-4 w-4" />}>
                    Rejeter
                  </Button>
                  <Button
                    variant="primary"
                    loading={enCours}
                    disabled={!n.justificatif}
                    onClick={() => void executer(() => validerTresorier(n.id), { titre: 'Validée par le trésorier', detail: 'La note est bonne à rembourser.' })}
                    iconLeft={<Check aria-hidden className="h-4 w-4" />}
                  >
                    Valider comme trésorier
                  </Button>
                </>
              )}

              {n.statut === 'validee' && (
                <Button
                  variant="primary"
                  loading={enCours}
                  onClick={() => void executer(() => rembourser([n.id], ''), { titre: 'Remboursement enregistré', detail: `${formatMoney(n.montantTTC)} versés à ${demandeur?.nom}.` })}
                  iconLeft={<Wallet aria-hidden className="h-4 w-4" />}
                >
                  Rembourser
                </Button>
              )}
            </>
          }
        />
      }
    >
      <NdfNav />

      {/* Le stepper apparaît en tête de fiche, à chaque étape */}
      <WorkflowStepper note={n} />

      {n.statut === 'rejetee' && (
        <Alert
          tone="danger"
          titre={`Note rejetée par le ${n.rejeteeA === 'tresorier' ? 'trésorier' : 'responsable'}`}
          action={
            estAuteur ? (
              <Button size="sm" onClick={() => navigate(`/notes-de-frais/${n.id}/modifier`)} iconLeft={<Pencil aria-hidden className="h-3.5 w-3.5" />}>
                Corriger
              </Button>
            ) : undefined
          }
        >
          <strong>Motif : </strong>
          {n.motifRejet}
          <br />
          Rejetée le {n.rejeteeLe ? formatDateLong(n.rejeteeLe) : '—'} par {n.rejeteePar}. La note peut être corrigée puis
          resoumise : le circuit repart de l'étape de soumission.
        </Alert>
      )}

      {!n.justificatif && n.statut !== 'remboursee' && (
        <Alert
          tone="warning"
          titre="Justificatif manquant"
          action={
            <Button size="sm" onClick={() => { setNomPiece(''); setPieceOuverte(true) }} iconLeft={<Upload aria-hidden className="h-3.5 w-3.5" />}>
              Joindre une pièce
            </Button>
          }
        >
          {nature?.justificatifObligatoire
            ? `Un justificatif est obligatoire pour la nature « ${nature.nom} ». Le trésorier ne pourra pas valider la note sans lui.`
            : 'Aucune pièce n’est jointe. Le justificatif reste recommandé pour la traçabilité comptable.'}
        </Alert>
      )}

      {plafondDepasse && (
        <Alert tone="warning" titre="Plafond dépassé">
          Le plafond de la nature « {nature?.nom} » est de {formatMoney(nature?.plafond ?? 0)}. La note s'élève à{' '}
          {formatMoney(n.montantTTC)} : une validation expresse du bureau peut être demandée.
        </Alert>
      )}

      {n.statut === 'remboursee' && (
        <Alert tone="success" titre="Note remboursée">
          Virement de {formatMoney(n.montantTTC)} le {n.rembourseeLe ? formatDateLong(n.rembourseeLe) : '—'}, référence{' '}
          <span className="ac-num">{n.referenceRemboursement}</span>.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Détail de la dépense" />
            <CardBody className="py-0">
              <dl>
                <Ligne label="Libellé">{n.libelle}</Ligne>
                <Ligne label="Date de la dépense">{formatDateLong(n.dateDepense)}</Ligne>
                <Ligne label="Nature">{nature?.nom ?? '—'}</Ligne>
                <Ligne label="Montant TTC">{formatMoney(n.montantTTC)}</Ligne>
                <Ligne label="dont TVA">{n.tva > 0 ? formatMoney(n.tva) : 'Non récupérable'}</Ligne>
                <Ligne label="Moyen de paiement">{moyenNdfLabels[n.moyenPaiement]}</Ligne>
                <Ligne label="Projet">{projet?.nom ?? 'Non imputé'}</Ligne>
                <Ligne label="Centre de coût">{centre ? `${centre.code} — ${centre.nom}` : 'Non imputé'}</Ligne>
                <Ligne label="Compte comptable">{nature?.compteComptable ?? '—'}</Ligne>
              </dl>
            </CardBody>
          </Card>

          {n.commentaire && (
            <Card>
              <CardHeader title="Commentaire du demandeur" />
              <CardBody>
                <p className="text-[0.8125rem] leading-relaxed text-ink-700">{n.commentaire}</p>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Historique" description="Toutes les actions consignées sur cette note." />
            <CardBody>
              <Timeline evenements={n.historique} />
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader
              title="Justificatif"
              action={
                n.statut !== 'remboursee' ? (
                  <Button size="sm" variant="ghost" onClick={() => { setNomPiece(''); setPieceOuverte(true) }}>
                    {n.justificatif ? 'Remplacer' : 'Joindre'}
                  </Button>
                ) : undefined
              }
            />
            {n.justificatif ? (
              <CardBody className="flex flex-col gap-3">
                <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-ink-300 bg-ink-25">
                  <div className="text-center">
                    <Paperclip aria-hidden className="mx-auto h-6 w-6 text-ink-500" />
                    <p className="mt-2 text-[0.8125rem] font-medium text-ink-800">{n.justificatif}</p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      {n.justificatifScanne ? 'Importé par scan' : 'Déposé manuellement'}
                    </p>
                  </div>
                </div>
                <StatusBadge status="justificatif_fourni" />
              </CardBody>
            ) : (
              <EmptyState
                icon={<Paperclip />}
                title="Aucune pièce jointe"
                description="Photographiez le ticket ou déposez le fichier reçu par courriel."
                compact
                action={
                  <Button variant="primary" onClick={() => { setNomPiece(''); setPieceOuverte(true) }} iconLeft={<Upload aria-hidden className="h-4 w-4" />}>
                    Joindre un justificatif
                  </Button>
                }
              />
            )}
          </Card>

          <Card>
            <CardHeader title="Suivi" />
            <CardBody className="py-0">
              <dl>
                <Ligne label="Statut">{statutNoteLabels[n.statut]}</Ligne>
                <Ligne label="Demandeur">{demandeur?.nom ?? '—'}</Ligne>
                <Ligne label="Soumise le">{n.soumiseLe ? formatDate(n.soumiseLe) : 'Non soumise'}</Ligne>
                <Ligne label="Validation responsable">
                  {n.valideeResponsableLe ? `${formatDate(n.valideeResponsableLe)} · ${n.valideeResponsablePar}` : 'En attente'}
                </Ligne>
                <Ligne label="Validation trésorier">
                  {n.valideeTresorierLe ? `${formatDate(n.valideeTresorierLe)} · ${n.valideeTresorierPar}` : 'En attente'}
                </Ligne>
                <Ligne label="Remboursement">
                  {n.rembourseeLe ? `${formatDate(n.rembourseeLe)} · ${n.referenceRemboursement}` : 'En attente'}
                </Ligne>
                <Ligne label="IBAN du demandeur">{demandeur?.iban ?? '—'}</Ligne>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Rejet */}
      <Modal
        open={rejetOuvert}
        onClose={() => setRejetOuvert(false)}
        title={`Rejeter la note ${n.numero} ?`}
        description="Le motif est transmis au demandeur et consigné dans l'historique."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejetOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="danger"
              loading={enCours}
              disabled={!motif.trim()}
              onClick={() => {
                const m = motif
                setRejetOuvert(false)
                void executer(() => rejeter(n.id, m, n.statut === 'soumise' ? 'responsable' : 'tresorier'), {
                  titre: 'Note rejetée',
                  detail: 'Le demandeur a été notifié avec le motif.',
                })
              }}
            >
              Rejeter la note
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <WorkflowStepper note={n} compact />
          <Field label="Motif du rejet" required hint="Sans motif, le demandeur ne saura pas quoi corriger.">
            {(p) => (
              <Textarea {...p} rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Justificatif illisible : merci de joindre une photo nette du ticket." />
            )}
          </Field>
          {!motif.trim() && <p className="text-xs font-medium text-warning-600">Le motif est obligatoire.</p>}
        </div>
      </Modal>

      {/* Justificatif */}
      <Modal
        open={pieceOuverte}
        onClose={() => setPieceOuverte(false)}
        title="Joindre un justificatif"
        description="Photo du ticket, facture reçue par courriel ou reçu de paiement."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPieceOuverte(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nomPiece.trim()}
              onClick={() => {
                const nom = nomPiece.trim()
                setPieceOuverte(false)
                void executer(() => attacherJustificatif(n.id, nom, false), {
                  titre: 'Justificatif ajouté',
                  detail: `${nom} est rattaché à la note.`,
                })
              }}
            >
              Joindre
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border border-dashed border-ink-300 bg-ink-25 px-4 py-6 text-center">
            <Upload aria-hidden className="mx-auto h-6 w-6 text-ink-500" />
            <p className="mt-2 text-[0.8125rem] font-medium text-ink-800">Déposez le fichier ici</p>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-ink-500">
              Le dépôt réel de fichiers arrive avec le module Documents. Indiquez pour l'instant le nom de la pièce.
            </p>
            <div className="mt-3">
              <Button size="sm" onClick={() => navigate(`/notes-de-frais/${n.id}/scan`)}>
                Scanner un justificatif
              </Button>
            </div>
          </div>
          <Field label="Nom du justificatif" required>
            {(p) => <Input {...p} value={nomPiece} onChange={(e) => setNomPiece(e.target.value)} placeholder="ticket-peage-2026-09-01.jpg" />}
          </Field>
        </div>
      </Modal>
    </Page>
  )
}
