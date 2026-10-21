import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Scale, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { ComptaNav } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import { useToast } from '@/context/ToastContext'
import { journaux, type Ecriture, type LigneEcriture } from '@/lib/comptabilite'
import { formatMoney, toInputDate, uid } from '@/lib/utils'

function ligneVide(): LigneEcriture {
  return { id: uid('lig'), compte: '', libelle: '', debit: 0, credit: 0, rapprochee: false }
}

const arrondi = (n: number) => Math.round(n * 100) / 100

export function EcritureForm({ mode }: { mode: 'creation' | 'modification' }) {
  usePageTitle('Écriture')

  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { plan, exercice, exercices, exerciceId, lectureSeule, ecritureParId, creerEcriture, modifierEcriture, validerEcritures } =
    useCompta()

  const existante = mode === 'modification' ? ecritureParId(id) : undefined

  const [journal, setJournal] = useState(existante?.journal ?? 'OD')
  const [date, setDate] = useState(toInputDate(existante?.date ?? new Date('2026-08-28').toISOString()))
  const [libelle, setLibelle] = useState(existante?.libelle ?? '')
  const [reference, setReference] = useState(existante?.reference ?? '')
  const [tiers, setTiers] = useState(existante?.tiers ?? '')
  const [lignes, setLignes] = useState<LigneEcriture[]>(existante?.lignes ?? [ligneVide(), ligneVide()])
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const totalDebit = arrondi(lignes.reduce((s, l) => s + (Number(l.debit) || 0), 0))
  const totalCredit = arrondi(lignes.reduce((s, l) => s + (Number(l.credit) || 0), 0))
  const ecartCourant = arrondi(totalDebit - totalCredit)
  const equilibre = ecartCourant === 0 && totalDebit > 0

  if (mode === 'modification' && !existante) {
    return (
      <Page header={<PageHeader title="Écriture introuvable" />}>
        <Card>
          <EmptyState
            icon={<Scale />}
            title="Cette écriture n'existe plus"
            description="Elle a peut-être été supprimée ou validée depuis un autre onglet."
            action={<Button variant="primary" onClick={() => navigate('/comptabilite/journal')}>Retour au journal</Button>}
          />
        </Card>
      </Page>
    )
  }

  if (lectureSeule && mode === 'creation') {
    return (
      <Page header={<PageHeader eyebrow="Comptabilité" title="Nouvelle écriture" />}>
        <ComptaNav />
        <Alert tone="neutral" titre={`L'exercice ${exercice.libelle} est clôturé`}>
          Aucune écriture ne peut y être ajoutée. Sélectionnez un exercice ouvert dans la barre d'outils du module.
        </Alert>
        <Button onClick={() => navigate('/comptabilite/journal')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
          Retour au journal
        </Button>
      </Page>
    )
  }

  const majLigne = (ligneId: string, patch: Partial<LigneEcriture>) =>
    setLignes((l) => l.map((x) => (x.id === ligneId ? { ...x, ...patch } : x)))

  const valider = () => {
    const e: Record<string, string> = {}
    if (!libelle.trim()) e.libelle = 'Indiquez le libellé de l’écriture.'
    if (!date) e.date = 'Indiquez la date de l’opération.'
    else {
      const cible = existante ? existante.exerciceId : exerciceId
      const ex = exercices.find((x) => x.id === cible)
      if (ex && (date < ex.debut || date > ex.fin)) {
        e.date = `La date doit tomber dans l’exercice ${ex.libelle}, entre le ${new Date(ex.debut).toLocaleDateString('fr-FR')} et le ${new Date(ex.fin).toLocaleDateString('fr-FR')}.`
      }
    }
    if (lignes.length < 2) e.lignes = 'Une écriture comporte au moins deux lignes.'
    if (lignes.some((l) => !l.compte)) e.lignes = 'Chaque ligne doit porter un numéro de compte.'
    if (lignes.some((l) => (Number(l.debit) || 0) > 0 && (Number(l.credit) || 0) > 0))
      e.lignes = 'Une ligne porte soit un débit, soit un crédit, jamais les deux.'
    if (totalDebit === 0 && totalCredit === 0) e.lignes = 'Renseignez au moins un montant.'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const enregistrer = async (puisValider: boolean) => {
    if (!valider()) return
    if (puisValider && !equilibre) {
      setErreurGlobale('Une écriture déséquilibrée ne peut pas être validée. Corrigez l’écart avant de valider.')
      return
    }
    setErreurGlobale(null)
    setEnCours(true)
    try {
      const donnees: Omit<Ecriture, 'id' | 'numero' | 'creeePar' | 'valideeLe'> = {
        exerciceId: existante?.exerciceId ?? exerciceId,
        journal,
        date: new Date(date).toISOString(),
        libelle: libelle.trim(),
        reference: reference.trim(),
        tiers: tiers.trim(),
        statut: 'brouillon',
        lignes: lignes.map((l) => ({ ...l, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
        pieceId: existante?.pieceId ?? null,
      }

      if (mode === 'creation') {
        const creee = await creerEcriture(donnees)
        if (puisValider) await validerEcritures([creee.id])
        toast({
          titre: puisValider ? 'Écriture créée et validée' : 'Écriture enregistrée en brouillon',
          detail: `${creee.numero} — ${formatMoney(totalDebit)}.`,
          tone: 'success',
        })
        navigate(`/comptabilite/ecritures/${creee.id}`)
      } else {
        await modifierEcriture(existante!.id, donnees)
        if (puisValider) await validerEcritures([existante!.id])
        toast({
          titre: puisValider ? 'Écriture modifiée et validée' : 'Modifications enregistrées',
          detail: `${existante!.numero} — ${formatMoney(totalDebit)}.`,
          tone: 'success',
        })
        navigate(`/comptabilite/ecritures/${existante!.id}`)
      }
    } catch (err) {
      setErreurGlobale((err as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const optionsComptes = plan
    .filter((c) => c.actif)
    .map((c) => ({ value: c.numero, label: `${c.numero} — ${c.libelle}` }))

  return (
    <Page
      header={
        <PageHeader
          eyebrow={`Comptabilité · exercice ${exercice.libelle}`}
          title={mode === 'creation' ? 'Nouvelle écriture' : `Modifier ${existante!.numero}`}
          description="Une écriture est enregistrée en brouillon puis validée. La validation exige un équilibre parfait entre débits et crédits."
          actions={
            <Button
              onClick={() => navigate(mode === 'creation' ? '/comptabilite/journal' : `/comptabilite/ecritures/${id}`)}
              iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}
            >
              Annuler
            </Button>
          }
        />
      }
    >
      <ComptaNav />

      {erreurGlobale && (
        <Alert tone="danger" titre="Enregistrement impossible">
          {erreurGlobale}
        </Alert>
      )}

      <Card>
        <CardHeader title="En-tête" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Journal" required>
            {(p) => (
              <Select
                {...p}
                value={journal}
                onChange={(ev) => setJournal(ev.target.value)}
                options={journaux.map((j) => ({ value: j.code, label: `${j.code} — ${j.libelle}` }))}
              />
            )}
          </Field>
          <Field label="Date de l’opération" required error={erreurs.date}>
            {(p) => <Input {...p} type="date" value={date} onChange={(ev) => setDate(ev.target.value)} />}
          </Field>
          <Field label="Libellé" required error={erreurs.libelle} className="sm:col-span-2">
            {(p) => <Input {...p} value={libelle} onChange={(ev) => setLibelle(ev.target.value)} placeholder="Facture fournitures administratives" />}
          </Field>
          <Field label="Référence" hint="Numéro de facture, de chèque ou de relevé.">
            {(p) => <Input {...p} value={reference} onChange={(ev) => setReference(ev.target.value)} placeholder="FA-2026-118" />}
          </Field>
          <Field label="Tiers">
            {(p) => <Input {...p} value={tiers} onChange={(ev) => setTiers(ev.target.value)} placeholder="Papeterie Océane" />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Lignes"
          description="Chaque ligne porte un débit ou un crédit, jamais les deux."
          action={
            <Button size="sm" onClick={() => setLignes((l) => [...l, ligneVide()])} iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}>
              Ajouter une ligne
            </Button>
          }
        />
        <CardBody className="flex flex-col gap-3">
          {erreurs.lignes && (
            <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 p-2.5 text-[0.8125rem] text-danger-700">
              {erreurs.lignes}
            </p>
          )}

          {lignes.map((l, i) => (
            <div key={l.id} className="grid gap-2 rounded-lg border border-ink-200 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_7rem_7rem_auto] sm:items-end">
              <Field label={`Compte de la ligne ${i + 1}`} className="[&>div>label]:sr-only">
                {(p) => (
                  <Select
                    {...p}
                    value={l.compte}
                    onChange={(ev) => majLigne(l.id, { compte: ev.target.value })}
                    placeholder="Choisir un compte"
                    options={optionsComptes}
                  />
                )}
              </Field>
              <Field label={`Libellé de la ligne ${i + 1}`} className="[&>div>label]:sr-only">
                {(p) => <Input {...p} value={l.libelle} onChange={(ev) => majLigne(l.id, { libelle: ev.target.value })} placeholder="Libellé de la ligne" />}
              </Field>
              <Field label={`Débit ligne ${i + 1}`} className="[&>div>label]:sr-only">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={0}
                    step="0.01"
                    suffix="€"
                    value={l.debit ? String(l.debit) : ''}
                    placeholder="Débit"
                    onChange={(ev) => majLigne(l.id, { debit: Number(ev.target.value) || 0, credit: 0 })}
                  />
                )}
              </Field>
              <Field label={`Crédit ligne ${i + 1}`} className="[&>div>label]:sr-only">
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    min={0}
                    step="0.01"
                    suffix="€"
                    value={l.credit ? String(l.credit) : ''}
                    placeholder="Crédit"
                    onChange={(ev) => majLigne(l.id, { credit: Number(ev.target.value) || 0, debit: 0 })}
                  />
                )}
              </Field>
              <Button
                variant="icon"
                label={`Supprimer la ligne ${i + 1}`}
                disabled={lignes.length <= 2}
                onClick={() => setLignes((x) => x.filter((y) => y.id !== l.id))}
                className="text-ink-500 hover:text-danger-600"
              >
                <Trash2 aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 ${
              equilibre ? 'border-success-100 bg-success-50' : 'border-warning-100 bg-warning-50'
            }`}
          >
            <div className="ac-num flex flex-wrap gap-x-6 gap-y-1 text-[0.8125rem]">
              <span className={equilibre ? 'text-success-700' : 'text-warning-700'}>
                Total débit <strong>{formatMoney(totalDebit)}</strong>
              </span>
              <span className={equilibre ? 'text-success-700' : 'text-warning-700'}>
                Total crédit <strong>{formatMoney(totalCredit)}</strong>
              </span>
            </div>
            <p className={`text-[0.8125rem] font-semibold ${equilibre ? 'text-success-700' : 'text-warning-700'}`} aria-live="polite">
              {equilibre
                ? 'Écriture équilibrée — validation possible'
                : `Écart de ${formatMoney(Math.abs(ecartCourant))} — validation impossible`}
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours ? 'Enregistrement en cours…' : 'Le brouillon peut être enregistré même déséquilibré.'}
        </p>
        <Button variant="ghost" onClick={() => navigate('/comptabilite/journal')} disabled={enCours}>
          Annuler
        </Button>
        <Button loading={enCours} onClick={() => void enregistrer(false)}>
          Enregistrer en brouillon
        </Button>
        <Button variant="primary" disabled={!equilibre} loading={enCours} onClick={() => void enregistrer(true)}>
          Enregistrer et valider
        </Button>
      </div>
    </Page>
  )
}
