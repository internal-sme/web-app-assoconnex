export const AUJOURDHUI_ACTION = new Date('2026-09-07T00:00:00Z')

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

/**
 * Le type d'action détermine le bouton d'appel à l'action affiché dans
 * l'application mobile. Ce n'est donc pas un simple classement.
 */
export type TypeAction = {
  id: string
  nom: string
  /** Libellé du bouton vu par le public sur l'application mobile. */
  callToAction: string
  couleur: string
}

export const typesAction: TypeAction[] = [
  { id: 'ta-don', nom: 'Collecte de dons', callToAction: 'Faire un don', couleur: '#2364AA' },
  { id: 'ta-benevolat', nom: 'Appel à bénévoles', callToAction: 'Je me porte volontaire', couleur: '#127A4C' },
  { id: 'ta-distribution', nom: 'Distribution', callToAction: 'Voir les points de distribution', couleur: '#9A5B00' },
  { id: 'ta-atelier', nom: 'Atelier ou formation', callToAction: 'M’inscrire à l’atelier', couleur: '#B42318' },
  { id: 'ta-sensibilisation', nom: 'Sensibilisation', callToAction: 'En savoir plus', couleur: '#525A66' },
  { id: 'ta-accompagnement', nom: 'Accompagnement', callToAction: 'Prendre rendez-vous', couleur: '#653B00' },
  { id: 'ta-evenement', nom: 'Événement public', callToAction: 'Réserver ma place', couleur: '#1D5391' },
  { id: 'ta-materiel', nom: 'Collecte de matériel', callToAction: 'Déposer un don', couleur: '#5892C9' },
]

export type CategorieAction = { id: string; nom: string }

export const categoriesAction: CategorieAction[] = [
  { id: 'ca-humanitaire', nom: 'Humanitaire' },
  { id: 'ca-solidarite', nom: 'Solidarité' },
  { id: 'ca-sante', nom: 'Santé' },
  { id: 'ca-education', nom: 'Éducation' },
  { id: 'ca-culture', nom: 'Culture' },
  { id: 'ca-environnement', nom: 'Environnement' },
  { id: 'ca-sport', nom: 'Sport et loisirs' },
  { id: 'ca-insertion', nom: 'Insertion' },
]

export const villesAction = ['Nantes', 'Saint-Herblain', 'Rezé', 'Orvault', 'Vertou', 'Couëron']

export const quartiersParVille: Record<string, string[]> = {
  Nantes: ['Bellevue', 'Malakoff', 'Doulon', 'Centre-ville', 'Nantes Nord'],
  'Saint-Herblain': ['Le Sillon', 'Bellevue', 'La Bernardière'],
  Rezé: ['Château', 'Pont-Rousseau', 'Trentemoult'],
  Orvault: ['Plaisance', 'Le Bois-Raguenet'],
  Vertou: ['Beautour', 'Centre'],
  Couëron: ['Bourg', 'La Chabossière'],
}

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type PorteeAction = 'seule' | 'partenariat'

export const porteeLabels: Record<PorteeAction, string> = {
  seule: 'Menée seule',
  partenariat: 'En partenariat',
}

/** Avancement déduit de la date : jamais stocké. */
export type Avancement = 'a_venir' | 'en_cours' | 'terminee' | 'annulee'

export const avancementLabels: Record<Avancement, string> = {
  a_venir: 'À venir',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
}

export type EvenementAction = {
  id: string
  quand: string
  auteur: string
  libelle: string
  detail?: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

export type BilanAction = {
  beneficiaires: number
  heuresBenevolat: number
  commentaire: string
}

export type ActionAssociative = {
  id: string
  reference: string
  titre: string
  /** Description au format Markdown léger, produite par l'éditeur enrichi. */
  description: string
  /** Emoji tenant lieu de visuel tant que le stockage de fichiers n'existe pas. */
  visuel: string
  typeId: string
  categorieId: string
  portee: PorteeAction
  /** Associations conviées, la nôtre comprise. */
  associationsIds: string[]
  adresse: string
  ville: string
  quartier: string
  date: string
  participantsIds: string[]
  projetId: string | null
  /** Publication sur l'application mobile destinée au public. */
  publiee: boolean
  publieeLe: string | null
  annulee: boolean
  motifAnnulation: string
  bilan: BilanAction
  creePar: string
  creeLe: string
  historique: EvenementAction[]
}

/* ------------------------------------------------------------------ */
/* Calculs                                                             */
/* ------------------------------------------------------------------ */

export function avancementDe(a: ActionAssociative): Avancement {
  if (a.annulee) return 'annulee'
  const jour = a.date.slice(0, 10)
  const aujourdhui = AUJOURDHUI_ACTION.toISOString().slice(0, 10)
  if (jour > aujourdhui) return 'a_venir'
  if (jour === aujourdhui) return 'en_cours'
  return 'terminee'
}

export function typeDe(a: ActionAssociative) {
  return typesAction.find((t) => t.id === a.typeId)
}

export function categorieDe(a: ActionAssociative) {
  return categoriesAction.find((c) => c.id === a.categorieId)
}

/** Le bouton que verra le public sur l'application mobile. */
export function callToActionDe(typeId: string) {
  return typesAction.find((t) => t.id === typeId)?.callToAction ?? 'En savoir plus'
}

export function partenairesDe(a: ActionAssociative) {
  return a.associationsIds.filter((id) => id !== 'org-1')
}

/* ------------------------------------------------------------------ */
/* Données mockées                                                     */
/* ------------------------------------------------------------------ */

const titresParType: Record<string, string[]> = {
  'ta-don': ['Collecte de fonds pour l’hiver', 'Appel aux dons — fonds d’urgence', 'Campagne de dons de vêtements', 'Collecte solidaire de fin d’année'],
  'ta-benevolat': ['Appel à bénévoles pour le festival', 'Recrutement de bénévoles — maraudes', 'Renfort bénévole pour la braderie', 'Bénévoles pour l’aide aux devoirs'],
  'ta-distribution': ['Distribution alimentaire hebdomadaire', 'Distribution de fournitures scolaires', 'Distribution de kits d’hygiène', 'Maraude et distribution de repas chauds'],
  'ta-atelier': ['Atelier cuisine et équilibre alimentaire', 'Atelier numérique pour seniors', 'Atelier de réparation de vélos', 'Atelier peinture pour les enfants'],
  'ta-sensibilisation': ['Sensibilisation au tri des déchets', 'Campagne de prévention santé', 'Sensibilisation aux gestes de premiers secours', 'Rencontre sur le harcèlement scolaire'],
  'ta-accompagnement': ['Permanence d’aide aux démarches', 'Accompagnement à la recherche d’emploi', 'Écrivain public', 'Soutien scolaire individualisé'],
  'ta-evenement': ['Fête de quartier', 'Forum des associations', 'Concert solidaire', 'Journée portes ouvertes'],
  'ta-materiel': ['Collecte de jouets', 'Collecte de matériel informatique', 'Récupération de mobilier', 'Collecte de livres'],
}

const descriptions = [
  'Une initiative pensée pour tisser des liens de solidarité et apporter un soutien concret à celles et ceux qui en ont besoin.\n\n**Déroulement**\n\n- Accueil du public sur place\n- Distribution et échanges avec les bénévoles\n- Orientation vers les partenaires du quartier',
  'Cette action s’inscrit dans la durée : elle se répète chaque mois et mobilise une équipe stable de bénévoles formés.\n\nLes personnes accueillies peuvent repartir avec un accompagnement personnalisé si elles le souhaitent.',
  'Nous ouvrons nos portes au public pour faire connaître le travail mené toute l’année et donner envie de rejoindre l’aventure.\n\n1. Présentation des sections\n2. Démonstrations et ateliers d’essai\n3. Inscriptions sur place',
  'Une action menée en lien étroit avec les acteurs du quartier, pour toucher celles et ceux qui ne franchissent pas spontanément la porte d’une association.',
]

const participantsPossibles = ['mb-camille', 'mb-yanis', 'mb-awa', 'mb-elodie', 'mb-malik', 'mb-hugo', 'mb-sofia']
const auteurs = ['Camille Beauchamp', 'Awa Diallo', 'Malik Benali', 'Élodie Nguyen']
const visuels = ['🤝', '🥫', '🎨', '🚲', '📚', '🎪', '🩺', '🌱', '🎁', '🏃', '💡', '🧰']

function pick<T>(a: T[], i: number): T {
  return a[((i % a.length) + a.length) % a.length]
}

function dateDecalee(jours: number) {
  return new Date(AUJOURDHUI_ACTION.getTime() + jours * 86400000).toISOString()
}

function creerAction(i: number): ActionAssociative {
  const type = pick(typesAction, i * 3 + 1)
  const categorie = pick(categoriesAction, i * 5 + 2)
  const titre = pick(titresParType[type.id], i)
  const ville = pick(villesAction, i * 2)
  const quartier = pick(quartiersParVille[ville], i)

  // Réparties de 32 mois en arrière jusqu'à 3 mois devant
  const decalage = Math.round(-980 + ((i * 137) % 1070))
  const date = dateDecalee(decalage)
  const passee = decalage < 0

  const enPartenariat = i % 3 === 1
  const partenaires = enPartenariat ? (i % 2 === 0 ? ['org-2'] : ['org-2', 'org-3']) : []

  const participantsIds = participantsPossibles.filter((_, k) => (i + k) % 3 !== 0).slice(0, 3 + (i % 4))

  const publiee = passee || i % 5 !== 3
  const beneficiaires = passee ? 12 + ((i * 29) % 180) : 0
  const heures = passee ? 6 + ((i * 17) % 60) : 0

  const historique: EvenementAction[] = [
    { id: `ea-${i}-1`, quand: dateDecalee(decalage - 21), auteur: pick(auteurs, i), libelle: 'Action créée', detail: `${titre} — ${type.nom}.`, tone: 'neutral' },
  ]
  if (publiee) {
    historique.push({
      id: `ea-${i}-2`,
      quand: dateDecalee(decalage - 18),
      auteur: pick(auteurs, i),
      libelle: 'Publiée sur l’application mobile',
      detail: `Bouton affiché au public : « ${type.callToAction} ».`,
      tone: 'success',
    })
  }
  if (enPartenariat) {
    historique.push({
      id: `ea-${i}-3`,
      quand: dateDecalee(decalage - 15),
      auteur: pick(auteurs, i + 1),
      libelle: 'Partenariat confirmé',
      detail: `${partenaires.length} association(s) associée(s) à l’action.`,
      tone: 'neutral',
    })
  }
  if (passee) {
    historique.push({
      id: `ea-${i}-4`,
      quand: dateDecalee(decalage + 1),
      auteur: pick(auteurs, i + 2),
      libelle: 'Bilan renseigné',
      detail: `${beneficiaires} bénéficiaires, ${heures} heures de bénévolat.`,
      tone: 'success',
    })
  }

  return {
    id: `ac-${100 + i}`,
    reference: `ACT-${String(100 + i)}`,
    titre,
    description: pick(descriptions, i),
    visuel: pick(visuels, i),
    typeId: type.id,
    categorieId: categorie.id,
    portee: enPartenariat ? 'partenariat' : 'seule',
    associationsIds: ['org-1', ...partenaires],
    adresse: `${3 + ((i * 7) % 90)}, rue des Coteaux`,
    ville,
    quartier,
    date,
    participantsIds,
    projetId: i % 6 === 0 ? 'pj-festival' : i % 6 === 2 ? 'pj-jeunesse' : null,
    publiee,
    publieeLe: publiee ? dateDecalee(decalage - 18) : null,
    annulee: false,
    motifAnnulation: '',
    bilan: {
      beneficiaires,
      heuresBenevolat: heures,
      commentaire: passee ? 'Objectif de fréquentation atteint, à reconduire dans les mêmes conditions.' : '',
    },
    creePar: pick(auteurs, i),
    creeLe: dateDecalee(decalage - 21),
    historique: historique.sort((a, b) => (a.quand < b.quand ? 1 : -1)),
  }
}

export const actionsInitiales: ActionAssociative[] = Array.from({ length: 72 }, (_, i) => creerAction(i)).sort((a, b) =>
  a.date < b.date ? 1 : -1,
)

/* ------------------------------------------------------------------ */
/* Variantes de démonstration                                          */
/* ------------------------------------------------------------------ */

/** Une action annulée, avec son motif. */
export function actionsAvecAnnulation(): ActionAssociative[] {
  let fait = false
  return actionsInitiales.map((a) => {
    if (!fait && avancementDe(a) === 'a_venir') {
      fait = true
      return {
        ...a,
        annulee: true,
        publiee: false,
        motifAnnulation: 'Le local prêté par la mairie n’est pas disponible à cette date. Action reportée au trimestre suivant.',
        historique: [
          {
            id: 'ea-annul',
            quand: dateDecalee(-2),
            auteur: 'Camille Beauchamp',
            libelle: 'Action annulée',
            detail: 'Le local prêté par la mairie n’est pas disponible à cette date.',
            tone: 'danger' as const,
          },
          ...a.historique,
        ],
      }
    }
    return a
  })
}

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpisActions = {
  total: number
  realisees: number
  aVenir: number
  publiees: number
  partenariats: number
  beneficiaires: number
  heuresBenevolat: number
  annulees: number
}

export function calculerKpisActions(actions: ActionAssociative[]): KpisActions {
  return {
    total: actions.length,
    realisees: actions.filter((a) => avancementDe(a) === 'terminee').length,
    aVenir: actions.filter((a) => avancementDe(a) === 'a_venir').length,
    publiees: actions.filter((a) => a.publiee).length,
    partenariats: actions.filter((a) => a.portee === 'partenariat').length,
    beneficiaires: actions.reduce((s, a) => s + a.bilan.beneficiaires, 0),
    heuresBenevolat: actions.reduce((s, a) => s + a.bilan.heuresBenevolat, 0),
    annulees: actions.filter((a) => a.annulee).length,
  }
}

const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

export const labelsMois = MOIS_COURTS

/** Nombre d'actions par mois, pour les trois dernières années. */
export function serieParAnnee(actions: ActionAssociative[]) {
  const anneeCourante = AUJOURDHUI_ACTION.getUTCFullYear()
  const couleurs = ['#2364AA', '#5892C9', '#BBD3EC']
  return [anneeCourante, anneeCourante - 1, anneeCourante - 2].map((annee, i) => ({
    nom: String(annee),
    couleur: couleurs[i],
    valeurs: MOIS_COURTS.map((_, mois) =>
      actions.filter((a) => {
        const d = new Date(a.date)
        return d.getUTCFullYear() === annee && d.getUTCMonth() === mois && !a.annulee
      }).length,
    ),
  }))
}

export function repartitionParType(actions: ActionAssociative[]) {
  return typesAction
    .map((t) => ({ label: t.nom, valeur: actions.filter((a) => a.typeId === t.id && !a.annulee).length }))
    .filter((x) => x.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur)
}

export function repartitionParCategorie(actions: ActionAssociative[]) {
  return categoriesAction
    .map((c) => ({ label: c.nom, valeur: actions.filter((a) => a.categorieId === c.id && !a.annulee).length }))
    .filter((x) => x.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur)
}
