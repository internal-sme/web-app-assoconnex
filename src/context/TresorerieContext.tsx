import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  categoriesInitiales,
  comptesInitiaux,
  mouvementsInitiaux,
  previsionsInitiales,
  virementsInitiaux,
  type Categorie,
  type CompteBancaire,
  type Horizon,
  type Mouvement,
  type Prevision,
  type Virement,
} from '@/lib/tresorerie'
import { uid } from '@/lib/utils'

export type ModeDemoTreso = 'normal' | 'chargement' | 'vide' | 'erreur' | 'echec'

type Ctx = {
  comptes: CompteBancaire[]
  mouvements: Mouvement[]
  categories: Categorie[]
  previsions: Prevision[]
  virements: Virement[]
  horizon: Horizon
  setHorizon: (h: Horizon) => void
  chargement: boolean
  erreur: string | null
  mode: ModeDemoTreso
  setMode: (m: ModeDemoTreso) => void
  recharger: () => void
  compteParId: (id: string) => CompteBancaire | undefined
  categorieParId: (id: string | null) => Categorie | undefined
  creerMouvement: (m: Omit<Mouvement, 'id'>) => Promise<Mouvement>
  categoriser: (mouvementId: string, categorieId: string | null) => Promise<void>
  categoriserLot: (ids: string[], categorieId: string) => Promise<void>
  pointer: (mouvementId: string, valeur: boolean) => Promise<void>
  creerCompte: (c: Omit<CompteBancaire, 'id'>) => Promise<void>
  modifierCompte: (id: string, patch: Partial<CompteBancaire>) => Promise<void>
  creerVirement: (v: Omit<Virement, 'id' | 'statut' | 'creePar'>, executer: boolean) => Promise<void>
  executerVirement: (id: string) => Promise<void>
  annulerVirement: (id: string) => Promise<void>
  creerPrevision: (p: Omit<Prevision, 'id'>) => Promise<void>
  supprimerPrevision: (id: string) => Promise<void>
  creerCategorie: (c: Omit<Categorie, 'id'>) => Promise<void>
  modifierCategorie: (id: string, patch: Partial<Categorie>) => Promise<void>
}

const TresorerieContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export function TresorerieProvider({ children }: { children: ReactNode }) {
  const [comptes, setComptes] = useState<CompteBancaire[]>(comptesInitiaux)
  const [mouvements, setMouvements] = useState<Mouvement[]>(mouvementsInitiaux)
  const [categories, setCategories] = useState<Categorie[]>(categoriesInitiales)
  const [previsions, setPrevisions] = useState<Prevision[]>(previsionsInitiales)
  const [virements, setVirements] = useState<Virement[]>(virementsInitiaux)
  const [horizon, setHorizon] = useState<Horizon>(30)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoTreso>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoTreso) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("La synchronisation bancaire n'a pas abouti.")
      setMouvements([])
    } else if (m === 'vide') {
      setMouvements([])
      setPrevisions([])
    } else {
      setMouvements(mouvementsInitiaux)
      setPrevisions(previsionsInitiales)
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
    if (modeRef.current === 'echec') throw new Error("L'opération a échoué. Le serveur a refusé l'enregistrement.")
  }, [])

  const compteParId = useCallback((id: string) => comptes.find((c) => c.id === id), [comptes])
  const categorieParId = useCallback((id: string | null) => (id ? categories.find((c) => c.id === id) : undefined), [categories])

  const creerMouvement = useCallback<Ctx['creerMouvement']>(
    async (m) => {
      await echouerSiDemande()
      const nouveau: Mouvement = { ...m, id: uid('mv') }
      setMouvements((l) => [nouveau, ...l])
      return nouveau
    },
    [echouerSiDemande],
  )

  const categoriser = useCallback<Ctx['categoriser']>(
    async (mouvementId, categorieId) => {
      await echouerSiDemande()
      setMouvements((l) => l.map((m) => (m.id === mouvementId ? { ...m, categorieId } : m)))
    },
    [echouerSiDemande],
  )

  const categoriserLot = useCallback<Ctx['categoriserLot']>(
    async (ids, categorieId) => {
      await echouerSiDemande()
      setMouvements((l) => l.map((m) => (ids.includes(m.id) ? { ...m, categorieId } : m)))
    },
    [echouerSiDemande],
  )

  const pointer = useCallback<Ctx['pointer']>(
    async (mouvementId, valeur) => {
      await echouerSiDemande()
      setMouvements((l) => l.map((m) => (m.id === mouvementId ? { ...m, rapproche: valeur } : m)))
    },
    [echouerSiDemande],
  )

  const creerCompte = useCallback<Ctx['creerCompte']>(
    async (c) => {
      await echouerSiDemande()
      setComptes((l) => [...l, { ...c, id: uid('cb') }])
    },
    [echouerSiDemande],
  )

  const modifierCompte = useCallback<Ctx['modifierCompte']>(
    async (id, patch) => {
      await echouerSiDemande()
      setComptes((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    },
    [echouerSiDemande],
  )

  const inscrireVirement = useCallback((v: Virement) => {
    setMouvements((l) => [
      {
        id: uid('mv'),
        compteId: v.compteSourceId,
        date: v.date,
        libelle: `Virement interne — ${v.motif}`,
        tiers: 'Virement interne',
        montant: v.montant,
        sens: 'sortie',
        categorieId: null,
        reference: `VRT-${v.id.toUpperCase()}`,
        rapproche: false,
        virementId: v.id,
        note: '',
      },
      {
        id: uid('mv'),
        compteId: v.compteDestinationId,
        date: v.date,
        libelle: `Virement interne — ${v.motif}`,
        tiers: 'Virement interne',
        montant: v.montant,
        sens: 'entree',
        categorieId: null,
        reference: `VRT-${v.id.toUpperCase()}`,
        rapproche: false,
        virementId: v.id,
        note: '',
      },
      ...l,
    ])
  }, [])

  const creerVirement = useCallback<Ctx['creerVirement']>(
    async (v, executerMaintenant) => {
      if (v.compteSourceId === v.compteDestinationId) {
        throw new Error('Le compte de départ et le compte d’arrivée doivent être différents.')
      }
      await echouerSiDemande()
      const nouveau: Virement = { ...v, id: uid('vr'), statut: executerMaintenant ? 'execute' : 'planifie', creePar: 'Camille Beauchamp' }
      setVirements((l) => [nouveau, ...l])
      if (executerMaintenant) inscrireVirement(nouveau)
    },
    [echouerSiDemande, inscrireVirement],
  )

  const executerVirement = useCallback<Ctx['executerVirement']>(
    async (id) => {
      const v = virements.find((x) => x.id === id)
      if (!v) throw new Error('Virement introuvable.')
      if (v.statut !== 'planifie') throw new Error('Seul un virement planifié peut être exécuté.')
      await echouerSiDemande()
      const execute: Virement = { ...v, statut: 'execute' }
      setVirements((l) => l.map((x) => (x.id === id ? execute : x)))
      inscrireVirement(execute)
    },
    [echouerSiDemande, virements, inscrireVirement],
  )

  const annulerVirement = useCallback<Ctx['annulerVirement']>(
    async (id) => {
      const v = virements.find((x) => x.id === id)
      if (v?.statut === 'execute') throw new Error('Un virement exécuté ne peut pas être annulé : passez un virement inverse.')
      await echouerSiDemande()
      setVirements((l) => l.map((x) => (x.id === id ? { ...x, statut: 'annule' } : x)))
    },
    [echouerSiDemande, virements],
  )

  const creerPrevision = useCallback<Ctx['creerPrevision']>(
    async (p) => {
      await echouerSiDemande()
      setPrevisions((l) => [...l, { ...p, id: uid('pv') }])
    },
    [echouerSiDemande],
  )

  const supprimerPrevision = useCallback<Ctx['supprimerPrevision']>(
    async (id) => {
      await echouerSiDemande()
      setPrevisions((l) => l.filter((p) => p.id !== id))
    },
    [echouerSiDemande],
  )

  const creerCategorie = useCallback<Ctx['creerCategorie']>(
    async (c) => {
      await echouerSiDemande()
      setCategories((l) => [...l, { ...c, id: uid('ct') }])
    },
    [echouerSiDemande],
  )

  const modifierCategorie = useCallback<Ctx['modifierCategorie']>(
    async (id, patch) => {
      await echouerSiDemande()
      setCategories((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    },
    [echouerSiDemande],
  )

  const value = useMemo<Ctx>(
    () => ({
      comptes, mouvements, categories, previsions, virements, horizon, setHorizon,
      chargement, erreur, mode, setMode, recharger, compteParId, categorieParId,
      creerMouvement, categoriser, categoriserLot, pointer, creerCompte, modifierCompte,
      creerVirement, executerVirement, annulerVirement, creerPrevision, supprimerPrevision,
      creerCategorie, modifierCategorie,
    }),
    [comptes, mouvements, categories, previsions, virements, horizon, chargement, erreur, mode, recharger, compteParId, categorieParId, creerMouvement, categoriser, categoriserLot, pointer, creerCompte, modifierCompte, creerVirement, executerVirement, annulerVirement, creerPrevision, supprimerPrevision, creerCategorie, modifierCategorie],
  )

  return <TresorerieContext.Provider value={value}>{children}</TresorerieContext.Provider>
}

export function useTresorerie() {
  const ctx = useContext(TresorerieContext)
  if (!ctx) throw new Error('useTresorerie doit être utilisé dans TresorerieProvider')
  return ctx
}
