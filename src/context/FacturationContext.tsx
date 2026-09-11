import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  clientsInitiaux,
  facturesInitiales,
  facturesSansLigne,
  grillesInitiales,
  modelesInitiaux,
  moyenReglementLabels,
  numerotationInitiale,
  produitsInitiaux,
  resteDuFacture,
  totalTTC,
  type Client,
  type EvenementFacture,
  type Facture,
  type GrilleTarifaire,
  type LigneFacture,
  type ModeleFacture,
  type Numerotation,
  type Produit,
  type Relance,
  type ReglementFacture,
} from '@/lib/facturation'
import { uid } from '@/lib/utils'

export type ModeDemoFact = 'normal' | 'chargement' | 'vide' | 'sans-ligne' | 'erreur' | 'echec' | 'echec-envoi'

export type BrouillonFacture = Pick<
  Facture,
  'type' | 'clientId' | 'modeleId' | 'date' | 'echeance' | 'objet' | 'reference' | 'lignes' | 'notes' | 'factureOrigineId'
>

type Ctx = {
  factures: Facture[]
  clients: Client[]
  produits: Produit[]
  grilles: GrilleTarifaire[]
  modeles: ModeleFacture[]
  numerotation: Numerotation[]
  chargement: boolean
  erreur: string | null
  mode: ModeDemoFact
  setMode: (m: ModeDemoFact) => void
  recharger: () => void
  factureParId: (id: string) => Facture | undefined
  clientParId: (id: string) => Client | undefined
  produitParId: (id: string) => Produit | undefined
  prochainNumero: (type: 'facture' | 'avoir') => string
  creerFacture: (b: BrouillonFacture) => Promise<Facture>
  modifierFacture: (id: string, b: Partial<Facture>) => Promise<void>
  dupliquer: (id: string) => Promise<Facture>
  envoyer: (id: string) => Promise<void>
  annuler: (id: string, motif: string) => Promise<void>
  enregistrerReglement: (id: string, r: Omit<ReglementFacture, 'id'>) => Promise<void>
  relancer: (id: string, canal: Relance['canal']) => Promise<void>
  creerAvoir: (origineId: string, lignes: LigneFacture[], motif: string) => Promise<Facture>
  creerClient: (c: Omit<Client, 'id'>) => Promise<void>
  modifierClient: (id: string, patch: Partial<Client>) => Promise<void>
  creerProduit: (p: Omit<Produit, 'id'>) => Promise<void>
  modifierProduit: (id: string, patch: Partial<Produit>) => Promise<void>
  modifierGrille: (id: string, patch: Partial<GrilleTarifaire>) => Promise<void>
  creerGrille: (g: Omit<GrilleTarifaire, 'id'>) => Promise<void>
  modifierModele: (id: string, patch: Partial<ModeleFacture>) => Promise<void>
  creerModele: (m: Omit<ModeleFacture, 'id'>) => Promise<void>
  modifierNumerotation: (id: 'facture' | 'avoir', patch: Partial<Numerotation>) => Promise<void>
}

const FacturationContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function ev(libelle: string, detail: string, tone: EvenementFacture['tone'] = 'neutral'): EvenementFacture {
  return { id: uid('ef'), quand: new Date().toISOString(), auteur: 'Camille Beauchamp', libelle, detail, tone }
}

export function FacturationProvider({ children }: { children: ReactNode }) {
  const [factures, setFactures] = useState<Facture[]>(facturesInitiales)
  const [clients, setClients] = useState<Client[]>(clientsInitiaux)
  const [produits, setProduits] = useState<Produit[]>(produitsInitiaux)
  const [grilles, setGrilles] = useState<GrilleTarifaire[]>(grillesInitiales)
  const [modeles, setModeles] = useState<ModeleFacture[]>(modelesInitiaux)
  const [numerotation, setNumerotation] = useState<Numerotation[]>(numerotationInitiale)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoFact>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoFact) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Le service de facturation n'a pas répondu.")
      setFactures([])
    } else if (m === 'vide') {
      setFactures([])
    } else {
      setFactures(m === 'sans-ligne' ? facturesSansLigne() : facturesInitiales)
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
    if (modeRef.current === 'echec') throw new Error("L'enregistrement a échoué. Le serveur a refusé l'opération.")
  }, [])

  const echouerEnvoiSiDemande = useCallback(async () => {
    await attendre(900)
    if (modeRef.current === 'echec' || modeRef.current === 'echec-envoi') {
      throw new Error("L'envoi a échoué : le serveur de messagerie a refusé le message. Vérifiez l'adresse du client.")
    }
  }, [])

  const factureParId = useCallback((id: string) => factures.find((f) => f.id === id), [factures])
  const clientParId = useCallback((id: string) => clients.find((c) => c.id === id), [clients])
  const produitParId = useCallback((id: string) => produits.find((p) => p.id === id), [produits])

  const prochainNumero = useCallback(
    (type: 'facture' | 'avoir') => {
      const n = numerotation.find((x) => x.id === type)!
      const annee = new Date().getFullYear()
      return `${n.prefixe}-${annee}-${String(n.prochain).padStart(n.longueur, '0')}`
    },
    [numerotation],
  )

  const incrementer = useCallback((type: 'facture' | 'avoir') => {
    setNumerotation((l) => l.map((n) => (n.id === type ? { ...n, prochain: n.prochain + 1 } : n)))
  }, [])

  const maj = useCallback((id: string, fn: (f: Facture) => Facture) => {
    setFactures((l) => l.map((f) => (f.id === id ? fn(f) : f)))
  }, [])

  const creerFacture = useCallback<Ctx['creerFacture']>(
    async (b) => {
      await echouerSiDemande()
      const numero = prochainNumero(b.type)
      const nouvelle: Facture = {
        ...b,
        id: uid('fa'),
        numero,
        statut: 'brouillon',
        reglements: [],
        relances: [],
        documents: [],
        historique: [ev('Facture créée', `${b.lignes.length} ligne(s), brouillon ${numero}.`)],
        envoyeeLe: null,
        annuleeLe: null,
        motifAnnulation: '',
      }
      setFactures((l) => [nouvelle, ...l])
      incrementer(b.type)
      return nouvelle
    },
    [echouerSiDemande, prochainNumero, incrementer],
  )

  const modifierFacture = useCallback<Ctx['modifierFacture']>(
    async (id, patch) => {
      const cible = factures.find((f) => f.id === id)
      if (cible && cible.statut !== 'brouillon') {
        throw new Error('Seul un brouillon peut être modifié. Une facture envoyée se corrige par un avoir.')
      }
      await echouerSiDemande()
      maj(id, (f) => ({ ...f, ...patch, historique: [ev('Facture modifiée', 'Le brouillon a été mis à jour.'), ...f.historique] }))
    },
    [echouerSiDemande, factures, maj],
  )

  const dupliquer = useCallback<Ctx['dupliquer']>(
    async (id) => {
      const source = factures.find((f) => f.id === id)
      if (!source) throw new Error('Facture introuvable.')
      await echouerSiDemande()
      const numero = prochainNumero(source.type)
      const copie: Facture = {
        ...source,
        id: uid('fa'),
        numero,
        date: new Date().toISOString(),
        echeance: new Date(Date.now() + 30 * 86400000).toISOString(),
        statut: 'brouillon',
        lignes: source.lignes.map((l) => ({ ...l, id: uid('lf') })),
        reglements: [],
        relances: [],
        documents: [],
        historique: [ev('Facture dupliquée', `Copie de ${source.numero}.`)],
        envoyeeLe: null,
        annuleeLe: null,
        motifAnnulation: '',
      }
      setFactures((l) => [copie, ...l])
      incrementer(source.type)
      return copie
    },
    [echouerSiDemande, factures, prochainNumero, incrementer],
  )

  const envoyer = useCallback<Ctx['envoyer']>(
    async (id) => {
      const cible = factures.find((f) => f.id === id)
      if (!cible) throw new Error('Facture introuvable.')
      if (cible.lignes.length === 0) {
        throw new Error('Une facture sans ligne ne peut pas être envoyée. Ajoutez au moins une prestation.')
      }
      const client = clients.find((c) => c.id === cible.clientId)
      await echouerEnvoiSiDemande()
      maj(id, (f) => ({
        ...f,
        statut: 'envoyee',
        envoyeeLe: new Date().toISOString(),
        historique: [ev('Facture envoyée', `Transmise à ${client?.email ?? 'l’adresse du client'}.`, 'success'), ...f.historique],
      }))
    },
    [echouerEnvoiSiDemande, factures, clients, maj],
  )

  const annuler = useCallback<Ctx['annuler']>(
    async (id, motif) => {
      const cible = factures.find((f) => f.id === id)
      if (cible && cible.reglements.length > 0) {
        throw new Error('Cette facture a déjà été réglée en tout ou partie. Émettez un avoir plutôt que de l’annuler.')
      }
      await echouerSiDemande()
      maj(id, (f) => ({
        ...f,
        statut: 'annulee',
        annuleeLe: new Date().toISOString(),
        motifAnnulation: motif,
        historique: [ev('Facture annulée', motif || 'Aucun motif renseigné.', 'danger'), ...f.historique],
      }))
    },
    [echouerSiDemande, factures, maj],
  )

  const enregistrerReglement = useCallback<Ctx['enregistrerReglement']>(
    async (id, r) => {
      await echouerSiDemande()
      maj(id, (f) => {
        const reglement: ReglementFacture = { ...r, id: uid('rg') }
        const reglements = [...f.reglements, reglement]
        const solde = totalTTC(f) - reglements.reduce((s, x) => s + x.montant, 0) <= 0
        return {
          ...f,
          reglements,
          statut: solde ? 'payee' : f.statut === 'brouillon' ? 'envoyee' : f.statut,
          historique: [
            ev(
              'Règlement enregistré',
              `${r.montant} € par ${moyenReglementLabels[r.moyen].toLowerCase()} — ${r.reference || 'sans référence'}.`,
              'success',
            ),
            ...f.historique,
          ],
        }
      })
    },
    [echouerSiDemande, maj],
  )

  const relancer = useCallback<Ctx['relancer']>(
    async (id, canal) => {
      const cible = factures.find((f) => f.id === id)
      if (!cible) throw new Error('Facture introuvable.')
      if (resteDuFacture(cible) === 0) throw new Error('Cette facture est soldée : aucune relance n’est nécessaire.')
      await echouerEnvoiSiDemande()
      const niveau = Math.min(cible.relances.length + 1, 3) as 1 | 2 | 3
      const objet = niveau === 1 ? 'Rappel d’échéance' : niveau === 2 ? 'Relance — facture impayée' : 'Mise en demeure avant recouvrement'
      maj(id, (f) => ({
        ...f,
        relances: [...f.relances, { id: uid('rl'), niveau, date: new Date().toISOString(), canal, objet }],
        historique: [ev(`Relance niveau ${niveau}`, `${objet} — envoyée par ${canal}.`, 'warning'), ...f.historique],
      }))
    },
    [echouerEnvoiSiDemande, factures, maj],
  )

  const creerAvoir = useCallback<Ctx['creerAvoir']>(
    async (origineId, lignes, motif) => {
      const origine = factures.find((f) => f.id === origineId)
      if (!origine) throw new Error('Facture d’origine introuvable.')
      if (lignes.length === 0) throw new Error('Un avoir doit porter au moins une ligne.')
      await echouerSiDemande()
      const numero = prochainNumero('avoir')
      const avoir: Facture = {
        id: uid('av'),
        numero,
        type: 'avoir',
        clientId: origine.clientId,
        modeleId: origine.modeleId,
        date: new Date().toISOString(),
        echeance: new Date().toISOString(),
        objet: `Avoir sur la facture ${origine.numero}`,
        reference: origine.numero,
        statut: 'brouillon',
        lignes: lignes.map((l) => ({ ...l, id: uid('lav') })),
        reglements: [],
        relances: [],
        documents: [],
        historique: [ev('Avoir créé', `${motif || 'Sans motif précisé'} — adossé à ${origine.numero}.`)],
        notes: motif,
        factureOrigineId: origine.id,
        envoyeeLe: null,
        annuleeLe: null,
        motifAnnulation: '',
      }
      setFactures((l) => [avoir, ...l])
      incrementer('avoir')
      maj(origineId, (f) => ({
        ...f,
        historique: [ev('Avoir émis', `${numero} adossé à cette facture.`, 'warning'), ...f.historique],
      }))
      return avoir
    },
    [echouerSiDemande, factures, prochainNumero, incrementer, maj],
  )

  /* --- référentiels --- */

  const creerClient = useCallback<Ctx['creerClient']>(
    async (c) => {
      await echouerSiDemande()
      setClients((l) => [...l, { ...c, id: uid('cl') }])
    },
    [echouerSiDemande],
  )
  const modifierClient = useCallback<Ctx['modifierClient']>(
    async (id, patch) => {
      await echouerSiDemande()
      setClients((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    },
    [echouerSiDemande],
  )
  const creerProduit = useCallback<Ctx['creerProduit']>(
    async (p) => {
      await echouerSiDemande()
      setProduits((l) => [...l, { ...p, id: uid('pr') }])
    },
    [echouerSiDemande],
  )
  const modifierProduit = useCallback<Ctx['modifierProduit']>(
    async (id, patch) => {
      await echouerSiDemande()
      setProduits((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    },
    [echouerSiDemande],
  )
  const creerGrille = useCallback<Ctx['creerGrille']>(
    async (g) => {
      await echouerSiDemande()
      setGrilles((l) => [...l, { ...g, id: uid('gt') }])
    },
    [echouerSiDemande],
  )
  const modifierGrille = useCallback<Ctx['modifierGrille']>(
    async (id, patch) => {
      await echouerSiDemande()
      setGrilles((l) => l.map((g) => (g.id === id ? { ...g, ...patch } : g)))
    },
    [echouerSiDemande],
  )
  const creerModele = useCallback<Ctx['creerModele']>(
    async (m) => {
      await echouerSiDemande()
      setModeles((l) => [...l, { ...m, id: uid('md') }])
    },
    [echouerSiDemande],
  )
  const modifierModele = useCallback<Ctx['modifierModele']>(
    async (id, patch) => {
      await echouerSiDemande()
      setModeles((l) =>
        l.map((m) => (m.id === id ? { ...m, ...patch } : patch.defaut ? { ...m, defaut: false } : m)),
      )
    },
    [echouerSiDemande],
  )
  const modifierNumerotation = useCallback<Ctx['modifierNumerotation']>(
    async (id, patch) => {
      await echouerSiDemande()
      setNumerotation((l) => l.map((n) => (n.id === id ? { ...n, ...patch } : n)))
    },
    [echouerSiDemande],
  )

  const value = useMemo<Ctx>(
    () => ({
      factures, clients, produits, grilles, modeles, numerotation, chargement, erreur, mode, setMode, recharger,
      factureParId, clientParId, produitParId, prochainNumero,
      creerFacture, modifierFacture, dupliquer, envoyer, annuler, enregistrerReglement, relancer, creerAvoir,
      creerClient, modifierClient, creerProduit, modifierProduit, creerGrille, modifierGrille, creerModele,
      modifierModele, modifierNumerotation,
    }),
    [factures, clients, produits, grilles, modeles, numerotation, chargement, erreur, mode, recharger, factureParId, clientParId, produitParId, prochainNumero, creerFacture, modifierFacture, dupliquer, envoyer, annuler, enregistrerReglement, relancer, creerAvoir, creerClient, modifierClient, creerProduit, modifierProduit, creerGrille, modifierGrille, creerModele, modifierModele, modifierNumerotation],
  )

  return <FacturationContext.Provider value={value}>{children}</FacturationContext.Provider>
}

export function useFacturation() {
  const ctx = useContext(FacturationContext)
  if (!ctx) throw new Error('useFacturation doit être utilisé dans FacturationProvider')
  return ctx
}
