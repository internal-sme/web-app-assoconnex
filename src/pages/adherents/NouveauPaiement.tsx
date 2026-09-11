import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, CreditCard, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Status'
import { cleCotisation } from '@/components/adherents/statuts'
import { useAdherents } from '@/context/AdherentsContext'
import { useToast } from '@/context/ToastContext'
import { montantPaye, moyenLabels, resteDu, type MoyenPaiement } from '@/lib/adherents'
import { formatDate, formatMoney } from '@/lib/utils'

export function NouveauPaiement() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { parId, enregistrerPaiement, chargement } = useAdherents()
  const adherent = parId(id)

  const impayees = adherent
    ? adherent.cotisations.filter((c) => c.statut !== 'annulee' && resteDu(adherent, c.id) > 0)
    : []

  const [cotisationId, setCotisationId] = useState(impayees[impayees.length - 1]?.id ?? '')
  const [montant, setMontant] = useState<number | null>(null)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [moyen, setMoyen] = useState<MoyenPaiement>('carte')
  const [reference, setReference] = useState('')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [succes, setSucces] = useState<{ montant: number; reste: number } | null>(null)

  if (chargement) {
    return (
      <Page width="narrow" header={<PageHeader title="Enregistrer un paiement" />}>
        <Card className="p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-3 h-3 w-full" />
        </Card>
      </Page>
    )
  }

  if (!adherent) {
    return (
      <Page width="narrow" header={<PageHeader title="Adhérent introuvable" />}>
        <Card>
          <EmptyState
            icon={<Users />}
            title="Cette fiche n'existe plus"
            description="Impossible d'enregistrer un paiement sur une fiche supprimée."
            action={<Button variant="primary" onClick={() => navigate('/adherents/liste')}>Retour à la liste</Button>}
          />
        </Card>
      </Page>
    )
  }

  const cotisation = adherent.cotisations.find((c) => c.id === cotisationId)
  const restant = cotisation ? resteDu(adherent, cotisation.id) : 0
  const montantSaisi = montant ?? restant

  /* ----- confirmation ----- */
  if (succes) {
    return (
      <Page
        width="narrow"
        header={<PageHeader eyebrow="Adhésions" title="Paiement enregistré" description="L'encaissement est consigné dans l'historique de l'adhérent." />}
      >
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-8 text-center">
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full border border-success-100 bg-success-50 text-success-600">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink-950">{formatMoney(succes.montant)} encaissés</h2>
            <p className="text-[0.8125rem] text-ink-500">
              {adherent.prenom} {adherent.nom} ·{' '}
              {succes.reste > 0 ? `reste ${formatMoney(succes.reste)} à encaisser` : 'cotisation soldée'}
            </p>
            <StatusBadge status={succes.reste > 0 ? 'cotisation_partielle' : 'cotisation_payee'} />
          </CardBody>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => navigate(`/adherents/${adherent.id}`)}>
            Ouvrir la fiche
          </Button>
          {succes.reste > 0 && (
            <Button
              onClick={() => {
                setSucces(null)
                setMontant(null)
              }}
            >
              Enregistrer un autre paiement
            </Button>
          )}
          <Button variant="ghost" onClick={() => navigate('/adherents/liste')}>
            Retour à la liste
          </Button>
        </div>
      </Page>
    )
  }

  const enTete = (
    <PageHeader
      eyebrow="Adhésions"
      title={`Enregistrer un paiement — ${adherent.prenom} ${adherent.nom}`}
      description="L'encaissement est rattaché à une cotisation et met son statut à jour automatiquement."
      actions={
        <Button onClick={() => navigate(`/adherents/${adherent.id}`)} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
          Retour à la fiche
        </Button>
      }
    />
  )

  if (impayees.length === 0) {
    return (
      <Page width="narrow" header={enTete}>
        <Card>
          <EmptyState
            icon={<CheckCircle2 />}
            title="Rien à encaisser"
            description="Toutes les cotisations de cet adhérent sont soldées. Un renouvellement créera une nouvelle cotisation."
            action={
              <Button variant="primary" onClick={() => navigate(`/adherents/${adherent.id}/renouveler`)}>
                Renouveler l’adhésion
              </Button>
            }
            secondaryAction={<Button onClick={() => navigate(`/adherents/${adherent.id}`)}>Ouvrir la fiche</Button>}
          />
        </Card>
      </Page>
    )
  }

  const soumettre = async () => {
    const e: Record<string, string> = {}
    if (!cotisationId) e.cotisationId = 'Choisissez la cotisation à régler.'
    if (!montantSaisi || montantSaisi <= 0) e.montant = 'Indiquez un montant supérieur à zéro.'
    else if (montantSaisi > restant) e.montant = `Le montant dépasse le reste dû (${formatMoney(restant)}).`
    if (!date) e.date = 'Indiquez la date d’encaissement.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    setErreurGlobale(null)
    setEnCours(true)
    try {
      await enregistrerPaiement(adherent.id, { cotisationId, montant: montantSaisi, date, moyen, reference })
      toast({ titre: 'Paiement enregistré', detail: `${formatMoney(montantSaisi)} par ${moyenLabels[moyen].toLowerCase()}.`, tone: 'success' })
      setSucces({ montant: montantSaisi, reste: restant - montantSaisi })
    } catch (error) {
      setErreurGlobale((error as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (error as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page width="narrow" header={enTete}>
      {erreurGlobale && (
        <Alert tone="danger" titre="Le paiement n’a pas pu être enregistré">
          {erreurGlobale} Vos saisies sont conservées.
        </Alert>
      )}

      <Card>
        <CardHeader title="Cotisation à régler" description="Seules les cotisations non soldées sont proposées." />
        <CardBody className="flex flex-col gap-3">
          <fieldset>
            <legend className="sr-only">Cotisation à régler</legend>
            <div className="flex flex-col gap-2">
              {impayees.map((c) => {
                const reste = resteDu(adherent, c.id)
                const choisie = c.id === cotisationId
                return (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      choisie ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-ink-200 hover:bg-ink-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cotisation"
                      value={c.id}
                      checked={choisie}
                      onChange={() => {
                        setCotisationId(c.id)
                        setMontant(null)
                      }}
                      className="h-4 w-4 accent-[#2364AA]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.8125rem] font-medium text-ink-900">
                        Exercice {c.exercice} · {c.typeNom}
                      </span>
                      <span className="ac-num block text-xs text-ink-500">
                        {formatMoney(c.montant)} · déjà payé {formatMoney(montantPaye(adherent, c.id))} · échéance {formatDate(c.echeanceLe)}
                      </span>
                    </span>
                    <span className="ac-num shrink-0 text-[0.8125rem] font-semibold text-warning-600">
                      reste {formatMoney(reste)}
                    </span>
                    <StatusBadge status={cleCotisation(c.statut)} />
                  </label>
                )
              })}
            </div>
          </fieldset>
          {erreurs.cotisationId && <p className="text-xs font-medium text-danger-600">{erreurs.cotisationId}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Encaissement" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Montant encaissé"
            required
            error={erreurs.montant}
            hint={`Reste dû sur cette cotisation : ${formatMoney(restant)}.`}
          >
            {(p) => (
              <Input
                {...p}
                type="number"
                min={0}
                suffix="€"
                value={String(montantSaisi)}
                onChange={(e) => setMontant(Number(e.target.value))}
              />
            )}
          </Field>
          <Field label="Date d’encaissement" required error={erreurs.date}>
            {(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="Moyen de paiement" required>
            {(p) => (
              <Select
                {...p}
                value={moyen}
                onChange={(e) => setMoyen(e.target.value as MoyenPaiement)}
                options={(Object.keys(moyenLabels) as MoyenPaiement[]).map((m) => ({ value: m, label: moyenLabels[m] }))}
              />
            )}
          </Field>
          <Field label="Référence" hint="Numéro de chèque, référence de virement. Générée si vide.">
            {(p) => <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="CHQ-4417" />}
          </Field>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours
            ? 'Enregistrement en cours…'
            : montantSaisi < restant
              ? `Paiement partiel : il restera ${formatMoney(restant - montantSaisi)}.`
              : 'La cotisation sera soldée.'}
        </p>
        <Button variant="ghost" onClick={() => navigate(`/adherents/${adherent.id}`)} disabled={enCours}>
          Annuler
        </Button>
        <Button variant="primary" loading={enCours} onClick={soumettre} iconLeft={<CreditCard aria-hidden className="h-4 w-4" />}>
          Enregistrer le paiement
        </Button>
      </div>
    </Page>
  )
}
