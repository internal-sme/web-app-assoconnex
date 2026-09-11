import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  MOI_AGENDA,
  calendriersInitiaux,
  comptesSynchroInitiaux,
  evenementsAvecConflits,
  evenementsInitiaux,
  sallesInitiales,
  type Calendrier,
  type CompteSynchro,
  type EvenementAgenda,
  type Participant,
  type ReponseParticipant,
  type Salle,
} from '@/lib/agenda'
import { uid } from '@/lib/utils'

export type ModeDemoAgenda = 'normal' | 'chargement' | 'vide' | 'conflit' | 'erreur' | 'echec' | 'erreur-synchro'

export type SaisieEvenement = Omit<EvenementAgenda, 'id' | 'reference' | 'statut' | 'motifAnnulation'> & {
  statut?: EvenementAgenda['statut']
}

type Ctx = {
  evenements: EvenementAgenda[]
  calendriers: Calendrier[]
  salles: Salle[]
  comptes: CompteSynchro[]
  chargement: boolean
  erreur: string | null
  enregistrement: boolean
  mode: ModeDemoAgenda
  setMode: (m: ModeDemoAgenda) => void
  recharger: () => void
  evenementParId: (id: string) => EvenementAgenda | undefined
  calendrierParId: (id: string) => Calendrier | undefined
  salleParId: (id: string | null) => Salle | undefined
  basculerCalendrier: (id: string) => void
  creer: (s: SaisieEvenement) => Promise<EvenementAgenda>
  modifier: (id: string, patch: Partial<EvenementAgenda>) => Promise<void>
  supprimer: (id: string) => Promise<void>
  annuler: (id: string, motif: string) => Promise<void>
  repondre: (id: string, participantId: string, reponse: ReponseParticipant) => Promise<void>
  ajouterParticipant: (id: string, p: Omit<Participant, 'id'>) => Promise<void>
  retirerParticipant: (id: string, participantId: string) => Promise<void>
  synchroniser: (compteId: string) => Promise<void>
  basculerCompte: (compteId: string, actif: boolean) => Promise<void>
}

const AgendaContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export function AgendaProvider({ children }: { children: ReactNode }) {
  const [evenements, setEvenements] = useState<EvenementAgenda[]>(evenementsInitiaux)
  const [calendriers, setCalendriers] = useState<Calendrier[]>(calendriersInitiaux)
  const [comptes, setComptes] = useState<CompteSynchro[]>(comptesSynchroInitiaux)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoAgenda>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoAgenda) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("L'agenda n'a pas pu être interrogé.")
      setEvenements([])
    } else if (m === 'vide') {
      setEvenements([])
    } else if (m === 'conflit') {
      setEvenements(evenementsAvecConflits())
    } else {
      setEvenements(evenementsInitiaux)
    }
    // Le mode « erreur de synchronisation » met tous les comptes connectés en échec
    setComptes(
      m === 'erreur-synchro'
        ? comptesSynchroInitiaux.map((c) =>
            c.etat === 'connecte'
              ? { ...c, etat: 'erreur' as const, message: 'La dernière synchronisation a échoué : le service distant est injoignable.' }
              : c,
          )
        : comptesSynchroInitiaux,
    )
    setChargement(false)
  }, [])

  useEffect(() => {
    void charger(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const recharger = useCallback(() => void charger(modeRef.current), [charger])

  const operation = useCallback(async <T,>(fn: () => T, delai = 700): Promise<T> => {
    setEnregistrement(true)
    try {
      await attendre(delai)
      if (modeRef.current === 'echec') throw new Error("L'enregistrement a échoué. Le serveur a refusé l'opération.")
      return fn()
    } finally {
      setEnregistrement(false)
    }
  }, [])

  const evenementParId = useCallback((id: string) => evenements.find((e) => e.id === id), [evenements])
  const calendrierParId = useCallback((id: string) => calendriers.find((c) => c.id === id), [calendriers])
  const salleParId = useCallback((id: string | null) => (id ? sallesInitiales.find((s) => s.id === id) : undefined), [])

  const basculerCalendrier = useCallback((id: string) => {
    setCalendriers((l) => l.map((c) => (c.id === id ? { ...c, actif: !c.actif } : c)))
  }, [])

  const maj = useCallback((id: string, fn: (e: EvenementAgenda) => EvenementAgenda) => {
    setEvenements((l) => l.map((e) => (e.id === id ? fn(e) : e)))
  }, [])

  const creer = useCallback<Ctx['creer']>(
    async (s) => {
      if (new Date(s.fin) <= new Date(s.debut)) {
        throw new Error('L’heure de fin doit être postérieure à l’heure de début.')
      }
      return operation(() => {
        const nouveau: EvenementAgenda = {
          ...s,
          id: uid('ev'),
          reference: `EVT-${String(900 + evenements.length)}`,
          statut: s.statut ?? 'confirme',
          motifAnnulation: '',
        }
        setEvenements((l) => [...l, nouveau].sort((a, b) => (a.debut < b.debut ? -1 : 1)))
        return nouveau
      })
    },
    [operation, evenements.length],
  )

  const modifier = useCallback<Ctx['modifier']>(
    async (id, patch) => {
      await operation(() => setEvenements((l) => l.map((e) => (e.id === id ? { ...e, ...patch } : e)).sort((a, b) => (a.debut < b.debut ? -1 : 1))))
    },
    [operation],
  )

  const supprimer = useCallback<Ctx['supprimer']>(
    async (id) => {
      await operation(() => setEvenements((l) => l.filter((e) => e.id !== id)))
    },
    [operation],
  )

  const annuler = useCallback<Ctx['annuler']>(
    async (id, motif) => {
      if (!motif.trim()) throw new Error('Un motif est obligatoire : les participants doivent savoir pourquoi la séance saute.')
      await operation(() => maj(id, (e) => ({ ...e, statut: 'annule', motifAnnulation: motif.trim() })))
    },
    [operation, maj],
  )

  const repondre = useCallback<Ctx['repondre']>(
    async (id, participantId, reponse) => {
      await operation(
        () => maj(id, (e) => ({ ...e, participants: e.participants.map((p) => (p.id === participantId ? { ...p, reponse } : p)) })),
        300,
      )
    },
    [operation, maj],
  )

  const ajouterParticipant = useCallback<Ctx['ajouterParticipant']>(
    async (id, p) => {
      const cible = evenements.find((e) => e.id === id)
      if (cible?.participants.some((x) => x.email === p.email)) {
        throw new Error(`${p.nom} figure déjà parmi les participants.`)
      }
      await operation(() => maj(id, (e) => ({ ...e, participants: [...e.participants, { ...p, id: uid('pa') }] })))
    },
    [operation, maj, evenements],
  )

  const retirerParticipant = useCallback<Ctx['retirerParticipant']>(
    async (id, participantId) => {
      await operation(() => maj(id, (e) => ({ ...e, participants: e.participants.filter((p) => p.id !== participantId) })), 300)
    },
    [operation, maj],
  )

  const synchroniser = useCallback<Ctx['synchroniser']>(
    async (compteId) => {
      setEnregistrement(true)
      try {
        await attendre(1200)
        const echec = modeRef.current === 'echec' || modeRef.current === 'erreur-synchro'
        setComptes((l) =>
          l.map((c) =>
            c.id === compteId
              ? echec
                ? { ...c, etat: 'erreur', message: 'La synchronisation a échoué : le service distant est injoignable.' }
                : { ...c, etat: 'connecte', message: '', derniereSynchro: new Date().toISOString() }
              : c,
          ),
        )
        if (echec) throw new Error('La synchronisation a échoué : le service distant est injoignable.')
      } finally {
        setEnregistrement(false)
      }
    },
    [],
  )

  const basculerCompte = useCallback<Ctx['basculerCompte']>(
    async (compteId, actif) => {
      await operation(() =>
        setComptes((l) =>
          l.map((c) =>
            c.id === compteId
              ? actif
                ? { ...c, etat: 'connecte', message: '', derniereSynchro: new Date().toISOString() }
                : { ...c, etat: 'inactif', message: 'Synchronisation désactivée.' }
              : c,
          ),
        ),
      )
    },
    [operation],
  )

  const value = useMemo<Ctx>(
    () => ({
      evenements, calendriers, salles: sallesInitiales, comptes,
      chargement, erreur, enregistrement, mode, setMode, recharger,
      evenementParId, calendrierParId, salleParId, basculerCalendrier,
      creer, modifier, supprimer, annuler, repondre, ajouterParticipant, retirerParticipant,
      synchroniser, basculerCompte,
    }),
    [evenements, calendriers, comptes, chargement, erreur, enregistrement, mode, recharger, evenementParId, calendrierParId, salleParId, basculerCalendrier, creer, modifier, supprimer, annuler, repondre, ajouterParticipant, retirerParticipant, synchroniser, basculerCompte],
  )

  return <AgendaContext.Provider value={value}>{children}</AgendaContext.Provider>
}

export function useAgenda() {
  const ctx = useContext(AgendaContext)
  if (!ctx) throw new Error('useAgenda doit être utilisé dans AgendaProvider')
  return ctx
}

export { MOI_AGENDA }
