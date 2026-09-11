import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  EMAIL_DEMO,
  MAX_TENTATIVES,
  MAX_TENTATIVES_CODE,
  MOT_DE_PASSE_DEMO,
  PEREMPTION_CODE_MINUTES,
  VERROUILLAGE_MINUTES,
  comptesDemo,
  emailValide,
  reglesMotDePasse,
  type Compte,
} from '@/lib/auth'

export type ModeDemoAuth = 'normal' | 'identifiants' | 'verrouille' | 'code-expire' | 'echec-envoi' | 'indisponible'

export type Session = { email: string; nom: string; role: string; organisation: string }

export type EtapeAuth = 'connexion' | 'verification' | 'oubli' | 'oubli-confirme' | 'reinitialisation'

type Ctx = {
  session: Session | null
  etape: EtapeAuth
  allerA: (e: EtapeAuth) => void
  /** Adresse en cours de vérification ou de réinitialisation. */
  emailEnCours: string
  chargement: boolean
  envoiEnCours: boolean
  /** Tentatives de connexion restantes avant verrouillage. */
  tentativesRestantes: number
  /** Secondes restantes de verrouillage, zéro si le compte est ouvert. */
  verrouillage: number
  tentativesCodeRestantes: number
  /** Secondes restant avant péremption du code. */
  peremption: number
  mode: ModeDemoAuth
  setMode: (m: ModeDemoAuth) => void
  connecter: (email: string, motDePasse: string, rester: boolean) => Promise<void>
  verifierCode: (code: string) => Promise<void>
  renvoyerCode: () => Promise<void>
  demanderReinitialisation: (email: string) => Promise<void>
  reinitialiser: (nouveau: string, confirmation: string) => Promise<void>
  deconnecter: () => void
  annulerVerification: () => void
}

const AuthContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [etape, setEtape] = useState<EtapeAuth>('connexion')
  const [emailEnCours, setEmailEnCours] = useState('')
  const [compteEnCours, setCompteEnCours] = useState<Compte | null>(null)
  const [chargement, setChargement] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [tentativesRestantes, setTentativesRestantes] = useState(MAX_TENTATIVES)
  const [tentativesCodeRestantes, setTentativesCodeRestantes] = useState(MAX_TENTATIVES_CODE)
  const [verrouillage, setVerrouillage] = useState(0)
  const [peremption, setPeremption] = useState(0)
  const [mode, setMode] = useState<ModeDemoAuth>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode

  // Le mode « compte verrouillé » arme le compte à rebours dès sa sélection
  useEffect(() => {
    if (mode === 'verrouille') {
      setVerrouillage(VERROUILLAGE_MINUTES * 60)
      setTentativesRestantes(0)
    } else if (mode === 'normal') {
      setVerrouillage(0)
      setTentativesRestantes(MAX_TENTATIVES)
      setTentativesCodeRestantes(MAX_TENTATIVES_CODE)
    }
  }, [mode])

  // Décompte du verrouillage
  useEffect(() => {
    if (verrouillage <= 0) return
    const t = window.setInterval(() => {
      setVerrouillage((v) => {
        if (v <= 1) {
          setTentativesRestantes(MAX_TENTATIVES)
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => window.clearInterval(t)
  }, [verrouillage])

  // Décompte de péremption du code
  useEffect(() => {
    if (peremption <= 0) return
    const t = window.setInterval(() => setPeremption((v) => Math.max(v - 1, 0)), 1000)
    return () => window.clearInterval(t)
  }, [peremption])

  const verifierDisponibilite = useCallback(() => {
    if (modeRef.current === 'indisponible') {
      throw new Error("Le service d'authentification est momentanément indisponible. Réessayez dans quelques instants.")
    }
  }, [])

  const armerCode = useCallback((expire: boolean) => {
    setPeremption(expire ? 0 : PEREMPTION_CODE_MINUTES * 60)
    setTentativesCodeRestantes(MAX_TENTATIVES_CODE)
  }, [])

  const connecter = useCallback<Ctx['connecter']>(
    async (email, motDePasse, rester) => {
      if (verrouillage > 0) {
        throw new Error('Compte temporairement verrouillé. Patientez avant de réessayer.')
      }
      if (!emailValide(email)) throw new Error('Cette adresse électronique n’est pas valide.')
      if (!motDePasse) throw new Error('Saisissez votre mot de passe.')

      setChargement(true)
      try {
        await attendre(900)
        verifierDisponibilite()

        const compte = comptesDemo.find((c) => c.email.toLowerCase() === email.trim().toLowerCase())
        const correct =
          modeRef.current === 'identifiants'
            ? false
            : email.trim().toLowerCase() === EMAIL_DEMO && motDePasse === MOT_DE_PASSE_DEMO

        if (!correct) {
          const restantes = Math.max(tentativesRestantes - 1, 0)
          setTentativesRestantes(restantes)
          if (restantes === 0) {
            setVerrouillage(VERROUILLAGE_MINUTES * 60)
            throw new Error(`Trop de tentatives. Le compte est verrouillé pendant ${VERROUILLAGE_MINUTES} minutes.`)
          }
          throw new Error(
            `Adresse ou mot de passe incorrect. ${restantes} tentative${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''} avant verrouillage.`,
          )
        }

        setCompteEnCours(compte!)
        setEmailEnCours(compte!.email)
        void rester
        setTentativesRestantes(MAX_TENTATIVES)
        armerCode(modeRef.current === 'code-expire')
        setEtape('verification')
      } finally {
        setChargement(false)
      }
    },
    [tentativesRestantes, verrouillage, verifierDisponibilite, armerCode],
  )

  const verifierCode = useCallback<Ctx['verifierCode']>(
    async (code) => {
      if (code.length !== 6) throw new Error('Saisissez les six chiffres du code.')
      if (peremption <= 0) {
        throw new Error('Ce code a expiré. Demandez-en un nouveau : le saisir de nouveau ne servira à rien.')
      }

      setChargement(true)
      try {
        await attendre(800)
        verifierDisponibilite()

        // La vérification accepte tout code à six chiffres se terminant par 5.
        if (!code.endsWith('5')) {
          const restantes = Math.max(tentativesCodeRestantes - 1, 0)
          setTentativesCodeRestantes(restantes)
          if (restantes === 0) {
            setEtape('connexion')
            setPeremption(0)
            throw new Error('Code incorrect à trois reprises. Reprenez la connexion depuis le début.')
          }
          throw new Error(`Code incorrect. ${restantes} essai${restantes > 1 ? 's' : ''} restant${restantes > 1 ? 's' : ''}.`)
        }

        const c = compteEnCours!
        setSession({ email: c.email, nom: c.nom, role: c.role, organisation: c.organisation })
        setPeremption(0)
      } finally {
        setChargement(false)
      }
    },
    [peremption, tentativesCodeRestantes, compteEnCours, verifierDisponibilite],
  )

  const renvoyerCode = useCallback<Ctx['renvoyerCode']>(async () => {
    setEnvoiEnCours(true)
    try {
      await attendre(1000)
      if (modeRef.current === 'echec-envoi') {
        throw new Error("L'envoi du code a échoué. Le service de messagerie n'a pas répondu.")
      }
      verifierDisponibilite()
      armerCode(false)
    } finally {
      setEnvoiEnCours(false)
    }
  }, [verifierDisponibilite, armerCode])

  const demanderReinitialisation = useCallback<Ctx['demanderReinitialisation']>(
    async (email) => {
      if (!emailValide(email)) throw new Error('Cette adresse électronique n’est pas valide.')
      setEnvoiEnCours(true)
      try {
        await attendre(900)
        if (modeRef.current === 'echec-envoi') {
          throw new Error("L'envoi du message a échoué. Réessayez dans quelques instants.")
        }
        verifierDisponibilite()
        // On ne révèle jamais si l'adresse est connue
        setEmailEnCours(email.trim())
        setEtape('oubli-confirme')
      } finally {
        setEnvoiEnCours(false)
      }
    },
    [verifierDisponibilite],
  )

  const reinitialiser = useCallback<Ctx['reinitialiser']>(
    async (nouveau, confirmation) => {
      const manquantes = reglesMotDePasse.filter((r) => !r.satisfaite(nouveau))
      if (manquantes.length > 0) {
        throw new Error(`Le mot de passe ne respecte pas encore : ${manquantes.map((m) => m.libelle.toLowerCase()).join(', ')}.`)
      }
      if (nouveau !== confirmation) throw new Error('Les deux mots de passe ne correspondent pas.')
      if (comptesDemo.some((c) => c.motDePasse === nouveau)) {
        throw new Error('Le nouveau mot de passe ne peut pas reprendre l’ancien.')
      }

      setChargement(true)
      try {
        await attendre(900)
        verifierDisponibilite()
        setEtape('connexion')
      } finally {
        setChargement(false)
      }
    },
    [verifierDisponibilite],
  )

  const deconnecter = useCallback(() => {
    setSession(null)
    setCompteEnCours(null)
    setEmailEnCours('')
    setEtape('connexion')
    setTentativesRestantes(MAX_TENTATIVES)
    setPeremption(0)
  }, [])

  const annulerVerification = useCallback(() => {
    setCompteEnCours(null)
    setPeremption(0)
    setEtape('connexion')
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      session, etape, allerA: setEtape, emailEnCours,
      chargement, envoiEnCours, tentativesRestantes, verrouillage, tentativesCodeRestantes, peremption,
      mode, setMode,
      connecter, verifierCode, renvoyerCode, demanderReinitialisation, reinitialiser, deconnecter, annulerVerification,
    }),
    [session, etape, emailEnCours, chargement, envoiEnCours, tentativesRestantes, verrouillage, tentativesCodeRestantes, peremption, mode, connecter, verifierCode, renvoyerCode, demanderReinitialisation, reinitialiser, deconnecter, annulerVerification],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
