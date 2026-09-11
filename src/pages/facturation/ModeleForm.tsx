import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { FormulaireEtapes, type EtapeFormulaire } from '@/components/ui/FormulaireEtapes'
import { useFacturation } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'

const vide = { nom: '', description: '', mentions: '', conditions: '', pied: '', defaut: false, actif: true }

export function ModeleForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { modeles, creerModele, modifierModele } = useFacturation()

  const source = id ? modeles.find((m) => m.id === id) : undefined
  const modification = !!id
  const defautActuel = modeles.find((m) => m.defaut && m.id !== id)

  const [v, setV] = useState(source ? { ...source } : vide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const set = (patch: Partial<typeof vide>) => setV((s) => ({ ...s, ...patch }))

  if (modification && !source) {
    return (
      <Page header={<PageHeader title="Modèle introuvable" />}>
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Ce modèle n'existe plus"
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
      description: 'Comment reconnaître ce modèle au moment de créer une facture.',
      valider: () => {
        const e: Record<string, string> = {}
        if (!v.nom.trim()) e.nom = 'Le nom est obligatoire.'
        else if (modeles.some((m) => m.id !== id && m.nom.toLowerCase() === v.nom.trim().toLowerCase())) {
          e.nom = 'Un modèle porte déjà ce nom.'
        }
        return e
      },
      contenu: (
        <div className="flex flex-col gap-4">
          <Field label="Nom du modèle" required error={erreurs.nom}>
            {(p) => <Input {...p} value={v.nom} onChange={(e) => set({ nom: e.target.value })} placeholder="Facture standard" />}
          </Field>
          <Field label="Description" hint="À quel usage ce modèle est destiné.">
            {(p) => <Textarea {...p} rows={2} value={v.description} onChange={(e) => set({ description: e.target.value })} placeholder="Prestations courantes auprès des collectivités." />}
          </Field>
        </div>
      ),
    },
    {
      titre: 'Mentions et diffusion',
      description: 'Les textes repris sur chaque facture émise avec ce modèle.',
      contenu: (
        <div className="flex flex-col gap-4">
          <Field label="Mentions légales" hint="Numéro RNA, exonération de TVA, agrément — ce qui doit figurer au bas de la facture.">
            {(p) => <Textarea {...p} rows={3} value={v.mentions} onChange={(e) => set({ mentions: e.target.value })} />}
          </Field>
          <Field label="Conditions de règlement" hint="Délai, pénalités de retard, indemnité forfaitaire de recouvrement.">
            {(p) => <Textarea {...p} rows={3} value={v.conditions} onChange={(e) => set({ conditions: e.target.value })} />}
          </Field>
          <Field label="Pied de page" hint="Coordonnées bancaires, contact, site.">
            {(p) => <Textarea {...p} rows={2} value={v.pied} onChange={(e) => set({ pied: e.target.value })} />}
          </Field>

          {v.defaut && defautActuel && (
            <Alert tone="warning" titre="Un autre modèle est déjà par défaut">
              « {defautActuel.nom} » perdra ce statut : une seule facture type peut être proposée d'office.
            </Alert>
          )}

          <div className="flex flex-col gap-3 border-t border-ink-100 pt-4">
            <Switch
              label="Modèle par défaut"
              description="Proposé d’office à la création d’une facture."
              checked={v.defaut}
              onCheckedChange={(x) => set({ defaut: x })}
            />
            <Switch
              label="Modèle actif"
              description="Un modèle inactif reste sur les factures passées mais n’est plus proposé."
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
      const donnees = { ...v, nom: v.nom.trim() }
      if (modification) {
        await modifierModele(id!, donnees)
        toast({ titre: 'Modèle modifié', detail: v.nom, tone: 'success' })
      } else {
        await creerModele(donnees)
        toast({ titre: 'Modèle créé', detail: v.nom, tone: 'success' })
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
          title={modification ? `Modifier ${source!.nom}` : 'Nouveau modèle de facture'}
          description="Un modèle porte les mentions et conditions reprises automatiquement sur les factures qui s'en servent."
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
        labelFil="Étapes de création du modèle"
        onAnnuler={() => navigate('/facturation/referentiels')}
        onTerminer={() => void terminer()}
        libelleTerminer={modification ? 'Enregistrer' : 'Créer le modèle'}
        enCours={enCours}
        onErreurs={setErreurs}
      />
    </Page>
  )
}
