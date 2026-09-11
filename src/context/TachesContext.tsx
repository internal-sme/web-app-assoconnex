import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  MOI_TACHE,
  tachesEnRetard,
  tachesInitiales,
  type ElementChecklist,
  type EvenementTache,
  type StatutTache,
  type Tache,
} from '@/lib/taches'
import { uid } from '@/lib/utils'

export type ModeDemoTaches = 'normal' | 'chargement' | 'vide' | 'retard' | 'erreur' | 'echec'

export type SaisieTache = Pick<
  Tache,
  'titre' | 'description' | 'responsable' | 'participants' | 'dateDebut' | 'echeance' | 'priorite' | 'statut' | 'projetId' | 'etiquettes' | 'chargeEstimee'
>

type Ctx = {
  taches: Tache[]
  chargement: boolean
  erreur: string | null
  enregistrement: boolean
  mode: ModeDemoTaches
  setMode: (m: ModeDemoTaches) => void
  recharger: () => void
  tacheParId: (id: string) => Tache | undefined
  creer: (s: SaisieTache) => Promise<Tache>
  modifier: (id: string, patch: Partial<Tache>) => Promise<void>
  changerStatut: (id: string, statut: StatutTache) => Promise<void>
  supprimer: (id: string) => Promise<void>
  ajouterCommentaire: (id: string, texte: string) => Promise<void>
  basculerChecklist: (id: string, elementId: string) => Promise<void>
  ajouterChecklist: (id: string, libelle: string) => Promise<void>
  retirerChecklist: (id: string, elementId: string) => Promise<void>
}

const TachesContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function ev(auteur: string, libelle: string, detail: string, tone: EvenementTache['tone'] = 'neutral'): EvenementTache {
  return { id: uid('et'), quand: new Date().toISOString(), auteur, libelle, detail, tone }
}

export function TachesProvider({ children }: { children: ReactNode }) {
  const [taches, setTaches] = useState<Tache[]>(tachesInitiales)
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoTaches>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoTaches) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Le service des tâches n'a pas répondu.")
      setTaches([])
    } else if (m === 'vide') {
      setTaches([])
    } else if (m === 'retard') {
      setTaches(tachesEnRetard())
    } else {
      setTaches(tachesInitiales)
    }
    setChargement(false)
  }, [])

  useEffect(() => {
    void charger(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const recharger = useCallback(() => void charger(modeRef.current), [charger])

  const operation = useCallback(async <T,>(fn: () => T, delai = 600): Promise<T> => {
    setEnregistrement(true)
    try {
      await attendre(delai)
      if (modeRef.current === 'echec') throw new Error("L'enregistrement a échoué. Le serveur a refusé l'opération.")
      return fn()
    } finally {
      setEnregistrement(false)
    }
  }, [])

  const tacheParId = useCallback((id: string) => taches.find((t) => t.id === id), [taches])

  const maj = useCallback((id: string, fn: (t: Tache) => Tache) => {
    setTaches((l) => l.map((t) => (t.id === id ? fn(t) : t)))
  }, [])

  const creer = useCallback<Ctx['creer']>(
    async (s) => {
      if (new Date(s.echeance) < new Date(s.dateDebut)) {
        throw new Error('L’échéance ne peut pas précéder la date de début.')
      }
      return operation(() => {
        const nouvelle: Tache = {
          ...s,
          id: uid('tk'),
          reference: `T-${String(900 + taches.length)}`,
          checklist: [],
          commentaires: [],
          piecesJointes: [],
          historique: [ev(MOI_TACHE, 'Tâche créée', `Assignée à ${s.responsable}.`)],
          termineeLe: null,
        }
        setTaches((l) => [nouvelle, ...l])
        return nouvelle
      })
    },
    [operation, taches.length],
  )

  const modifier = useCallback<Ctx['modifier']>(
    async (id, patch) => {
      await operation(() =>
        maj(id, (t) => ({ ...t, ...patch, historique: [ev(MOI_TACHE, 'Tâche modifiée', 'Les informations ont été mises à jour.'), ...t.historique] })),
      )
    },
    [operation, maj],
  )

  const changerStatut = useCallback<Ctx['changerStatut']>(
    async (id, statut) => {
      // Le glisser-déposer doit rester fluide : latence courte
      await operation(
        () =>
          maj(id, (t) => ({
            ...t,
            statut,
            termineeLe: statut === 'termine' ? new Date().toISOString() : null,
            historique: [
              ev(MOI_TACHE, statut === 'termine' ? 'Tâche terminée' : 'Statut modifié', `Déplacée vers « ${statut.replace('_', ' ')} ».`, statut === 'termine' ? 'success' : 'neutral'),
              ...t.historique,
            ],
          })),
        250,
      )
    },
    [operation, maj],
  )

  const supprimer = useCallback<Ctx['supprimer']>(
    async (id) => {
      await operation(() => setTaches((l) => l.filter((t) => t.id !== id)))
    },
    [operation],
  )

  const ajouterCommentaire = useCallback<Ctx['ajouterCommentaire']>(
    async (id, texte) => {
      if (!texte.trim()) throw new Error('Le commentaire est vide.')
      await operation(() =>
        maj(id, (t) => ({
          ...t,
          commentaires: [...t.commentaires, { id: uid('cm'), auteur: MOI_TACHE, quand: new Date().toISOString(), texte: texte.trim() }],
        })),
      )
    },
    [operation, maj],
  )

  const basculerChecklist = useCallback<Ctx['basculerChecklist']>(
    async (id, elementId) => {
      await operation(
        () => maj(id, (t) => ({ ...t, checklist: t.checklist.map((c) => (c.id === elementId ? { ...c, fait: !c.fait } : c)) })),
        200,
      )
    },
    [operation, maj],
  )

  const ajouterChecklist = useCallback<Ctx['ajouterChecklist']>(
    async (id, libelle) => {
      if (!libelle.trim()) throw new Error('L’intitulé est vide.')
      await operation(() =>
        maj(id, (t) => ({ ...t, checklist: [...t.checklist, { id: uid('cl'), libelle: libelle.trim(), fait: false } as ElementChecklist] })),
      )
    },
    [operation, maj],
  )

  const retirerChecklist = useCallback<Ctx['retirerChecklist']>(
    async (id, elementId) => {
      await operation(() => maj(id, (t) => ({ ...t, checklist: t.checklist.filter((c) => c.id !== elementId) })), 200)
    },
    [operation, maj],
  )

  const value = useMemo<Ctx>(
    () => ({
      taches, chargement, erreur, enregistrement, mode, setMode, recharger, tacheParId,
      creer, modifier, changerStatut, supprimer, ajouterCommentaire, basculerChecklist, ajouterChecklist, retirerChecklist,
    }),
    [taches, chargement, erreur, enregistrement, mode, recharger, tacheParId, creer, modifier, changerStatut, supprimer, ajouterCommentaire, basculerChecklist, ajouterChecklist, retirerChecklist],
  )

  return <TachesContext.Provider value={value}>{children}</TachesContext.Provider>
}

export function useTaches() {
  const ctx = useContext(TachesContext)
  if (!ctx) throw new Error('useTaches doit être utilisé dans TachesProvider')
  return ctx
}
