import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormulaireEtapes, type EtapeFormulaire } from '@/components/ui/FormulaireEtapes'
import { useFacturation } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'
import { formatMoney } from '@/lib/utils'

const TAUX_TVA = [0, 5.5, 10, 20]
const UNITES = ['forfait', 'heure', 'jour', 'séance', 'personne', 'exemplaire']

const vide = { reference: '', nom: '', description: '', categorie: '', prixHT: '', tva: '20', unite: 'forfait', actif: true }

export function PrestationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { produits, creerProduit, modifierProduit } = useFacturation()

  const source = id ? produits.find((p) => p.id === id) : undefined
  const modification = !!id

  const [v, setV] = useState(
    source
      ? {
          reference: source.reference,
          nom: source.nom,
          description: source.description,
          categorie: source.categorie,
          prixHT: String(source.prixHT),
          tva: String(source.tva),
          unite: source.unite,
          actif: source.actif,
        }
      : vide,
  )
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const set = (patch: Partial<typeof vide>) => setV((s) => ({ ...s, ...patch }))
  const categories = Array.from(new Set(produits.map((p) => p.categorie).filter(Boolean)))

  const prix = Number(v.prixHT) || 0
  const tva = Number(v.tva) || 0
  const ttc = prix * (1 + tva / 100)

  if (modification && !source) {
    return (
      <Page header={<PageHeader title="Prestation introuvable" />}>
        <Card>
          <EmptyState
            icon={<Package />}
            title="Cette prestation n'existe plus"
            description="Elle a peut-être été retirée du catalogue."
            action={<Button variant="primary" onClick={() => navigate('/facturation/referentiels')}>Retour aux référentiels</Button>}
          />
        </Card>
      </Page>
    )
  }

  const etapes: EtapeFormulaire[] = [
    {
      titre: 'Identité',
      description: 'Comment la prestation apparaîtra dans le catalogue et sur les factures.',
      valider: () => {
        const e: Record<string, string> = {}
        if (!v.nom.trim()) e.nom = 'Le nom est obligatoire.'
        if (!v.reference.trim()) e.reference = 'La référence est obligatoire.'
        else if (produits.some((p) => p.id !== id && p.reference.toLowerCase() === v.reference.trim().toLowerCase())) {
          e.reference = 'Cette référence est déjà utilisée par une autre prestation.'
        }
        return e
      },
      contenu: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Référence" required error={erreurs.reference} hint="Identifiant court, unique au catalogue.">
            {(p) => <Input {...p} value={v.reference} onChange={(e) => set({ reference: e.target.value })} placeholder="ANIM-001" />}
          </Field>
          <Field label="Catégorie" hint="Sert au regroupement dans le catalogue.">
            {(p) => (
              <Input {...p} list="categories-prestation" value={v.categorie} onChange={(e) => set({ categorie: e.target.value })} placeholder="Animation" />
            )}
          </Field>
          <datalist id="categories-prestation">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Field label="Nom" required error={erreurs.nom} className="sm:col-span-2">
            {(p) => <Input {...p} value={v.nom} onChange={(e) => set({ nom: e.target.value })} placeholder="Animation d’atelier créatif" />}
          </Field>
          <Field label="Description" className="sm:col-span-2" hint="Reprise sur la ligne de facture.">
            {(p) => <Textarea {...p} rows={3} value={v.description} onChange={(e) => set({ description: e.target.value })} />}
          </Field>
        </div>
      ),
    },
    {
      titre: 'Tarification',
      description: 'Le prix appliqué par défaut, avant coefficient de grille tarifaire.',
      valider: () => {
        const e: Record<string, string> = {}
        if (!v.prixHT.trim()) e.prixHT = 'Indiquez un prix, même nul.'
        else if (!Number.isFinite(Number(v.prixHT)) || Number(v.prixHT) < 0) e.prixHT = 'Le prix doit être un nombre positif.'
        return e
      },
      contenu: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prix unitaire HT" required error={erreurs.prixHT}>
            {(p) => <Input {...p} type="number" min={0} step="0.01" suffix="€" value={v.prixHT} onChange={(e) => set({ prixHT: e.target.value })} />}
          </Field>
          <Field label="Taux de TVA" required>
            {(p) => (
              <Select {...p} value={v.tva} onChange={(e) => set({ tva: e.target.value })} options={TAUX_TVA.map((t) => ({ value: String(t), label: `${String(t).replace('.', ',')} %` }))} />
            )}
          </Field>
          <Field label="Unité" required hint="Ce qui est facturé une fois.">
            {(p) => <Select {...p} value={v.unite} onChange={(e) => set({ unite: e.target.value })} options={UNITES.map((u) => ({ value: u, label: u }))} />}
          </Field>
          <div className="flex items-end pb-1">
            <p className="rounded-lg border border-ink-200 bg-ink-25 px-3 py-2 text-[0.8125rem] text-ink-600">
              Soit <span className="ac-num font-semibold text-ink-900">{formatMoney(ttc)}</span> TTC par {v.unite}.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Switch
              label="Prestation active"
              description="Une prestation inactive reste sur les factures passées mais n’est plus proposée à la saisie."
              checked={v.actif}
              onCheckedChange={(x) => set({ actif: x })}
            />
          </div>
        </div>
      ),
    },
  ]

  const terminer = async () => {
    setEnCours(true)
    try {
      const donnees = { ...v, prixHT: Number(v.prixHT) || 0, tva: Number(v.tva) || 0, reference: v.reference.trim(), nom: v.nom.trim() }
      if (modification) {
        await modifierProduit(id!, donnees)
        toast({ titre: 'Prestation modifiée', detail: v.nom, tone: 'success' })
      } else {
        await creerProduit(donnees)
        toast({ titre: 'Prestation créée', detail: v.nom, tone: 'success' })
      }
      navigate('/facturation/referentiels')
    } catch (e) {
      toast({ titre: 'Enregistrement impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Facturation · Référentiels"
          title={modification ? `Modifier ${source!.nom}` : 'Nouvelle prestation'}
          description="Le catalogue alimente la saisie des lignes de facture : une prestation choisie remplit le libellé, le prix et la TVA."
          actions={
            <Button onClick={() => navigate('/facturation/referentiels')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Annuler
            </Button>
          }
        />
      }
    >
      <FormulaireEtapes
        etapes={etapes}
        labelFil="Étapes de création de la prestation"
        onAnnuler={() => navigate('/facturation/referentiels')}
        onTerminer={() => void terminer()}
        libelleTerminer={modification ? 'Enregistrer' : 'Créer la prestation'}
        enCours={enCours}
        onErreurs={setErreurs}
      />
    </Page>
  )
}
