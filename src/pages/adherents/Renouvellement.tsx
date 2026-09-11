import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, RotateCw, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Status'
import { cleAdhesion } from '@/components/adherents/statuts'
import { useAdherents } from '@/context/AdherentsContext'
import { useToast } from '@/context/ToastContext'
import { joursAvant, statutAdhesion } from '@/lib/adherents'
import { formatDate, formatMoney } from '@/lib/utils'

export function Renouvellement() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { parId, types, typeParId, renouveler, chargement } = useAdherents()
  const adherent = parId(id)

  const typeActuel = adherent ? typeParId(adherent.typeId) : undefined
  const expiree = adherent ? statutAdhesion(adherent) === 'expiree' : false
  const defautDebut = adherent
    ? (expiree ? new Date() : new Date(adherent.dateFin)).toISOString().slice(0, 10)
    : ''

  const [typeId, setTypeId] = useState(adherent?.typeId ?? '')
  const [dateDebut, setDateDebut] = useState(defautDebut)
  const [montant, setMontant] = useState(typeActuel?.montant ?? 0)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  if (chargement) {
    return (
      <Page width="narrow" header={<PageHeader title="Renouvellement" />}>
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
            description="Impossible de renouveler une adhésion supprimée."
            action={<Button variant="primary" onClick={() => navigate('/adherents/liste')}>Retour à la liste</Button>}
          />
        </Card>
      </Page>
    )
  }

  const type = types.find((t) => t.id === typeId)
  const finPrevue = (() => {
    if (!type || !dateDebut) return null
    const d = new Date(dateDebut)
    d.setMonth(d.getMonth() + type.dureeMois)
    return d.toISOString()
  })()

  const soumettre = async () => {
    const e: Record<string, string> = {}
    if (!typeId) e.typeId = 'Choisissez un type d’adhésion.'
    if (!dateDebut) e.dateDebut = 'Indiquez la date de début.'
    if (!montant || montant <= 0) e.montant = 'Le montant doit être supérieur à zéro.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    setErreurGlobale(null)
    setEnCours(true)
    try {
      await renouveler(adherent.id, typeId, dateDebut, montant)
      toast({
        titre: 'Adhésion renouvelée',
        detail: `Nouvelle échéance au ${finPrevue ? formatDate(finPrevue) : '—'}. La cotisation est en attente de paiement.`,
        tone: 'success',
      })
      navigate(`/adherents/${adherent.id}/paiement`)
    } catch (error) {
      setErreurGlobale((error as Error).message)
      toast({ titre: 'Renouvellement impossible', detail: (error as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const jours = joursAvant(adherent.dateFin)

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Adhésions"
          title={`Renouveler l'adhésion de ${adherent.prenom} ${adherent.nom}`}
          description="Le renouvellement crée une nouvelle cotisation, en attente de paiement."
          meta={<StatusBadge status={cleAdhesion(adherent)} />}
          actions={
            <Button onClick={() => navigate(`/adherents/${adherent.id}`)} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Retour à la fiche
            </Button>
          }
        />
      }
    >
      {erreurGlobale && (
        <Alert tone="danger" titre="Le renouvellement a échoué">
          {erreurGlobale} Vos saisies sont conservées.
        </Alert>
      )}

      <Alert tone={expiree ? 'danger' : 'warning'} titre="Adhésion en cours">
        {typeActuel?.nom} · du {formatDate(adherent.dateDebut)} au {formatDate(adherent.dateFin)}.{' '}
        {expiree ? `Expirée depuis ${-jours} jours : le renouvellement démarre aujourd'hui.` : `Expire dans ${jours} jours : le renouvellement prend le relais à l'échéance.`}
      </Alert>

      <Card>
        <CardHeader title="Nouvelle période" description="Les valeurs sont pré-remplies à partir de l’adhésion actuelle." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Type d’adhésion" required error={erreurs.typeId} className="sm:col-span-2">
            {(p) => (
              <Select
                {...p}
                value={typeId}
                onChange={(e) => {
                  setTypeId(e.target.value)
                  const t = types.find((x) => x.id === e.target.value)
                  if (t) setMontant(t.montant)
                }}
                options={types.filter((t) => t.actif || t.id === adherent.typeId).map((t) => ({
                  value: t.id,
                  label: `${t.nom} — ${t.montant} € / ${t.dureeMois} mois${t.actif ? '' : ' (formule suspendue)'}`,
                }))}
              />
            )}
          </Field>
          <Field label="Date de début" required error={erreurs.dateDebut}>
            {(p) => <Input {...p} type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />}
          </Field>
          <Field label="Montant de la cotisation" required error={erreurs.montant}>
            {(p) => <Input {...p} type="number" min={0} suffix="€" value={String(montant)} onChange={(e) => setMontant(Number(e.target.value))} />}
          </Field>
          <div className="sm:col-span-2 rounded-lg border border-ink-200 bg-ink-25 p-3">
            <p className="text-[0.8125rem] text-ink-700">
              Nouvelle échéance :{' '}
              <span className="ac-num font-semibold text-ink-900">{finPrevue ? formatDate(finPrevue) : '—'}</span>
              {' · '}Cotisation émise : <span className="ac-num font-semibold text-ink-900">{formatMoney(montant)}</span>
            </p>
            <p className="mt-1 text-xs text-ink-500">
              Après validation, vous serez conduit à l’écran d’enregistrement du paiement.
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours ? 'Renouvellement en cours…' : 'La cotisation sera créée en attente de paiement.'}
        </p>
        <Button variant="ghost" onClick={() => navigate(`/adherents/${adherent.id}`)} disabled={enCours}>
          Annuler
        </Button>
        <Button variant="primary" loading={enCours} onClick={soumettre} iconLeft={<RotateCw aria-hidden className="h-4 w-4" />}>
          Renouveler l’adhésion
        </Button>
      </div>
    </Page>
  )
}
