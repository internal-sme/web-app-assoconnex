import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  MOI_CHAT,
  membresChat,
  messagesAvecEchec,
  messagesInitiaux,
  salonsInitiaux,
  type MessageChat,
  type NiveauNotification,
  type Salon,
} from '@/lib/chat'
import { uid } from '@/lib/utils'

export type ModeDemoChat = 'normal' | 'chargement' | 'vide' | 'salon-vide' | 'echec-envoi' | 'archive' | 'erreur' | 'echec'

export type SaisieSalon = Pick<
  Salon,
  'nom' | 'description' | 'type' | 'visibilite' | 'membresIds' | 'associationsIds' | 'projetId' | 'epingle' | 'notifications'
>

type Ctx = {
  salons: Salon[]
  messages: MessageChat[]
  chargement: boolean
  erreur: string | null
  mode: ModeDemoChat
  setMode: (m: ModeDemoChat) => void
  recharger: () => void
  salonParId: (id: string) => Salon | undefined
  creerSalon: (s: SaisieSalon) => Promise<Salon>
  modifierSalon: (id: string, patch: Partial<Salon>) => Promise<void>
  supprimerSalon: (id: string) => Promise<void>
  archiverSalon: (id: string, archive: boolean) => Promise<void>
  epinglerSalon: (id: string) => Promise<void>
  reglerNotifications: (id: string, niveau: NiveauNotification) => Promise<void>
  ajouterMembre: (salonId: string, membreId: string) => Promise<void>
  retirerMembre: (salonId: string, membreId: string) => Promise<void>
  inviterAssociation: (salonId: string, associationId: string) => Promise<void>
  retirerAssociation: (salonId: string, associationId: string) => Promise<void>
  envoyer: (salonId: string, contenu: string, options?: { reponseA?: string | null; mentions?: string[]; pieces?: { nom: string; taille: string }[] }) => Promise<void>
  reessayer: (messageId: string) => Promise<void>
  modifierMessage: (id: string, contenu: string) => Promise<void>
  supprimerMessage: (id: string) => Promise<void>
  epinglerMessage: (id: string) => Promise<void>
  reagir: (messageId: string, emoji: string) => void
  marquerLu: (salonId: string) => void
  ouvrirDirect: (membreId: string) => Promise<Salon>
}

const ChatContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export function ChatProvider({ children }: { children: ReactNode }) {
  const [salons, setSalons] = useState<Salon[]>(salonsInitiaux)
  const [messages, setMessages] = useState<MessageChat[]>(messagesInitiaux)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoChat>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoChat) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return

    if (m === 'erreur') {
      setErreur("Le service de discussion n'a pas répondu.")
      setSalons([])
      setMessages([])
    } else if (m === 'vide') {
      setSalons([])
      setMessages([])
    } else if (m === 'salon-vide') {
      // Les salons existent, mais aucun message n'a encore été échangé
      setSalons(salonsInitiaux)
      setMessages([])
    } else if (m === 'echec-envoi') {
      setSalons(salonsInitiaux)
      setMessages(messagesAvecEchec())
    } else if (m === 'archive') {
      setSalons(salonsInitiaux.map((s) => (s.type === 'inter' ? { ...s, archive: true } : s)))
      setMessages(messagesInitiaux)
    } else {
      setSalons(salonsInitiaux)
      setMessages(messagesInitiaux)
    }
    setChargement(false)
  }, [])

  useEffect(() => {
    void charger(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const recharger = useCallback(() => void charger(modeRef.current), [charger])

  const operation = useCallback(async <T,>(fn: () => T, delai = 450): Promise<T> => {
    await attendre(delai)
    if (modeRef.current === 'echec') throw new Error("L'enregistrement a échoué. Le serveur a refusé l'opération.")
    return fn()
  }, [])

  const salonParId = useCallback((id: string) => salons.find((s) => s.id === id), [salons])

  const majSalon = useCallback((id: string, fn: (s: Salon) => Salon) => {
    setSalons((l) => l.map((s) => (s.id === id ? fn(s) : s)))
  }, [])

  const refuserSiArchive = useCallback(
    (id: string) => {
      const s = salons.find((x) => x.id === id)
      if (s?.archive) throw new Error(`Le salon « ${s.nom} » est archivé : il est en lecture seule.`)
    },
    [salons],
  )

  /* --------------------------- Salons --------------------------- */

  const creerSalon = useCallback<Ctx['creerSalon']>(
    async (s) => {
      if (!s.nom.trim()) throw new Error('Donnez un nom au salon.')
      if (salons.some((x) => x.type !== 'direct' && x.nom.toLowerCase() === s.nom.trim().toLowerCase())) {
        throw new Error(`Un salon « ${s.nom.trim()} » existe déjà.`)
      }
      if (s.type === 'inter' && s.associationsIds.filter((id) => id !== 'org-1').length === 0) {
        throw new Error('Un salon inter-associations doit convier au moins une association partenaire.')
      }
      return operation(() => {
        const nouveau: Salon = {
          ...s,
          nom: s.nom.trim(),
          id: uid('sl'),
          archive: false,
          creePar: MOI_CHAT,
          creeLe: new Date().toISOString(),
        }
        setSalons((l) => [...l, nouveau])
        return nouveau
      })
    },
    [operation, salons],
  )

  const modifierSalon = useCallback<Ctx['modifierSalon']>(
    async (id, patch) => {
      refuserSiArchive(id)
      await operation(() => majSalon(id, (s) => ({ ...s, ...patch })))
    },
    [operation, majSalon, refuserSiArchive],
  )

  const supprimerSalon = useCallback<Ctx['supprimerSalon']>(
    async (id) => {
      await operation(() => {
        setSalons((l) => l.filter((s) => s.id !== id))
        setMessages((l) => l.filter((m) => m.salonId !== id))
      })
    },
    [operation],
  )

  const archiverSalon = useCallback<Ctx['archiverSalon']>(
    async (id, archive) => {
      await operation(() => majSalon(id, (s) => ({ ...s, archive })))
    },
    [operation, majSalon],
  )

  const epinglerSalon = useCallback<Ctx['epinglerSalon']>(
    async (id) => {
      await operation(() => majSalon(id, (s) => ({ ...s, epingle: !s.epingle })), 150)
    },
    [operation, majSalon],
  )

  const reglerNotifications = useCallback<Ctx['reglerNotifications']>(
    async (id, niveau) => {
      await operation(() => majSalon(id, (s) => ({ ...s, notifications: niveau })), 200)
    },
    [operation, majSalon],
  )

  const ajouterMembre = useCallback<Ctx['ajouterMembre']>(
    async (salonId, membreId) => {
      refuserSiArchive(salonId)
      await operation(() => majSalon(salonId, (s) => (s.membresIds.includes(membreId) ? s : { ...s, membresIds: [...s.membresIds, membreId] })))
    },
    [operation, majSalon, refuserSiArchive],
  )

  const retirerMembre = useCallback<Ctx['retirerMembre']>(
    async (salonId, membreId) => {
      refuserSiArchive(salonId)
      const s = salons.find((x) => x.id === salonId)
      if (s && s.creePar === membreId) throw new Error('Le créateur du salon ne peut pas en être exclu.')
      await operation(() => majSalon(salonId, (x) => ({ ...x, membresIds: x.membresIds.filter((m) => m !== membreId) })))
    },
    [operation, majSalon, refuserSiArchive, salons],
  )

  const inviterAssociation = useCallback<Ctx['inviterAssociation']>(
    async (salonId, associationId) => {
      refuserSiArchive(salonId)
      await operation(() =>
        majSalon(salonId, (s) => ({
          ...s,
          type: 'inter',
          associationsIds: s.associationsIds.includes(associationId) ? s.associationsIds : [...s.associationsIds, associationId],
        })),
      )
    },
    [operation, majSalon, refuserSiArchive],
  )

  const retirerAssociation = useCallback<Ctx['retirerAssociation']>(
    async (salonId, associationId) => {
      refuserSiArchive(salonId)
      if (associationId === 'org-1') throw new Error('Votre association ne peut pas être retirée de ses propres salons.')
      await operation(() =>
        majSalon(salonId, (s) => ({
          ...s,
          associationsIds: s.associationsIds.filter((a) => a !== associationId),
          // Les membres de l'association retirée perdent l'accès au salon
          membresIds: s.membresIds.filter((m) => membresChat.find((x) => x.id === m)?.associationId !== associationId),
        })),
      )
    },
    [operation, majSalon, refuserSiArchive],
  )

  /* -------------------------- Messages -------------------------- */

  const envoyer = useCallback<Ctx['envoyer']>(
    async (salonId, contenu, options) => {
      if (!contenu.trim() && !(options?.pieces ?? []).length) return
      refuserSiArchive(salonId)

      const id = uid('ms')
      const provisoire: MessageChat = {
        id,
        salonId,
        auteurId: MOI_CHAT,
        quand: new Date().toISOString(),
        contenu: contenu.trim(),
        mentions: options?.mentions ?? [],
        piecesJointes: (options?.pieces ?? []).map((p, k) => ({ id: uid(`pj-${k}`), ...p })),
        reactions: [],
        reponseA: options?.reponseA ?? null,
        epingle: false,
        modifieLe: null,
        supprime: false,
        lecteursIds: [MOI_CHAT],
        statutEnvoi: 'en_cours',
      }
      setMessages((l) => [...l, provisoire])

      await attendre(700)
      const echoue = modeRef.current === 'echec-envoi' || modeRef.current === 'echec'
      setMessages((l) => l.map((m) => (m.id === id ? { ...m, statutEnvoi: echoue ? 'echec' : 'envoye' } : m)))
      if (echoue) throw new Error("Le message n'est pas parti. Vérifiez votre connexion, puis réessayez.")
    },
    [refuserSiArchive],
  )

  const reessayer = useCallback<Ctx['reessayer']>(async (messageId) => {
    setMessages((l) => l.map((m) => (m.id === messageId ? { ...m, statutEnvoi: 'en_cours' } : m)))
    await attendre(700)
    const echoue = modeRef.current === 'echec'
    setMessages((l) => l.map((m) => (m.id === messageId ? { ...m, statutEnvoi: echoue ? 'echec' : 'envoye', quand: new Date().toISOString() } : m)))
    if (echoue) throw new Error("Le message n'est toujours pas parti.")
  }, [])

  const modifierMessage = useCallback<Ctx['modifierMessage']>(
    async (id, contenu) => {
      if (!contenu.trim()) throw new Error('Un message ne peut pas être vidé : supprimez-le plutôt.')
      await operation(() =>
        setMessages((l) => l.map((m) => (m.id === id ? { ...m, contenu: contenu.trim(), modifieLe: new Date().toISOString() } : m))),
      )
    },
    [operation],
  )

  const supprimerMessage = useCallback<Ctx['supprimerMessage']>(
    async (id) => {
      await operation(() =>
        setMessages((l) => l.map((m) => (m.id === id ? { ...m, supprime: true, contenu: '', piecesJointes: [], reactions: [] } : m))),
      )
    },
    [operation],
  )

  const epinglerMessage = useCallback<Ctx['epinglerMessage']>(
    async (id) => {
      await operation(() => setMessages((l) => l.map((m) => (m.id === id ? { ...m, epingle: !m.epingle } : m))), 200)
    },
    [operation],
  )

  const reagir = useCallback<Ctx['reagir']>((messageId, emoji) => {
    setMessages((l) =>
      l.map((m) => {
        if (m.id !== messageId) return m
        const existante = m.reactions.find((r) => r.emoji === emoji)
        if (!existante) return { ...m, reactions: [...m.reactions, { emoji, membresIds: [MOI_CHAT] }] }
        const deja = existante.membresIds.includes(MOI_CHAT)
        const majReactions = m.reactions
          .map((r) =>
            r.emoji === emoji
              ? { ...r, membresIds: deja ? r.membresIds.filter((x) => x !== MOI_CHAT) : [...r.membresIds, MOI_CHAT] }
              : r,
          )
          .filter((r) => r.membresIds.length > 0)
        return { ...m, reactions: majReactions }
      }),
    )
  }, [])

  const marquerLu = useCallback<Ctx['marquerLu']>((salonId) => {
    setMessages((l) =>
      l.map((m) => (m.salonId === salonId && !m.lecteursIds.includes(MOI_CHAT) ? { ...m, lecteursIds: [...m.lecteursIds, MOI_CHAT] } : m)),
    )
  }, [])

  const ouvrirDirect = useCallback<Ctx['ouvrirDirect']>(
    async (membreId) => {
      const existant = salons.find((s) => s.type === 'direct' && s.membresIds.includes(membreId))
      if (existant) return existant
      return operation(() => {
        const nouveau: Salon = {
          id: uid('sl'),
          nom: '',
          description: '',
          type: 'direct',
          visibilite: 'invitation',
          membresIds: [MOI_CHAT, membreId],
          associationsIds: ['org-1'],
          projetId: null,
          epingle: false,
          archive: false,
          notifications: 'tous',
          creePar: MOI_CHAT,
          creeLe: new Date().toISOString(),
        }
        setSalons((l) => [...l, nouveau])
        return nouveau
      })
    },
    [operation, salons],
  )

  const value = useMemo<Ctx>(
    () => ({
      salons, messages, chargement, erreur, mode, setMode, recharger, salonParId,
      creerSalon, modifierSalon, supprimerSalon, archiverSalon, epinglerSalon, reglerNotifications,
      ajouterMembre, retirerMembre, inviterAssociation, retirerAssociation,
      envoyer, reessayer, modifierMessage, supprimerMessage, epinglerMessage, reagir, marquerLu, ouvrirDirect,
    }),
    [salons, messages, chargement, erreur, mode, recharger, salonParId, creerSalon, modifierSalon, supprimerSalon, archiverSalon, epinglerSalon, reglerNotifications, ajouterMembre, retirerMembre, inviterAssociation, retirerAssociation, envoyer, reessayer, modifierMessage, supprimerMessage, epinglerMessage, reagir, marquerLu, ouvrirDirect],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat doit être utilisé dans ChatProvider')
  return ctx
}
