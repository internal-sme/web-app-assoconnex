import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageFormulaire } from '@/components/forms/PageFormulaire'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { cn } from '@/lib/utils'
import { useFormulaires } from '@/context/FormulairesContext'
import { useToast } from '@/context/ToastContext'
import { categoriesFormulaire } from '@/lib/formulaires'

const modeles = [
  { titre: 'Adhésion en ligne', categorie: 'Adhésion' },
  { titre: 'Inscription à un atelier', categorie: 'Inscription' },
  { titre: 'Appel à bénévoles', categorie: 'Bénévolat' },
  { titre: 'Formulaire de contact', categorie: 'Contact' },
]

export function NouveauFormulaire() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { creer } = useFormulaires()

  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [categorie, setCategorie] = useState('')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const creerFormulaire = async () => {
    const e: Record<string, string> = {}
    if (!titre.trim()) e.titre = 'Donnez un titre au formulaire.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    setErreurGlobale(null)
    setEnCours(true)
    try {
      const nouveau = await creer({ titre: titre.trim(), description: description.trim(), categorie })
      toast({ titre: 'Formulaire créé', detail: `${nouveau.titre} a été enregistré en brouillon.`, tone: 'success' })
      navigate(`/formulaires/${nouveau.id}/editeur`)
    } catch (err) {
      setErreurGlobale((err as Error).message)
      toast({ titre: 'Création impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <PageFormulaire
      eyebrow="Formulaires"
      titre="Nouveau formulaire"
      description="Donnez-lui un nom pour commencer. Vous ajouterez les champs dans l'éditeur, par glisser-déposer."
      onAnnuler={() => navigate('/formulaires')}
      onEnregistrer={() => void creerFormulaire()}
      libelleEnregistrer="Créer et passer à l'éditeur"
      enCours={enCours}
      sections={[
        {
          titre: 'Modèles rapides',
          description: 'Un point de départ courant — le titre et la catégorie restent modifiables.',
          contenu: (
            <div className="flex flex-wrap gap-1.5">
              {modeles.map((m) => (
                <button
                  key={m.titre}
                  type="button"
                  onClick={() => {
                    setTitre(m.titre)
                    setCategorie(m.categorie)
                  }}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-[0.8125rem] font-medium transition-colors',
                    titre === m.titre ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-25',
                  )}
                >
                  {m.titre}
                </button>
              ))}
            </div>
          ),
        },
        {
          titre: 'Informations générales',
          contenu: (
            <div className="flex flex-col gap-4">
              {erreurGlobale && (
                <Alert tone="danger" titre="Création impossible">
                  {erreurGlobale}
                </Alert>
              )}
              <Field label="Titre du formulaire" required error={erreurs.titre} hint="Visible par les répondants en haut du formulaire.">
                {(p) => <Input {...p} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Adhésion en ligne 2026" />}
              </Field>
              <Field label="Description" hint="Facultative — un ou deux phrases pour situer le formulaire.">
                {(p) => <Textarea {...p} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ce que ce formulaire couvre, et à qui il s'adresse." />}
              </Field>
              <Field label="Catégorie" hint="Sert au classement dans la liste des formulaires.">
                {(p) => (
                  <Select
                    {...p}
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    placeholder="Non classée"
                    options={categoriesFormulaire.map((c) => ({ value: c, label: c }))}
                  />
                )}
              </Field>
            </div>
          ),
        },
      ]}
    />
  )
}
