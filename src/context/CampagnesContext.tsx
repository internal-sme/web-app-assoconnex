import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  MAINTENANT_CAMP,
  campagnesNominales,
  campagneAvecEchec,
  campagneEnCours,
  desinscriptionsInitiaux,
  modelesCampagneInitiaux,
  segmentsAvecVide,
  segmentsInitiaux,
  cibleDefinition,
  decompteSegment,
  joignablesDuSegment,
  type Campagne,
  type CibleCampagne,
  type Desinscription,
  type ModeleCampagne,
  type Segment,
  type SegmentDefinition,
} from '@/lib/campagnes'
import { uid } from '@/lib/utils'

export type ModeDemoCampagnes =
  | 'normal'
  | 'chargement'
  | 'vide'
  | 'en-cours'
  | 'echec-envoi'
  | 'segment-vide'
  | 'erreur'
  | 'echec'

export type SaisieCampagne = {
  nom: string
  objet: string
  previsualisation: string
  corps: string
  expediteurNom: string
  adresseReponse: string
  cible: CibleCampagne
  immediat: boolean
  programmeeLe: string | null
  /** Renseigné quand on repart d'un brouillon existant. */
  brouillonId?: string
}

type Ctx = {
  campagnes: Campagne[]
  segments: Segment[]
  modeles: ModeleCampagne[]
  desinscriptions: Desinscription[]
  desinscritsIds: string[]
  chargement: boolean
  erreur: string | null
  envoiEnCours: boolean
  mode: ModeDemoCampagnes
  setMode: (m: ModeDemoCampagnes) => void
  recharger: () => void
  /** Envoi immédiat : la campagne anime sa progression jusqu'à l'envoi. */
  envoyer: (s: SaisieCampagne) => Promise<string>
  /** Crée une campagne programmée, sans envoyer. */
  programmer: (s: SaisieCampagne, quand: string) => Promise<string>
  /** Relance une campagne restée en échec d'envoi. */
  relancer: (id: string) => Promise<string>
  /** Ramène une campagne programmée à l'état de brouillon. */
  annulerProgrammation: (id: string) => Promise<void>
  supprimer: (id: string) => Promise<void>
  renommer: (id: string, nom: string) => Promise<void>
  envoyerTest: (cible: string | SaisieCampagne) => Promise<void>
  enregistrerSegment: (s: { id?: string; nom: string; description: string; definition: SegmentDefinition }) => Promise<void>
  supprimerSegment: (id: string) => Promise<void>
  ajouterModele: (m: Omit<ModeleCampagne, 'id'>) => Promise<void>
  supprimerModele: (id: string) => Promise<void>
  /** Réinscrite manuellement une personne qui s'était retirée des envois. */
  reinscrire: (id: string) => Promise<void>
}

const CampagnesContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

/** Génère les destinataires d'un envoi : seuls les personnes joignables sont contactées. */
function destinatairesPour(cible: CibleCampagne, rectifs: string[]) {
  return joignablesDuSegment(cibleDefinition(cible), rectifs).map((p) => ({
    id: p.id,
    prenom: p.prenom,
    nom: p.nom,
    email: p.email,
    etat: 'envoye' as const,
  }))
}

/** Avance la progression d'un envoi jusqu'au terme, ou échoue en cours de route. */
async function animerEnvoi(
  maj: (f: (c: Campagne) => Campagne) => void,
  id: string,
  etaits: { echoue: boolean; delai: number },
) {
  for (let p = 15; p <= 100; p += 15) {
    await attendre(etaits.delai)
    maj((c) => (c.id === id ? { ...c, envoiProgression: p } : c))
    if (p >= 35 && etaits.echoue) {
      maj((c) => (c.id === id ? { ...c, statut: 'echec' } : c))
      throw new Error("L'envoi a été interrompu par le serveur de messagerie. Rien n'est parti pour les suivants.")
    }
  }
  maj((c) =>
    c.id === id
      ? { ...c, statut: 'envoyee', envoiProgression: 100, envoyeLe: new Date().toISOString() }
      : c,
  )
}

export function CampagnesProvider({ children }: { children: ReactNode }) {
  const [campagnes, setCampagnes] = useState<Campagne[]>(campagnesNominales)
  const [segments, setSegments] = useState<Segment[]>(segmentsInitiaux)
  const [modeles, setModeles] = useState<ModeleCampagne[]>(modelesCampagneInitiaux)
  const [desinscriptions, setDesinscriptions] = useState<Desinscription[]>(desinscriptionsInitiaux)
  const [chargement, setChargement] = useState(true)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoCampagnes>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoCampagnes) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Les campagnes n'ont pas pu être chargées.")
      setCampagnes([])
    } else if (m === 'vide') {
      setCampagnes([])
    } else if (m === 'en-cours') {
      setCampagnes([...campagnesNominales, campagneEnCours()])
    } else if (m === 'echec-envoi') {
      setCampagnes([...campagnesNominales, campagneAvecEchec()])
    } else {
      setCampagnes(campagnesNominales)
    }
    setSegments(m === 'segment-vide' ? segmentsAvecVide() : segmentsInitiaux)
    setModeles(modelesCampagneInitiaux)
    setDesinscriptions(desinscriptionsInitiaux)
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

  const maj = useCallback((f: (c: Campagne) => Campagne) => {
    setCampagnes((l) => l.map((c) => f(c)))
  }, [])

  const matiere = useCallback((s: SaisieCampagne): Campagne => ({
    id: uid('camp'),
    nom: s.nom.trim() || 'Sans nom',
    objet: s.objet.trim(),
    previsualisation: s.previsualisation.trim(),
    corps: s.corps,
    expediteurNom: s.expediteurNom.trim() || 'Les Amis du Vieux Moulin',
    adresseReponse: s.adresseReponse.trim() || 'contact@vieuxmoulin.fr',
    cible: s.cible,
    immediat: s.immediat,
    programmeeLe: s.immediat ? null : s.programmeeLe,
    statut: 'brouillon',
    creeLe: new Date().toISOString(),
    envoyeLe: null,
    testEnvoyeALe: null,
    envoiProgression: 0,
    destinataires: [],
  }), [])

  const verifierSaisie = useCallback((s: SaisieCampagne) => {
    if (!s.objet.trim()) throw new Error("Un e-mail sans objet a peu de chances d'être lu. Donnez-lui un titre.")
    const total = decompteSegment(cibleDefinition(s.cible), desinscriptions.map((d) => d.contactId)).joignables
    if (total === 0) {
      throw new Error(
        s.cible.type === 'segment'
          ? `Le segment « ${s.cible.nom} » ne retient personne de joignable : tous ont refusé les e-mails ou se sont désinscrits.`
          : 'Ce segment ne retient personne de joignable. Ajustez les critères avant d’envoyer.',
      )
    }
  }, [desinscriptions])

  const envoyer = useCallback<Ctx['envoyer']>(
    async (s) => {
      verifierSaisie(s)
      const id = uid('camp')
      const provisoire: Campagne = { ...matiere(s), id, statut: 'en_cours', destinataires: destinatairesPour(s.cible, desinscriptions.map((d) => d.contactId)) }
      setCampagnes((l) => [...l.filter((c) => c.id !== s.brouillonId), provisoire])
      setEnvoiEnCours(true)
      try {
        await animerEnvoi(maj, id, { echoue: modeRef.current === 'echec' || modeRef.current === 'echec-envoi', delai: 220 })
        return id
      } catch (e) {
        throw e
      } finally {
        setEnvoiEnCours(false)
      }
    },
    [maj, matiere, verifierSaisie, desinscriptions],
  )

  const programmer = useCallback<Ctx['programmer']>(
    async (s, quand) => {
      verifierSaisie(s)
      return operation(() => {
        const campagne: Campagne = { ...matiere(s), id: uid('camp'), statut: 'programmee', programmeeLe: quand }
        setCampagnes((l) => [...l.filter((c) => c.id !== s.brouillonId), campagne])
        return campagne.id
      })
    },
    [operation, matiere, verifierSaisie],
  )

  const relancer = useCallback<Ctx['relancer']>(
    async (id) => {
      setEnvoiEnCours(true)
      maj((c) => (c.id === id ? { ...c, statut: 'en_cours', envoiProgression: 5, destinataires: destinatairesPour(c.cible, desinscriptions.map((d) => d.contactId)) } : c))
      try {
        await animerEnvoi(maj, id, { echoue: modeRef.current === 'echec', delai: 220 })
        return id
      } finally {
        setEnvoiEnCours(false)
      }
    },
    [maj, desinscriptions],
  )

  const annulerProgrammation = useCallback<Ctx['annulerProgrammation']>(
    async (id) => {
      await operation(() =>
        maj((c) => (c.id === id ? { ...c, statut: 'brouillon', immediat: true, programmeeLe: null } : c)),
      )
    },
    [operation, maj],
  )

  const supprimer = useCallback<Ctx['supprimer']>(
    async (id) => {
      await operation(() => setCampagnes((l) => l.filter((c) => c.id !== id)))
    },
    [operation],
  )

  const renommer = useCallback<Ctx['renommer']>(
    async (id, nom) => {
      if (!nom.trim()) throw new Error('Le nom de la campagne ne peut pas être vide.')
      await operation(() => maj((c) => (c.id === id ? { ...c, nom: nom.trim() } : c)), 250)
    },
    [operation, maj],
  )

  const envoyerTest = useCallback<Ctx['envoyerTest']>(
    async (cible) => {
      if (typeof cible === 'object') {
        if (!cible.objet.trim()) {
          throw new Error("Rédigez d'abord l'objet : un e-mail sans objet ne peut pas partir, même en test.")
        }
        if (cible.corps.trim().length === 0) throw new Error('Le corps du message est vide.')
        await operation(() => undefined, 600)
        return
      }
      const campagne = campagnes.find((c) => c.id === cible)
      if (campagne && !campagne.objet.trim()) {
        throw new Error("Rédigez d'abord l'objet : un e-mail sans objet ne peut pas partir, même en test.")
      }
      await operation(() => maj((c) => (c.id === cible ? { ...c, testEnvoyeALe: new Date().toISOString() } : c)), 600)
    },
    [operation, maj, campagnes],
  )

  const enregistrerSegment = useCallback<Ctx['enregistrerSegment']>(
    async (s) => {
      if (!s.nom.trim()) throw new Error('Donnez un nom au segment.')
      await operation(() => {
        setSegments((l) => {
          const existe = l.some((x) => x.id !== s.id && x.nom === s.nom.trim())
          if (existe) throw new Error('Ce nom de segment existe déjà.')
          if (s.id) return l.map((x) => (x.id === s.id ? { ...x, ...s, nom: s.nom.trim() } : x))
          return [...l, { id: uid('seg'), ...s, nom: s.nom.trim() }]
        })
      })
    },
    [operation],
  )

  const supprimerSegment = useCallback<Ctx['supprimerSegment']>(
    async (id) => {
      await operation(() => setSegments((l) => l.filter((s) => s.id !== id)))
    },
    [operation],
  )

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

  const reinscrire = useCallback<Ctx['reinscrire']>(
    async (id) => {
      const d = desinscriptions.find((x) => x.id === id)
      if (!d) return
      await operation(
        () => {
          setDesinscriptions((l) => l.filter((x) => x.id !== id))
          // La personne redevient joignable : l'historique de l'envoi reste consultable.
          setCampagnes((l) =>
            l.map((c) => ({
              ...c,
              destinataires: c.destinataires.filter((x) => x.id !== d.contactId || x.etat !== 'desinscrit'),
            })),
          )
        },
        500,
      )
    },
    [operation, desinscriptions],
  )

  const desinscritsIds = useMemo(() => desinscriptions.map((d) => d.contactId), [desinscriptions])

  const value = useMemo<Ctx>(
    () => ({
      campagnes, segments, modeles, desinscriptions, desinscritsIds, chargement, erreur, envoiEnCours,
      mode, setMode, recharger,
      envoyer, programmer, relancer, annulerProgrammation, supprimer, renommer, envoyerTest,
      enregistrerSegment, supprimerSegment, ajouterModele, supprimerModele, reinscrire,
    }),
    [campagnes, segments, modeles, desinscriptions, desinscritsIds, chargement, erreur, envoiEnCours, mode,
      recharger, envoyer, programmer, relancer, annulerProgrammation, supprimer, renommer, envoyerTest,
      enregistrerSegment, supprimerSegment, ajouterModele, supprimerModele, reinscrire],
  )

  return <CampagnesContext.Provider value={value}>{children}</CampagnesContext.Provider>
}

export function useCampagnes() {
  const ctx = useContext(CampagnesContext)
  if (!ctx) throw new Error('useCampagnes doit être utilisé dans CampagnesProvider')
  return ctx
}