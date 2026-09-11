import type { StatusTone } from './mock'

/* ------------------------------------------------------------------ */
/* Repères temporels                                                   */
/* ------------------------------------------------------------------ */

/** Date de référence de la démonstration. Toute la logique de cycle de vie en découle. */
export const AUJOURDHUI = new Date('2026-09-01T00:00:00Z')

/** Un exercice court du 1ᵉʳ septembre au 31 août. */
export const EXERCICES = ['2021-2022', '2022-2023', '2023-2024', '2024-2025', '2025-2026', '2026-2027'] as const
export type Exercice = (typeof EXERCICES)[number]

export const EXERCICE_COURANT: Exercice = '2026-2027'

export function exercicePour(iso: string): Exercice {
  const d = new Date(iso)
  const annee = d.getUTCMonth() >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1
  return `${annee}-${annee + 1}` as Exercice
}

export function joursAvant(iso: string) {
  return Math.round((new Date(iso).getTime() - AUJOURDHUI.getTime()) / 86400000)
}

export function age(dateNaissance: string) {
  const n = new Date(dateNaissance)
  let a = AUJOURDHUI.getUTCFullYear() - n.getUTCFullYear()
  const m = AUJOURDHUI.getUTCMonth() - n.getUTCMonth()
  if (m < 0 || (m === 0 && AUJOURDHUI.getUTCDate() < n.getUTCDate())) a--
  return a
}

export const TRANCHES_AGE = ['Moins de 18', '18–25', '26–40', '41–60', 'Plus de 60'] as const
export type TrancheAge = (typeof TRANCHES_AGE)[number]

export function trancheAge(dateNaissance: string): TrancheAge {
  const a = age(dateNaissance)
  if (a < 18) return 'Moins de 18'
  if (a <= 25) return '18–25'
  if (a <= 40) return '26–40'
  if (a <= 60) return '41–60'
  return 'Plus de 60'
}

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type TypeAdhesion = {
  id: string
  nom: string
  description: string
  montant: number
  dureeMois: number
  publicVise: string
  actif: boolean
  /** Renouvellement tacite proposé à l'échéance. */
  reconduction: boolean
}

export type StatutAdhesion = 'active' | 'expirant' | 'expiree' | 'resiliee'

export type StatutCotisation = 'payee' | 'partielle' | 'attente' | 'retard' | 'annulee'

export type MoyenPaiement = 'carte' | 'virement' | 'cheque' | 'especes' | 'prelevement'

export const moyenLabels: Record<MoyenPaiement, string> = {
  carte: 'Carte bancaire',
  virement: 'Virement',
  cheque: 'Chèque',
  especes: 'Espèces',
  prelevement: 'Prélèvement',
}

export type Paiement = {
  id: string
  cotisationId: string
  montant: number
  date: string
  moyen: MoyenPaiement
  reference: string
  statut: 'valide' | 'attente' | 'rejete'
  encaissePar: string
}

export type Cotisation = {
  id: string
  exercice: Exercice
  typeNom: string
  montant: number
  emiseLe: string
  echeanceLe: string
  statut: StatutCotisation
}

export type DocumentAdherent = {
  id: string
  nom: string
  categorie: string
  taille: string
  ajouteLe: string
  ajoutePar: string
}

export type EvenementAdhesion = {
  id: string
  quand: string
  auteur: string
  libelle: string
  detail?: string
  tone: StatusTone
}

export type Adherent = {
  id: string
  numero: string
  civilite: 'Madame' | 'Monsieur' | 'Non précisé'
  prenom: string
  nom: string
  email: string
  telephone: string
  dateNaissance: string
  ville: string
  codePostal: string
  typeId: string
  /** Première adhésion, tous exercices confondus. */
  premiereAdhesion: string
  dateDebut: string
  dateFin: string
  resilieeLe: string | null
  motifResiliation: string
  cotisations: Cotisation[]
  paiements: Paiement[]
  documents: DocumentAdherent[]
  historique: EvenementAdhesion[]
  notes: string
}

/* ------------------------------------------------------------------ */
/* Cycle de vie                                                        */
/* ------------------------------------------------------------------ */

/** Seuil au-delà duquel une adhésion est signalée comme expirant bientôt. */
export const SEUIL_EXPIRATION_JOURS = 45

export function statutAdhesion(a: Adherent): StatutAdhesion {
  if (a.resilieeLe) return 'resiliee'
  const j = joursAvant(a.dateFin)
  if (j < 0) return 'expiree'
  if (j <= SEUIL_EXPIRATION_JOURS) return 'expirant'
  return 'active'
}

export function resteDu(a: Adherent, cotisationId?: string) {
  const cotisations = cotisationId ? a.cotisations.filter((c) => c.id === cotisationId) : a.cotisations
  return cotisations.reduce((total, c) => {
    if (c.statut === 'annulee') return total
    const paye = a.paiements
      .filter((p) => p.cotisationId === c.id && p.statut === 'valide')
      .reduce((s, p) => s + p.montant, 0)
    return total + Math.max(0, c.montant - paye)
  }, 0)
}

export function montantPaye(a: Adherent, cotisationId: string) {
  return a.paiements
    .filter((p) => p.cotisationId === cotisationId && p.statut === 'valide')
    .reduce((s, p) => s + p.montant, 0)
}

/* ------------------------------------------------------------------ */
/* Référentiel des types d'adhésion                                    */
/* ------------------------------------------------------------------ */

export const typesInitiaux: TypeAdhesion[] = [
  {
    id: 'ta-individuelle',
    nom: 'Individuelle',
    description: 'Adhésion nominative, accès à toutes les sections.',
    montant: 45,
    dureeMois: 12,
    publicVise: 'Adulte',
    actif: true,
    reconduction: true,
  },
  {
    id: 'ta-famille',
    nom: 'Famille',
    description: 'Deux adultes et leurs enfants mineurs au même foyer.',
    montant: 80,
    dureeMois: 12,
    publicVise: 'Foyer',
    actif: true,
    reconduction: true,
  },
  {
    id: 'ta-etudiant',
    nom: 'Étudiant',
    description: 'Sur présentation d’un certificat de scolarité.',
    montant: 20,
    dureeMois: 12,
    publicVise: '18–25 ans',
    actif: true,
    reconduction: false,
  },
  {
    id: 'ta-jeune',
    nom: 'Jeune',
    description: 'Ateliers jeunesse, autorisation parentale obligatoire.',
    montant: 15,
    dureeMois: 12,
    publicVise: 'Moins de 18 ans',
    actif: true,
    reconduction: false,
  },
  {
    id: 'ta-bienfaiteur',
    nom: 'Bienfaiteur',
    description: 'Soutien libre à partir de 150 €, reçu fiscal émis.',
    montant: 150,
    dureeMois: 12,
    publicVise: 'Adulte',
    actif: true,
    reconduction: true,
  },
  {
    id: 'ta-decouverte',
    nom: 'Découverte',
    description: 'Trois mois d’essai, non renouvelable. Formule suspendue.',
    montant: 12,
    dureeMois: 3,
    publicVise: 'Tout public',
    actif: false,
    reconduction: false,
  },
]

/* ------------------------------------------------------------------ */
/* Génération des 60 adhérents                                         */
/* ------------------------------------------------------------------ */

const identites: [Adherent['civilite'], string, string][] = [
  ['Madame', 'Camille', 'Beauchamp'], ['Monsieur', 'Yanis', 'Traoré'], ['Madame', 'Awa', 'Diallo'],
  ['Monsieur', 'Thibault', 'Lemoine'], ['Madame', 'Léa', 'Da Costa'], ['Monsieur', 'Moussa', 'Rivière'],
  ['Madame', 'Élodie', 'Nguyen'], ['Monsieur', 'Hugo', 'Fournier'], ['Madame', 'Fatou', 'Bertrand'],
  ['Monsieur', 'Nathan', 'Marchand'], ['Madame', 'Inès', 'Kouassi'], ['Monsieur', 'Rémi', 'Vasseur'],
  ['Madame', 'Sarah', 'Perrin'], ['Monsieur', 'Malik', 'Benali'], ['Madame', 'Chloé', 'Lacroix'],
  ['Monsieur', 'Antoine', 'Hoarau'], ['Madame', 'Nour', 'Guérin'], ['Madame', 'Gaëlle', 'Sané'],
  ['Monsieur', 'Pierre-Yves', 'Delaunay'], ['Madame', 'Amina', 'Marois'], ['Monsieur', 'Julien', 'Chevalier'],
  ['Madame', 'Maëva', 'Bamba'], ['Monsieur', 'Karim', 'Rousseau'], ['Madame', 'Solène', 'Prigent'],
  ['Monsieur', 'Étienne', 'Le Gall'], ['Madame', 'Jeanne', 'Morvan'], ['Monsieur', 'Idriss', 'Ferreira'],
  ['Madame', 'Manon', 'Cottereau'], ['Monsieur', 'Bastien', 'Ouedraogo'], ['Madame', 'Anaïs', 'Ricard'],
  ['Monsieur', 'Farid', 'Leclerc'], ['Madame', 'Salomé', 'Béchard'], ['Non précisé', 'Alex', 'Renaudin'],
  ['Madame', 'Océane', 'Tanguy'], ['Monsieur', 'Corentin', 'Balland'], ['Madame', 'Louise', 'Mercier'],
  ['Monsieur', 'Samuel', 'Coulibaly'], ['Madame', 'Zoé', 'Berthier'], ['Monsieur', 'Ludovic', 'Pasquier'],
  ['Madame', 'Hélène', 'Vanhove'], ['Monsieur', 'Mathis', 'Caradec'], ['Madame', 'Sofia', 'Bouchard'],
  ['Monsieur', 'Adrien', 'Jourdain'], ['Madame', 'Lucie', 'Nedelec'], ['Monsieur', 'Théo', 'Gauthier'],
  ['Madame', 'Emma', 'Rolland'], ['Monsieur', 'Vincent', 'Chauvet'], ['Madame', 'Clara', 'Simonin'],
  ['Monsieur', 'Gabriel', 'Kerhervé'], ['Madame', 'Nadia', 'Belkacem'], ['Monsieur', 'Enzo', 'Baptiste'],
  ['Madame', 'Margaux', 'Fontaine'], ['Monsieur', 'Tanguy', 'Le Bris'], ['Madame', 'Rachida', 'Amrani'],
  ['Monsieur', 'Loïc', 'Guillou'], ['Madame', 'Justine', 'Verdier'], ['Monsieur', 'Aymeric', 'Poirier'],
  ['Madame', 'Célia', 'Marchetti'], ['Monsieur', 'Nolan', 'Sauvage'], ['Madame', 'Alice', 'Tessier'],
]

const communes: [string, string][] = [
  ['44000', 'Nantes'], ['35000', 'Rennes'], ['29200', 'Brest'], ['49100', 'Angers'], ['56000', 'Vannes'],
  ['44600', 'Saint-Nazaire'], ['29000', 'Quimper'], ['56100', 'Lorient'], ['72000', 'Le Mans'], ['85000', 'La Roche-sur-Yon'],
]

const encaisseurs = ['Camille Beauchamp', 'Yanis Traoré', 'Élodie Nguyen']
const moyens: MoyenPaiement[] = ['carte', 'virement', 'cheque', 'especes', 'prelevement']

const nomsDocs = [
  'Bulletin d’adhésion signé',
  'Certificat médical',
  'Autorisation parentale',
  'Certificat de scolarité',
  'Reçu fiscal',
]
const categoriesDocs = ['Adhésion', 'Santé', 'Autorisation', 'Justificatif', 'Comptabilité']

function slug(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}

function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length]
}

function jour(base: Date, decalage: number) {
  return new Date(base.getTime() + decalage * 86400000).toISOString()
}

function debutExercice(ex: Exercice) {
  return new Date(Date.UTC(Number(ex.slice(0, 4)), 8, 1)).toISOString()
}

function creerAdherentMock(i: number): Adherent {
  const [civilite, prenom, nom] = identites[i]
  const [codePostal, ville] = pick(communes, i * 3)

  // Répartition des types
  const type =
    i % 17 === 5
      ? typesInitiaux[4] // Bienfaiteur
      : i % 11 === 3
        ? typesInitiaux[3] // Jeune
        : i % 7 === 2
          ? typesInitiaux[2] // Étudiant
          : i % 3 === 1
            ? typesInitiaux[1] // Famille
            : typesInitiaux[0] // Individuelle

  // Âge cohérent avec le type
  const anneeNaissance =
    type.id === 'ta-jeune'
      ? 2011 + (i % 6)
      : type.id === 'ta-etudiant'
        ? 2001 + (i % 6)
        : 1948 + ((i * 7) % 52)
  const dateNaissance = new Date(Date.UTC(anneeNaissance, (i * 5) % 12, ((i * 3) % 27) + 1)).toISOString().slice(0, 10)

  // Échéance de l'adhésion courante : étalée autour de la date de référence
  const decalage = ((i * 37) % 400) - 120 // de −120 à +279 jours
  const dateFin = jour(AUJOURDHUI, decalage)
  const dateDebut = jour(new Date(dateFin), -365)

  // Ancienneté : de 1 à 4 exercices consécutifs, la première adhésion s'en déduit
  const anciennete = 1 + (i % 4)
  const premiereAdhesion = jour(new Date(dateDebut), -365 * (anciennete - 1))

  const resiliee = i % 16 === 9
  const resilieeLe = resiliee ? jour(AUJOURDHUI, -((i % 90) + 10)) : null

  /* --- cotisations : l'exercice courant plus l'historique --- */
  const cotisations: Cotisation[] = []
  const paiements: Paiement[] = []

  for (let k = anciennete - 1; k >= 0; k--) {
    const emiseLe = jour(new Date(dateDebut), -365 * k)
    const echeanceLe = jour(new Date(emiseLe), 30)
    const courante = k === 0
    const id = `cot-${i}-${k}`
    const exercice = exercicePour(emiseLe)

    let statut: StatutCotisation
    if (resiliee && courante) statut = 'annulee'
    else if (!courante) statut = 'payee'
    else if (i % 9 === 4) statut = 'retard'
    else if (i % 7 === 3) statut = 'partielle'
    else if (i % 5 === 1) statut = 'attente'
    else statut = 'payee'

    cotisations.push({ id, exercice, typeNom: type.nom, montant: type.montant, emiseLe, echeanceLe, statut })

    if (statut === 'payee') {
      paiements.push({
        id: `pay-${i}-${k}`,
        cotisationId: id,
        montant: type.montant,
        date: jour(new Date(emiseLe), 2 + (i % 12)),
        moyen: pick(moyens, i + k),
        reference: `PAY-${2023 + (EXERCICES.indexOf(exercice) || 0)}-${String(1000 + i * 3 + k).slice(-4)}`,
        statut: 'valide',
        encaissePar: pick(encaisseurs, i + k),
      })
    } else if (statut === 'partielle') {
      paiements.push({
        id: `pay-${i}-${k}-a`,
        cotisationId: id,
        montant: Math.round(type.montant / 2),
        date: jour(new Date(emiseLe), 3),
        moyen: 'cheque',
        reference: `PAY-2026-${String(2000 + i).slice(-4)}`,
        statut: 'valide',
        encaissePar: pick(encaisseurs, i),
      })
    } else if (statut === 'retard' && i % 18 === 4) {
      paiements.push({
        id: `pay-${i}-${k}-r`,
        cotisationId: id,
        montant: type.montant,
        date: jour(new Date(emiseLe), 12),
        moyen: 'prelevement',
        reference: `PAY-2026-${String(3000 + i).slice(-4)}`,
        statut: 'rejete',
        encaissePar: 'Système',
      })
    }
  }

  /* --- documents --- */
  const documents: DocumentAdherent[] = Array.from({ length: 1 + (i % 3) }, (_, d) => ({
    id: `doca-${i}-${d}`,
    nom: `${pick(nomsDocs, i + d)}.pdf`,
    categorie: pick(categoriesDocs, i + d),
    taille: `${110 + ((i * 41 + d * 77) % 1600)} Ko`,
    ajouteLe: jour(new Date(dateDebut), 4 + d * 9),
    ajoutePar: pick(encaisseurs, i + d),
  }))

  /* --- historique --- */
  const historique: EvenementAdhesion[] = [
    {
      id: `eva-${i}-1`,
      quand: premiereAdhesion,
      auteur: pick(encaisseurs, i),
      libelle: 'Première adhésion',
      detail: `Formule ${type.nom}, ${type.montant} €.`,
      tone: 'success',
    },
  ]
  for (let k = anciennete - 1; k > 0; k--) {
    historique.push({
      id: `eva-${i}-r${k}`,
      quand: jour(new Date(dateDebut), -365 * k),
      auteur: pick(encaisseurs, i + k),
      libelle: 'Adhésion renouvelée',
      detail: `Exercice ${exercicePour(jour(new Date(dateDebut), -365 * k))}, formule ${type.nom}.`,
      tone: 'success',
    })
  }
  historique.push({
    id: `eva-${i}-2`,
    quand: dateDebut,
    auteur: pick(encaisseurs, i + 1),
    libelle: anciennete > 1 ? 'Adhésion renouvelée' : 'Adhésion enregistrée',
    detail: `Valable jusqu’au ${new Date(dateFin).toLocaleDateString('fr-FR')}.`,
    tone: 'success',
  })
  paiements
    .filter((p) => p.statut === 'valide')
    .slice(-2)
    .forEach((p) =>
      historique.push({
        id: `eva-${i}-p-${p.id}`,
        quand: p.date,
        auteur: p.encaissePar,
        libelle: 'Paiement enregistré',
        detail: `${p.montant} € par ${moyenLabels[p.moyen].toLowerCase()} — ${p.reference}.`,
        tone: 'success',
      }),
    )
  if (resilieeLe) {
    historique.push({
      id: `eva-${i}-res`,
      quand: resilieeLe,
      auteur: pick(encaisseurs, i),
      libelle: 'Adhésion désactivée',
      detail: 'Départ de la région signalé par l’adhérent.',
      tone: 'danger',
    })
  }
  historique.sort((a, b) => (a.quand < b.quand ? 1 : -1))

  return {
    id: `ad-${1001 + i}`,
    numero: `A-${new Date(premiereAdhesion).getUTCFullYear()}-${String(101 + i).padStart(4, '0')}`,
    civilite,
    prenom,
    nom,
    email: `${slug(prenom)}.${slug(nom)}@exemple.fr`,
    telephone: `06 ${String(10 + ((i * 3) % 80)).padStart(2, '0')} ${String(10 + ((i * 7) % 80)).padStart(2, '0')} ${String(10 + ((i * 11) % 80)).padStart(2, '0')} ${String(10 + ((i * 13) % 80)).padStart(2, '0')}`,
    dateNaissance,
    ville,
    codePostal,
    typeId: type.id,
    premiereAdhesion,
    dateDebut,
    dateFin,
    resilieeLe,
    motifResiliation: resilieeLe ? 'Déménagement hors région' : '',
    cotisations,
    paiements,
    documents,
    historique,
    notes: i % 6 === 0 ? 'Souhaite être contactée par téléphone plutôt que par e-mail.' : '',
  }
}

export const adherentsInitiaux: Adherent[] = identites.map((_, i) => creerAdherentMock(i))

/* ------------------------------------------------------------------ */
/* Indicateurs et séries pour le tableau de bord                       */
/* ------------------------------------------------------------------ */

export type Kpis = {
  total: number
  actifs: number
  nouveaux: number
  renouvellements: number
  expirantBientot: number
  expirees: number
  encaisse: number
  aEncaisser: number
  tauxRenouvellement: number
}

export function calculerKpis(adherents: Adherent[], types: TypeAdhesion[]): Kpis {
  void types
  const statuts = adherents.map((a) => statutAdhesion(a))
  const actifs = statuts.filter((s) => s === 'active' || s === 'expirant').length

  // Fenêtre glissante de douze mois : plus parlante qu'un exercice qui vient de s'ouvrir.
  const debutFenetre = AUJOURDHUI.getTime() - 365 * 86400000
  const recent = (iso: string) => new Date(iso).getTime() >= debutFenetre

  const nouveaux = adherents.filter((a) => recent(a.premiereAdhesion)).length
  const renouvellements = adherents.filter((a) => recent(a.dateDebut) && !recent(a.premiereAdhesion)).length

  const encaisse = adherents.reduce(
    (s, a) => s + a.paiements.filter((p) => p.statut === 'valide' && recent(p.date)).reduce((t, p) => t + p.montant, 0),
    0,
  )
  const aEncaisser = adherents.reduce((s, a) => s + resteDu(a), 0)

  // Renouvellements rapportés aux adhérents éligibles, c'est-à-dire déjà présents il y a un an.
  const eligibles = adherents.filter((a) => !recent(a.premiereAdhesion)).length
  const tauxRenouvellement = eligibles === 0 ? 0 : Math.round((renouvellements / eligibles) * 100)

  return {
    total: adherents.length,
    actifs,
    nouveaux,
    renouvellements,
    expirantBientot: statuts.filter((s) => s === 'expirant').length,
    expirees: statuts.filter((s) => s === 'expiree').length,
    encaisse,
    aEncaisser,
    tauxRenouvellement,
  }
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Nombre d'adhésions en cours à la fin de chacun des douze derniers mois. */
export function serieEvolution(adherents: Adherent[]) {
  const points: { label: string; valeur: number }[] = []
  for (let k = 11; k >= 0; k--) {
    const d = new Date(Date.UTC(AUJOURDHUI.getUTCFullYear(), AUJOURDHUI.getUTCMonth() - k + 1, 0))
    const t = d.getTime()
    const valeur = adherents.filter((a) => {
      const debut = new Date(a.dateDebut).getTime()
      const fin = new Date(a.dateFin).getTime()
      const resiliee = a.resilieeLe ? new Date(a.resilieeLe).getTime() : Infinity
      return debut <= t && t <= Math.min(fin, resiliee)
    }).length
    points.push({ label: `${MOIS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`, valeur })
  }
  return points
}

/** Nouvelles adhésions et renouvellements par exercice. */
export function serieNouveauxVsRenouvellements(adherents: Adherent[]) {
  // Les quatre derniers exercices : au-delà, le graphique devient illisible.
  return EXERCICES.slice(-4).map((ex) => {
    const debut = new Date(debutExercice(ex)).getTime()
    const fin = debut + 365 * 86400000
    const dans = (iso: string) => {
      const t = new Date(iso).getTime()
      return t >= debut && t < fin
    }
    return {
      label: ex,
      nouveaux: adherents.filter((a) => dans(a.premiereAdhesion)).length,
      renouvellements: adherents.filter((a) => dans(a.dateDebut) && !dans(a.premiereAdhesion)).length,
    }
  })
}

export function serieAges(adherents: Adherent[]) {
  return TRANCHES_AGE.map((t) => ({
    label: t,
    valeur: adherents.filter((a) => trancheAge(a.dateNaissance) === t).length,
  }))
}
