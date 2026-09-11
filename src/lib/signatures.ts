export const AUJOURDHUI_SIGN = new Date('2026-09-03T00:00:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type StatutDemande = 'brouillon' | 'en_attente' | 'terminee' | 'refusee' | 'expiree' | 'annulee'

export const statutDemandeLabels: Record<StatutDemande, string> = {
  brouillon: 'Brouillon',
  en_attente: 'En attente de signature',
  terminee: 'Signée par tous',
  refusee: 'Refusée',
  expiree: 'Expirée',
  annulee: 'Annulée',
}

export type StatutSignataire = 'attente' | 'signe' | 'refuse'

export type Signataire = {
  id: string
  nom: string
  email: string
  role: string
  /** Ordre de passage : 1 signe avant 2. */
  ordre: number
  statut: StatutSignataire
  signeLe: string | null
  motifRefus: string
  /** Vrai pour l'utilisateur connecté : la demande apparaît alors dans « À signer ». */
  estMoi: boolean
}

export type TypeChamp = 'signature' | 'initiales' | 'nom' | 'date' | 'texte' | 'case'

export const champLabels: Record<TypeChamp, string> = {
  signature: 'Signature',
  initiales: 'Initiales',
  nom: 'Nom',
  date: 'Date',
  texte: 'Texte libre',
  case: 'Case à cocher',
}

/** Dimensions par défaut, exprimées en pourcentage de la largeur et de la hauteur de page. */
export const champTailles: Record<TypeChamp, { largeur: number; hauteur: number }> = {
  signature: { largeur: 24, hauteur: 8 },
  initiales: { largeur: 10, hauteur: 6 },
  nom: { largeur: 22, hauteur: 4.5 },
  date: { largeur: 16, hauteur: 4.5 },
  texte: { largeur: 26, hauteur: 4.5 },
  case: { largeur: 4, hauteur: 3 },
}

export type Champ = {
  id: string
  type: TypeChamp
  signataireId: string
  page: number
  /** Position du coin supérieur gauche, en pourcentage de la page. */
  x: number
  y: number
  largeur: number
  hauteur: number
  obligatoire: boolean
  libelle: string
}

export type EvenementSignature = {
  id: string
  quand: string
  auteur: string
  libelle: string
  detail?: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

export type DemandeSignature = {
  id: string
  reference: string
  titre: string
  documentNom: string
  documentId: string | null
  pages: number
  message: string
  createurNom: string
  creeLe: string
  envoyeeLe: string | null
  echeanceLe: string
  statut: StatutDemande
  signataires: Signataire[]
  champs: Champ[]
  historique: EvenementSignature[]
  /** Nom du fichier produit une fois toutes les signatures recueillies. */
  fichierSigne: string | null
}

/* ------------------------------------------------------------------ */
/* Calculs                                                             */
/* ------------------------------------------------------------------ */

export function joursAvantEcheance(d: DemandeSignature) {
  return Math.round((new Date(d.echeanceLe).getTime() - AUJOURDHUI_SIGN.getTime()) / 86400000)
}

/** Le statut « expirée » se déduit de l'échéance : il n'est jamais stocké. */
export function statutDemande(d: DemandeSignature): StatutDemande {
  if (d.statut === 'brouillon' || d.statut === 'refusee' || d.statut === 'annulee' || d.statut === 'terminee') return d.statut
  if (d.signataires.every((s) => s.statut === 'signe')) return 'terminee'
  if (d.signataires.some((s) => s.statut === 'refuse')) return 'refusee'
  if (joursAvantEcheance(d) < 0) return 'expiree'
  return 'en_attente'
}

export function progression(d: DemandeSignature) {
  const total = d.signataires.length
  const signes = d.signataires.filter((s) => s.statut === 'signe').length
  return { signes, total, pourcentage: total === 0 ? 0 : Math.round((signes / total) * 100) }
}

/** Signataire dont c'est le tour, selon l'ordre de passage. */
export function signataireCourant(d: DemandeSignature) {
  return [...d.signataires].sort((a, b) => a.ordre - b.ordre).find((s) => s.statut === 'attente')
}

export function maSignatureAttendue(d: DemandeSignature) {
  const courant = signataireCourant(d)
  return !!courant?.estMoi && statutDemande(d) === 'en_attente'
}

/* ------------------------------------------------------------------ */
/* Données mockées                                                     */
/* ------------------------------------------------------------------ */

export const MOI = { nom: 'Camille Beauchamp', email: 'camille.beauchamp@vieuxmoulin.fr' }

const personnes = [
  { nom: 'Yanis Traoré', email: 'yanis.traore@vieuxmoulin.fr', role: 'Trésorier' },
  { nom: 'Awa Diallo', email: 'awa.diallo@vieuxmoulin.fr', role: 'Responsable de section' },
  { nom: 'Élodie Nguyen', email: 'elodie.nguyen@vieuxmoulin.fr', role: 'Chargée de communication' },
  { nom: 'Hugo Fournier', email: 'hugo.fournier@exemple.fr', role: 'Bénévole' },
  { nom: 'Marie Lemoine', email: 'm.lemoine@exemple-cgo.fr', role: 'Coopérative Grand Ouest' },
  { nom: 'Service vie associative', email: 'vie.associative@exemple-nantes.fr', role: 'Ville de Nantes' },
  { nom: 'Manon Cottereau', email: 'production@exemple-grandvent.fr', role: 'Compagnie du Grand Vent' },
  { nom: 'Malik Benali', email: 'malik.benali@vieuxmoulin.fr', role: 'Animateur' },
]

function jour(d: number) {
  return new Date(AUJOURDHUI_SIGN.getTime() + d * 86400000).toISOString()
}

function pick<T>(a: T[], i: number): T {
  return a[((i % a.length) + a.length) % a.length]
}

type ModeleDemande = {
  titre: string
  document: string
  pages: number
  message: string
  signataires: { index: number | 'moi'; ordre: number }[]
  /** État visé, avant recalcul par statutDemande. */
  cas: 'terminee' | 'attente_moi' | 'attente_autre' | 'refusee' | 'expiree' | 'brouillon'
  jourCreation: number
  echeance: number
}

const modelesDemandes: ModeleDemande[] = [
  { titre: 'Convention pluriannuelle d’objectifs', document: 'Convention pluriannuelle d’objectifs.pdf', pages: 6, message: 'Merci de signer la convention avant la fin du mois. Le versement de la subvention en dépend.', signataires: [{ index: 'moi', ordre: 1 }, { index: 5, ordre: 2 }], cas: 'attente_moi', jourCreation: -6, echeance: 18 },
  { titre: 'Contrat de cession — Compagnie du Grand Vent', document: 'Contrat de cession — compagnie.pdf', pages: 4, message: 'Contrat pour la représentation du 14 novembre. Deux exemplaires à parapher.', signataires: [{ index: 6, ordre: 1 }, { index: 'moi', ordre: 2 }], cas: 'attente_autre', jourCreation: -4, echeance: 21 },
  { titre: 'PV de l’assemblée générale 2026', document: 'PV assemblée générale 2026.pdf', pages: 8, message: 'Procès-verbal soumis à la signature du président et du secrétaire.', signataires: [{ index: 'moi', ordre: 1 }, { index: 0, ordre: 2 }], cas: 'terminee', jourCreation: -48, echeance: -20 },
  { titre: 'Contrat de travail — animateur', document: 'Contrat de travail — animateur.pdf', pages: 5, message: 'Contrat à durée déterminée, prise de poste au 1ᵉʳ octobre.', signataires: [{ index: 7, ordre: 1 }, { index: 'moi', ordre: 2 }], cas: 'attente_moi', jourCreation: -2, echeance: 12 },
  { titre: 'Autorisation parentale — atelier peinture', document: 'Autorisation parentale — modèle.docx', pages: 1, message: 'À retourner signée avant le premier atelier.', signataires: [{ index: 3, ordre: 1 }], cas: 'refusee', jourCreation: -14, echeance: 7 },
  { titre: 'Avenant au contrat d’assurance', document: 'Contrat multirisque associations.pdf', pages: 3, message: 'Avenant portant sur la couverture des événements extérieurs.', signataires: [{ index: 0, ordre: 1 }, { index: 'moi', ordre: 2 }], cas: 'attente_moi', jourCreation: -20, echeance: 15 },
  { titre: 'Demande de subvention 2026 — dossier signé', document: 'Demande de subvention 2026.pdf', pages: 12, message: 'Dossier complet à signer par le président avant dépôt.', signataires: [{ index: 'moi', ordre: 1 }], cas: 'terminee', jourCreation: -95, echeance: -70 },
  { titre: 'Charte du bénévole 2026-2027', document: 'Charte du bénévole.pdf', pages: 2, message: 'Charte à signer par les nouveaux bénévoles de la saison.', signataires: [{ index: 3, ordre: 1 }, { index: 1, ordre: 2 }, { index: 2, ordre: 3 }], cas: 'attente_autre', jourCreation: -9, echeance: 25 },
  { titre: 'Convention de mise à disposition de salle', document: 'Convention salle municipale.pdf', pages: 3, message: 'Mise à disposition de la grande salle pour la saison.', signataires: [{ index: 5, ordre: 1 }, { index: 'moi', ordre: 2 }], cas: 'terminee', jourCreation: -120, echeance: -95 },
  { titre: 'Contrat de partenariat — Coopérative Grand Ouest', document: 'Contrat partenariat CGO.pdf', pages: 4, message: 'Partenariat de saison, encart publicitaire et visibilité.', signataires: [{ index: 4, ordre: 1 }, { index: 'moi', ordre: 2 }], cas: 'attente_autre', jourCreation: -11, echeance: 4 },
  { titre: 'Règlement intérieur révisé', document: 'Règlement intérieur.pdf', pages: 5, message: 'Version adoptée en conseil d’administration, en attente de signature.', signataires: [{ index: 'moi', ordre: 1 }, { index: 0, ordre: 2 }, { index: 1, ordre: 3 }], cas: 'brouillon', jourCreation: -1, echeance: 30 },
]

let seq = 0

function champsPour(demande: Pick<DemandeSignature, 'pages'>, signataires: Signataire[]): Champ[] {
  const out: Champ[] = []
  signataires.forEach((s, i) => {
    const yBase = 62 + i * 14
    out.push({
      id: `ch-${++seq}`,
      type: 'signature',
      signataireId: s.id,
      page: demande.pages,
      x: i % 2 === 0 ? 12 : 56,
      y: yBase,
      largeur: champTailles.signature.largeur,
      hauteur: champTailles.signature.hauteur,
      obligatoire: true,
      libelle: `Signature de ${s.nom}`,
    })
    out.push({
      id: `ch-${++seq}`,
      type: 'nom',
      signataireId: s.id,
      page: demande.pages,
      x: i % 2 === 0 ? 12 : 56,
      y: yBase - 6,
      largeur: champTailles.nom.largeur,
      hauteur: champTailles.nom.hauteur,
      obligatoire: true,
      libelle: 'Nom et qualité',
    })
    out.push({
      id: `ch-${++seq}`,
      type: 'date',
      signataireId: s.id,
      page: demande.pages,
      x: i % 2 === 0 ? 38 : 82,
      y: yBase,
      largeur: champTailles.date.largeur,
      hauteur: champTailles.date.hauteur,
      obligatoire: true,
      libelle: 'Date de signature',
    })
    if (demande.pages > 2) {
      out.push({
        id: `ch-${++seq}`,
        type: 'initiales',
        signataireId: s.id,
        page: 2,
        x: 82 - i * 12,
        y: 90,
        largeur: champTailles.initiales.largeur,
        hauteur: champTailles.initiales.hauteur,
        obligatoire: false,
        libelle: 'Paraphe de page',
      })
    }
  })
  return out
}

function creerDemande(m: ModeleDemande, i: number): DemandeSignature {
  const creeLe = jour(m.jourCreation)
  const signataires: Signataire[] = m.signataires.map((s, k) => {
    const base = s.index === 'moi' ? { ...MOI, role: 'Présidente' } : pick(personnes, s.index as number)
    return {
      id: `sg-${i}-${k}`,
      nom: base.nom,
      email: base.email,
      role: base.role,
      ordre: s.ordre,
      statut: 'attente',
      signeLe: null,
      motifRefus: '',
      estMoi: s.index === 'moi',
    }
  })

  // On applique le cas visé sur les signataires
  if (m.cas === 'terminee') {
    signataires.forEach((s, k) => {
      s.statut = 'signe'
      s.signeLe = jour(m.jourCreation + 2 + k * 2)
    })
  } else if (m.cas === 'attente_moi') {
    signataires.filter((s) => !s.estMoi && s.ordre < (signataires.find((x) => x.estMoi)?.ordre ?? 99)).forEach((s, k) => {
      s.statut = 'signe'
      s.signeLe = jour(m.jourCreation + 1 + k)
    })
  } else if (m.cas === 'attente_autre') {
    signataires.filter((s) => s.ordre === 1 && s.estMoi).forEach((s) => {
      s.statut = 'signe'
      s.signeLe = jour(m.jourCreation + 1)
    })
  } else if (m.cas === 'refusee') {
    signataires[0].statut = 'refuse'
    signataires[0].signeLe = jour(m.jourCreation + 3)
    signataires[0].motifRefus = 'Le nom de l’enfant est erroné sur le document. Merci de corriger avant renvoi.'
  } else if (m.cas === 'expiree') {
    signataires[0].statut = 'signe'
    signataires[0].signeLe = jour(m.jourCreation + 4)
  }

  const statut: StatutDemande = m.cas === 'brouillon' ? 'brouillon' : m.cas === 'terminee' ? 'terminee' : m.cas === 'refusee' ? 'refusee' : 'en_attente'
  const envoyeeLe = m.cas === 'brouillon' ? null : jour(m.jourCreation)

  const historique: EvenementSignature[] = [
    { id: `es-${i}-1`, quand: creeLe, auteur: MOI.nom, libelle: 'Demande créée', detail: `${m.document} — ${m.pages} page(s), ${signataires.length} signataire(s).`, tone: 'neutral' },
  ]
  if (envoyeeLe) {
    historique.push({ id: `es-${i}-2`, quand: envoyeeLe, auteur: MOI.nom, libelle: 'Demande envoyée', detail: `Invitations transmises à ${signataires.map((s) => s.email).join(', ')}.`, tone: 'neutral' })
  }
  for (const s of signataires) {
    if (s.statut === 'signe' && s.signeLe) {
      historique.push({ id: `es-${i}-s-${s.id}`, quand: s.signeLe, auteur: s.nom, libelle: 'Document signé', detail: `Signature recueillie, position ${s.ordre} sur ${signataires.length}.`, tone: 'success' })
    }
    if (s.statut === 'refuse' && s.signeLe) {
      historique.push({ id: `es-${i}-r-${s.id}`, quand: s.signeLe, auteur: s.nom, libelle: 'Signature refusée', detail: s.motifRefus, tone: 'danger' })
    }
  }
  if (m.cas === 'terminee') {
    historique.push({ id: `es-${i}-f`, quand: jour(m.jourCreation + 2 + signataires.length * 2), auteur: 'AssoConnex', libelle: 'Document signé généré', detail: 'Le fichier scellé est disponible au téléchargement.', tone: 'success' })
  }

  const demandePartielle = { pages: m.pages }

  return {
    id: `sig-${100 + i}`,
    reference: `SIG-2026-${String(100 + i)}`,
    titre: m.titre,
    documentNom: m.document,
    documentId: null,
    pages: m.pages,
    message: m.message,
    createurNom: MOI.nom,
    creeLe,
    envoyeeLe,
    echeanceLe: jour(m.echeance),
    statut,
    signataires,
    champs: champsPour(demandePartielle, signataires),
    historique: historique.sort((a, b) => (a.quand < b.quand ? 1 : -1)),
    fichierSigne: m.cas === 'terminee' ? m.document.replace(/\.\w+$/, '-signe.pdf') : null,
  }
}

export const demandesInitiales: DemandeSignature[] = modelesDemandes
  .map((m, i) => creerDemande(m, i))
  .sort((a, b) => (a.creeLe < b.creeLe ? 1 : -1))

/**
 * Variante de démonstration : une demande dont l'échéance est dépassée sans que
 * tous les signataires aient répondu. Le statut « expirée » se recalcule seul.
 */
export function demandesAvecExpiration(): DemandeSignature[] {
  return demandesInitiales.map((d) =>
    d.titre === 'Avenant au contrat d’assurance' ? { ...d, echeanceLe: jour(-9), creeLe: jour(-60) } : d,
  )
}

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpisSign = {
  total: number
  aSigner: number
  enAttente: number
  terminees: number
  refusees: number
  expirees: number
  brouillons: number
  delaiMoyen: number
  tauxAboutissement: number
}

export function calculerKpisSign(demandes: DemandeSignature[]): KpisSign {
  const statuts = demandes.map((d) => statutDemande(d))
  const terminees = demandes.filter((d) => statutDemande(d) === 'terminee')

  const delais = terminees
    .filter((d) => d.envoyeeLe)
    .map((d) => {
      const derniere = [...d.signataires].filter((s) => s.signeLe).sort((a, b) => (a.signeLe! < b.signeLe! ? 1 : -1))[0]
      if (!derniere?.signeLe) return null
      return Math.round((new Date(derniere.signeLe).getTime() - new Date(d.envoyeeLe!).getTime()) / 86400000)
    })
    .filter((x): x is number => x !== null && x >= 0)

  const envoyees = demandes.filter((d) => d.statut !== 'brouillon').length

  return {
    total: demandes.length,
    aSigner: demandes.filter((d) => maSignatureAttendue(d)).length,
    enAttente: statuts.filter((s) => s === 'en_attente').length,
    terminees: terminees.length,
    refusees: statuts.filter((s) => s === 'refusee').length,
    expirees: statuts.filter((s) => s === 'expiree').length,
    brouillons: statuts.filter((s) => s === 'brouillon').length,
    delaiMoyen: delais.length === 0 ? 0 : Math.round(delais.reduce((s, d) => s + d, 0) / delais.length),
    tauxAboutissement: envoyees === 0 ? 0 : Math.round((terminees.length / envoyees) * 100),
  }
}
