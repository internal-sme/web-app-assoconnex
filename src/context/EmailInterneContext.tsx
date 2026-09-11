import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  MOI_EMAIL,
  TAILLE_MAX_PJ,
  formatTaillePJ,
  messagesAvecEchec,
  messagesInitiaux,
  modelesInitiaux,
  type Dossier,
  type Message,
  type ModeleMessage,
  type PieceJointeMail,
  type Rattachement,
} from '@/lib/emailInterne'
import { uid } from '@/lib/utils'

export type ModeDemoEmail = 'normal' | 'chargement' | 'vide' | 'echec-envoi' | 'erreur' | 'echec'

export type SaisieMessage = {
  destinatairesIds: string[]
  copieIds: string[]
  copieCacheeIds: string[]
  objet: string
  corps: string
  piecesJointes: PieceJointeMail[]
  rattachement: Rattachement | null
  important: boolean
  accuseDemande: boolean
  /** Renseigné quand on reprend un brouillon ou qu'on répond dans un fil. */
  brouillonId?: string
  filId?: string
}

type Ctx = {
  messages: Message[]
  modeles: ModeleMessage[]
  chargement: boolean
  erreur: string | null
  envoiEnCours: boolean
  mode: ModeDemoEmail
  setMode: (m: ModeDemoEmail) => void
  recharger: () => void
  envoyer: (s: SaisieMessage) => Promise<void>
  reessayer: (id: string) => Promise<void>
  enregistrerBrouillon: (s: SaisieMessage) => Promise<string>
  marquerLu: (filId: string, lu: boolean) => void
  basculerImportant: (id: string) => Promise<void>
  deplacer: (filId: string, dossier: Dossier) => Promise<void>
  supprimerDefinitivement: (filId: string) => Promise<void>
  viderCorbeille: () => Promise<void>
  ajouterModele: (m: Omit<ModeleMessage, 'id'>) => Promise<void>
  supprimerModele: (id: string) => Promise<void>
  /** Refuse une pièce jointe trop volumineuse plutôt que de la tronquer. */
  verifierPieceJointe: (taille: number) => void
}

const EmailInterneContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export function EmailInterneProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(messagesInitiaux)
  const [modeles, setModeles] = useState<ModeleMessage[]>(modelesInitiaux)
  const [chargement, setChargement] = useState(true)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoEmail>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoEmail) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("La boîte de réception n'a pas pu être interrogée.")
      setMessages([])
    } else if (m === 'vide') {
      setMessages([])
    } else if (m === 'echec-envoi') {
      setMessages(messagesAvecEchec())
    } else {
      setMessages(messagesInitiaux)
    }
    setModeles(modelesInitiaux)
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

  const verifierPieceJointe = useCallback<Ctx['verifierPieceJointe']>((taille) => {
    if (taille > TAILLE_MAX_PJ) {
      throw new Error(
        `Pièce jointe trop volumineuse : ${formatTaillePJ(taille)} pour une limite de ${formatTaillePJ(TAILLE_MAX_PJ)}. Déposez-la dans l'espace documentaire et partagez le lien.`,
      )
    }
  }, [])

  const construire = useCallback((s: SaisieMessage, statut: Message['statutEnvoi'], dossier: Dossier): Message => ({
    id: uid('me'),
    filId: s.filId ?? uid('fl'),
    expediteurId: MOI_EMAIL,
    destinatairesIds: s.destinatairesIds,
    copieIds: s.copieIds,
    copieCacheeIds: s.copieCacheeIds,
    objet: s.objet.trim(),
    corps: s.corps,
    quand: new Date().toISOString(),
    lu: true,
    important: s.important,
    accuseDemande: s.accuseDemande,
    accuseRecuLe: null,
    piecesJointes: s.piecesJointes,
    rattachement: s.rattachement,
    dossier,
    statutEnvoi: statut,
  }), [])

  const envoyer = useCallback<Ctx['envoyer']>(
    async (s) => {
      const total = [...s.destinatairesIds, ...s.copieIds, ...s.copieCacheeIds]
      if (total.length === 0) throw new Error('Ajoutez au moins un destinataire.')
      if (!s.objet.trim()) throw new Error("Un message sans objet a peu de chances d'être lu. Donnez-lui un titre.")

      const id = uid('me')
      const provisoire = { ...construire(s, 'en_cours', 'envoyes'), id }
      setMessages((l) => [...l.filter((m) => m.id !== s.brouillonId), provisoire])

      setEnvoiEnCours(true)
      try {
        await attendre(900)
        const echoue = modeRef.current === 'echec-envoi' || modeRef.current === 'echec'
        setMessages((l) => l.map((m) => (m.id === id ? { ...m, statutEnvoi: echoue ? 'echec' : 'envoye' } : m)))
        if (echoue) throw new Error("Le message n'est pas parti. Vérifiez votre connexion, puis réessayez.")
      } finally {
        setEnvoiEnCours(false)
      }
    },
    [construire],
  )

  const reessayer = useCallback<Ctx['reessayer']>(async (id) => {
    setMessages((l) => l.map((m) => (m.id === id ? { ...m, statutEnvoi: 'en_cours' } : m)))
    setEnvoiEnCours(true)
    try {
      await attendre(900)
      const echoue = modeRef.current === 'echec'
      setMessages((l) => l.map((m) => (m.id === id ? { ...m, statutEnvoi: echoue ? 'echec' : 'envoye', quand: new Date().toISOString() } : m)))
      if (echoue) throw new Error("Le message n'est toujours pas parti.")
    } finally {
      setEnvoiEnCours(false)
    }
  }, [])

  const enregistrerBrouillon = useCallback<Ctx['enregistrerBrouillon']>(
    async (s) => {
      return operation(() => {
        const brouillon = construire(s, 'envoye', 'brouillons')
        setMessages((l) => [...l.filter((m) => m.id !== s.brouillonId), brouillon])
        return brouillon.id
      })
    },
    [operation, construire],
  )

  const marquerLu = useCallback<Ctx['marquerLu']>((filId, lu) => {
    setMessages((l) => l.map((m) => (m.filId === filId ? { ...m, lu } : m)))
  }, [])

  const basculerImportant = useCallback<Ctx['basculerImportant']>(
    async (id) => {
      await operation(() => setMessages((l) => l.map((m) => (m.id === id ? { ...m, important: !m.important } : m))), 180)
    },
    [operation],
  )

  const deplacer = useCallback<Ctx['deplacer']>(
    async (filId, dossier) => {
      await operation(() => setMessages((l) => l.map((m) => (m.filId === filId ? { ...m, dossier } : m))))
    },
    [operation],
  )

  const supprimerDefinitivement = useCallback<Ctx['supprimerDefinitivement']>(
    async (filId) => {
      await operation(() => setMessages((l) => l.filter((m) => m.filId !== filId)))
    },
    [operation],
  )

  const viderCorbeille = useCallback<Ctx['viderCorbeille']>(async () => {
    await operation(() => setMessages((l) => l.filter((m) => m.dossier !== 'corbeille')))
  }, [operation])

  const ajouterModele = useCallback<Ctx['ajouterModele']>(
    async (m) => {
      if (!m.nom.trim()) throw new Error('Donnez un nom au modèle.')
      await operation(() => setModeles((l) => [...l, { ...m, id: uid('mo') }]))
    },
    [operation],
  )

  const supprimerModele = useCallback<Ctx['supprimerModele']>(
    async (id) => {
      await operation(() => setModeles((l) => l.filter((m) => m.id !== id)))
    },
    [operation],
  )

  const value = useMemo<Ctx>(
    () => ({
      messages, modeles, chargement, erreur, envoiEnCours, mode, setMode, recharger,
      envoyer, reessayer, enregistrerBrouillon, marquerLu, basculerImportant, deplacer,
      supprimerDefinitivement, viderCorbeille, ajouterModele, supprimerModele, verifierPieceJointe,
    }),
    [messages, modeles, chargement, erreur, envoiEnCours, mode, recharger, envoyer, reessayer, enregistrerBrouillon, marquerLu, basculerImportant, deplacer, supprimerDefinitivement, viderCorbeille, ajouterModele, supprimerModele, verifierPieceJointe],
  )

  return <EmailInterneContext.Provider value={value}>{children}</EmailInterneContext.Provider>
}

export function useEmailInterne() {
  const ctx = useContext(EmailInterneContext)
  if (!ctx) throw new Error('useEmailInterne doit être utilisé dans EmailInterneProvider')
  return ctx
}
