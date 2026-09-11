import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeftRight, Download, RefreshCw, Upload } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Switch } from '@/components/ui/Toggle'
import { StatusBadge } from '@/components/ui/Status'
import { AgendaNav, AgendaOutils } from '@/components/agenda/AgendaNav'
import { useAgenda } from '@/context/AgendaContext'
import { useToast } from '@/context/ToastContext'
import type { CompteSynchro } from '@/lib/agenda'
import { formatDateTime } from '@/lib/utils'

const sensLabels: Record<CompteSynchro['sens'], { label: string; description: string; icone: JSX.Element }> = {
  import: {
    label: 'Import seul',
    description: 'Les événements du service distant apparaissent dans AssoConnex, sans rien y renvoyer.',
    icone: <Download aria-hidden className="h-3.5 w-3.5" />,
  },
  export: {
    label: 'Export seul',
    description: 'Les événements d’AssoConnex sont publiés vers le service distant.',
    icone: <Upload aria-hidden className="h-3.5 w-3.5" />,
  },
  bidirectionnel: {
    label: 'Bidirectionnel',
    description: 'Les deux agendas se tiennent à jour mutuellement.',
    icone: <ArrowLeftRight aria-hidden className="h-3.5 w-3.5" />,
  },
}

const cleEtat = { connecte: 'sync_connecte', erreur: 'sync_erreur', inactif: 'sync_inactif' } as const

export function Synchronisation() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { comptes, chargement, synchroniser, basculerCompte } = useAgenda()
  const [enCours, setEnCours] = useState<string | null>(null)

  const enErreur = comptes.filter((c) => c.etat === 'erreur')
  const connectes = comptes.filter((c) => c.etat === 'connecte')

  const lancer = (c: CompteSynchro) => {
    setEnCours(c.id)
    void (async () => {
      try {
        await synchroniser(c.id)
        toast({ titre: 'Synchronisation terminée', detail: `${c.fournisseur} est à jour.`, tone: 'success' })
      } catch (e) {
        toast({ titre: 'Synchronisation impossible', detail: (e as Error).message, tone: 'danger' })
      } finally {
        setEnCours(null)
      }
    })()
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Agenda"
          title="Synchronisation externe"
          description="Connectez les agendas que vos membres utilisent déjà. Le sens de synchronisation détermine qui fait autorité."
          meta={<Badge variant="brand">{connectes.length} compte(s) actifs</Badge>}
          actions={<AgendaOutils />}
        />
      }
    >
      <AgendaNav />

      {enErreur.length > 0 && (
        <Alert tone="danger" titre={`${enErreur.length} compte(s) en erreur de synchronisation`}>
          Les événements de ces agendas ne remontent plus. Tant que la connexion n'est pas rétablie, l'agenda
          d'AssoConnex peut afficher des créneaux libres qui ne le sont pas réellement.
        </Alert>
      )}

      {comptes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<RefreshCw />}
            title="Aucun agenda connecté"
            description="Reliez un agenda externe pour éviter la double saisie."
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {comptes.map((c) => {
            const sens = sensLabels[c.sens]
            return (
              <Card key={c.id}>
                <CardHeader
                  title={c.fournisseur}
                  description={c.compte}
                  action={<StatusBadge status={cleEtat[c.etat]} />}
                />
                <CardBody className="flex flex-col gap-3">
                  {c.etat === 'erreur' && (
                    <div className="flex gap-2 rounded-lg border border-danger-100 bg-danger-50 p-3 text-[0.8125rem] text-danger-700">
                      <AlertTriangle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{c.message}</span>
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-lg border border-ink-200 bg-ink-25 p-3">
                    <span aria-hidden className="mt-0.5 text-ink-500">{sens.icone}</span>
                    <span className="min-w-0">
                      <span className="block text-[0.8125rem] font-medium text-ink-900">{sens.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{sens.description}</span>
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
                    <div className="flex justify-between gap-2 pr-4">
                      <dt className="text-ink-500">Dernière synchro</dt>
                      <dd className="ac-num font-medium text-ink-800">
                        {c.derniereSynchro ? formatDateTime(c.derniereSynchro) : 'Jamais'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2 pr-4">
                      <dt className="text-ink-500">Événements importés</dt>
                      <dd className="ac-num font-medium text-ink-800">{c.evenementsImportes}</dd>
                    </div>
                  </dl>

                  <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-3">
                    <Button
                      size="sm"
                      loading={enCours === c.id}
                      disabled={c.etat === 'inactif'}
                      onClick={() => lancer(c)}
                      iconLeft={<RefreshCw aria-hidden className="h-3.5 w-3.5" />}
                    >
                      {c.etat === 'erreur' ? 'Reconnecter et réessayer' : 'Synchroniser maintenant'}
                    </Button>
                    <div className="ml-auto">
                      <Switch
                        label="Actif"
                        checked={c.etat !== 'inactif'}
                        onCheckedChange={(v) =>
                          void (async () => {
                            try {
                              await basculerCompte(c.id, v)
                              toast({
                                titre: v ? 'Compte activé' : 'Compte désactivé',
                                detail: v ? `${c.fournisseur} sera synchronisé.` : `${c.fournisseur} ne sera plus interrogé.`,
                                tone: 'success',
                              })
                            } catch (e) {
                              toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
                            }
                          })()
                        }
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader title="Ce que la synchronisation ne fait pas" />
        <CardBody>
          <ul className="flex flex-col gap-2 text-[0.8125rem] leading-relaxed text-ink-700">
            {[
              'Les réponses aux invitations ne remontent pas depuis les agendas externes : un participant qui accepte depuis son téléphone reste « sans réponse » ici.',
              'Les réservations de salle ne sont jamais exportées : elles n’ont de sens que dans AssoConnex, qui seul connaît les locaux.',
              'Un événement supprimé dans AssoConnex n’est retiré de l’agenda distant qu’à la synchronisation suivante.',
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-400" />
                {t}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <div className="flex justify-center">
        <Button onClick={() => navigate('/agenda')}>Retour à l'agenda</Button>
      </div>
      <span className="sr-only" aria-live="polite">{chargement ? 'Chargement' : ''}</span>
    </Page>
  )
}
