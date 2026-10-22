import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, RefreshCw, Tag, Wallet } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { TresoNav, TresoOutils } from '@/components/tresorerie/TresoNav'
import { useTresorerie } from '@/context/TresorerieContext'
import { useToast } from '@/context/ToastContext'
import { suggererCategorie, type Mouvement, type SensMouvement } from '@/lib/tresorerie'
import { formatDate, formatMoney } from '@/lib/utils'

export function Mouvements() {
  usePageTitle('Mouvements')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { mouvements, comptes, categories, chargement, erreur, recharger, categoriser, categoriserLot } = useTresorerie()

  const [cible, setCible] = useState<Mouvement[] | null>(null)
  const [categorieChoisie, setCategorieChoisie] = useState('')
  const [enCours, setEnCours] = useState(false)

  const nomCompte = (id: string) => comptes.find((c) => c.id === id)?.nom ?? '—'

  const columns: Column<Mouvement>[] = [
    { id: 'date', header: 'Date', sortValue: (r) => r.date, width: '7rem', cell: (r) => <span className="ac-num">{formatDate(r.date)}</span> },
    {
      id: 'libelle',
      header: 'Libellé',
      sortValue: (r) => r.libelle,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.libelle}</p>
          <p className="ac-num truncate text-xs text-ink-500">{r.tiers} · {r.reference}</p>
        </div>
      ),
    },
    { id: 'compte', header: 'Compte', sortValue: (r) => nomCompte(r.compteId), cell: (r) => nomCompte(r.compteId) },
    {
      id: 'categorie',
      header: 'Catégorie',
      optional: true,
      cell: (r) =>
        r.virementId ? (
          <Badge variant="outline">Virement interne</Badge>
        ) : r.categorieId ? (
          <Badge>{categories.find((c) => c.id === r.categorieId)?.nom}</Badge>
        ) : (
          <StatusBadge status="non_categorise" />
        ),
    },
    {
      id: 'montant',
      header: 'Montant',
      align: 'right',
      sortValue: (r) => (r.sens === 'entree' ? r.montant : -r.montant),
      cell: (r) => (
        <span className={`ac-num font-medium ${r.sens === 'entree' ? 'text-success-600' : 'text-danger-600'}`}>
          {r.sens === 'entree' ? '+' : '−'}
          {formatMoney(r.montant)}
        </span>
      ),
    },
    {
      id: 'pointage',
      header: 'Pointage',
      align: 'right',
      optional: true,
      sortValue: (r) => (r.rapproche ? 'a' : 'b'),
      cell: (r) => <StatusBadge status={r.rapproche ? 'rapproche' : 'non_rapproche'} />,
    },
  ]

  const filters: FilterDef<Mouvement>[] = [
    { id: 'compte', label: 'Compte', options: comptes.map((c) => ({ value: c.id, label: c.nom })), match: (r, v) => r.compteId === v },
    {
      id: 'sens',
      label: 'Sens',
      options: [
        { value: 'entree', label: 'Entrées' },
        { value: 'sortie', label: 'Sorties' },
      ],
      match: (r, v) => r.sens === v,
    },
    {
      id: 'categorie',
      label: 'Catégorie',
      options: [{ value: 'aucune', label: 'Non catégorisé' }, ...categories.map((c) => ({ value: c.id, label: c.nom }))],
      match: (r, v) => (v === 'aucune' ? !r.categorieId : r.categorieId === v),
    },
  ]

  const enTete = (
    <PageHeader
      eyebrow="Trésorerie"
      title="Mouvements"
      description="Toutes les opérations enregistrées sur les comptes, du plus récent au plus ancien."
      meta={<Badge variant="brand">{mouvements.length} mouvements</Badge>}
      actions={
        <>
          <TresoOutils />
          <Button variant="primary" onClick={() => navigate('/tresorerie/mouvements/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouvelle transaction
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <TresoNav />
        <Alert tone="danger" titre="Les mouvements n'ont pas pu être chargés" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && mouvements.length === 0) {
    return (
      <Page header={enTete}>
        <TresoNav />
        <Card>
          <EmptyState
            icon={<Wallet />}
            title="Aucun mouvement"
            description="Enregistrez une première transaction, ou vérifiez que la synchronisation bancaire est active."
            action={<Button variant="primary" onClick={() => navigate('/tresorerie/mouvements/nouveau')}>Saisir une transaction</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <TresoNav />

      <DataGrid
        rows={mouvements}
        columns={columns}
        filters={filters}
        loading={chargement}
        caption="Mouvements de trésorerie"
        searchKeys={(r) => `${r.libelle} ${r.tiers} ${r.reference} ${nomCompte(r.compteId)}`}
        searchPlaceholder="Rechercher un libellé, un tiers, une référence…"
        getRowLabel={(r) => `${r.libelle} du ${formatDate(r.date)}`}
        emptyIcon={<Wallet />}
        emptyTitle="Aucun mouvement ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre."
        rowActions={[
          {
            label: 'Catégoriser',
            icon: <Tag />,
            onSelect: (r) => {
              const suggestion = suggererCategorie(r, categories)
              setCategorieChoisie(r.categorieId ?? suggestion?.id ?? '')
              setCible([r])
            },
          },
          { label: 'Ouvrir le compte', icon: <Wallet />, onSelect: (r) => navigate(`/tresorerie/comptes/${r.compteId}`) },
        ]}
        bulkActions={(selected, clear) => (
          <>
            <Button
              size="sm"
              iconLeft={<Tag aria-hidden className="h-3.5 w-3.5" />}
              onClick={() => {
                setCategorieChoisie('')
                setCible(selected)
                clear()
              }}
            >
              Catégoriser la sélection
            </Button>
            <Button size="sm" variant="ghost" onClick={clear}>
              Vider la sélection
            </Button>
          </>
        )}
      />

      <Modal
        open={!!cible}
        onClose={() => setCible(null)}
        title={cible && cible.length > 1 ? `Catégoriser ${cible.length} mouvements` : 'Catégoriser le mouvement'}
        description="La catégorie détermine l'imputation comptable et alimente les rapports."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCible(null)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!categorieChoisie}
              onClick={() => {
                const cibles = cible ?? []
                setEnCours(true)
                void (async () => {
                  try {
                    if (cibles.length === 1) await categoriser(cibles[0].id, categorieChoisie)
                    else await categoriserLot(cibles.map((c) => c.id), categorieChoisie)
                    toast({ titre: 'Catégorisation enregistrée', detail: `${cibles.length} mouvement(s) mis à jour.`, tone: 'success' })
                    setCible(null)
                  } catch (e) {
                    toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
                  } finally {
                    setEnCours(false)
                  }
                })()
              }}
            >
              Appliquer
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          {cible?.length === 1 && (
            <div className="rounded-lg border border-ink-200 bg-ink-25 p-3 text-[0.8125rem] text-ink-700">
              <p className="font-medium text-ink-900">{cible[0].libelle}</p>
              <p className="ac-num mt-0.5 text-xs text-ink-500">
                {cible[0].tiers} · {formatDate(cible[0].date)} · {formatMoney(cible[0].montant)}
              </p>
            </div>
          )}
          <Field label="Catégorie" required>
            {(p) => (
              <Select
                {...p}
                value={categorieChoisie}
                onChange={(e) => setCategorieChoisie(e.target.value)}
                placeholder="Choisir une catégorie"
                options={categories
                  .filter((c) => !cible || cible.length > 1 || c.sens === cible[0].sens)
                  .map((c) => ({ value: c.id, label: `${c.nom} — ${c.compteComptable}` }))}
              />
            )}
          </Field>
        </div>
      </Modal>
    </Page>
  )
}

/* -------------------------- Nouvelle transaction -------------------------- */

export function NouvelleTransaction() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { comptes, categories, creerMouvement } = useTresorerie()

  const [compteId, setCompteId] = useState(comptes[0]?.id ?? '')
  const [sens, setSens] = useState<SensMouvement>('sortie')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [libelle, setLibelle] = useState('')
  const [tiers, setTiers] = useState('')
  const [montant, setMontant] = useState('')
  const [categorieId, setCategorieId] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const soumettre = async () => {
    const e: Record<string, string> = {}
    if (!compteId) e.compteId = 'Choisissez un compte.'
    if (!libelle.trim()) e.libelle = 'Indiquez le libellé de l’opération.'
    if (!date) e.date = 'Indiquez la date.'
    const m = Number(montant)
    if (!m || m <= 0) e.montant = 'Le montant doit être supérieur à zéro.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    setErreurGlobale(null)
    setEnCours(true)
    try {
      await creerMouvement({
        compteId,
        date: new Date(date).toISOString(),
        libelle: libelle.trim(),
        tiers: tiers.trim(),
        montant: m,
        sens,
        categorieId: categorieId || null,
        reference: reference.trim() || `SAISIE-${Math.floor(Math.random() * 9000 + 1000)}`,
        rapproche: false,
        virementId: null,
        note,
      })
      toast({ titre: 'Transaction enregistrée', detail: `${libelle} — ${formatMoney(m)}.`, tone: 'success' })
      navigate('/tresorerie/mouvements')
    } catch (err) {
      setErreurGlobale((err as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Trésorerie"
          title="Nouvelle transaction"
          description="Saisie manuelle d'une opération. Les mouvements issus de la banque sont normalement importés automatiquement."
          actions={
            <Button onClick={() => navigate('/tresorerie/mouvements')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Annuler
            </Button>
          }
        />
      }
    >
      <TresoNav />

      {erreurGlobale && (
        <Alert tone="danger" titre="Enregistrement impossible">
          {erreurGlobale} Vos saisies sont conservées.
        </Alert>
      )}

      <Card>
        <CardHeader title="Opération" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Compte" required error={erreurs.compteId}>
            {(p) => (
              <Select
                {...p}
                value={compteId}
                onChange={(e) => setCompteId(e.target.value)}
                options={comptes.filter((c) => c.actif).map((c) => ({ value: c.id, label: c.nom }))}
              />
            )}
          </Field>
          <Field label="Sens" required>
            {(p) => (
              <Select
                {...p}
                value={sens}
                onChange={(e) => {
                  setSens(e.target.value as SensMouvement)
                  setCategorieId('')
                }}
                options={[
                  { value: 'entree', label: 'Entrée — encaissement' },
                  { value: 'sortie', label: 'Sortie — décaissement' },
                ]}
              />
            )}
          </Field>
          <Field label="Libellé" required error={erreurs.libelle} className="sm:col-span-2">
            {(p) => <Input {...p} value={libelle} onChange={(e) => setLibelle(e.target.value)} placeholder="Achat de fournitures" />}
          </Field>
          <Field label="Tiers">
            {(p) => <Input {...p} value={tiers} onChange={(e) => setTiers(e.target.value)} placeholder="Papeterie Océane" />}
          </Field>
          <Field label="Date" required error={erreurs.date}>
            {(p) => <Input {...p} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
          </Field>
          <Field label="Montant" required error={erreurs.montant}>
            {(p) => <Input {...p} type="number" min={0} step="0.01" suffix="€" value={montant} onChange={(e) => setMontant(e.target.value)} />}
          </Field>
          <Field label="Catégorie" hint="Peut être renseignée plus tard depuis l’écran de catégorisation.">
            {(p) => (
              <Select
                {...p}
                value={categorieId}
                onChange={(e) => setCategorieId(e.target.value)}
                placeholder="Non catégorisé"
                options={categories.filter((c) => c.sens === sens).map((c) => ({ value: c.id, label: c.nom }))}
              />
            )}
          </Field>
          <Field label="Référence" className="sm:col-span-2" hint="Numéro de chèque, référence de virement. Générée si vide.">
            {(p) => <Input {...p} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="CB-4417" />}
          </Field>
          <Field label="Note interne" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}
          </Field>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours ? 'Enregistrement en cours…' : 'Le mouvement sera enregistré comme non pointé.'}
        </p>
        <Button variant="ghost" onClick={() => navigate('/tresorerie/mouvements')} disabled={enCours}>Annuler</Button>
        <Button variant="primary" loading={enCours} onClick={() => void soumettre()}>
          Enregistrer la transaction
        </Button>
      </div>
    </Page>
  )
}
