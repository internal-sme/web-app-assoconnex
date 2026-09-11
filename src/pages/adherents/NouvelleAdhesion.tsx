import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, Mail, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Checkbox } from '@/components/ui/Toggle'
import { StatusBadge } from '@/components/ui/Status'
import { Stepper } from '@/components/adherents/Stepper'
import { useAdherents, type SaisieAdhesion } from '@/context/AdherentsContext'
import { useToast } from '@/context/ToastContext'
import { moyenLabels, type Adherent, type MoyenPaiement } from '@/lib/adherents'
import { formatDate, formatMoney } from '@/lib/utils'

const ETAPES = ['Adhérent', 'Cotisation', 'Paiement', 'Confirmation']

const aujourdhui = new Date().toISOString().slice(0, 10)

type Erreurs = Record<string, string>

export function NouvelleAdhesion() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { types, creerAdhesion } = useAdherents()
  const typesActifs = types.filter((t) => t.actif)

  const [etape, setEtape] = useState(1)
  const [erreurs, setErreurs] = useState<Erreurs>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [resultat, setResultat] = useState<Adherent | null>(null)

  const [saisie, setSaisie] = useState<SaisieAdhesion>({
    civilite: 'Non précisé',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    dateNaissance: '',
    ville: '',
    codePostal: '',
    typeId: typesActifs[0]?.id ?? '',
    dateDebut: aujourdhui,
    montant: typesActifs[0]?.montant ?? 0,
    notes: '',
  })

  const [payerMaintenant, setPayerMaintenant] = useState(true)
  const [paiement, setPaiement] = useState<{ montant: number; date: string; moyen: MoyenPaiement; reference: string }>({
    montant: typesActifs[0]?.montant ?? 0,
    date: aujourdhui,
    moyen: 'carte',
    reference: '',
  })

  const type = types.find((t) => t.id === saisie.typeId)
  const set = <K extends keyof SaisieAdhesion>(k: K, v: SaisieAdhesion[K]) => setSaisie((s) => ({ ...s, [k]: v }))

  const validerEtape = (n: number): Erreurs => {
    const e: Erreurs = {}
    if (n === 1) {
      if (!saisie.prenom.trim()) e.prenom = 'Indiquez le prénom.'
      if (!saisie.nom.trim()) e.nom = 'Indiquez le nom.'
      if (!saisie.email.trim()) e.email = 'Indiquez une adresse e-mail.'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(saisie.email.trim())) e.email = 'Adresse e-mail invalide. Format attendu : nom@domaine.fr'
    }
    if (n === 2) {
      if (!saisie.typeId) e.typeId = 'Choisissez un type d’adhésion.'
      if (!saisie.dateDebut) e.dateDebut = 'Indiquez la date de début.'
      if (!saisie.montant || saisie.montant <= 0) e.montant = 'Le montant doit être supérieur à zéro.'
    }
    if (n === 3 && payerMaintenant) {
      if (!paiement.montant || paiement.montant <= 0) e.pMontant = 'Indiquez le montant encaissé.'
      else if (paiement.montant > saisie.montant) e.pMontant = 'Le montant encaissé dépasse la cotisation.'
      if (!paiement.date) e.pDate = 'Indiquez la date d’encaissement.'
    }
    return e
  }

  const suivant = () => {
    const e = validerEtape(etape)
    setErreurs(e)
    if (Object.keys(e).length === 0) setEtape((n) => n + 1)
  }

  const enregistrer = async () => {
    setErreurGlobale(null)
    setEnCours(true)
    try {
      const nouveau = await creerAdhesion(saisie, payerMaintenant ? paiement : null)
      setResultat(nouveau)
      toast({ titre: 'Adhésion enregistrée', detail: `${nouveau.prenom} ${nouveau.nom} — ${nouveau.numero}`, tone: 'success' })
    } catch (error) {
      setErreurGlobale((error as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (error as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  /* ----- écran de confirmation ----- */
  if (resultat) {
    const reste = saisie.montant - (payerMaintenant ? paiement.montant : 0)
    return (
      <Page
        width="narrow"
        header={<PageHeader eyebrow="Adhésions" title="Adhésion enregistrée" description="Le parcours est terminé. Voici le récapitulatif de l'opération." />}
      >
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full border border-success-100 bg-success-50 text-success-600">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink-950">
              {resultat.prenom} {resultat.nom} est adhérent
            </h2>
            <p className="ac-num text-[0.8125rem] text-ink-500">
              Numéro {resultat.numero} · valable jusqu’au {formatDate(resultat.dateFin)}
            </p>
            <StatusBadge status="adhesion_active" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Récapitulatif" />
          <CardBody className="py-0">
            <dl className="text-[0.8125rem]">
              {[
                ['Type d’adhésion', type?.nom ?? '—'],
                ['Période', `du ${formatDate(resultat.dateDebut)} au ${formatDate(resultat.dateFin)}`],
                ['Cotisation émise', formatMoney(saisie.montant)],
                ['Encaissé', payerMaintenant ? `${formatMoney(paiement.montant)} par ${moyenLabels[paiement.moyen].toLowerCase()}` : 'Rien pour l’instant'],
                ['Reste dû', reste > 0 ? formatMoney(reste) : 'Soldé'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-ink-100 py-3 last:border-0">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="ac-num font-medium text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate(`/adherents/${resultat.id}`)} iconLeft={<Users aria-hidden className="h-4 w-4" />}>
            Ouvrir la fiche
          </Button>
          {reste > 0 && (
            <Button onClick={() => navigate(`/adherents/${resultat.id}/paiement`)} iconLeft={<CreditCard aria-hidden className="h-4 w-4" />}>
              Enregistrer un paiement
            </Button>
          )}
          <Button onClick={() => toast({ titre: 'Courrier de bienvenue', detail: `Brouillon préparé pour ${resultat.email}.`, tone: 'neutral' })} iconLeft={<Mail aria-hidden className="h-4 w-4" />}>
            Envoyer le courrier de bienvenue
          </Button>
          <Button variant="ghost" onClick={() => navigate('/adherents/liste')}>
            Retour à la liste
          </Button>
        </div>
      </Page>
    )
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Adhésions"
          title="Nouvelle adhésion"
          description="Quatre étapes : l'adhérent, la cotisation, le paiement, puis la confirmation."
          actions={
            <Button onClick={() => navigate('/adherents/liste')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Annuler
            </Button>
          }
        />
      }
    >
      <Stepper etapes={ETAPES} courante={etape} onAller={setEtape} />

      {erreurGlobale && (
        <Alert tone="danger" titre="L’enregistrement a échoué">
          {erreurGlobale} Vos saisies sont conservées, vous pouvez réessayer.
        </Alert>
      )}

      {etape === 1 && (
        <Card>
          <CardHeader title="Adhérent" description="Identité et coordonnées de la personne qui adhère." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Civilité">
              {(p) => (
                <Select
                  {...p}
                  value={saisie.civilite}
                  onChange={(e) => set('civilite', e.target.value as SaisieAdhesion['civilite'])}
                  options={[
                    { value: 'Madame', label: 'Madame' },
                    { value: 'Monsieur', label: 'Monsieur' },
                    { value: 'Non précisé', label: 'Non précisé' },
                  ]}
                />
              )}
            </Field>
            <Field label="Date de naissance" hint="Détermine l’éligibilité aux tarifs jeune et étudiant.">
              {(p) => <Input {...p} type="date" value={saisie.dateNaissance} onChange={(e) => set('dateNaissance', e.target.value)} />}
            </Field>
            <Field label="Prénom" required error={erreurs.prenom}>
              {(p) => <Input {...p} value={saisie.prenom} onChange={(e) => set('prenom', e.target.value)} placeholder="Awa" />}
            </Field>
            <Field label="Nom" required error={erreurs.nom}>
              {(p) => <Input {...p} value={saisie.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Diallo" />}
            </Field>
            <Field label="Adresse e-mail" required error={erreurs.email} className="sm:col-span-2">
              {(p) => <Input {...p} type="email" value={saisie.email} onChange={(e) => set('email', e.target.value)} placeholder="awa.diallo@exemple.fr" />}
            </Field>
            <Field label="Téléphone">
              {(p) => <Input {...p} type="tel" value={saisie.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="06 12 34 56 78" />}
            </Field>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Field label="Code postal">
                {(p) => <Input {...p} inputMode="numeric" value={saisie.codePostal} onChange={(e) => set('codePostal', e.target.value)} placeholder="44000" />}
              </Field>
              <Field label="Ville">
                {(p) => <Input {...p} value={saisie.ville} onChange={(e) => set('ville', e.target.value)} placeholder="Nantes" />}
              </Field>
            </div>
          </CardBody>
        </Card>
      )}

      {etape === 2 && (
        <Card>
          <CardHeader title="Cotisation" description="Le montant est proposé d’après le type choisi et reste modifiable." />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Type d’adhésion" required error={erreurs.typeId} className="sm:col-span-2">
              {(p) => (
                <Select
                  {...p}
                  value={saisie.typeId}
                  onChange={(e) => {
                    const t = types.find((x) => x.id === e.target.value)
                    set('typeId', e.target.value)
                    if (t) {
                      setSaisie((s) => ({ ...s, typeId: t.id, montant: t.montant }))
                      setPaiement((pa) => ({ ...pa, montant: t.montant }))
                    }
                  }}
                  options={typesActifs.map((t) => ({ value: t.id, label: `${t.nom} — ${t.montant} € / ${t.dureeMois} mois` }))}
                />
              )}
            </Field>
            {type && (
              <div className="sm:col-span-2">
                <Alert tone="neutral" titre={`Formule ${type.nom}`}>
                  {type.description} Public visé : {type.publicVise.toLowerCase()}.{' '}
                  {type.reconduction ? 'Reconduction tacite proposée à l’échéance.' : 'Pas de reconduction tacite.'}
                </Alert>
              </div>
            )}
            <Field label="Date de début" required error={erreurs.dateDebut}>
              {(p) => <Input {...p} type="date" value={saisie.dateDebut} onChange={(e) => set('dateDebut', e.target.value)} />}
            </Field>
            <Field label="Montant de la cotisation" required error={erreurs.montant} hint="Un tarif réduit peut être appliqué au cas par cas.">
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  min={0}
                  suffix="€"
                  value={String(saisie.montant)}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setSaisie((s) => ({ ...s, montant: v }))
                    setPaiement((pa) => ({ ...pa, montant: v }))
                  }}
                />
              )}
            </Field>
            <Field label="Note interne" className="sm:col-span-2">
              {(p) => <Textarea {...p} rows={2} value={saisie.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Tarif réduit accordé par le bureau, justificatif à fournir." />}
            </Field>
          </CardBody>
        </Card>
      )}

      {etape === 3 && (
        <Card>
          <CardHeader title="Paiement" description="Le paiement peut être encaissé maintenant ou plus tard depuis la fiche." />
          <CardBody className="flex flex-col gap-4">
            <Checkbox
              checked={payerMaintenant}
              onChange={(e) => setPayerMaintenant(e.target.checked)}
              label="Encaisser un paiement maintenant"
              description="Sinon, la cotisation reste en attente et apparaît dans le reste à encaisser."
            />
            {payerMaintenant && (
              <div className="grid gap-4 border-t border-ink-100 pt-4 sm:grid-cols-2">
                <Field label="Montant encaissé" required error={erreurs.pMontant} hint={`Cotisation de ${formatMoney(saisie.montant)}. Un montant inférieur crée un paiement partiel.`}>
                  {(p) => (
                    <Input
                      {...p}
                      type="number"
                      min={0}
                      suffix="€"
                      value={String(paiement.montant)}
                      onChange={(e) => setPaiement((pa) => ({ ...pa, montant: Number(e.target.value) }))}
                    />
                  )}
                </Field>
                <Field label="Date d’encaissement" required error={erreurs.pDate}>
                  {(p) => <Input {...p} type="date" value={paiement.date} onChange={(e) => setPaiement((pa) => ({ ...pa, date: e.target.value }))} />}
                </Field>
                <Field label="Moyen de paiement" required>
                  {(p) => (
                    <Select
                      {...p}
                      value={paiement.moyen}
                      onChange={(e) => setPaiement((pa) => ({ ...pa, moyen: e.target.value as MoyenPaiement }))}
                      options={(Object.keys(moyenLabels) as MoyenPaiement[]).map((m) => ({ value: m, label: moyenLabels[m] }))}
                    />
                  )}
                </Field>
                <Field label="Référence" hint="Numéro de chèque, référence de virement. Générée si vide.">
                  {(p) => <Input {...p} value={paiement.reference} onChange={(e) => setPaiement((pa) => ({ ...pa, reference: e.target.value }))} placeholder="CHQ-4417" />}
                </Field>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {etape === 4 && (
        <Card>
          <CardHeader title="Confirmation" description="Vérifiez avant d’enregistrer. Rien n’est écrit tant que vous n’avez pas confirmé." />
          <CardBody className="py-0">
            <dl className="text-[0.8125rem]">
              {[
                ['Adhérent', `${saisie.civilite !== 'Non précisé' ? saisie.civilite + ' ' : ''}${saisie.prenom} ${saisie.nom}`],
                ['Contact', `${saisie.email}${saisie.telephone ? ' · ' + saisie.telephone : ''}`],
                ['Commune', saisie.ville ? `${saisie.codePostal} ${saisie.ville}` : 'Non renseignée'],
                ['Type d’adhésion', type ? `${type.nom} · ${type.dureeMois} mois` : '—'],
                ['Date de début', formatDate(saisie.dateDebut)],
                ['Cotisation', formatMoney(saisie.montant)],
                ['Paiement', payerMaintenant ? `${formatMoney(paiement.montant)} par ${moyenLabels[paiement.moyen].toLowerCase()} le ${formatDate(paiement.date)}` : 'Aucun pour l’instant'],
                ['Reste dû après enregistrement', formatMoney(Math.max(0, saisie.montant - (payerMaintenant ? paiement.montant : 0)))],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-ink-100 py-3 last:border-0">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="ac-num text-right font-medium text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      )}

      <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            Étape {etape} sur {ETAPES.length}
          </Badge>
          <span aria-live="polite" className="text-[0.8125rem] text-ink-500">
            {enCours ? 'Enregistrement en cours…' : ETAPES[etape - 1]}
          </span>
        </div>
        <div className="flex gap-2">
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
            <Button variant="primary" loading={enCours} onClick={enregistrer}>
              Enregistrer l’adhésion
            </Button>
          )}
        </div>
      </div>
    </Page>
  )
}
