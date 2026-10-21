import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { FileWarning } from 'lucide-react'
import { FileQuestion } from 'lucide-react'
import { PageFormulaire } from '@/components/forms/PageFormulaire'
import { FactNav } from '@/components/facturation/FactNav'
import { useFacturation } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'
import { typeClientLabels, type Client, type ModeleFacture, type Produit, type TypeClient } from '@/lib/facturation'

const clientVide: Omit<Client, 'id'> = { nom: '', type: 'collectivite', contact: '', email: '', telephone: '',
  adresse: '', codePostal: '', ville: '', siret: '', delaiPaiement: 30, grilleTarifaire: 'gt-1', notes: '',
}

const produitVide: Omit<Produit, 'id'> = {
  reference: '', nom: '', description: '', categorie: 'Prestation', prixHT: 0, tva: 20, unite: 'unité', actif: true,
}

const modeleVide: Omit<ModeleFacture, 'id'> = { nom: '', description: '', mentions: '', conditions: '', pied: '', defaut: false, actif: true,
}

function Introuvable({ quoi, retour }: { quoi: string; retour: string }) {
  const navigate = useNavigate()
  return (
    <Page header={<PageHeader eyebrow="Facturation" title={`${quoi} introuvable`} />}>
      <FactNav />
      <Card>
        <EmptyState
          icon={<FileQuestion />}
          title={`Ce ${quoi.toLowerCase()} n'existe plus`}
          description="Il a peut-être été supprimé."
          action={<Button variant="primary" onClick={() => navigate(retour)}>Retour à la liste</Button>}
        />
      </Card>
    </Page>
  )
}

/* --------------------------------- Client -------------------------------- */

export function ClientForm() {
  usePageTitle('Référentiel')

  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { clients, grilles, creerClient, modifierClient } = useFacturation()

  const source = id ? clients.find((c) => c.id === id) : undefined
  const [valeurs, setValeurs] = useState<Omit<Client, 'id'>>(source ? { ...source } : clientVide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  if (id && !source) return <Introuvable quoi="Client" retour="/facturation/clients" />

  const set = <K extends keyof Omit<Client, 'id'>>(k: K, v: Omit<Client, 'id'>[K]) => setValeurs((s) => ({ ...s, [k]: v }))

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!valeurs.nom.trim()) e.nom = 'Indiquez la raison sociale.'
    if (!valeurs.email.trim()) e.email = 'Indiquez une adresse e-mail.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeurs.email)) e.email = 'Adresse e-mail invalide.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return
    setEnCours(true)
    void (async () => {
      try {
        if (source) await modifierClient(source.id, valeurs)
        else await creerClient(valeurs)
        toast({ titre: source ? 'Client mis à jour' : 'Client créé', detail: valeurs.nom, tone: 'success' })
        navigate('/facturation/clients')
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  return (
    <PageFormulaire
      eyebrow="Facturation"
      titre={source ? `Modifier ${source.nom}` : 'Nouveau client'}
      description="Ces informations apparaissent sur les factures adressées au client."
      nav={<FactNav />}
      onAnnuler={() => navigate('/facturation/clients')}
      onEnregistrer={enregistrer}
      libelleEnregistrer={source ? 'Enregistrer' : 'Créer le client'}
      enCours={enCours}
      sections={[
        {
          titre: 'Identité du client',
          description: 'Ce qui figure en tête de facture.',
          contenu: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Raison sociale" required error={erreurs.nom} className="sm:col-span-2">
                {(p) => <Input {...p} value={valeurs.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Ville de Nantes" />}
              </Field>
              <Field label="Type">
                {(p) => (
                  <Select
                    {...p}
                    value={valeurs.type}
                    onChange={(e) => set('type', e.target.value as TypeClient)}
                    options={(Object.keys(typeClientLabels) as TypeClient[]).map((t) => ({ value: t, label: typeClientLabels[t] }))}
                  />
                )}
              </Field>
              <Field label="SIRET" hint="Obligatoire pour les structures assujetties.">
                {(p) => <Input {...p} value={valeurs.siret} onChange={(e) => set('siret', e.target.value)} placeholder="214 401 095 00018" />}
              </Field>
            </div>
          ),
        },
        {
          titre: 'Contact et adresse',
          description: 'À qui la facture est adressée, et où.',
          contenu: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact">
                {(p) => <Input {...p} value={valeurs.contact} onChange={(e) => set('contact', e.target.value)} placeholder="Service vie associative" />}
              </Field>
              <Field label="Adresse e-mail" required error={erreurs.email}>
                {(p) => <Input {...p} type="email" value={valeurs.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@exemple.fr" />}
              </Field>
              <Field label="Téléphone">
                {(p) => <Input {...p} type="tel" value={valeurs.telephone} onChange={(e) => set('telephone', e.target.value)} placeholder="02 40 00 00 00" />}
              </Field>
              <Field label="Adresse" className="sm:col-span-2">
                {(p) => <Input {...p} value={valeurs.adresse} onChange={(e) => set('adresse', e.target.value)} placeholder="2 rue de l’Hôtel de Ville" />}
              </Field>
              <Field label="Code postal">
                {(p) => <Input {...p} inputMode="numeric" value={valeurs.codePostal} onChange={(e) => set('codePostal', e.target.value)} placeholder="44000" />}
              </Field>
              <Field label="Ville">
                {(p) => <Input {...p} value={valeurs.ville} onChange={(e) => set('ville', e.target.value)} placeholder="Nantes" />}
              </Field>
            </div>
          ),
        },
        {
          titre: 'Conditions commerciales',
          description: 'Appliquées automatiquement aux nouvelles factures de ce client.',
          contenu: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Délai de paiement" hint="Sert au calcul de l’échéance.">
                {(p) => (
                  <Input {...p} type="number" min={0} suffix="jours" value={String(valeurs.delaiPaiement)} onChange={(e) => set('delaiPaiement', Number(e.target.value) || 0)} />
                )}
              </Field>
              <Field label="Grille tarifaire">
                {(p) => (
                  <Select
                    {...p}
                    value={valeurs.grilleTarifaire}
                    onChange={(e) => set('grilleTarifaire', e.target.value)}
                    options={grilles.map((g) => ({ value: g.id, label: `${g.nom} — coefficient ${g.coefficient}` }))}
                  />
                )}
              </Field>
              <Field label="Note interne" className="sm:col-span-2" hint="Visible de l’équipe seulement, jamais du client.">
                {(p) => <Textarea {...p} rows={3} value={valeurs.notes} onChange={(e) => set('notes', e.target.value)} />}
              </Field>
            </div>
          ),
        },
      ]}
    />
  )
}

/* ------------------------------- Prestation ------------------------------ */

export function PrestationForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { produits, creerProduit, modifierProduit } = useFacturation()

  const source = id ? produits.find((p) => p.id === id) : undefined
  const [valeurs, setValeurs] = useState<Omit<Produit, 'id'>>(source ? { ...source } : produitVide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  if (id && !source) return <Introuvable quoi="Prestation" retour="/facturation/produits" />

  const set = <K extends keyof Omit<Produit, 'id'>>(k: K, v: Omit<Produit, 'id'>[K]) => setValeurs((s) => ({ ...s, [k]: v }))

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!valeurs.nom.trim()) e.nom = 'Indiquez le nom de la prestation.'
    if (!valeurs.reference.trim()) e.reference = 'Indiquez une référence.'
    if (valeurs.prixHT < 0) e.prixHT = 'Le prix ne peut pas être négatif.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return
    setEnCours(true)
    void (async () => {
      try {
        if (source) await modifierProduit(source.id, valeurs)
        else await creerProduit(valeurs)
        toast({ titre: source ? 'Prestation mise à jour' : 'Prestation créée', detail: valeurs.nom, tone: 'success' })
        navigate('/facturation/produits')
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  return (
    <PageFormulaire
      eyebrow="Facturation"
      titre={source ? `Modifier ${source.nom}` : 'Nouvelle prestation'}
      description="Les prestations alimentent les lignes de facture, avec leur prix et leur taux de TVA."
      nav={<FactNav />}
      onAnnuler={() => navigate('/facturation/produits')}
      onEnregistrer={enregistrer}
      libelleEnregistrer={source ? 'Enregistrer' : 'Créer la prestation'}
      enCours={enCours}
      sections={[
        {
          titre: 'Identité de la prestation',
          contenu: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Référence" required error={erreurs.reference}>
                {(p) => <Input {...p} value={valeurs.reference} onChange={(e) => set('reference', e.target.value)} placeholder="LOC-SALLE-J" />}
              </Field>
              <Field label="Catégorie">
                {(p) => <Input {...p} value={valeurs.categorie} onChange={(e) => set('categorie', e.target.value)} placeholder="Location" />}
              </Field>
              <Field label="Nom" required error={erreurs.nom} className="sm:col-span-2">
                {(p) => <Input {...p} value={valeurs.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Location de la grande salle — journée" />}
              </Field>
              <Field label="Description" className="sm:col-span-2" hint="Reprise sur la ligne de facture.">
                {(p) => <Textarea {...p} rows={3} value={valeurs.description} onChange={(e) => set('description', e.target.value)} />}
              </Field>
            </div>
          ),
        },
        {
          titre: 'Prix et disponibilité',
          description: 'Le prix sert de base ; la grille tarifaire du client lui applique son coefficient.',
          contenu: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prix unitaire HT" required error={erreurs.prixHT}>
                {(p) => <Input {...p} type="number" min={0} step="0.01" suffix="€" value={String(valeurs.prixHT)} onChange={(e) => set('prixHT', Number(e.target.value) || 0)} />}
              </Field>
              <Field label="Taux de TVA">
                {(p) => (
                  <Select
                    {...p}
                    value={String(valeurs.tva)}
                    onChange={(e) => set('tva', Number(e.target.value))}
                    options={[0, 5.5, 10, 20].map((t) => ({ value: String(t), label: `${String(t).replace('.', ',')} %` }))}
                  />
                )}
              </Field>
              <Field label="Unité" hint="Journée, heure, personne…">
                {(p) => <Input {...p} value={valeurs.unite} onChange={(e) => set('unite', e.target.value)} placeholder="journée" />}
              </Field>
              <div className="sm:col-span-2">
                <Switch
                  label="Prestation active"
                  description="Une prestation inactive n’est plus proposée à la facturation, mais reste sur les factures passées."
                  checked={valeurs.actif}
                  onCheckedChange={(v) => set('actif', v)}
                />
              </div>
            </div>
          ),
        },
      ]}
    />
  )
}

/* ---------------------------- Modèle de facture -------------------------- */

export function ModeleFactureForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { modeles, creerModele, modifierModele } = useFacturation()

  const source = id ? modeles.find((m) => m.id === id) : undefined
  const [valeurs, setValeurs] = useState<Omit<ModeleFacture, 'id'>>(source ? { ...source } : modeleVide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  if (id && !source) return <Introuvable quoi="Modèle" retour="/facturation/modeles" />

  const set = <K extends keyof Omit<ModeleFacture, 'id'>>(k: K, v: Omit<ModeleFacture, 'id'>[K]) => setValeurs((s) => ({ ...s, [k]: v }))

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!valeurs.nom.trim()) e.nom = 'Donnez un nom au modèle.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return
    setEnCours(true)
    void (async () => {
      try {
        if (source) await modifierModele(source.id, valeurs)
        else await creerModele(valeurs)
        toast({ titre: source ? 'Modèle mis à jour' : 'Modèle créé', detail: valeurs.nom, tone: 'success' })
        navigate('/facturation/modeles')
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  return (
    <PageFormulaire
      eyebrow="Facturation"
      titre={source ? `Modifier ${source.nom}` : 'Nouveau modèle de facture'}
      description="Un modèle porte les mentions et conditions reprises sur chaque facture qui l'utilise."
      nav={<FactNav />}
      onAnnuler={() => navigate('/facturation/modeles')}
      onEnregistrer={enregistrer}
      libelleEnregistrer={source ? 'Enregistrer' : 'Créer le modèle'}
      enCours={enCours}
      sections={[
        {
          titre: 'Identité du modèle',
          contenu: (
            <div className="flex flex-col gap-4">
              <Field label="Nom du modèle" required error={erreurs.nom}>
                {(p) => <Input {...p} value={valeurs.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Facture standard" />}
              </Field>
              <Field label="Description" hint="À quoi sert ce modèle, pour que l’équipe choisisse le bon.">
                {(p) => <Textarea {...p} rows={2} value={valeurs.description} onChange={(e) => set('description', e.target.value)} />}
              </Field>
            </div>
          ),
        },
        {
          titre: 'Mentions et conditions',
          description: 'Ces textes sont repris tels quels sur les factures produites.',
          contenu: (
            <div className="flex flex-col gap-4">
              <Field label="Mentions légales" hint="Numéro d’agrément, exonération de TVA, régime associatif…">
                {(p) => <Textarea {...p} rows={3} value={valeurs.mentions} onChange={(e) => set('mentions', e.target.value)} />}
              </Field>
              <Field label="Conditions de règlement">
                {(p) => <Textarea {...p} rows={3} value={valeurs.conditions} onChange={(e) => set('conditions', e.target.value)} />}
              </Field>
              <Field label="Pied de page">
                {(p) => <Textarea {...p} rows={2} value={valeurs.pied} onChange={(e) => set('pied', e.target.value)} />}
              </Field>
              <Switch
                label="Modèle par défaut"
                description="Proposé d’office à la création d’une facture."
                checked={valeurs.defaut}
                onCheckedChange={(v) => set('defaut', v)}
              />
              <Switch
                label="Modèle actif"
                description="Un modèle inactif reste sur les factures passées mais n’est plus proposé."
                checked={valeurs.actif}
                onCheckedChange={(v) => set('actif', v)}
              />
            </div>
          ),
        },
      ]}
    />
  )
}
