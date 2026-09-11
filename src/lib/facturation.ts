export const AUJOURDHUI_FACT = new Date('2026-09-02T00:00:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type TypeClient = 'collectivite' | 'entreprise' | 'association' | 'particulier'

export const typeClientLabels: Record<TypeClient, string> = {
  collectivite: 'Collectivité',
  entreprise: 'Entreprise',
  association: 'Association',
  particulier: 'Particulier',
}

export type Client = {
  id: string
  nom: string
  type: TypeClient
  contact: string
  email: string
  telephone: string
  adresse: string
  codePostal: string
  ville: string
  siret: string
  delaiPaiement: number
  grilleTarifaire: string
  notes: string
}

export type Produit = {
  id: string
  reference: string
  nom: string
  description: string
  categorie: string
  prixHT: number
  tva: number
  unite: string
  actif: boolean
}

export type GrilleTarifaire = {
  id: string
  nom: string
  description: string
  /** Coefficient appliqué au prix catalogue. 1 = prix public. */
  coefficient: number
  actif: boolean
}

export type ModeleFacture = {
  id: string
  nom: string
  description: string
  mentions: string
  conditions: string
  pied: string
  defaut: boolean
  actif: boolean
}

export type Numerotation = {
  id: 'facture' | 'avoir'
  libelle: string
  prefixe: string
  /** Motif d'affichage, à titre documentaire. */
  format: string
  prochain: number
  longueur: number
  remiseAZeroAnnuelle: boolean
}

export type StatutFacture = 'brouillon' | 'envoyee' | 'payee' | 'retard' | 'annulee'

export type LigneFacture = {
  id: string
  produitId: string | null
  designation: string
  quantite: number
  unite: string
  prixHT: number
  tva: number
  remise: number
}

export type MoyenReglement = 'virement' | 'cheque' | 'carte' | 'especes' | 'prelevement'

export const moyenReglementLabels: Record<MoyenReglement, string> = {
  virement: 'Virement',
  cheque: 'Chèque',
  carte: 'Carte bancaire',
  especes: 'Espèces',
  prelevement: 'Prélèvement',
}

export type ReglementFacture = {
  id: string
  montant: number
  date: string
  moyen: MoyenReglement
  reference: string
}

export type Relance = {
  id: string
  niveau: 1 | 2 | 3
  date: string
  canal: 'email' | 'courrier' | 'telephone'
  objet: string
}

export type DocumentFacture = {
  id: string
  nom: string
  type: string
  taille: string
  ajouteLe: string
}

export type EvenementFacture = {
  id: string
  quand: string
  auteur: string
  libelle: string
  detail?: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

export type Facture = {
  id: string
  numero: string
  type: 'facture' | 'avoir'
  clientId: string
  modeleId: string
  date: string
  echeance: string
  objet: string
  reference: string
  statut: StatutFacture
  lignes: LigneFacture[]
  reglements: ReglementFacture[]
  relances: Relance[]
  documents: DocumentFacture[]
  historique: EvenementFacture[]
  notes: string
  /** Renseigné pour un avoir : la facture qu'il annule ou corrige. */
  factureOrigineId: string | null
  envoyeeLe: string | null
  annuleeLe: string | null
  motifAnnulation: string
}

/* ------------------------------------------------------------------ */
/* Calculs                                                             */
/* ------------------------------------------------------------------ */

const arrondi = (n: number) => Math.round(n * 100) / 100

export function ligneHT(l: LigneFacture) {
  return arrondi(l.quantite * l.prixHT * (1 - l.remise / 100))
}
export function ligneTVA(l: LigneFacture) {
  return arrondi(ligneHT(l) * (l.tva / 100))
}
export function totalHT(f: Facture) {
  return arrondi(f.lignes.reduce((s, l) => s + ligneHT(l), 0))
}
export function totalTVA(f: Facture) {
  return arrondi(f.lignes.reduce((s, l) => s + ligneTVA(l), 0))
}
export function totalTTC(f: Facture) {
  return arrondi(totalHT(f) + totalTVA(f))
}
export function totalRegle(f: Facture) {
  return arrondi(f.reglements.reduce((s, r) => s + r.montant, 0))
}
export function resteDuFacture(f: Facture) {
  return arrondi(Math.max(0, totalTTC(f) - totalRegle(f)))
}
export function joursRetard(f: Facture) {
  return Math.round((AUJOURDHUI_FACT.getTime() - new Date(f.echeance).getTime()) / 86400000)
}

/** Le statut « en retard » se déduit de l'échéance : il n'est jamais stocké. */
export function statutFacture(f: Facture): StatutFacture {
  if (f.statut === 'annulee' || f.statut === 'brouillon' || f.statut === 'payee') return f.statut
  // Un avoir n'appelle pas de règlement : il ne peut donc pas être « en retard ».
  if (f.type === 'avoir') return 'envoyee'
  if (resteDuFacture(f) === 0 && f.lignes.length > 0) return 'payee'
  if (joursRetard(f) > 0) return 'retard'
  return 'envoyee'
}

export function ventilationTVA(f: Facture) {
  const m = new Map<number, { base: number; montant: number }>()
  for (const l of f.lignes) {
    const e = m.get(l.tva) ?? { base: 0, montant: 0 }
    e.base = arrondi(e.base + ligneHT(l))
    e.montant = arrondi(e.montant + ligneTVA(l))
    m.set(l.tva, e)
  }
  return Array.from(m.entries())
    .map(([taux, v]) => ({ taux, ...v }))
    .sort((a, b) => a.taux - b.taux)
}

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

export const grillesInitiales: GrilleTarifaire[] = [
  { id: 'gt-public', nom: 'Tarif public', description: 'Prix catalogue, appliqué par défaut.', coefficient: 1, actif: true },
  { id: 'gt-adherent', nom: 'Tarif adhérent', description: 'Remise de 20 % réservée aux structures adhérentes.', coefficient: 0.8, actif: true },
  { id: 'gt-collectivite', nom: 'Tarif collectivité', description: 'Grille négociée avec les collectivités partenaires.', coefficient: 0.9, actif: true },
  { id: 'gt-solidaire', nom: 'Tarif solidaire', description: 'Associations à petit budget, sur décision du bureau.', coefficient: 0.6, actif: false },
]

export const produitsInitiaux: Produit[] = [
  { id: 'pr-salle-j', reference: 'LOC-SAL-J', nom: 'Location de la grande salle — journée', description: 'Salle de 120 places, sonorisation incluse.', categorie: 'Location', prixHT: 280, tva: 20, unite: 'journée', actif: true },
  { id: 'pr-salle-d', reference: 'LOC-SAL-D', nom: 'Location de la grande salle — demi-journée', description: 'Créneau de quatre heures.', categorie: 'Location', prixHT: 160, tva: 20, unite: 'demi-journée', actif: true },
  { id: 'pr-atelier', reference: 'LOC-ATE', nom: 'Location de l’atelier', description: 'Salle de 30 places avec matériel léger.', categorie: 'Location', prixHT: 90, tva: 20, unite: 'journée', actif: true },
  { id: 'pr-anim', reference: 'PRE-ANI', nom: 'Animation d’atelier', description: 'Intervention d’un animateur, deux heures.', categorie: 'Prestation', prixHT: 120, tva: 0, unite: 'séance', actif: true },
  { id: 'pr-stage', reference: 'PRE-STA', nom: 'Stage thématique', description: 'Stage sur une journée, groupe de douze personnes.', categorie: 'Prestation', prixHT: 480, tva: 0, unite: 'stage', actif: true },
  { id: 'pr-regie', reference: 'PRE-REG', nom: 'Régie technique', description: 'Technicien son et lumière.', categorie: 'Prestation', prixHT: 220, tva: 20, unite: 'représentation', actif: true },
  { id: 'pr-format', reference: 'PRE-FOR', nom: 'Formation bénévoles', description: 'Module d’une journée,douze participants.', categorie: 'Formation', prixHT: 650, tva: 0, unite: 'session', actif: true },
  { id: 'pr-buvette', reference: 'VEN-BUV', nom: 'Prestation buvette', description: 'Tenue de buvette sur un événement.', categorie: 'Vente', prixHT: 150, tva: 10, unite: 'événement', actif: true },
  { id: 'pr-repas', reference: 'VEN-REP', nom: 'Plateau-repas', description: 'Repas complet servi sur place.', categorie: 'Vente', prixHT: 14, tva: 10, unite: 'repas', actif: true },
  { id: 'pr-sponsor', reference: 'PAR-SPO', nom: 'Encart partenaire', description: 'Visibilité sur les supports de la saison.', categorie: 'Partenariat', prixHT: 400, tva: 20, unite: 'saison', actif: true },
  { id: 'pr-adhcol', reference: 'ADH-COL', nom: 'Adhésion collective', description: 'Adhésion d’une structure pour l’année.', categorie: 'Adhésion', prixHT: 180, tva: 0, unite: 'année', actif: true },
  { id: 'pr-materiel', reference: 'LOC-MAT', nom: 'Location de matériel scénique', description: 'Pack projecteurs et pieds.', categorie: 'Location', prixHT: 75, tva: 20, unite: 'week-end', actif: false },
]

export const modelesInitiaux: ModeleFacture[] = [
  {
    id: 'md-standard',
    nom: 'Modèle standard',
    description: 'Utilisé pour la plupart des clients.',
    mentions: 'Association loi 1901 déclarée en préfecture de Loire-Atlantique. TVA applicable selon les prestations.',
    conditions: 'Paiement à 30 jours date de facture. Pénalités de retard au taux légal, indemnité forfaitaire de recouvrement de 40 €.',
    pied: 'Les Amis du Vieux Moulin — 12 rue des Trois-Croissants, 44000 Nantes',
    defaut: true,
    actif: true,
  },
  {
    id: 'md-collectivite',
    nom: 'Modèle collectivité',
    description: 'Mentions attendues par les services de gestion publique.',
    mentions: 'Facture émise dans le cadre de la convention pluriannuelle d’objectifs. Numéro d’engagement à rappeler au règlement.',
    conditions: 'Paiement à 45 jours fin de mois, par mandat administratif.',
    pied: 'Les Amis du Vieux Moulin — SIRET 812 456 789 00021',
    defaut: false,
    actif: true,
  },
  {
    id: 'md-partenaire',
    nom: 'Modèle partenaire',
    description: 'Associations et structures adhérentes.',
    mentions: 'Tarif adhérent appliqué au titre de la saison en cours.',
    conditions: 'Paiement à 15 jours. Règlement par virement de préférence.',
    pied: 'Les Amis du Vieux Moulin — contact@vieuxmoulin.fr',
    defaut: false,
    actif: true,
  },
]

export const numerotationInitiale: Numerotation[] = [
  { id: 'facture', libelle: 'Factures', prefixe: 'F', format: 'F-{AAAA}-{0000}', prochain: 63, longueur: 4, remiseAZeroAnnuelle: true },
  { id: 'avoir', libelle: 'Avoirs', prefixe: 'AV', format: 'AV-{AAAA}-{000}', prochain: 9, longueur: 3, remiseAZeroAnnuelle: true },
]

export const clientsInitiaux: Client[] = [
  { id: 'cl-1', nom: 'Ville de Nantes', type: 'collectivite', contact: 'Service vie associative', email: 'vie.associative@exemple-nantes.fr', telephone: '02 40 41 90 00', adresse: '2 rue de l’Hôtel de Ville', codePostal: '44000', ville: 'Nantes', siret: '214 401 095 00018', delaiPaiement: 45, grilleTarifaire: 'gt-collectivite', notes: 'Mandat administratif, joindre le numéro d’engagement.' },
  { id: 'cl-2', nom: 'Conseil départemental de Loire-Atlantique', type: 'collectivite', contact: 'Direction de la culture', email: 'culture@exemple-cd44.fr', telephone: '02 40 99 10 00', adresse: '3 quai Ceineray', codePostal: '44000', ville: 'Nantes', siret: '224 400 028 00015', delaiPaiement: 45, grilleTarifaire: 'gt-collectivite', notes: '' },
  { id: 'cl-3', nom: 'Coopérative Grand Ouest', type: 'entreprise', contact: 'Marie Lemoine', email: 'm.lemoine@exemple-cgo.fr', telephone: '02 51 82 34 10', adresse: '14 boulevard de la Prairie', codePostal: '44300', ville: 'Nantes', siret: '451 887 223 00034', delaiPaiement: 30, grilleTarifaire: 'gt-public', notes: 'Partenaire depuis 2022.' },
  { id: 'cl-4', nom: 'Imprimerie du Moulin', type: 'entreprise', contact: 'Farid Leclerc', email: 'contact@exemple-imprimoulin.fr', telephone: '02 40 76 12 08', adresse: '5 rue des Ormeaux', codePostal: '44100', ville: 'Nantes', siret: '390 221 664 00019', delaiPaiement: 30, grilleTarifaire: 'gt-public', notes: '' },
  { id: 'cl-5', nom: 'Association Rives et Rivages', type: 'association', contact: 'Solène Prigent', email: 'bureau@exemple-rivesetrivages.fr', telephone: '02 97 63 41 22', adresse: '9 place Sainte-Anne', codePostal: '56000', ville: 'Vannes', siret: '789 456 123 00027', delaiPaiement: 15, grilleTarifaire: 'gt-adherent', notes: 'Structure adhérente, tarif préférentiel.' },
  { id: 'cl-6', nom: 'Comité des fêtes de Bellevue', type: 'association', contact: 'Étienne Le Gall', email: 'comite@exemple-bellevue.fr', telephone: '02 40 58 77 91', adresse: '22 avenue Jean-Jaurès', codePostal: '44600', ville: 'Saint-Nazaire', siret: '512 334 908 00013', delaiPaiement: 15, grilleTarifaire: 'gt-adherent', notes: '' },
  { id: 'cl-7', nom: 'Lycée Jules-Verne', type: 'collectivite', contact: 'Intendance', email: 'intendance@exemple-lyceeverne.fr', telephone: '02 40 12 55 40', adresse: '3 route de Vannes', codePostal: '44800', ville: 'Saint-Herblain', siret: '194 400 121 00011', delaiPaiement: 45, grilleTarifaire: 'gt-collectivite', notes: '' },
  { id: 'cl-8', nom: 'Brasserie de l’Erdre', type: 'entreprise', contact: 'Corentin Balland', email: 'contact@exemple-brasserieerdre.fr', telephone: '02 40 29 66 03', adresse: '17 quai de la Fosse', codePostal: '44000', ville: 'Nantes', siret: '833 902 471 00025', delaiPaiement: 30, grilleTarifaire: 'gt-public', notes: 'Sponsor de la fête annuelle.' },
  { id: 'cl-9', nom: 'Fédération Solidarité Ouest', type: 'association', contact: 'Gaëlle Sané', email: 'secretariat@exemple-fso.fr', telephone: '02 98 44 21 60', adresse: '8 rue du Général-Leclerc', codePostal: '29200', ville: 'Brest', siret: '677 210 553 00016', delaiPaiement: 30, grilleTarifaire: 'gt-adherent', notes: '' },
  { id: 'cl-10', nom: 'Hélène Vanhove', type: 'particulier', contact: 'Hélène Vanhove', email: 'helene.vanhove@exemple.fr', telephone: '06 42 18 33 07', adresse: '41 allée des Peupliers', codePostal: '44300', ville: 'Nantes', siret: '', delaiPaiement: 15, grilleTarifaire: 'gt-public', notes: 'Location de salle pour un événement familial.' },
  { id: 'cl-11', nom: 'Compagnie du Grand Vent', type: 'association', contact: 'Manon Cottereau', email: 'production@exemple-grandvent.fr', telephone: '02 51 44 08 92', adresse: '6 impasse du Vieux-Moulin', codePostal: '44000', ville: 'Nantes', siret: '901 556 332 00029', delaiPaiement: 15, grilleTarifaire: 'gt-adherent', notes: '' },
  { id: 'cl-12', nom: 'Groupe Armor Services', type: 'entreprise', contact: 'Bastien Ouedraogo', email: 'achats@exemple-armorservices.fr', telephone: '02 96 33 71 45', adresse: '28 boulevard de la Liberté', codePostal: '35000', ville: 'Rennes', siret: '742 019 885 00042', delaiPaiement: 30, grilleTarifaire: 'gt-public', notes: 'Paiement souvent en retard, relances fréquentes.' },
]

/* ------------------------------------------------------------------ */
/* Génération des factures                                             */
/* ------------------------------------------------------------------ */

const objets = [
  'Location de salle et régie',
  'Atelier jeunesse — trimestre',
  'Prestation d’animation',
  'Stage thématique',
  'Partenariat de saison',
  'Adhésion collective et formation',
  'Buvette de la fête annuelle',
  'Location de l’atelier',
  'Formation des bénévoles',
  'Représentation et régie technique',
]

const auteurs = ['Camille Beauchamp', 'Yanis Traoré', 'Élodie Nguyen']

function pick<T>(a: T[], i: number): T {
  return a[((i % a.length) + a.length) % a.length]
}

function jour(base: Date, d: number) {
  return new Date(base.getTime() + d * 86400000).toISOString()
}

function coefficient(client: Client) {
  return grillesInitiales.find((g) => g.id === client.grilleTarifaire)?.coefficient ?? 1
}

let seq = 0

function creerFacture(i: number): Facture {
  seq++
  const client = pick(clientsInitiaux, i * 5 + 1)
  const coef = coefficient(client)
  const decalage = -330 + ((i * 23) % 340) // de −330 à +9 jours
  const date = jour(AUJOURDHUI_FACT, decalage)
  const echeance = jour(new Date(date), client.delaiPaiement)
  const annee = new Date(date).getUTCFullYear()

  const nbLignes = 1 + (i % 3)
  const lignes: LigneFacture[] = Array.from({ length: nbLignes }, (_, k) => {
    const p = pick(produitsInitiaux.filter((x) => x.actif), i * 3 + k)
    return {
      id: `lf-${seq}-${k}`,
      produitId: p.id,
      designation: p.nom,
      quantite: 1 + ((i + k) % 4),
      unite: p.unite,
      prixHT: arrondi(p.prixHT * coef),
      tva: p.tva,
      remise: (i + k) % 9 === 0 ? 10 : 0,
    }
  })

  const brouillon = decalage > -70 && i % 4 === 2
  const annulee = i % 17 === 6
  const enveloppe: Facture = {
    id: `fa-${seq}`,
    numero: `F-${annee}-${String(1000 + i).slice(-4)}`,
    type: 'facture',
    clientId: client.id,
    modeleId:
      client.type === 'collectivite' ? 'md-collectivite' : client.type === 'association' ? 'md-partenaire' : 'md-standard',
    date,
    echeance,
    objet: pick(objets, i * 3),
    reference: client.type === 'collectivite' ? `ENG-${annee}-${String(200 + i)}` : `BC-${String(500 + i * 3)}`,
    statut: brouillon ? 'brouillon' : annulee ? 'annulee' : 'envoyee',
    lignes,
    reglements: [],
    relances: [],
    documents: [],
    historique: [],
    notes: i % 7 === 0 ? 'Convention signée en annexe.' : '',
    factureOrigineId: null,
    envoyeeLe: brouillon ? null : jour(new Date(date), 1),
    annuleeLe: annulee ? jour(new Date(date), 12) : null,
    motifAnnulation: annulee ? 'Prestation annulée par le client.' : '',
  }

  const ttc = totalTTC(enveloppe)
  const echu = new Date(echeance).getTime() < AUJOURDHUI_FACT.getTime()

  if (!brouillon && !annulee) {
    // Réglée dans la plupart des cas ; quelques impayées et un règlement partiel
    if (i % 11 === 4) {
      // reste impayée
    } else if (i % 13 === 5) {
      enveloppe.reglements.push({
        id: `rg-${seq}-a`,
        montant: arrondi(ttc / 2),
        date: jour(new Date(echeance), -3),
        moyen: 'virement',
        reference: `VIR-${annee}-${String(400 + i)}`,
      })
    } else if (echu || i % 3 === 0) {
      enveloppe.reglements.push({
        id: `rg-${seq}`,
        montant: ttc,
        date: jour(new Date(echeance), -4 + (i % 9)),
        moyen: pick(['virement', 'cheque', 'carte', 'prelevement'] as MoyenReglement[], i),
        reference: `VIR-${annee}-${String(300 + i)}`,
      })
      enveloppe.statut = 'payee'
    }
  }

  // Relances sur les factures échues non soldées
  if (statutFacture(enveloppe) === 'retard') {
    const retard = joursRetard(enveloppe)
    const niveaux: (1 | 2 | 3)[] = retard > 45 ? [1, 2, 3] : retard > 21 ? [1, 2] : [1]
    enveloppe.relances = niveaux.map((n) => ({
      id: `rl-${seq}-${n}`,
      niveau: n,
      date: jour(new Date(echeance), n === 1 ? 7 : n === 2 ? 21 : 45),
      canal: n === 3 ? 'courrier' : 'email',
      objet: n === 1 ? 'Rappel d’échéance' : n === 2 ? 'Relance — facture impayée' : 'Mise en demeure avant recouvrement',
    }))
  }

  if (i % 4 === 1) {
    enveloppe.documents.push({
      id: `df-${seq}`,
      nom: `Convention-${enveloppe.numero}.pdf`,
      type: 'Convention',
      taille: `${180 + ((i * 53) % 900)} Ko`,
      ajouteLe: jour(new Date(date), 2),
    })
  }

  // Historique
  const h: EvenementFacture[] = [
    { id: `ef-${seq}-1`, quand: date, auteur: pick(auteurs, i), libelle: 'Facture créée', detail: `${lignes.length} ligne(s), ${arrondi(ttc)} € TTC.`, tone: 'neutral' },
  ]
  if (enveloppe.envoyeeLe) {
    h.push({ id: `ef-${seq}-2`, quand: enveloppe.envoyeeLe, auteur: pick(auteurs, i + 1), libelle: 'Facture envoyée', detail: `Envoyée à ${client.email}.`, tone: 'success' })
  }
  for (const r of enveloppe.relances) {
    h.push({ id: `ef-${seq}-r${r.niveau}`, quand: r.date, auteur: 'Système', libelle: `Relance niveau ${r.niveau}`, detail: r.objet, tone: 'warning' })
  }
  for (const r of enveloppe.reglements) {
    h.push({ id: `ef-${seq}-p-${r.id}`, quand: r.date, auteur: pick(auteurs, i + 2), libelle: 'Règlement enregistré', detail: `${r.montant} € par ${moyenReglementLabels[r.moyen].toLowerCase()}.`, tone: 'success' })
  }
  if (enveloppe.annuleeLe) {
    h.push({ id: `ef-${seq}-x`, quand: enveloppe.annuleeLe, auteur: pick(auteurs, i), libelle: 'Facture annulée', detail: enveloppe.motifAnnulation, tone: 'danger' })
  }
  enveloppe.historique = h.sort((a, b) => (a.quand < b.quand ? 1 : -1))

  return enveloppe
}

const factures: Facture[] = Array.from({ length: 46 }, (_, i) => creerFacture(i))

// Un brouillon complet, prêt à être envoyé
factures.push({
  id: 'fa-sans-ligne',
  numero: 'F-2026-0062',
  type: 'facture',
  clientId: 'cl-3',
  modeleId: 'md-standard',
  date: jour(AUJOURDHUI_FACT, -2),
  echeance: jour(AUJOURDHUI_FACT, 28),
  objet: 'Location de la grande salle — novembre',
  reference: 'BC-742',
  statut: 'brouillon',
  lignes: [
    { id: 'lg-sl-1', produitId: 'pr-salle-j', designation: 'Location de la grande salle — journée', quantite: 2, unite: 'journée', prixHT: 280, tva: 20, remise: 0 },
    { id: 'lg-sl-2', produitId: 'pr-regie', designation: 'Régie technique', quantite: 1, unite: 'représentation', prixHT: 220, tva: 20, remise: 0 },
  ],
  reglements: [],
  relances: [],
  documents: [],
  historique: [
    { id: 'ef-sl-1', quand: jour(AUJOURDHUI_FACT, -2), auteur: 'Camille Beauchamp', libelle: 'Facture créée', detail: 'Brouillon complet, en attente d’envoi.', tone: 'neutral' },
  ],
  notes: 'À envoyer dès accord du client sur les dates.',
  factureOrigineId: null,
  envoyeeLe: null,
  annuleeLe: null,
  motifAnnulation: '',
})

// Quelques avoirs adossés à des factures existantes
const avoirs: Facture[] = [0, 1, 2].map((k) => {
  const origine = factures[7 + k * 9]
  const date = jour(new Date(origine.date), 25)
  return {
    id: `av-${k}`,
    numero: `AV-${new Date(date).getUTCFullYear()}-${String(101 + k).slice(-3)}`,
    type: 'avoir',
    clientId: origine.clientId,
    modeleId: origine.modeleId,
    date,
    echeance: date,
    objet: `Avoir sur la facture ${origine.numero}`,
    reference: origine.numero,
    statut: 'envoyee',
    lignes: origine.lignes.slice(0, 1).map((l, j) => ({ ...l, id: `lav-${k}-${j}`, quantite: 1 })),
    reglements: [],
    relances: [],
    documents: [],
    historique: [
      { id: `eav-${k}-1`, quand: date, auteur: 'Yanis Traoré', libelle: 'Avoir créé', detail: `Adossé à la facture ${origine.numero}.`, tone: 'neutral' },
      { id: `eav-${k}-2`, quand: jour(new Date(date), 1), auteur: 'Yanis Traoré', libelle: 'Avoir envoyé', detail: 'Transmis au client par e-mail.', tone: 'success' },
    ],
    notes: k === 0 ? 'Prestation partiellement annulée.' : 'Erreur de facturation corrigée.',
    factureOrigineId: origine.id,
    envoyeeLe: jour(new Date(date), 1),
    annuleeLe: null,
    motifAnnulation: '',
  }
})

export const facturesInitiales: Facture[] = [...factures, ...avoirs].sort((a, b) => (a.date < b.date ? 1 : -1))

/**
 * Variante de démonstration : un brouillon sans ligne, donc non envoyable.
 */
export function facturesSansLigne(): Facture[] {
  return facturesInitiales.map((f) =>
    f.id === 'fa-sans-ligne'
      ? { ...f, lignes: [], objet: 'Prestation à préciser', notes: 'Devis en attente de retour du client.' }
      : f,
  )
}

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpisFacturation = {
  facturesEmises: number
  chiffreAffairesHT: number
  encaisse: number
  enAttente: number
  enRetard: number
  montantRetard: number
  brouillons: number
  delaiMoyenPaiement: number
  avoirs: number
  montantAvoirs: number
}

export function calculerKpisFacturation(liste: Facture[]): KpisFacturation {
  const fact = liste.filter((f) => f.type === 'facture')
  const av = liste.filter((f) => f.type === 'avoir')
  const emises = fact.filter((f) => statutFacture(f) !== 'brouillon' && statutFacture(f) !== 'annulee')

  const delais = fact
    .filter((f) => f.reglements.length > 0)
    .map((f) => {
      const dernier = [...f.reglements].sort((a, b) => (a.date < b.date ? 1 : -1))[0]
      return Math.round((new Date(dernier.date).getTime() - new Date(f.date).getTime()) / 86400000)
    })
    .filter((d) => d >= 0)

  const enRetard = fact.filter((f) => statutFacture(f) === 'retard')

  return {
    facturesEmises: emises.length,
    chiffreAffairesHT: arrondi(emises.reduce((s, f) => s + totalHT(f), 0)),
    encaisse: arrondi(fact.reduce((s, f) => s + totalRegle(f), 0)),
    enAttente: arrondi(emises.filter((f) => statutFacture(f) === 'envoyee').reduce((s, f) => s + resteDuFacture(f), 0)),
    enRetard: enRetard.length,
    montantRetard: arrondi(enRetard.reduce((s, f) => s + resteDuFacture(f), 0)),
    brouillons: fact.filter((f) => f.statut === 'brouillon').length,
    delaiMoyenPaiement: delais.length === 0 ? 0 : Math.round(delais.reduce((s, d) => s + d, 0) / delais.length),
    avoirs: av.length,
    montantAvoirs: arrondi(av.reduce((s, f) => s + totalTTC(f), 0)),
  }
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function serieChiffreAffaires(liste: Facture[]) {
  const points: { label: string; valeur: number }[] = []
  for (let k = 11; k >= 0; k--) {
    const debut = new Date(Date.UTC(AUJOURDHUI_FACT.getUTCFullYear(), AUJOURDHUI_FACT.getUTCMonth() - k, 1))
    const fin = new Date(Date.UTC(AUJOURDHUI_FACT.getUTCFullYear(), AUJOURDHUI_FACT.getUTCMonth() - k + 1, 0, 23, 59))
    const valeur = liste
      .filter((f) => f.type === 'facture' && statutFacture(f) !== 'brouillon' && statutFacture(f) !== 'annulee')
      .filter((f) => {
        const t = new Date(f.date).getTime()
        return t >= debut.getTime() && t <= fin.getTime()
      })
      .reduce((s, f) => s + totalHT(f), 0)
    points.push({ label: `${MOIS[debut.getUTCMonth()]} ${String(debut.getUTCFullYear()).slice(2)}`, valeur: Math.round(valeur) })
  }
  return points
}

export function repartitionParClient(liste: Facture[], clients: Client[]) {
  const m = new Map<string, number>()
  for (const f of liste) {
    if (f.type !== 'facture' || statutFacture(f) === 'brouillon' || statutFacture(f) === 'annulee') continue
    m.set(f.clientId, arrondi((m.get(f.clientId) ?? 0) + totalHT(f)))
  }
  return Array.from(m.entries())
    .map(([id, valeur]) => ({ label: clients.find((c) => c.id === id)?.nom ?? id, valeur: Math.round(valeur) }))
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 6)
}

export function encoursParAnciennete(liste: Facture[]) {
  const tranches = [
    { label: 'Non échu', min: -9999, max: 0 },
    { label: '1 à 30 j', min: 1, max: 30 },
    { label: '31 à 60 j', min: 31, max: 60 },
    { label: 'Plus de 60 j', min: 61, max: 99999 },
  ]
  return tranches.map((t) => ({
    label: t.label,
    valeur: Math.round(
      liste
        .filter((f) => f.type === 'facture' && ['envoyee', 'retard'].includes(statutFacture(f)))
        .filter((f) => {
          const r = joursRetard(f)
          return r >= t.min && r <= t.max
        })
        .reduce((s, f) => s + resteDuFacture(f), 0),
    ),
  }))
}
