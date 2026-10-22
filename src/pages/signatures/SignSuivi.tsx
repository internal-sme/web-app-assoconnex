import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, Download, FileSignature, PenLine, Send, X } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Menu } from '@/components/ui/Menu'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { Timeline } from '@/components/ui/Timeline'
import { SignNav } from '@/components/signatures/SignNav'
import { EditeurPlacement } from '@/components/signatures/Editeur'
import { cleDemande } from '@/components/documents/statuts'
import { useSignatures } from '@/context/SignaturesContext'
import { useToast } from '@/context/ToastContext'
import { champLabels, joursAvantEcheance, progression, signataireCourant, statutDemande } from '@/lib/signatures'
import { formatDate, formatDateLong, formatDateTime } from '@/lib/utils'

const onglets = [
  { id: 'suivi', label: 'Suivi' },
  { id: 'document', label: 'Document' },
  { id: 'champs', label: 'Champs' },
  { id: 'historique', label: 'Historique' },
]

export function SignSuivi() {
  usePageTitle('Suivi des signatures')

  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { demandeParId, chargement, signer, refuser, relancer, annuler, prolonger, envoyer } = useSignatures()

  const [onglet, setOnglet] = useState('suivi')
  const [refusOuvert, setRefusOuvert] = useState(false)
  const [motif, setMotif] = useState('')
  const [aAnnuler, setAAnnuler] = useState(false)
  const [motifAnnulation, setMotifAnnulation] = useState('')
  const [prolongerOuvert, setProlongerOuvert] = useState(false)
  const [nouvelleEcheance, setNouvelleEcheance] = useState('')
  const [aSigner, setASigner] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const d = demandeParId(id)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Demande de signature" />}>
        <Card className="p-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-4 h-3 w-full" />
        </Card>
      </Page>
    )
  }

  if (!d) {
    return (
      <Page header={<PageHeader title="Demande introuvable" />}>
        <Card>
          <EmptyState
            icon={<FileSignature />}
            title="Cette demande n'existe plus"
            description="Elle a peut-être été supprimée."
            action={<Button variant="primary" onClick={() => navigate('/signatures')}>Retour au tableau de bord</Button>}
          />
        </Card>
      </Page>
    )
  }

  const statut = statutDemande(d)
  const p = progression(d)
  const courant = signataireCourant(d)
  const moi = d.signataires.find((s) => s.estMoi)
  const monTour = !!courant?.estMoi && statut === 'en_attente'
  const jours = joursAvantEcheance(d)
  const refus = d.signataires.find((s) => s.statut === 'refuse')

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
          eyebrow="Signature électronique"
          title={d.titre}
          description={`${d.documentNom} · ${d.pages} page(s) · émise par ${d.createurNom}`}
          meta={
            <>
              <StatusBadge status={cleDemande[statut]} />
              <span className="ac-num text-2xs text-ink-500">{d.reference}</span>
              <Badge variant="outline">
                {p.signes} / {p.total} signé(s)
              </Badge>
            </>
          }
          actions={
            <>
              <Button onClick={() => navigate('/signatures')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Tableau de bord
              </Button>
              {statut === 'brouillon' && (
                <Button
                  variant="primary"
                  loading={enCours}
                  onClick={() => void executer(() => envoyer(d.id), { titre: 'Demande envoyée', detail: 'Les signataires ont reçu leur invitation.' })}
                  iconLeft={<Send aria-hidden className="h-4 w-4" />}
                >
                  Envoyer
                </Button>
              )}
              {monTour && (
                <>
                  <Button variant="danger" onClick={() => { setMotif(''); setRefusOuvert(true) }} iconLeft={<X aria-hidden className="h-4 w-4" />}>
                    Refuser
                  </Button>
                  <Button variant="primary" onClick={() => setASigner(true)} iconLeft={<PenLine aria-hidden className="h-4 w-4" />}>
                    Signer le document
                  </Button>
                </>
              )}
              {statut === 'terminee' && (
                <Button
                  variant="primary"
                  onClick={() => toast({ titre: 'Téléchargement', detail: `${d.fichierSigne} — la génération réelle arrive en V2.`, tone: 'neutral' })}
                  iconLeft={<Download aria-hidden className="h-4 w-4" />}
                >
                  Télécharger le document signé
                </Button>
              )}
              <Menu
                label={`Autres actions pour ${d.reference}`}
                items={[
                  ...(statut === 'en_attente'
                    ? [
                        {
                          label: 'Relancer les signataires',
                          icon: <Send />,
                          onSelect: () => void executer(() => relancer(d.id), { titre: 'Relance envoyée', detail: 'Un rappel a été adressé aux signataires en attente.' }),
                        },
                      ]
                    : []),
                  ...(statut === 'en_attente' || statut === 'expiree'
                    ? [{ label: 'Repousser l’échéance', icon: <Send />, onSelect: () => { setNouvelleEcheance(new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10)); setProlongerOuvert(true) } }]
                    : []),
                  { type: 'separator' as const },
                  ...(statut !== 'terminee' && statut !== 'annulee'
                    ? [{ label: 'Annuler la demande', icon: <Ban />, danger: true, onSelect: () => { setMotifAnnulation(''); setAAnnuler(true) } }]
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
      <SignNav />

      {monTour && (
        <Alert tone="warning" titre="Votre signature est attendue">
          C'est votre tour dans l'ordre de passage. Vérifiez le document avant de signer : une signature électronique
          engage l'association au même titre qu'une signature manuscrite.
        </Alert>
      )}

      {statut === 'refusee' && refus && (
        <Alert tone="danger" titre={`Signature refusée par ${refus.nom}`}>
          <strong>Motif : </strong>
          {refus.motifRefus}
          <br />
          Refusée le {refus.signeLe ? formatDateLong(refus.signeLe) : '—'}. Corrigez le document puis créez une nouvelle
          demande : une demande refusée ne se relance pas.
        </Alert>
      )}

      {statut === 'expiree' && (
        <Alert
          tone="danger"
          titre={`Demande expirée depuis ${-jours} jour(s)`}
          action={
            <Button size="sm" onClick={() => { setNouvelleEcheance(new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10)); setProlongerOuvert(true) }}>
              Repousser l'échéance
            </Button>
          }
        >
          {p.total - p.signes} signataire(s) n'ont pas répondu avant la date limite. Les liens de signature ne
          fonctionnent plus.
        </Alert>
      )}

      {statut === 'terminee' && (
        <Alert tone="success" titre="Document signé par tous les signataires">
          Le fichier scellé <span className="ac-num">{d.fichierSigne}</span> est disponible au téléchargement. Il porte
          la trace de chaque signature et de son horodatage.
        </Alert>
      )}

      {statut === 'brouillon' && (
        <Alert tone="neutral" titre="Demande en brouillon">
          Elle n'a pas encore été envoyée : aucun signataire n'a reçu d'invitation.
        </Alert>
      )}

      <Tabs items={onglets} value={onglet} onChange={setOnglet} ariaLabel="Sections de la demande" />

      <div role="tabpanel" aria-label={onglets.find((o) => o.id === onglet)?.label} className="flex flex-col gap-4">
        {onglet === 'suivi' && (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader title="Signataires" description="Dans l'ordre de passage. Chacun reçoit son lien quand vient son tour." />
              <ul className="divide-y divide-ink-100">
                {[...d.signataires].sort((a, b) => a.ordre - b.ordre).map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <span aria-hidden className="ac-num flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-300 text-2xs font-semibold text-ink-600">
                      {s.ordre}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-900">
                        {s.nom}
                        {s.estMoi && <Badge variant="brand">Moi</Badge>}
                      </p>
                      <p className="ac-num truncate text-xs text-ink-500">
                        {s.email} · {s.role}
                      </p>
                      {s.statut === 'refuse' && <p className="mt-1 text-xs text-danger-600">{s.motifRefus}</p>}
                    </div>
                    {s.signeLe && <span className="ac-num text-xs text-ink-500">{formatDate(s.signeLe)}</span>}
                    <StatusBadge
                      status={s.statut === 'signe' ? 'signataire_signe' : s.statut === 'refuse' ? 'signataire_refuse' : 'signataire_attente'}
                    />
                  </li>
                ))}
              </ul>
              <CardBody className="border-t border-ink-100">
                <div className="flex items-center gap-3">
                  <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span className="block h-full rounded-full bg-brand-500 transition-[width]" style={{ width: `${p.pourcentage}%` }} />
                  </span>
                  <span className="ac-num text-[0.8125rem] font-medium text-ink-800">{p.pourcentage} %</span>
                </div>
                {courant && statut === 'en_attente' && (
                  <p className="mt-2 text-xs text-ink-500">En attente de {courant.nom}, position {courant.ordre} sur {p.total}.</p>
                )}
              </CardBody>
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader title="Informations" />
                <CardBody className="py-0">
                  <dl className="text-[0.8125rem]">
                    {[
                      ['Référence', d.reference],
                      ['Document', d.documentNom],
                      ['Pages', String(d.pages)],
                      ['Créée le', formatDate(d.creeLe)],
                      ['Envoyée le', d.envoyeeLe ? formatDate(d.envoyeeLe) : 'Non envoyée'],
                      ['Échéance', `${formatDate(d.echeanceLe)}${jours >= 0 ? ` (dans ${jours} j)` : ` (dépassée de ${-jours} j)`}`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
                        <dt className="text-ink-500">{k}</dt>
                        <dd className="ac-num text-right font-medium text-ink-900">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </CardBody>
              </Card>

              {d.message && (
                <Card>
                  <CardHeader title="Message aux signataires" />
                  <CardBody>
                    <p className="text-[0.8125rem] leading-relaxed text-ink-700">{d.message}</p>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        )}

        {onglet === 'document' && (
          <Card>
            <CardHeader title="Document" description="Les champs de signature apparaissent à leur emplacement définitif." />
            <CardBody>
              <EditeurPlacement pages={d.pages} champs={d.champs} signataires={d.signataires} onChange={() => undefined} lectureSeule />
            </CardBody>
          </Card>
        )}

        {onglet === 'champs' && (
          <Card>
            <CardHeader title="Champs à remplir" description={`${d.champs.length} champ(s) répartis sur ${d.pages} page(s).`} />
            <div className="ac-scroll overflow-x-auto">
              <table className="w-full text-left">
                <caption className="sr-only">Champs de la demande {d.reference}</caption>
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-25">
                    {['Type', 'Signataire', 'Page', 'Position', 'Obligatoire'].map((h) => (
                      <th key={h} scope="col" className="px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {d.champs.map((c) => (
                    <tr key={c.id}>
                      <td className="px-4 py-2 text-[0.8125rem] font-medium text-ink-900">{champLabels[c.type]}</td>
                      <td className="px-4 py-2 text-[0.8125rem] text-ink-700">{d.signataires.find((s) => s.id === c.signataireId)?.nom ?? '—'}</td>
                      <td className="ac-num px-4 py-2 text-[0.8125rem] text-ink-700">{c.page}</td>
                      <td className="ac-num px-4 py-2 text-xs text-ink-500">
                        x {c.x} % · y {c.y} %
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline">{c.obligatoire ? 'Obligatoire' : 'Facultatif'}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {onglet === 'historique' && (
          <Card>
            <CardHeader title="Historique" description="Envois, signatures, refus et relances." />
            <CardBody>
              <Timeline evenements={d.historique} />
            </CardBody>
          </Card>
        )}
      </div>

      {/* Signature */}
      <ConfirmDialog
        open={aSigner}
        tone="primary"
        loading={enCours}
        onClose={() => setASigner(false)}
        onConfirm={() => {
          setASigner(false)
          if (moi) void executer(() => signer(d.id, moi.id), { titre: 'Document signé', detail: `Votre signature a été recueillie sur ${d.reference}.` })
        }}
        title="Signer ce document ?"
        description={`${d.titre} — ${d.documentNom}. Votre signature sera horodatée et scellée dans le document.`}
        confirmLabel="Signer le document"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          Une signature électronique a la même valeur juridique qu'une signature manuscrite. Elle ne peut pas être
          retirée une fois apposée. En cas de doute, refusez en indiquant le motif.
        </div>
      </ConfirmDialog>

      {/* Refus — motif obligatoire */}
      <Modal
        open={refusOuvert}
        onClose={() => setRefusOuvert(false)}
        title="Refuser de signer ?"
        description="Le motif est transmis à l'émetteur et interrompt le circuit pour tous les signataires."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRefusOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="danger"
              loading={enCours}
              disabled={!motif.trim()}
              onClick={() => {
                const m = motif
                setRefusOuvert(false)
                if (moi) void executer(() => refuser(d.id, moi.id, m), { titre: 'Signature refusée', detail: 'L’émetteur a été notifié avec le motif.' })
              }}
            >
              Refuser de signer
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
            Un refus interrompt la demande pour tous les signataires. L'émetteur devra corriger le document et créer une
            nouvelle demande.
          </div>
          <Field label="Motif du refus" required hint="Sans motif, l’émetteur ne saura pas quoi corriger.">
            {(p) => <Textarea {...p} rows={3} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Le montant indiqué à l’article 3 ne correspond pas à la délibération." />}
          </Field>
          {!motif.trim() && <p className="text-xs font-medium text-warning-600">Le motif est obligatoire.</p>}
        </div>
      </Modal>

      <Modal
        open={prolongerOuvert}
        onClose={() => setProlongerOuvert(false)}
        size="sm"
        title="Repousser l’échéance"
        description="Les signataires en attente recevront un nouveau lien valide jusqu'à cette date."
        footer={
          <>
            <Button variant="ghost" onClick={() => setProlongerOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nouvelleEcheance}
              onClick={() => {
                const e = nouvelleEcheance
                setProlongerOuvert(false)
                void executer(() => prolonger(d.id, e), { titre: 'Échéance repoussée', detail: `Nouvelle date limite : ${formatDate(e)}.` })
              }}
            >
              Repousser
            </Button>
          </>
        }
      >
        <div className="py-2">
          <Field label="Nouvelle échéance" required>
            {(p) => <Input {...p} type="date" value={nouvelleEcheance} onChange={(e) => setNouvelleEcheance(e.target.value)} />}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={aAnnuler}
        loading={enCours}
        onClose={() => setAAnnuler(false)}
        onConfirm={() => {
          const m = motifAnnulation
          setAAnnuler(false)
          void executer(() => annuler(d.id, m), { titre: 'Demande annulée', detail: 'Les liens de signature ne fonctionnent plus.' })
        }}
        title={`Annuler la demande ${d.reference} ?`}
        description="Les liens envoyés cessent immédiatement de fonctionner. Les signatures déjà recueillies sont conservées dans l'historique mais le document ne sera pas scellé."
        confirmLabel="Annuler la demande"
      >
        <div className="flex flex-col gap-3">
          <Field label="Motif d’annulation" hint="Consigné dans l’historique.">
            {(p) => <Textarea {...p} rows={2} value={motifAnnulation} onChange={(e) => setMotifAnnulation(e.target.value)} placeholder="Document remplacé par une version corrigée." />}
          </Field>
        </div>
      </ConfirmDialog>
    </Page>
  )
}
