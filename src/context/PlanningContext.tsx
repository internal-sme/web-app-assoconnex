import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  absencesInitiales,
  affectationsEnConflit,
  affectationsIndisponibles,
  affectationsInitiales,
  disponibilitesInitiales,
  remplacementsInitiaux,
  type Absence,
  type Affectation,
  type Disponibilite,
  type Remplacement,
  type StatutAffectation,
} from '@/lib/planning'
import { uid } from '@/lib/utils'

export type ModeDemoPlanning = 'normal' | 'chargement' | 'vide' | 'conflit' | 'indisponible' | 'erreur' | 'echec'

type Ctx = {
  affectations: Affectation[]
  absences: Absence[]
  disponibilites: Disponibilite[]
  remplacements: Remplacement[]
  chargement: boolean
  erreur: string | null
  enregistrement: boolean
  mode: ModeDemoPlanning
  setMode: (m: ModeDemoPlanning) => void
  recharger: () => void
  affecter: (a: Omit<Affectation, 'id'>) => Promise<Affectation>
  deplacer: (id: string, jour: string, creneauId: string, posteId?: string) => Promise<void>
  modifierAffectation: (id: string, patch: Partial<Affectation>) => Promise<void>
  changerStatutAffectation: (id: string, statut: StatutAffectation) => Promise<void>
  retirer: (id: string) => Promise<void>
  demanderRemplacement: (affectationId: string, motif: string) => Promise<void>
  pourvoirRemplacement: (remplacementId: string, remplacantId: string) => Promise<void>
  refuserRemplacement: (remplacementId: string) => Promise<void>
  declarerAbsence: (a: Omit<Absence, 'id'>) => Promise<void>
  validerAbsence: (id: string) => Promise<void>
  supprimerAbsence: (id: string) => Promise<void>
  basculerDisponibilite: (personneId: string, cle: string) => Promise<void>
}

const PlanningContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export function PlanningProvider({ children }: { children: ReactNode }) {
  const [affectations, setAffectations] = useState<Affectation[]>(affectationsInitiales)
  const [absences, setAbsences] = useState<Absence[]>(absencesInitiales)
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>(disponibilitesInitiales)
  const [remplacements, setRemplacements] = useState<Remplacement[]>(remplacementsInitiaux)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoPlanning>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoPlanning) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Le planning n'a pas pu être interrogé.")
      setAffectations([])
    } else if (m === 'vide') {
      setAffectations([])
    } else if (m === 'conflit') {
      setAffectations(affectationsEnConflit())
    } else if (m === 'indisponible') {
      setAffectations(affectationsIndisponibles())
    } else {
      setAffectations(affectationsInitiales)
    }
    setAbsences(absencesInitiales)
    setRemplacements(remplacementsInitiaux)
    setChargement(false)
  }, [])

  useEffect(() => {
    void charger(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const recharger = useCallback(() => void charger(modeRef.current), [charger])

  const operation = useCallback(async <T,>(fn: () => T, delai = 500): Promise<T> => {
    setEnregistrement(true)
    try {
      await attendre(delai)
      if (modeRef.current === 'echec') throw new Error("L'enregistrement a échoué. Le serveur a refusé l'opération.")
      return fn()
    } finally {
      setEnregistrement(false)
    }
  }, [])

  const affecter = useCallback<Ctx['affecter']>(
    async (a) => {
      const doublon = affectations.find(
        (x) => x.statut !== 'annulee' && x.jour === a.jour && x.creneauId === a.creneauId && x.posteId === a.posteId && x.personneId === a.personneId,
      )
      if (doublon) throw new Error('Cette personne est déjà affectée à ce poste sur ce créneau.')
      return operation(() => {
        const nouvelle: Affectation = { ...a, id: uid('af') }
        setAffectations((l) => [...l, nouvelle])
        return nouvelle
      })
    },
    [operation, affectations],
  )

  // Le glisser-déposer doit rester fluide : latence courte
  const deplacer = useCallback<Ctx['deplacer']>(
    async (id, jour, creneauId, posteId) => {
      await operation(
        () => setAffectations((l) => l.map((a) => (a.id === id ? { ...a, jour, creneauId, posteId: posteId ?? a.posteId } : a))),
        200,
      )
    },
    [operation],
  )

  const modifierAffectation = useCallback<Ctx['modifierAffectation']>(
    async (id, patch) => {
      await operation(() => setAffectations((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a))))
    },
    [operation],
  )

  const changerStatutAffectation = useCallback<Ctx['changerStatutAffectation']>(
    async (id, statut) => {
      await operation(() => setAffectations((l) => l.map((a) => (a.id === id ? { ...a, statut } : a))), 250)
    },
    [operation],
  )

  const retirer = useCallback<Ctx['retirer']>(
    async (id) => {
      await operation(() => {
        setAffectations((l) => l.filter((a) => a.id !== id))
        setRemplacements((l) => l.filter((r) => r.affectationId !== id))
      })
    },
    [operation],
  )

  const demanderRemplacement = useCallback<Ctx['demanderRemplacement']>(
    async (affectationId, motif) => {
      if (!motif.trim()) throw new Error('Un motif est obligatoire : il aide les autres bénévoles à se décider.')
      const existe = remplacements.some((r) => r.affectationId === affectationId && r.statut === 'ouverte')
      if (existe) throw new Error('Une demande de remplacement est déjà ouverte sur ce créneau.')
      const cible = affectations.find((a) => a.id === affectationId)
      if (!cible) throw new Error('Affectation introuvable.')
      await operation(() => {
        setAffectations((l) => l.map((a) => (a.id === affectationId ? { ...a, statut: 'remplacement' } : a)))
        setRemplacements((l) => [
          {
            id: uid('rp'),
            affectationId,
            demandeurId: cible.personneId,
            motif: motif.trim(),
            demandeeLe: new Date().toISOString().slice(0, 10),
            statut: 'ouverte',
            remplacantId: null,
            reponduLe: null,
          },
          ...l,
        ])
      })
    },
    [operation, remplacements, affectations],
  )

  const pourvoirRemplacement = useCallback<Ctx['pourvoirRemplacement']>(
    async (remplacementId, remplacantId) => {
      const r = remplacements.find((x) => x.id === remplacementId)
      if (!r) throw new Error('Demande introuvable.')
      if (r.statut !== 'ouverte') throw new Error('Cette demande a déjà été traitée.')
      await operation(() => {
        setRemplacements((l) =>
          l.map((x) => (x.id === remplacementId ? { ...x, statut: 'pourvue', remplacantId, reponduLe: new Date().toISOString().slice(0, 10) } : x)),
        )
        setAffectations((l) =>
          l.map((a) => (a.id === r.affectationId ? { ...a, personneId: remplacantId, statut: 'confirmee' } : a)),
        )
      })
    },
    [operation, remplacements],
  )

  const refuserRemplacement = useCallback<Ctx['refuserRemplacement']>(
    async (remplacementId) => {
      const r = remplacements.find((x) => x.id === remplacementId)
      await operation(() => {
        setRemplacements((l) => l.map((x) => (x.id === remplacementId ? { ...x, statut: 'refusee', reponduLe: new Date().toISOString().slice(0, 10) } : x)))
        if (r) setAffectations((l) => l.map((a) => (a.id === r.affectationId ? { ...a, statut: 'planifiee' } : a)))
      })
    },
    [operation, remplacements],
  )

  const declarerAbsence = useCallback<Ctx['declarerAbsence']>(
    async (a) => {
      if (a.fin < a.debut) throw new Error('La date de fin ne peut pas précéder la date de début.')
      await operation(() => setAbsences((l) => [...l, { ...a, id: uid('ab') }]))
    },
    [operation],
  )

  const validerAbsence = useCallback<Ctx['validerAbsence']>(
    async (id) => {
      await operation(() => setAbsences((l) => l.map((a) => (a.id === id ? { ...a, statut: 'validee' } : a))))
    },
    [operation],
  )

  const supprimerAbsence = useCallback<Ctx['supprimerAbsence']>(
    async (id) => {
      await operation(() => setAbsences((l) => l.filter((a) => a.id !== id)))
    },
    [operation],
  )

  const basculerDisponibilite = useCallback<Ctx['basculerDisponibilite']>(
    async (personneId, cle) => {
      await operation(
        () =>
          setDisponibilites((l) =>
            l.map((d) =>
              d.personneId === personneId
                ? { ...d, ouverts: d.ouverts.includes(cle) ? d.ouverts.filter((x) => x !== cle) : [...d.ouverts, cle] }
                : d,
            ),
          ),
        180,
      )
    },
    [operation],
  )

  const value = useMemo<Ctx>(
    () => ({
      affectations, absences, disponibilites, remplacements,
      chargement, erreur, enregistrement, mode, setMode, recharger,
      affecter, deplacer, modifierAffectation, changerStatutAffectation, retirer,
      demanderRemplacement, pourvoirRemplacement, refuserRemplacement,
      declarerAbsence, validerAbsence, supprimerAbsence, basculerDisponibilite,
    }),
    [affectations, absences, disponibilites, remplacements, chargement, erreur, enregistrement, mode, recharger, affecter, deplacer, modifierAffectation, changerStatutAffectation, retirer, demanderRemplacement, pourvoirRemplacement, refuserRemplacement, declarerAbsence, validerAbsence, supprimerAbsence, basculerDisponibilite],
  )

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>
}

export function usePlanning() {
  const ctx = useContext(PlanningContext)
  if (!ctx) throw new Error('usePlanning doit être utilisé dans PlanningProvider')
  return ctx
}
