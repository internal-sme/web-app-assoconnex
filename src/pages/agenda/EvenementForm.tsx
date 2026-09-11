import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Bell, CalendarDays, Paperclip, Plus, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch, Checkbox } from '@/components/ui/Toggle'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { AgendaNav } from '@/components/agenda/AgendaNav'
import { useAgenda } from '@/context/AgendaContext'
import { useProjets } from '@/context/ProjetsContext'
import { useActions } from '@/context/ActionsContext'
import { useToast } from '@/context/ToastContext'
import {
  MOI_AGENDA,
  delaiLabels,
  detecterConflits,
  personnes,
  recurrenceLabels,
  type EvenementAgenda,
  type Notification,
  type Participant,
  type Recurrence,
  type StatutEvenement,
} from '@/lib/agenda'
import { formatDate, uid } from '@/lib/utils'

function partiesDe(iso: string) {
  const d = new Date(iso)
  return {
    date: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`,
    heure: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
  }
}

function assembler(date: string, heure: string) {
  const [a, m, j] = date.split('-').map(Number)
  const [h, min] = heure.split(':').map(Number)
  return new Date(Date.UTC(a, m - 1, j, h || 0, min || 0)).toISOString()
}

export function EvenementForm({ mode }: { mode: 'creation' | 'modification' }) {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { evenementParId, evenements, calendriers, salles, creer, modifier } = useAgenda()
  const { projets } = useProjets()
  const { actions } = useActions()

  const source = mode === 'modification' ? evenementParId(id) : undefined
  const depart = source ? partiesDe(source.debut) : { date: new Date().toISOString().slice(0, 10), heure: '18:00' }
  const arrivee = source ? partiesDe(source.fin) : { date: new Date().toISOString().slice(0, 10), heure: '19:30' }

  const [titre, setTitre] = useState(source?.titre ?? '')
  const [description, setDescription] = useState(source?.description ?? '')
  const [dateDebut, setDateDebut] = useState(depart.date)
  const [heureDebut, setHeureDebut] = useState(depart.heure)
  const [dateFin, setDateFin] = useState(arrivee.date)
  const [heureFin, setHeureFin] = useState(arrivee.heure)
  const [journeeEntiere, setJourneeEntiere] = useState(source?.journeeEntiere ?? false)
  const [recurrence, setRecurrence] = useState<Recurrence>(source?.recurrence ?? 'aucune')
  const [recurrenceFin, setRecurrenceFin] = useState(source?.recurrenceFinLe ? partiesDe(source.recurrenceFinLe).date : '')
  const [lieu, setLieu] = useState(source?.lieu ?? '')
  const [salleId, setSalleId] = useState(source?.salleId ?? '')
  const [calendrierId, setCalendrierId] = useState(source?.calendrierId ?? calendriers[0]?.id ?? '')
  const [participants, setParticipants] = useState<Participant[]>(
    source?.participants ?? [
      { id: uid('pa'), nom: MOI_AGENDA.nom, email: MOI_AGENDA.email, reponse: 'accepte', requis: true, estMoi: true },
    ],
  )
  const [projetId, setProjetId] = useState(source?.projetId ?? '')
  const [action, setAction] = useState(source?.actionAssociative ?? '')
  const [pieces, setPieces] = useState(source?.piecesJointes ?? [])
  const [nomPiece, setNomPiece] = useState('')
  const [notifications, setNotifications] = useState<Notification[]>(
    source?.notifications ?? [{ id: uid('nt'), delaiMinutes: 30, canal: 'application' }],
  )
  const [statut, setStatut] = useState<StatutEvenement>(source?.statut ?? 'confirme')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  if (mode === 'modification' && !source) {
    return (
      <Page header={<PageHeader title="Événement introuvable" />}>
        <Card>
          <EmptyState
            icon={<CalendarDays />}
            title="Cet événement n'existe plus"
            description="Il a peut-être été supprimé."
            action={<Button variant="primary" onClick={() => navigate('/agenda')}>Retour à l'agenda</Button>}
          />
        </Card>
      </Page>
    )
  }

  const debut = journeeEntiere ? assembler(dateDebut, '00:00') : assembler(dateDebut, heureDebut)
  const fin = journeeEntiere ? assembler(dateFin || dateDebut, '23:59') : assembler(dateFin || dateDebut, heureFin)

  // Conflits calculés en direct, à chaque changement de créneau ou de salle
  const provisoire: EvenementAgenda = {
    id: source?.id ?? 'nouveau',
    reference: source?.reference ?? '',
    titre: titre || 'Nouvel événement',
    description,
    debut,
    fin,
    journeeEntiere,
    lieu,
    salleId: salleId || null,
    recurrence,
    recurrenceFinLe: null,
    calendrierId,
    organisateur: MOI_AGENDA.nom,
    participants,
    projetId: projetId || null,
    actionAssociative: action || null,
    piecesJointes: pieces,
    notifications,
    statut,
    motifAnnulation: '',
  }
  const conflits = new Date(fin) > new Date(debut) ? detecterConflits(provisoire, evenements, salles) : []

  const valider = () => {
    const e: Record<string, string> = {}
    if (!titre.trim()) e.titre = 'Donnez un titre à l’événement.'
    if (!dateDebut) e.dateDebut = 'Indiquez la date de début.'
    if (!journeeEntiere && new Date(fin) <= new Date(debut)) e.heureFin = 'L’heure de fin doit être postérieure à l’heure de début.'
    if (journeeEntiere && dateFin && dateFin < dateDebut) e.dateFin = 'La date de fin ne peut pas précéder la date de début.'
    if (recurrence !== 'aucune' && recurrenceFin && recurrenceFin < dateDebut) e.recurrenceFin = 'La fin de récurrence doit suivre la première occurrence.'
    if (participants.length === 0) e.participants = 'Ajoutez au moins un participant.'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const enregistrer = async () => {
    if (!valider()) return
    setErreurGlobale(null)
    setEnCours(true)
    try {
      const donnees = {
        titre: titre.trim(),
        description: description.trim(),
        debut,
        fin,
        journeeEntiere,
        lieu: lieu.trim(),
        salleId: salleId || null,
        recurrence,
        recurrenceFinLe: recurrence !== 'aucune' && recurrenceFin ? assembler(recurrenceFin, '23:59') : null,
        calendrierId,
        organisateur: source?.organisateur ?? MOI_AGENDA.nom,
        participants,
        projetId: projetId || null,
        actionAssociative: action || null,
        piecesJointes: pieces,
        notifications,
        statut,
      }
      if (mode === 'creation') {
        const cree = await creer(donnees)
        toast({ titre: 'Événement créé', detail: `${cree.titre} — ${formatDate(cree.debut)}.`, tone: 'success' })
        navigate(`/agenda/${cree.id}`)
      } else {
        await modifier(source!.id, donnees)
        toast({ titre: 'Événement modifié', detail: titre.trim(), tone: 'success' })
        navigate(`/agenda/${source!.id}`)
      }
    } catch (err) {
      setErreurGlobale((err as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const emailsChoisis = participants.map((p) => p.email)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Agenda"
          title={mode === 'creation' ? 'Nouvel événement' : `Modifier « ${source!.titre} »`}
          description="Les conflits de salle et de participants sont signalés au fil de la saisie, avant l'enregistrement."
          actions={
            <Button
              onClick={() => navigate(mode === 'creation' ? '/agenda' : `/agenda/${id}`)}
              iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}
            >
              Annuler
            </Button>
          }
        />
      }
    >
      <AgendaNav />

      {erreurGlobale && (
        <Alert tone="danger" titre="Enregistrement impossible">
          {erreurGlobale} Vos saisies sont conservées.
        </Alert>
      )}

      {conflits.length > 0 && (
        <Alert tone="danger" titre={`${conflits.length} conflit(s) sur ce créneau`}>
          <ul className="mt-1 flex flex-col gap-1">
            {conflits.map((c, i) => (
              <li key={i} className="flex gap-2">
                <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{c.detail}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2">
            L'enregistrement reste possible : à vous de trancher. Changez de salle ou de créneau si le chevauchement
            n'est pas voulu.
          </p>
        </Alert>
      )}

      <Card>
        <CardHeader title="L'événement" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre" required error={erreurs.titre} className="sm:col-span-2">
            {(p) => <Input {...p} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Réunion de bureau" />}
          </Field>
          <Field label="Description" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ordre du jour, points à préparer…" />}
          </Field>
          <Field label="Calendrier" required hint="Détermine qui verra l’événement et sa couleur.">
            {(p) => (
              <Select {...p} value={calendrierId} onChange={(e) => setCalendrierId(e.target.value)} options={calendriers.map((c) => ({ value: c.id, label: c.nom }))} />
            )}
          </Field>
          <Field label="Statut" required hint="Un événement provisoire n’engage pas encore les participants.">
            {(p) => (
              <Select
                {...p}
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutEvenement)}
                options={[
                  { value: 'confirme', label: 'Confirmé' },
                  { value: 'provisoire', label: 'Provisoire' },
                ]}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Date et heure" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Switch
              label="Journée entière"
              description="Masque les heures et occupe la journée complète."
              checked={journeeEntiere}
              onCheckedChange={setJourneeEntiere}
            />
          </div>
          <Field label="Date de début" required error={erreurs.dateDebut}>
            {(p) => <Input {...p} type="date" value={dateDebut} onChange={(e) => { setDateDebut(e.target.value); if (!dateFin || dateFin < e.target.value) setDateFin(e.target.value) }} />}
          </Field>
          <Field label={journeeEntiere ? 'Date de fin' : 'Heure de début'} required error={erreurs.dateFin}>
            {(p) =>
              journeeEntiere ? (
                <Input {...p} type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              ) : (
                <Input {...p} type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} />
              )
            }
          </Field>
          {!journeeEntiere && (
            <>
              <Field label="Date de fin" required>
                {(p) => <Input {...p} type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />}
              </Field>
              <Field label="Heure de fin" required error={erreurs.heureFin}>
                {(p) => <Input {...p} type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} />}
              </Field>
            </>
          )}
          <Field label="Récurrence" required>
            {(p) => (
              <Select
                {...p}
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as Recurrence)}
                options={(Object.keys(recurrenceLabels) as Recurrence[]).map((r) => ({ value: r, label: recurrenceLabels[r] }))}
              />
            )}
          </Field>
          {recurrence !== 'aucune' && (
            <Field label="Fin de la récurrence" error={erreurs.recurrenceFin} hint="Laissez vide pour une répétition sans fin.">
              {(p) => <Input {...p} type="date" value={recurrenceFin} onChange={(e) => setRecurrenceFin(e.target.value)} />}
            </Field>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Lieu" description="Le choix d'une salle déclenche la détection de conflit de réservation." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Lieu" hint="Adresse ou indication libre.">
            {(p) => <Input {...p} value={lieu} onChange={(e) => setLieu(e.target.value)} placeholder="Maison des associations" />}
          </Field>
          <Field label="Salle" hint="Réservation dans les locaux de l’association.">
            {(p) => (
              <Select
                {...p}
                value={salleId}
                onChange={(e) => setSalleId(e.target.value)}
                placeholder="Aucune salle réservée"
                options={salles.map((s) => ({ value: s.id, label: `${s.nom} — ${s.capacite} places` }))}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Participants" description="Un participant facultatif n'entre pas dans la détection de conflit." />
        <CardBody className="flex flex-col gap-4">
          {erreurs.participants && (
            <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 p-2.5 text-[0.8125rem] text-danger-700">
              {erreurs.participants}
            </p>
          )}
          <Field label="Personnes conviées">
            {(p) => (
              <MultiSelect
                {...p}
                value={emailsChoisis}
                onChange={(emails) =>
                  setParticipants((liste) => {
                    const gardes = liste.filter((x) => emails.includes(x.email))
                    const ajouts = emails
                      .filter((em) => !liste.some((x) => x.email === em))
                      .map((em) => {
                        const base = personnes.find((x) => x.email === em)!
                        return {
                          id: uid('pa'),
                          nom: base.nom,
                          email: base.email,
                          reponse: 'attente' as const,
                          requis: true,
                          estMoi: base.email === MOI_AGENDA.email,
                        }
                      })
                    return [...gardes, ...ajouts]
                  })
                }
                options={personnes.map((x) => ({ value: x.email, label: x.nom }))}
                placeholder="Choisir les participants"
              />
            )}
          </Field>

          {participants.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {participants.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">
                      {p.nom}
                      {p.estMoi && <Badge variant="brand" className="ml-2">Moi</Badge>}
                    </span>
                    <span className="ac-num block truncate text-xs text-ink-500">{p.email}</span>
                  </span>
                  <Checkbox
                    checked={p.requis}
                    onChange={() => setParticipants((l) => l.map((x) => (x.id === p.id ? { ...x, requis: !x.requis } : x)))}
                    label="Présence requise"
                  />
                  <Button
                    variant="icon"
                    size="sm"
                    label={`Retirer ${p.nom}`}
                    className="text-ink-500 hover:text-danger-600"
                    onClick={() => setParticipants((l) => l.filter((x) => x.id !== p.id))}
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Rattachement" description="Permet de retrouver l'événement depuis un projet ou un type d'action." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Projet">
            {(p) => (
              <Select
                {...p}
                value={projetId}
                onChange={(e) => setProjetId(e.target.value)}
                placeholder="Hors projet"
                options={projets.filter((x) => x.statut !== 'cloture').map((x) => ({ value: x.id, label: `${x.code} — ${x.nom}` }))}
              />
            )}
          </Field>
          <Field label="Action associative" hint="Rattache l’événement à une action du registre : il apparaîtra sur sa fiche.">
            {(p) => (
              <Select
                {...p}
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="Non rattaché"
                options={actions
                  .filter((x) => !x.annulee)
                  .slice(0, 40)
                  .map((x) => ({ value: x.titre, label: `${x.titre} — ${new Date(x.date).toLocaleDateString('fr-FR')}` }))}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Pièces jointes" description="Ordre du jour, plan d'accès, documents à lire avant la séance." />
        <CardBody className="flex flex-col gap-3">
          {pieces.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {pieces.map((pj) => (
                <li key={pj.id} className="flex items-center gap-3 rounded-lg border border-ink-200 bg-ink-25 px-3 py-2">
                  <Paperclip aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                  <span className="min-w-0 flex-1 truncate text-[0.8125rem] text-ink-900">{pj.nom}</span>
                  <span className="ac-num text-xs text-ink-500">{pj.taille}</span>
                  <Button variant="icon" size="sm" label={`Retirer ${pj.nom}`} className="text-ink-500 hover:text-danger-600" onClick={() => setPieces((l) => l.filter((x) => x.id !== pj.id))}>
                    <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            <Input value={nomPiece} onChange={(e) => setNomPiece(e.target.value)} placeholder="Ordre du jour.pdf" aria-label="Nom de la pièce jointe" className="h-8 text-[0.8125rem]" />
            <Button
              size="sm"
              disabled={!nomPiece.trim()}
              onClick={() => {
                setPieces((l) => [...l, { id: uid('pje'), nom: nomPiece.trim(), taille: '—' }])
                setNomPiece('')
              }}
              iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}
            >
              Joindre
            </Button>
          </div>
          <p className="text-xs text-ink-500">Le dépôt réel de fichiers passe par l'espace documentaire.</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Notifications"
          description="Rappels envoyés aux participants ayant accepté."
          action={
            <Button size="sm" onClick={() => setNotifications((l) => [...l, { id: uid('nt'), delaiMinutes: 60, canal: 'application' }])} iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}>
              Ajouter un rappel
            </Button>
          }
        />
        <CardBody className="flex flex-col gap-2">
          {notifications.length === 0 && <p className="text-[0.8125rem] text-ink-500">Aucun rappel. Les participants ne seront pas prévenus.</p>}
          {notifications.map((n) => (
            <div key={n.id} className="flex flex-wrap items-center gap-2">
              <Bell aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
              <Select
                aria-label="Délai du rappel"
                value={String(n.delaiMinutes)}
                className="h-8 w-52 text-[0.8125rem]"
                onChange={(e) => setNotifications((l) => l.map((x) => (x.id === n.id ? { ...x, delaiMinutes: Number(e.target.value) } : x)))}
                options={Object.keys(delaiLabels).map((d) => ({ value: d, label: delaiLabels[Number(d)] }))}
              />
              <Select
                aria-label="Canal du rappel"
                value={n.canal}
                className="h-8 w-40 text-[0.8125rem]"
                onChange={(e) => setNotifications((l) => l.map((x) => (x.id === n.id ? { ...x, canal: e.target.value as Notification['canal'] } : x)))}
                options={[
                  { value: 'application', label: 'Dans l’application' },
                  { value: 'email', label: 'Par courriel' },
                ]}
              />
              <Button variant="icon" size="sm" label="Retirer ce rappel" className="text-ink-500 hover:text-danger-600" onClick={() => setNotifications((l) => l.filter((x) => x.id !== n.id))}>
                <Trash2 aria-hidden className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours
            ? 'Enregistrement en cours…'
            : conflits.length > 0
              ? `${conflits.length} conflit(s) détecté(s) sur ce créneau.`
              : 'Aucun conflit sur ce créneau.'}
        </p>
        <Button variant="ghost" onClick={() => navigate('/agenda')} disabled={enCours}>Annuler</Button>
        <Button variant="primary" loading={enCours} onClick={() => void enregistrer()}>
          {mode === 'creation' ? 'Créer l’événement' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </Page>
  )
}
