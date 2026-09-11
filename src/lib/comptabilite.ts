import type { StatusTone } from './mock'

/* ------------------------------------------------------------------ */
/* Repères                                                             */
/* ------------------------------------------------------------------ */

export const AUJOURDHUI_COMPTA = new Date('2026-09-01T00:00:00Z')

export type StatutExercice = 'ouvert' | 'cloture'

export type Exercice = {
  id: string
  libelle: string
  debut: string
  fin: string
  statut: StatutExercice
  clotureLe: string | null
  clotureePar: string
}

export const exercicesInitiaux: Exercice[] = [
  {
    id: 'ex-2024',
    libelle: '2024-2025',
    debut: '2024-09-01',
    fin: '2025-08-31',
    statut: 'cloture',
    clotureLe: '2025-11-18T10:00:00.000Z',
    clotureePar: 'Yanis Traoré',
  },
  {
    id: 'ex-2025',
    libelle: '2025-2026',
    debut: '2025-09-01',
    fin: '2026-08-31',
    statut: 'ouvert',
    clotureLe: null,
    clotureePar: '',
  },
]

export const EXERCICE_COURANT_ID = 'ex-2025'

/* ------------------------------------------------------------------ */
/* Plan comptable                                                      */
/* ------------------------------------------------------------------ */

export type SensCompte = 'actif' | 'passif' | 'charge' | 'produit'

export type Compte = {
  numero: string
  libelle: string
  classe: number
  sens: SensCompte
  /** Un compte de trésorerie entre dans le rapprochement bancaire. */
  tresorerie: boolean
  actif: boolean
}

function compte(numero: string, libelle: string, sens: SensCompte, tresorerie = false): Compte {
  return { numero, libelle, classe: Number(numero[0]), sens, tresorerie, actif: true }
}

export const planInitial: Compte[] = [
  compte('102000', 'Fonds associatifs sans droit de reprise', 'passif'),
  compte('106000', 'Réserves', 'passif'),
  compte('120000', 'Résultat de l’exercice', 'passif'),
  compte('218000', 'Matériel et mobilier', 'actif'),
  compte('281800', 'Amortissements du matériel', 'passif'),
  compte('401000', 'Fournisseurs', 'passif'),
  compte('411000', 'Adhérents et usagers', 'actif'),
  compte('421000', 'Personnel — rémunérations dues', 'passif'),
  compte('431000', 'Sécurité sociale', 'passif'),
  compte('441900', 'Subventions à recevoir', 'actif'),
  compte('467000', 'Notes de frais à rembourser', 'passif'),
  compte('512000', 'Banque — compte courant', 'actif', true),
  compte('530000', 'Caisse', 'actif', true),
  compte('606300', 'Fournitures d’entretien et petit équipement', 'charge'),
  compte('606400', 'Fournitures administratives', 'charge'),
  compte('607000', 'Achats de marchandises — buvette', 'charge'),
  compte('613000', 'Locations de salles', 'charge'),
  compte('616000', 'Primes d’assurance', 'charge'),
  compte('618300', 'Documentation et abonnements', 'charge'),
  compte('623000', 'Communication et affichage', 'charge'),
  compte('625100', 'Déplacements des bénévoles', 'charge'),
  compte('626000', 'Téléphone et internet', 'charge'),
  compte('627000', 'Services bancaires', 'charge'),
  compte('641000', 'Rémunérations du personnel', 'charge'),
  compte('645000', 'Charges sociales', 'charge'),
  compte('658000', 'Charges diverses de gestion', 'charge'),
  compte('706000', 'Cotisations des adhérents', 'produit'),
  compte('707000', 'Ventes buvette et petite restauration', 'produit'),
  compte('708000', 'Produits des activités annexes', 'produit'),
  compte('740000', 'Subventions d’exploitation', 'produit'),
  compte('754000', 'Dons manuels', 'produit'),
  compte('758000', 'Produits divers de gestion', 'produit'),
]

export const classesLabels: Record<number, string> = {
  1: 'Classe 1 — Fonds propres',
  2: 'Classe 2 — Immobilisations',
  4: 'Classe 4 — Tiers',
  5: 'Classe 5 — Trésorerie',
  6: 'Classe 6 — Charges',
  7: 'Classe 7 — Produits',
}

/* ------------------------------------------------------------------ */
/* Journaux                                                            */
/* ------------------------------------------------------------------ */

export type Journal = { code: string; libelle: string; description: string }

export const journaux: Journal[] = [
  { code: 'AC', libelle: 'Achats', description: 'Factures fournisseurs et notes de frais.' },
  { code: 'VE', libelle: 'Ventes', description: 'Cotisations, buvette, prestations.' },
  { code: 'BQ', libelle: 'Banque', description: 'Mouvements du compte courant.' },
  { code: 'CA', libelle: 'Caisse', description: 'Encaissements en espèces.' },
  { code: 'OD', libelle: 'Opérations diverses', description: 'Salaires, régularisations, à-nouveaux.' },
]

/* ------------------------------------------------------------------ */
/* Écritures                                                           */
/* ------------------------------------------------------------------ */

export type LigneEcriture = {
  id: string
  compte: string
  libelle: string
  debit: number
  credit: number
  /** Pointée lors du rapprochement bancaire. */
  rapprochee: boolean
}

export type StatutEcriture = 'brouillon' | 'validee'

export type Ecriture = {
  id: string
  numero: string
  exerciceId: string
  journal: string
  date: string
  libelle: string
  reference: string
  tiers: string
  statut: StatutEcriture
  lignes: LigneEcriture[]
  pieceId: string | null
  creeePar: string
  valideeLe: string | null
}

export type Piece = {
  id: string
  nom: string
  type: string
  montant: number
  date: string
  fournisseur: string
  ecritureId: string | null
}

export type LigneBudget = {
  compte: string
  prevu: number
}

/* ------------------------------------------------------------------ */
/* Calculs                                                             */
/* ------------------------------------------------------------------ */

export function totalDebit(e: Ecriture) {
  return e.lignes.reduce((s, l) => s + l.debit, 0)
}
export function totalCredit(e: Ecriture) {
  return e.lignes.reduce((s, l) => s + l.credit, 0)
}
export function ecart(e: Ecriture) {
  return Math.round((totalDebit(e) - totalCredit(e)) * 100) / 100
}
export function equilibree(e: Ecriture) {
  return ecart(e) === 0 && e.lignes.length >= 2
}

export type SoldeCompte = { compte: string; debit: number; credit: number; solde: number }

export function soldesParCompte(ecritures: Ecriture[]): Map<string, SoldeCompte> {
  const m = new Map<string, SoldeCompte>()
  for (const e of ecritures) {
    for (const l of e.lignes) {
      const s = m.get(l.compte) ?? { compte: l.compte, debit: 0, credit: 0, solde: 0 }
      s.debit += l.debit
      s.credit += l.credit
      s.solde = s.debit - s.credit
      m.set(l.compte, s)
    }
  }
  return m
}

export function soldeClasse(ecritures: Ecriture[], classe: number) {
  let debit = 0
  let credit = 0
  for (const e of ecritures) {
    for (const l of e.lignes) {
      if (Number(l.compte[0]) === classe) {
        debit += l.debit
        credit += l.credit
      }
    }
  }
  return { debit, credit, solde: debit - credit }
}

export type Mouvement = {
  ecritureId: string
  numero: string
  date: string
  journal: string
  libelle: string
  debit: number
  credit: number
  rapprochee: boolean
  cumul: number
}

export function mouvementsDuCompte(ecritures: Ecriture[], numero: string): Mouvement[] {
  const lignes: Mouvement[] = []
  let cumul = 0
  const triees = [...ecritures].sort((a, b) => (a.date < b.date ? -1 : 1))
  for (const e of triees) {
    for (const l of e.lignes) {
      if (l.compte !== numero) continue
      cumul += l.debit - l.credit
      lignes.push({
        ecritureId: e.id,
        numero: e.numero,
        date: e.date,
        journal: e.journal,
        libelle: l.libelle || e.libelle,
        debit: l.debit,
        credit: l.credit,
        rapprochee: l.rapprochee,
        cumul,
      })
    }
  }
  return lignes
}

/* ------------------------------------------------------------------ */
/* Génération des données mockées                                      */
/* ------------------------------------------------------------------ */

type Modele = {
  journal: string
  libelle: string
  tiers: string
  lignes: { compte: string; sens: 'D' | 'C'; part: number }[]
  base: number
  mois: number[]
  reference: string
}

/** Mois exprimés en position dans l'exercice : 0 = septembre. */
const TOUS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const TRIMESTRE = [0, 3, 6, 9]

const modeles: Modele[] = [
  {
    journal: 'VE',
    libelle: 'Cotisations encaissées',
    tiers: 'Adhérents',
    lignes: [
      { compte: '512000', sens: 'D', part: 1 },
      { compte: '706000', sens: 'C', part: 1 },
    ],
    base: 1450,
    mois: TOUS,
    reference: 'COT',
  },
  {
    journal: 'VE',
    libelle: 'Recettes buvette',
    tiers: 'Buvette',
    lignes: [
      { compte: '530000', sens: 'D', part: 1 },
      { compte: '707000', sens: 'C', part: 1 },
    ],
    base: 320,
    mois: [1, 3, 5, 7, 9, 11],
    reference: 'BUV',
  },
  {
    journal: 'BQ',
    libelle: 'Subvention municipale',
    tiers: 'Ville de Nantes',
    lignes: [
      { compte: '512000', sens: 'D', part: 1 },
      { compte: '740000', sens: 'C', part: 1 },
    ],
    base: 4200,
    mois: [2, 8],
    reference: 'SUB',
  },
  {
    journal: 'BQ',
    libelle: 'Dons reçus',
    tiers: 'Donateurs',
    lignes: [
      { compte: '512000', sens: 'D', part: 1 },
      { compte: '754000', sens: 'C', part: 1 },
    ],
    base: 380,
    mois: [1, 4, 7, 10],
    reference: 'DON',
  },
  {
    journal: 'AC',
    libelle: 'Facture fournitures administratives',
    tiers: 'Papeterie Océane',
    lignes: [
      { compte: '606400', sens: 'D', part: 1 },
      { compte: '401000', sens: 'C', part: 1 },
    ],
    base: 145,
    mois: TRIMESTRE,
    reference: 'FA',
  },
  {
    journal: 'AC',
    libelle: 'Achat marchandises buvette',
    tiers: 'Grossiste Armor',
    lignes: [
      { compte: '607000', sens: 'D', part: 1 },
      { compte: '401000', sens: 'C', part: 1 },
    ],
    base: 210,
    mois: [1, 3, 5, 7, 9],
    reference: 'FA',
  },
  {
    journal: 'AC',
    libelle: 'Prime d’assurance annuelle',
    tiers: 'Mutuelle des Associations',
    lignes: [
      { compte: '616000', sens: 'D', part: 1 },
      { compte: '401000', sens: 'C', part: 1 },
    ],
    base: 860,
    mois: [1],
    reference: 'FA',
  },
  {
    journal: 'AC',
    libelle: 'Location de salle',
    tiers: 'Ville de Nantes',
    lignes: [
      { compte: '613000', sens: 'D', part: 1 },
      { compte: '401000', sens: 'C', part: 1 },
    ],
    base: 420,
    mois: TOUS,
    reference: 'FA',
  },
  {
    journal: 'AC',
    libelle: 'Abonnement téléphonie et internet',
    tiers: 'Opérateur Grand Ouest',
    lignes: [
      { compte: '626000', sens: 'D', part: 1 },
      { compte: '401000', sens: 'C', part: 1 },
    ],
    base: 62,
    mois: TOUS,
    reference: 'FA',
  },
  {
    journal: 'AC',
    libelle: 'Impression affiches et programmes',
    tiers: 'Imprimerie du Moulin',
    lignes: [
      { compte: '623000', sens: 'D', part: 1 },
      { compte: '401000', sens: 'C', part: 1 },
    ],
    base: 275,
    mois: [0, 5, 9],
    reference: 'FA',
  },
  {
    journal: 'AC',
    libelle: 'Note de frais — déplacements bénévoles',
    tiers: 'Bénévoles',
    lignes: [
      { compte: '625100', sens: 'D', part: 1 },
      { compte: '467000', sens: 'C', part: 1 },
    ],
    base: 96,
    mois: [0, 2, 4, 6, 8, 10],
    reference: 'NDF',
  },
  {
    journal: 'BQ',
    libelle: 'Règlement fournisseurs',
    tiers: 'Fournisseurs divers',
    lignes: [
      { compte: '401000', sens: 'D', part: 1 },
      { compte: '512000', sens: 'C', part: 1 },
    ],
    base: 640,
    mois: TOUS,
    reference: 'REG',
  },
  {
    journal: 'BQ',
    libelle: 'Remboursement note de frais',
    tiers: 'Bénévoles',
    lignes: [
      { compte: '467000', sens: 'D', part: 1 },
      { compte: '512000', sens: 'C', part: 1 },
    ],
    base: 96,
    mois: [1, 3, 5, 7, 9],
    reference: 'REG',
  },
  {
    journal: 'BQ',
    libelle: 'Frais de tenue de compte',
    tiers: 'Banque de l’Ouest',
    lignes: [
      { compte: '627000', sens: 'D', part: 1 },
      { compte: '512000', sens: 'C', part: 1 },
    ],
    base: 14,
    mois: TOUS,
    reference: 'BQ',
  },
  {
    journal: 'OD',
    libelle: 'Salaire de l’animateur',
    tiers: 'Personnel',
    lignes: [
      { compte: '641000', sens: 'D', part: 1 },
      { compte: '421000', sens: 'C', part: 0.78 },
      { compte: '431000', sens: 'C', part: 0.22 },
    ],
    base: 1180,
    mois: TOUS,
    reference: 'PAIE',
  },
  {
    journal: 'BQ',
    libelle: 'Virement des salaires',
    tiers: 'Personnel',
    lignes: [
      { compte: '421000', sens: 'D', part: 1 },
      { compte: '512000', sens: 'C', part: 1 },
    ],
    base: 920,
    mois: TOUS,
    reference: 'PAIE',
  },
  {
    journal: 'OD',
    libelle: 'Subvention notifiée non encaissée',
    tiers: 'Conseil départemental',
    lignes: [
      { compte: '441900', sens: 'D', part: 1 },
      { compte: '740000', sens: 'C', part: 1 },
    ],
    base: 1800,
    mois: [10],
    reference: 'SUB',
  },
  {
    journal: 'VE',
    libelle: 'Cotisations à recevoir',
    tiers: 'Adhérents',
    lignes: [
      { compte: '411000', sens: 'D', part: 1 },
      { compte: '706000', sens: 'C', part: 1 },
    ],
    base: 310,
    mois: [2, 6, 10],
    reference: 'COT',
  },
  {
    journal: 'AC',
    libelle: 'Achat de petit équipement',
    tiers: 'Coopérative du Matériel',
    lignes: [
      { compte: '606300', sens: 'D', part: 1 },
      { compte: '401000', sens: 'C', part: 1 },
    ],
    base: 188,
    mois: [3, 8],
    reference: 'FA',
  },
  {
    journal: 'CA',
    libelle: 'Versement de la caisse en banque',
    tiers: 'Banque de l’Ouest',
    lignes: [
      { compte: '512000', sens: 'D', part: 1 },
      { compte: '530000', sens: 'C', part: 1 },
    ],
    base: 300,
    mois: [2, 6, 10],
    reference: 'CA',
  },
]

const auteurs = ['Yanis Traoré', 'Camille Beauchamp', 'Élodie Nguyen']

function dateExercice(exercice: Exercice, moisRelatif: number, jour: number) {
  const debut = new Date(exercice.debut)
  const d = new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + moisRelatif, jour, 12))
  return d.toISOString()
}

function arrondi(n: number) {
  return Math.round(n * 100) / 100
}

let compteur = 0

function creerEcriture(exercice: Exercice, m: Modele, moisRelatif: number, indice: number): Ecriture {
  compteur++
  const variation = 1 + (((indice * 37) % 25) - 12) / 100
  const montant = arrondi(m.base * variation)
  const jour = 3 + ((indice * 7) % 24)
  const date = dateExercice(exercice, moisRelatif, jour)
  const annee = new Date(date).getUTCFullYear()

  const lignes: LigneEcriture[] = m.lignes.map((l, k) => {
    const valeur = arrondi(montant * l.part)
    return {
      id: `lig-${compteur}-${k}`,
      compte: l.compte,
      libelle: m.libelle,
      debit: l.sens === 'D' ? valeur : 0,
      credit: l.sens === 'C' ? valeur : 0,
      rapprochee: false,
    }
  })

  // On corrige le dernier centime éventuel sur la ligne la plus importante
  const d = arrondi(lignes.reduce((s, l) => s + l.debit, 0))
  const c = arrondi(lignes.reduce((s, l) => s + l.credit, 0))
  if (d !== c) {
    const cible = lignes.find((l) => (d > c ? l.credit > 0 : l.debit > 0))!
    if (d > c) cible.credit = arrondi(cible.credit + (d - c))
    else cible.debit = arrondi(cible.debit + (c - d))
  }

  const estCourant = exercice.statut === 'ouvert'
  const recente = new Date(date).getTime() > AUJOURDHUI_COMPTA.getTime() - 75 * 86400000
  const brouillon = estCourant && recente && indice % 6 === 1

  // Rapprochement bancaire : tout est pointé sauf les mouvements récents
  const pointable = new Date(date).getTime() < AUJOURDHUI_COMPTA.getTime() - 40 * 86400000
  for (const l of lignes) {
    if (['512000', '530000'].includes(l.compte)) l.rapprochee = pointable && indice % 9 !== 4
  }

  return {
    id: `ecr-${compteur}`,
    numero: `${m.journal}${annee}${String(compteur).padStart(4, '0')}`,
    exerciceId: exercice.id,
    journal: m.journal,
    date,
    libelle: m.libelle,
    reference: `${m.reference}-${annee}-${String(100 + (compteur % 900))}`,
    tiers: m.tiers,
    statut: brouillon ? 'brouillon' : 'validee',
    lignes,
    pieceId: null,
    creeePar: auteurs[compteur % auteurs.length],
    valideeLe: brouillon ? null : new Date(new Date(date).getTime() + 3 * 86400000).toISOString(),
  }
}

function genererEcritures(): Ecriture[] {
  const out: Ecriture[] = []
  let indice = 0
  for (const exercice of exercicesInitiaux) {
    for (const m of modeles) {
      for (const mois of m.mois) {
        indice++
        // Sur l'exercice en cours, on s'arrête à la date du jour
        const e = creerEcriture(exercice, m, mois, indice)
        if (new Date(e.date).getTime() > AUJOURDHUI_COMPTA.getTime()) continue
        out.push(e)
      }
    }
  }

  // Une régularisation de caisse, en brouillon et équilibrée
  const exCourant = exercicesInitiaux[1]
  compteur++
  out.push({
    id: 'ecr-regularisation',
    numero: `OD2026${String(compteur).padStart(4, '0')}`,
    exerciceId: exCourant.id,
    journal: 'OD',
    date: dateExercice(exCourant, 11, 20),
    libelle: 'Régularisation caisse — saisie incomplète',
    reference: 'OD-2026-777',
    tiers: 'Interne',
    statut: 'brouillon',
    lignes: [
      { id: 'lig-des-0', compte: '530000', libelle: 'Écart de caisse constaté', debit: 84.5, credit: 0, rapprochee: false },
      { id: 'lig-des-1', compte: '758000', libelle: 'Produit divers de gestion', debit: 0, credit: 84.5, rapprochee: false },
    ],
    pieceId: null,
    creeePar: 'Camille Beauchamp',
    valideeLe: null,
  })

  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const ecrituresInitiales: Ecriture[] = genererEcritures()

/**
 * Variante de démonstration : la régularisation de caisse est saisie à moitié.
 * Une écriture déséquilibrée ne peut être ni validée ni clôturée.
 */
export function ecrituresAvecDesequilibre(): Ecriture[] {
  return ecrituresInitiales.map((e) =>
    e.id === 'ecr-regularisation'
      ? {
          ...e,
          libelle: 'Régularisation caisse — saisie incomplète',
          lignes: e.lignes.map((l) => (l.credit > 0 ? { ...l, credit: 42.25 } : l)),
        }
      : e,
  )
}

/* ------------------------------------------------------------------ */
/* Pièces comptables                                                   */
/* ------------------------------------------------------------------ */

export const piecesInitiales: Piece[] = (() => {
  const avecPiece = ecrituresInitiales.filter((e) => ['AC', 'BQ'].includes(e.journal)).slice(0, 48)
  const pieces: Piece[] = avecPiece.map((e, i) => ({
    id: `pc-${i}`,
    nom: `${e.reference}.pdf`,
    type: e.journal === 'AC' ? 'Facture fournisseur' : 'Relevé bancaire',
    montant: totalDebit(e),
    date: e.date,
    fournisseur: e.tiers,
    ecritureId: i % 7 === 3 ? null : e.id,
  }))
  // Quelques pièces reçues mais pas encore saisies
  pieces.push(
    { id: 'pc-orph-1', nom: 'FA-2026-914.pdf', type: 'Facture fournisseur', montant: 318.4, date: '2026-07-14T12:00:00.000Z', fournisseur: 'Imprimerie du Moulin', ecritureId: null },
    { id: 'pc-orph-2', nom: 'NDF-2026-058.pdf', type: 'Note de frais', montant: 74.9, date: '2026-08-02T12:00:00.000Z', fournisseur: 'Awa Diallo', ecritureId: null },
    { id: 'pc-orph-3', nom: 'DON-2026-031.pdf', type: 'Reçu de don', montant: 500, date: '2026-08-21T12:00:00.000Z', fournisseur: 'Fondation Loire', ecritureId: null },
  )
  return pieces.sort((a, b) => (a.date < b.date ? 1 : -1))
})()

/* ------------------------------------------------------------------ */
/* Budget                                                              */
/* ------------------------------------------------------------------ */

export const budgetInitial: LigneBudget[] = [
  { compte: '706000', prevu: 18000 },
  { compte: '707000', prevu: 2400 },
  { compte: '740000', prevu: 10000 },
  { compte: '754000', prevu: 1800 },
  { compte: '613000', prevu: 5400 },
  { compte: '616000', prevu: 900 },
  { compte: '623000', prevu: 1000 },
  { compte: '626000', prevu: 800 },
  { compte: '641000', prevu: 14000 },
  { compte: '607000', prevu: 1200 },
]

/* ------------------------------------------------------------------ */
/* Indicateurs du tableau de bord                                      */
/* ------------------------------------------------------------------ */

export type KpisCompta = {
  tresorerie: number
  banque: number
  caisse: number
  produits: number
  charges: number
  resultat: number
  fournisseursAPayer: number
  clientsARecevoir: number
  notesDeFrais: number
  brouillons: number
  desequilibrees: number
}

/**
 * Les comptes de bilan (trésorerie, tiers) sont cumulatifs : ils se calculent sur
 * l'ensemble des écritures. Les comptes de gestion (charges, produits) se remettent
 * à zéro à chaque exercice : ils se calculent sur le seul exercice demandé.
 */
export function calculerKpisCompta(ecritures: Ecriture[], exerciceId: string): KpisCompta {
  const validees = ecritures.filter((e) => e.statut === 'validee')
  const soldes = soldesParCompte(validees)
  const solde = (n: string) => arrondi(soldes.get(n)?.solde ?? 0)

  const surExercice = validees.filter((e) => e.exerciceId === exerciceId)
  const produits = arrondi(-soldeClasse(surExercice, 7).solde)
  const charges = arrondi(soldeClasse(surExercice, 6).solde)

  const surExerciceOuTout = (e: Ecriture) => e.exerciceId === exerciceId

  return {
    banque: solde('512000'),
    caisse: solde('530000'),
    tresorerie: arrondi(solde('512000') + solde('530000')),
    produits,
    charges,
    resultat: arrondi(produits - charges),
    fournisseursAPayer: -solde('401000'),
    clientsARecevoir: arrondi(solde('411000') + solde('441900')),
    notesDeFrais: -solde('467000'),
    brouillons: ecritures.filter((e) => e.statut === 'brouillon' && surExerciceOuTout(e)).length,
    desequilibrees: ecritures.filter((e) => !equilibree(e) && surExerciceOuTout(e)).length,
  }
}

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Trésorerie cumulée à la fin de chaque mois de l'exercice, report inclus. */
export function serieTresorerie(ecritures: Ecriture[], exercice: Exercice) {
  const validees = ecritures.filter((e) => e.statut === 'validee' && e.exerciceId === exercice.id)
  const debut = new Date(exercice.debut)
  const points: { label: string; valeur: number }[] = []

  // Report à nouveau : trésorerie constatée à la veille de l'ouverture
  let cumul = ecritures
    .filter((e) => e.statut === 'validee' && new Date(e.date) < debut)
    .flatMap((e) => e.lignes)
    .filter((l) => l.compte === '512000' || l.compte === '530000')
    .reduce((s, l) => s + l.debit - l.credit, 0)
  for (let k = 0; k < 12; k++) {
    const fin = new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + k + 1, 0, 23, 59))
    if (fin.getTime() > AUJOURDHUI_COMPTA.getTime()) break
    const debutMois = new Date(Date.UTC(debut.getUTCFullYear(), debut.getUTCMonth() + k, 1))
    for (const e of validees) {
      const t = new Date(e.date).getTime()
      if (t < debutMois.getTime() || t > fin.getTime()) continue
      for (const l of e.lignes) {
        if (l.compte === '512000' || l.compte === '530000') cumul += l.debit - l.credit
      }
    }
    points.push({ label: `${MOIS_COURTS[fin.getUTCMonth()]} ${String(fin.getUTCFullYear()).slice(2)}`, valeur: Math.round(cumul) })
  }
  return points
}

export function budgetVsRealise(ecritures: Ecriture[], budget: LigneBudget[], plan: Compte[], exerciceId: string) {
  const validees = ecritures.filter((e) => e.statut === 'validee' && e.exerciceId === exerciceId)
  const soldes = soldesParCompte(validees)
  return budget.map((b) => {
    const c = plan.find((p) => p.numero === b.compte)
    const s = soldes.get(b.compte)
    const realise = c?.sens === 'produit' ? -(s?.solde ?? 0) : (s?.solde ?? 0)
    return {
      compte: b.compte,
      label: c?.libelle ?? b.compte,
      sens: c?.sens ?? 'charge',
      prevu: b.prevu,
      realise: Math.round(realise),
    }
  })
}

export function repartitionCharges(ecritures: Ecriture[], plan: Compte[], exerciceId: string) {
  const validees = ecritures.filter((e) => e.statut === 'validee' && e.exerciceId === exerciceId)
  const soldes = soldesParCompte(validees)
  return plan
    .filter((c) => c.sens === 'charge')
    .map((c) => ({ label: c.libelle, valeur: Math.round(soldes.get(c.numero)?.solde ?? 0) }))
    .filter((l) => l.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 6)
}

export const toneStatutEcriture: Record<StatutEcriture, StatusTone> = {
  brouillon: 'neutral',
  validee: 'success',
}
