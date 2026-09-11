import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  actionsAvecAnnulation,
  actionsInitiales,
  callToActionDe,
  type ActionAssociative,
  type BilanAction,
} from '@/lib/actions'
import { uid } from '@/lib/utils'

export type ModeDemoActions = 'normal' | 'chargement' | 'vide' | 'annulee' | 'echec-publication' | 'echec-import' | 'erreur' | 'echec'

export type Televersement = {
  id: string
  nom: string
  progression: number
  statut: 'en_cours' | 'termine' | 'echec'
  erreur: string
  lignes: number
}

export type SaisieAction = Pick<
  ActionAssociative,
  | 'titre' | 'description' | 'visuel' | 'typeId' | 'categorieId' | 'portee' | 'associationsIds'
  | 'adresse' | 'ville' | 'quartier' | 'date' | 'participantsIds' | 'projetId' | 'publiee'
>

type Ctx = {
  actions: ActionAssociative[]
  televersements: Televersement[]
  chargement: boolean
  erreur: string | null
  enregistrement: boolean
  mode: ModeDemoActions
  setMode: (m: ModeDemoActions) => void
  recharger: () => void
  actionParId: (id: string) => ActionAssociative | undefined
  creer: (s: SaisieAction) => Promise<ActionAssociative>
  modifier: (id: string, s: Partial<ActionAssociative>) => Promise<void>
  supprimer: (id: string) => Promise<void>
  publier: (id: string) => Promise<void>
  depublier: (id: string, motif: string) => Promise<void>
  annuler: (id: string, motif: string) => Promise<void>
  retirerPartenaire: (id: string, associationId: string) => Promise<void>
  enregistrerBilan: (id: string, bilan: BilanAction) => Promise<void>
  importer: (fichiers: { nom: string; lignes: number }[]) => void
  retirerTeleversement: (id: string) => void
}

const ActionsContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function ev(libelle: string, detail: string, tone: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral') {
  return { id: uid('ea'), quand: new Date().toISOString(), auteur: 'Camille Beauchamp', libelle, detail, tone }
}

export function ActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ActionAssociative[]>(actionsInitiales)
  const [televersements, setTeleversements] = useState<Televersement[]>([])
  const [chargement, setChargement] = useState(true)
  const [enregistrement, setEnregistrement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoActions>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoActions) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Le registre des actions n'a pas pu être interrogé.")
      setActions([])
    } else if (m === 'vide') {
      setActions([])
    } else if (m === 'annulee') {
      setActions(actionsAvecAnnulation())
    } else {
      setActions(actionsInitiales)
    }
    setTeleversements([])
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

  const actionParId = useCallback((id: string) => actions.find((a) => a.id === id), [actions])

  const maj = useCallback((id: string, fn: (a: ActionAssociative) => ActionAssociative) => {
    setActions((l) => l.map((a) => (a.id === id ? fn(a) : a)))
  }, [])

  const verifierPublication = useCallback(() => {
    if (modeRef.current === 'echec-publication') {
      throw new Error("La publication sur l'application mobile a échoué : le service de diffusion est injoignable.")
    }
  }, [])

  const creer = useCallback<Ctx['creer']>(
    async (s) => {
      if (!s.titre.trim()) throw new Error('Donnez un titre à l’action.')
      if (s.portee === 'partenariat' && s.associationsIds.filter((x) => x !== 'org-1').length === 0) {
        throw new Error('Une action en partenariat doit désigner au moins une association de la ville.')
      }
      return operation(() => {
        if (s.publiee) verifierPublication()
        const maintenant = new Date().toISOString()
        const nouvelle: ActionAssociative = {
          ...s,
          titre: s.titre.trim(),
          id: uid('ac'),
          reference: `ACT-${String(900 + actions.length)}`,
          publieeLe: s.publiee ? maintenant : null,
          annulee: false,
          motifAnnulation: '',
          bilan: { beneficiaires: 0, heuresBenevolat: 0, commentaire: '' },
          creePar: 'Camille Beauchamp',
          creeLe: maintenant,
          historique: [
            ...(s.publiee
              ? [ev('Publiée sur l’application mobile', `Bouton affiché au public : « ${callToActionDe(s.typeId)} ».`, 'success')]
              : []),
            ev('Action créée', `${s.titre.trim()}.`),
          ],
        }
        setActions((l) => [nouvelle, ...l])
        return nouvelle
      })
    },
    [operation, actions.length, verifierPublication],
  )

  const modifier = useCallback<Ctx['modifier']>(
    async (id, patch) => {
      const cible = actions.find((a) => a.id === id)
      if (cible?.annulee) throw new Error('Une action annulée ne peut plus être modifiée.')
      await operation(() => maj(id, (a) => ({ ...a, ...patch, historique: [ev('Action modifiée', 'Les informations ont été mises à jour.'), ...a.historique] })))
    },
    [operation, maj, actions],
  )

  const supprimer = useCallback<Ctx['supprimer']>(
    async (id) => {
      await operation(() => setActions((l) => l.filter((a) => a.id !== id)))
    },
    [operation],
  )

  const publier = useCallback<Ctx['publier']>(
    async (id) => {
      const cible = actions.find((a) => a.id === id)
      if (cible?.annulee) throw new Error('Une action annulée ne peut pas être publiée.')
      await operation(() => {
        verifierPublication()
        maj(id, (a) => ({
          ...a,
          publiee: true,
          publieeLe: new Date().toISOString(),
          historique: [ev('Publiée sur l’application mobile', `Bouton affiché au public : « ${callToActionDe(a.typeId)} ».`, 'success'), ...a.historique],
        }))
      })
    },
    [operation, maj, actions, verifierPublication],
  )

  const depublier = useCallback<Ctx['depublier']>(
    async (id, motif) => {
      if (!motif.trim()) throw new Error('Un motif est obligatoire : l’action disparaîtra de l’application sans autre explication.')
      await operation(() =>
        maj(id, (a) => ({
          ...a,
          publiee: false,
          publieeLe: null,
          historique: [ev('Retirée de l’application mobile', motif.trim(), 'warning'), ...a.historique],
        })),
      )
    },
    [operation, maj],
  )

  const annuler = useCallback<Ctx['annuler']>(
    async (id, motif) => {
      if (!motif.trim()) throw new Error('Un motif d’annulation est obligatoire : le public doit savoir pourquoi.')
      await operation(() =>
        maj(id, (a) => ({
          ...a,
          annulee: true,
          publiee: false,
          publieeLe: null,
          motifAnnulation: motif.trim(),
          historique: [ev('Action annulée', motif.trim(), 'danger'), ...a.historique],
        })),
      )
    },
    [operation, maj],
  )

  const retirerPartenaire = useCallback<Ctx['retirerPartenaire']>(
    async (id, associationId) => {
      if (associationId === 'org-1') throw new Error('Votre association ne peut pas être retirée de ses propres actions.')
      await operation(() =>
        maj(id, (a) => {
          const restants = a.associationsIds.filter((x) => x !== associationId)
          return {
            ...a,
            associationsIds: restants,
            portee: restants.length > 1 ? 'partenariat' : 'seule',
            historique: [ev('Partenaire retiré', 'L’association ne figure plus parmi les porteurs de l’action.', 'warning'), ...a.historique],
          }
        }),
      )
    },
    [operation, maj],
  )

  const enregistrerBilan = useCallback<Ctx['enregistrerBilan']>(
    async (id, bilan) => {
      if (bilan.beneficiaires < 0 || bilan.heuresBenevolat < 0) throw new Error('Les chiffres du bilan ne peuvent pas être négatifs.')
      await operation(() =>
        maj(id, (a) => ({
          ...a,
          bilan,
          historique: [ev('Bilan renseigné', `${bilan.beneficiaires} bénéficiaires, ${bilan.heuresBenevolat} heures de bénévolat.`, 'success'), ...a.historique],
        })),
      )
    },
    [operation, maj],
  )

  /* ------------------------------ Import ------------------------------ */

  const importer = useCallback<Ctx['importer']>((fichiers) => {
    for (const f of fichiers) {
      const id = uid('up')
      setTeleversements((l) => [...l, { id, nom: f.nom, progression: 0, statut: 'en_cours', erreur: '', lignes: f.lignes }])
      let avance = 0
      const timer = window.setInterval(() => {
        avance += 10 + Math.random() * 20
        if (avance >= 100) {
          window.clearInterval(timer)
          if (modeRef.current === 'echec-import' || modeRef.current === 'echec') {
            setTeleversements((l) =>
              l.map((t) =>
                t.id === id
                  ? { ...t, progression: 100, statut: 'echec', erreur: 'Colonne « date de l’action » absente ou mal formatée à la ligne 4.' }
                  : t,
              ),
            )
            return
          }
          setTeleversements((l) => l.map((t) => (t.id === id ? { ...t, progression: 100, statut: 'termine' } : t)))
        } else {
          setTeleversements((l) => l.map((t) => (t.id === id ? { ...t, progression: Math.round(avance) } : t)))
        }
      }, 240)
    }
  }, [])

  const retirerTeleversement = useCallback<Ctx['retirerTeleversement']>((id) => {
    setTeleversements((l) => l.filter((t) => t.id !== id))
  }, [])

  const value = useMemo<Ctx>(
    () => ({
      actions, televersements, chargement, erreur, enregistrement, mode, setMode, recharger, actionParId,
      creer, modifier, supprimer, publier, depublier, annuler, retirerPartenaire, enregistrerBilan,
      importer, retirerTeleversement,
    }),
    [actions, televersements, chargement, erreur, enregistrement, mode, recharger, actionParId, creer, modifier, supprimer, publier, depublier, annuler, retirerPartenaire, enregistrerBilan, importer, retirerTeleversement],
  )

  return <ActionsContext.Provider value={value}>{children}</ActionsContext.Provider>
}

export function useActions() {
  const ctx = useContext(ActionsContext)
  if (!ctx) throw new Error('useActions doit être utilisé dans ActionsProvider')
  return ctx
}
