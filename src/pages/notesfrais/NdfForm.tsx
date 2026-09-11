import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Camera, Check, Paperclip, ReceiptText, Scan, Send, Upload } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Status'
import { NdfNav } from '@/components/notesfrais/NdfNav'
import { WorkflowStepper } from '@/components/notesfrais/Workflow'
import { useNotesFrais, type SaisieNote } from '@/context/NotesFraisContext'
import { useToast } from '@/context/ToastContext'
import { moyenNdfLabels, type MoyenPaiementNdf, type NoteFrais } from '@/lib/notesFrais'
import { formatMoney, toInputDate } from '@/lib/utils'

const arrondi = (n: number) => Math.round(n * 100) / 100

export function NdfForm({ mode }: { mode: 'creation' | 'modification' }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { noteParId, natures, projets, centres, creerNote, modifierNote, soumettre } = useNotesFrais()

  const source = mode === 'modification' ? noteParId(id) : undefined

  const [dateDepense, setDateDepense] = useState(toInputDate(source?.dateDepense ?? new Date().toISOString()))
  const [natureId, setNatureId] = useState(source?.natureId ?? natures[0]?.id ?? '')
  const [libelle, setLibelle] = useState(source?.libelle ?? '')
  const [montant, setMontant] = useState(source ? String(source.montantTTC) : '')
  const [tva, setTva] = useState(source ? String(source.tva) : '')
  const [moyen, setMoyen] = useState<MoyenPaiementNdf>(source?.moyenPaiement ?? 'personnel')
  const [projetId, setProjetId] = useState(source?.projetId ?? '')
  const [centreId, setCentreId] = useState(source?.centreCoutId ?? '')
  const [justificatif, setJustificatif] = useState<string | null>(source?.justificatif ?? null)
  const [scanne, setScanne] = useState(source?.justificatifScanne ?? false)
  const [commentaire, setCommentaire] = useState(source?.commentaire ?? '')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const nature = natures.find((n) => n.id === natureId)
  const montantNum = Number(montant) || 0
  const plafondDepasse = !!nature?.plafond && montantNum > nature.plafond

  if (mode === 'modification' && !source) {
    return (
      <Page header={<PageHeader title="Note introuvable" />}>
        <Card>
          <EmptyState
            icon={<ReceiptText />}
            title="Cette note n'existe plus"
            description="Elle a peut-être été supprimée."
            action={<Button variant="primary" onClick={() => navigate('/notes-de-frais/mes-notes')}>Retour à mes notes</Button>}
          />
        </Card>
      </Page>
    )
  }

  const valider = () => {
    const e: Record<string, string> = {}
    if (!libelle.trim()) e.libelle = 'Indiquez l’objet de la dépense.'
    if (!dateDepense) e.dateDepense = 'Indiquez la date de la dépense.'
    else if (dateDepense > new Date().toISOString().slice(0, 10)) e.dateDepense = 'La date ne peut pas être dans le futur.'
    if (montantNum <= 0) e.montant = 'Le montant doit être supérieur à zéro.'
    if (Number(tva) > montantNum) e.tva = 'La TVA ne peut pas dépasser le montant TTC.'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const donnees = (): SaisieNote => ({
    dateDepense: new Date(dateDepense).toISOString(),
    natureId,
    libelle: libelle.trim(),
    montantTTC: montantNum,
    tva: arrondi(Number(tva) || 0),
    moyenPaiement: moyen,
    projetId: projetId || null,
    centreCoutId: centreId || null,
    justificatif,
    justificatifScanne: scanne,
    commentaire,
  })

  const enregistrer = async (puisSoumettre: boolean) => {
    if (!valider()) return
    setErreurGlobale(null)
    setEnCours(true)
    try {
      if (mode === 'creation') {
        const creee = await creerNote(donnees(), puisSoumettre)
        toast({
          titre: puisSoumettre ? 'Note soumise' : 'Brouillon enregistré',
          detail: `${creee.numero} — ${formatMoney(montantNum)}.`,
          tone: 'success',
        })
        navigate(`/notes-de-frais/${creee.id}`)
      } else {
        await modifierNote(source!.id, donnees())
        if (puisSoumettre) await soumettre(source!.id)
        toast({
          titre: puisSoumettre ? 'Note resoumise' : 'Modifications enregistrées',
          detail: `${source!.numero} — ${formatMoney(montantNum)}.`,
          tone: 'success',
        })
        navigate(`/notes-de-frais/${source!.id}`)
      }
    } catch (err) {
      setErreurGlobale((err as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  // Note fictive servant à afficher le stepper à l'étape de rédaction
  const apercuWorkflow = {
    ...(source ?? ({} as NoteFrais)),
    statut: mode === 'creation' ? 'brouillon' : source!.statut,
    historique: source?.historique ?? [],
    soumiseLe: source?.soumiseLe ?? null,
    valideeResponsableLe: source?.valideeResponsableLe ?? null,
    valideeTresorierLe: source?.valideeTresorierLe ?? null,
    rembourseeLe: source?.rembourseeLe ?? null,
    rejeteeA: source?.rejeteeA ?? null,
  } as NoteFrais

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Notes de frais"
          title={mode === 'creation' ? 'Nouvelle note de frais' : `Modifier ${source!.numero}`}
          description="Déclarez une dépense avancée pour le compte de l'association. Un brouillon peut être enregistré incomplet ; la soumission exige le justificatif."
          actions={
            <Button
              onClick={() => navigate(mode === 'creation' ? '/notes-de-frais/mes-notes' : `/notes-de-frais/${id}`)}
              iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}
            >
              Annuler
            </Button>
          }
        />
      }
    >
      <NdfNav />

      {/* Le stepper est présent dès la saisie : on voit où l'on entre dans le circuit */}
      <WorkflowStepper note={apercuWorkflow} />

      {erreurGlobale && (
        <Alert tone="danger" titre="Enregistrement impossible">
          {erreurGlobale} Vos saisies sont conservées.
        </Alert>
      )}

      {mode === 'modification' && source!.statut === 'rejetee' && (
        <Alert tone="danger" titre="Note précédemment rejetée">
          <strong>Motif : </strong>
          {source!.motifRejet} Corrigez le point signalé avant de resoumettre.
        </Alert>
      )}

      <Card>
        <CardHeader title="La dépense" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Date de la dépense" required error={erreurs.dateDepense}>
            {(p) => <Input {...p} type="date" value={dateDepense} onChange={(e) => setDateDepense(e.target.value)} />}
          </Field>
          <Field label="Nature" required hint={nature?.plafond ? `Plafond : ${formatMoney(nature.plafond)}` : 'Pas de plafond'}>
            {(p) => (
              <Select
                {...p}
                value={natureId}
                onChange={(e) => setNatureId(e.target.value)}
                options={natures.map((n) => ({ value: n.id, label: n.nom }))}
              />
            )}
          </Field>
          <Field label="Objet de la dépense" required error={erreurs.libelle} className="sm:col-span-2">
            {(p) => <Input {...p} value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Billet de train Nantes–Rennes" />}
          </Field>
          <Field label="Montant TTC" required error={erreurs.montant}>
            {(p) => <Input {...p} type="number" min={0} step="0.01" suffix="€" value={montant} onChange={(e) => setMontant(e.target.value)} />}
          </Field>
          <Field
            label="dont TVA"
            error={erreurs.tva}
            hint={nature?.tvaRecuperable ? 'TVA récupérable sur cette nature.' : 'TVA non récupérable : laissez à zéro.'}
          >
            {(p) => (
              <Input
                {...p}
                type="number"
                min={0}
                step="0.01"
                suffix="€"
                disabled={!nature?.tvaRecuperable}
                value={tva}
                onChange={(e) => setTva(e.target.value)}
              />
            )}
          </Field>
          <Field label="Moyen de paiement" required hint="Une avance personnelle donne lieu à remboursement.">
            {(p) => (
              <Select
                {...p}
                value={moyen}
                onChange={(e) => setMoyen(e.target.value as MoyenPaiementNdf)}
                options={(Object.keys(moyenNdfLabels) as MoyenPaiementNdf[]).map((m) => ({ value: m, label: moyenNdfLabels[m] }))}
              />
            )}
          </Field>
          <div />
          {plafondDepasse && (
            <div className="sm:col-span-2">
              <Alert tone="warning" titre="Plafond dépassé">
                Le plafond de la nature « {nature?.nom} » est de {formatMoney(nature!.plafond!)}. La note peut être
                soumise, mais le responsable devra motiver son accord.
              </Alert>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Imputation" description="Permet de rattacher la dépense au bon budget." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Projet">
            {(p) => (
              <Select
                {...p}
                value={projetId}
                onChange={(e) => setProjetId(e.target.value)}
                placeholder="Non imputé"
                options={projets.filter((x) => x.actif).map((x) => ({ value: x.id, label: `${x.code} — ${x.nom}` }))}
              />
            )}
          </Field>
          <Field label="Centre de coût">
            {(p) => (
              <Select
                {...p}
                value={centreId}
                onChange={(e) => setCentreId(e.target.value)}
                placeholder="Non imputé"
                options={centres.map((c) => ({ value: c.id, label: `${c.code} — ${c.nom}` }))}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Justificatif"
          description={nature?.justificatifObligatoire ? 'Obligatoire pour cette nature de frais.' : 'Recommandé pour la traçabilité.'}
          action={
            <Button size="sm" onClick={() => navigate('/notes-de-frais/scan')} iconLeft={<Scan aria-hidden className="h-3.5 w-3.5" />}>
              Scanner
            </Button>
          }
        />
        <CardBody className="flex flex-col gap-3">
          {justificatif ? (
            <div className="flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-25 p-3">
              <Paperclip aria-hidden className="h-4 w-4 shrink-0 text-ink-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-ink-900">{justificatif}</p>
                <p className="text-xs text-ink-500">{scanne ? 'Importé par scan' : 'Saisi manuellement'}</p>
              </div>
              <StatusBadge status="justificatif_fourni" />
              <Button size="sm" variant="ghost" onClick={() => { setJustificatif(null); setScanne(false) }}>
                Retirer
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-dashed border-ink-300 bg-ink-25 px-4 py-6 text-center">
                <Upload aria-hidden className="mx-auto h-6 w-6 text-ink-500" />
                <p className="mt-2 text-[0.8125rem] font-medium text-ink-800">Aucun justificatif</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-500">
                  Indiquez le nom du fichier, ou passez par le scan pour photographier le ticket.
                </p>
              </div>
              <Field label="Nom du justificatif">
                {(p) => (
                  <Input
                    {...p}
                    value={justificatif ?? ''}
                    onChange={(e) => setJustificatif(e.target.value || null)}
                    placeholder="ticket-train-2026-09-01.jpg"
                  />
                )}
              </Field>
            </>
          )}
          <Field label="Commentaire" hint="Contexte utile au valideur : réunion concernée, accord préalable…">
            {(p) => <Textarea {...p} rows={2} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />}
          </Field>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours
            ? 'Enregistrement en cours…'
            : !justificatif && nature?.justificatifObligatoire
              ? 'Sans justificatif, la note ne peut pas être soumise.'
              : `${formatMoney(montantNum)} TTC`}
        </p>
        <Button variant="ghost" onClick={() => navigate('/notes-de-frais/mes-notes')} disabled={enCours}>Annuler</Button>
        <Button loading={enCours} onClick={() => void enregistrer(false)}>
          Enregistrer en brouillon
        </Button>
        <Button
          variant="primary"
          loading={enCours}
          disabled={!justificatif && !!nature?.justificatifObligatoire}
          onClick={() => void enregistrer(true)}
          iconLeft={<Send aria-hidden className="h-4 w-4" />}
        >
          Soumettre pour validation
        </Button>
      </div>
    </Page>
  )
}

/* ------------------------------ Scan ------------------------------ */

const etapesScan = [
  { titre: 'Cadrez le ticket', detail: 'Posez le justificatif à plat, sur un fond contrasté.' },
  { titre: 'Capturez', detail: 'La zone de texte est détectée automatiquement.' },
  { titre: 'Vérifiez', detail: 'Le montant, la date et le commerçant sont extraits, puis relus par vous.' },
]

export function NdfScan() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { noteParId, attacherJustificatif } = useNotesFrais()
  const { id } = useParams()
  const note = id ? noteParId(id) : undefined

  const [etape, setEtape] = useState<'attente' | 'analyse' | 'resultat'>('attente')
  const [enCours, setEnCours] = useState(false)

  const resultat = {
    commercant: 'SNCF Connect',
    date: new Date().toISOString().slice(0, 10),
    montant: 48.6,
    tva: 0,
    fichier: `scan-${Date.now().toString().slice(-6)}.jpg`,
  }

  const lancer = () => {
    setEtape('analyse')
    window.setTimeout(() => setEtape('resultat'), 1400)
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Notes de frais"
          title="Scan de justificatif"
          description="Photographiez un ticket : le montant, la date et le commerçant sont proposés automatiquement. Vous gardez la main sur chaque valeur."
          actions={
            <Button
              onClick={() => navigate(note ? `/notes-de-frais/${note.id}` : '/notes-de-frais/nouvelle')}
              iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}
            >
              Retour
            </Button>
          }
        />
      }
    >
      <NdfNav />

      {note && (
        <Alert tone="neutral" titre={`Justificatif pour la note ${note.numero}`}>
          {note.libelle} — {formatMoney(note.montantTTC)}. Le fichier sera rattaché à cette note.
        </Alert>
      )}

      <Card>
        <CardHeader title="Comment ça marche" />
        <CardBody>
          <ol className="grid gap-3 sm:grid-cols-3">
            {etapesScan.map((e, i) => (
              <li key={e.titre} className="rounded-lg border border-ink-200 bg-ink-25 p-3">
                <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-900">
                  <span aria-hidden className="ac-num flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-2xs font-bold text-white">
                    {i + 1}
                  </span>
                  {e.titre}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-500">{e.detail}</p>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
          {etape === 'attente' && (
            <>
              <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-2xl border border-ink-200 bg-ink-50 text-ink-500">
                <Camera className="h-7 w-7" />
              </span>
              <div>
                <p className="font-display text-[0.9375rem] font-semibold text-ink-900">Prêt à scanner</p>
                <p className="mx-auto mt-1 max-w-sm text-[0.8125rem] leading-relaxed text-ink-500">
                  La capture par appareil photo arrive avec le module Documents. La démonstration simule ici la
                  reconnaissance d'un ticket.
                </p>
              </div>
              <Button variant="primary" onClick={lancer} iconLeft={<Scan aria-hidden className="h-4 w-4" />}>
                Lancer un scan de démonstration
              </Button>
            </>
          )}

          {etape === 'analyse' && (
            <>
              <span aria-hidden className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-600">
                <Scan className="h-7 w-7" />
              </span>
              <p className="text-[0.8125rem] font-medium text-ink-800" aria-live="polite">
                Analyse du justificatif en cours…
              </p>
            </>
          )}

          {etape === 'resultat' && (
            <>
              <span aria-hidden className="flex h-16 w-16 items-center justify-center rounded-2xl border border-success-100 bg-success-50 text-success-600">
                <Check className="h-7 w-7" />
              </span>
              <div>
                <p className="font-display text-[0.9375rem] font-semibold text-ink-900">Justificatif reconnu</p>
                <p className="mt-1 text-[0.8125rem] text-ink-500">Vérifiez les valeurs extraites avant de les reprendre.</p>
              </div>
              <dl className="w-full max-w-sm text-left text-[0.8125rem]">
                {[
                  ['Fichier', resultat.fichier],
                  ['Commerçant', resultat.commercant],
                  ['Date', resultat.date],
                  ['Montant TTC', formatMoney(resultat.montant)],
                  ['TVA détectée', resultat.tva > 0 ? formatMoney(resultat.tva) : 'Aucune'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-ink-100 py-2 last:border-0">
                    <dt className="text-ink-500">{k}</dt>
                    <dd className="ac-num font-medium text-ink-900">{v}</dd>
                  </div>
                ))}
              </dl>
              <Badge variant="outline">Valeurs proposées, jamais appliquées sans votre accord</Badge>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setEtape('attente')}>Recommencer</Button>
                {note ? (
                  <Button
                    variant="primary"
                    loading={enCours}
                    onClick={() => {
                      setEnCours(true)
                      void (async () => {
                        try {
                          await attacherJustificatif(note.id, resultat.fichier, true)
                          toast({ titre: 'Justificatif rattaché', detail: `${resultat.fichier} ajouté à ${note.numero}.`, tone: 'success' })
                          navigate(`/notes-de-frais/${note.id}`)
                        } catch (e) {
                          toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
                        } finally {
                          setEnCours(false)
                        }
                      })()
                    }}
                  >
                    Rattacher à la note
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => navigate('/notes-de-frais/nouvelle')}>
                    Créer une note à partir du scan
                  </Button>
                )}
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </Page>
  )
}
