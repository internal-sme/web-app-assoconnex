import { usePageTitle } from '@/hooks/usePageTitle'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageFormulaire } from '@/components/forms/PageFormulaire'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { CampNav } from '@/components/campagnes/CampNav'
import { DefinitionEditeur } from '@/components/campagnes/Definition'
import { useCampagnes } from '@/context/CampagnesContext'
import { useToast } from '@/context/ToastContext'
import { definitionVide, type SegmentDefinition } from '@/lib/campagnes'

export function SegmentForm() {
  usePageTitle('Segment')

  const navigate = useNavigate()
  const { id } = useParams()
  const { segments, enregistrerSegment } = useCampagnes()
  const { toast } = useToast()

  const existant = useMemo(() => (id ? segments.find((s) => s.id === id) : undefined), [id, segments])

  const [nom, setNom] = useState(existant?.nom ?? '')
  const [description, setDescription] = useState(existant?.description ?? '')
  const [definition, setDefinition] = useState<SegmentDefinition>(existant?.definition ?? definitionVide())
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const annuler = () => navigate('/campagnes-emailing/segments')

  const enregistrer = async () => {
    const e: Record<string, string> = {}
    if (!nom.trim()) e.nom = 'Donnez un nom au segment.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return
    setEnCours(true)
    try {
      await enregistrerSegment({ id, nom, description, definition })
      toast({ titre: id ? 'Segment mis à jour' : 'Segment créé', detail: `« ${nom.trim()} » est disponible pour vos prochains envois.`, tone: 'success' })
      navigate('/campagnes-emailing/segments')
    } catch (err) {
      setErreurs({ global: err instanceof Error ? err.message : "L'enregistrement a échoué." })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <PageFormulaire
      eyebrow="Campagne d’emailing"
      titre={id ? 'Modifier le segment' : 'Nouveau segment'}
      description="Définissez les critères : groupes, tags et statuts d'adhésion. Une règle « ou » s'applique à l'intérieur d'un critère, « et » entre les critères."
      nav={<CampNav />}
      onAnnuler={annuler}
      onEnregistrer={enregistrer}
      libelleEnregistrer={id ? 'Enregistrer' : 'Créer le segment'}
      enCours={enCours}
      etat={erreurs.global}
      sections={[
        {
          titre: 'Nom et description',
          contenu: (
            <div className="grid gap-4">
              <Field label="Nom" required error={erreurs.nom}>
                {(props) => <Input {...props} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Adhérents actifs de la section randonnée" />}
              </Field>
              <Field label="Description" hint="Rappelle le contenu du segment à l'équipe, sans affecter les critères.">
                {(props) => <Input {...props} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="À quoi sert ce segment ?" />}
              </Field>
            </div>
          ),
        },
        {
          titre: 'Critères',
          description: "Plus aucun critère ne retiendrait l'ensemble des personnes joignables.",
          contenu: <DefinitionEditeur definition={definition} onChange={setDefinition} />,
        },
      ]}
    />
  )
}