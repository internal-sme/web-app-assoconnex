import type { ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FileQuestion, RefreshCw } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Status'
import { FormulaireOnglets } from '@/components/formulaires/FormulaireOnglets'
import { cleStatutFormulaire } from '@/components/formulaires/statuts'
import { useFormulaires } from '@/context/FormulairesContext'
import type { Formulaire } from '@/lib/formulaires'

/**
 * Coquille commune aux écrans d'un formulaire : gère le chargement, l'erreur
 * et le cas « introuvable », puis délègue le corps de page une fois le
 * formulaire résolu. Évite de répéter ces trois états dans chaque écran.
 */
export function FormulairePage({
  eyebrow,
  onglets = true,
  actions,
  children,
}: {
  eyebrow: string
  onglets?: boolean
  actions?: (f: Formulaire) => ReactNode
  children: (f: Formulaire) => ReactNode
}) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { formulaireParId, chargement, erreur, recharger } = useFormulaires()
  const f = formulaireParId(id)

  const enTete = (titre: string, description?: string) => (
    <PageHeader
      eyebrow={eyebrow}
      title={titre}
      description={description}
      meta={f && <StatusBadge status={cleStatutFormulaire[f.statut]} />}
      actions={f && actions?.(f)}
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete('Le formulaire n’a pas pu être chargé')}>
        <Alert tone="danger" titre="Chargement impossible" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete('Chargement…')}>
        <Card>
          <SkeletonTable rows={4} />
        </Card>
      </Page>
    )
  }

  if (!f) {
    return (
      <Page header={enTete('Formulaire introuvable')}>
        <Card>
          <EmptyState
            icon={<FileQuestion />}
            title="Ce formulaire est introuvable"
            description="Il a peut-être été supprimé, ou le lien utilisé n'est plus valide."
            action={<Button variant="primary" onClick={() => navigate('/formulaires')}>Retour à la liste</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete(f.titre, f.description || undefined)}>
      {onglets && <FormulaireOnglets id={f.id} nbReponses={f.reponses.length} />}
      {children(f)}
    </Page>
  )
}
