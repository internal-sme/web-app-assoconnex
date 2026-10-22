import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, MoreHorizontal, PencilLine, Plus, Trash2, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Menu } from '@/components/ui/Menu'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { CampNav, CampOutils } from '@/components/campagnes/CampNav'
import { useCampagnes } from '@/context/CampagnesContext'
import { decompteSegment, statutAdhesionLabels, type Segment } from '@/lib/campagnes'

export function Segments() {
  usePageTitle('Segments')

  const navigate = useNavigate()
  const { segments, chargement, desinscritsIds, supprimerSegment } = useCampagnes()
  const [aSupprimer, setASupprimer] = useState<Segment | null>(null)
  const [suppression, setSuppression] = useState(false)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Campagne d’emailing"
          title="Segments"
          description="Les publics prêts à l'emploi pour vos envois, définis sur les groupes, tags et statuts d'adhésion."
          actions={
            <>
              <CampOutils />
              <Button variant="primary" onClick={() => navigate('/campagnes-emailing/segments/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouveau segment
              </Button>
            </>
          }
        />
      }
    >
      <CampNav />

      <ConfirmDialog
        open={!!aSupprimer}
        onClose={() => setASupprimer(null)}
        onConfirm={async () => {
          if (!aSupprimer) return
          setSuppression(true)
          await supprimerSegment(aSupprimer.id)
          setSuppression(false)
          setASupprimer(null)
        }}
        loading={suppression}
        title="Supprimer ce segment ?"
        description={`« ${aSupprimer?.nom ?? ''} » ne sera plus proposé lors des prochains envois. Les campagnes déjà programmées conservent leur périmètre.`}
        confirmLabel="Supprimer"
      />

      {chargement ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </Card>
          ))}
        </div>
      ) : segments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Filter />}
            title="Aucun segment"
            description="Construisez votre premier segment pour cibler un envoi sur un public précis."
            action={<Button variant="primary" onClick={() => navigate('/campagnes-emailing/segments/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>Créer un segment</Button>}
          />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {segments.map((s) => {
            const d = decompteSegment(s.definition, desinscritsIds)
            return (
              <li key={s.id}>
                <Card className="h-full">
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/campagnes-emailing/segments/${s.id}/modifier`)}
                        className="min-w-0 text-left"
                      >
                        <span className="block truncate font-medium text-ink-900">{s.nom}</span>
                        <span className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-500">{s.description}</span>
                      </button>
                      <Menu
                        label={`Actions pour ${s.nom}`}
                        align="end"
                        items={[
                          { label: 'Modifier', icon: <PencilLine aria-hidden className="text-ink-500" />, onSelect: () => navigate(`/campagnes-emailing/segments/${s.id}/modifier`) },
                          { type: 'separator' },
                          { label: 'Supprimer', icon: <Trash2 aria-hidden className="text-danger-600" />, danger: true, onSelect: () => setASupprimer(s) },
                        ]}
                        trigger={({ toggle, open, ref }) => (
                          <Button variant="icon" size="sm" ref={ref} label="Actions" onClick={toggle} aria-expanded={open} aria-haspopup="menu">
                            <MoreHorizontal aria-hidden className="h-4 w-4" />
                          </Button>
                        )}
                      />
                    </div>

                    <p className="mt-3 flex items-center gap-1.5 text-[0.8125rem] font-semibold text-ink-800">
                      <Users aria-hidden className="h-4 w-4 text-ink-400" />
                      {d.joignables.toLocaleString('fr-FR')} joignable{d.joignables > 1 ? 's' : ''}
                      <span className="font-normal text-ink-500">sur {d.total.toLocaleString('fr-FR')}</span>
                    </p>

                    <p className="mt-2 flex flex-wrap gap-1">
                      {s.definition.statutsAdhesion.map((st) => (
                        <span key={st} className="rounded-md bg-ink-100 px-1.5 py-0.5 text-2xs font-medium text-ink-600">
                          {statutAdhesionLabels[st]}
                        </span>
                      ))}
                      {s.definition.groupes.slice(0, 2).map((g) => (
                        <span key={g} className="rounded-md bg-brand-50 px-1.5 py-0.5 text-2xs font-medium text-brand-700">
                          {g}
                        </span>
                      ))}
                      {s.definition.tags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded-md bg-warning-50 px-1.5 py-0.5 text-2xs font-medium text-warning-700">
                          {t}
                        </span>
                      ))}
                    </p>
                  </CardBody>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}