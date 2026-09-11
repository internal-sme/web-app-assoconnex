import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Plus, Send, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Status'
import { Stepper } from '@/components/adherents/Stepper'
import { SignNav } from '@/components/signatures/SignNav'
import { EditeurPlacement } from '@/components/signatures/Editeur'
import { useSignatures } from '@/context/SignaturesContext'
import { useDocuments } from '@/context/DocumentsContext'
import { useToast } from '@/context/ToastContext'
import { MOI, champLabels, type Champ, type Signataire } from '@/lib/signatures'
import { formatDate, uid } from '@/lib/utils'

const ETAPES = ['Document', 'Signataires', 'Placement des champs', 'Prévisualisation']

export function SignNouvelle() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { creer } = useSignatures()
  const { documents } = useDocuments()

  const [etape, setEtape] = useState(1)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [resultat, setResultat] = useState<{ reference: string; id: string; envoyee: boolean } | null>(null)

  const signables = documents.filter((d) => !d.supprime && ['pdf', 'docx'].includes(d.extension))

  const [documentId, setDocumentId] = useState(signables[0]?.id ?? '')
  const [titre, setTitre] = useState('')
  const [pages, setPages] = useState(4)
  const [message, setMessage] = useState('')
  const [echeance, setEcheance] = useState(new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10))
  const [signataires, setSignataires] = useState<Signataire[]>([
    { id: uid('sg'), nom: MOI.nom, email: MOI.email, role: 'Présidente', ordre: 1, statut: 'attente', signeLe: null, motifRefus: '', estMoi: true },
  ])
  const [champs, setChamps] = useState<Champ[]>([])

  const doc = documents.find((d) => d.id === documentId)

  const valider = (n: number) => {
    const e: Record<string, string> = {}
    if (n === 1) {
      if (!documentId) e.documentId = 'Choisissez le document à faire signer.'
      if (!titre.trim()) e.titre = 'Donnez un titre à la demande.'
      if (pages < 1) e.pages = 'Le document doit compter au moins une page.'
      if (!echeance) e.echeance = 'Indiquez une date limite de signature.'
      else if (echeance <= new Date().toISOString().slice(0, 10)) e.echeance = 'L’échéance doit être postérieure à aujourd’hui.'
    }
    if (n === 2) {
      if (signataires.length === 0) e.signataires = 'Ajoutez au moins un signataire.'
      if (signataires.some((s) => !s.nom.trim() || !s.email.trim())) e.signataires = 'Chaque signataire doit avoir un nom et une adresse e-mail.'
      if (signataires.some((s) => s.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.email))) e.signataires = 'Une adresse e-mail est invalide.'
    }
    if (n === 3) {
      if (champs.filter((c) => c.type === 'signature').length === 0) e.champs = 'Posez au moins une zone de signature.'
      const sansChamp = signataires.filter((s) => !champs.some((c) => c.signataireId === s.id && c.type === 'signature'))
      if (sansChamp.length > 0) e.champs = `Aucune zone de signature pour : ${sansChamp.map((s) => s.nom).join(', ')}.`
    }
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const suivant = () => {
    if (valider(etape)) setEtape((n) => n + 1)
  }

  const enregistrer = async (envoyer: boolean) => {
    if (!valider(3)) {
      setEtape(3)
      return
    }
    setErreurGlobale(null)
    setEnCours(true)
    try {
      const creee = await creer(
        {
          titre: titre.trim(),
          documentNom: doc ? `${doc.nom}.${doc.extension}` : 'Document.pdf',
          pages,
          message: message.trim(),
          echeanceLe: echeance,
          signataires: signataires.map((s) => ({ nom: s.nom, email: s.email, role: s.role, ordre: s.ordre, estMoi: s.estMoi })),
          champs: champs.map((c) => {
            const s = signataires.find((x) => x.id === c.signataireId)
            const { id: _ignore, ...reste } = c
            return { ...reste, signataireId: s?.email ?? '' }
          }),
        },
        envoyer,
      )
      setResultat({ reference: creee.reference, id: creee.id, envoyee: envoyer })
      toast({
        titre: envoyer ? 'Demande envoyée' : 'Brouillon enregistré',
        detail: `${creee.reference} — ${signataires.length} signataire(s).`,
        tone: 'success',
      })
    } catch (err) {
      setErreurGlobale((err as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  if (resultat) {
    return (
      <Page
        width="narrow"
        header={<PageHeader eyebrow="Signature électronique" title={resultat.envoyee ? 'Demande envoyée' : 'Brouillon enregistré'} description="Le parcours est terminé." />}
      >
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full border border-success-100 bg-success-50 text-success-600">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink-950">{titre}</h2>
            <p className="ac-num text-[0.8125rem] text-ink-500">
              {resultat.reference} · {signataires.length} signataire(s) · échéance le {formatDate(echeance)}
            </p>
            <StatusBadge status={resultat.envoyee ? 'sig_attente' : 'sig_brouillon'} />
            {resultat.envoyee && (
              <p className="mx-auto max-w-sm text-[0.8125rem] leading-relaxed text-ink-500">
                Le premier signataire dans l'ordre de passage a reçu son lien. Les suivants seront notifiés à leur tour.
              </p>
            )}
          </CardBody>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate(`/signatures/${resultat.id}`)}>Ouvrir le suivi</Button>
          <Button onClick={() => navigate('/signatures/envoyees')}>Demandes envoyées</Button>
          <Button variant="ghost" onClick={() => navigate('/signatures')}>Tableau de bord</Button>
        </div>
      </Page>
    )
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Signature électronique"
          title="Nouvelle demande de signature"
          description="Quatre étapes : le document, les signataires, le placement des champs, puis la vérification avant envoi."
          actions={
            <Button onClick={() => navigate('/signatures')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Annuler
            </Button>
          }
        />
      }
    >
      <SignNav />
      <Stepper etapes={ETAPES} courante={etape} onAller={setEtape} />

      {erreurGlobale && (
        <Alert tone="danger" titre="Enregistrement impossible">
          {erreurGlobale} Vos saisies sont conservées.
        </Alert>
      )}

      {/* Étape 1 — document */}
      {etape === 1 && (
        <Card>
          <CardHeader title="Document à faire signer" description="Choisissez un fichier de l'espace documentaire, ou déposez-en un nouveau." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            {signables.length === 0 ? (
              <div className="sm:col-span-2">
                <EmptyState
                  icon={<FileText />}
                  title="Aucun document signable"
                  description="Seuls les fichiers PDF et Word peuvent être envoyés en signature. Importez-en un depuis l'espace documentaire."
                  compact
                  action={<Button variant="primary" onClick={() => navigate('/documents/explorateur')}>Ouvrir l'explorateur</Button>}
                />
              </div>
            ) : (
              <Field label="Document" required error={erreurs.documentId} className="sm:col-span-2">
                {(p) => (
                  <Select
                    {...p}
                    value={documentId}
                    onChange={(e) => {
                      setDocumentId(e.target.value)
                      const d = documents.find((x) => x.id === e.target.value)
                      if (d && !titre) setTitre(d.nom)
                    }}
                    options={signables.map((d) => ({ value: d.id, label: `${d.nom}.${d.extension}` }))}
                  />
                )}
              </Field>
            )}
            <Field label="Titre de la demande" required error={erreurs.titre} className="sm:col-span-2" hint="Visible par les signataires dans leur invitation.">
              {(p) => <Input {...p} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Convention pluriannuelle d’objectifs" />}
            </Field>
            <Field label="Nombre de pages" required error={erreurs.pages} hint="Sert à la navigation dans l’éditeur de placement.">
              {(p) => <Input {...p} type="number" min={1} max={30} value={String(pages)} onChange={(e) => setPages(Number(e.target.value) || 1)} />}
            </Field>
            <Field label="Échéance de signature" required error={erreurs.echeance}>
              {(p) => <Input {...p} type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />}
            </Field>
            <Field label="Message aux signataires" className="sm:col-span-2" hint="Accompagne l’invitation. Expliquez ce qui est attendu et pourquoi.">
              {(p) => <Textarea {...p} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Merci de signer avant la fin du mois. Le versement de la subvention en dépend." />}
            </Field>
          </CardBody>
        </Card>
      )}

      {/* Étape 2 — signataires */}
      {etape === 2 && (
        <Card>
          <CardHeader
            title="Signataires"
            description="L'ordre de passage détermine qui signe en premier. Un signataire ne reçoit son lien qu'une fois le précédent passé."
            action={
              <Button
                size="sm"
                onClick={() =>
                  setSignataires((l) => [
                    ...l,
                    { id: uid('sg'), nom: '', email: '', role: '', ordre: l.length + 1, statut: 'attente', signeLe: null, motifRefus: '', estMoi: false },
                  ])
                }
                iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}
              >
                Ajouter un signataire
              </Button>
            }
          />
          <CardBody className="flex flex-col gap-3">
            {erreurs.signataires && (
              <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 p-2.5 text-[0.8125rem] text-danger-700">
                {erreurs.signataires}
              </p>
            )}
            {signataires
              .sort((a, b) => a.ordre - b.ordre)
              .map((s, i) => (
                <div key={s.id} className="grid gap-2 rounded-lg border border-ink-200 p-3 lg:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_auto] lg:items-end">
                  <Field label={`Ordre du signataire ${i + 1}`} className="[&>div>label]:sr-only">
                    {(p) => (
                      <Input
                        {...p}
                        type="number"
                        min={1}
                        max={signataires.length}
                        value={String(s.ordre)}
                        onChange={(e) =>
                          setSignataires((l) => l.map((x) => (x.id === s.id ? { ...x, ordre: Number(e.target.value) || 1 } : x)))
                        }
                      />
                    )}
                  </Field>
                  <Field label={`Nom du signataire ${i + 1}`} className="[&>div>label]:sr-only">
                    {(p) => <Input {...p} value={s.nom} onChange={(e) => setSignataires((l) => l.map((x) => (x.id === s.id ? { ...x, nom: e.target.value } : x)))} placeholder="Nom et prénom" />}
                  </Field>
                  <Field label={`Adresse e-mail du signataire ${i + 1}`} className="[&>div>label]:sr-only">
                    {(p) => <Input {...p} type="email" value={s.email} onChange={(e) => setSignataires((l) => l.map((x) => (x.id === s.id ? { ...x, email: e.target.value } : x)))} placeholder="adresse@exemple.fr" />}
                  </Field>
                  <Field label={`Qualité du signataire ${i + 1}`} className="[&>div>label]:sr-only">
                    {(p) => <Input {...p} value={s.role} onChange={(e) => setSignataires((l) => l.map((x) => (x.id === s.id ? { ...x, role: e.target.value } : x)))} placeholder="Qualité" />}
                  </Field>
                  <div className="flex items-center gap-2">
                    {s.estMoi && <Badge variant="brand">Moi</Badge>}
                    <Button
                      variant="icon"
                      label={`Retirer le signataire ${i + 1}`}
                      disabled={signataires.length === 1}
                      className="text-ink-500 hover:text-danger-600"
                      onClick={() => {
                        setSignataires((l) => l.filter((x) => x.id !== s.id))
                        setChamps((l) => l.filter((c) => c.signataireId !== s.id))
                      }}
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardBody>
        </Card>
      )}

      {/* Étape 3 — placement */}
      {etape === 3 && (
        <Card>
          <CardHeader
            title="Placement des champs"
            description="Posez au moins une zone de signature par signataire. Les couleurs distinguent les signataires."
          />
          <CardBody className="flex flex-col gap-3">
            {erreurs.champs && (
              <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 p-2.5 text-[0.8125rem] text-danger-700">
                {erreurs.champs}
              </p>
            )}
            <EditeurPlacement pages={pages} champs={champs} signataires={signataires} onChange={setChamps} />
          </CardBody>
        </Card>
      )}

      {/* Étape 4 — prévisualisation */}
      {etape === 4 && (
        <>
          <Card>
            <CardHeader title="Vérification" description="Rien n'est envoyé tant que vous n'avez pas confirmé." />
            <CardBody className="py-0">
              <dl className="text-[0.8125rem]">
                {[
                  ['Document', doc ? `${doc.nom}.${doc.extension}` : '—'],
                  ['Titre', titre],
                  ['Pages', String(pages)],
                  ['Échéance', formatDate(echeance)],
                  ['Signataires', signataires.sort((a, b) => a.ordre - b.ordre).map((s) => `${s.ordre}. ${s.nom}`).join(' · ')],
                  ['Champs posés', `${champs.length} au total, dont ${champs.filter((c) => c.type === 'signature').length} zone(s) de signature`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-ink-100 py-3 last:border-0">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="text-right font-medium text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Prévisualisation" description="Le document tel que le verront les signataires, avec leurs champs." />
            <CardBody>
              <EditeurPlacement pages={pages} champs={champs} signataires={signataires} onChange={() => undefined} lectureSeule />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Récapitulatif des champs" />
            <CardBody className="flex flex-wrap gap-2">
              {champs.map((c) => (
                <Badge key={c.id} variant="outline">
                  {champLabels[c.type]} · p.{c.page} · {signataires.find((s) => s.id === c.signataireId)?.nom}
                </Badge>
              ))}
            </CardBody>
          </Card>
        </>
      )}

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Étape {etape} sur {ETAPES.length}
          </Badge>
          <span aria-live="polite" className="text-[0.8125rem] text-ink-500">
            {enCours ? 'Enregistrement en cours…' : ETAPES[etape - 1]}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {etape > 1 && (
            <Button onClick={() => setEtape((n) => n - 1)} disabled={enCours} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Précédent
            </Button>
          )}
          {etape < ETAPES.length ? (
            <Button variant="primary" onClick={suivant} iconRight={<ArrowRight aria-hidden className="h-4 w-4" />}>
              Continuer
            </Button>
          ) : (
            <>
              <Button loading={enCours} onClick={() => void enregistrer(false)}>
                Enregistrer en brouillon
              </Button>
              <Button variant="primary" loading={enCours} onClick={() => void enregistrer(true)} iconLeft={<Send aria-hidden className="h-4 w-4" />}>
                Envoyer aux signataires
              </Button>
            </>
          )}
        </div>
      </div>
    </Page>
  )
}
