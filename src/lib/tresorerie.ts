export const AUJOURDHUI_TRESO = new Date('2026-09-02T00:00:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type TypeCompte = 'courant' | 'epargne' | 'caisse' | 'dedie'

export const typeCompteLabels: Record<TypeCompte, string> = {
  courant: 'Compte courant',
  epargne: 'Livret d’épargne',
  caisse: 'Caisse',
  dedie: 'Compte dédié',
}

export type CompteBancaire = {
  id: string
  nom: string
  type: TypeCompte
  banque: string
  iban: string
  bic: string
  soldeInitial: number
  compteComptable: string
  actif: boolean
  /** Découvert autorisé, en valeur absolue. */
  decouvertAutorise: number
}

export type SensMouvement = 'entree' | 'sortie'

export type Categorie = {
  id: string
  nom: string
  sens: SensMouvement
  compteComptable: string
  /** Mots-clés servant à la catégorisation automatique. */
  motsCles: string[]
  couleur: string
}

export type Mouvement = {
  id: string
  compteId: string
  date: string
  libelle: string
  tiers: string
  montant: number
  sens: SensMouvement
  categorieId: string | null
  reference: string
  rapproche: boolean
  /** Renseigné pour les deux faces d'un virement interne. */
  virementId: string | null
  note: string
}

export type StatutVirement = 'planifie' | 'execute' | 'annule'

export type Virement = {
  id: string
  compteSourceId: string
  compteDestinationId: string
  montant: number
  date: string
  motif: string
  statut: StatutVirement
  creePar: string
}

export type Fiabilite = 'confirmee' | 'probable'

export type Prevision = {
  id: string
  libelle: string
  tiers: string
  montant: number
  sens: SensMouvement
  dateAttendue: string
  categorieId: string | null
  fiabilite: Fiabilite
  origine: string
}

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

export const comptesInitiaux: CompteBancaire[] = [
  {
    id: 'cb-courant',
    nom: 'Compte courant associatif',
    type: 'courant',
    banque: 'Banque de l’Ouest',
    iban: 'FR76 3000 1007 9412 3456 7890 185',
    bic: 'BDOUFRPP',
    soldeInitial: 4200,
    compteComptable: '512000',
    actif: true,
    decouvertAutorise: 1000,
  },
  {
    id: 'cb-livret',
    nom: 'Livret associatif',
    type: 'epargne',
    banque: 'Banque de l’Ouest',
    iban: 'FR76 3000 1007 9498 7654 3210 442',
    bic: 'BDOUFRPP',
    soldeInitial: 12000,
    compteComptable: '512100',
    actif: true,
    decouvertAutorise: 0,
  },
  {
    id: 'cb-caisse',
    nom: 'Caisse',
    type: 'caisse',
    banque: '—',
    iban: '',
    bic: '',
    soldeInitial: 320,
    compteComptable: '530000',
    actif: true,
    decouvertAutorise: 0,
  },
  {
    id: 'cb-projet',
    nom: 'Compte dédié — festival',
    type: 'dedie',
    banque: 'Crédit Mutuel de Bretagne',
    iban: 'FR76 1558 9339 1100 0123 4567 891',
    bic: 'CMBRFR2B',
    soldeInitial: 1500,
    compteComptable: '512200',
    actif: true,
    decouvertAutorise: 0,
  },
]

export const categoriesInitiales: Categorie[] = [
  { id: 'ct-cotis', nom: 'Cotisations', sens: 'entree', compteComptable: '706000', motsCles: ['cotisation', 'adhesion'], couleur: '#2364AA' },
  { id: 'ct-subv', nom: 'Subventions', sens: 'entree', compteComptable: '740000', motsCles: ['subvention', 'ville', 'departement'], couleur: '#1D5391' },
  { id: 'ct-dons', nom: 'Dons', sens: 'entree', compteComptable: '754000', motsCles: ['don', 'mecenat'], couleur: '#5892C9' },
  { id: 'ct-presta', nom: 'Prestations facturées', sens: 'entree', compteComptable: '706100', motsCles: ['facture', 'prestation', 'location'], couleur: '#8DB5DE' },
  { id: 'ct-buvette', nom: 'Buvette et ventes', sens: 'entree', compteComptable: '707000', motsCles: ['buvette', 'vente'], couleur: '#BBD3EC' },
  { id: 'ct-loyer', nom: 'Loyers et locations', sens: 'sortie', compteComptable: '613000', motsCles: ['loyer', 'location salle'], couleur: '#B42318' },
  { id: 'ct-salaires', nom: 'Salaires et charges', sens: 'sortie', compteComptable: '641000', motsCles: ['salaire', 'urssaf', 'paie'], couleur: '#9A1C13' },
  { id: 'ct-assur', nom: 'Assurances', sens: 'sortie', compteComptable: '616000', motsCles: ['assurance', 'mutuelle'], couleur: '#9A5B00' },
  { id: 'ct-fourn', nom: 'Fournitures', sens: 'sortie', compteComptable: '606400', motsCles: ['fourniture', 'papeterie', 'materiel'], couleur: '#824C00' },
  { id: 'ct-com', nom: 'Communication', sens: 'sortie', compteComptable: '623000', motsCles: ['impression', 'affiche', 'communication'], couleur: '#653B00' },
  { id: 'ct-depl', nom: 'Déplacements', sens: 'sortie', compteComptable: '625100', motsCles: ['deplacement', 'train', 'carburant', 'note de frais'], couleur: '#525A66' },
  { id: 'ct-banque', nom: 'Frais bancaires', sens: 'sortie', compteComptable: '627000', motsCles: ['frais', 'cotisation carte', 'tenue de compte'], couleur: '#3B424B' },
]

/* ------------------------------------------------------------------ */
/* Génération des mouvements                                           */
/* ------------------------------------------------------------------ */

type Modele = {
  compteId: string
  libelle: string
  tiers: string
  categorieId: string
  sens: SensMouvement
  base: number
  frequence: number
  reference: string
}

const modeles: Modele[] = [
  { compteId: 'cb-courant', libelle: 'Encaissement des cotisations', tiers: 'Adhérents', categorieId: 'ct-cotis', sens: 'entree', base: 1450, frequence: 1, reference: 'VIR' },
  { compteId: 'cb-courant', libelle: 'Subvention de fonctionnement', tiers: 'Ville de Nantes', categorieId: 'ct-subv', sens: 'entree', base: 4200, frequence: 6, reference: 'SUB' },
  { compteId: 'cb-courant', libelle: 'Don reçu', tiers: 'Donateurs', categorieId: 'ct-dons', sens: 'entree', base: 380, frequence: 3, reference: 'DON' },
  { compteId: 'cb-courant', libelle: 'Règlement de facture client', tiers: 'Coopérative Grand Ouest', categorieId: 'ct-presta', sens: 'entree', base: 890, frequence: 2, reference: 'VIR' },
  { compteId: 'cb-caisse', libelle: 'Recettes buvette', tiers: 'Buvette', categorieId: 'ct-buvette', sens: 'entree', base: 320, frequence: 2, reference: 'ESP' },
  { compteId: 'cb-courant', libelle: 'Loyer de la salle', tiers: 'Ville de Nantes', categorieId: 'ct-loyer', sens: 'sortie', base: 420, frequence: 1, reference: 'PRLV' },
  { compteId: 'cb-courant', libelle: 'Virement des salaires', tiers: 'Personnel', categorieId: 'ct-salaires', sens: 'sortie', base: 920, frequence: 1, reference: 'PAIE' },
  { compteId: 'cb-courant', libelle: 'Cotisation URSSAF', tiers: 'URSSAF', categorieId: 'ct-salaires', sens: 'sortie', base: 260, frequence: 1, reference: 'PRLV' },
  { compteId: 'cb-courant', libelle: 'Prime d’assurance', tiers: 'Mutuelle des Associations', categorieId: 'ct-assur', sens: 'sortie', base: 860, frequence: 12, reference: 'PRLV' },
  { compteId: 'cb-courant', libelle: 'Achat de fournitures', tiers: 'Papeterie Océane', categorieId: 'ct-fourn', sens: 'sortie', base: 145, frequence: 3, reference: 'CB' },
  { compteId: 'cb-courant', libelle: 'Impression des affiches', tiers: 'Imprimerie du Moulin', categorieId: 'ct-com', sens: 'sortie', base: 275, frequence: 4, reference: 'CB' },
  { compteId: 'cb-courant', libelle: 'Remboursement de note de frais', tiers: 'Bénévoles', categorieId: 'ct-depl', sens: 'sortie', base: 96, frequence: 2, reference: 'VIR' },
  { compteId: 'cb-courant', libelle: 'Frais de tenue de compte', tiers: 'Banque de l’Ouest', categorieId: 'ct-banque', sens: 'sortie', base: 14, frequence: 1, reference: 'FRAIS' },
  { compteId: 'cb-projet', libelle: 'Subvention festival', tiers: 'Conseil départemental', categorieId: 'ct-subv', sens: 'entree', base: 2600, frequence: 6, reference: 'SUB' },
  { compteId: 'cb-projet', libelle: 'Cachet artistique', tiers: 'Compagnie du Grand Vent', categorieId: 'ct-com', sens: 'sortie', base: 780, frequence: 4, reference: 'VIR' },
]

const arrondi = (n: number) => Math.round(n * 100) / 100

function jour(base: Date, d: number) {
  return new Date(base.getTime() + d * 86400000).toISOString()
}

let seq = 0

function genererMouvements(): Mouvement[] {
  const out: Mouvement[] = []
  for (const m of modeles) {
    for (let k = 0; k < 12; k += m.frequence) {
      seq++
      const decalage = -(k * 30) - ((seq * 7) % 26)
      if (decalage < -360) continue
      const variation = 1 + (((seq * 31) % 21) - 10) / 100
      const date = jour(AUJOURDHUI_TRESO, decalage)
      // Les mouvements récents ne sont pas encore pointés
      const rapproche = decalage < -35 && seq % 11 !== 3
      out.push({
        id: `mv-${seq}`,
        compteId: m.compteId,
        date,
        libelle: m.libelle,
        tiers: m.tiers,
        montant: arrondi(m.base * variation),
        sens: m.sens,
        // Quelques mouvements restent à catégoriser
        categorieId: seq % 9 === 4 ? null : m.categorieId,
        reference: `${m.reference}-${String(1000 + seq).slice(-4)}`,
        rapproche,
        virementId: null,
        note: '',
      })
    }
  }
  return out
}

export const virementsInitiaux: Virement[] = [
  { id: 'vr-1', compteSourceId: 'cb-livret', compteDestinationId: 'cb-courant', montant: 3000, date: jour(AUJOURDHUI_TRESO, -120), motif: 'Renflouement du compte courant avant la paie', statut: 'execute', creePar: 'Yanis Traoré' },
  { id: 'vr-2', compteSourceId: 'cb-caisse', compteDestinationId: 'cb-courant', montant: 600, date: jour(AUJOURDHUI_TRESO, -74), motif: 'Versement des espèces de la buvette', statut: 'execute', creePar: 'Camille Beauchamp' },
  { id: 'vr-3', compteSourceId: 'cb-courant', compteDestinationId: 'cb-projet', montant: 1200, date: jour(AUJOURDHUI_TRESO, -40), motif: 'Avance de trésorerie sur le festival', statut: 'execute', creePar: 'Yanis Traoré' },
  { id: 'vr-4', compteSourceId: 'cb-livret', compteDestinationId: 'cb-courant', montant: 2500, date: jour(AUJOURDHUI_TRESO, 12), motif: 'Anticipation du versement des salaires d’octobre', statut: 'planifie', creePar: 'Yanis Traoré' },
  { id: 'vr-5', compteSourceId: 'cb-courant', compteDestinationId: 'cb-livret', montant: 800, date: jour(AUJOURDHUI_TRESO, -18), motif: 'Mise en réserve — annulé, trésorerie trop juste', statut: 'annule', creePar: 'Camille Beauchamp' },
]

function mouvementsDesVirements(): Mouvement[] {
  const out: Mouvement[] = []
  for (const v of virementsInitiaux.filter((x) => x.statut === 'execute')) {
    seq++
    out.push({
      id: `mv-v-${v.id}-s`,
      compteId: v.compteSourceId,
      date: v.date,
      libelle: `Virement interne — ${v.motif}`,
      tiers: 'Virement interne',
      montant: v.montant,
      sens: 'sortie',
      categorieId: null,
      reference: `VRT-${v.id.toUpperCase()}`,
      rapproche: true,
      virementId: v.id,
      note: '',
    })
    out.push({
      id: `mv-v-${v.id}-d`,
      compteId: v.compteDestinationId,
      date: v.date,
      libelle: `Virement interne — ${v.motif}`,
      tiers: 'Virement interne',
      montant: v.montant,
      sens: 'entree',
      categorieId: null,
      reference: `VRT-${v.id.toUpperCase()}`,
      rapproche: true,
      virementId: v.id,
      note: '',
    })
  }
  return out
}

export const mouvementsInitiaux: Mouvement[] = [...genererMouvements(), ...mouvementsDesVirements()].sort((a, b) =>
  a.date < b.date ? 1 : -1,
)

export const previsionsInitiales: Prevision[] = [
  { id: 'pv-1', libelle: 'Subvention municipale — second versement', tiers: 'Ville de Nantes', montant: 4200, sens: 'entree', dateAttendue: jour(AUJOURDHUI_TRESO, 21), categorieId: 'ct-subv', fiabilite: 'confirmee', origine: 'Convention signée' },
  { id: 'pv-2', libelle: 'Règlement facture F-2026-0041', tiers: 'Coopérative Grand Ouest', montant: 1284, sens: 'entree', dateAttendue: jour(AUJOURDHUI_TRESO, 9), categorieId: 'ct-presta', fiabilite: 'confirmee', origine: 'Facturation' },
  { id: 'pv-3', libelle: 'Règlement facture F-2026-0044', tiers: 'Groupe Armor Services', montant: 960, sens: 'entree', dateAttendue: jour(AUJOURDHUI_TRESO, 34), categorieId: 'ct-presta', fiabilite: 'probable', origine: 'Facturation — client souvent en retard' },
  { id: 'pv-4', libelle: 'Cotisations de rentrée', tiers: 'Adhérents', montant: 3100, sens: 'entree', dateAttendue: jour(AUJOURDHUI_TRESO, 28), categorieId: 'ct-cotis', fiabilite: 'probable', origine: 'Adhésions' },
  { id: 'pv-5', libelle: 'Don du mécène annuel', tiers: 'Fondation Loire', montant: 1500, sens: 'entree', dateAttendue: jour(AUJOURDHUI_TRESO, 52), categorieId: 'ct-dons', fiabilite: 'probable', origine: 'Engagement oral' },
  { id: 'pv-6', libelle: 'Salaires de septembre', tiers: 'Personnel', montant: 1180, sens: 'sortie', dateAttendue: jour(AUJOURDHUI_TRESO, 26), categorieId: 'ct-salaires', fiabilite: 'confirmee', origine: 'Contrat de travail' },
  { id: 'pv-7', libelle: 'Salaires d’octobre', tiers: 'Personnel', montant: 1180, sens: 'sortie', dateAttendue: jour(AUJOURDHUI_TRESO, 57), categorieId: 'ct-salaires', fiabilite: 'confirmee', origine: 'Contrat de travail' },
  { id: 'pv-8', libelle: 'Loyer trimestriel de la salle', tiers: 'Ville de Nantes', montant: 1260, sens: 'sortie', dateAttendue: jour(AUJOURDHUI_TRESO, 14), categorieId: 'ct-loyer', fiabilite: 'confirmee', origine: 'Convention d’occupation' },
  { id: 'pv-9', libelle: 'Prime d’assurance annuelle', tiers: 'Mutuelle des Associations', montant: 880, sens: 'sortie', dateAttendue: jour(AUJOURDHUI_TRESO, 40), categorieId: 'ct-assur', fiabilite: 'confirmee', origine: 'Échéancier' },
  { id: 'pv-10', libelle: 'Remboursements de notes de frais', tiers: 'Bénévoles', montant: 430, sens: 'sortie', dateAttendue: jour(AUJOURDHUI_TRESO, 7), categorieId: 'ct-depl', fiabilite: 'probable', origine: 'Notes de frais validées' },
  { id: 'pv-11', libelle: 'Achat de matériel pour le festival', tiers: 'Coopérative du Matériel', montant: 1650, sens: 'sortie', dateAttendue: jour(AUJOURDHUI_TRESO, 45), categorieId: 'ct-fourn', fiabilite: 'probable', origine: 'Devis en cours' },
]

/* ------------------------------------------------------------------ */
/* Calculs                                                             */
/* ------------------------------------------------------------------ */

export function soldeCompte(compte: CompteBancaire, mouvements: Mouvement[]) {
  const delta = mouvements
    .filter((m) => m.compteId === compte.id)
    .reduce((s, m) => s + (m.sens === 'entree' ? m.montant : -m.montant), 0)
  return arrondi(compte.soldeInitial + delta)
}

export function soldeGlobal(comptes: CompteBancaire[], mouvements: Mouvement[]) {
  return arrondi(comptes.reduce((s, c) => s + soldeCompte(c, mouvements), 0))
}

export type Horizon = 30 | 60 | 90

export function previsionsDansHorizon(previsions: Prevision[], horizon: Horizon) {
  const limite = AUJOURDHUI_TRESO.getTime() + horizon * 86400000
  return previsions.filter((p) => {
    const t = new Date(p.dateAttendue).getTime()
    return t >= AUJOURDHUI_TRESO.getTime() && t <= limite
  })
}

export type Enchainement = {
  soldeActuel: number
  entreesPrevues: number
  sortiesPrevues: number
  soldePrevisionnel: number
  entreesConfirmees: number
  sortiesConfirmees: number
  soldePrudent: number
}

/** L'enchaînement du tableau de bord : solde actuel → entrées → sorties → prévisionnel. */
export function calculerEnchainement(
  comptes: CompteBancaire[],
  mouvements: Mouvement[],
  previsions: Prevision[],
  horizon: Horizon,
): Enchainement {
  const soldeActuel = soldeGlobal(comptes, mouvements)
  const dans = previsionsDansHorizon(previsions, horizon)
  const entreesPrevues = arrondi(dans.filter((p) => p.sens === 'entree').reduce((s, p) => s + p.montant, 0))
  const sortiesPrevues = arrondi(dans.filter((p) => p.sens === 'sortie').reduce((s, p) => s + p.montant, 0))
  const entreesConfirmees = arrondi(
    dans.filter((p) => p.sens === 'entree' && p.fiabilite === 'confirmee').reduce((s, p) => s + p.montant, 0),
  )
  const sortiesConfirmees = arrondi(dans.filter((p) => p.sens === 'sortie').reduce((s, p) => s + p.montant, 0))
  return {
    soldeActuel,
    entreesPrevues,
    sortiesPrevues,
    soldePrevisionnel: arrondi(soldeActuel + entreesPrevues - sortiesPrevues),
    entreesConfirmees,
    sortiesConfirmees,
    soldePrudent: arrondi(soldeActuel + entreesConfirmees - sortiesConfirmees),
  }
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Solde de trésorerie à la fin de chacun des douze derniers mois. */
export function serieSolde(comptes: CompteBancaire[], mouvements: Mouvement[]) {
  const points: { label: string; valeur: number }[] = []
  const initial = comptes.reduce((s, c) => s + c.soldeInitial, 0)
  for (let k = 11; k >= 0; k--) {
    const fin = new Date(Date.UTC(AUJOURDHUI_TRESO.getUTCFullYear(), AUJOURDHUI_TRESO.getUTCMonth() - k + 1, 0, 23, 59))
    const cumul = mouvements
      .filter((m) => new Date(m.date).getTime() <= fin.getTime())
      .reduce((s, m) => s + (m.sens === 'entree' ? m.montant : -m.montant), 0)
    points.push({ label: `${MOIS[fin.getUTCMonth()]} ${String(fin.getUTCFullYear()).slice(2)}`, valeur: Math.round(initial + cumul) })
  }
  return points
}

/** Projection à partir d'aujourd'hui, semaine par semaine. */
export function serieProjection(
  comptes: CompteBancaire[],
  mouvements: Mouvement[],
  previsions: Prevision[],
  horizon: Horizon,
) {
  const depart = soldeGlobal(comptes, mouvements)
  const points: { label: string; valeur: number }[] = [{ label: 'Aujourd’hui', valeur: Math.round(depart) }]
  let cumul = depart
  const semaines = Math.ceil(horizon / 7)
  for (let s = 1; s <= semaines; s++) {
    const debut = AUJOURDHUI_TRESO.getTime() + (s - 1) * 7 * 86400000
    const fin = AUJOURDHUI_TRESO.getTime() + s * 7 * 86400000
    for (const p of previsions) {
      const t = new Date(p.dateAttendue).getTime()
      if (t > debut && t <= fin) cumul += p.sens === 'entree' ? p.montant : -p.montant
    }
    points.push({ label: `S+${s}`, valeur: Math.round(cumul) })
  }
  return points
}

export function repartitionCategories(mouvements: Mouvement[], categories: Categorie[], sens: SensMouvement) {
  const m = new Map<string, number>()
  const limite = AUJOURDHUI_TRESO.getTime() - 365 * 86400000
  for (const mv of mouvements) {
    if (mv.sens !== sens || mv.virementId) continue
    if (new Date(mv.date).getTime() < limite) continue
    const cle = mv.categorieId ?? 'non-categorise'
    m.set(cle, arrondi((m.get(cle) ?? 0) + mv.montant))
  }
  return Array.from(m.entries())
    .map(([id, valeur]) => ({
      label: id === 'non-categorise' ? 'Non catégorisé' : (categories.find((c) => c.id === id)?.nom ?? id),
      valeur: Math.round(valeur),
    }))
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 7)
}

/** Suggère une catégorie d'après le libellé et le tiers. */
export function suggererCategorie(mouvement: Mouvement, categories: Categorie[]): Categorie | undefined {
  const texte = `${mouvement.libelle} ${mouvement.tiers}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  return categories.find((c) => c.sens === mouvement.sens && c.motsCles.some((mc) => texte.includes(mc)))
}
