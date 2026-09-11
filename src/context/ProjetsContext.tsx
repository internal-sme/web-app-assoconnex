import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  budgetProjet,
  projetsAvecDepassement,
  projetsInitiaux,
  type EvenementProjet,
  type Jalon,
  type LigneBudgetProjet,
  type Projet,
  type Risque,
  type StatutProjet,
} from '@/lib/projets'
import { uid } from '@/lib/utils'

export type ModeDemoProjets = 'normal' | 'chargement' | 'vide' | 'depassement' | 'erreur' | 'echec'

export type SaisieProjet = Pick<
  Projet,
  'code' | 'nom' | 'description' | 'objectif' | 'statut' | 'responsable' | 'dateDebut' | 'dateFin'
> & { budgetDepense: number; budgetRecette: number }

type Ctx = {
  projets: Projet[]
  chargement: boolean
  erreur: string | null
  enregistrement: boolean
  mode: ModeDemoProjets
  setMode: (m: ModeDemoProjets) => void
  recharger: () => void
  projetParId: (id: string) => Projet | undefined
  creer: (s: SaisieProjet) => Promise<Projet>
  modifier: (id: string, patch: Partial<Projet>) => Promise<void>
  changerStatut: (id: string, statut: StatutProjet) => Promise<void>
  cloturer: (id: string, bilan: string) => Promise<void>
  ajouterJalon: (id: string, j: Omit<Jalon, 'id'>) => Promise<void>
  changerStatutJalon: (id: string, jalonId: string, statut: Jalon['statut']) => Promise<void>
  ajouterRisque: (id: string, r: Omit<Risque, 'id'>) => Promise<void>
  changerStatutRisque: (id: string, risqueId: string, statut: Risque['statut']) => Promise<void>
  ajouterLigneBudget: (id: string, l: Omit<LigneBudgetProjet, 'id'>) => Promise<void>
}

const ProjetsContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function ev(libelle: string, detail: string, tone: EvenementProjet['tone'] = 'neutral'): EvenementProjet {
  return { id: uid('ap'), quand: new Date().toISOString(), auteur: 'Camille Beauchamp', libelle, detail, tone }
}

export function ProjetsProvider({ children }: { children: ReactNode }) {
  const [projets, setProjets] = useState<Projet[]>(projetsInitiaux)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoProjets>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoProjets) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Le service des projets n'a pas répondu.")
      setProjets([])
    } else if (m === 'vide') {
      setProjets([])
    } else if (m === 'depassement') {
      setProjets(projetsAvecDepassement())
    } else {
      setProjets(projetsInitiaux)
    }
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

  const projetParId = useCallback((id: string) => projets.find((p) => p.id === id), [projets])

  const maj = useCallback((id: string, fn: (p: Projet) => Projet) => {
    setProjets((l) => l.map((p) => (p.id === id ? fn(p) : p)))
  }, [])

  const refuserSiCloture = useCallback(
    (id: string) => {
      const p = projets.find((x) => x.id === id)
      if (p?.statut === 'cloture') {
        throw new Error(`Le projet « ${p.nom} » est clôturé : il ne peut plus être modifié.`)
      }
    },
    [projets],
  )

  const creer = useCallback<Ctx['creer']>(
    async (s) => {
      if (new Date(s.dateFin) <= new Date(s.dateDebut)) {
        throw new Error('La date de fin doit être postérieure à la date de début.')
      }
      if (projets.some((p) => p.code.toLowerCase() === s.code.trim().toLowerCase())) {
        throw new Error(`Le code « ${s.code} » est déjà utilisé par un autre projet.`)
      }
      return operation(() => {
        const nouveau: Projet = {
          id: uid('pj'),
          code: s.code.trim().toUpperCase(),
          nom: s.nom.trim(),
          description: s.description.trim(),
          objectif: s.objectif.trim(),
          statut: s.statut,
          responsable: s.responsable,
          equipe: [{ nom: s.responsable, role: 'Chef de projet', charge: 20 }],
          dateDebut: new Date(s.dateDebut).toISOString(),
          dateFin: new Date(s.dateFin).toISOString(),
          budget: [
            ...(s.budgetDepense > 0
              ? [{ id: uid('bp'), poste: 'Dépenses prévisionnelles', sens: 'depense' as const, prevu: s.budgetDepense, realise: 0, compteComptable: '658000' }]
              : []),
            ...(s.budgetRecette > 0
              ? [{ id: uid('bp'), poste: 'Recettes prévisionnelles', sens: 'recette' as const, prevu: s.budgetRecette, realise: 0, compteComptable: '758000' }]
              : []),
          ],
          jalons: [],
          risques: [],
          indicateurs: [],
          documents: [],
          activite: [ev('Projet créé', `${s.nom.trim()} — pilotage confié à ${s.responsable}.`)],
          clotureLe: null,
          bilanCloture: '',
        }
        setProjets((l) => [nouveau, ...l])
        return nouveau
      })
    },
    [operation, projets],
  )

  const modifier = useCallback<Ctx['modifier']>(
    async (id, patch) => {
      refuserSiCloture(id)
      await operation(() => maj(id, (p) => ({ ...p, ...patch, activite: [ev('Projet modifié', 'Les informations ont été mises à jour.'), ...p.activite] })))
    },
    [operation, maj, refuserSiCloture],
  )

  const changerStatut = useCallback<Ctx['changerStatut']>(
    async (id, statut) => {
      refuserSiCloture(id)
      await operation(() =>
        maj(id, (p) => ({
          ...p,
          statut,
          activite: [ev('Statut modifié', `Le projet passe en « ${statut.replace('_', ' ')} ».`, statut === 'suspendu' ? 'warning' : 'neutral'), ...p.activite],
        })),
      )
    },
    [operation, maj, refuserSiCloture],
  )

  const cloturer = useCallback<Ctx['cloturer']>(
    async (id, bilan) => {
      const p = projets.find((x) => x.id === id)
      if (!p) throw new Error('Projet introuvable.')
      if (p.statut === 'cloture') throw new Error('Ce projet est déjà clôturé.')
      if (!bilan.trim()) throw new Error('Le bilan de clôture est obligatoire : il fait mémoire pour les éditions suivantes.')
      const ouverts = p.jalons.filter((j) => j.statut === 'a_venir').length
      if (ouverts > 0) {
        throw new Error(`${ouverts} jalon(s) sont encore à venir. Marquez-les comme atteints ou manqués avant de clôturer.`)
      }
      const b = budgetProjet(p)
      await operation(() =>
        maj(id, (x) => ({
          ...x,
          statut: 'cloture',
          clotureLe: new Date().toISOString(),
          bilanCloture: bilan.trim(),
          risques: x.risques.map((r) => ({ ...r, statut: 'clos' as const })),
          activite: [
            ev(
              'Projet clôturé',
              `${b.resultatRealise >= 0 ? 'Excédent' : 'Déficit'} de ${Math.abs(b.resultatRealise)} €. Le projet passe en lecture seule.`,
              b.resultatRealise >= 0 ? 'success' : 'warning',
            ),
            ...x.activite,
          ],
        })),
      )
    },
    [operation, maj, projets],
  )

  const ajouterJalon = useCallback<Ctx['ajouterJalon']>(
    async (id, j) => {
      refuserSiCloture(id)
      await operation(() =>
        maj(id, (p) => ({
          ...p,
          jalons: [...p.jalons, { ...j, id: uid('jl') }].sort((a, b) => (a.date < b.date ? -1 : 1)),
          activite: [ev('Jalon ajouté', `${j.nom} — attendu le ${new Date(j.date).toLocaleDateString('fr-FR')}.`), ...p.activite],
        })),
      )
    },
    [operation, maj, refuserSiCloture],
  )

  const changerStatutJalon = useCallback<Ctx['changerStatutJalon']>(
    async (id, jalonId, statut) => {
      refuserSiCloture(id)
      await operation(() =>
        maj(id, (p) => {
          const jalon = p.jalons.find((j) => j.id === jalonId)
          return {
            ...p,
            jalons: p.jalons.map((j) => (j.id === jalonId ? { ...j, statut } : j)),
            activite: [
              ev(
                statut === 'atteint' ? 'Jalon atteint' : statut === 'manque' ? 'Jalon manqué' : 'Jalon rouvert',
                jalon?.nom ?? '',
                statut === 'atteint' ? 'success' : statut === 'manque' ? 'danger' : 'neutral',
              ),
              ...p.activite,
            ],
          }
        }),
      )
    },
    [operation, maj, refuserSiCloture],
  )

  const ajouterRisque = useCallback<Ctx['ajouterRisque']>(
    async (id, r) => {
      refuserSiCloture(id)
      await operation(() =>
        maj(id, (p) => ({
          ...p,
          risques: [...p.risques, { ...r, id: uid('rq') }],
          activite: [ev('Risque identifié', r.libelle, 'warning'), ...p.activite],
        })),
      )
    },
    [operation, maj, refuserSiCloture],
  )

  const changerStatutRisque = useCallback<Ctx['changerStatutRisque']>(
    async (id, risqueId, statut) => {
      refuserSiCloture(id)
      await operation(() =>
        maj(id, (p) => ({
          ...p,
          risques: p.risques.map((r) => (r.id === risqueId ? { ...r, statut } : r)),
        })),
        350,
      )
    },
    [operation, maj, refuserSiCloture],
  )

  const ajouterLigneBudget = useCallback<Ctx['ajouterLigneBudget']>(
    async (id, l) => {
      refuserSiCloture(id)
      await operation(() =>
        maj(id, (p) => ({
          ...p,
          budget: [...p.budget, { ...l, id: uid('bp') }],
          activite: [ev('Ligne budgétaire ajoutée', `${l.poste} — ${l.prevu} € prévus.`), ...p.activite],
        })),
      )
    },
    [operation, maj, refuserSiCloture],
  )

  const value = useMemo<Ctx>(
    () => ({
      projets, chargement, erreur, enregistrement, mode, setMode, recharger, projetParId,
      creer, modifier, changerStatut, cloturer, ajouterJalon, changerStatutJalon,
      ajouterRisque, changerStatutRisque, ajouterLigneBudget,
    }),
    [projets, chargement, erreur, enregistrement, mode, recharger, projetParId, creer, modifier, changerStatut, cloturer, ajouterJalon, changerStatutJalon, ajouterRisque, changerStatutRisque, ajouterLigneBudget],
  )

  return <ProjetsContext.Provider value={value}>{children}</ProjetsContext.Provider>
}

export function useProjets() {
  const ctx = useContext(ProjetsContext)
  if (!ctx) throw new Error('useProjets doit être utilisé dans ProjetsProvider')
  return ctx
}
