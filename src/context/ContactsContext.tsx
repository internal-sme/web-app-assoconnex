import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  contactsInitiaux,
  groupesInitiaux,
  tagsInitiaux,
  type Contact,
  type Evenement,
  type Groupe,
  type Tag,
} from '@/lib/mock'
import { uid } from '@/lib/utils'

/** États de démonstration : ils forcent les cas limites depuis l'interface. */
export type ModeDemo = 'normal' | 'chargement' | 'vide' | 'erreur' | 'echec'

type Ctx = {
  contacts: Contact[]
  groupes: Groupe[]
  tags: Tag[]
  chargement: boolean
  erreur: string | null
  mode: ModeDemo
  setMode: (m: ModeDemo) => void
  recharger: () => void
  parId: (id: string) => Contact | undefined
  creer: (c: Omit<Contact, 'id' | 'creeLe' | 'historique' | 'documents'>) => Promise<Contact>
  modifier: (id: string, patch: Partial<Contact>) => Promise<Contact>
  supprimer: (ids: string[]) => Promise<void>
  archiver: (ids: string[], archiver: boolean) => Promise<void>
  ajouterAuGroupe: (ids: string[], groupe: string) => Promise<void>
  ajouterTag: (ids: string[], tag: string) => Promise<void>
  creerGroupe: (nom: string, description: string) => Promise<void>
  modifierGroupe: (id: string, patch: Partial<Groupe>) => Promise<void>
  supprimerGroupe: (id: string) => Promise<void>
  creerTag: (nom: string) => Promise<void>
  renommerTag: (id: string, nom: string) => Promise<void>
  supprimerTag: (id: string) => Promise<void>
  compterGroupe: (nom: string) => number
  compterTag: (nom: string) => number
}

const ContactsContext = createContext<Ctx | null>(null)

const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function evenement(libelle: string, detail: string, tone: Evenement['tone'] = 'neutral'): Evenement {
  return {
    id: uid('ev'),
    quand: new Date().toISOString(),
    auteur: 'Camille Beauchamp',
    libelle,
    detail,
    tone,
  }
}

export function ContactsProvider({ children }: { children: ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>(contactsInitiaux)
  const [groupes, setGroupes] = useState<Groupe[]>(groupesInitiaux)
  const [tags, setTags] = useState<Tag[]>(tagsInitiaux)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setModeState] = useState<ModeDemo>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode

  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemo) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 650)
    if (jeton !== requete.current) return // une demande plus récente a pris la main
    if (m === 'erreur') {
      setErreur("Impossible de charger les contacts. Le service n'a pas répondu.")
      setContacts([])
    } else if (m === 'vide') {
      setContacts([])
    } else {
      setContacts(contactsInitiaux)
    }
    setChargement(false)
  }, [])

  useEffect(() => {
    void charger(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const setMode = useCallback((m: ModeDemo) => setModeState(m), [])
  const recharger = useCallback(() => void charger(modeRef.current), [charger])

  const echouerSiDemande = useCallback(async () => {
    await attendre(900)
    if (modeRef.current === 'echec') {
      throw new Error("L'enregistrement a échoué. Le serveur a refusé la modification.")
    }
  }, [])

  const parId = useCallback((id: string) => contacts.find((c) => c.id === id), [contacts])

  const creer = useCallback<Ctx['creer']>(
    async (data) => {
      await echouerSiDemande()
      const contact: Contact = {
        ...data,
        id: uid('ct'),
        creeLe: new Date().toISOString(),
        documents: [],
        historique: [evenement('Fiche créée', `${data.prenom} ${data.nom} a été ajouté à la base de contacts.`)],
      }
      setContacts((l) => [contact, ...l])
      return contact
    },
    [echouerSiDemande],
  )

  const modifier = useCallback<Ctx['modifier']>(
    async (id, patch) => {
      await echouerSiDemande()
      let maj: Contact | undefined
      setContacts((l) =>
        l.map((c) => {
          if (c.id !== id) return c
          maj = {
            ...c,
            ...patch,
            historique: [evenement('Fiche modifiée', 'Les informations de la fiche ont été mises à jour.'), ...c.historique],
          }
          return maj
        }),
      )
      await attendre(0)
      if (!maj) throw new Error('Contact introuvable.')
      return maj
    },
    [echouerSiDemande],
  )

  const supprimer = useCallback<Ctx['supprimer']>(
    async (ids) => {
      await echouerSiDemande()
      setContacts((l) => l.filter((c) => !ids.includes(c.id)))
    },
    [echouerSiDemande],
  )

  const archiver = useCallback<Ctx['archiver']>(
    async (ids, doitArchiver) => {
      await echouerSiDemande()
      setContacts((l) =>
        l.map((c) =>
          ids.includes(c.id)
            ? {
                ...c,
                statut: doitArchiver ? 'archive' : 'actif',
                historique: [
                  evenement(
                    doitArchiver ? 'Contact archivé' : 'Contact réactivé',
                    doitArchiver
                      ? 'La fiche sort du flux de travail courant.'
                      : 'La fiche est de nouveau active.',
                    doitArchiver ? 'neutral' : 'success',
                  ),
                  ...c.historique,
                ],
              }
            : c,
        ),
      )
    },
    [echouerSiDemande],
  )

  const ajouterAuGroupe = useCallback<Ctx['ajouterAuGroupe']>(
    async (ids, groupe) => {
      await echouerSiDemande()
      setContacts((l) =>
        l.map((c) =>
          ids.includes(c.id) && !c.groupes.includes(groupe)
            ? {
                ...c,
                groupes: [...c.groupes, groupe],
                historique: [evenement('Ajouté à un groupe', `Groupe « ${groupe} ».`, 'success'), ...c.historique],
              }
            : c,
        ),
      )
    },
    [echouerSiDemande],
  )

  const ajouterTag = useCallback<Ctx['ajouterTag']>(
    async (ids, tag) => {
      await echouerSiDemande()
      setContacts((l) =>
        l.map((c) =>
          ids.includes(c.id) && !c.tags.includes(tag)
            ? {
                ...c,
                tags: [...c.tags, tag],
                historique: [evenement('Tag ajouté', `Tag « ${tag} ».`, 'success'), ...c.historique],
              }
            : c,
        ),
      )
    },
    [echouerSiDemande],
  )

  /* ----- référentiels ----- */

  const creerGroupe = useCallback<Ctx['creerGroupe']>(
    async (nom, description) => {
      await echouerSiDemande()
      setGroupes((l) => [...l, { id: uid('gr'), nom, description }])
    },
    [echouerSiDemande],
  )

  const modifierGroupe = useCallback<Ctx['modifierGroupe']>(
    async (id, patch) => {
      await echouerSiDemande()
      const ancien = groupes.find((g) => g.id === id)
      setGroupes((l) => l.map((g) => (g.id === id ? { ...g, ...patch } : g)))
      if (ancien && patch.nom && patch.nom !== ancien.nom) {
        setContacts((l) =>
          l.map((c) => ({ ...c, groupes: c.groupes.map((g) => (g === ancien.nom ? patch.nom! : g)) })),
        )
      }
    },
    [echouerSiDemande, groupes],
  )

  const supprimerGroupe = useCallback<Ctx['supprimerGroupe']>(
    async (id) => {
      await echouerSiDemande()
      const cible = groupes.find((g) => g.id === id)
      setGroupes((l) => l.filter((g) => g.id !== id))
      if (cible) setContacts((l) => l.map((c) => ({ ...c, groupes: c.groupes.filter((g) => g !== cible.nom) })))
    },
    [echouerSiDemande, groupes],
  )

  const creerTag = useCallback<Ctx['creerTag']>(
    async (nom) => {
      await echouerSiDemande()
      setTags((l) => [...l, { id: uid('tg'), nom }])
    },
    [echouerSiDemande],
  )

  const renommerTag = useCallback<Ctx['renommerTag']>(
    async (id, nom) => {
      await echouerSiDemande()
      const ancien = tags.find((t) => t.id === id)
      setTags((l) => l.map((t) => (t.id === id ? { ...t, nom } : t)))
      if (ancien) setContacts((l) => l.map((c) => ({ ...c, tags: c.tags.map((t) => (t === ancien.nom ? nom : t)) })))
    },
    [echouerSiDemande, tags],
  )

  const supprimerTag = useCallback<Ctx['supprimerTag']>(
    async (id) => {
      await echouerSiDemande()
      const cible = tags.find((t) => t.id === id)
      setTags((l) => l.filter((t) => t.id !== id))
      if (cible) setContacts((l) => l.map((c) => ({ ...c, tags: c.tags.filter((t) => t !== cible.nom) })))
    },
    [echouerSiDemande, tags],
  )

  const compterGroupe = useCallback((nom: string) => contacts.filter((c) => c.groupes.includes(nom)).length, [contacts])
  const compterTag = useCallback((nom: string) => contacts.filter((c) => c.tags.includes(nom)).length, [contacts])

  const value = useMemo<Ctx>(
    () => ({
      contacts,
      groupes,
      tags,
      chargement,
      erreur,
      mode,
      setMode,
      recharger,
      parId,
      creer,
      modifier,
      supprimer,
      archiver,
      ajouterAuGroupe,
      ajouterTag,
      creerGroupe,
      modifierGroupe,
      supprimerGroupe,
      creerTag,
      renommerTag,
      supprimerTag,
      compterGroupe,
      compterTag,
    }),
    [contacts, groupes, tags, chargement, erreur, mode, setMode, recharger, parId, creer, modifier, supprimer, archiver, ajouterAuGroupe, ajouterTag, creerGroupe, modifierGroupe, supprimerGroupe, creerTag, renommerTag, supprimerTag, compterGroupe, compterTag],
  )

  return <ContactsContext.Provider value={value}>{children}</ContactsContext.Provider>
}

export function useContacts() {
  const ctx = useContext(ContactsContext)
  if (!ctx) throw new Error('useContacts doit être utilisé dans ContactsProvider')
  return ctx
}
