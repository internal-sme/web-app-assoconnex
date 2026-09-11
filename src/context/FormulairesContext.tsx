import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  formulairesInitiaux,
  formulaireVide,
  peutPublier,
  type Champ,
  type Formulaire,
  type ParametresFormulaire,
} from '@/lib/formulaires'
import { uid } from '@/lib/utils'

export type ModeDemoFormulaires = 'normal' | 'chargement' | 'vide' | 'erreur' | 'echec'

type InfosFormulaire = { titre: string; description: string; categorie: string }

type Ctx = {
  formulaires: Formulaire[]
  chargement: boolean
  erreur: string | null
  mode: ModeDemoFormulaires
  setMode: (m: ModeDemoFormulaires) => void
  recharger: () => void
  formulaireParId: (id: string) => Formulaire | undefined
  creer: (infos: InfosFormulaire) => Promise<Formulaire>
  dupliquer: (id: string) => Promise<Formulaire>
  mettreAJour: (id: string, infos: InfosFormulaire, champs: Champ[]) => Promise<void>
  mettreAJourParametres: (id: string, parametres: ParametresFormulaire) => Promise<void>
  publier: (id: string) => Promise<void>
  fermer: (id: string) => Promise<void>
  archiver: (id: string) => Promise<void>
  desarchiver: (id: string) => Promise<void>
  supprimer: (id: string) => Promise<void>
}

const FormulairesContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

export function FormulairesProvider({ children }: { children: ReactNode }) {
  const [formulaires, setFormulaires] = useState<Formulaire[]>(formulairesInitiaux)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoFormulaires>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoFormulaires) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("La liste des formulaires n'a pas pu être chargée.")
      setFormulaires([])
    } else if (m === 'vide') {
      setFormulaires([])
    } else {
      setFormulaires(formulairesInitiaux)
    }
    setChargement(false)
  }, [])

  useEffect(() => {
    void charger(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const recharger = useCallback(() => void charger(modeRef.current), [charger])

  const echouerSiDemande = useCallback(async () => {
    await attendre(600)
    if (modeRef.current === 'echec') throw new Error("L'opération a échoué. Le serveur n'a pas confirmé l'enregistrement.")
  }, [])

  const formulaireParId = useCallback((id: string) => formulaires.find((f) => f.id === id), [formulaires])

  const maj = useCallback((id: string, fn: (f: Formulaire) => Formulaire) => {
    setFormulaires((l) => l.map((f) => (f.id === id ? fn(f) : f)))
  }, [])

  const creer = useCallback<Ctx['creer']>(
    async (infos) => {
      if (!infos.titre.trim()) throw new Error('Donnez un titre au formulaire.')
      await echouerSiDemande()
      const nouveau = formulaireVide(infos.titre.trim(), infos.description.trim(), infos.categorie)
      setFormulaires((l) => [nouveau, ...l])
      return nouveau
    },
    [echouerSiDemande],
  )

  const dupliquer = useCallback<Ctx['dupliquer']>(
    async (id) => {
      const source = formulaires.find((f) => f.id === id)
      if (!source) throw new Error('Formulaire introuvable.')
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      const copie: Formulaire = {
        ...formulaireVide(`Copie de ${source.titre}`, source.description, source.categorie),
        champs: source.champs.map((c) => ({ ...c, id: uid('ch') })),
        parametres: { ...source.parametres },
        creeLe: maintenant,
        modifieLe: maintenant,
      }
      setFormulaires((l) => [copie, ...l])
      return copie
    },
    [echouerSiDemande, formulaires],
  )

  const mettreAJour = useCallback<Ctx['mettreAJour']>(
    async (id, infos, champs) => {
      if (!infos.titre.trim()) throw new Error('Le titre ne peut pas être vide.')
      await echouerSiDemande()
      maj(id, (f) => ({ ...f, titre: infos.titre.trim(), description: infos.description, categorie: infos.categorie, champs, modifieLe: new Date().toISOString() }))
    },
    [echouerSiDemande, maj],
  )

  const mettreAJourParametres = useCallback<Ctx['mettreAJourParametres']>(
    async (id, parametres) => {
      await echouerSiDemande()
      maj(id, (f) => ({ ...f, parametres, modifieLe: new Date().toISOString() }))
    },
    [echouerSiDemande, maj],
  )

  const publier = useCallback<Ctx['publier']>(
    async (id) => {
      const f = formulaires.find((x) => x.id === id)
      if (!f) throw new Error('Formulaire introuvable.')
      const verdict = peutPublier(f)
      if (!verdict.ok) throw new Error(verdict.raison)
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      maj(id, (x) => ({ ...x, statut: 'publie', publieLe: x.publieLe ?? maintenant, fermeLe: null, modifieLe: maintenant }))
    },
    [echouerSiDemande, formulaires, maj],
  )

  const fermer = useCallback<Ctx['fermer']>(
    async (id) => {
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      maj(id, (f) => ({ ...f, statut: 'ferme', fermeLe: maintenant, modifieLe: maintenant }))
    },
    [echouerSiDemande, maj],
  )

  const archiver = useCallback<Ctx['archiver']>(
    async (id) => {
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      maj(id, (f) => ({ ...f, statut: 'archive', archiveLe: maintenant, modifieLe: maintenant }))
    },
    [echouerSiDemande, maj],
  )

  const desarchiver = useCallback<Ctx['desarchiver']>(
    async (id) => {
      await echouerSiDemande()
      maj(id, (f) => ({ ...f, statut: 'brouillon', archiveLe: null, modifieLe: new Date().toISOString() }))
    },
    [echouerSiDemande, maj],
  )

  const supprimer = useCallback<Ctx['supprimer']>(
    async (id) => {
      const f = formulaires.find((x) => x.id === id)
      if (f && (f.statut === 'publie' || f.statut === 'ferme')) {
        throw new Error('Un formulaire publié ne peut pas être supprimé : archivez-le d’abord.')
      }
      await echouerSiDemande()
      setFormulaires((l) => l.filter((x) => x.id !== id))
    },
    [echouerSiDemande, formulaires],
  )

  const value = useMemo<Ctx>(
    () => ({
      formulaires, chargement, erreur, mode, setMode, recharger, formulaireParId,
      creer, dupliquer, mettreAJour, mettreAJourParametres, publier, fermer, archiver, desarchiver, supprimer,
    }),
    [formulaires, chargement, erreur, mode, recharger, formulaireParId, creer, dupliquer, mettreAJour, mettreAJourParametres, publier, fermer, archiver, desarchiver, supprimer],
  )

  return <FormulairesContext.Provider value={value}>{children}</FormulairesContext.Provider>
}

export function useFormulaires() {
  const ctx = useContext(FormulairesContext)
  if (!ctx) throw new Error('useFormulaires doit être utilisé dans FormulairesProvider')
  return ctx
}
