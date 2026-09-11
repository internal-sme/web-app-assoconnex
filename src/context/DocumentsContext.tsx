import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  TAILLE_MAX,
  documentsInitiaux,
  dossiersInitiaux,
  formatTaille,
  typeDe,
  type Document,
  type Dossier,
  type EvenementDoc,
  type NiveauDroit,
  type Permission,
} from '@/lib/documents'
import { uid } from '@/lib/utils'

export type ModeDemoDocs = 'normal' | 'chargement' | 'vide' | 'erreur' | 'echec' | 'echec-upload'

export type Televersement = {
  id: string
  nom: string
  taille: number
  progression: number
  statut: 'en_cours' | 'termine' | 'echec'
  erreur: string
}

type Ctx = {
  documents: Document[]
  dossiers: Dossier[]
  televersements: Televersement[]
  chargement: boolean
  erreur: string | null
  mode: ModeDemoDocs
  setMode: (m: ModeDemoDocs) => void
  recharger: () => void
  documentParId: (id: string) => Document | undefined
  dossierParId: (id: string) => Dossier | undefined
  creerDossier: (nom: string, parentId: string | null, description: string) => Promise<void>
  televerser: (fichiers: { nom: string; taille: number }[], dossierId: string) => void
  reessayerTeleversement: (id: string) => void
  retirerTeleversement: (id: string) => void
  renommer: (id: string, nom: string) => Promise<void>
  basculerFavori: (id: string) => Promise<void>
  deplacer: (id: string, dossierId: string) => Promise<void>
  supprimer: (id: string) => Promise<void>
  restaurer: (id: string) => Promise<void>
  viderCorbeille: () => Promise<void>
  modifierDroits: (id: string, permissions: Permission[]) => Promise<void>
  basculerPartage: (id: string, actif: boolean) => Promise<void>
  ajouterVersion: (id: string, commentaire: string, taille: number) => Promise<void>
  restaurerVersion: (id: string, versionId: string) => Promise<void>
  ajouterTag: (id: string, tag: string) => Promise<void>
  retirerTag: (id: string, tag: string) => Promise<void>
}

const DocumentsContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function ev(libelle: string, detail: string, tone: EvenementDoc['tone'] = 'neutral'): EvenementDoc {
  return { id: uid('ed'), quand: new Date().toISOString(), auteur: 'Camille Beauchamp', libelle, detail, tone }
}

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<Document[]>(documentsInitiaux)
  const [dossiers, setDossiers] = useState<Dossier[]>(dossiersInitiaux)
  const [televersements, setTeleversements] = useState<Televersement[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoDocs>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoDocs) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("L'espace documentaire n'a pas pu être interrogé.")
      setDocuments([])
    } else if (m === 'vide') {
      setDocuments([])
    } else {
      setDocuments(documentsInitiaux)
    }
    setChargement(false)
  }, [])

  useEffect(() => {
    void charger(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const recharger = useCallback(() => void charger(modeRef.current), [charger])

  const echouerSiDemande = useCallback(async () => {
    await attendre(700)
    if (modeRef.current === 'echec') throw new Error("L'opération a échoué. Le serveur a refusé l'enregistrement.")
  }, [])

  const documentParId = useCallback((id: string) => documents.find((d) => d.id === id), [documents])
  const dossierParId = useCallback((id: string) => dossiers.find((d) => d.id === id), [dossiers])

  const maj = useCallback((id: string, fn: (d: Document) => Document) => {
    setDocuments((l) => l.map((d) => (d.id === id ? fn(d) : d)))
  }, [])

  const creerDossier = useCallback<Ctx['creerDossier']>(
    async (nom, parentId, description) => {
      if (dossiers.some((d) => d.parentId === parentId && d.nom.toLowerCase() === nom.trim().toLowerCase())) {
        throw new Error(`Un dossier « ${nom} » existe déjà à cet emplacement.`)
      }
      await echouerSiDemande()
      setDossiers((l) => [
        ...l,
        { id: uid('dr'), nom: nom.trim(), parentId, description, creeLe: new Date().toISOString(), creePar: 'Camille Beauchamp' },
      ])
    },
    [echouerSiDemande, dossiers],
  )

  /* --- import de fichiers, avec progression simulée --- */

  const lancerProgression = useCallback((id: string, dossierId: string, nom: string, taille: number) => {
    let avance = 0
    const timer = window.setInterval(() => {
      avance += 8 + Math.random() * 18
      if (avance >= 100) {
        window.clearInterval(timer)
        if (modeRef.current === 'echec-upload' || modeRef.current === 'echec') {
          setTeleversements((l) =>
            l.map((t) =>
              t.id === id
                ? { ...t, progression: 100, statut: 'echec', erreur: 'La connexion au serveur de fichiers a été interrompue.' }
                : t,
            ),
          )
          return
        }
        setTeleversements((l) => l.map((t) => (t.id === id ? { ...t, progression: 100, statut: 'termine' } : t)))
        const extension = nom.includes('.') ? nom.split('.').pop()!.toLowerCase() : 'pdf'
        const type = typeDe(extension)
        const maintenant = new Date().toISOString()
        setDocuments((l) => [
          {
            id: uid('doc'),
            nom: nom.replace(/\.[^.]+$/, ''),
            extension,
            typeMime: type.mime,
            taille,
            dossierId,
            creePar: 'Camille Beauchamp',
            creeLe: maintenant,
            modifieLe: maintenant,
            versions: [{ id: uid('vs'), numero: 1, taille, creeLe: maintenant, creePar: 'Camille Beauchamp', commentaire: 'Version initiale.' }],
            tags: [],
            projet: null,
            association: 'Les Amis du Vieux Moulin',
            permissions: [
              { groupe: 'bureau', niveau: 'admin' },
              { groupe: 'salaries', niveau: 'ecriture' },
              { groupe: 'benevoles', niveau: 'lecture' },
              { groupe: 'adherents', niveau: 'aucun' },
              { groupe: 'public', niveau: 'aucun' },
            ],
            favori: false,
            partage: null,
            supprime: false,
            supprimeLe: null,
            apercuDisponible: type.apercu,
            historique: [ev('Document déposé', `${nom} — ${formatTaille(taille)}.`)],
          },
          ...l,
        ])
      } else {
        setTeleversements((l) => l.map((t) => (t.id === id ? { ...t, progression: Math.round(avance) } : t)))
      }
    }, 220)
  }, [])

  const televerser = useCallback<Ctx['televerser']>(
    (fichiers, dossierId) => {
      for (const f of fichiers) {
        const id = uid('up')
        if (f.taille > TAILLE_MAX) {
          setTeleversements((l) => [
            ...l,
            {
              id,
              nom: f.nom,
              taille: f.taille,
              progression: 0,
              statut: 'echec',
              erreur: `Fichier trop volumineux : ${formatTaille(f.taille)} pour une limite de ${formatTaille(TAILLE_MAX)}.`,
            },
          ])
          continue
        }
        setTeleversements((l) => [...l, { id, nom: f.nom, taille: f.taille, progression: 0, statut: 'en_cours', erreur: '' }])
        lancerProgression(id, dossierId, f.nom, f.taille)
      }
    },
    [lancerProgression],
  )

  const reessayerTeleversement = useCallback<Ctx['reessayerTeleversement']>(
    (id) => {
      const t = televersements.find((x) => x.id === id)
      if (!t) return
      if (t.taille > TAILLE_MAX) return
      setTeleversements((l) => l.map((x) => (x.id === id ? { ...x, progression: 0, statut: 'en_cours', erreur: '' } : x)))
      lancerProgression(id, dossiersInitiaux[0].id, t.nom, t.taille)
    },
    [televersements, lancerProgression],
  )

  const retirerTeleversement = useCallback<Ctx['retirerTeleversement']>((id) => {
    setTeleversements((l) => l.filter((t) => t.id !== id))
  }, [])

  /* --- opérations sur les documents --- */

  const renommer = useCallback<Ctx['renommer']>(
    async (id, nom) => {
      await echouerSiDemande()
      maj(id, (d) => ({ ...d, nom, modifieLe: new Date().toISOString(), historique: [ev('Document renommé', `Nouveau nom : ${nom}.`), ...d.historique] }))
    },
    [echouerSiDemande, maj],
  )

  const basculerFavori = useCallback<Ctx['basculerFavori']>(
    async (id) => {
      await attendre(120)
      maj(id, (d) => ({ ...d, favori: !d.favori }))
    },
    [maj],
  )

  const deplacer = useCallback<Ctx['deplacer']>(
    async (id, dossierId) => {
      await echouerSiDemande()
      const nom = dossiers.find((x) => x.id === dossierId)?.nom ?? ''
      maj(id, (d) => ({ ...d, dossierId, historique: [ev('Document déplacé', `Nouvel emplacement : ${nom}.`), ...d.historique] }))
    },
    [echouerSiDemande, maj, dossiers],
  )

  const supprimer = useCallback<Ctx['supprimer']>(
    async (id) => {
      await echouerSiDemande()
      maj(id, (d) => ({
        ...d,
        supprime: true,
        supprimeLe: new Date().toISOString(),
        historique: [ev('Document mis à la corbeille', 'Restaurable pendant trente jours.', 'warning'), ...d.historique],
      }))
    },
    [echouerSiDemande, maj],
  )

  const restaurer = useCallback<Ctx['restaurer']>(
    async (id) => {
      await echouerSiDemande()
      maj(id, (d) => ({
        ...d,
        supprime: false,
        supprimeLe: null,
        historique: [ev('Document restauré', 'Sorti de la corbeille.', 'success'), ...d.historique],
      }))
    },
    [echouerSiDemande, maj],
  )

  const viderCorbeille = useCallback<Ctx['viderCorbeille']>(async () => {
    await echouerSiDemande()
    setDocuments((l) => l.filter((d) => !d.supprime))
  }, [echouerSiDemande])

  const modifierDroits = useCallback<Ctx['modifierDroits']>(
    async (id, permissions) => {
      await echouerSiDemande()
      const resume = permissions
        .filter((p) => p.niveau !== 'aucun')
        .map((p) => `${p.groupe} : ${p.niveau}`)
        .join(', ')
      maj(id, (d) => ({
        ...d,
        permissions,
        historique: [ev('Droits d’accès modifiés', resume || 'Aucun groupe n’a accès.', 'warning'), ...d.historique],
      }))
    },
    [echouerSiDemande, maj],
  )

  const basculerPartage = useCallback<Ctx['basculerPartage']>(
    async (id, actif) => {
      await echouerSiDemande()
      maj(id, (d) => ({
        ...d,
        partage: actif
          ? {
              actif: true,
              lien: d.partage?.lien ?? `https://partage.assoconnex.fr/d/${Math.random().toString(36).slice(2, 9)}`,
              expireLe: d.partage?.expireLe ?? null,
              parQui: 'Camille Beauchamp',
            }
          : null,
        historique: [
          ev(actif ? 'Lien de partage créé' : 'Lien de partage révoqué', actif ? 'Accès en lecture, sans authentification.' : 'Le lien ne fonctionne plus.', actif ? 'warning' : 'neutral'),
          ...d.historique,
        ],
      }))
    },
    [echouerSiDemande, maj],
  )

  const ajouterVersion = useCallback<Ctx['ajouterVersion']>(
    async (id, commentaire, taille) => {
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      maj(id, (d) => {
        const numero = Math.max(...d.versions.map((v) => v.numero)) + 1
        return {
          ...d,
          taille,
          modifieLe: maintenant,
          versions: [{ id: uid('vs'), numero, taille, creeLe: maintenant, creePar: 'Camille Beauchamp', commentaire }, ...d.versions],
          historique: [ev(`Version ${numero} déposée`, commentaire, 'success'), ...d.historique],
        }
      })
    },
    [echouerSiDemande, maj],
  )

  const restaurerVersion = useCallback<Ctx['restaurerVersion']>(
    async (id, versionId) => {
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      maj(id, (d) => {
        const source = d.versions.find((v) => v.id === versionId)
        if (!source) return d
        const numero = Math.max(...d.versions.map((v) => v.numero)) + 1
        return {
          ...d,
          taille: source.taille,
          modifieLe: maintenant,
          versions: [
            { id: uid('vs'), numero, taille: source.taille, creeLe: maintenant, creePar: 'Camille Beauchamp', commentaire: `Restauration de la version ${source.numero}.` },
            ...d.versions,
          ],
          historique: [ev(`Version ${source.numero} restaurée`, `Elle devient la version ${numero}, en vigueur.`, 'success'), ...d.historique],
        }
      })
    },
    [echouerSiDemande, maj],
  )

  const ajouterTag = useCallback<Ctx['ajouterTag']>(
    async (id, tag) => {
      await echouerSiDemande()
      maj(id, (d) => (d.tags.includes(tag) ? d : { ...d, tags: [...d.tags, tag] }))
    },
    [echouerSiDemande, maj],
  )

  const retirerTag = useCallback<Ctx['retirerTag']>(
    async (id, tag) => {
      await echouerSiDemande()
      maj(id, (d) => ({ ...d, tags: d.tags.filter((t) => t !== tag) }))
    },
    [echouerSiDemande, maj],
  )

  const value = useMemo<Ctx>(
    () => ({
      documents, dossiers, televersements, chargement, erreur, mode, setMode, recharger,
      documentParId, dossierParId, creerDossier, televerser, reessayerTeleversement, retirerTeleversement,
      renommer, basculerFavori, deplacer, supprimer, restaurer, viderCorbeille,
      modifierDroits, basculerPartage, ajouterVersion, restaurerVersion, ajouterTag, retirerTag,
    }),
    [documents, dossiers, televersements, chargement, erreur, mode, recharger, documentParId, dossierParId, creerDossier, televerser, reessayerTeleversement, retirerTeleversement, renommer, basculerFavori, deplacer, supprimer, restaurer, viderCorbeille, modifierDroits, basculerPartage, ajouterVersion, restaurerVersion, ajouterTag, retirerTag],
  )

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>
}

export function useDocuments() {
  const ctx = useContext(DocumentsContext)
  if (!ctx) throw new Error('useDocuments doit être utilisé dans DocumentsProvider')
  return ctx
}

export type { NiveauDroit }
