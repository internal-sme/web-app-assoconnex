import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Settings2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageFormulaire } from '@/components/forms/PageFormulaire'
import { useAdherents } from '@/context/AdherentsContext'
import { useToast } from '@/context/ToastContext'
import type { TypeAdhesion } from '@/lib/adherents'

const typeVide: Omit<TypeAdhesion, 'id'> = {
  nom: '', description: '', montant: 0, dureeMois: 12, publicVise: '', actif: true, reconduction: true,
}

export function TypeAdhesionForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { types, creerType, modifierType } = useAdherents()

  const source = id ? types.find((t) => t.id === id) : undefined
  const [valeurs, setValeurs] = useState<Omit<TypeAdhesion, 'id'>>(source ? { ...source } : typeVide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  if (id && !source) {
    return (
      <Page header={<PageHeader eyebrow="Adhérents" title="Formule introuvable" />}>
        <Card>
          <EmptyState
            icon={<Settings2 />}
            title="Cette formule n'existe plus"
            description="Elle a peut-être été supprimée."
            action={<Button variant="primary" onClick={() => navigate('/adherents/types')}>Retour aux formules</Button>}
          />
        </Card>
      </Page>
    )
  }

  const set = <K extends keyof Omit<TypeAdhesion, 'id'>>(k: K, v: Omit<TypeAdhesion, 'id'>[K]) =>
    setValeurs((s) => ({ ...s, [k]: v }))

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!valeurs.nom.trim()) e.nom = 'Donnez un nom à la formule.'
    if (valeurs.montant < 0) e.montant = 'Le montant ne peut pas être négatif.'
    if (valeurs.dureeMois < 1) e.dureeMois = 'La durée doit être d’au moins un mois.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    setEnCours(true)
    void (async () => {
      try {
        if (source) await modifierType(source.id, valeurs)
        else await creerType(valeurs)
        toast({ titre: source ? 'Formule mise à jour' : 'Formule créée', detail: valeurs.nom, tone: 'success' })
        navigate('/adherents/types')
      } catch (err) {
        toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
      } finally {
        setEnCours(false)
      }
    })()
  }

  return (
    <PageFormulaire
      eyebrow="Adhérents"
      titre={source ? `Modifier ${source.nom}` : 'Nouveau type d’adhésion'}
      description="Les formules déterminent le montant, la durée et le public visé des adhésions."
      onAnnuler={() => navigate('/adherents/types')}
      onEnregistrer={enregistrer}
      libelleEnregistrer={source ? 'Enregistrer' : 'Créer la formule'}
      enCours={enCours}
      sections={[
        {
          titre: 'La formule',
          description: 'Ce que verra la personne au moment d’adhérer.',
          contenu: (
            <div className="flex flex-col gap-4">
              <Field label="Nom de la formule" required error={erreurs.nom}>
                {(p) => <Input {...p} value={valeurs.nom} onChange={(e) => set('nom', e.target.value)} placeholder="Adhésion famille" />}
              </Field>
              <Field label="Description" hint="Ce que la formule comprend.">
                {(p) => <Textarea {...p} rows={3} value={valeurs.description} onChange={(e) => set('description', e.target.value)} />}
              </Field>
              <Field label="Public visé" hint="Étudiants, familles, structures partenaires…">
                {(p) => <Input {...p} value={valeurs.publicVise} onChange={(e) => set('publicVise', e.target.value)} placeholder="Familles de deux personnes et plus" />}
              </Field>
            </div>
          ),
        },
        {
          titre: 'Tarif et durée',
          description: 'Le montant appelé et la période couverte par l’adhésion.',
          contenu: (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Montant" required error={erreurs.montant}>
                {(p) => <Input {...p} type="number" min={0} step="0.01" suffix="€" value={String(valeurs.montant)} onChange={(e) => set('montant', Number(e.target.value) || 0)} />}
              </Field>
              <Field label="Durée" required error={erreurs.dureeMois}>
                {(p) => (
                  <Select
                    {...p}
                    value={String(valeurs.dureeMois)}
                    onChange={(e) => set('dureeMois', Number(e.target.value))}
                    options={[3, 6, 12, 24].map((m) => ({ value: String(m), label: `${m} mois` }))}
                  />
                )}
              </Field>
              <div className="flex flex-col gap-3 sm:col-span-2">
                <Switch
                  label="Reconduction tacite"
                  description="Le renouvellement est proposé automatiquement à l’échéance."
                  checked={valeurs.reconduction}
                  onCheckedChange={(v) => set('reconduction', v)}
                />
                <Switch
                  label="Formule active"
                  description="Une formule inactive reste sur les adhésions en cours mais n’est plus proposée."
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
