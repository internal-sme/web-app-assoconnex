import { usePageTitle } from '@/hooks/usePageTitle'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ban,
  CreditCard,
  FileText,
  Mail,
  Pencil,
  RotateCw,
  Upload,
  Users,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
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
import { cleAdhesion, cleCotisation, clePaiement } from '@/components/adherents/statuts'
import { useAdherents } from '@/context/AdherentsContext'
import { useToast } from '@/context/ToastContext'
import {
  age,
  joursAvant,
  montantPaye,
  moyenLabels,
  resteDu,
  statutAdhesion,
  trancheAge,
  type Adherent,
} from '@/lib/adherents'
import { formatDate, formatDateLong, formatMoney } from '@/lib/utils'

const onglets = [
  { id: 'profil', label: 'Profil' },
  { id: 'adhesion', label: 'Adhésion' },
  { id: 'cotisations', label: 'Cotisations' },
  { id: 'paiements', label: 'Paiements' },
  { id: 'documents', label: 'Documents' },
  { id: 'historique', label: 'Historique' },
]

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink-100 py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="w-52 shrink-0 text-[0.8125rem] text-ink-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-[0.8125rem] text-ink-900">{children}</dd>
    </div>
  )
}

export function AdherentFiche() {
  usePageTitle('Fiche adhérent')

  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { parId, typeParId, chargement, desactiver, reactiver, ajouterDocument } = useAdherents()

  const [onglet, setOnglet] = useState('profil')
  const [aDesactiver, setADesactiver] = useState(false)
  const [motif, setMotif] = useState('')
  const [docOuvert, setDocOuvert] = useState(false)
  const [nomDoc, setNomDoc] = useState('')
  const [catDoc, setCatDoc] = useState('Adhésion')
  const [enCours, setEnCours] = useState(false)

  const adherent = parId(id)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Fiche adhérent" />}>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </Card>
      </Page>
    )
  }

  if (!adherent) {
    return (
      <Page header={<PageHeader title="Adhérent introuvable" />}>
        <Card>
          <EmptyState
            icon={<Users />}
            title="Cette fiche n'existe plus"
            description="Elle a peut-être été supprimée. La liste des adhérents reste accessible."
            action={<Button variant="primary" onClick={() => navigate('/adherents/liste')}>Retour à la liste</Button>}
          />
        </Card>
      </Page>
    )
  }

  const type = typeParId(adherent.typeId)
  const statut = statutAdhesion(adherent)
  const reste = resteDu(adherent)
  const jours = joursAvant(adherent.dateFin)

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, apres?: () => void) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      apres?.()
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
          eyebrow="Adhérents"
          title={`${adherent.prenom} ${adherent.nom}`}
          description={`${type?.nom ?? 'Formule inconnue'} · adhérent depuis le ${formatDate(adherent.premiereAdhesion)}`}
          meta={
            <>
              <StatusBadge status={cleAdhesion(adherent)} />
              <span className="ac-num text-2xs text-ink-500">{adherent.numero}</span>
              {reste > 0 && <Badge variant="outline">Reste dû {formatMoney(reste)}</Badge>}
            </>
          }
          actions={
            <>
              <Button onClick={() => navigate('/adherents/liste')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Liste
              </Button>
              {reste > 0 && (
                <Button
                  onClick={() => navigate(`/adherents/${adherent.id}/paiement`)}
                  iconLeft={<CreditCard aria-hidden className="h-4 w-4" />}
                >
                  Enregistrer un paiement
                </Button>
              )}
              <Button
                variant="primary"
                onClick={() => navigate(`/adherents/${adherent.id}/renouveler`)}
                iconLeft={<RotateCw aria-hidden className="h-4 w-4" />}
              >
                Renouveler
              </Button>
              <Menu
                label={`Autres actions pour ${adherent.prenom} ${adherent.nom}`}
                items={[
                  {
                    label: 'Modifier la fiche',
                    icon: <Pencil />,
                    onSelect: () => toast({ titre: 'Modification de la fiche', detail: 'L’identité de l’adhérent se modifie depuis sa fiche contact.', tone: 'neutral' }),
                  },
                  ...(reste === 0
                    ? [{ label: 'Enregistrer un paiement', icon: <CreditCard />, onSelect: () => navigate(`/adherents/${adherent.id}/paiement`) }]
                    : []),
                  {
                    label: 'Envoyer un e-mail',
                    icon: <Mail />,
                    onSelect: () => toast({ titre: 'Brouillon préparé', detail: `Destinataire : ${adherent.email}`, tone: 'neutral' }),
                  },
                  { label: 'Ajouter un document', icon: <Upload />, onSelect: () => setDocOuvert(true) },
                  { type: 'separator' },
                  adherent.resilieeLe
                    ? { label: 'Réactiver l’adhésion', icon: <RotateCw />, onSelect: () => void executer(() => reactiver(adherent.id), { titre: 'Adhésion réactivée', detail: 'La désactivation a été annulée.' }) }
                    : { label: 'Désactiver l’adhésion', icon: <Ban />, danger: true, onSelect: () => setADesactiver(true) },
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
      {adherent.resilieeLe && (
        <Alert
          tone="neutral"
          titre="Adhésion désactivée"
          action={
            <Button size="sm" loading={enCours} onClick={() => void executer(() => reactiver(adherent.id), { titre: 'Adhésion réactivée', detail: 'La désactivation a été annulée.' })}>
              Réactiver
            </Button>
          }
        >
          Désactivée le {formatDateLong(adherent.resilieeLe)}
          {adherent.motifResiliation ? ` — ${adherent.motifResiliation}` : ''}. Les cotisations en attente ont été annulées.
        </Alert>
      )}
      {!adherent.resilieeLe && statut === 'expirant' && (
        <Alert
          tone="warning"
          titre={`L'adhésion expire dans ${jours} jour(s)`}
          action={
            <Button size="sm" onClick={() => navigate(`/adherents/${adherent.id}/renouveler`)} iconLeft={<RotateCw aria-hidden className="h-3.5 w-3.5" />}>
              Renouveler
            </Button>
          }
        >
          Échéance au {formatDateLong(adherent.dateFin)}. Un renouvellement anticipé prolonge à partir de la date choisie.
        </Alert>
      )}
      {!adherent.resilieeLe && statut === 'expiree' && (
        <Alert
          tone="danger"
          titre={`L'adhésion est expirée depuis ${-jours} jour(s)`}
          action={
            <Button size="sm" onClick={() => navigate(`/adherents/${adherent.id}/renouveler`)} iconLeft={<RotateCw aria-hidden className="h-3.5 w-3.5" />}>
              Renouveler
            </Button>
          }
        >
          L'adhérent ne bénéficie plus de l'assurance ni de l'accès aux sections tant que l'adhésion n'est pas renouvelée.
        </Alert>
      )}

      <Tabs items={onglets} value={onglet} onChange={setOnglet} ariaLabel="Sections de la fiche adhérent" />

      <div role="tabpanel" aria-label={onglets.find((o) => o.id === onglet)?.label}>
        {onglet === 'profil' && <Profil adherent={adherent} />}
        {onglet === 'adhesion' && <Adhesion adherent={adherent} />}
        {onglet === 'cotisations' && <Cotisations adherent={adherent} />}
        {onglet === 'paiements' && <Paiements adherent={adherent} />}
        {onglet === 'documents' && <Documents adherent={adherent} onAjouter={() => setDocOuvert(true)} />}
        {onglet === 'historique' && (
          <Card>
            <CardHeader title="Historique" description="Adhésions, cotisations, paiements et actions administratives." />
            <CardBody>
              <Timeline evenements={adherent.historique} />
            </CardBody>
          </Card>
        )}
      </div>

      {/* Désactivation — action sensible */}
      <ConfirmDialog
        open={aDesactiver}
        onClose={() => setADesactiver(false)}
        onConfirm={() => {
          const m = motif
          setADesactiver(false)
          setMotif('')
          void executer(() => desactiver(adherent.id, m), {
            titre: 'Adhésion désactivée',
            detail: `${adherent.prenom} ${adherent.nom} sort des effectifs actifs.`,
          })
        }}
        title="Désactiver cette adhésion ?"
        description={`${adherent.prenom} ${adherent.nom} sortira des effectifs actifs et des relances. Les cotisations en attente seront annulées.`}
        confirmLabel="Désactiver l'adhésion"
      >
        <div className="flex flex-col gap-3">
          <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
            L'action est réversible : la fiche, l'historique et les paiements encaissés sont conservés.
          </div>
          <Field label="Motif de désactivation" hint="Consigné dans l'historique de la fiche.">
            {(p) => (
              <Textarea {...p} rows={2} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Déménagement hors région" />
            )}
          </Field>
        </div>
      </ConfirmDialog>

      {/* Ajout de document */}
      <Modal
        open={docOuvert}
        onClose={() => setDocOuvert(false)}
        title="Ajouter un document"
        description="Le fichier est rattaché à la fiche de l'adhérent."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDocOuvert(false)} disabled={enCours}>
              Annuler
            </Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nomDoc.trim()}
              onClick={() => {
                const n = nomDoc.trim()
                const c = catDoc
                void executer(
                  () => ajouterDocument(adherent.id, n, c),
                  { titre: 'Document ajouté', detail: `${n} est rattaché à la fiche.` },
                  () => {
                    setDocOuvert(false)
                    setNomDoc('')
                    setOnglet('documents')
                  },
                )
              }}
            >
              Ajouter le document
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Nom du document" required>
            {(p) => <Input {...p} value={nomDoc} onChange={(e) => setNomDoc(e.target.value)} placeholder="Certificat médical 2026" />}
          </Field>
          <Field label="Catégorie">
            {(p) => (
              <Select
                {...p}
                value={catDoc}
                onChange={(e) => setCatDoc(e.target.value)}
                options={['Adhésion', 'Santé', 'Autorisation', 'Justificatif', 'Comptabilité'].map((c) => ({ value: c, label: c }))}
              />
            )}
          </Field>
        </div>
      </Modal>
    </Page>
  )
}

/* ---------------- onglets ---------------- */

function Profil({ adherent }: { adherent: Adherent }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Coordonnées" description="Reprises de la fiche contact de l'adhérent." />
        <CardBody className="py-0">
          <dl>
            <Ligne label="Civilité">{adherent.civilite}</Ligne>
            <Ligne label="Nom complet">
              {adherent.prenom} {adherent.nom}
            </Ligne>
            <Ligne label="Date de naissance">
              <span className="ac-num">{formatDateLong(adherent.dateNaissance)}</span>
              <span className="ml-2 text-ink-500">
                ({age(adherent.dateNaissance)} ans · {trancheAge(adherent.dateNaissance)})
              </span>
            </Ligne>
            <Ligne label="Adresse e-mail">
              {adherent.email}
            </Ligne>
            <Ligne label="Téléphone">
              <span className="ac-num">{adherent.telephone}</span>
            </Ligne>
            <Ligne label="Commune">
              <span className="ac-num">{adherent.codePostal}</span> {adherent.ville}
            </Ligne>
          </dl>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardBody className="flex flex-col items-center gap-3 text-center">
            <Avatar name={`${adherent.prenom} ${adherent.nom}`} size="xl" />
            <div>
              <p className="font-display text-[0.9375rem] font-semibold text-ink-900">
                {adherent.prenom} {adherent.nom}
              </p>
              <p className="ac-num text-[0.8125rem] text-ink-500">{adherent.numero}</p>
            </div>
            <StatusBadge status={cleAdhesion(adherent)} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Note interne" />
          <CardBody>
            <p className="text-[0.8125rem] leading-relaxed text-ink-700">
              {adherent.notes || <span className="text-ink-500">Aucune note pour cet adhérent.</span>}
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Adhesion({ adherent }: { adherent: Adherent }) {
  const { typeParId } = useAdherents()
  const type = typeParId(adherent.typeId)
  const jours = joursAvant(adherent.dateFin)
  const renouvellements = adherent.cotisations.length - 1

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Adhésion en cours" />
        <CardBody className="py-0">
          <dl>
            <Ligne label="Statut">
              <StatusBadge status={cleAdhesion(adherent)} />
            </Ligne>
            <Ligne label="Type d’adhésion">
              {type?.nom ?? '—'}
              <span className="ml-2 text-ink-500">{type ? `${formatMoney(type.montant)} · ${type.dureeMois} mois` : ''}</span>
            </Ligne>
            <Ligne label="Période">
              <span className="ac-num">
                du {formatDate(adherent.dateDebut)} au {formatDate(adherent.dateFin)}
              </span>
            </Ligne>
            <Ligne label="Échéance">
              <span className="ac-num">{formatDateLong(adherent.dateFin)}</span>
              {!adherent.resilieeLe && (
                <span className="ml-2 text-ink-500">{jours < 0 ? `dépassée de ${-jours} jours` : `dans ${jours} jours`}</span>
              )}
            </Ligne>
            <Ligne label="Reconduction tacite">{type?.reconduction ? 'Oui' : 'Non'}</Ligne>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Ancienneté" description="Parcours de l'adhérent dans l'association." />
        <CardBody className="py-0">
          <dl>
            <Ligne label="Première adhésion">
              <span className="ac-num">{formatDateLong(adherent.premiereAdhesion)}</span>
            </Ligne>
            <Ligne label="Renouvellements">
              <span className="ac-num">{renouvellements}</span>
            </Ligne>
            <Ligne label="Exercices couverts">
              <span className="flex flex-wrap gap-1.5">
                {Array.from(new Set(adherent.cotisations.map((c) => c.exercice))).map((e) => (
                  <Badge key={e} variant="outline">
                    {e}
                  </Badge>
                ))}
              </span>
            </Ligne>
            <Ligne label="Total encaissé">
              <span className="ac-num font-medium">
                {formatMoney(adherent.paiements.filter((p) => p.statut === 'valide').reduce((s, p) => s + p.montant, 0))}
              </span>
            </Ligne>
            <Ligne label="Reste dû">
              <span className={resteDu(adherent) > 0 ? 'ac-num font-medium text-warning-600' : 'ac-num text-ink-500'}>
                {resteDu(adherent) > 0 ? formatMoney(resteDu(adherent)) : 'Rien à encaisser'}
              </span>
            </Ligne>
          </dl>
        </CardBody>
      </Card>
    </div>
  )
}

function Cotisations({ adherent }: { adherent: Adherent }) {
  const navigate = useNavigate()
  const cotisations = [...adherent.cotisations].reverse()
  return (
    <Card>
      <CardHeader
        title="Cotisations"
        description="Une cotisation par exercice, du plus récent au plus ancien."
        action={
          resteDu(adherent) > 0 ? (
            <Button size="sm" onClick={() => navigate(`/adherents/${adherent.id}/paiement`)} iconLeft={<CreditCard aria-hidden className="h-3.5 w-3.5" />}>
              Enregistrer un paiement
            </Button>
          ) : undefined
        }
      />
      <div className="ac-scroll overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">Cotisations de l'adhérent, par exercice</caption>
          <thead>
            <tr className="border-b border-ink-100 bg-ink-25">
              {['Exercice', 'Formule', 'Émise le', 'Échéance', 'Montant', 'Payé', 'Statut'].map((h, i) => (
                <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 4 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {cotisations.map((c) => {
              const paye = montantPaye(adherent, c.id)
              return (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 text-[0.8125rem] font-medium text-ink-900">{c.exercice}</td>
                  <td className="px-4 py-2.5 text-[0.8125rem] text-ink-700">{c.typeNom}</td>
                  <td className="ac-num px-4 py-2.5 text-[0.8125rem] text-ink-700">{formatDate(c.emiseLe)}</td>
                  <td className="ac-num px-4 py-2.5 text-[0.8125rem] text-ink-700">{formatDate(c.echeanceLe)}</td>
                  <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-900">{formatMoney(c.montant)}</td>
                  <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-700">{formatMoney(paye)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <StatusBadge status={cleCotisation(c.statut)} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function Paiements({ adherent }: { adherent: Adherent }) {
  const navigate = useNavigate()
  const paiements = [...adherent.paiements].sort((a, b) => (a.date < b.date ? 1 : -1))

  if (paiements.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<CreditCard />}
          title="Aucun paiement enregistré"
          description="La cotisation en cours n'a encore fait l'objet d'aucun encaissement."
          compact
          action={
            <Button variant="primary" onClick={() => navigate(`/adherents/${adherent.id}/paiement`)}>
              Enregistrer un paiement
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Paiements"
        description="Encaissements rattachés aux cotisations, du plus récent au plus ancien."
        action={
          <Button size="sm" onClick={() => navigate(`/adherents/${adherent.id}/paiement`)} iconLeft={<CreditCard aria-hidden className="h-3.5 w-3.5" />}>
            Enregistrer un paiement
          </Button>
        }
      />
      <ul className="divide-y divide-ink-100">
        {paiements.map((p) => {
          const cot = adherent.cotisations.find((c) => c.id === p.cotisationId)
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
                <CreditCard className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] font-medium text-ink-900">
                  {formatMoney(p.montant)} · {moyenLabels[p.moyen]}
                </p>
                <p className="ac-num truncate text-xs text-ink-500">
                  {p.reference} · {formatDate(p.date)} · exercice {cot?.exercice ?? '—'} · encaissé par {p.encaissePar}
                </p>
              </div>
              <StatusBadge status={clePaiement(p.statut)} />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function Documents({ adherent, onAjouter }: { adherent: Adherent; onAjouter: () => void }) {
  return (
    <Card>
      <CardHeader
        title="Documents"
        description="Bulletins, certificats, autorisations et reçus fiscaux."
        action={
          <Button size="sm" onClick={onAjouter} iconLeft={<Upload aria-hidden className="h-3.5 w-3.5" />}>
            Ajouter un document
          </Button>
        }
      />
      {adherent.documents.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Aucun document"
          description="Déposez le bulletin d'adhésion signé ou un justificatif de tarif réduit."
          compact
          action={<Button variant="primary" onClick={onAjouter}>Ajouter un document</Button>}
        />
      ) : (
        <ul className="divide-y divide-ink-100">
          {adherent.documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-5 py-3">
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-ink-900">{d.nom}</p>
                <p className="ac-num truncate text-xs text-ink-500">
                  {d.taille} · ajouté le {formatDate(d.ajouteLe)} par {d.ajoutePar}
                </p>
              </div>
              <Badge variant="outline">{d.categorie}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
