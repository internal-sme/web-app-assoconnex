import { usePageTitle } from '@/hooks/usePageTitle'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRight, ArrowRight, BarChart3, Landmark, Plus, Tag, Trash2, Wand2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Toggle'
import { StatusBadge } from '@/components/ui/Status'
import { GroupedBars, HorizontalBars, LineChart } from '@/components/ui/Chart'
import { TresoNav, TresoOutils } from '@/components/tresorerie/TresoNav'
import { useTresorerie } from '@/context/TresorerieContext'
import { useToast } from '@/context/ToastContext'
import {
  calculerEnchainement,
  previsionsDansHorizon,
  repartitionCategories,
  serieProjection,
  serieSolde,
  soldeCompte,
  suggererCategorie,
  type Fiabilite,
  type SensMouvement,
} from '@/lib/tresorerie'
import { formatDate, formatMoney } from '@/lib/utils'

const arrondi = (n: number) => Math.round(n * 100) / 100

/* --------------------------- Rapprochement --------------------------- */

export function RapprochementTreso() {
  usePageTitle('Outils trésorerie')

  const { toast } = useToast()
  const { comptes, mouvements, chargement, pointer } = useTresorerie()
  const tresorerie = comptes
  const [compteId, setCompteId] = useState(tresorerie[0]?.id ?? '')
  const [soldeReleve, setSoldeReleve] = useState('')

  const lignes = useMemo(
    () => mouvements.filter((m) => m.compteId === compteId).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [mouvements, compteId],
  )

  const compte = comptes.find((c) => c.id === compteId)
  const soldeComptable = compte ? soldeCompte(compte, mouvements) : 0
  const soldePointe = arrondi(
    (compte?.soldeInitial ?? 0) +
      lignes.filter((m) => m.rapproche).reduce((s, m) => s + (m.sens === 'entree' ? m.montant : -m.montant), 0),
  )
  const nonPointes = lignes.filter((m) => !m.rapproche)
  const releve = soldeReleve === '' ? null : Number(soldeReleve)
  const ecart = releve === null ? null : arrondi(releve - soldePointe)

  const basculer = async (id: string, valeur: boolean) => {
    try {
      await pointer(id, valeur)
    } catch (e) {
      toast({ titre: 'Pointage impossible', detail: (e as Error).message, tone: 'danger' })
    }
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Trésorerie"
          title="Rapprochement bancaire"
          description="Pointez les mouvements figurant sur le relevé. L'écart entre le solde pointé et le solde du relevé doit être nul."
          meta={<Badge variant="brand">{nonPointes.length} non pointés</Badge>}
          actions={<TresoOutils />}
        />
      }
    >
      <TresoNav />

      <Card>
        <CardHeader title="Paramètres" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Compte" required>
            {(p) => (
              <Select {...p} value={compteId} onChange={(e) => setCompteId(e.target.value)} options={tresorerie.map((c) => ({ value: c.id, label: c.nom }))} />
            )}
          </Field>
          <Field label="Solde du relevé" hint="Solde figurant sur le dernier relevé reçu.">
            {(p) => <Input {...p} type="number" step="0.01" suffix="€" value={soldeReleve} onChange={(e) => setSoldeReleve(e.target.value)} placeholder="0,00" />}
          </Field>
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Solde comptable', formatMoney(soldeComptable), 'Tous mouvements enregistrés'],
          ['Solde pointé', formatMoney(soldePointe), 'Mouvements rapprochés'],
          ['En suspens', formatMoney(arrondi(soldeComptable - soldePointe)), `${nonPointes.length} mouvement(s)`],
          ['Écart avec le relevé', ecart === null ? '—' : formatMoney(ecart), ecart === null ? 'Saisissez le solde' : ecart === 0 ? 'Rapprochement juste' : 'À justifier'],
        ].map(([k, v, h]) => (
          <Card key={k} className="p-4">
            <p className="text-[0.8125rem] text-ink-500">{k}</p>
            <p className="ac-num mt-1.5 font-display text-xl font-semibold text-ink-900">{v}</p>
            <p className="mt-1.5 text-xs text-ink-500">{h}</p>
          </Card>
        ))}
      </div>

      {ecart !== null && (
        <Alert tone={ecart === 0 ? 'success' : 'warning'} titre={ecart === 0 ? 'Rapprochement équilibré' : `Écart de ${formatMoney(Math.abs(ecart))}`}>
          {ecart === 0
            ? 'Le solde pointé correspond au relevé. Le rapprochement est terminé.'
            : 'Vérifiez les mouvements en suspens : un chèque non encaissé ou un virement en cours explique souvent la différence.'}
        </Alert>
      )}

      <Card>
        <CardHeader title="Mouvements à pointer" description="Cochez chaque ligne retrouvée sur le relevé." />
        {chargement ? (
          <SkeletonTable rows={6} />
        ) : lignes.length === 0 ? (
          <EmptyState icon={<Landmark />} title="Aucun mouvement sur ce compte" description="Choisissez un autre compte." compact />
        ) : (
          <div className="ac-scroll overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Mouvements à rapprocher</caption>
              <thead>
                <tr className="border-b border-ink-100 bg-ink-25">
                  {['Pointé', 'Date', 'Libellé', 'Montant', 'État'].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i === 3 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {lignes.slice(0, 50).map((m) => (
                  <tr key={m.id} className={m.rapproche ? 'bg-success-50/40' : undefined}>
                    <td className="px-4 py-2">
                      <Checkbox
                        checked={m.rapproche}
                        onChange={(e) => void basculer(m.id, e.target.checked)}
                        aria-label={`Pointer ${m.libelle} du ${formatDate(m.date)}`}
                      />
                    </td>
                    <td className="ac-num px-4 py-2 text-[0.8125rem] text-ink-700">{formatDate(m.date)}</td>
                    <td className="px-4 py-2 text-[0.8125rem] text-ink-900">
                      {m.libelle}
                      <span className="ac-num block text-xs text-ink-500">{m.reference}</span>
                    </td>
                    <td className={`ac-num px-4 py-2 text-right text-[0.8125rem] font-medium ${m.sens === 'entree' ? 'text-success-600' : 'text-danger-600'}`}>
                      {m.sens === 'entree' ? '+' : '−'}
                      {formatMoney(m.montant)}
                    </td>
                    <td className="px-4 py-2"><StatusBadge status={m.rapproche ? 'rapproche' : 'non_rapproche'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  )
}

/* ---------------------------- Prévisionnel ---------------------------- */

export function Previsionnel() {
  const { toast } = useToast()
  const { comptes, mouvements, previsions, categories, horizon, setHorizon, chargement, creerPrevision, supprimerPrevision } =
    useTresorerie()

  const [ouvert, setOuvert] = useState(false)
  const [aSupprimer, setASupprimer] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [saisie, setSaisie] = useState({
    libelle: '', tiers: '', montant: '', sens: 'entree' as SensMouvement,
    dateAttendue: new Date().toISOString().slice(0, 10), fiabilite: 'probable' as Fiabilite, origine: '',
  })

  const enchainement = calculerEnchainement(comptes, mouvements, previsions, horizon)
  const projection = serieProjection(comptes, mouvements, previsions, horizon)
  const dans = previsionsDansHorizon(previsions, horizon).sort((a, b) => (a.dateAttendue < b.dateAttendue ? -1 : 1))

  const enregistrer = () => {
    const m = Number(saisie.montant)
    if (!saisie.libelle.trim() || !m || m <= 0) {
      toast({ titre: 'Saisie incomplète', detail: 'Le libellé et un montant supérieur à zéro sont requis.', tone: 'warning' })
      return
    }
    setEnCours(true)
    void (async () => {
      try {
        await creerPrevision({
          libelle: saisie.libelle.trim(),
          tiers: saisie.tiers.trim(),
          montant: m,
          sens: saisie.sens,
          dateAttendue: new Date(saisie.dateAttendue).toISOString(),
          categorieId: null,
          fiabilite: saisie.fiabilite,
          origine: saisie.origine.trim() || 'Saisie manuelle',
        })
        toast({ titre: 'Prévision ajoutée', detail: `${saisie.libelle} — ${formatMoney(m)}.`, tone: 'success' })
        setOuvert(false)
        setSaisie((s) => ({ ...s, libelle: '', tiers: '', montant: '', origine: '' }))
      } catch (e) {
        toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Trésorerie"
          title="Prévisionnel"
          description="Les encaissements et décaissements attendus. Chaque ligne porte sa fiabilité : une entrée probable ne vaut pas une entrée confirmée."
          meta={<Badge variant="brand">{previsions.length} prévisions</Badge>}
          actions={
            <>
              <div role="group" aria-label="Horizon" className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5">
                {([30, 60, 90] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    aria-pressed={horizon === h}
                    onClick={() => setHorizon(h)}
                    className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors ${horizon === h ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'}`}
                  >
                    {h} j
                  </button>
                ))}
              </div>
              <TresoOutils />
              <Button variant="primary" onClick={() => setOuvert(true)} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Ajouter une prévision
              </Button>
            </>
          }
        />
      }
    >
      <TresoNav />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Solde actuel', formatMoney(enchainement.soldeActuel)],
          ['Entrées prévues', `+${formatMoney(enchainement.entreesPrevues)}`],
          ['Sorties prévues', `−${formatMoney(enchainement.sortiesPrevues)}`],
          [`Solde à ${horizon} j`, formatMoney(enchainement.soldePrevisionnel)],
        ].map(([k, v], i) => (
          <Card key={k} className={`p-4 ${i === 3 ? 'border-brand-200 bg-brand-50' : ''}`}>
            <p className={`text-[0.8125rem] ${i === 3 ? 'text-brand-700' : 'text-ink-500'}`}>{k}</p>
            <p className={`ac-num mt-1.5 font-display text-xl font-semibold ${i === 3 ? 'text-brand-800' : 'text-ink-900'}`}>{v}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Projection" description={`Solde semaine par semaine sur ${horizon} jours.`} />
        <CardBody>
          <LineChart points={projection} titre={`Projection de trésorerie à ${horizon} jours`} unite=" €" />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Échéances attendues" description={`${dans.length} ligne(s) dans l'horizon retenu.`} />
        {chargement ? (
          <SkeletonTable rows={5} />
        ) : dans.length === 0 ? (
          <EmptyState
            icon={<BarChart3 />}
            title="Aucune prévision sur cet horizon"
            description="Ajoutez les échéances connues — subventions notifiées, salaires, loyers — pour rendre la projection utile."
            compact
            action={<Button variant="primary" onClick={() => setOuvert(true)}>Ajouter une prévision</Button>}
          />
        ) : (
          <div className="ac-scroll overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Prévisions de trésorerie</caption>
              <thead>
                <tr className="border-b border-ink-100 bg-ink-25">
                  {['Date attendue', 'Libellé', 'Origine', 'Fiabilité', 'Montant', ''].map((h, i) => (
                    <th key={h || i} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i === 4 ? 'text-right' : ''}`}>
                      {h || <span className="sr-only">Action</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {dans.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-ink-25">
                    <td className="ac-num px-4 py-2.5 text-[0.8125rem] text-ink-700">{formatDate(p.dateAttendue)}</td>
                    <td className="px-4 py-2.5 text-[0.8125rem] text-ink-900">
                      {p.libelle}
                      <span className="block text-xs text-ink-500">{p.tiers}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[0.8125rem] text-ink-500">{p.origine}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={p.fiabilite === 'confirmee' ? 'prevision_confirmee' : 'prevision_probable'} />
                    </td>
                    <td className={`ac-num px-4 py-2.5 text-right text-[0.8125rem] font-medium ${p.sens === 'entree' ? 'text-success-600' : 'text-danger-600'}`}>
                      {p.sens === 'entree' ? '+' : '−'}
                      {formatMoney(p.montant)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Button variant="icon" size="sm" label={`Supprimer ${p.libelle}`} className="text-ink-500 hover:text-danger-600" onClick={() => setASupprimer(p.id)}>
                        <Trash2 aria-hidden className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={ouvert}
        onClose={() => setOuvert(false)}
        size="lg"
        title="Ajouter une prévision"
        description="Une prévision n'est pas un mouvement : elle n'affecte que la projection, jamais le solde réel."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button variant="primary" loading={enCours} onClick={enregistrer}>Ajouter</Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Libellé" required className="sm:col-span-2">
            {(p) => <Input {...p} value={saisie.libelle} onChange={(e) => setSaisie((s) => ({ ...s, libelle: e.target.value }))} placeholder="Subvention régionale" />}
          </Field>
          <Field label="Tiers">
            {(p) => <Input {...p} value={saisie.tiers} onChange={(e) => setSaisie((s) => ({ ...s, tiers: e.target.value }))} placeholder="Région Pays de la Loire" />}
          </Field>
          <Field label="Date attendue" required>
            {(p) => <Input {...p} type="date" value={saisie.dateAttendue} onChange={(e) => setSaisie((s) => ({ ...s, dateAttendue: e.target.value }))} />}
          </Field>
          <Field label="Sens" required>
            {(p) => (
              <Select
                {...p}
                value={saisie.sens}
                onChange={(e) => setSaisie((s) => ({ ...s, sens: e.target.value as SensMouvement }))}
                options={[
                  { value: 'entree', label: 'Entrée attendue' },
                  { value: 'sortie', label: 'Sortie attendue' },
                ]}
              />
            )}
          </Field>
          <Field label="Montant" required>
            {(p) => <Input {...p} type="number" min={0} step="0.01" suffix="€" value={saisie.montant} onChange={(e) => setSaisie((s) => ({ ...s, montant: e.target.value }))} />}
          </Field>
          <Field label="Fiabilité" required hint="Seules les entrées confirmées entrent dans la lecture prudente.">
            {(p) => (
              <Select
                {...p}
                value={saisie.fiabilite}
                onChange={(e) => setSaisie((s) => ({ ...s, fiabilite: e.target.value as Fiabilite }))}
                options={[
                  { value: 'confirmee', label: 'Confirmée — document à l’appui' },
                  { value: 'probable', label: 'Probable — sans engagement écrit' },
                ]}
              />
            )}
          </Field>
          <Field label="Origine" hint="D’où vient l’information.">
            {(p) => <Input {...p} value={saisie.origine} onChange={(e) => setSaisie((s) => ({ ...s, origine: e.target.value }))} placeholder="Convention signée" />}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!aSupprimer}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const id = aSupprimer!
          setASupprimer(null)
          void (async () => {
            try {
              await supprimerPrevision(id)
              toast({ titre: 'Prévision supprimée', detail: 'La projection a été recalculée.', tone: 'success' })
            } catch (e) {
              toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
            }
          })()
        }}
        title="Supprimer cette prévision ?"
        description="La projection sera recalculée sans cette ligne. Aucun mouvement réel n'est affecté."
        confirmLabel="Supprimer"
      />
    </Page>
  )
}

/* ------------------------------ Virements ------------------------------ */

export function Virements() {
  const { toast } = useToast()
  const { comptes, virements, mouvements, creerVirement, executerVirement, annulerVirement } = useTresorerie()

  const [ouvert, setOuvert] = useState(false)
  const [aAnnuler, setAAnnuler] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [saisie, setSaisie] = useState({
    compteSourceId: comptes[0]?.id ?? '',
    compteDestinationId: comptes[1]?.id ?? '',
    montant: '',
    date: new Date().toISOString().slice(0, 10),
    motif: '',
    executer: true,
  })

  const nom = (id: string) => comptes.find((c) => c.id === id)?.nom ?? '—'
  const source = comptes.find((c) => c.id === saisie.compteSourceId)
  const soldeSource = source ? soldeCompte(source, mouvements) : 0
  const montantSaisi = Number(saisie.montant) || 0
  const insuffisant = saisie.executer && montantSaisi > soldeSource + (source?.decouvertAutorise ?? 0)

  const enregistrer = () => {
    if (!saisie.motif.trim() || montantSaisi <= 0) {
      toast({ titre: 'Saisie incomplète', detail: 'Le motif et un montant supérieur à zéro sont requis.', tone: 'warning' })
      return
    }
    setEnCours(true)
    void (async () => {
      try {
        await creerVirement(
          {
            compteSourceId: saisie.compteSourceId,
            compteDestinationId: saisie.compteDestinationId,
            montant: montantSaisi,
            date: new Date(saisie.date).toISOString(),
            motif: saisie.motif.trim(),
          },
          saisie.executer,
        )
        toast({
          titre: saisie.executer ? 'Virement exécuté' : 'Virement planifié',
          detail: `${formatMoney(montantSaisi)} de ${nom(saisie.compteSourceId)} vers ${nom(saisie.compteDestinationId)}.`,
          tone: 'success',
        })
        setOuvert(false)
        setSaisie((s) => ({ ...s, montant: '', motif: '' }))
      } catch (e) {
        toast({ titre: 'Virement impossible', detail: (e as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Trésorerie"
          title="Virements internes"
          description="Les mouvements entre comptes de l'association. Un virement exécuté crée deux mouvements symétriques, jamais un seul."
          meta={<Badge variant="brand">{virements.length} virements</Badge>}
          actions={
            <>
              <TresoOutils />
              <Button variant="primary" onClick={() => setOuvert(true)} iconLeft={<ArrowLeftRight aria-hidden className="h-4 w-4" />}>
                Nouveau virement
              </Button>
            </>
          }
        />
      }
    >
      <TresoNav />

      {virements.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ArrowLeftRight />}
            title="Aucun virement"
            description="Les virements permettent de renflouer un compte courant depuis le livret, ou de verser les espèces de la caisse."
            action={<Button variant="primary" onClick={() => setOuvert(true)}>Créer un virement</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Historique des virements" description="Du plus récent au plus ancien." />
          <ul className="divide-y divide-ink-100">
            {[...virements].sort((a, b) => (a.date < b.date ? 1 : -1)).map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{nom(v.compteSourceId)}</span>
                  </span>
                  <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ink-500" />
                  <span className="min-w-0">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{nom(v.compteDestinationId)}</span>
                  </span>
                </div>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-ink-500">{v.motif}</span>
                  <span className="ac-num block truncate text-xs text-ink-500">
                    {formatDate(v.date)} · {v.creePar}
                  </span>
                </span>
                <span className="ac-num shrink-0 text-[0.8125rem] font-semibold text-ink-900">{formatMoney(v.montant)}</span>
                <StatusBadge
                  status={v.statut === 'execute' ? 'virement_execute' : v.statut === 'planifie' ? 'virement_planifie' : 'virement_annule'}
                />
                {v.statut === 'planifie' && (
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      onClick={() =>
                        void (async () => {
                          try {
                            await executerVirement(v.id)
                            toast({ titre: 'Virement exécuté', detail: `${formatMoney(v.montant)} transférés.`, tone: 'success' })
                          } catch (e) {
                            toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
                          }
                        })()
                      }
                    >
                      Exécuter
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAAnnuler(v.id)}>
                      Annuler
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={ouvert}
        onClose={() => setOuvert(false)}
        size="lg"
        title="Nouveau virement interne"
        description="Le montant sort d'un compte et entre sur l'autre : les deux mouvements sont créés ensemble."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button variant="primary" loading={enCours} onClick={enregistrer}>
              {saisie.executer ? 'Exécuter le virement' : 'Planifier'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          {insuffisant && (
            <div className="sm:col-span-2">
              <Alert tone="warning" titre="Solde insuffisant">
                Le compte de départ affiche {formatMoney(soldeSource)}. Le virement le ferait passer sous le découvert
                autorisé.
              </Alert>
            </div>
          )}
          <Field label="Compte de départ" required hint={source ? `Solde actuel : ${formatMoney(soldeSource)}` : undefined}>
            {(p) => (
              <Select {...p} value={saisie.compteSourceId} onChange={(e) => setSaisie((s) => ({ ...s, compteSourceId: e.target.value }))} options={comptes.map((c) => ({ value: c.id, label: c.nom }))} />
            )}
          </Field>
          <Field label="Compte d’arrivée" required>
            {(p) => (
              <Select {...p} value={saisie.compteDestinationId} onChange={(e) => setSaisie((s) => ({ ...s, compteDestinationId: e.target.value }))} options={comptes.map((c) => ({ value: c.id, label: c.nom }))} />
            )}
          </Field>
          <Field label="Montant" required>
            {(p) => <Input {...p} type="number" min={0} step="0.01" suffix="€" value={saisie.montant} onChange={(e) => setSaisie((s) => ({ ...s, montant: e.target.value }))} />}
          </Field>
          <Field label="Date" required>
            {(p) => <Input {...p} type="date" value={saisie.date} onChange={(e) => setSaisie((s) => ({ ...s, date: e.target.value }))} />}
          </Field>
          <Field label="Motif" required className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={2} value={saisie.motif} onChange={(e) => setSaisie((s) => ({ ...s, motif: e.target.value }))} placeholder="Renflouement avant le versement des salaires" />}
          </Field>
          <div className="sm:col-span-2">
            <Checkbox
              checked={saisie.executer}
              onChange={(e) => setSaisie((s) => ({ ...s, executer: e.target.checked }))}
              label="Exécuter immédiatement"
              description="Sinon le virement reste planifié et n’affecte pas encore les soldes."
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!aAnnuler}
        onClose={() => setAAnnuler(null)}
        onConfirm={() => {
          const id = aAnnuler!
          setAAnnuler(null)
          void (async () => {
            try {
              await annulerVirement(id)
              toast({ titre: 'Virement annulé', detail: 'Aucun mouvement n’a été créé.', tone: 'neutral' })
            } catch (e) {
              toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
            }
          })()
        }}
        title="Annuler ce virement planifié ?"
        description="Le virement ne sera pas exécuté et aucun mouvement ne sera créé. Un virement déjà exécuté ne peut pas être annulé : il faut passer un virement inverse."
        confirmLabel="Annuler le virement"
      />
    </Page>
  )
}

/* --------------------------- Catégorisation --------------------------- */

export function Categorisation() {
  const { toast } = useToast()
  const { mouvements, categories, chargement, categoriser, categoriserLot, creerCategorie } = useTresorerie()
  const [ouvert, setOuvert] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [nouvelle, setNouvelle] = useState({ nom: '', sens: 'sortie' as SensMouvement, compteComptable: '', motsCles: '' })

  const aTraiter = mouvements.filter((m) => !m.categorieId && !m.virementId)
  const suggestions = aTraiter
    .map((m) => ({ mouvement: m, suggestion: suggererCategorie(m, categories) }))
    .filter((s) => s.suggestion)

  const appliquerToutes = () => {
    setEnCours(true)
    void (async () => {
      try {
        const parCategorie = new Map<string, string[]>()
        for (const s of suggestions) {
          const liste = parCategorie.get(s.suggestion!.id) ?? []
          liste.push(s.mouvement.id)
          parCategorie.set(s.suggestion!.id, liste)
        }
        for (const [catId, ids] of parCategorie) await categoriserLot(ids, catId)
        toast({ titre: 'Suggestions appliquées', detail: `${suggestions.length} mouvement(s) catégorisés.`, tone: 'success' })
      } catch (e) {
        toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Trésorerie"
          title="Catégorisation"
          description="Chaque mouvement doit porter une catégorie : elle détermine l'imputation comptable et alimente les rapports. Les suggestions s'appuient sur les mots-clés du libellé."
          meta={<Badge variant="brand">{aTraiter.length} à traiter</Badge>}
          actions={
            <>
              <TresoOutils />
              {suggestions.length > 0 && (
                <Button loading={enCours} onClick={appliquerToutes} iconLeft={<Wand2 aria-hidden className="h-4 w-4" />}>
                  Appliquer les {suggestions.length} suggestions
                </Button>
              )}
              <Button variant="primary" onClick={() => setOuvert(true)} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouvelle catégorie
              </Button>
            </>
          }
        />
      }
    >
      <TresoNav />

      <Card>
        <CardHeader title="Mouvements à catégoriser" description="La suggestion est proposée, jamais appliquée sans votre accord." />
        {chargement ? (
          <SkeletonTable rows={5} />
        ) : aTraiter.length === 0 ? (
          <EmptyState
            icon={<Tag />}
            title="Tout est catégorisé"
            description="Aucun mouvement en attente. Les rapports sont à jour."
            compact
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {aTraiter.slice(0, 25).map((m) => {
              const suggestion = suggererCategorie(m, categories)
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8125rem] font-medium text-ink-900">{m.libelle}</p>
                    <p className="ac-num truncate text-xs text-ink-500">
                      {m.tiers} · {formatDate(m.date)} · {m.reference}
                    </p>
                  </div>
                  <span className={`ac-num shrink-0 text-[0.8125rem] font-semibold ${m.sens === 'entree' ? 'text-success-600' : 'text-danger-600'}`}>
                    {m.sens === 'entree' ? '+' : '−'}
                    {formatMoney(m.montant)}
                  </span>
                  {suggestion && <Badge variant="outline">Suggéré : {suggestion.nom}</Badge>}
                  <Select
                    aria-label={`Catégorie pour ${m.libelle}`}
                    value=""
                    className="h-8 w-56 text-[0.8125rem]"
                    placeholder={suggestion ? `Appliquer « ${suggestion.nom} »` : 'Choisir une catégorie'}
                    onChange={(e) =>
                      e.target.value &&
                      void (async () => {
                        try {
                          await categoriser(m.id, e.target.value)
                          toast({ titre: 'Mouvement catégorisé', detail: m.libelle, tone: 'success' })
                        } catch (err) {
                          toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
                        }
                      })()
                    }
                    options={categories.filter((c) => c.sens === m.sens).map((c) => ({ value: c.id, label: c.nom }))}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Catégories" description="Chaque catégorie porte son compte comptable et ses mots-clés de reconnaissance." />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          {categories.map((c) => (
            <div key={c.id} className="rounded-lg border border-ink-200 p-3">
              <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-900">
                <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.couleur }} />
                {c.nom}
                <Badge variant="outline">{c.sens === 'entree' ? 'Entrée' : 'Sortie'}</Badge>
              </p>
              <p className="ac-num mt-1 text-xs text-ink-500">Compte {c.compteComptable}</p>
              <p className="mt-1 text-xs text-ink-500">
                Mots-clés : {c.motsCles.join(', ') || 'aucun'} ·{' '}
                {mouvements.filter((m) => m.categorieId === c.id).length} mouvement(s)
              </p>
            </div>
          ))}
        </CardBody>
      </Card>

      <Modal
        open={ouvert}
        onClose={() => setOuvert(false)}
        title="Nouvelle catégorie"
        description="Les mots-clés servent à proposer automatiquement cette catégorie."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              onClick={() => {
                if (!nouvelle.nom.trim()) {
                  toast({ titre: 'Nom manquant', detail: 'Indiquez le nom de la catégorie.', tone: 'warning' })
                  return
                }
                setEnCours(true)
                void (async () => {
                  try {
                    await creerCategorie({
                      nom: nouvelle.nom.trim(),
                      sens: nouvelle.sens,
                      compteComptable: nouvelle.compteComptable.trim() || '658000',
                      motsCles: nouvelle.motsCles.split(',').map((m) => m.trim().toLowerCase()).filter(Boolean),
                      couleur: '#2364AA',
                    })
                    toast({ titre: 'Catégorie créée', detail: nouvelle.nom, tone: 'success' })
                    setOuvert(false)
                    setNouvelle({ nom: '', sens: 'sortie', compteComptable: '', motsCles: '' })
                  } catch (e) {
                    toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
                  } finally {
                    setEnCours(false)
                  }
                })()
              }}
            >
              Créer
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Nom" required className="sm:col-span-2">
            {(p) => <Input {...p} value={nouvelle.nom} onChange={(e) => setNouvelle((s) => ({ ...s, nom: e.target.value }))} placeholder="Frais de mission" />}
          </Field>
          <Field label="Sens" required>
            {(p) => (
              <Select
                {...p}
                value={nouvelle.sens}
                onChange={(e) => setNouvelle((s) => ({ ...s, sens: e.target.value as SensMouvement }))}
                options={[
                  { value: 'entree', label: 'Entrée' },
                  { value: 'sortie', label: 'Sortie' },
                ]}
              />
            )}
          </Field>
          <Field label="Compte comptable">
            {(p) => <Input {...p} value={nouvelle.compteComptable} onChange={(e) => setNouvelle((s) => ({ ...s, compteComptable: e.target.value }))} placeholder="625100" />}
          </Field>
          <Field label="Mots-clés" className="sm:col-span-2" hint="Séparés par des virgules, sans accent.">
            {(p) => <Input {...p} value={nouvelle.motsCles} onChange={(e) => setNouvelle((s) => ({ ...s, motsCles: e.target.value }))} placeholder="mission, deplacement" />}
          </Field>
        </div>
      </Modal>
    </Page>
  )
}

/* -------------------------------- Rapport -------------------------------- */

export function RapportTreso() {
  const { comptes, mouvements, categories, previsions, horizon } = useTresorerie()

  const entrees = repartitionCategories(mouvements, categories, 'entree')
  const sorties = repartitionCategories(mouvements, categories, 'sortie')
  const historique = serieSolde(comptes, mouvements)
  const enchainement = calculerEnchainement(comptes, mouvements, previsions, horizon)

  const totalEntrees = entrees.reduce((s, e) => s + e.valeur, 0)
  const totalSorties = sorties.reduce((s, e) => s + e.valeur, 0)

  const parCompte = comptes.map((c) => ({
    label: c.nom,
    entrees: Math.round(mouvements.filter((m) => m.compteId === c.id && m.sens === 'entree').reduce((s, m) => s + m.montant, 0)),
    sorties: Math.round(mouvements.filter((m) => m.compteId === c.id && m.sens === 'sortie').reduce((s, m) => s + m.montant, 0)),
  }))

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Trésorerie"
          title="Rapport de trésorerie"
          description="Synthèse sur douze mois : flux par catégorie, par compte, et solde constaté."
          actions={<TresoOutils />}
        />
      }
    >
      <TresoNav />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Total des entrées', formatMoney(totalEntrees)],
          ['Total des sorties', formatMoney(totalSorties)],
          ['Flux net', formatMoney(arrondi(totalEntrees - totalSorties))],
          ['Solde actuel', formatMoney(enchainement.soldeActuel)],
        ].map(([k, v]) => (
          <Card key={k} className="p-4">
            <p className="text-[0.8125rem] text-ink-500">{k}</p>
            <p className="ac-num mt-1.5 font-display text-xl font-semibold text-ink-900">{v}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader title="Évolution du solde" description="Fin de mois, sur douze mois." />
        <CardBody>
          <LineChart points={historique} titre="Évolution du solde de trésorerie sur douze mois" unite=" €" />
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Entrées par catégorie" description="Douze derniers mois, hors virements internes." />
          <CardBody>
            <HorizontalBars titre="Entrées par catégorie" data={entrees} total={totalEntrees} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Sorties par catégorie" description="Douze derniers mois, hors virements internes." />
          <CardBody>
            <HorizontalBars titre="Sorties par catégorie" data={sorties} total={totalSorties} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Flux par compte" description="Entrées et sorties cumulées, par compte." />
        <CardBody>
          <GroupedBars
            titre="Entrées et sorties par compte"
            colonneLabel="Compte"
            formatValeur={(v) => formatMoney(v)}
            data={parCompte.map((c) => ({ label: c.label.split(' ')[0], entrees: c.entrees, sorties: c.sorties }))}
            series={[
              { key: 'entrees', label: 'Entrées', couleur: '#2364AA' },
              { key: 'sorties', label: 'Sorties', couleur: '#8DB5DE', motif: true },
            ]}
          />
        </CardBody>
      </Card>
    </Page>
  )
}
