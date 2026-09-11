import { useState } from 'react'
import { UserRoundCheck, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { CampNav, CampOutils } from '@/components/campagnes/CampNav'
import { useCampagnes } from '@/context/CampagnesContext'
import { useToast } from '@/context/ToastContext'
import { formatDateTime } from '@/lib/utils'

export function Desinscriptions() {
  const { desinscriptions, chargement, reinscrire } = useCampagnes()
  const { toast } = useToast()

  const reinscrireTout = async () => {
    for (const d of [...desinscriptions]) {
      await reinscrire(d.id)
    }
    toast({ titre: 'Désinscriptions levées', detail: 'Toutes les personnes redeviennent joignables pour les prochains envois.', tone: 'success' })
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Campagne d’emailing"
          title="Désinscriptions"
          description="Le registre des personnes qui se sont retirées des envois. Les demandes sont définitives, comme la loi l'exige."
          actions={
            <>
              <CampOutils />
              <ConfirmReinscrire
                count={desinscriptions.length}
                disabled={desinscriptions.length === 0}
                onConfirm={reinscrireTout}
              />
            </>
          }
        />
      }
    >
      <CampNav />

      <Card>
        {chargement ? (
          <CardBody>
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardBody>
        ) : desinscriptions.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Users />}
              title="Aucune désinscription"
              description="Personne ne s'est retiré des envois ; chaque message peut partir en toute confiance."
            />
          </CardBody>
        ) : (
          <>
            <CardHeader
              title="Registre des retraits"
              description="Une personne désinscrite n'apparaît plus dans le décompte des destinataires des prochaines campagnes."
            />
            <CardBody>
              <ul className="divide-y divide-ink-100">
                {desinscriptions.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-[0.8125rem] font-medium text-ink-900">
                        {d.prenom} {d.nom}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {d.email} — après « {d.campagneNom} » le {formatDateTime(d.quand)}
                      </p>
                      {d.motif && <p className="mt-0.5 text-xs italic text-ink-500">« {d.motif} »</p>}
                    </div>
                    <ConfirmReinscrireUne
                      nom={`${d.prenom} ${d.nom}`}
                      onConfirm={async () => {
                        await reinscrire(d.id)
                        toast({ titre: 'Désinscription levée', detail: `${d.prenom} redevient joignable pour les prochains envois.`, tone: 'success' })
                      }}
                    />
                  </li>
                ))}
              </ul>
            </CardBody>
          </>
        )}
      </Card>
    </Page>
  )
}

function ConfirmReinscrire({ count, disabled, onConfirm }: { count: number; disabled: boolean; onConfirm: () => void }) {
  return (
    <ConfirmPreset
      disabled={disabled}
      actionLabel={`Réinscrire tou${count > 1 ? 't' : 'e'}s (${count})`}
      title="Réinscrire toutes les personnes ?"
      description="Toutes les désinscriptions seront levées et ces personnes redeviendront joignables. Les préférences de communication seront ignorées."
      onConfirm={onConfirm}
      tone="primary"
    />
  )
}

function ConfirmReinscrireUne({ nom, onConfirm }: { nom: string; onConfirm: () => void }) {
  return (
    <ConfirmPreset
      actionLabel="Réinscrire"
      title="Réinscrire cette personne ?"
      description={`${nom} recevra à nouveau vos envois groupés, sauf aventure de son consentement.`}
      onConfirm={onConfirm}
      tone="primary"
    />
  )
}

function ConfirmPreset({
  actionLabel,
  title,
  description,
  onConfirm,
  disabled,
  tone = 'primary',
}: {
  actionLabel: string
  title: string
  description: string
  onConfirm: () => Promise<void> | void
  disabled?: boolean
  tone?: 'primary' | 'danger'
}) {
  const [open, setOpen] = useState(false)
  const [enCours, setEnCours] = useState(false)
  return (
    <>
      <Button
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
        iconLeft={<UserRoundCheck aria-hidden className="h-4 w-4" />}
      >
        {actionLabel}
      </Button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          setEnCours(true)
          try {
            await onConfirm()
            setOpen(false)
          } finally {
            setEnCours(false)
          }
        }}
        loading={enCours}
        title={title}
        description={description}
        confirmLabel={actionLabel}
        tone={tone}
      />
    </>
  )
}