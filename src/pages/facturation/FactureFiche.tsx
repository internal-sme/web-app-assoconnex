import { usePageTitle } from '@/hooks/usePageTitle'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ban,
  Copy,
  Download,
  FileMinus,
  FileText,
  Pencil,
  Send,
  Upload,
  Wallet,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Menu } from '@/components/ui/Menu'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { Timeline } from '@/components/ui/Timeline'
import { FactNav } from '@/components/facturation/FactNav'
import { cleFacture } from '@/components/facturation/statuts'
import { useFacturation } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'
import {
  joursRetard,
  ligneHT,
  moyenReglementLabels,
  resteDuFacture,
  statutFacture,
  totalHT,
  totalRegle,
  totalTTC,
  totalTVA,
  ventilationTVA,
  type Facture,
  type MoyenReglement,
} from '@/lib/facturation'
import { formatDate, formatDateLong, formatMoney } from '@/lib/utils'

const onglets = [
  { id: 'lignes', label: 'Lignes' },
  { id: 'paiements', label: 'Paiements' },
  { id: 'relances', label: 'Relances' },
  { id: 'documents', label: 'Documents' },
  { id: 'historique', label: 'Historique' },
]

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
      <dt className="text-[0.8125rem] text-ink-500">{label}</dt>
      <dd className="ac-num text-right text-[0.8125rem] font-medium text-ink-900">{children}</dd>
    </div>
  )
}

export function FactureFiche() {
  usePageTitle('Facture')

  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { factureParId, clientParId, modeles, chargement, dupliquer, envoyer, annuler, enregistrerReglement, relancer } =
    useFacturation()

  const [onglet, setOnglet] = useState('lignes')
  const [reglementOuvert, setReglementOuvert] = useState(params.get('reglement') === '1')
  const [aAnnuler, setAAnnuler] = useState(false)
  const [motif, setMotif] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null)

  const f = factureParId(id)

  const [montant, setMontant] = useState('')
  const [dateReglement, setDateReglement] = useState(new Date().toISOString().slice(0, 10))
  const [moyen, setMoyen] = useState<MoyenReglement>('virement')
  const [reference, setReference] = useState('')

  if (chargement) {
    return (
      <Page header={<PageHeader title="Facture" />}>
        <Card className="p-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </Card>
      </Page>
    )
  }

  if (!f) {
    return (
      <Page header={<PageHeader title="Facture introuvable" />}>
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Ce document n'existe plus"
            description="Il a peut-être été supprimé alors qu'il était encore en brouillon."
            action={<Button variant="primary" onClick={() => navigate('/facturation/factures')}>Retour aux factures</Button>}
          />
        </Card>
      </Page>
    )
  }

  const client = clientParId(f.clientId)
  const modele = modeles.find((m) => m.id === f.modeleId)
  const statut = statutFacture(f)
  const reste = resteDuFacture(f)
  const sansLigne = f.lignes.length === 0
  const avoir = f.type === 'avoir'

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, apres?: () => void) => {
    setEnCours(true)
    setErreurEnvoi(null)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      apres?.()
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
      throw e
    } finally {
      setEnCours(false)
    }
  }

  const lancerEnvoi = () => {
    void executer(() => envoyer(f.id), {
      titre: avoir ? 'Avoir envoyé' : 'Facture envoyée',
      detail: `${f.numero} transmise à ${client?.email ?? 'l’adresse du client'}.`,
    }).catch((e) => setErreurEnvoi((e as Error).message))
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow={avoir ? 'Facturation · avoir' : 'Facturation'}
          title={f.numero}
          description={`${client?.nom ?? 'Client inconnu'} · ${f.objet}`}
          meta={
            <>
              <StatusBadge status={cleFacture(f)} />
              <Badge variant="outline">{formatMoney(totalTTC(f))} TTC</Badge>
              {reste > 0 && statut !== 'annulee' && <Badge variant="outline">Reste dû {formatMoney(reste)}</Badge>}
              {f.factureOrigineId && <Badge>Adossé à une facture</Badge>}
            </>
          }
          actions={
            <>
              <Button onClick={() => navigate(avoir ? '/facturation/avoirs' : '/facturation/factures')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Liste
              </Button>
              <Button onClick={() => navigate(`/facturation/factures/${f.id}/apercu`)} iconLeft={<FileText aria-hidden className="h-4 w-4" />}>
                Aperçu
              </Button>
              {statut === 'brouillon' ? (
                <Button variant="primary" loading={enCours} disabled={sansLigne} onClick={lancerEnvoi} iconLeft={<Send aria-hidden className="h-4 w-4" />}>
                  Envoyer
                </Button>
              ) : reste > 0 && statut !== 'annulee' ? (
                <Button variant="primary" onClick={() => setReglementOuvert(true)} iconLeft={<Wallet aria-hidden className="h-4 w-4" />}>
                  Enregistrer un paiement
                </Button>
              ) : null}
              <Menu
                label={`Autres actions pour ${f.numero}`}
                items={[
                  ...(statut === 'brouillon'
                    ? [{ label: 'Modifier', icon: <Pencil />, onSelect: () => navigate(`/facturation/factures/${f.id}/modifier`) }]
                    : []),
                  {
                    label: 'Dupliquer',
                    icon: <Copy />,
                    onSelect: () =>
                      void (async () => {
                        try {
                          const copie = await dupliquer(f.id)
                          toast({ titre: 'Document dupliqué', detail: `${copie.numero} créé en brouillon.`, tone: 'success' })
                          navigate(`/facturation/factures/${copie.id}/modifier`)
                        } catch (e) {
                          toast({ titre: 'Duplication impossible', detail: (e as Error).message, tone: 'danger' })
                        }
                      })(),
                  },
                  ...(statut !== 'brouillon' && statut !== 'annulee'
                    ? [{ label: 'Renvoyer au client', icon: <Send />, onSelect: lancerEnvoi }]
                    : []),
                  {
                    label: 'Télécharger le PDF',
                    icon: <Download />,
                    onSelect: () => toast({ titre: 'Génération du PDF', detail: 'La génération de document arrive en V2.', tone: 'neutral' }),
                  },
                  ...(reste > 0 && statut !== 'annulee' && statut !== 'brouillon'
                    ? [
                        {
                          label: 'Relancer le client',
                          icon: <Send />,
                          onSelect: () =>
                            void executer(() => relancer(f.id, 'email'), {
                              titre: 'Relance envoyée',
                              detail: `Niveau ${Math.min(f.relances.length + 1, 3)} — transmise par e-mail.`,
                            }).catch((e) => setErreurEnvoi((e as Error).message)),
                        },
                      ]
                    : []),
                  ...(!avoir && statut !== 'brouillon' && statut !== 'annulee'
                    ? [{ label: 'Créer un avoir', icon: <FileMinus />, onSelect: () => navigate(`/facturation/factures/${f.id}/avoir`) }]
                    : []),
                  { type: 'separator' as const },
                  ...(statut !== 'annulee'
                    ? [{ label: 'Annuler la facture', icon: <Ban />, danger: true, onSelect: () => { setMotif(''); setAAnnuler(true) } }]
                    : []),
                ]}
                trigger={({ toggle, open, ref }) => (
                  <Button ref={ref} variant="icon" label="Autres actions" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                    <span aria-hidden className="text-lg leading-none">⋯</span>
                  </Button>
                )}
              />
            </>
          }
        />
      }
    >
      <FactNav />

      {erreurEnvoi && (
        <Alert tone="danger" titre="L'envoi a échoué" action={<Button size="sm" loading={enCours} onClick={lancerEnvoi}>Réessayer</Button>}>
          {erreurEnvoi} Le document reste en l'état, rien n'a été perdu.
        </Alert>
      )}

      {sansLigne && (
        <Alert
          tone="warning"
          titre="Cette facture ne comporte aucune ligne"
          action={
            <Button size="sm" onClick={() => navigate(`/facturation/factures/${f.id}/modifier`)} iconLeft={<Pencil aria-hidden className="h-3.5 w-3.5" />}>
              Ajouter des lignes
            </Button>
          }
        >
          Son total est nul et elle ne peut pas être envoyée. Ajoutez au moins une prestation.
        </Alert>
      )}

      {statut === 'annulee' && (
        <Alert tone="neutral" titre="Facture annulée">
          Annulée le {f.annuleeLe ? formatDateLong(f.annuleeLe) : '—'}
          {f.motifAnnulation ? ` — ${f.motifAnnulation}` : ''}. Le numéro reste réservé : la séquence de numérotation ne
          comporte aucun trou.
        </Alert>
      )}

      {statut === 'retard' && (
        <Alert
          tone="danger"
          titre={`Échéance dépassée de ${joursRetard(f)} jour(s)`}
          action={
            <Button
              size="sm"
              loading={enCours}
              onClick={() =>
                void executer(() => relancer(f.id, 'email'), {
                  titre: 'Relance envoyée',
                  detail: `Niveau ${Math.min(f.relances.length + 1, 3)}.`,
                }).catch((e) => setErreurEnvoi((e as Error).message))
              }
              iconLeft={<Send aria-hidden className="h-3.5 w-3.5" />}
            >
              Relancer
            </Button>
          }
        >
          {formatMoney(reste)} restent dus. {f.relances.length} relance(s) déjà envoyée(s).
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Tabs items={onglets} value={onglet} onChange={setOnglet} ariaLabel="Sections de la facture" />

          <div role="tabpanel" aria-label={onglets.find((o) => o.id === onglet)?.label}>
            {onglet === 'lignes' && <Lignes facture={f} onModifier={() => navigate(`/facturation/factures/${f.id}/modifier`)} />}

            {onglet === 'paiements' &&
              (f.reglements.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<Wallet />}
                    title="Aucun règlement enregistré"
                    description={avoir ? "Un avoir ne fait pas l'objet d'un encaissement." : 'Le client n’a pas encore réglé cette facture.'}
                    compact
                    action={
                      !avoir && statut !== 'annulee' ? (
                        <Button variant="primary" onClick={() => setReglementOuvert(true)}>
                          Enregistrer un paiement
                        </Button>
                      ) : undefined
                    }
                  />
                </Card>
              ) : (
                <Card>
                  <CardHeader title="Règlements" description={`${formatMoney(totalRegle(f))} encaissés sur ${formatMoney(totalTTC(f))}.`} />
                  <ul className="divide-y divide-ink-100">
                    {[...f.reglements].sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => (
                      <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
                          <Wallet className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="ac-num text-[0.8125rem] font-medium text-ink-900">
                            {formatMoney(r.montant)} · {moyenReglementLabels[r.moyen]}
                          </p>
                          <p className="ac-num truncate text-xs text-ink-500">
                            {formatDate(r.date)} · {r.reference || 'sans référence'}
                          </p>
                        </div>
                        <StatusBadge status="paiement_encaisse" />
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}

            {onglet === 'relances' &&
              (f.relances.length === 0 ? (
                <Card>
                  <EmptyState icon={<Send />} title="Aucune relance" description="Aucun rappel n'a été adressé au client pour ce document." compact />
                </Card>
              ) : (
                <Card>
                  <CardHeader title="Relances" description="Rappels adressés au client, du plus récent au plus ancien." />
                  <ul className="divide-y divide-ink-100">
                    {[...f.relances].sort((a, b) => (a.date < b.date ? 1 : -1)).map((r) => (
                      <li key={r.id} className="flex items-center gap-3 px-5 py-3">
                        <Badge variant="outline">Niveau {r.niveau}</Badge>
                        <div className="min-w-0 flex-1">
                          <p className="text-[0.8125rem] font-medium text-ink-900">{r.objet}</p>
                          <p className="ac-num truncate text-xs text-ink-500">
                            {formatDate(r.date)} · par {r.canal}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}

            {onglet === 'documents' && (
              <Card>
                <CardHeader
                  title="Documents"
                  description="Conventions, bons de commande et justificatifs rattachés."
                  action={
                    <Button size="sm" onClick={() => toast({ titre: 'Dépôt de document', detail: 'Le stockage de fichiers arrive avec le module Documents.', tone: 'neutral' })} iconLeft={<Upload aria-hidden className="h-3.5 w-3.5" />}>
                      Ajouter
                    </Button>
                  }
                />
                {f.documents.length === 0 ? (
                  <EmptyState icon={<FileText />} title="Aucun document rattaché" description="Déposez la convention ou le bon de commande du client." compact />
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {f.documents.map((d) => (
                      <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                        <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
                          <FileText className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.8125rem] font-medium text-ink-900">{d.nom}</p>
                          <p className="ac-num truncate text-xs text-ink-500">
                            {d.taille} · ajouté le {formatDate(d.ajouteLe)}
                          </p>
                        </div>
                        <Badge variant="outline">{d.type}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {onglet === 'historique' && (
              <Card>
                <CardHeader title="Historique" description="Toutes les actions consignées sur ce document." />
                <CardBody>
                  <Timeline evenements={f.historique} />
                </CardBody>
              </Card>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Récapitulatif" />
            <CardBody className="py-0">
              <dl>
                <Ligne label="Total HT">{formatMoney(totalHT(f))}</Ligne>
                {ventilationTVA(f).map((v) => (
                  <Ligne key={v.taux} label={`TVA ${v.taux} % sur ${formatMoney(v.base)}`}>
                    {formatMoney(v.montant)}
                  </Ligne>
                ))}
                <Ligne label="Total TVA">{formatMoney(totalTVA(f))}</Ligne>
                <Ligne label="Total TTC">{formatMoney(totalTTC(f))}</Ligne>
                <Ligne label="Déjà réglé">{formatMoney(totalRegle(f))}</Ligne>
                <Ligne label="Reste dû">{formatMoney(reste)}</Ligne>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Client" action={<Button size="sm" variant="ghost" onClick={() => navigate('/facturation/clients')}>Fiche</Button>} />
            <CardBody className="py-0">
              <dl>
                <Ligne label="Raison sociale">{client?.nom ?? '—'}</Ligne>
                <Ligne label="Contact">{client?.contact ?? '—'}</Ligne>
                <Ligne label="Courriel">{client?.email ?? '—'}</Ligne>
                <Ligne label="Délai de paiement">{client?.delaiPaiement ?? 0} jours</Ligne>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Document" />
            <CardBody className="py-0">
              <dl>
                <Ligne label="Numéro">{f.numero}</Ligne>
                <Ligne label="Date d’émission">{formatDate(f.date)}</Ligne>
                <Ligne label="Échéance">{formatDate(f.echeance)}</Ligne>
                <Ligne label="Référence">{f.reference || '—'}</Ligne>
                <Ligne label="Modèle">{modele?.nom ?? '—'}</Ligne>
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Enregistrement d'un règlement */}
      <Modal
        open={reglementOuvert}
        onClose={() => setReglementOuvert(false)}
        title="Enregistrer un paiement"
        description={`Reste dû sur ${f.numero} : ${formatMoney(reste)}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setReglementOuvert(false)} disabled={enCours}>
              Annuler
            </Button>
            <Button
              variant="primary"
              loading={enCours}
              onClick={() => {
                const m = Number(montant || reste)
                if (m <= 0 || m > reste) {
                  toast({ titre: 'Montant invalide', detail: `Le montant doit être compris entre 0 et ${formatMoney(reste)}.`, tone: 'warning' })
                  return
                }
                void executer(
                  () => enregistrerReglement(f.id, { montant: m, date: new Date(dateReglement).toISOString(), moyen, reference }),
                  { titre: 'Paiement enregistré', detail: `${formatMoney(m)} par ${moyenReglementLabels[moyen].toLowerCase()}.` },
                  () => {
                    setReglementOuvert(false)
                    setMontant('')
                    setOnglet('paiements')
                  },
                ).catch(() => undefined)
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Montant" required hint={`Un montant inférieur crée un règlement partiel.`}>
            {(p) => (
              <Input {...p} type="number" min={0} step="0.01" suffix="€" value={montant} placeholder={String(reste)} onChange={(e) => setMontant(e.target.value)} />
            )}
          </Field>
          <Field label="Date d’encaissement" required>
            {(p) => <Input {...p} type="date" value={dateReglement} onChange={(e) => setDateReglement(e.target.value)} />}
          </Field>
          <Field label="Moyen de paiement" required>
            {(p) => (
              <Select
                {...p}
                value={moyen}
                onChange={(e) => setMoyen(e.target.value as MoyenReglement)}
                options={(Object.keys(moyenReglementLabels) as MoyenReglement[]).map((m) => ({ value: m, label: moyenReglementLabels[m] }))}
              />
            )}
          </Field>
          <Field label="Référence" hint="Numéro de virement ou de chèque.">
            {(p) => <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="VIR-2026-118" />}
          </Field>
        </div>
      </Modal>

      {/* Annulation — action sensible */}
      <ConfirmDialog
        open={aAnnuler}
        loading={enCours}
        onClose={() => setAAnnuler(false)}
        onConfirm={() => {
          setAAnnuler(false)
          void executer(() => annuler(f.id, motif), {
            titre: 'Facture annulée',
            detail: `${f.numero} ne compte plus dans le chiffre d'affaires.`,
          }).catch(() => undefined)
        }}
        title={`Annuler la facture ${f.numero} ?`}
        description={`${client?.nom ?? ''} — ${formatMoney(totalTTC(f))}. Elle sortira du chiffre d'affaires, des encours et des relances.`}
        confirmLabel="Annuler la facture"
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
            Le document et son numéro sont conservés : la séquence de numérotation ne doit comporter aucun trou. Une
            facture déjà réglée se corrige par un avoir, pas par une annulation.
          </div>
          <Field label="Motif d’annulation" hint="Consigné dans l’historique.">
            {(p) => <Textarea {...p} rows={2} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Prestation annulée par le client." />}
          </Field>
        </div>
      </ConfirmDialog>
    </Page>
  )
}

function Lignes({ facture, onModifier }: { facture: Facture; onModifier: () => void }) {
  if (facture.lignes.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<FileText />}
          title="Aucune ligne sur ce document"
          description="Une facture doit comporter au moins une prestation pour être envoyée au client."
          compact
          action={<Button variant="primary" onClick={onModifier}>Ajouter des lignes</Button>}
        />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Lignes" description={`${facture.lignes.length} prestation(s) facturée(s).`} />
      <div className="ac-scroll overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">Lignes de la facture {facture.numero}</caption>
          <thead>
            <tr className="border-b border-ink-100 bg-ink-25">
              {['Désignation', 'Quantité', 'Prix unitaire HT', 'Remise', 'TVA', 'Total HT'].map((h, i) => (
                <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 1 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {facture.lignes.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2.5 text-[0.8125rem] text-ink-900">{l.designation}</td>
                <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-700">
                  {l.quantite} {l.unite}
                </td>
                <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-700">{formatMoney(l.prixHT)}</td>
                <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-700">{l.remise > 0 ? `${l.remise} %` : '—'}</td>
                <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-700">{l.tva} %</td>
                <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-medium text-ink-900">{formatMoney(ligneHT(l))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink-200 bg-ink-25">
              <td colSpan={5} className="px-4 py-2.5 text-right text-[0.8125rem] font-semibold text-ink-900">
                Total HT
              </td>
              <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-semibold text-ink-900">{formatMoney(totalHT(facture))}</td>
            </tr>
            <tr className="bg-ink-25">
              <td colSpan={5} className="px-4 py-2.5 text-right text-[0.8125rem] font-semibold text-ink-900">
                Total TTC
              </td>
              <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-semibold text-ink-900">{formatMoney(totalTTC(facture))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}
