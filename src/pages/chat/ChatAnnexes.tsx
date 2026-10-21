import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AtSign, Building2, Hash, MessageCircle, Plus, Search, Settings2, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Checkbox, Switch } from '@/components/ui/Toggle'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { ChatNav, ChatOutils } from '@/components/chat/ChatNav'
import { AvatarPresence, ListeAssociations, PastilleAssociation } from '@/components/chat/Pieces'
import { useChat } from '@/context/ChatContext'
import { useProjets } from '@/context/ProjetsContext'
import { useToast } from '@/context/ToastContext'
import {
  MOI_CHAT,
  associationsChat,
  dernierMessage,
  horodatageCourt,
  membre,
  membresChat,
  mentionsNonLues,
  nomSalon,
  nonLus,
  notificationLabels,
  typeSalonLabels,
  visibiliteLabels,
  type NiveauNotification,
  type TypeSalon,
  type VisibiliteSalon,
} from '@/lib/chat'

/* ----------------------------- Nouveau chat ----------------------------- */

type FormeChat = 'direct' | 'association' | 'inter'

export function NouveauChat() {
  usePageTitle('Messagerie')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { creerSalon, ouvrirDirect, salons, messages } = useChat()
  const { projets } = useProjets()

  const [forme, setForme] = useState<FormeChat>('direct')
  const [rechercheContact, setRechercheContact] = useState('')
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [visibilite, setVisibilite] = useState<VisibiliteSalon>('ouvert')
  const [membresIds, setMembresIds] = useState<string[]>([MOI_CHAT])
  const [associationsIds, setAssociationsIds] = useState<string[]>([])
  const [projetId, setProjetId] = useState('')
  const [epingle, setEpingle] = useState(false)
  const [notifications, setNotifications] = useState<NiveauNotification>('tous')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  // Les membres proposés dépendent des associations conviées
  const type: TypeSalon = forme === 'inter' ? 'inter' : 'association'
  const associationsRetenues = type === 'inter' ? ['org-1', ...associationsIds] : ['org-1']
  const candidats = membresChat.filter((m) => associationsRetenues.includes(m.associationId))

  /** Salon direct déjà ouvert avec cette personne, le cas échéant. */
  const directExistant = (membreId: string) =>
    salons.find((s) => s.type === 'direct' && s.membresIds.includes(membreId))

  const ouvrirConversation = async (membreId: string) => {
    setEnCours(true)
    try {
      const salon = await ouvrirDirect(membreId)
      const existait = !!directExistant(membreId)
      toast({
        titre: existait ? 'Conversation ouverte' : 'Discussion démarrée',
        detail: `${membre(membreId)?.nom}${existait ? ' — vous reprenez le fil existant.' : ' — écrivez le premier message.'}`,
        tone: 'success',
      })
      navigate(`/chat-collaboratif/${salon.id}`)
    } catch (err) {
      toast({ titre: 'Ouverture impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const enregistrer = async () => {
    const e: Record<string, string> = {}
    if (!nom.trim()) e.nom = 'Donnez un nom au salon.'
    if (type === 'inter' && associationsIds.length === 0) e.associations = 'Conviez au moins une association partenaire.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    setEnCours(true)
    try {
      const cree = await creerSalon({
        nom,
        description: description.trim(),
        type,
        visibilite,
        membresIds: membresIds.includes(MOI_CHAT) ? membresIds : [MOI_CHAT, ...membresIds],
        associationsIds: associationsRetenues,
        projetId: projetId || null,
        epingle,
        notifications,
      })
      toast({ titre: 'Salon créé', detail: `${cree.nom} — ${cree.membresIds.length} membre(s).`, tone: 'success' })
      navigate(`/chat-collaboratif/${cree.id}`)
    } catch (err) {
      toast({ titre: 'Création impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Chat collaboratif"
          title="Nouveau chat"
          description="Une discussion directe avec une personne, ou un salon réunissant plusieurs participants — de votre association, ou d'associations partenaires."
          actions={
            <Button onClick={() => navigate('/chat-collaboratif')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Annuler
            </Button>
          }
        />
      }
    >
      <ChatNav />

      <Card>
        <CardHeader title="Quelle forme de conversation ?" />
        <CardBody className="grid gap-2 sm:grid-cols-3">
          {([
            ['direct', 'Message direct', 'Une conversation à deux, avec un membre ou un contact partenaire.', MessageCircle],
            ['association', 'Salon de l’association', 'Plusieurs participants, tous membres de votre association.', Hash],
            ['inter', 'Salon inter-associations', 'Ouvert à des partenaires, qui ne verront que ce salon.', Building2],
          ] as [FormeChat, string, string, typeof MessageCircle][]).map(([cle, titre, texte, Icone]) => (
            <button
              key={cle}
              type="button"
              aria-pressed={forme === cle}
              onClick={() => {
                setForme(cle)
                if (cle !== 'inter') setAssociationsIds([])
              }}
              className={cn(
                'flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
                forme === cle ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300 hover:bg-ink-25',
              )}
            >
              <span className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-900">
                <Icone aria-hidden className="h-4 w-4" />
                {titre}
              </span>
              <span className="text-xs leading-relaxed text-ink-500">{texte}</span>
            </button>
          ))}
        </CardBody>
      </Card>

      {/* Discussion directe : on choisit une personne dans l'annuaire */}
      {forme === 'direct' && (
        <Card>
          <CardHeader
            title="Avec qui souhaitez-vous discuter ?"
            description="Membres de votre association et contacts des associations partenaires."
            action={
              <Input
                type="search"
                value={rechercheContact}
                onChange={(e) => setRechercheContact(e.target.value)}
                placeholder="Rechercher un contact"
                aria-label="Rechercher un contact"
                iconLeft={<Search />}
                className="h-8 w-56 text-[0.8125rem]"
              />
            }
          />
          <CardBody className="flex flex-col gap-5">
            {associationsChat.map((asso) => {
              const q = rechercheContact.trim().toLowerCase()
              const contacts = membresChat
                .filter((m) => m.associationId === asso.id && m.id !== MOI_CHAT)
                .filter((m) => (q ? `${m.nom} ${m.role}`.toLowerCase().includes(q) : true))
              if (contacts.length === 0) return null
              return (
                <div key={asso.id}>
                  <p className="mb-2 flex items-center gap-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">
                    <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: asso.couleur }} />
                    {asso.nom}
                    {asso.interne ? (
                      <span className="font-normal normal-case tracking-normal text-ink-500">— votre association</span>
                    ) : (
                      <span className="font-normal normal-case tracking-normal text-ink-500">— association partenaire</span>
                    )}
                  </p>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {contacts.map((m) => {
                      const existant = directExistant(m.id)
                      const dernier = existant ? dernierMessage(existant.id, messages) : undefined
                      return (
                        <li key={m.id}>
                          <button
                            type="button"
                            disabled={enCours}
                            onClick={() => void ouvrirConversation(m.id)}
                            className="flex w-full items-center gap-3 rounded-lg border border-ink-200 p-2.5 text-left transition-colors hover:border-ink-300 hover:bg-ink-25 disabled:opacity-60"
                          >
                            <AvatarPresence personne={m} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{m.nom}</span>
                              <span className="block truncate text-xs text-ink-500">
                                {existant && dernier ? `${dernier.contenu || 'pièce jointe'}` : m.role}
                              </span>
                            </span>
                            {!asso.interne && <PastilleAssociation membreId={m.id} compact />}
                            {existant && <Badge variant="outline">Conversation ouverte</Badge>}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}

            {membresChat.filter((m) => m.id !== MOI_CHAT && `${m.nom} ${m.role}`.toLowerCase().includes(rechercheContact.trim().toLowerCase())).length === 0 && (
              <EmptyState
                icon={<Search />}
                title="Aucun contact ne correspond"
                description="Élargissez la recherche. Les contacts proviennent de votre association et des associations partenaires."
                compact
              />
            )}
          </CardBody>
        </Card>
      )}

      {forme !== 'direct' && (
        <>
      <Card>
        <CardHeader title="Identité" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du salon" required error={erreurs.nom} className="sm:col-span-2">
            {(p) => <Input {...p} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Forum des associations 2027" />}
          </Field>
          <Field label="Description" className="sm:col-span-2" hint="Ce dont on parle ici, pour que chacun sache s’il est au bon endroit.">
            {(p) => <Textarea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title={forme === 'inter' ? 'Associations partenaires' : 'Accès au salon'}
          description={forme === 'inter' ? 'Elles accéderont aux messages de ce salon, et à rien d’autre de votre espace.' : 'Qui peut rejoindre ce salon.'}
        />
        <CardBody className="flex flex-col gap-4">
          {type === 'inter' && (
            <>
              {erreurs.associations && (
                <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 p-2.5 text-[0.8125rem] text-danger-700">
                  {erreurs.associations}
                </p>
              )}
              <Field label="Associations conviées" required hint="Elles accéderont aux messages de ce salon, et à rien d’autre.">
                {(p) => (
                  <MultiSelect
                    {...p}
                    value={associationsIds}
                    onChange={(ids) => {
                      setAssociationsIds(ids)
                      setMembresIds((l) => l.filter((m) => ['org-1', ...ids].includes(membre(m)?.associationId ?? '')))
                    }}
                    options={associationsChat.filter((a) => !a.interne).map((a) => ({ value: a.id, label: a.nom }))}
                    placeholder="Choisir les partenaires"
                  />
                )}
              </Field>
              {associationsIds.length > 0 && <ListeAssociations ids={['org-1', ...associationsIds]} />}
            </>
          )}

          <Field label="Visibilité" required>
            {(p) => (
              <Select
                {...p}
                value={visibilite}
                onChange={(e) => setVisibilite(e.target.value as VisibiliteSalon)}
                options={(Object.keys(visibiliteLabels) as VisibiliteSalon[]).map((v) => ({ value: v, label: visibiliteLabels[v] }))}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Membres" description={`${candidats.length} personne(s) éligibles selon la portée choisie.`} />
        <CardBody className="flex flex-col gap-3">
          <Field label="Membres invités">
            {(p) => (
              <MultiSelect
                {...p}
                value={membresIds}
                onChange={setMembresIds}
                options={candidats.map((m) => ({ value: m.id, label: `${m.nom}${m.associationId !== 'org-1' ? ` — ${associationsChat.find((a) => a.id === m.associationId)?.courte}` : ''}` }))}
                placeholder="Choisir les membres"
              />
            )}
          </Field>
          {membresIds.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {membresIds.map((id) => {
                const m = membre(id)
                if (!m) return null
                return (
                  <li key={id} className="flex items-center gap-2 rounded-lg border border-ink-200 px-2 py-1">
                    <span className="text-2xs font-medium text-ink-900">{m.nom}</span>
                    {m.associationId !== 'org-1' && <PastilleAssociation membreId={id} compact />}
                    {id === MOI_CHAT && <Badge variant="brand">Vous</Badge>}
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Réglages" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Rattachement à un projet" hint="Facultatif. Sert à retrouver le salon depuis la fiche projet.">
            {(p) => (
              <Select
                {...p}
                value={projetId}
                onChange={(e) => setProjetId(e.target.value)}
                placeholder="Aucun projet"
                options={projets.filter((x) => x.statut !== 'cloture').map((x) => ({ value: x.id, label: `${x.code} — ${x.nom}` }))}
              />
            )}
          </Field>
          <Field label="Notifications par défaut">
            {(p) => (
              <Select
                {...p}
                value={notifications}
                onChange={(e) => setNotifications(e.target.value as NiveauNotification)}
                options={(Object.keys(notificationLabels) as NiveauNotification[]).map((n) => ({ value: n, label: notificationLabels[n] }))}
              />
            )}
          </Field>
          <div className="sm:col-span-2">
            <Switch
              label="Épingler le salon"
              description="Il apparaîtra en tête de votre liste de conversations."
              checked={epingle}
              onCheckedChange={setEpingle}
            />
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours
            ? 'Création en cours…'
            : `${forme === 'inter' ? 'Salon inter-associations' : 'Salon de l’association'} · ${membresIds.length} membre(s) au démarrage.`}
        </p>
        <Button variant="ghost" onClick={() => navigate('/chat-collaboratif')} disabled={enCours}>Annuler</Button>
        <Button variant="primary" loading={enCours} onClick={() => void enregistrer()} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
          Créer le salon
        </Button>
      </div>
        </>
      )}
    </Page>
  )
}

/* -------------------------- Mentions et non-lus ------------------------- */

export function MentionsChat() {
  const navigate = useNavigate()
  const { salons, messages, chargement } = useChat()

  const mentions = mentionsNonLues(messages)
  const salonsAvecNonLus = salons.filter((s) => !s.archive && nonLus(s.id, messages) > 0)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Chat collaboratif"
          title="Mentions et non-lus"
          description="Ce qui vous attend : les messages où l'on vous nomme, puis les conversations qui ont bougé depuis votre dernier passage."
          meta={<Badge variant="brand">{mentions.length} mention(s)</Badge>}
          actions={<ChatOutils />}
        />
      }
    >
      <ChatNav />

      <Card>
        <CardHeader title="Vous êtes mentionné" description="Quelqu'un attend probablement une réponse de votre part." />
        {mentions.length === 0 ? (
          <EmptyState icon={<AtSign />} title="Aucune mention en attente" description="Personne ne vous a nommé dans un message non lu." compact />
        ) : (
          <ul className="divide-y divide-ink-100">
            {mentions.map((m) => {
              const salon = salons.find((s) => s.id === m.salonId)
              const auteur = membre(m.auteurId)
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/chat-collaboratif/${m.salonId}`)}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                  >
                    {auteur && <AvatarPresence personne={auteur} size="sm" />}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.8125rem] font-medium text-ink-900">{auteur?.nom}</span>
                        {auteur && auteur.associationId !== 'org-1' && <PastilleAssociation membreId={auteur.id} compact />}
                        <span className="text-2xs text-ink-500">
                          dans {salon ? nomSalon(salon) : '—'} · {horodatageCourt(m.quand)}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[0.8125rem] text-ink-700">{m.contenu}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader title="Conversations non lues" description={`${salonsAvecNonLus.length} conversation(s) ont de nouveaux messages.`} />
        {salonsAvecNonLus.length === 0 ? (
          <EmptyState icon={<MessageCircle />} title="Tout est lu" description="Aucun message en attente." compact />
        ) : (
          <ul className="divide-y divide-ink-100">
            {salonsAvecNonLus.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/chat-collaboratif/${s.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{nomSalon(s)}</span>
                    <span className="block truncate text-xs text-ink-500">{typeSalonLabels[s.type]}</span>
                  </span>
                  {s.type === 'inter' && <StatusBadge status="salon_inter" />}
                  <span className="ac-num flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-2xs font-bold text-white">
                    {nonLus(s.id, messages)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <span className="sr-only" aria-live="polite">{chargement ? 'Chargement' : ''}</span>
    </Page>
  )
}

/* ------------------------------ Recherche ------------------------------ */

export function RechercheChat() {
  const navigate = useNavigate()
  const { salons, messages } = useChat()

  const [terme, setTerme] = useState('')
  const [salonId, setSalonId] = useState('')
  const [auteurId, setAuteurId] = useState('')
  const [avecPieces, setAvecPieces] = useState(false)

  const resultats = messages
    .filter((m) => !m.supprime)
    .filter((m) => (salonId ? m.salonId === salonId : true))
    .filter((m) => (auteurId ? m.auteurId === auteurId : true))
    .filter((m) => (avecPieces ? m.piecesJointes.length > 0 : true))
    .filter((m) => {
      const q = terme.trim().toLowerCase()
      if (!q) return false
      return `${m.contenu} ${m.piecesJointes.map((p) => p.nom).join(' ')}`.toLowerCase().includes(q)
    })
    .sort((a, b) => (a.quand < b.quand ? 1 : -1))
    .slice(0, 40)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Chat collaboratif"
          title="Recherche dans les messages"
          description="Cherchez dans tous vos salons à la fois, y compris ceux partagés avec des associations partenaires."
          meta={terme.trim() ? <Badge variant="brand">{resultats.length} résultat(s)</Badge> : undefined}
          actions={<ChatOutils />}
        />
      }
    >
      <ChatNav />

      <Card>
        <CardHeader title="Critères" />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Terme recherché" className="sm:col-span-2">
            {(p) => <Input {...p} type="search" value={terme} onChange={(e) => setTerme(e.target.value)} placeholder="sonorisation, budget, forum…" iconLeft={<Search />} />}
          </Field>
          <Field label="Salon">
            {(p) => (
              <Select {...p} value={salonId} onChange={(e) => setSalonId(e.target.value)} placeholder="Tous les salons" options={salons.map((s) => ({ value: s.id, label: nomSalon(s) }))} />
            )}
          </Field>
          <Field label="Auteur">
            {(p) => (
              <Select {...p} value={auteurId} onChange={(e) => setAuteurId(e.target.value)} placeholder="Tout le monde" options={membresChat.map((m) => ({ value: m.id, label: m.nom }))} />
            )}
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Checkbox checked={avecPieces} onChange={(e) => setAvecPieces(e.target.checked)} label="Seulement les messages avec pièce jointe" />
          </div>
        </CardBody>
      </Card>

      {!terme.trim() ? (
        <Card>
          <EmptyState icon={<Search />} title="Saisissez un terme" description="La recherche porte sur le contenu des messages et le nom des fichiers partagés." />
        </Card>
      ) : resultats.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search />}
            title="Aucun message ne correspond"
            description="Élargissez le terme ou retirez un filtre. Les messages supprimés ne sont pas indexés."
            action={<Button variant="primary" onClick={() => { setSalonId(''); setAuteurId(''); setAvecPieces(false) }}>Retirer les filtres</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Résultats" description="Du plus récent au plus ancien." />
          <ul className="divide-y divide-ink-100">
            {resultats.map((m) => {
              const salon = salons.find((s) => s.id === m.salonId)
              const auteur = membre(m.auteurId)
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/chat-collaboratif/${m.salonId}`)}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                  >
                    {auteur && <AvatarPresence personne={auteur} size="sm" />}
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.8125rem] font-medium text-ink-900">{auteur?.nom}</span>
                        {auteur && auteur.associationId !== 'org-1' && <PastilleAssociation membreId={auteur.id} compact />}
                        <span className="text-2xs text-ink-500">
                          {salon ? nomSalon(salon) : '—'} · {horodatageCourt(m.quand)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] text-ink-700">{m.contenu}</span>
                      {m.piecesJointes.length > 0 && (
                        <span className="mt-1 block text-2xs text-ink-500">{m.piecesJointes.map((p) => p.nom).join(', ')}</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </Page>
  )
}

/* --------------------------- Paramètres du salon ------------------------ */

export function ParametresSalon() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { salonParId, modifierSalon, supprimerSalon, archiverSalon, messages } = useChat()
  const { projets } = useProjets()

  const salon = salonParId(id)
  const [nom, setNom] = useState(salon?.nom ?? '')
  const [description, setDescription] = useState(salon?.description ?? '')
  const [visibilite, setVisibilite] = useState<VisibiliteSalon>(salon?.visibilite ?? 'ouvert')
  const [projetId, setProjetId] = useState(salon?.projetId ?? '')
  const [epingle, setEpingle] = useState(salon?.epingle ?? false)
  const [notifications, setNotifications] = useState<NiveauNotification>(salon?.notifications ?? 'tous')
  const [aSupprimer, setASupprimer] = useState(false)
  const [enCours, setEnCours] = useState(false)

  if (!salon) {
    return (
      <Page header={<PageHeader title="Salon introuvable" />}>
        <ChatNav />
        <Card>
          <EmptyState
            icon={<MessageCircle />}
            title="Ce salon n'existe plus"
            description="Il a peut-être été supprimé."
            action={<Button variant="primary" onClick={() => navigate('/chat-collaboratif')}>Retour aux conversations</Button>}
          />
        </Card>
      </Page>
    )
  }

  const nbMessages = messages.filter((m) => m.salonId === salon.id && !m.supprime).length

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, apres?: () => void) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      apres?.()
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Chat collaboratif"
          title={`Paramètres de « ${nomSalon(salon)} »`}
          description={salon.description || typeSalonLabels[salon.type]}
          meta={
            <>
              <StatusBadge status={salon.type === 'inter' ? 'salon_inter' : salon.type === 'direct' ? 'salon_direct' : 'salon_association'} />
              {salon.archive && <StatusBadge status="salon_archive" />}
            </>
          }
          actions={
            <Button onClick={() => navigate(`/chat-collaboratif/${salon.id}`)} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Retour au salon
            </Button>
          }
        />
      }
    >
      <ChatNav />

      {salon.archive && (
        <Alert tone="warning" titre="Salon archivé" action={
          <Button size="sm" loading={enCours} onClick={() => void executer(() => archiverSalon(salon.id, false), { titre: 'Salon réactivé', detail: 'On peut de nouveau y écrire.' })}>
            Réactiver
          </Button>
        }>
          Le salon est en lecture seule. Ses paramètres ne peuvent pas être modifiés tant qu'il est archivé.
        </Alert>
      )}

      {salon.type === 'inter' && (
        <Card>
          <CardHeader title="Associations conviées" description="Chacune ne voit que ce salon, rien du reste de votre espace." />
          <CardBody>
            <ListeAssociations ids={salon.associationsIds} />
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Identité" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" required className="sm:col-span-2">
            {(p) => <Input {...p} value={nom} onChange={(e) => setNom(e.target.value)} disabled={salon.archive} />}
          </Field>
          <Field label="Description" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} disabled={salon.archive} />}
          </Field>
          <Field label="Visibilité">
            {(p) => (
              <Select
                {...p}
                value={visibilite}
                onChange={(e) => setVisibilite(e.target.value as VisibiliteSalon)}
                disabled={salon.archive}
                options={(Object.keys(visibiliteLabels) as VisibiliteSalon[]).map((v) => ({ value: v, label: visibiliteLabels[v] }))}
              />
            )}
          </Field>
          <Field label="Projet rattaché">
            {(p) => (
              <Select
                {...p}
                value={projetId}
                onChange={(e) => setProjetId(e.target.value)}
                disabled={salon.archive}
                placeholder="Aucun projet"
                options={projets.map((x) => ({ value: x.id, label: `${x.code} — ${x.nom}` }))}
              />
            )}
          </Field>
          <Field label="Notifications">
            {(p) => (
              <Select
                {...p}
                value={notifications}
                onChange={(e) => setNotifications(e.target.value as NiveauNotification)}
                options={(Object.keys(notificationLabels) as NiveauNotification[]).map((n) => ({ value: n, label: notificationLabels[n] }))}
              />
            )}
          </Field>
          <div className="sm:col-span-2">
            <Switch label="Salon épinglé" description="Il reste en tête de la liste des conversations." checked={epingle} onCheckedChange={setEpingle} />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Cycle de vie" />
        <CardBody className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-ink-200 p-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] font-medium text-ink-900">Archiver le salon</span>
              <span className="block text-xs leading-relaxed text-ink-500">
                Le salon reste consultable mais personne ne peut plus y écrire. C'est réversible.
              </span>
            </span>
            <Button
              size="sm"
              loading={enCours}
              onClick={() =>
                void executer(() => archiverSalon(salon.id, !salon.archive), {
                  titre: salon.archive ? 'Salon réactivé' : 'Salon archivé',
                  detail: salon.archive ? 'On peut de nouveau y écrire.' : 'Il passe en lecture seule.',
                })
              }
            >
              {salon.archive ? 'Réactiver' : 'Archiver'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-danger-100 bg-danger-50 p-3">
            <span className="min-w-0 flex-1">
              <span className="block text-[0.8125rem] font-medium text-danger-800">Supprimer le salon</span>
              <span className="block text-xs leading-relaxed text-danger-700">
                {nbMessages} message(s) seront définitivement perdus, pour tous les participants.
              </span>
            </span>
            <Button size="sm" variant="danger" onClick={() => setASupprimer(true)} iconLeft={<Trash2 aria-hidden className="h-3.5 w-3.5" />}>
              Supprimer
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours ? 'Enregistrement en cours…' : `${salon.membresIds.length} membre(s) · ${nbMessages} message(s)`}
        </p>
        <Button variant="ghost" onClick={() => navigate(`/chat-collaboratif/${salon.id}`)} disabled={enCours}>Annuler</Button>
        <Button
          variant="primary"
          loading={enCours}
          disabled={salon.archive || !nom.trim()}
          onClick={() =>
            void executer(
              () => modifierSalon(salon.id, { nom: nom.trim(), description, visibilite, projetId: projetId || null, epingle, notifications }),
              { titre: 'Paramètres enregistrés', detail: nom.trim() },
            )
          }
          iconLeft={<Settings2 aria-hidden className="h-4 w-4" />}
        >
          Enregistrer
        </Button>
      </div>

      <ConfirmDialog
        open={aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(false)}
        onConfirm={() => {
          setASupprimer(false)
          void executer(
            () => supprimerSalon(salon.id),
            { titre: 'Salon supprimé', detail: 'Les messages ont été effacés.' },
            () => navigate('/chat-collaboratif'),
          )
        }}
        title={`Supprimer le salon « ${nomSalon(salon)} » ?`}
        description="Tous les messages et fichiers partagés seront définitivement supprimés, pour tous les participants. L'archivage est préférable si vous souhaitez conserver l'historique."
        confirmLabel="Supprimer définitivement"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          {nbMessages} message(s) seront perdus.
          {salon.type === 'inter' && ' Les associations partenaires perdront elles aussi cet historique.'}
        </div>
      </ConfirmDialog>
    </Page>
  )
}
