import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Archive,
  Building2,
  ChevronLeft,
  Hash,
  Lock,
  MessageCircle,
  Paperclip,
  Pin,
  Plus,
  RefreshCw,
  Settings2,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Menu } from '@/components/ui/Menu'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Select, Textarea } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { ChatNav, ChatOutils } from '@/components/chat/ChatNav'
import { ListeSalons } from '@/components/chat/ListeSalons'
import { Composeur, Message, SeparateurJour } from '@/components/chat/Fil'
import { AvatarPresence, ListeAssociations, PastilleAssociation } from '@/components/chat/Pieces'
import { useChat } from '@/context/ChatContext'
import { useProjets } from '@/context/ProjetsContext'
import { useToast } from '@/context/ToastContext'
import {
  MOI_CHAT,
  associationsChat,
  horodatageCourt,
  interlocuteurDirect,
  membre,
  membresChat,
  messagesDuSalon,
  nomSalon,
  notificationLabels,
  reponsesDe,
  typeSalonLabels,
  visibiliteLabels,
  type MessageChat,
  type NiveauNotification,
  type Salon,
} from '@/lib/chat'
import { formatDate } from '@/lib/utils'

function memeJour(a: string, b: string) {
  return new Date(a).toISOString().slice(0, 10) === new Date(b).toISOString().slice(0, 10)
}

export function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    salons, messages, chargement, erreur, recharger,
    envoyer, reessayer, reagir, epinglerMessage, modifierMessage, supprimerMessage, marquerLu,
    epinglerSalon, archiverSalon, supprimerSalon, reglerNotifications,
    ajouterMembre, retirerMembre, inviterAssociation, retirerAssociation,
  } = useChat()
  const { projets } = useProjets()

  const [filtre, setFiltre] = useState('')
  const [fil, setFil] = useState<MessageChat | null>(null)
  const [enModification, setEnModification] = useState<MessageChat | null>(null)
  const [texteModifie, setTexteModifie] = useState('')
  const [aSupprimerMessage, setASupprimerMessage] = useState<MessageChat | null>(null)
  const [aSupprimerSalon, setASupprimerSalon] = useState(false)
  const [membreARetirer, setMembreARetirer] = useState<string | null>(null)
  const [assoARetirer, setAssoARetirer] = useState<string | null>(null)
  const [inviterOuvert, setInviterOuvert] = useState(false)
  const [assoAInviter, setAssoAInviter] = useState('')
  const [membreAAjouter, setMembreAAjouter] = useState('')
  const [enCours, setEnCours] = useState(false)

  const salon = salons.find((s) => s.id === id) ?? null

  useEffect(() => {
    if (salon) marquerLu(salon.id)
    setFil(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salon?.id])

  const fils = useMemo(() => (salon ? messagesDuSalon(salon.id, messages) : []), [salon, messages])
  const epingles = useMemo(() => (salon ? messages.filter((m) => m.salonId === salon.id && m.epingle && !m.supprime) : []), [salon, messages])
  const fichiers = useMemo(
    () => (salon ? messages.filter((m) => m.salonId === salon.id && !m.supprime).flatMap((m) => m.piecesJointes.map((p) => ({ ...p, auteurId: m.auteurId, quand: m.quand }))) : []),
    [salon, messages],
  )

  const membresDuSalon = salon ? salon.membresIds.map((mid) => membre(mid)).filter(Boolean) : []
  const projet = projets.find((p) => p.id === salon?.projetId)
  const interlocuteur = salon ? interlocuteurDirect(salon) : undefined

  const executer = async (fn: () => Promise<void>, succes?: { titre: string; detail: string }, apres?: () => void) => {
    setEnCours(true)
    try {
      await fn()
      if (succes) toast({ ...succes, tone: 'success' })
      apres?.()
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const enTete = (
    <PageHeader
      eyebrow="Chat collaboratif"
      title="Conversations"
      description="Les échanges instantanés de l'association, et ceux menés avec les associations partenaires."
      actions={
        <>
          <ChatOutils />
          <Button variant="primary" onClick={() => navigate('/chat-collaboratif/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouveau chat
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <ChatNav />
        <Alert tone="danger" titre="Les conversations n'ont pas pu être chargées" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucun message n'a été perdu.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <ChatNav />
        <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
          <Card className="p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-9 w-full" />
            ))}
          </Card>
          <Card className="p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-4 h-72 w-full" />
          </Card>
        </div>
      </Page>
    )
  }

  if (salons.length === 0) {
    return (
      <Page header={enTete}>
        <ChatNav />
        <Card>
          <EmptyState
            icon={<MessageCircle />}
            title="Aucune conversation"
            description="Écrivez directement à quelqu'un, créez un salon pour votre association, ou ouvrez-en un avec une association partenaire."
            action={
              <Button variant="primary" onClick={() => navigate('/chat-collaboratif/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouveau chat
              </Button>
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ChatNav />

      <div className="grid gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)_16rem]">
        {/* Colonne 1 — liste des salons */}
        <Card className={cn('h-[38rem] p-3', salon && 'hidden lg:block')}>
          <ListeSalons salons={salons} messages={messages} courant={salon?.id ?? null} filtre={filtre} onFiltre={setFiltre} />
        </Card>

        {/* Colonne 2 — fil de messages */}
        <Card className="flex h-[38rem] flex-col overflow-hidden">
          {!salon ? (
            <EmptyState
              icon={<MessageCircle />}
              title="Choisissez une conversation"
              description="Sélectionnez une conversation à gauche pour afficher ses messages, ou démarrez-en une nouvelle."
              action={
                <Button variant="primary" onClick={() => navigate('/chat-collaboratif/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                  Nouveau chat
                </Button>
              }
            />
          ) : (
            <>
              <header className="flex flex-wrap items-center gap-2 border-b border-ink-200 px-4 py-3">
                <Button variant="icon" size="sm" label="Retour à la liste" className="lg:hidden" onClick={() => navigate('/chat-collaboratif')}>
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                </Button>
                <span
                  aria-hidden
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    salon.type === 'inter' ? 'bg-success-50 text-success-700' : 'bg-ink-100 text-ink-600',
                  )}
                >
                  {salon.type === 'inter' ? <Building2 className="h-4 w-4" /> : salon.type === 'direct' ? <MessageCircle className="h-4 w-4" /> : salon.visibilite === 'invitation' ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className="truncate font-display text-[0.9375rem] font-semibold text-ink-900">{nomSalon(salon)}</span>
                    {interlocuteur && interlocuteur.associationId !== 'org-1' && <PastilleAssociation membreId={interlocuteur.id} />}
                  </p>
                  <p className="truncate text-xs text-ink-500">
                    {salon.type === 'direct'
                      ? interlocuteur?.enLigne
                        ? 'En ligne'
                        : `Vu ${interlocuteur?.vuLe ? horodatageCourt(interlocuteur.vuLe) : 'il y a longtemps'}`
                      : `${salon.membresIds.length} membres · ${visibiliteLabels[salon.visibilite]}`}
                  </p>
                </div>

                {salon.archive && <StatusBadge status="salon_archive" />}
                {salon.type === 'inter' && !salon.archive && <StatusBadge status="salon_inter" />}

                <Menu
                  label={`Actions sur ${nomSalon(salon)}`}
                  items={[
                    { label: salon.epingle ? 'Retirer des épinglés' : 'Épingler la conversation', icon: <Pin />, onSelect: () => void executer(() => epinglerSalon(salon.id)) },
                    ...(salon.type !== 'direct'
                      ? [
                          { label: 'Paramètres du salon', icon: <Settings2 />, onSelect: () => navigate(`/chat-collaboratif/${salon.id}/parametres`) },
                          {
                            label: salon.archive ? 'Sortir de l’archive' : 'Archiver le salon',
                            icon: <Archive />,
                            onSelect: () =>
                              void executer(() => archiverSalon(salon.id, !salon.archive), {
                                titre: salon.archive ? 'Salon réactivé' : 'Salon archivé',
                                detail: salon.archive ? 'On peut de nouveau y écrire.' : 'Il reste consultable en lecture seule.',
                              }),
                          },
                          { type: 'separator' as const },
                          { label: 'Supprimer le salon', icon: <Trash2 />, danger: true, onSelect: () => setASupprimerSalon(true) },
                        ]
                      : []),
                  ]}
                  trigger={({ toggle, open, ref }) => (
                    <Button ref={ref} variant="icon" size="sm" label="Actions du salon" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                      <span aria-hidden className="text-lg leading-none">⋯</span>
                    </Button>
                  )}
                />
              </header>

              {salon.archive && (
                <div className="border-b border-warning-100 bg-warning-50 px-4 py-2 text-xs text-warning-700">
                  Salon archivé le {formatDate(salon.creeLe)} : consultation seule, plus aucun message ne peut y être ajouté.
                </div>
              )}

              {epingles.length > 0 && (
                <div className="border-b border-ink-100 bg-ink-25 px-4 py-2">
                  <p className="flex items-center gap-1.5 text-[0.5rem] font-semibold uppercase tracking-wide text-ink-500">
                    <Pin aria-hidden className="h-2.5 w-2.5" />
                    {epingles.length} message(s) épinglé(s)
                  </p>
                  {epingles.slice(0, 2).map((m) => (
                    <p key={m.id} className="mt-1 truncate text-2xs text-ink-600">
                      <span className="font-medium text-ink-800">{membre(m.auteurId)?.nom} : </span>
                      {m.contenu}
                    </p>
                  ))}
                </div>
              )}

              <div className="ac-scroll flex-1 overflow-y-auto py-2">
                {fils.length === 0 ? (
                  <EmptyState
                    icon={<MessageCircle />}
                    title="Aucun message dans ce salon"
                    description={
                      salon.archive
                        ? "Ce salon a été archivé sans qu'aucun message n'y soit échangé."
                        : 'Lancez la conversation : le premier message donne souvent le ton du salon.'
                    }
                    compact
                  />
                ) : (
                  fils.map((m, i) => {
                    const precedent = fils[i - 1]
                    const nouveauJour = !precedent || !memeJour(precedent.quand, m.quand)
                    const montrerAuteur = nouveauJour || !precedent || precedent.auteurId !== m.auteurId
                    return (
                      <div key={m.id}>
                        {nouveauJour && <SeparateurJour quand={m.quand} />}
                        <Message
                          message={m}
                          salon={salon}
                          messages={messages}
                          montrerAuteur={montrerAuteur}
                          onRepondre={setFil}
                          onReagir={reagir}
                          onEpingler={(x) => void executer(() => epinglerMessage(x.id))}
                          onModifier={(x) => { setEnModification(x); setTexteModifie(x.contenu) }}
                          onSupprimer={setASupprimerMessage}
                          onReessayer={(x) => void executer(() => reessayer(x.id), { titre: 'Message envoyé', detail: 'Il apparaît dans le fil.' })}
                        />
                      </div>
                    )
                  })
                )}
              </div>

              <Composeur
                salon={salon}
                placeholder={salon.type === 'direct' ? `Écrire à ${interlocuteur?.nom}…` : `Écrire dans ${nomSalon(salon)}…`}
                membresMentionnables={membresDuSalon.map((m) => ({ id: m!.id, nom: m!.nom }))}
                onEnvoyer={(contenu, mentions, pieces) =>
                  void executer(() => envoyer(salon.id, contenu, { mentions, pieces }))
                }
              />
            </>
          )}
        </Card>

        {/* Colonne 3 — membres et fichiers */}
        {salon && (
          <div className="ac-scroll hidden h-[38rem] flex-col gap-4 overflow-y-auto xl:flex">
            {salon.type === 'inter' && (
              <Card>
                <CardHeader
                  title="Associations conviées"
                  description="Chaque association ne voit que ce salon, rien du reste de votre produit."
                  action={
                    !salon.archive ? (
                      <Button size="sm" variant="ghost" onClick={() => { setAssoAInviter(''); setInviterOuvert(true) }}>
                        Inviter
                      </Button>
                    ) : undefined
                  }
                />
                <CardBody className="flex flex-col gap-2">
                  <ListeAssociations ids={salon.associationsIds} />
                  {!salon.archive && salon.associationsIds.filter((a) => a !== 'org-1').length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-t border-ink-100 pt-2">
                      {salon.associationsIds
                        .filter((a) => a !== 'org-1')
                        .map((a) => (
                          <Button key={a} size="sm" variant="ghost" className="text-danger-600" onClick={() => setAssoARetirer(a)}>
                            Retirer {associationsChat.find((x) => x.id === a)?.courte}
                          </Button>
                        ))}
                    </div>
                  )}
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader
                title="Membres"
                description={`${membresDuSalon.length} personne(s)`}
                action={
                  salon.type !== 'direct' && !salon.archive ? (
                    <Menu
                      label="Ajouter un membre"
                      width="w-64"
                      items={membresChat
                        .filter((m) => !salon.membresIds.includes(m.id))
                        .filter((m) => salon.associationsIds.includes(m.associationId))
                        .map((m) => ({
                          label: m.nom,
                          icon: <UserPlus />,
                          onSelect: () => void executer(() => ajouterMembre(salon.id, m.id), { titre: 'Membre ajouté', detail: `${m.nom} rejoint le salon.` }),
                        }))}
                      trigger={({ toggle, open, ref }) => (
                        <Button ref={ref} size="sm" variant="ghost" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                          Ajouter
                        </Button>
                      )}
                    />
                  ) : undefined
                }
              />
              <ul className="divide-y divide-ink-100">
                {membresDuSalon.map((m) => (
                  <li key={m!.id} className="flex items-center gap-2.5 px-5 py-2.5">
                    <AvatarPresence personne={m!} size="xs" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{m!.nom}</span>
                      <span className="block truncate text-2xs text-ink-500">{m!.role}</span>
                    </span>
                    {m!.associationId !== 'org-1' && <PastilleAssociation membreId={m!.id} compact />}
                    {salon.type !== 'direct' && !salon.archive && m!.id !== salon.creePar && m!.id !== MOI_CHAT && (
                      <Button variant="icon" size="sm" label={`Exclure ${m!.nom}`} className="text-ink-500 hover:text-danger-600" onClick={() => setMembreARetirer(m!.id)}>
                        <X aria-hidden className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <CardHeader title="Fichiers partagés" description={`${fichiers.length} fichier(s) dans ce salon`} />
              {fichiers.length === 0 ? (
                <EmptyState icon={<Paperclip />} title="Aucun fichier" description="Les pièces jointes du salon apparaîtront ici." compact />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {fichiers.map((f) => (
                    <li key={f.id} className="flex items-center gap-2.5 px-5 py-2.5">
                      <Paperclip aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-2xs font-medium text-ink-900">{f.nom}</span>
                        <span className="ac-num block truncate text-[0.5rem] text-ink-500">
                          {membre(f.auteurId)?.nom} · {f.taille} · {horodatageCourt(f.quand)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {salon.type !== 'direct' && (
              <Card>
                <CardHeader title="Notifications" />
                <CardBody className="flex flex-col gap-2">
                  <Field label="Ce que je reçois de ce salon">
                    {(p) => (
                      <Select
                        {...p}
                        value={salon.notifications}
                        onChange={(e) => void executer(() => reglerNotifications(salon.id, e.target.value as NiveauNotification))}
                        options={(Object.keys(notificationLabels) as NiveauNotification[]).map((n) => ({ value: n, label: notificationLabels[n] }))}
                      />
                    )}
                  </Field>
                  {projet && (
                    <p className="text-xs text-ink-500">
                      Salon rattaché au projet{' '}
                      <button type="button" onClick={() => navigate(`/projets/${projet.id}`)} className="font-medium text-brand-600 underline-offset-2 hover:underline">
                        {projet.code}
                      </button>
                      .
                    </p>
                  )}
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Fil de réponses */}
      <Modal
        open={!!fil}
        onClose={() => setFil(null)}
        size="lg"
        title="Fil de réponses"
        description={fil ? `${reponsesDe(fil.id, messages).length} réponse(s) au message de ${membre(fil.auteurId)?.nom}.` : ''}
      >
        {fil && salon && (
          <div className="flex flex-col gap-2 py-2">
            <div className="rounded-lg border border-ink-200 bg-ink-25">
              <Message
                message={fil}
                salon={salon}
                messages={messages}
                montrerAuteur
                onReagir={reagir}
                onEpingler={(x) => void executer(() => epinglerMessage(x.id))}
                onModifier={(x) => { setEnModification(x); setTexteModifie(x.contenu) }}
                onSupprimer={setASupprimerMessage}
                onReessayer={(x) => void executer(() => reessayer(x.id))}
                compact
              />
            </div>

            <div className="ac-scroll max-h-72 overflow-y-auto rounded-lg border border-ink-200">
              {reponsesDe(fil.id, messages).length === 0 ? (
                <p className="px-4 py-6 text-center text-[0.8125rem] text-ink-500">Aucune réponse pour l'instant.</p>
              ) : (
                reponsesDe(fil.id, messages).map((r, i, liste) => (
                  <Message
                    key={r.id}
                    message={r}
                    salon={salon}
                    messages={messages}
                    montrerAuteur={i === 0 || liste[i - 1].auteurId !== r.auteurId}
                    onReagir={reagir}
                    onEpingler={(x) => void executer(() => epinglerMessage(x.id))}
                    onModifier={(x) => { setEnModification(x); setTexteModifie(x.contenu) }}
                    onSupprimer={setASupprimerMessage}
                    onReessayer={(x) => void executer(() => reessayer(x.id))}
                    compact
                  />
                ))
              )}
            </div>

            <Composeur
              salon={salon}
              placeholder="Répondre dans ce fil…"
              membresMentionnables={membresDuSalon.map((m) => ({ id: m!.id, nom: m!.nom }))}
              onEnvoyer={(contenu, mentions, pieces) =>
                void executer(() => envoyer(salon.id, contenu, { reponseA: fil.id, mentions, pieces }))
              }
            />
          </div>
        )}
      </Modal>

      {/* Modification d'un message */}
      <Modal
        open={!!enModification}
        onClose={() => setEnModification(null)}
        title="Modifier le message"
        description="La mention « modifié » sera visible de tous."
        footer={
          <>
            <Button variant="ghost" onClick={() => setEnModification(null)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!texteModifie.trim()}
              onClick={() => {
                const m = enModification!
                setEnModification(null)
                void executer(() => modifierMessage(m.id, texteModifie), { titre: 'Message modifié', detail: 'La correction est visible de tous.' })
              }}
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="py-2">
          <Field label="Contenu" required>
            {(p) => <Textarea {...p} rows={4} value={texteModifie} onChange={(e) => setTexteModifie(e.target.value)} />}
          </Field>
        </div>
      </Modal>

      {/* Invitation d'une association partenaire */}
      <Modal
        open={inviterOuvert}
        onClose={() => setInviterOuvert(false)}
        title="Inviter une association partenaire"
        description="Ses membres accéderont aux messages de ce salon, et à rien d'autre de votre espace."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviterOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!assoAInviter}
              onClick={() => {
                const a = assoAInviter
                setInviterOuvert(false)
                void executer(() => inviterAssociation(salon!.id, a), {
                  titre: 'Association invitée',
                  detail: `${associationsChat.find((x) => x.id === a)?.nom} rejoint le salon.`,
                })
              }}
            >
              Inviter
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border border-ink-200 bg-ink-25 p-3 text-[0.8125rem] text-ink-700">
            L'invitation ne donne accès qu'à ce salon. Vos adhérents, votre comptabilité et vos documents restent
            invisibles pour l'association invitée.
          </div>
          <Field label="Association" required>
            {(p) => (
              <Select
                {...p}
                value={assoAInviter}
                onChange={(e) => setAssoAInviter(e.target.value)}
                placeholder="Choisir une association"
                options={associationsChat
                  .filter((a) => !a.interne && !salon?.associationsIds.includes(a.id))
                  .map((a) => ({ value: a.id, label: a.nom }))}
              />
            )}
          </Field>
        </div>
      </Modal>

      {/* Confirmations */}
      <ConfirmDialog
        open={!!aSupprimerMessage}
        loading={enCours}
        onClose={() => setASupprimerMessage(null)}
        onConfirm={() => {
          const m = aSupprimerMessage!
          setASupprimerMessage(null)
          void executer(() => supprimerMessage(m.id), { titre: 'Message supprimé', detail: 'Une trace reste visible dans le fil.' })
        }}
        title={aSupprimerMessage?.auteurId === MOI_CHAT ? 'Supprimer votre message ?' : `Supprimer le message de ${membre(aSupprimerMessage?.auteurId ?? '')?.nom} ?`}
        description={
          aSupprimerMessage?.auteurId === MOI_CHAT
            ? 'Le contenu disparaît pour tout le monde. Une ligne « message supprimé » reste dans le fil.'
            : 'Supprimer le message de quelqu’un d’autre est une décision de modération. L’auteur en sera informé, et une ligne « message supprimé » restera dans le fil.'
        }
        confirmLabel="Supprimer le message"
      />

      <ConfirmDialog
        open={aSupprimerSalon}
        loading={enCours}
        onClose={() => setASupprimerSalon(false)}
        onConfirm={() => {
          setASupprimerSalon(false)
          void executer(
            () => supprimerSalon(salon!.id),
            { titre: 'Salon supprimé', detail: 'Les messages ont été effacés.' },
            () => navigate('/chat-collaboratif'),
          )
        }}
        title={`Supprimer le salon « ${salon ? nomSalon(salon) : ''} » ?`}
        description="Tous les messages et fichiers partagés du salon seront définitivement supprimés, pour tous les participants. Si vous souhaitez simplement le mettre de côté, archivez-le plutôt."
        confirmLabel="Supprimer définitivement"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          {fils.length} message(s) et {fichiers.length} fichier(s) seront perdus.
          {salon?.type === 'inter' && ' Les associations partenaires perdront elles aussi cet historique.'}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!membreARetirer}
        loading={enCours}
        onClose={() => setMembreARetirer(null)}
        onConfirm={() => {
          const m = membreARetirer!
          setMembreARetirer(null)
          void executer(() => retirerMembre(salon!.id, m), { titre: 'Membre exclu', detail: `${membre(m)?.nom} n’a plus accès au salon.` })
        }}
        title={`Exclure ${membre(membreARetirer ?? '')?.nom} du salon ?`}
        description="La personne perd immédiatement l'accès aux messages, y compris à l'historique. Ses messages déjà envoyés restent visibles des autres participants."
        confirmLabel="Exclure du salon"
      />

      <ConfirmDialog
        open={!!assoARetirer}
        loading={enCours}
        onClose={() => setAssoARetirer(null)}
        onConfirm={() => {
          const a = assoARetirer!
          setAssoARetirer(null)
          void executer(() => retirerAssociation(salon!.id, a), {
            titre: 'Association retirée',
            detail: `${associationsChat.find((x) => x.id === a)?.nom} et ses membres n’ont plus accès au salon.`,
          })
        }}
        title={`Retirer ${associationsChat.find((x) => x.id === assoARetirer)?.nom} du salon ?`}
        description="Tous les membres de cette association perdent l'accès au salon et à son historique en même temps. Leurs messages déjà écrits restent visibles des participants restants."
        confirmLabel="Retirer l'association"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          {salon?.membresIds.filter((m) => membre(m)?.associationId === assoARetirer).length} membre(s) seront retirés du
          salon.
        </div>
      </ConfirmDialog>
    </Page>
  )
}
