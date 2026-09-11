import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  adherentsInitiaux,
  exercicePour,
  moyenLabels,
  typesInitiaux,
  type Adherent,
  type Cotisation,
  type EvenementAdhesion,
  type MoyenPaiement,
  type Paiement,
  type TypeAdhesion,
} from '@/lib/adherents'
import { uid } from '@/lib/utils'

export type ModeDemoAdherents = 'normal' | 'chargement' | 'vide' | 'erreur' | 'echec'

export type SaisieAdhesion = {
  civilite: Adherent['civilite']
  prenom: string
  nom: string
  email: string
  telephone: string
  dateNaissance: string
  ville: string
  codePostal: string
  typeId: string
  dateDebut: string
  montant: number
  notes: string
}

export type SaisiePaiement = {
  cotisationId: string
  montant: number
  date: string
  moyen: MoyenPaiement
  reference: string
}

type Ctx = {
  adherents: Adherent[]
  types: TypeAdhesion[]
  chargement: boolean
  erreur: string | null
  mode: ModeDemoAdherents
  setMode: (m: ModeDemoAdherents) => void
  recharger: () => void
  parId: (id: string) => Adherent | undefined
  typeParId: (id: string) => TypeAdhesion | undefined
  creerAdhesion: (saisie: SaisieAdhesion, paiement: Omit<SaisiePaiement, 'cotisationId'> | null) => Promise<Adherent>
  renouveler: (id: string, typeId: string, dateDebut: string, montant: number) => Promise<Adherent>
  enregistrerPaiement: (id: string, saisie: SaisiePaiement) => Promise<void>
  desactiver: (id: string, motif: string) => Promise<void>
  reactiver: (id: string) => Promise<void>
  ajouterDocument: (id: string, nom: string, categorie: string) => Promise<void>
  creerType: (t: Omit<TypeAdhesion, 'id'>) => Promise<void>
  modifierType: (id: string, patch: Partial<TypeAdhesion>) => Promise<void>
  supprimerType: (id: string) => Promise<void>
  compterType: (id: string) => number
}

const AdherentsContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function ev(libelle: string, detail: string, tone: EvenementAdhesion['tone'] = 'neutral'): EvenementAdhesion {
  return { id: uid('eva'), quand: new Date().toISOString(), auteur: 'Camille Beauchamp', libelle, detail, tone }
}

export function AdherentsProvider({ children }: { children: ReactNode }) {
  const [adherents, setAdherents] = useState<Adherent[]>(adherentsInitiaux)
  const [types, setTypes] = useState<TypeAdhesion[]>(typesInitiaux)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoAdherents>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoAdherents) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Le service des adhésions n'a pas répondu.")
      setAdherents([])
    } else if (m === 'vide') {
      setAdherents([])
    } else {
      setAdherents(adherentsInitiaux)
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
    if (modeRef.current === 'echec') {
      throw new Error("L'enregistrement a échoué. Le serveur a refusé l'opération.")
    }
  }, [])

  const parId = useCallback((id: string) => adherents.find((a) => a.id === id), [adherents])
  const typeParId = useCallback((id: string) => types.find((t) => t.id === id), [types])

  const majAdherent = useCallback((id: string, fn: (a: Adherent) => Adherent) => {
    setAdherents((l) => l.map((a) => (a.id === id ? fn(a) : a)))
  }, [])

  const creerAdhesion = useCallback<Ctx['creerAdhesion']>(
    async (saisie, paiement) => {
      await echouerSiDemande()
      const type = types.find((t) => t.id === saisie.typeId)!
      const debut = new Date(saisie.dateDebut)
      const fin = new Date(debut)
      fin.setMonth(fin.getMonth() + type.dureeMois)
      const echeance = new Date(debut)
      echeance.setDate(echeance.getDate() + 30)

      const cotisationId = uid('cot')
      const paye = paiement?.montant ?? 0
      const cotisation: Cotisation = {
        id: cotisationId,
        exercice: exercicePour(debut.toISOString()),
        typeNom: type.nom,
        montant: saisie.montant,
        emiseLe: debut.toISOString(),
        echeanceLe: echeance.toISOString(),
        statut: paye >= saisie.montant ? 'payee' : paye > 0 ? 'partielle' : 'attente',
      }

      const paiements: Paiement[] = paiement
        ? [
            {
              id: uid('pay'),
              cotisationId,
              montant: paiement.montant,
              date: new Date(paiement.date).toISOString(),
              moyen: paiement.moyen,
              reference: paiement.reference || `PAY-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
              statut: 'valide',
              encaissePar: 'Camille Beauchamp',
            },
          ]
        : []

      const nouveau: Adherent = {
        id: uid('ad'),
        numero: `A-${debut.getFullYear()}-${String(900 + adherents.length).padStart(4, '0')}`,
        civilite: saisie.civilite,
        prenom: saisie.prenom,
        nom: saisie.nom,
        email: saisie.email,
        telephone: saisie.telephone,
        dateNaissance: saisie.dateNaissance,
        ville: saisie.ville,
        codePostal: saisie.codePostal,
        typeId: type.id,
        premiereAdhesion: debut.toISOString(),
        dateDebut: debut.toISOString(),
        dateFin: fin.toISOString(),
        resilieeLe: null,
        motifResiliation: '',
        cotisations: [cotisation],
        paiements,
        documents: [],
        historique: [
          ...(paiement
            ? [ev('Paiement enregistré', `${paiement.montant} € par ${moyenLabels[paiement.moyen].toLowerCase()}.`, 'success')]
            : []),
          ev('Cotisation émise', `${saisie.montant} € — échéance au ${echeance.toLocaleDateString('fr-FR')}.`, 'warning'),
          ev('Adhésion enregistrée', `Formule ${type.nom}, valable jusqu’au ${fin.toLocaleDateString('fr-FR')}.`, 'success'),
        ],
        notes: saisie.notes,
      }

      setAdherents((l) => [nouveau, ...l])
      return nouveau
    },
    [echouerSiDemande, types, adherents.length],
  )

  const renouveler = useCallback<Ctx['renouveler']>(
    async (id, typeId, dateDebut, montant) => {
      await echouerSiDemande()
      const type = types.find((t) => t.id === typeId)!
      const debut = new Date(dateDebut)
      const fin = new Date(debut)
      fin.setMonth(fin.getMonth() + type.dureeMois)
      const echeance = new Date(debut)
      echeance.setDate(echeance.getDate() + 30)

      let resultat: Adherent | undefined
      setAdherents((l) =>
        l.map((a) => {
          if (a.id !== id) return a
          const cotisation: Cotisation = {
            id: uid('cot'),
            exercice: exercicePour(debut.toISOString()),
            typeNom: type.nom,
            montant,
            emiseLe: debut.toISOString(),
            echeanceLe: echeance.toISOString(),
            statut: 'attente',
          }
          resultat = {
            ...a,
            typeId,
            dateDebut: debut.toISOString(),
            dateFin: fin.toISOString(),
            resilieeLe: null,
            motifResiliation: '',
            cotisations: [...a.cotisations, cotisation],
            historique: [
              ev('Cotisation émise', `${montant} € — échéance au ${echeance.toLocaleDateString('fr-FR')}.`, 'warning'),
              ev('Adhésion renouvelée', `Formule ${type.nom}, valable jusqu’au ${fin.toLocaleDateString('fr-FR')}.`, 'success'),
              ...a.historique,
            ],
          }
          return resultat
        }),
      )
      await attendre(0)
      if (!resultat) throw new Error('Adhérent introuvable.')
      return resultat
    },
    [echouerSiDemande, types],
  )

  const enregistrerPaiement = useCallback<Ctx['enregistrerPaiement']>(
    async (id, saisie) => {
      await echouerSiDemande()
      majAdherent(id, (a) => {
        const paiement: Paiement = {
          id: uid('pay'),
          cotisationId: saisie.cotisationId,
          montant: saisie.montant,
          date: new Date(saisie.date).toISOString(),
          moyen: saisie.moyen,
          reference: saisie.reference || `PAY-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
          statut: 'valide',
          encaissePar: 'Camille Beauchamp',
        }
        const paiements = [...a.paiements, paiement]
        const cotisations = a.cotisations.map((c) => {
          if (c.id !== saisie.cotisationId) return c
          const paye = paiements
            .filter((p) => p.cotisationId === c.id && p.statut === 'valide')
            .reduce((s, p) => s + p.montant, 0)
          return { ...c, statut: paye >= c.montant ? ('payee' as const) : ('partielle' as const) }
        })
        return {
          ...a,
          paiements,
          cotisations,
          historique: [
            ev('Paiement enregistré', `${saisie.montant} € par ${moyenLabels[saisie.moyen].toLowerCase()} — ${paiement.reference}.`, 'success'),
            ...a.historique,
          ],
        }
      })
    },
    [echouerSiDemande, majAdherent],
  )

  const desactiver = useCallback<Ctx['desactiver']>(
    async (id, motif) => {
      await echouerSiDemande()
      majAdherent(id, (a) => ({
        ...a,
        resilieeLe: new Date().toISOString(),
        motifResiliation: motif,
        cotisations: a.cotisations.map((c) =>
          c.statut === 'attente' || c.statut === 'retard' ? { ...c, statut: 'annulee' as const } : c,
        ),
        historique: [ev('Adhésion désactivée', motif || 'Aucun motif renseigné.', 'danger'), ...a.historique],
      }))
    },
    [echouerSiDemande, majAdherent],
  )

  const reactiver = useCallback<Ctx['reactiver']>(
    async (id) => {
      await echouerSiDemande()
      majAdherent(id, (a) => ({
        ...a,
        resilieeLe: null,
        motifResiliation: '',
        historique: [ev('Adhésion réactivée', 'La désactivation a été annulée.', 'success'), ...a.historique],
      }))
    },
    [echouerSiDemande, majAdherent],
  )

  const ajouterDocument = useCallback<Ctx['ajouterDocument']>(
    async (id, nom, categorie) => {
      await echouerSiDemande()
      majAdherent(id, (a) => ({
        ...a,
        documents: [
          {
            id: uid('doca'),
            nom: nom.endsWith('.pdf') ? nom : `${nom}.pdf`,
            categorie,
            taille: `${Math.floor(Math.random() * 900 + 120)} Ko`,
            ajouteLe: new Date().toISOString(),
            ajoutePar: 'Camille Beauchamp',
          },
          ...a.documents,
        ],
        historique: [ev('Document ajouté', `${nom} — catégorie ${categorie}.`), ...a.historique],
      }))
    },
    [echouerSiDemande, majAdherent],
  )

  const creerType = useCallback<Ctx['creerType']>(
    async (t) => {
      await echouerSiDemande()
      setTypes((l) => [...l, { ...t, id: uid('ta') }])
    },
    [echouerSiDemande],
  )

  const modifierType = useCallback<Ctx['modifierType']>(
    async (id, patch) => {
      await echouerSiDemande()
      setTypes((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)))
    },
    [echouerSiDemande],
  )

  const supprimerType = useCallback<Ctx['supprimerType']>(
    async (id) => {
      await echouerSiDemande()
      setTypes((l) => l.filter((t) => t.id !== id))
    },
    [echouerSiDemande],
  )

  const compterType = useCallback((id: string) => adherents.filter((a) => a.typeId === id).length, [adherents])

  const value = useMemo<Ctx>(
    () => ({
      adherents, types, chargement, erreur, mode, setMode, recharger, parId, typeParId,
      creerAdhesion, renouveler, enregistrerPaiement, desactiver, reactiver, ajouterDocument,
      creerType, modifierType, supprimerType, compterType,
    }),
    [adherents, types, chargement, erreur, mode, recharger, parId, typeParId, creerAdhesion, renouveler, enregistrerPaiement, desactiver, reactiver, ajouterDocument, creerType, modifierType, supprimerType, compterType],
  )

  return <AdherentsContext.Provider value={value}>{children}</AdherentsContext.Provider>
}

export function useAdherents() {
  const ctx = useContext(AdherentsContext)
  if (!ctx) throw new Error('useAdherents doit être utilisé dans AdherentsProvider')
  return ctx
}
