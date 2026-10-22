import { usePageTitle } from '@/hooks/usePageTitle'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Ban, Bell, CalendarDays, Check, HelpCircle, MapPin, Paperclip, Pencil, Trash2, X } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Menu } from '@/components/ui/Menu'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { AgendaNav, cleReponse, cleStatutEvt } from '@/components/agenda/AgendaNav'
import { useAgenda } from '@/context/AgendaContext'
import { useProjets } from '@/context/ProjetsContext'
import { useToast } from '@/context/ToastContext'
import {
  creneauDe,
  delaiLabels,
  detecterConflits,
  dureeMinutes,
  recurrenceLabels,
  reponseLabels,
  statutEvenementLabels,
  type ReponseParticipant,
} from '@/lib/agenda'
import { formatDate, formatDateLong } from '@/lib/utils'

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
      <dt className="text-[0.8125rem] text-ink-500">{label}</dt>
      <dd className="ac-num text-right text-[0.8125rem] font-medium text-ink-900">{children}</dd>
    </div>
  )
}

export function EvenementFiche() {
  usePageTitle('Événement')

  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { evenementParId, evenements, calendriers, salles, chargement, repondre, annuler, supprimer, retirerParticipant } = useAgenda()
  const { projets } = useProjets()

  const [annulationOuverte, setAnnulationOuverte] = useState(false)
  const [motif, setMotif] = useState('')
  const [aSupprimer, setASupprimer] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const e = evenementParId(id)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Événement" />}>
        <AgendaNav />
        <Card className="p-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-4 h-3 w-full" />
        </Card>
      </Page>
    )
  }

  if (!e) {
    return (
      <Page header={<PageHeader title="Événement introuvable" />}>
        <AgendaNav />
        <Card>
          <EmptyState
            icon={<CalendarDays />}
            title="Cet événement n'existe plus"
            description="Il a peut-être été supprimé par son organisateur."
            action={<Button variant="primary" onClick={() => navigate('/agenda')}>Retour à l'agenda</Button>}
          />
        </Card>
      </Page>
    )
  }

  const calendrier = calendriers.find((c) => c.id === e.calendrierId)
  const salle = salles.find((s) => s.id === e.salleId)
  const projet = projets.find((p) => p.id === e.projetId)
  const moi = e.participants.find((p) => p.estMoi)
  const conflits = e.statut === 'annule' ? [] : detecterConflits(e, evenements, salles)
  const requis = e.participants.filter((p) => p.requis)
  const acceptes = e.participants.filter((p) => p.reponse === 'accepte').length
  const passe = new Date(e.debut) < new Date()

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, apres?: () => void) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      apres?.()
    } catch (err) {
      toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const repondrePour = (reponse: ReponseParticipant) => {
    if (!moi) return
    void executer(() => repondre(e.id, moi.id, reponse), {
      titre: `Réponse enregistrée : ${reponseLabels[reponse].toLowerCase()}`,
      detail: `L'organisateur est prévenu pour « ${e.titre} ».`,
    })
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow={`Agenda · ${calendrier?.nom ?? ''}`}
          title={e.titre}
          description={`${formatDateLong(e.debut)} · ${creneauDe(e)}`}
          meta={
            <>
              <StatusBadge status={cleStatutEvt[e.statut]} />
              {conflits.length > 0 && <StatusBadge status="conflit_horaire" />}
              {e.recurrence !== 'aucune' && <Badge variant="outline">{recurrenceLabels[e.recurrence]}</Badge>}
              {e.actionAssociative && <Badge>{e.actionAssociative}</Badge>}
            </>
          }
          actions={
            <>
              <Button onClick={() => navigate('/agenda')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Agenda
              </Button>
              {e.statut !== 'annule' && (
                <Button onClick={() => navigate(`/agenda/${e.id}/modifier`)} iconLeft={<Pencil aria-hidden className="h-4 w-4" />}>
                  Modifier
                </Button>
              )}
              {moi && e.statut !== 'annule' && !passe && (
                <>
                  <Button variant="ghost" onClick={() => repondrePour('refuse')} loading={enCours} iconLeft={<X aria-hidden className="h-4 w-4" />}>
                    Refuser
                  </Button>
                  <Button variant="primary" onClick={() => repondrePour('accepte')} loading={enCours} iconLeft={<Check aria-hidden className="h-4 w-4" />}>
                    Accepter
                  </Button>
                </>
              )}
              <Menu
                label={`Autres actions pour ${e.titre}`}
                items={[
                  ...(moi && e.statut !== 'annule'
                    ? [{ label: 'Répondre « peut-être »', icon: <HelpCircle />, onSelect: () => repondrePour('peut_etre') }]
                    : []),
                  ...(e.statut !== 'annule'
                    ? [{ label: 'Annuler l’événement', icon: <Ban />, danger: true, onSelect: () => { setMotif(''); setAnnulationOuverte(true) } }]
                    : []),
                  { type: 'separator' as const },
                  { label: 'Supprimer définitivement', icon: <Trash2 />, danger: true, onSelect: () => setASupprimer(true) },
                ]}
                trigger={({ toggle, open, ref }) => (
                  <Button ref={ref} variant="icon" label="Autres actions" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                    <span aria-hidden className="text-lg leading-none">⋯</span>
                  </Button>
                )}
              />
            </>
          }
        />
      }
    >
      <AgendaNav />

      {e.statut === 'annule' && (
        <Alert tone="danger" titre="Événement annulé">
          <strong>Motif : </strong>
          {e.motifAnnulation} Les participants ont été prévenus ; le créneau et la salle sont libérés.
        </Alert>
      )}

      {e.statut === 'provisoire' && (
        <Alert tone="warning" titre="Événement provisoire">
          La date n'est pas arrêtée. Les participants sont informés mais l'événement n'engage encore personne.
        </Alert>
      )}

      {conflits.length > 0 && (
        <Alert tone="danger" titre={`${conflits.length} conflit(s) d'horaire`}>
          <ul className="mt-1 flex flex-col gap-1">
            {conflits.map((c, i) => (
              <li key={i} className="flex gap-2">
                <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {c.detail}{' '}
                  <button type="button" onClick={() => navigate(`/agenda/${c.evenement.id}`)} className="font-medium underline-offset-2 hover:underline">
                    Ouvrir l'événement concerné
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {moi && moi.reponse === 'attente' && e.statut !== 'annule' && !passe && (
        <Alert tone="warning" titre="Votre réponse est attendue">
          L'organisateur a besoin de connaître le nombre de présents pour préparer la séance.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Description" />
            <CardBody>
              <p className="text-[0.8125rem] leading-relaxed text-ink-700">
                {e.description || <span className="text-ink-500">Aucune description.</span>}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Participants"
              description={`${acceptes} accepté(s) sur ${e.participants.length} convié(s), dont ${requis.length} en présence requise.`}
              action={<Button size="sm" onClick={() => navigate('/agenda/disponibilites')}>Voir les disponibilités</Button>}
            />
            <ul className="divide-y divide-ink-100">
              {e.participants.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Avatar name={p.nom} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-900">
                      {p.nom}
                      {p.estMoi && <Badge variant="brand">Moi</Badge>}
                      {p.nom === e.organisateur && <Badge variant="outline">Organisateur</Badge>}
                    </span>
                    <span className="ac-num block truncate text-xs text-ink-500">{p.email}</span>
                  </span>
                  <Badge variant="outline">{p.requis ? 'Requis' : 'Facultatif'}</Badge>
                  <StatusBadge status={cleReponse[p.reponse]} />
                  {e.statut !== 'annule' && !p.estMoi && (
                    <Button
                      variant="icon"
                      size="sm"
                      label={`Retirer ${p.nom}`}
                      className="text-ink-500 hover:text-danger-600"
                      onClick={() => void executer(() => retirerParticipant(e.id, p.id), { titre: 'Participant retiré', detail: p.nom })}
                    >
                      <Trash2 aria-hidden className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </Card>

          {e.piecesJointes.length > 0 && (
            <Card>
              <CardHeader title="Pièces jointes" />
              <ul className="divide-y divide-ink-100">
                {e.piecesJointes.map((pj) => (
                  <li key={pj.id} className="flex items-center gap-3 px-5 py-2.5">
                    <Paperclip aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                    <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-ink-900">{pj.nom}</span>
                    <span className="ac-num text-xs text-ink-500">{pj.taille}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Détails" />
            <CardBody className="py-0">
              <dl>
                <Ligne label="Date">{formatDateLong(e.debut)}</Ligne>
                <Ligne label="Horaire">{creneauDe(e)}</Ligne>
                {!e.journeeEntiere && <Ligne label="Durée">{dureeMinutes(e)} min</Ligne>}
                <Ligne label="Récurrence">{recurrenceLabels[e.recurrence]}</Ligne>
                {e.recurrenceFinLe && <Ligne label="Jusqu’au">{formatDate(e.recurrenceFinLe)}</Ligne>}
                <Ligne label="Statut">{statutEvenementLabels[e.statut]}</Ligne>
                <Ligne label="Organisateur">{e.organisateur}</Ligne>
                <Ligne label="Calendrier">{calendrier?.nom ?? '—'}</Ligne>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Lieu" />
            <CardBody className="flex flex-col gap-2">
              <p className="flex items-start gap-2 text-[0.8125rem] text-ink-800">
                <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                {e.lieu || 'Non précisé'}
              </p>
              {salle && (
                <div className="rounded-lg border border-ink-200 bg-ink-25 p-3">
                  <p className="text-[0.8125rem] font-medium text-ink-900">{salle.nom}</p>
                  <p className="ac-num mt-0.5 text-xs text-ink-500">{salle.capacite} places · {salle.equipements.join(', ')}</p>
                  {requis.length > salle.capacite && (
                    <p className="mt-1.5 text-xs font-medium text-warning-600">
                      {requis.length} personnes attendues pour {salle.capacite} places.
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Rattachement" />
            <CardBody className="py-0">
              <dl>
                <Ligne label="Projet">
                  {projet ? (
                    <button type="button" onClick={() => navigate(`/projets/${projet.id}`)} className="underline-offset-2 hover:underline">
                      {projet.code}
                    </button>
                  ) : (
                    'Hors projet'
                  )}
                </Ligne>
                <Ligne label="Action associative">{e.actionAssociative ?? 'Non catégorisé'}</Ligne>
                <Ligne label="Référence">{e.reference}</Ligne>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Rappels" />
            {e.notifications.length === 0 ? (
              <EmptyState icon={<Bell />} title="Aucun rappel" description="Les participants ne seront pas prévenus." compact />
            ) : (
              <ul className="divide-y divide-ink-100">
                {e.notifications.map((n) => (
                  <li key={n.id} className="flex items-center gap-2.5 px-5 py-2.5">
                    <Bell aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                    <span className="flex-1 text-[0.8125rem] text-ink-800">{delaiLabels[n.delaiMinutes] ?? `${n.delaiMinutes} min avant`}</span>
                    <Badge variant="outline">{n.canal === 'email' ? 'Courriel' : 'Application'}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={annulationOuverte}
        onClose={() => setAnnulationOuverte(false)}
        title={`Annuler « ${e.titre} » ?`}
        description="L'événement reste visible dans l'agenda, barré, avec son motif. La salle est libérée."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAnnulationOuverte(false)} disabled={enCours}>Revenir</Button>
            <Button
              variant="danger"
              loading={enCours}
              disabled={!motif.trim()}
              onClick={() => {
                const m = motif
                setAnnulationOuverte(false)
                void executer(() => annuler(e.id, m), { titre: 'Événement annulé', detail: `${e.participants.length} participant(s) prévenus.` })
              }}
            >
              Annuler l'événement
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
            {e.participants.length} participant(s) recevront la notification d'annulation avec le motif que vous
            indiquez.
          </div>
          <Field label="Motif de l’annulation" required hint="Sans motif, les participants ne sauront pas si la séance est reportée ou supprimée.">
            {(p) => <Textarea {...p} rows={3} value={motif} onChange={(ev) => setMotif(ev.target.value)} placeholder="Salle indisponible, séance reportée à la semaine suivante." />}
          </Field>
          {!motif.trim() && <p className="text-xs font-medium text-warning-600">Le motif est obligatoire.</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(false)}
        onConfirm={() => {
          setASupprimer(false)
          void executer(() => supprimer(e.id), { titre: 'Événement supprimé', detail: e.titre }, () => navigate('/agenda'))
        }}
        title={`Supprimer « ${e.titre} » ?`}
        description="L'événement disparaît de tous les agendas, sans notification aux participants. Pour prévenir les participants, préférez l'annulation avec motif."
        confirmLabel="Supprimer définitivement"
      />
    </Page>
  )
}
