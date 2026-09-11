export const AUJOURDHUI_NDF = new Date('2026-09-02T00:00:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type StatutNote =
  | 'brouillon'
  | 'soumise'
  | 'validee_responsable'
  | 'validee'
  | 'rejetee'
  | 'remboursee'

export const statutNoteLabels: Record<StatutNote, string> = {
  brouillon: 'Brouillon',
  soumise: 'En attente du responsable',
  validee_responsable: 'En attente du trésorier',
  validee: 'Validée, à rembourser',
  rejetee: 'Rejetée',
  remboursee: 'Remboursée',
}

/** Les cinq étapes du circuit, dans l'ordre. Sert au stepper. */
export const ETAPES_WORKFLOW = [
  { id: 'redaction', label: 'Rédaction', description: 'La note est saisie par le demandeur.' },
  { id: 'soumission', label: 'Soumission', description: 'Le demandeur transmet la note pour validation.' },
  { id: 'responsable', label: 'Validation responsable', description: 'Contrôle de l’opportunité de la dépense.' },
  { id: 'tresorier', label: 'Validation trésorier', description: 'Contrôle du justificatif et de l’imputation.' },
  { id: 'remboursement', label: 'Remboursement', description: 'Virement au demandeur et clôture.' },
] as const

/** Rang de l'étape en cours, de 1 à 5. */
export function etapeCourante(n: NoteFrais): number {
  switch (n.statut) {
    case 'brouillon':
      return 1
    case 'soumise':
      return 3
    case 'validee_responsable':
      return 4
    case 'validee':
      return 5
    case 'remboursee':
      return 6
    case 'rejetee':
      return n.rejeteeA === 'tresorier' ? 4 : 3
  }
}

export type MoyenPaiementNdf = 'personnel' | 'carte_association' | 'especes'

export const moyenNdfLabels: Record<MoyenPaiementNdf, string> = {
  personnel: 'Avance personnelle',
  carte_association: 'Carte de l’association',
  especes: 'Espèces de la caisse',
}

export type Nature = {
  id: string
  nom: string
  compteComptable: string
  plafond: number | null
  tvaRecuperable: boolean
  justificatifObligatoire: boolean
}

export type Projet = { id: string; nom: string; code: string; actif: boolean }
export type CentreCout = { id: string; nom: string; code: string }

export type Demandeur = { id: string; nom: string; role: string; iban: string }

export type EvenementNote = {
  id: string
  quand: string
  auteur: string
  libelle: string
  detail?: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

export type NoteFrais = {
  id: string
  numero: string
  demandeurId: string
  dateDepense: string
  natureId: string
  libelle: string
  montantTTC: number
  tva: number
  moyenPaiement: MoyenPaiementNdf
  projetId: string | null
  centreCoutId: string | null
  /** Nom du fichier déposé, ou null si le justificatif manque. */
  justificatif: string | null
  justificatifScanne: boolean
  commentaire: string
  statut: StatutNote
  soumiseLe: string | null
  valideeResponsableLe: string | null
  valideeResponsablePar: string
  valideeTresorierLe: string | null
  valideeTresorierPar: string
  rejeteeLe: string | null
  rejeteePar: string
  rejeteeA: 'responsable' | 'tresorier' | null
  motifRejet: string
  rembourseeLe: string | null
  referenceRemboursement: string
  historique: EvenementNote[]
}

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

export const naturesInitiales: Nature[] = [
  { id: 'na-transport', nom: 'Transport', compteComptable: '625100', plafond: null, tvaRecuperable: false, justificatifObligatoire: true },
  { id: 'na-carburant', nom: 'Carburant et péage', compteComptable: '625110', plafond: 120, tvaRecuperable: true, justificatifObligatoire: true },
  { id: 'na-repas', nom: 'Repas', compteComptable: '625600', plafond: 25, tvaRecuperable: false, justificatifObligatoire: true },
  { id: 'na-hebergement', nom: 'Hébergement', compteComptable: '625700', plafond: 90, tvaRecuperable: true, justificatifObligatoire: true },
  { id: 'na-fournitures', nom: 'Petites fournitures', compteComptable: '606400', plafond: 150, tvaRecuperable: true, justificatifObligatoire: true },
  { id: 'na-materiel', nom: 'Matériel d’atelier', compteComptable: '606300', plafond: 300, tvaRecuperable: true, justificatifObligatoire: true },
  { id: 'na-poste', nom: 'Frais postaux', compteComptable: '626100', plafond: 50, tvaRecuperable: false, justificatifObligatoire: false },
  { id: 'na-divers', nom: 'Divers', compteComptable: '658000', plafond: 80, tvaRecuperable: false, justificatifObligatoire: true },
]

export const projetsInitiaux: Projet[] = [
  { id: 'pj-festival', nom: 'Festival du Vieux Moulin', code: 'FEST26', actif: true },
  { id: 'pj-ateliers', nom: 'Ateliers jeunesse', code: 'JEUN26', actif: true },
  { id: 'pj-theatre', nom: 'Section théâtre', code: 'THEA26', actif: true },
  { id: 'pj-rando', nom: 'Section randonnée', code: 'RAND26', actif: true },
  { id: 'pj-siege', nom: 'Fonctionnement général', code: 'GEN26', actif: true },
]

export const centresCoutInitiaux: CentreCout[] = [
  { id: 'cc-admin', nom: 'Administration', code: 'ADM' },
  { id: 'cc-anim', nom: 'Animation', code: 'ANI' },
  { id: 'cc-tech', nom: 'Technique et logistique', code: 'TEC' },
  { id: 'cc-com', nom: 'Communication', code: 'COM' },
]

export const demandeursInitiaux: Demandeur[] = [
  { id: 'dm-camille', nom: 'Camille Beauchamp', role: 'Administratrice', iban: 'FR76 3000 1007 9400 0011 2233 445' },
  { id: 'dm-yanis', nom: 'Yanis Traoré', role: 'Trésorier', iban: 'FR76 3000 1007 9400 0055 6677 889' },
  { id: 'dm-awa', nom: 'Awa Diallo', role: 'Responsable de section', iban: 'FR76 1558 9339 1100 0099 8877 661' },
  { id: 'dm-hugo', nom: 'Hugo Fournier', role: 'Bénévole', iban: 'FR76 3000 1007 9400 0033 4455 662' },
  { id: 'dm-elodie', nom: 'Élodie Nguyen', role: 'Chargée de communication', iban: 'FR76 1027 8390 1100 0044 5566 773' },
  { id: 'dm-malik', nom: 'Malik Benali', role: 'Animateur', iban: 'FR76 3000 1007 9400 0077 8899 004' },
]

/** L'utilisateur connecté, pour l'écran « Mes notes de frais ». */
export const UTILISATEUR_NDF = 'dm-camille'

/* ------------------------------------------------------------------ */
/* Génération                                                          */
/* ------------------------------------------------------------------ */

const libelles: Record<string, string[]> = {
  'na-transport': ['Billet de train Nantes–Rennes', 'Abonnement transports pour les ateliers', 'Trajet en tramway — réunion partenaires'],
  'na-carburant': ['Carburant — transport du matériel', 'Péage A11 aller-retour Angers', 'Plein pour la sortie randonnée'],
  'na-repas': ['Repas lors de la réunion de bureau', 'Déjeuner avec le partenaire municipal', 'Repas des encadrants du stage'],
  'na-hebergement': ['Nuitée à Rennes — congrès des associations', 'Hébergement du festival — intervenant'],
  'na-fournitures': ['Papeterie pour l’accueil', 'Cartouches d’encre', 'Classeurs et archivage'],
  'na-materiel': ['Rallonges et multiprises', 'Peinture pour le décor', 'Câbles audio de rechange'],
  'na-poste': ['Timbres pour les convocations', 'Envoi recommandé — préfecture'],
  'na-divers': ['Achat de boissons pour l’assemblée générale', 'Frais de parking — livraison'],
}

const montants: Record<string, number> = {
  'na-transport': 48, 'na-carburant': 62, 'na-repas': 19, 'na-hebergement': 78,
  'na-fournitures': 43, 'na-materiel': 87, 'na-poste': 22, 'na-divers': 34,
}

function pick<T>(a: T[], i: number): T {
  return a[((i % a.length) + a.length) % a.length]
}

function jour(base: Date, d: number) {
  return new Date(base.getTime() + d * 86400000).toISOString()
}

const arrondi = (n: number) => Math.round(n * 100) / 100

function creerNote(i: number): NoteFrais {
  const nature = pick(naturesInitiales, i * 3 + 1)
  const demandeur = pick(demandeursInitiaux, i * 5)
  const libelle = pick(libelles[nature.id], i)
  const dateDepense = jour(AUJOURDHUI_NDF, -(3 + ((i * 11) % 200)))
  const montantTTC = arrondi(montants[nature.id] * (1 + (((i * 17) % 41) - 20) / 100))
  const tva = nature.tvaRecuperable ? arrondi((montantTTC / 1.2) * 0.2) : 0

  // Statut réparti sur tout le circuit
  const r = i % 12
  let statut: StatutNote
  if (r === 0) statut = 'brouillon'
  else if (r === 1 || r === 2) statut = 'soumise'
  else if (r === 3) statut = 'validee_responsable'
  else if (r === 4) statut = 'validee'
  else if (r === 5) statut = 'rejetee'
  else statut = 'remboursee'

  // Seuls des brouillons peuvent rester sans justificatif : une note soumise en porte toujours un
  const justificatifManquant = statut === 'brouillon' && i % 24 === 0
  const justificatif = justificatifManquant ? null : `justificatif-${String(100 + i)}.jpg`

  const soumiseLe = statut === 'brouillon' ? null : jour(new Date(dateDepense), 2)
  const rejeteeA: NoteFrais['rejeteeA'] = statut === 'rejetee' ? (i % 24 === 5 ? 'tresorier' : 'responsable') : null
  const valideeResponsableLe =
    statut === 'validee_responsable' || statut === 'validee' || statut === 'remboursee' || rejeteeA === 'tresorier'
      ? jour(new Date(dateDepense), 5)
      : null
  const valideeTresorierLe = statut === 'validee' || statut === 'remboursee' ? jour(new Date(dateDepense), 8) : null
  const rembourseeLe = statut === 'remboursee' ? jour(new Date(dateDepense), 14) : null
  const rejeteeLe = statut === 'rejetee' ? jour(new Date(dateDepense), rejeteeA === 'tresorier' ? 7 : 4) : null

  const motifs = [
    'Justificatif illisible : merci de joindre une photo nette du ticket.',
    'Dépense hors budget du projet. À représenter après accord du bureau.',
    'Le plafond de la nature de frais est dépassé sans validation préalable.',
    'Le repas relève du budget de fonctionnement, pas du projet festival.',
  ]

  const historique: EvenementNote[] = [
    { id: `en-${i}-1`, quand: dateDepense, auteur: demandeur.nom, libelle: 'Note créée', detail: `${libelle} — ${montantTTC} € TTC.`, tone: 'neutral' },
  ]
  if (soumiseLe) historique.push({ id: `en-${i}-2`, quand: soumiseLe, auteur: demandeur.nom, libelle: 'Note soumise', detail: 'Transmise au responsable pour validation.', tone: 'neutral' })
  if (valideeResponsableLe) historique.push({ id: `en-${i}-3`, quand: valideeResponsableLe, auteur: 'Awa Diallo', libelle: 'Validée par le responsable', detail: 'Dépense jugée opportune.', tone: 'success' })
  if (valideeTresorierLe) historique.push({ id: `en-${i}-4`, quand: valideeTresorierLe, auteur: 'Yanis Traoré', libelle: 'Validée par le trésorier', detail: 'Justificatif et imputation vérifiés.', tone: 'success' })
  if (rejeteeLe) historique.push({ id: `en-${i}-5`, quand: rejeteeLe, auteur: rejeteeA === 'tresorier' ? 'Yanis Traoré' : 'Awa Diallo', libelle: `Rejetée par le ${rejeteeA === 'tresorier' ? 'trésorier' : 'responsable'}`, detail: pick(motifs, i), tone: 'danger' })
  if (rembourseeLe) historique.push({ id: `en-${i}-6`, quand: rembourseeLe, auteur: 'Yanis Traoré', libelle: 'Remboursement effectué', detail: `Virement de ${montantTTC} € au demandeur.`, tone: 'success' })

  return {
    id: `ndf-${100 + i}`,
    numero: `NDF-${new Date(dateDepense).getUTCFullYear()}-${String(100 + i)}`,
    demandeurId: demandeur.id,
    dateDepense,
    natureId: nature.id,
    libelle,
    montantTTC,
    tva,
    moyenPaiement: pick(['personnel', 'personnel', 'carte_association', 'especes'] as MoyenPaiementNdf[], i),
    projetId: pick(projetsInitiaux, i * 2).id,
    centreCoutId: pick(centresCoutInitiaux, i * 3).id,
    justificatif,
    justificatifScanne: !justificatifManquant && i % 3 === 0,
    commentaire: i % 5 === 0 ? 'Déplacement validé oralement en réunion de bureau.' : '',
    statut,
    soumiseLe,
    valideeResponsableLe,
    valideeResponsablePar: valideeResponsableLe ? 'Awa Diallo' : '',
    valideeTresorierLe,
    valideeTresorierPar: valideeTresorierLe ? 'Yanis Traoré' : '',
    rejeteeLe,
    rejeteePar: rejeteeLe ? (rejeteeA === 'tresorier' ? 'Yanis Traoré' : 'Awa Diallo') : '',
    rejeteeA,
    motifRejet: rejeteeLe ? pick(motifs, i) : '',
    rembourseeLe,
    referenceRemboursement: rembourseeLe ? `VIR-2026-${String(700 + i)}` : '',
    historique: historique.sort((a, b) => (a.quand < b.quand ? 1 : -1)),
  }
}

export const notesInitiales: NoteFrais[] = Array.from({ length: 38 }, (_, i) => creerNote(i)).sort((a, b) =>
  a.dateDepense < b.dateDepense ? 1 : -1,
)

/**
 * Variante de démonstration : des notes engagées dans le circuit sans justificatif.
 * Le trésorier ne peut pas les valider, ce qui rend l'état visible.
 */
export function notesSansJustificatif(): NoteFrais[] {
  let retirees = 0
  return notesInitiales.map((n) => {
    if (retirees < 4 && n.statut !== 'brouillon' && n.justificatif) {
      retirees++
      return { ...n, justificatif: null, justificatifScanne: false }
    }
    return n
  })
}

/* ------------------------------------------------------------------ */
/* Calculs                                                             */
/* ------------------------------------------------------------------ */

export type KpisNdf = {
  total: number
  aValider: number
  montantAValider: number
  validees: number
  montantARembourser: number
  rejetees: number
  remboursees: number
  montantRembourse: number
  sansJustificatif: number
  delaiMoyen: number
}

export function calculerKpisNdf(notes: NoteFrais[]): KpisNdf {
  const aValider = notes.filter((n) => n.statut === 'soumise' || n.statut === 'validee_responsable')
  const validees = notes.filter((n) => n.statut === 'validee')
  const remboursees = notes.filter((n) => n.statut === 'remboursee')

  const delais = remboursees
    .filter((n) => n.soumiseLe && n.rembourseeLe)
    .map((n) => Math.round((new Date(n.rembourseeLe!).getTime() - new Date(n.soumiseLe!).getTime()) / 86400000))

  return {
    total: notes.length,
    aValider: aValider.length,
    montantAValider: arrondi(aValider.reduce((s, n) => s + n.montantTTC, 0)),
    validees: validees.length,
    montantARembourser: arrondi(validees.reduce((s, n) => s + n.montantTTC, 0)),
    rejetees: notes.filter((n) => n.statut === 'rejetee').length,
    remboursees: remboursees.length,
    montantRembourse: arrondi(remboursees.reduce((s, n) => s + n.montantTTC, 0)),
    sansJustificatif: notes.filter((n) => !n.justificatif && n.statut !== 'brouillon').length,
    delaiMoyen: delais.length === 0 ? 0 : Math.round(delais.reduce((s, d) => s + d, 0) / delais.length),
  }
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function serieNotesParMois(notes: NoteFrais[]) {
  const points: { label: string; valeur: number }[] = []
  for (let k = 7; k >= 0; k--) {
    const debut = new Date(Date.UTC(AUJOURDHUI_NDF.getUTCFullYear(), AUJOURDHUI_NDF.getUTCMonth() - k, 1))
    const fin = new Date(Date.UTC(AUJOURDHUI_NDF.getUTCFullYear(), AUJOURDHUI_NDF.getUTCMonth() - k + 1, 0, 23, 59))
    const valeur = notes
      .filter((n) => {
        const t = new Date(n.dateDepense).getTime()
        return t >= debut.getTime() && t <= fin.getTime()
      })
      .reduce((s, n) => s + n.montantTTC, 0)
    points.push({ label: `${MOIS[debut.getUTCMonth()]} ${String(debut.getUTCFullYear()).slice(2)}`, valeur: Math.round(valeur) })
  }
  return points
}

export function repartitionParNature(notes: NoteFrais[], natures: Nature[]) {
  const m = new Map<string, number>()
  for (const n of notes) {
    if (n.statut === 'rejetee' || n.statut === 'brouillon') continue
    m.set(n.natureId, arrondi((m.get(n.natureId) ?? 0) + n.montantTTC))
  }
  return Array.from(m.entries())
    .map(([id, valeur]) => ({ label: natures.find((x) => x.id === id)?.nom ?? id, valeur: Math.round(valeur) }))
    .sort((a, b) => b.valeur - a.valeur)
}

export function repartitionParProjet(notes: NoteFrais[], projets: Projet[]) {
  const m = new Map<string, number>()
  for (const n of notes) {
    if (n.statut === 'rejetee' || n.statut === 'brouillon' || !n.projetId) continue
    m.set(n.projetId, arrondi((m.get(n.projetId) ?? 0) + n.montantTTC))
  }
  return Array.from(m.entries())
    .map(([id, valeur]) => ({ label: projets.find((p) => p.id === id)?.nom ?? id, valeur: Math.round(valeur) }))
    .sort((a, b) => b.valeur - a.valeur)
}

/** Vrai si la note dépasse le plafond de sa nature de frais. */
export function depassePlafond(n: NoteFrais, natures: Nature[]) {
  const nature = natures.find((x) => x.id === n.natureId)
  return !!nature?.plafond && n.montantTTC > nature.plafond
}
