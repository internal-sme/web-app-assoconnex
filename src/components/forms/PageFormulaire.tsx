import type { ReactNode } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export type SectionFormulaire = { titre: string; description?: string; contenu: ReactNode }

/**
 * Coquille des formulaires longs : sections empilées sur une page dédiée,
 * barre d'actions qui reste visible en bas. Plus lisible qu'une modale dès
 * que la saisie dépasse quelques champs.
 */
export function PageFormulaire({
  eyebrow,
  titre,
  description,
  sections,
  onAnnuler,
  onEnregistrer,
  libelleEnregistrer,
  enCours,
  etat,
  nav,
}: {
  eyebrow: string
  titre: string
  description: string
  sections: SectionFormulaire[]
  onAnnuler: () => void
  onEnregistrer: () => void
  libelleEnregistrer: string
  enCours: boolean
  /** Message affiché à gauche de la barre d'actions. */
  etat?: string
  nav?: ReactNode
}) {
  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow={eyebrow}
          title={titre}
          description={description}
          actions={
            <Button onClick={onAnnuler} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Annuler
            </Button>
          }
        />
      }
    >
      {nav}

      {sections.map((s) => (
        <Card key={s.titre}>
          <CardHeader title={s.titre} description={s.description} />
          <CardBody>{s.contenu}</CardBody>
        </Card>
      ))}

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours ? 'Enregistrement en cours…' : (etat ?? '')}
        </p>
        <Button variant="ghost" onClick={onAnnuler} disabled={enCours}>Annuler</Button>
        <Button variant="primary" loading={enCours} onClick={onEnregistrer} iconLeft={<Check aria-hidden className="h-4 w-4" />}>
          {libelleEnregistrer}
        </Button>
      </div>
    </Page>
  )
}
