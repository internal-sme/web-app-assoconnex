import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { FormulaireEtapes, type EtapeFormulaire } from '@/components/ui/FormulaireEtapes'
import { useFacturation } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'
import { typeClientLabels, type TypeClient } from '@/lib/facturation'

const vide = {
  nom: '',
  type: 'association' as TypeClient,
  siret: '',
  contact: '',
  email: '',
  telephone: '',
  adresse: '',
  codePostal: '',
  ville: '',
  delaiPaiement: '30',
  grilleTarifaire: '',
  notes: '',
}

export function ClientForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { clients, grilles, creerClient, modifierClient } = useFacturation()

  const source = id ? clients.find((c) => c.id === id) : undefined
  const modification = !!id

  const [v, setV] = useState(
    source
      ? {
          nom: source.nom,
          type: source.type,
          siret: source.siret,
          contact: source.contact,
          email: source.email,
          telephone: source.telephone,
          adresse: source.adresse,
          codePostal: source.codePostal,
          ville: source.ville,
          delaiPaiement: String(source.delaiPaiement),
          grilleTarifaire: source.grilleTarifaire,
          notes: source.notes,
        }
      : vide,
  )
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const set = (patch: Partial<typeof vide>) => setV((s) => ({ ...s, ...patch }))

  if (modification && !source) {
    return (
      <Page header={<PageHeader title="Client introuvable" />}>
        <Card>
          <EmptyState
            icon={<Users />}
            title="Ce client n'existe plus"
            description="Il a peut-être été supprimé du référentiel."
            action={<Button variant="primary" onClick={() => navigate('/facturation/referentiels')}>Retour aux référentiels</Button>}
          />
        </Card>
      </Page>
    )
  }

  const etapes: EtapeFormulaire[] = [
    {
      titre: 'Identité',
      description: 'Qui est ce client, et sous quelle forme juridique.',
      valider: () => {
        const e: Record<string, string> = {}
        if (!v.nom.trim()) e.nom = 'La raison sociale est obligatoire.'
        return e
      },
      contenu: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Raison sociale" required error={erreurs.nom} className="sm:col-span-2">
            {(p) => <Input {...p} value={v.nom} onChange={(e) => set({ nom: e.target.value })} placeholder="Ville de Nantes" />}
          </Field>
          <Field label="Type" required>
            {(p) => (
              <Select
                {...p}
                value={v.type}
                onChange={(e) => set({ type: e.target.value as TypeClient })}
                options={(Object.keys(typeClientLabels) as TypeClient[]).map((t) => ({ value: t, label: typeClientLabels[t] }))}
              />
            )}
          </Field>
          <Field label="SIRET" hint="Quatorze chiffres, requis pour une facture à une personne morale.">
            {(p) => <Input {...p} value={v.siret} onChange={(e) => set({ siret: e.target.value })} placeholder="214 401 095 00018" />}
          </Field>
        </div>
      ),
    },
    {
      titre: 'Contact et adresse',
      description: 'Où et à qui envoyer les factures.',
      valider: () => {
        const e: Record<string, string> = {}
        if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) e.email = 'Cette adresse ne semble pas valide.'
        if (v.codePostal && !/^\d{5}$/.test(v.codePostal)) e.codePostal = 'Un code postal français compte cinq chiffres.'
        return e
      },
      contenu: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact" hint="Personne ou service destinataire.">
            {(p) => <Input {...p} value={v.contact} onChange={(e) => set({ contact: e.target.value })} placeholder="Service vie associative" />}
          </Field>
          <Field label="Adresse e-mail" error={erreurs.email}>
            {(p) => <Input {...p} type="email" value={v.email} onChange={(e) => set({ email: e.target.value })} />}
          </Field>
          <Field label="Téléphone">
            {(p) => <Input {...p} value={v.telephone} onChange={(e) => set({ telephone: e.target.value })} placeholder="02 40 41 90 00" />}
          </Field>
          <Field label="Adresse" className="sm:col-span-2">
            {(p) => <Input {...p} value={v.adresse} onChange={(e) => set({ adresse: e.target.value })} placeholder="2 rue de l’Hôtel de Ville" />}
          </Field>
          <Field label="Code postal" error={erreurs.codePostal}>
            {(p) => <Input {...p} value={v.codePostal} onChange={(e) => set({ codePostal: e.target.value })} placeholder="44000" />}
          </Field>
          <Field label="Ville">
            {(p) => <Input {...p} value={v.ville} onChange={(e) => set({ ville: e.target.value })} placeholder="Nantes" />}
          </Field>
        </div>
      ),
    },
    {
      titre: 'Conditions',
      description: 'Ce qui s’appliquera par défaut aux factures de ce client.',
      valider: () => {
        const e: Record<string, string> = {}
        const d = Number(v.delaiPaiement)
        if (!Number.isFinite(d) || d < 0) e.delaiPaiement = 'Indiquez un nombre de jours positif.'
        return e
      },
      contenu: (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Délai de paiement" required error={erreurs.delaiPaiement} hint="En jours à compter de l’émission.">
            {(p) => <Input {...p} type="number" min={0} suffix="jours" value={v.delaiPaiement} onChange={(e) => set({ delaiPaiement: e.target.value })} />}
          </Field>
          <Field label="Grille tarifaire" hint="Applique un coefficient aux prestations.">
            {(p) => (
              <Select
                {...p}
                value={v.grilleTarifaire}
                onChange={(e) => set({ grilleTarifaire: e.target.value })}
                placeholder="Tarif de base"
                options={grilles.map((g) => ({ value: g.id, label: g.nom }))}
              />
            )}
          </Field>
          <Field label="Note interne" className="sm:col-span-2" hint="Visible de l’équipe uniquement, jamais du client.">
            {(p) => <Textarea {...p} rows={3} value={v.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Mandat administratif, joindre le numéro d’engagement." />}
          </Field>
        </div>
      ),
    },
  ]

  const terminer = async () => {
    setEnCours(true)
    try {
      const donnees = { ...v, delaiPaiement: Number(v.delaiPaiement) || 0 }
      if (modification) {
        await modifierClient(id!, donnees)
        toast({ titre: 'Client modifié', detail: v.nom, tone: 'success' })
      } else {
        await creerClient(donnees)
        toast({ titre: 'Client créé', detail: v.nom, tone: 'success' })
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
          title={modification ? `Modifier ${source!.nom}` : 'Nouveau client'}
          description="Les informations saisies ici alimentent l'en-tête et les conditions de chaque facture émise à ce client."
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
        labelFil="Étapes de création du client"
        onAnnuler={() => navigate('/facturation/referentiels')}
        onTerminer={() => void terminer()}
        libelleTerminer={modification ? 'Enregistrer' : 'Créer le client'}
        enCours={enCours}
        onErreurs={setErreurs}
      />
    </Page>
  )
}
