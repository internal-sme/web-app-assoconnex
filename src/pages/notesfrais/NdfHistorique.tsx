import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { History } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { Timeline } from '@/components/ui/Timeline'
import { NdfNav, NdfOutils } from '@/components/notesfrais/NdfNav'
import { useNotesFrais } from '@/context/NotesFraisContext'

const onglets = [
  { id: 'tout', label: 'Toutes les actions' },
  { id: 'validations', label: 'Validations et rejets' },
  { id: 'remboursements', label: 'Remboursements' },
]

export function NdfHistorique() {
  const navigate = useNavigate()
  const { notes, demandeurs, chargement } = useNotesFrais()
  const [onglet, setOnglet] = useState('tout')

  const evenements = notes
    .flatMap((n) =>
      n.historique.map((e) => ({
        ...e,
        id: `${n.id}-${e.id}`,
        numero: n.numero,
        demandeur: demandeurs.find((d) => d.id === n.demandeurId)?.nom ?? '—',
      })),
    )
    .filter((e) => {
      if (onglet === 'validations') return /valid|rejet/i.test(e.libelle)
      if (onglet === 'remboursements') return /rembours/i.test(e.libelle)
      return true
    })
    .sort((a, b) => (a.quand < b.quand ? 1 : -1))
    .slice(0, 60)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Notes de frais"
          title="Historique"
          description="Journal de toutes les actions menées sur les notes de frais, du plus récent au plus ancien."
          meta={<Badge variant="brand">{evenements.length} événements affichés</Badge>}
          actions={<NdfOutils />}
        />
      }
    >
      <NdfNav />

      <Tabs items={onglets} value={onglet} onChange={setOnglet} ariaLabel="Filtrer l'historique" />

      {chargement ? (
        <Card>
          <SkeletonTable rows={6} />
        </Card>
      ) : evenements.length === 0 ? (
        <Card>
          <EmptyState
            icon={<History />}
            title="Aucun événement"
            description="L'historique se remplit à mesure que des notes sont créées, validées et remboursées."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Journal d'activité" description="Les soixante derniers événements." />
          <CardBody>
            <Timeline
              evenements={evenements.map((e) => ({
                id: e.id,
                quand: e.quand,
                auteur: `${e.auteur} · ${e.numero} · ${e.demandeur}`,
                libelle: e.libelle,
                detail: e.detail,
                tone: e.tone,
              }))}
            />
          </CardBody>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={() => navigate('/notes-de-frais')}>Retour au tableau de bord</Button>
      </div>
    </Page>
  )
}
