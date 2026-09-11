import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  budgetInitial,
  ecrituresAvecDesequilibre,
  ecrituresInitiales,
  equilibree,
  exercicesInitiaux,
  piecesInitiales,
  planInitial,
  soldeClasse,
  type Compte,
  type Ecriture,
  type Exercice,
  type LigneBudget,
  type Piece,
} from '@/lib/comptabilite'
import { uid } from '@/lib/utils'

export type ModeDemoCompta = 'normal' | 'chargement' | 'vide' | 'desequilibre' | 'erreur' | 'echec'

type Ctx = {
  ecritures: Ecriture[]
  plan: Compte[]
  exercices: Exercice[]
  pieces: Piece[]
  budget: LigneBudget[]
  exerciceId: string
  setExerciceId: (id: string) => void
  exercice: Exercice
  lectureSeule: boolean
  chargement: boolean
  erreur: string | null
  mode: ModeDemoCompta
  setMode: (m: ModeDemoCompta) => void
  recharger: () => void
  ecritureParId: (id: string) => Ecriture | undefined
  compteParNumero: (n: string) => Compte | undefined
  creerEcriture: (e: Omit<Ecriture, 'id' | 'numero' | 'creeePar' | 'valideeLe'>) => Promise<Ecriture>
  modifierEcriture: (id: string, patch: Partial<Ecriture>) => Promise<void>
  supprimerEcriture: (id: string) => Promise<void>
  validerEcritures: (ids: string[]) => Promise<void>
  pointer: (ecritureId: string, ligneId: string, valeur: boolean) => Promise<void>
  rattacherPiece: (pieceId: string, ecritureId: string | null) => Promise<void>
  creerCompte: (c: Compte) => Promise<void>
  modifierCompte: (numero: string, patch: Partial<Compte>) => Promise<void>
  cloturerExercice: (id: string) => Promise<void>
}

const ComptaContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export function ComptaProvider({ children }: { children: ReactNode }) {
  const [ecritures, setEcritures] = useState<Ecriture[]>(ecrituresInitiales)
  const [plan, setPlan] = useState<Compte[]>(planInitial)
  const [exercices, setExercices] = useState<Exercice[]>(exercicesInitiaux)
  const [pieces, setPieces] = useState<Piece[]>(piecesInitiales)
  const [budget] = useState<LigneBudget[]>(budgetInitial)
  const [exerciceId, setExerciceId] = useState('ex-2025')
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoCompta>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoCompta) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Le journal comptable n'a pas pu être interrogé.")
      setEcritures([])
    } else if (m === 'vide') {
      setEcritures([])
    } else {
      setEcritures(m === 'desequilibre' ? ecrituresAvecDesequilibre() : ecrituresInitiales)
    }
    setChargement(false)
  }, [])

  useEffect(() => {
    void charger(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const recharger = useCallback(() => void charger(modeRef.current), [charger])

  const echouerSiDemande = useCallback(async () => {
    await attendre(900)
    if (modeRef.current === 'echec') throw new Error("L'écriture n'a pas pu être enregistrée. Le serveur a refusé l'opération.")
  }, [])

  const exercice = exercices.find((e) => e.id === exerciceId) ?? exercices[exercices.length - 1]
  const lectureSeule = exercice.statut === 'cloture'

  const refuserSiClos = useCallback(
    (exId: string) => {
      const ex = exercices.find((e) => e.id === exId)
      if (ex?.statut === 'cloture') {
        throw new Error(`L'exercice ${ex.libelle} est clôturé : aucune écriture ne peut plus y être ajoutée ni modifiée.`)
      }
    },
    [exercices],
  )

  const ecritureParId = useCallback((id: string) => ecritures.find((e) => e.id === id), [ecritures])
  const compteParNumero = useCallback((n: string) => plan.find((c) => c.numero === n), [plan])

  const creerEcriture = useCallback<Ctx['creerEcriture']>(
    async (data) => {
      refuserSiClos(data.exerciceId)
      await echouerSiDemande()
      const annee = new Date(data.date).getUTCFullYear()
      const nouvelle: Ecriture = {
        ...data,
        id: uid('ecr'),
        numero: `${data.journal}${annee}${String(9000 + ecritures.length).slice(-4)}`,
        creeePar: 'Camille Beauchamp',
        valideeLe: data.statut === 'validee' ? new Date().toISOString() : null,
      }
      setEcritures((l) => [nouvelle, ...l])
      return nouvelle
    },
    [echouerSiDemande, ecritures.length, refuserSiClos],
  )

  const modifierEcriture = useCallback<Ctx['modifierEcriture']>(
    async (id, patch) => {
      const cible = ecritures.find((e) => e.id === id)
      if (cible) refuserSiClos(cible.exerciceId)
      if (cible?.statut === 'validee' && patch.statut !== 'validee') {
        throw new Error('Une écriture validée ne peut plus être modifiée. Passez par une écriture de contrepassation.')
      }
      await echouerSiDemande()
      setEcritures((l) => l.map((e) => (e.id === id ? { ...e, ...patch } : e)))
    },
    [echouerSiDemande, ecritures, refuserSiClos],
  )

  const supprimerEcriture = useCallback<Ctx['supprimerEcriture']>(
    async (id) => {
      const cible = ecritures.find((e) => e.id === id)
      if (cible) refuserSiClos(cible.exerciceId)
      if (cible?.statut === 'validee') throw new Error('Une écriture validée ne peut pas être supprimée.')
      await echouerSiDemande()
      setEcritures((l) => l.filter((e) => e.id !== id))
    },
    [echouerSiDemande, ecritures, refuserSiClos],
  )

  const validerEcritures = useCallback<Ctx['validerEcritures']>(
    async (ids) => {
      const cibles = ecritures.filter((e) => ids.includes(e.id))
      for (const e of cibles) {
        refuserSiClos(e.exerciceId)
        if (!equilibree(e)) {
          throw new Error(`L'écriture ${e.numero} est déséquilibrée : elle ne peut pas être validée.`)
        }
      }
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      setEcritures((l) => l.map((e) => (ids.includes(e.id) ? { ...e, statut: 'validee', valideeLe: maintenant } : e)))
    },
    [echouerSiDemande, ecritures, refuserSiClos],
  )

  const pointer = useCallback<Ctx['pointer']>(
    async (ecritureId, ligneId, valeur) => {
      await echouerSiDemande()
      setEcritures((l) =>
        l.map((e) =>
          e.id === ecritureId
            ? { ...e, lignes: e.lignes.map((li) => (li.id === ligneId ? { ...li, rapprochee: valeur } : li)) }
            : e,
        ),
      )
    },
    [echouerSiDemande],
  )

  const rattacherPiece = useCallback<Ctx['rattacherPiece']>(
    async (pieceId, ecritureId) => {
      await echouerSiDemande()
      setPieces((l) => l.map((p) => (p.id === pieceId ? { ...p, ecritureId } : p)))
      if (ecritureId) setEcritures((l) => l.map((e) => (e.id === ecritureId ? { ...e, pieceId } : e)))
    },
    [echouerSiDemande],
  )

  const creerCompte = useCallback<Ctx['creerCompte']>(
    async (c) => {
      if (plan.some((p) => p.numero === c.numero)) throw new Error(`Le compte ${c.numero} existe déjà dans le plan.`)
      await echouerSiDemande()
      setPlan((l) => [...l, c].sort((a, b) => a.numero.localeCompare(b.numero)))
    },
    [echouerSiDemande, plan],
  )

  const modifierCompte = useCallback<Ctx['modifierCompte']>(
    async (numero, patch) => {
      await echouerSiDemande()
      setPlan((l) => l.map((c) => (c.numero === numero ? { ...c, ...patch } : c)))
    },
    [echouerSiDemande],
  )

  const cloturerExercice = useCallback<Ctx['cloturerExercice']>(
    async (id) => {
      const ex = exercices.find((e) => e.id === id)
      if (!ex) throw new Error('Exercice introuvable.')
      if (ex.statut === 'cloture') throw new Error(`L'exercice ${ex.libelle} est déjà clôturé.`)
      const enSuspens = ecritures.filter((e) => e.exerciceId === id && e.statut === 'brouillon')
      if (enSuspens.length > 0) {
        throw new Error(
          `${enSuspens.length} écriture(s) sont encore en brouillon sur ${ex.libelle}. Validez-les ou supprimez-les avant la clôture.`,
        )
      }
      await echouerSiDemande()

      // Écriture de résultat : solde des classes 6 et 7 vers le compte 120000
      const surExercice = ecritures.filter((e) => e.exerciceId === id && e.statut === 'validee')
      const charges = soldeClasse(surExercice, 6).solde
      const produits = -soldeClasse(surExercice, 7).solde
      const resultat = Math.round((produits - charges) * 100) / 100

      const ecritureResultat: Ecriture = {
        id: uid('ecr'),
        numero: `OD${new Date(ex.fin).getUTCFullYear()}CLOT`,
        exerciceId: id,
        journal: 'OD',
        date: ex.fin,
        libelle: `Clôture de l'exercice ${ex.libelle} — affectation du résultat`,
        reference: `CLOT-${ex.libelle}`,
        tiers: 'Interne',
        statut: 'validee',
        lignes: [
          {
            id: uid('lig'),
            compte: '120000',
            libelle: resultat >= 0 ? 'Excédent de l’exercice' : 'Déficit de l’exercice',
            debit: resultat < 0 ? Math.abs(resultat) : 0,
            credit: resultat >= 0 ? resultat : 0,
            rapprochee: false,
          },
          {
            id: uid('lig'),
            compte: '106000',
            libelle: 'Affectation en réserves',
            debit: resultat >= 0 ? resultat : 0,
            credit: resultat < 0 ? Math.abs(resultat) : 0,
            rapprochee: false,
          },
        ],
        pieceId: null,
        creeePar: 'Camille Beauchamp',
        valideeLe: new Date().toISOString(),
      }

      setEcritures((l) => [ecritureResultat, ...l])
      setExercices((l) =>
        l.map((e) =>
          e.id === id ? { ...e, statut: 'cloture', clotureLe: new Date().toISOString(), clotureePar: 'Camille Beauchamp' } : e,
        ),
      )
    },
    [echouerSiDemande, ecritures, exercices],
  )

  const value = useMemo<Ctx>(
    () => ({
      ecritures, plan, exercices, pieces, budget, exerciceId, setExerciceId, exercice, lectureSeule,
      chargement, erreur, mode, setMode, recharger, ecritureParId, compteParNumero,
      creerEcriture, modifierEcriture, supprimerEcriture, validerEcritures, pointer, rattacherPiece,
      creerCompte, modifierCompte, cloturerExercice,
    }),
    [ecritures, plan, exercices, pieces, budget, exerciceId, exercice, lectureSeule, chargement, erreur, mode, recharger, ecritureParId, compteParNumero, creerEcriture, modifierEcriture, supprimerEcriture, validerEcritures, pointer, rattacherPiece, creerCompte, modifierCompte, cloturerExercice],
  )

  return <ComptaContext.Provider value={value}>{children}</ComptaContext.Provider>
}

export function useCompta() {
  const ctx = useContext(ComptaContext)
  if (!ctx) throw new Error('useCompta doit être utilisé dans ComptaProvider')
  return ctx
}
