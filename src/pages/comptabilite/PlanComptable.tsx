import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Pencil, Plus } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Status'
import { ComptaNav, ComptaOutils } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import { useToast } from '@/context/ToastContext'
import { classesLabels, mouvementsDuCompte, soldesParCompte, type Compte, type SensCompte } from '@/lib/comptabilite'
import { formatDate, formatMoney } from '@/lib/utils'

const sensOptions: { value: SensCompte; label: string }[] = [
  { value: 'actif', label: 'Actif (bilan)' },
  { value: 'passif', label: 'Passif (bilan)' },
  { value: 'charge', label: 'Charge (gestion)' },
  { value: 'produit', label: 'Produit (gestion)' },
]

const compteVide: Compte = { numero: '', libelle: '', classe: 6, sens: 'charge', tresorerie: false, actif: true }

export function PlanComptable() {
  usePageTitle('Plan comptable')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { plan, ecritures, exerciceId, creerCompte, modifierCompte } = useCompta()

  const [form, setForm] = useState<{ mode: 'creer' | 'modifier' } | null>(null)
  const [valeurs, setValeurs] = useState<Compte>(compteVide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const soldes = soldesParCompte(ecritures.filter((e) => e.statut === 'validee'))
  const classes = Array.from(new Set(plan.map((c) => c.classe))).sort()

  const ouvrir = (mode: 'creer' | 'modifier', c?: Compte) => {
    setErreurs({})
    setErreurGlobale(null)
    setValeurs(c ? { ...c } : compteVide)
    setForm({ mode })
  }

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!/^\d{6}$/.test(valeurs.numero)) e.numero = 'Le numéro de compte comporte six chiffres, par exemple 606400.'
    if (!valeurs.libelle.trim()) e.libelle = 'Indiquez l’intitulé du compte.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    const compte: Compte = { ...valeurs, classe: Number(valeurs.numero[0]) }
    setEnCours(true)
    setErreurGlobale(null)
    void (async () => {
      try {
        if (form!.mode === 'creer') await creerCompte(compte)
        else await modifierCompte(compte.numero, compte)
        toast({
          titre: form!.mode === 'creer' ? 'Compte créé' : 'Compte mis à jour',
          detail: `${compte.numero} — ${compte.libelle}`,
          tone: 'success',
        })
        setForm(null)
      } catch (err) {
        setErreurGlobale((err as Error).message)
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  const set = <K extends keyof Compte>(k: K, v: Compte[K]) => setValeurs((s) => ({ ...s, [k]: v }))

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Comptabilité"
          title="Plan comptable"
          description="Les comptes disponibles à la saisie, organisés par classe. Un compte mouvementé ne peut pas être supprimé : il se désactive."
          meta={<Badge variant="brand">{plan.length} comptes</Badge>}
          actions={
            <>
              <ComptaOutils />
              <Button variant="primary" onClick={() => ouvrir('creer')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouveau compte
              </Button>
            </>
          }
        />
      }
    >
      <ComptaNav />

      {classes.map((classe) => (
        <Card key={classe}>
          <CardHeader title={classesLabels[classe] ?? `Classe ${classe}`} description={`${plan.filter((c) => c.classe === classe).length} comptes`} />
          <div className="ac-scroll overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">{classesLabels[classe] ?? `Classe ${classe}`}</caption>
              <thead>
                <tr className="border-b border-ink-100 bg-ink-25">
                  {['Numéro', 'Intitulé', 'Nature', 'Mouvements', 'Solde', ''].map((h, i) => (
                    <th key={h || i} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 3 ? 'text-right' : ''}`}>
                      {h || <span className="sr-only">Actions</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {plan
                  .filter((c) => c.classe === classe)
                  .map((c) => {
                    const s = soldes.get(c.numero)
                    const nb = mouvementsDuCompte(ecritures.filter((e) => e.statut === 'validee' && e.exerciceId === exerciceId), c.numero).length
                    return (
                      <tr key={c.numero} className="transition-colors hover:bg-ink-25">
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/comptabilite/comptes/${c.numero}`)}
                            className="ac-num text-[0.8125rem] font-medium text-brand-600 underline-offset-2 hover:underline"
                          >
                            {c.numero}
                          </button>
                        </td>
                        <td className="px-4 py-2.5 text-[0.8125rem] text-ink-800">
                          {c.libelle}
                          {!c.actif && <span className="ml-2"><StatusBadge status="archive" /></span>}
                          {c.tresorerie && <span className="ml-2"><Badge variant="outline">Trésorerie</Badge></span>}
                        </td>
                        <td className="px-4 py-2.5 text-[0.8125rem] text-ink-500">
                          {sensOptions.find((o) => o.value === c.sens)?.label}
                        </td>
                        <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-500">{nb}</td>
                        <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-medium text-ink-900">
                          {s ? formatMoney(Math.abs(s.solde)) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button variant="icon" size="sm" label={`Modifier le compte ${c.numero}`} onClick={() => ouvrir('modifier', c)}>
                            <Pencil aria-hidden className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?.mode === 'creer' ? 'Nouveau compte' : `Modifier le compte ${valeurs.numero}`}
        description="La classe se déduit du premier chiffre du numéro."
        footer={
          <>
            <Button variant="ghost" onClick={() => setForm(null)} disabled={enCours}>
              Annuler
            </Button>
            <Button variant="primary" loading={enCours} onClick={enregistrer}>
              {form?.mode === 'creer' ? 'Créer le compte' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {erreurGlobale && (
            <p role="alert" className="sm:col-span-2 rounded-lg border border-danger-100 bg-danger-50 p-3 text-[0.8125rem] text-danger-700">
              {erreurGlobale}
            </p>
          )}
          <Field label="Numéro de compte" required error={erreurs.numero} hint="Six chiffres.">
            {(p) => (
              <Input
                {...p}
                inputMode="numeric"
                maxLength={6}
                disabled={form?.mode === 'modifier'}
                value={valeurs.numero}
                onChange={(e) => set('numero', e.target.value.replace(/\D/g, ''))}
                placeholder="606400"
              />
            )}
          </Field>
          <Field label="Nature" required>
            {(p) => (
              <Select {...p} value={valeurs.sens} onChange={(e) => set('sens', e.target.value as SensCompte)} options={sensOptions} />
            )}
          </Field>
          <Field label="Intitulé" required error={erreurs.libelle} className="sm:col-span-2">
            {(p) => <Input {...p} value={valeurs.libelle} onChange={(e) => set('libelle', e.target.value)} placeholder="Fournitures administratives" />}
          </Field>
          <div className="sm:col-span-2 flex flex-col gap-4 border-t border-ink-100 pt-4">
            <Switch
              label="Compte de trésorerie"
              description="Entre dans le rapprochement bancaire."
              checked={valeurs.tresorerie}
              onCheckedChange={(v) => set('tresorerie', v)}
            />
            <Switch
              label="Compte actif"
              description="Un compte désactivé n’est plus proposé à la saisie, mais son historique reste consultable."
              checked={valeurs.actif}
              onCheckedChange={(v) => set('actif', v)}
            />
          </div>
        </div>
      </Modal>
    </Page>
  )
}

/* ------------------------------------------------------------------ */
/* Fiche d'un compte : ses mouvements sur l'exercice                    */
/* ------------------------------------------------------------------ */

export function CompteFiche() {
  const { numero = '' } = useParams()
  const navigate = useNavigate()
  const { ecritures, exercice, exerciceId, compteParNumero, chargement } = useCompta()
  const compte = compteParNumero(numero)

  const mouvements = mouvementsDuCompte(
    ecritures.filter((e) => e.statut === 'validee' && e.exerciceId === exerciceId),
    numero,
  )
  const debit = mouvements.reduce((s, m) => s + m.debit, 0)
  const credit = mouvements.reduce((s, m) => s + m.credit, 0)

  if (!compte) {
    return (
      <Page header={<PageHeader title="Compte introuvable" />}>
        <Card>
          <EmptyState
            icon={<BookOpen />}
            title="Ce compte n'existe pas dans le plan"
            description="Il a peut-être été renuméroté. Le plan comptable liste les comptes disponibles."
            action={<Button variant="primary" onClick={() => navigate('/comptabilite/plan')}>Ouvrir le plan comptable</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow={`Comptabilité · exercice ${exercice.libelle}`}
          title={`${compte.numero} — ${compte.libelle}`}
          description={`${sensOptions.find((o) => o.value === compte.sens)?.label} · ${mouvements.length} mouvement(s) sur l'exercice`}
          meta={
            <>
              <Badge variant="outline">{classesLabels[compte.classe]}</Badge>
              {compte.tresorerie && <Badge variant="brand">Trésorerie</Badge>}
            </>
          }
          actions={
            <>
              <ComptaOutils />
              <Button onClick={() => navigate('/comptabilite/plan')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Plan comptable
              </Button>
            </>
          }
        />
      }
    >
      <ComptaNav />

      {exercice.statut === 'cloture' && (
        <Alert tone="neutral" titre={`Exercice ${exercice.libelle} clôturé — lecture seule`}>
          Les mouvements de ce compte sont figés.
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[0.8125rem] text-ink-500">Total débit</p>
          <p className="ac-num mt-1 font-display text-xl font-semibold text-ink-900">{formatMoney(debit)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[0.8125rem] text-ink-500">Total crédit</p>
          <p className="ac-num mt-1 font-display text-xl font-semibold text-ink-900">{formatMoney(credit)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-[0.8125rem] text-ink-500">Solde {debit - credit >= 0 ? 'débiteur' : 'créditeur'}</p>
          <p className="ac-num mt-1 font-display text-xl font-semibold text-ink-900">{formatMoney(Math.abs(debit - credit))}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Mouvements" description="Écritures validées de l'exercice, dans l'ordre chronologique." />
        {mouvements.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="Aucun mouvement sur cet exercice"
            description="Ce compte existe dans le plan mais n'a pas encore été mouvementé."
            compact
          />
        ) : (
          <div className="ac-scroll overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Mouvements du compte {compte.numero}</caption>
              <thead>
                <tr className="border-b border-ink-100 bg-ink-25">
                  {['Date', 'Journal', 'N°', 'Libellé', 'Débit', 'Crédit', 'Solde cumulé'].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 4 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {mouvements.map((m, i) => (
                  <tr key={`${m.ecritureId}-${i}`} className="transition-colors hover:bg-ink-25">
                    <td className="ac-num px-4 py-2.5 text-[0.8125rem] text-ink-700">{formatDate(m.date)}</td>
                    <td className="px-4 py-2.5"><Badge variant="outline">{m.journal}</Badge></td>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/comptabilite/ecritures/${m.ecritureId}`)}
                        className="ac-num text-[0.8125rem] text-brand-600 underline-offset-2 hover:underline"
                      >
                        {m.numero}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-[0.8125rem] text-ink-800">{m.libelle}</td>
                    <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem]">{m.debit > 0 ? formatMoney(m.debit) : '—'}</td>
                    <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem]">{m.credit > 0 ? formatMoney(m.credit) : '—'}</td>
                    <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-medium text-ink-900">{formatMoney(m.cumul)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <span className="sr-only" aria-live="polite">{chargement ? 'Chargement' : ''}</span>
    </Page>
  )
}
