import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { Copy, Globe, Lock, PauseCircle, PlayCircle } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Status'
import { FormulairePage } from '@/components/formulaires/FormulairePage'
import { cleStatutFormulaire } from '@/components/formulaires/statuts'
import { useFormulaires } from '@/context/FormulairesContext'
import { useToast } from '@/context/ToastContext'
import { peutPublier, type Formulaire } from '@/lib/formulaires'
import { formatDateTime } from '@/lib/utils'

async function copier(texte: string, toast: (t: { titre: string; detail: string; tone: 'success' | 'danger' }) => void, label: string) {
  try {
    await navigator.clipboard.writeText(texte)
    toast({ titre: 'Copié', detail: `${label} a été copié dans le presse-papiers.`, tone: 'success' })
  } catch {
    toast({ titre: 'Copie impossible', detail: 'Le presse-papiers est inaccessible dans ce navigateur.', tone: 'danger' })
  }
}

function CorpsPublication({ formulaire }: { formulaire: Formulaire }) {
  const { toast } = useToast()
  const { publier, fermer } = useFormulaires()
  const [enCours, setEnCours] = useState(false)
  const verdict = peutPublier(formulaire)

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const disponible = formulaire.statut === 'publie'
  const embed = `<iframe src="${formulaire.lienPublic}" width="100%" height="640" style="border:0"></iframe>`

  return (
    <>
      <Card>
        <CardHeader title="État de la publication" />
        <CardBody className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={cleStatutFormulaire[formulaire.statut]} />
            <p className="text-[0.8125rem] text-ink-600">
              {formulaire.statut === 'brouillon' && "Ce formulaire n'a encore jamais été publié."}
              {formulaire.statut === 'publie' && formulaire.publieLe && `Publié le ${formatDateTime(formulaire.publieLe)}. Le lien accepte de nouvelles réponses.`}
              {formulaire.statut === 'ferme' && formulaire.fermeLe && `Fermé le ${formatDateTime(formulaire.fermeLe)}. Le lien n'accepte plus de nouvelles réponses.`}
              {formulaire.statut === 'archive' && 'Ce formulaire est archivé. Désarchivez-le depuis ses paramètres pour le publier à nouveau.'}
            </p>
          </div>

          {formulaire.statut === 'brouillon' && !verdict.ok && (
            <Alert tone="warning" titre="Impossible de publier pour l'instant">
              {verdict.raison}
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            {(formulaire.statut === 'brouillon' || formulaire.statut === 'ferme') && (
              <Button
                variant="primary"
                loading={enCours}
                disabled={!verdict.ok}
                onClick={() => void executer(() => publier(formulaire.id), { titre: 'Formulaire publié', detail: 'Le lien public est actif.' })}
                iconLeft={<PlayCircle aria-hidden className="h-4 w-4" />}
              >
                {formulaire.statut === 'ferme' ? 'Rouvrir les réponses' : 'Publier le formulaire'}
              </Button>
            )}
            {formulaire.statut === 'publie' && (
              <Button
                loading={enCours}
                onClick={() => void executer(() => fermer(formulaire.id), { titre: 'Réponses fermées', detail: 'Le lien public n’accepte plus de nouvelles réponses.' })}
                iconLeft={<PauseCircle aria-hidden className="h-4 w-4" />}
              >
                Fermer les réponses
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Lien public" description="Partagez ce lien par e-mail, sur votre site ou vos réseaux." />
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Input readOnly value={formulaire.lienPublic} iconLeft={disponible ? <Globe /> : <Lock />} className="ac-num" />
            <Button
              disabled={!disponible}
              onClick={() => void copier(formulaire.lienPublic, toast, 'Le lien')}
              iconLeft={<Copy aria-hidden className="h-4 w-4" />}
            >
              Copier
            </Button>
          </div>
          {!disponible && <p className="text-xs text-ink-500">Le lien n’est actif que lorsque le formulaire est publié.</p>}
        </CardBody>
      </Card>

      {(formulaire.statut === 'publie' || formulaire.statut === 'ferme') && (
        <Card>
          <CardHeader title="Intégration sur votre site" description="Collez ce code dans une page web pour afficher le formulaire en place." />
          <CardBody className="flex flex-col gap-3">
            <pre className="ac-scroll overflow-x-auto rounded-lg border border-ink-200 bg-ink-25 p-3 text-xs text-ink-700">
              <code>{embed}</code>
            </pre>
            <Button className="self-start" onClick={() => void copier(embed, toast, 'Le code d’intégration')} iconLeft={<Copy aria-hidden className="h-4 w-4" />}>
              Copier le code
            </Button>
          </CardBody>
        </Card>
      )}
    </>
  )
}

export function FormulairePublication() {
  usePageTitle('Publication')

  return <FormulairePage eyebrow="Formulaires">{(f) => <CorpsPublication formulaire={f} />}</FormulairePage>
}
