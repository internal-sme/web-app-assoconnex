import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone, PencilLine, Plus, Send, Trash2, UserRound } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid } from '@/components/data/DataGrid'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { CampNav, CampOutils } from '@/components/campagnes/CampNav'
import { useCampagnes } from '@/context/CampagnesContext'
import {
  cibleNom,
  statutCampagneLabels,
  statutCampagneStatusKey,
  statsCampagne,
  type Campagne,
} from '@/lib/campagnes'
import { formatDate } from '@/lib/utils'

type Vue = 'toutes' | 'brouillons' | 'programmees' | 'envoyees' | 'echecs'

const vues: { id: Vue; label: string }[] = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'brouillons', label: 'Brouillons' },
  { id: 'programmees', label: 'Programmées' },
  { id: 'envoyees', label: 'Envoyées' },
  { id: 'echecs', label: 'En échec' },
]

export function CampListe() {
  usePageTitle("Campagnes d'emailing")

  const navigate = useNavigate()
  const { campagnes, chargement, supprimer } = useCampagnes()
  const [vue, setVue] = useState<Vue>('toutes')
  const [aSupprimer, setASupprimer] = useState<Campagne | null>(null)
  const [suppression, setSuppression] = useState(false)

  const filtrees =
    vue === 'toutes'
      ? campagnes
      : vue === 'brouillons'
        ? campagnes.filter((c) => c.statut === 'brouillon')
        : vue === 'programmees'
          ? campagnes.filter((c) => c.statut === 'programmee')
          : vue === 'envoyees'
            ? campagnes.filter((c) => c.statut === 'envoyee')
            : campagnes.filter((c) => c.statut === 'echec')

  const counts: Record<Vue, number> = {
    toutes: campagnes.length,
    brouillons: campagnes.filter((c) => c.statut === 'brouillon').length,
    programmees: campagnes.filter((c) => c.statut === 'programmee').length,
    envoyees: campagnes.filter((c) => c.statut === 'envoyee').length,
    echecs: campagnes.filter((c) => c.statut === 'echec').length,
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Campagne d’emailing"
          title="Campagnes"
          description="Toutes les campagnes de l'association, quel que soit leur état."
          actions={
            <>
              <CampOutils />
              <Button variant="primary" onClick={() => navigate('/campagnes-emailing/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouvelle campagne
              </Button>
            </>
          }
        />
      }
    >
      <CampNav />
      <Tabs
        items={vues.map((v) => ({ id: v.id, label: v.label, count: counts[v.id] }))}
        value={vue}
        onChange={(id) => setVue(id as Vue)}
        ariaLabel="Filtrer les campagnes par état"
      />

      <ConfirmDialog
        open={!!aSupprimer}
        onClose={() => setASupprimer(null)}
        onConfirm={async () => {
          if (!aSupprimer) return
          setSuppression(true)
          await supprimer(aSupprimer.id)
          setSuppression(false)
          setASupprimer(null)
        }}
        loading={suppression}
        title="Supprimer cette campagne ?"
        description={`« ${aSupprimer?.nom ?? ''} » sera effacée définitivement. Les statistiques d'envoi disparaîtront avec elle.`}
        confirmLabel="Supprimer"
      />

      <Card>
        {chargement ? (
          <CardBody>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardBody>
        ) : filtrees.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Megaphone />}
              title={vue === 'toutes' ? 'Aucune campagne pour le moment' : 'Aucune campagne dans cette vue'}
              description="Créez une campagne pour lancer votre premier envoi groupé."
              action={<Button variant="primary" onClick={() => navigate('/campagnes-emailing/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>Créer une campagne</Button>}
            />
          </CardBody>
        ) : (
          <CardBody>
            <DataGrid
              rows={filtrees}
              caption="Liste des campagnes d’emailing."
              searchKeys={(r) => `${r.nom} ${r.objet} ${cibleNom(r.cible)} ${statutCampagneLabels[r.statut]}`}
              searchPlaceholder="Rechercher une campagne…"
              onRowClick={(r) => navigate(`/campagnes-emailing/${r.id}`)}
              getRowLabel={(r) => r.nom}
              rowActions={[
                { label: 'Ouvrir', icon: <PencilLine aria-hidden className="text-ink-500" />, onSelect: (r) => navigate(`/campagnes-emailing/${r.id}`) },
                { label: 'Modifier', icon: <PencilLine aria-hidden className="text-ink-500" />, onSelect: (r) => navigate(`/campagnes-emailing/nouvelle?brouillon=${r.id}`) },
                { label: 'Supprimer', icon: <Trash2 aria-hidden className="text-danger-600" />, danger: true, separatorBefore: true, onSelect: (r) => setASupprimer(r) },
              ]}
              columns={[
                {
                  id: 'nom',
                  header: 'Campagne',
                  cell: (r) => (
                    <span className="block">
                      <span className="block max-w-60 truncate font-medium text-ink-900">{r.nom}</span>
                      <span className="block max-w-60 truncate text-xs text-ink-500">{r.objet || 'Sans objet'}</span>
                    </span>
                  ),
                  sortValue: (r) => r.nom,
                },
                {
                  id: 'statut',
                  header: 'Statut',
                  cell: (r) => <StatusBadge status={statutCampagneStatusKey[r.statut]} />,
                },
                {
                  id: 'cible',
                  header: 'Destinataires',
                  cell: (r) => (
                    <span className="flex items-center gap-1.5">
                      <UserRound aria-hidden className="h-3.5 w-3.5 text-ink-400" />
                      {r.statut === 'envoyee' ? r.destinataires.length : '—'}
                    </span>
                  ),
                  sortValue: (r) => r.destinataires.length,
                },
                {
                  id: 'ouverture',
                  header: 'Ouverture',
                  cell: (r) => (r.statut === 'envoyee' ? `${statsCampagne(r).tauxOuverture} %` : '—'),
                  align: 'right',
                },
                {
                  id: 'date',
                  header: 'Créée le',
                  cell: (r) => (
                    <span className="flex items-center gap-1.5 text-ink-600">
                      <Send aria-hidden className="h-3.5 w-3.5 text-ink-400" />
                      {formatDate(r.creeLe)}
                    </span>
                  ),
                  sortValue: (r) => r.creeLe,
                },
              ]}
            />
          </CardBody>
        )}
      </Card>
    </Page>
  )
}