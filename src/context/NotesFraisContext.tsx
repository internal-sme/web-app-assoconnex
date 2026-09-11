import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  centresCoutInitiaux,
  demandeursInitiaux,
  naturesInitiales,
  notesInitiales,
  notesSansJustificatif,
  projetsInitiaux,
  UTILISATEUR_NDF,
  type CentreCout,
  type Demandeur,
  type EvenementNote,
  type Nature,
  type NoteFrais,
  type Projet,
} from '@/lib/notesFrais'
import { uid } from '@/lib/utils'

export type ModeDemoNdf = 'normal' | 'chargement' | 'vide' | 'justificatif' | 'erreur' | 'echec'

export type SaisieNote = Pick<
  NoteFrais,
  | 'dateDepense' | 'natureId' | 'libelle' | 'montantTTC' | 'tva' | 'moyenPaiement'
  | 'projetId' | 'centreCoutId' | 'justificatif' | 'justificatifScanne' | 'commentaire'
>

type Ctx = {
  notes: NoteFrais[]
  natures: Nature[]
  projets: Projet[]
  centres: CentreCout[]
  demandeurs: Demandeur[]
  utilisateurId: string
  chargement: boolean
  erreur: string | null
  mode: ModeDemoNdf
  setMode: (m: ModeDemoNdf) => void
  recharger: () => void
  noteParId: (id: string) => NoteFrais | undefined
  natureParId: (id: string) => Nature | undefined
  demandeurParId: (id: string) => Demandeur | undefined
  creerNote: (s: SaisieNote, soumettre: boolean) => Promise<NoteFrais>
  modifierNote: (id: string, s: Partial<NoteFrais>) => Promise<void>
  supprimerNote: (id: string) => Promise<void>
  soumettre: (id: string) => Promise<void>
  validerResponsable: (id: string) => Promise<void>
  validerTresorier: (id: string) => Promise<void>
  rejeter: (id: string, motif: string, etape: 'responsable' | 'tresorier') => Promise<void>
  rembourser: (ids: string[], reference: string) => Promise<void>
  attacherJustificatif: (id: string, nom: string, scanne: boolean) => Promise<void>
}

const NotesFraisContext = createContext<Ctx | null>(null)
const attendre = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function ev(auteur: string, libelle: string, detail: string, tone: EvenementNote['tone'] = 'neutral'): EvenementNote {
  return { id: uid('en'), quand: new Date().toISOString(), auteur, libelle, detail, tone }
}

export function NotesFraisProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<NoteFrais[]>(notesInitiales)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [mode, setMode] = useState<ModeDemoNdf>('normal')
  const modeRef = useRef(mode)
  modeRef.current = mode
  const requete = useRef(0)

  const utilisateur = demandeursInitiaux.find((d) => d.id === UTILISATEUR_NDF)!

  const charger = useCallback(async (m: ModeDemoNdf) => {
    const jeton = ++requete.current
    setErreur(null)
    setChargement(true)
    await attendre(m === 'chargement' ? 100000 : 700)
    if (jeton !== requete.current) return
    if (m === 'erreur') {
      setErreur("Le service des notes de frais n'a pas répondu.")
      setNotes([])
    } else if (m === 'vide') {
      setNotes([])
    } else if (m === 'justificatif') {
      setNotes(notesSansJustificatif())
    } else {
      setNotes(notesInitiales)
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

  const noteParId = useCallback((id: string) => notes.find((n) => n.id === id), [notes])
  const natureParId = useCallback((id: string) => naturesInitiales.find((n) => n.id === id), [])
  const demandeurParId = useCallback((id: string) => demandeursInitiaux.find((d) => d.id === id), [])

  const maj = useCallback((id: string, fn: (n: NoteFrais) => NoteFrais) => {
    setNotes((l) => l.map((n) => (n.id === id ? fn(n) : n)))
  }, [])

  const creerNote = useCallback<Ctx['creerNote']>(
    async (s, doitSoumettre) => {
      const nature = naturesInitiales.find((n) => n.id === s.natureId)
      if (doitSoumettre && nature?.justificatifObligatoire && !s.justificatif) {
        throw new Error(`Un justificatif est obligatoire pour la nature « ${nature.nom} ». Enregistrez en brouillon ou joignez la pièce.`)
      }
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      const nouvelle: NoteFrais = {
        ...s,
        id: uid('ndf'),
        numero: `NDF-${new Date().getFullYear()}-${String(900 + notes.length)}`,
        demandeurId: utilisateur.id,
        statut: doitSoumettre ? 'soumise' : 'brouillon',
        soumiseLe: doitSoumettre ? maintenant : null,
        valideeResponsableLe: null,
        valideeResponsablePar: '',
        valideeTresorierLe: null,
        valideeTresorierPar: '',
        rejeteeLe: null,
        rejeteePar: '',
        rejeteeA: null,
        motifRejet: '',
        rembourseeLe: null,
        referenceRemboursement: '',
        historique: [
          ...(doitSoumettre ? [ev(utilisateur.nom, 'Note soumise', 'Transmise au responsable pour validation.')] : []),
          ev(utilisateur.nom, 'Note créée', `${s.libelle} — ${s.montantTTC} € TTC.`),
        ],
      }
      setNotes((l) => [nouvelle, ...l])
      return nouvelle
    },
    [echouerSiDemande, notes.length, utilisateur],
  )

  const modifierNote = useCallback<Ctx['modifierNote']>(
    async (id, patch) => {
      const cible = notes.find((n) => n.id === id)
      if (cible && cible.statut !== 'brouillon' && cible.statut !== 'rejetee') {
        throw new Error('Une note engagée dans le circuit de validation ne peut plus être modifiée.')
      }
      await echouerSiDemande()
      maj(id, (n) => ({ ...n, ...patch, historique: [ev(utilisateur.nom, 'Note modifiée', 'Les informations ont été mises à jour.'), ...n.historique] }))
    },
    [echouerSiDemande, notes, maj, utilisateur],
  )

  const supprimerNote = useCallback<Ctx['supprimerNote']>(
    async (id) => {
      const cible = notes.find((n) => n.id === id)
      if (cible && cible.statut !== 'brouillon') throw new Error('Seul un brouillon peut être supprimé.')
      await echouerSiDemande()
      setNotes((l) => l.filter((n) => n.id !== id))
    },
    [echouerSiDemande, notes],
  )

  const soumettre = useCallback<Ctx['soumettre']>(
    async (id) => {
      const cible = notes.find((n) => n.id === id)
      if (!cible) throw new Error('Note introuvable.')
      const nature = naturesInitiales.find((n) => n.id === cible.natureId)
      if (nature?.justificatifObligatoire && !cible.justificatif) {
        throw new Error(`Un justificatif est obligatoire pour la nature « ${nature.nom} ». Joignez la pièce avant de soumettre.`)
      }
      await echouerSiDemande()
      maj(id, (n) => ({
        ...n,
        statut: 'soumise',
        soumiseLe: new Date().toISOString(),
        rejeteeLe: null,
        rejeteePar: '',
        rejeteeA: null,
        motifRejet: '',
        historique: [ev(utilisateur.nom, 'Note soumise', 'Transmise au responsable pour validation.'), ...n.historique],
      }))
    },
    [echouerSiDemande, notes, maj, utilisateur],
  )

  const validerResponsable = useCallback<Ctx['validerResponsable']>(
    async (id) => {
      const cible = notes.find((n) => n.id === id)
      if (cible?.statut !== 'soumise') throw new Error('Cette note n’est pas en attente de validation par le responsable.')
      await echouerSiDemande()
      maj(id, (n) => ({
        ...n,
        statut: 'validee_responsable',
        valideeResponsableLe: new Date().toISOString(),
        valideeResponsablePar: 'Awa Diallo',
        historique: [ev('Awa Diallo', 'Validée par le responsable', 'Dépense jugée opportune.', 'success'), ...n.historique],
      }))
    },
    [echouerSiDemande, notes, maj],
  )

  const validerTresorier = useCallback<Ctx['validerTresorier']>(
    async (id) => {
      const cible = notes.find((n) => n.id === id)
      if (cible?.statut !== 'validee_responsable') throw new Error('Cette note n’est pas en attente de validation par le trésorier.')
      if (!cible.justificatif) throw new Error('Le trésorier ne peut pas valider une note sans justificatif.')
      await echouerSiDemande()
      maj(id, (n) => ({
        ...n,
        statut: 'validee',
        valideeTresorierLe: new Date().toISOString(),
        valideeTresorierPar: 'Yanis Traoré',
        historique: [ev('Yanis Traoré', 'Validée par le trésorier', 'Justificatif et imputation vérifiés.', 'success'), ...n.historique],
      }))
    },
    [echouerSiDemande, notes, maj],
  )

  const rejeter = useCallback<Ctx['rejeter']>(
    async (id, motif, etape) => {
      if (!motif.trim()) throw new Error('Un motif de rejet est obligatoire : le demandeur doit savoir quoi corriger.')
      await echouerSiDemande()
      const auteur = etape === 'tresorier' ? 'Yanis Traoré' : 'Awa Diallo'
      maj(id, (n) => ({
        ...n,
        statut: 'rejetee',
        rejeteeLe: new Date().toISOString(),
        rejeteePar: auteur,
        rejeteeA: etape,
        motifRejet: motif,
        historique: [ev(auteur, `Rejetée par le ${etape === 'tresorier' ? 'trésorier' : 'responsable'}`, motif, 'danger'), ...n.historique],
      }))
    },
    [echouerSiDemande, maj],
  )

  const rembourser = useCallback<Ctx['rembourser']>(
    async (ids, reference) => {
      const cibles = notes.filter((n) => ids.includes(n.id))
      if (cibles.some((n) => n.statut !== 'validee')) {
        throw new Error('Seules les notes validées par le trésorier peuvent être remboursées.')
      }
      await echouerSiDemande()
      const maintenant = new Date().toISOString()
      setNotes((l) =>
        l.map((n) =>
          ids.includes(n.id)
            ? {
                ...n,
                statut: 'remboursee',
                rembourseeLe: maintenant,
                referenceRemboursement: reference || `VIR-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
                historique: [ev('Yanis Traoré', 'Remboursement effectué', `Virement de ${n.montantTTC} € au demandeur.`, 'success'), ...n.historique],
              }
            : n,
        ),
      )
    },
    [echouerSiDemande, notes],
  )

  const attacherJustificatif = useCallback<Ctx['attacherJustificatif']>(
    async (id, nom, scanne) => {
      await echouerSiDemande()
      maj(id, (n) => ({
        ...n,
        justificatif: nom,
        justificatifScanne: scanne,
        historique: [ev(utilisateur.nom, 'Justificatif ajouté', `${nom}${scanne ? ' — importé par scan' : ''}.`, 'success'), ...n.historique],
      }))
    },
    [echouerSiDemande, maj, utilisateur],
  )

  const value = useMemo<Ctx>(
    () => ({
      notes,
      natures: naturesInitiales,
      projets: projetsInitiaux,
      centres: centresCoutInitiaux,
      demandeurs: demandeursInitiaux,
      utilisateurId: utilisateur.id,
      chargement, erreur, mode, setMode, recharger,
      noteParId, natureParId, demandeurParId,
      creerNote, modifierNote, supprimerNote, soumettre, validerResponsable, validerTresorier, rejeter, rembourser,
      attacherJustificatif,
    }),
    [notes, utilisateur.id, chargement, erreur, mode, recharger, noteParId, natureParId, demandeurParId, creerNote, modifierNote, supprimerNote, soumettre, validerResponsable, validerTresorier, rejeter, rembourser, attacherJustificatif],
  )

  return <NotesFraisContext.Provider value={value}>{children}</NotesFraisContext.Provider>
}

export function useNotesFrais() {
  const ctx = useContext(NotesFraisContext)
  if (!ctx) throw new Error('useNotesFrais doit être utilisé dans NotesFraisProvider')
  return ctx
}
