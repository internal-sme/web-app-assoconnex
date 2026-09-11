import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  MOI,
  champTailles,
  demandesAvecExpiration,
  demandesInitiales,
  type Champ,
  type DemandeSignature,
  type EvenementSignature,
  type Signataire,
  type TypeChamp,
} from '@/lib/signatures'
import { uid } from '@/lib/utils'

export type ModeDemoSign = 'normal' | 'chargement' | 'vide' | 'expiree' | 'erreur' | 'echec'

export type BrouillonDemande = {
  titre: string
  documentNom: string
  pages: number
  message: string
  echeanceLe: string
  signataires: Omit<Signataire, 'id' | 'statut' | 'signeLe' | 'motifRefus'>[]
  champs: Omit<Champ, 'id'>[]
}

type Ctx = {
  demandes: DemandeSignature[]
  chargement: boolean
  erreur: string | null
  mode: ModeDemoSign
  setMode: (m: ModeDemoSign) => void
  recharger: () => void
  demandeParId: (id: string) => DemandeSignature | undefined
  creer: (b: BrouillonDemande, envoyer: boolean) => Promise<DemandeSignature>
  envoyer: (id: string) => Promise<void>
  signer: (id: string, signataireId: string) => Promise<void>
  refuser: (id: string, signataireId: string, motif: string) => Promise<void>
  relancer: (id: string) => Promise<void>
  annuler: (id: string, motif: string) => Promise<void>
  prolonger: (id: string, nouvelleEcheance: string) => Promise<void>
}

const SignaturesContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function ev(auteur: string, libelle: string, detail: string, tone: EvenementSignature['tone'] = 'neutral'): EvenementSignature {
  return { id: uid('es'), quand: new Date().toISOString(), auteur, libelle, detail, tone }
}

export function SignaturesProvider({ children }: { children: ReactNode }) {
  const [demandes, setDemandes] = useState<DemandeSignature[]>(demandesInitiales)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoSign>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const charger = useCallback(async (m: ModeDemoSign) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Le service de signature électronique n'a pas répondu.")
      setDemandes([])
    } else if (m === 'vide') {
      setDemandes([])
    } else if (m === 'expiree') {
      setDemandes(demandesAvecExpiration())
    } else {
      setDemandes(demandesInitiales)
    }
    setChargement(false)
  }, [])

  useEffect(() => {
    void charger(mode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const recharger = useCallback(() => void charger(modeRef.current), [charger])

  const echouerSiDemande = useCallback(async () => {
    await attendre(800)
    if (modeRef.current === 'echec') throw new Error("L'opération a échoué. Le service de signature a refusé la demande.")
  }, [])

  const demandeParId = useCallback((id: string) => demandes.find((d) => d.id === id), [demandes])

  const maj = useCallback((id: string, fn: (d: DemandeSignature) => DemandeSignature) => {
    setDemandes((l) => l.map((d) => (d.id === id ? fn(d) : d)))
  }, [])

  const creer = useCallback<Ctx['creer']>(
    async (b, doitEnvoyer) => {
      if (b.signataires.length === 0) throw new Error('Une demande doit comporter au moins un signataire.')
      if (doitEnvoyer && b.champs.filter((c) => c.type === 'signature').length === 0) {
        throw new Error('Chaque demande doit porter au moins une zone de signature avant l’envoi.')
      }
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      const signataires: Signataire[] = b.signataires.map((s) => ({
        ...s,
        id: uid('sg'),
        statut: 'attente',
        signeLe: null,
        motifRefus: '',
      }))
      // On réassocie les champs aux identifiants définitifs, par position dans la liste
      const champs: Champ[] = b.champs.map((c) => {
        const index = b.signataires.findIndex((s) => s.email === c.signataireId) 
        return {
          ...c,
          id: uid('ch'),
          signataireId: index >= 0 ? signataires[index].id : (signataires[0]?.id ?? ''),
        }
      })

      const nouvelle: DemandeSignature = {
        id: uid('sig'),
        reference: `SIG-${new Date().getFullYear()}-${String(900 + demandes.length)}`,
        titre: b.titre,
        documentNom: b.documentNom,
        documentId: null,
        pages: b.pages,
        message: b.message,
        createurNom: MOI.nom,
        creeLe: maintenant,
        envoyeeLe: doitEnvoyer ? maintenant : null,
        echeanceLe: new Date(b.echeanceLe).toISOString(),
        statut: doitEnvoyer ? 'en_attente' : 'brouillon',
        signataires,
        champs,
        historique: [
          ...(doitEnvoyer
            ? [ev(MOI.nom, 'Demande envoyée', `Invitations transmises à ${signataires.map((s) => s.email).join(', ')}.`)]
            : []),
          ev(MOI.nom, 'Demande créée', `${b.documentNom} — ${b.pages} page(s), ${signataires.length} signataire(s).`),
        ],
        fichierSigne: null,
      }
      setDemandes((l) => [nouvelle, ...l])
      return nouvelle
    },
    [echouerSiDemande, demandes.length],
  )

  const envoyer = useCallback<Ctx['envoyer']>(
    async (id) => {
      const d = demandes.find((x) => x.id === id)
      if (!d) throw new Error('Demande introuvable.')
      if (d.champs.filter((c) => c.type === 'signature').length === 0) {
        throw new Error('Placez au moins une zone de signature avant d’envoyer.')
      }
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      maj(id, (x) => ({
        ...x,
        statut: 'en_attente',
        envoyeeLe: maintenant,
        historique: [ev(MOI.nom, 'Demande envoyée', `Invitations transmises à ${x.signataires.map((s) => s.email).join(', ')}.`), ...x.historique],
      }))
    },
    [echouerSiDemande, demandes, maj],
  )

  const signer = useCallback<Ctx['signer']>(
    async (id, signataireId) => {
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      maj(id, (d) => {
        const signataires = d.signataires.map((s) => (s.id === signataireId ? { ...s, statut: 'signe' as const, signeLe: maintenant } : s))
        const tousSignes = signataires.every((s) => s.statut === 'signe')
        const qui = d.signataires.find((s) => s.id === signataireId)
        return {
          ...d,
          signataires,
          statut: tousSignes ? 'terminee' : d.statut,
          fichierSigne: tousSignes ? d.documentNom.replace(/\.\w+$/, '-signe.pdf') : d.fichierSigne,
          historique: [
            ...(tousSignes ? [ev('AssoConnex', 'Document signé généré', 'Le fichier scellé est disponible au téléchargement.', 'success')] : []),
            ev(qui?.nom ?? '', 'Document signé', `Signature recueillie, position ${qui?.ordre} sur ${d.signataires.length}.`, 'success'),
            ...d.historique,
          ],
        }
      })
    },
    [echouerSiDemande, maj],
  )

  const refuser = useCallback<Ctx['refuser']>(
    async (id, signataireId, motif) => {
      if (!motif.trim()) throw new Error('Un motif de refus est obligatoire : le demandeur doit savoir quoi corriger.')
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      maj(id, (d) => {
        const qui = d.signataires.find((s) => s.id === signataireId)
        return {
          ...d,
          statut: 'refusee',
          signataires: d.signataires.map((s) => (s.id === signataireId ? { ...s, statut: 'refuse' as const, signeLe: maintenant, motifRefus: motif } : s)),
          historique: [ev(qui?.nom ?? '', 'Signature refusée', motif, 'danger'), ...d.historique],
        }
      })
    },
    [echouerSiDemande, maj],
  )

  const relancer = useCallback<Ctx['relancer']>(
    async (id) => {
      const d = demandes.find((x) => x.id === id)
      if (!d) throw new Error('Demande introuvable.')
      const enAttente = d.signataires.filter((s) => s.statut === 'attente')
      if (enAttente.length === 0) throw new Error('Tous les signataires ont déjà répondu : aucune relance n’est nécessaire.')
      await echouerSiDemande()
      maj(id, (x) => ({
        ...x,
        historique: [ev(MOI.nom, 'Relance envoyée', `Rappel adressé à ${enAttente.map((s) => s.nom).join(', ')}.`, 'warning'), ...x.historique],
      }))
    },
    [echouerSiDemande, demandes, maj],
  )

  const annuler = useCallback<Ctx['annuler']>(
    async (id, motif) => {
      const d = demandes.find((x) => x.id === id)
      if (d?.statut === 'terminee') throw new Error('Une demande signée par tous ne peut plus être annulée.')
      await echouerSiDemande()
      maj(id, (x) => ({
        ...x,
        statut: 'annulee',
        historique: [ev(MOI.nom, 'Demande annulée', motif || 'Aucun motif renseigné.', 'danger'), ...x.historique],
      }))
    },
    [echouerSiDemande, demandes, maj],
  )

  const prolonger = useCallback<Ctx['prolonger']>(
    async (id, nouvelleEcheance) => {
      await echouerSiDemande()
      maj(id, (x) => ({
        ...x,
        echeanceLe: new Date(nouvelleEcheance).toISOString(),
        historique: [
          ev(MOI.nom, 'Échéance repoussée', `Nouvelle date limite : ${new Date(nouvelleEcheance).toLocaleDateString('fr-FR')}.`, 'warning'),
          ...x.historique,
        ],
      }))
    },
    [echouerSiDemande, maj],
  )

  const value = useMemo<Ctx>(
    () => ({ demandes, chargement, erreur, mode, setMode, recharger, demandeParId, creer, envoyer, signer, refuser, relancer, annuler, prolonger }),
    [demandes, chargement, erreur, mode, recharger, demandeParId, creer, envoyer, signer, refuser, relancer, annuler, prolonger],
  )

  return <SignaturesContext.Provider value={value}>{children}</SignaturesContext.Provider>
}

export function useSignatures() {
  const ctx = useContext(SignaturesContext)
  if (!ctx) throw new Error('useSignatures doit être utilisé dans SignaturesProvider')
  return ctx
}

export { champTailles }
export type { TypeChamp }
