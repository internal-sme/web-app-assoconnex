export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

export type Organisation = {
  id: string
  nom: string
  type: string
  ville: string
  adherents: number
}

/* ------------------------------------------------------------------ */
/* Modèle Contact                                                      */
/* ------------------------------------------------------------------ */

export type Civilite = 'Madame' | 'Monsieur' | 'Non précisé'
export type ContactStatut = 'actif' | 'en_attente' | 'archive'
export type Qualite = 'adherent' | 'benevole' | 'salarie'

export const qualiteLabels: Record<Qualite, string> = {
  adherent: 'Adhérent',
  benevole: 'Bénévole',
  salarie: 'Salarié',
}

export type TelephoneType = 'mobile' | 'fixe' | 'professionnel'

export const telephoneLabels: Record<TelephoneType, string> = {
  mobile: 'Mobile',
  fixe: 'Fixe',
  professionnel: 'Professionnel',
}

export type Telephone = { id: string; type: TelephoneType; numero: string }

export type Adresse = {
  ligne1: string
  ligne2: string
  codePostal: string
  ville: string
  pays: string
}

export type Communication = {
  email: boolean
  sms: boolean
  courrier: boolean
  lettreInfo: boolean
  convocations: boolean
  consentementLe: string | null
}

export type DocumentContact = {
  id: string
  nom: string
  categorie: string
  taille: string
  ajouteLe: string
  ajoutePar: string
}

export type Evenement = {
  id: string
  quand: string
  auteur: string
  libelle: string
  detail?: string
  tone: StatusTone
}

export type Contact = {
  id: string
  civilite: Civilite
  prenom: string
  nom: string
  dateNaissance: string
  email: string
  telephones: Telephone[]
  adresse: Adresse
  fonction: string
  statut: ContactStatut
  dateEntree: string
  qualites: Qualite[]
  groupes: string[]
  tags: string[]
  communication: Communication
  documents: DocumentContact[]
  historique: Evenement[]
  notes: string
  creeLe: string
}

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

export type Groupe = { id: string; nom: string; description: string }
export type Tag = { id: string; nom: string }

export const groupesInitiaux: Groupe[] = [
  { id: 'gr-bureau', nom: 'Bureau', description: 'Président, trésorier, secrétaire et adjoints.' },
  { id: 'gr-rando', nom: 'Section randonnée', description: 'Sorties du dimanche et séjours annuels.' },
  { id: 'gr-theatre', nom: 'Section théâtre', description: 'Troupe adulte et atelier jeunesse.' },
  { id: 'gr-com', nom: 'Commission communication', description: 'Lettre d’information, réseaux, affichage.' },
  { id: 'gr-evenements', nom: 'Équipe événements', description: 'Fête annuelle, brocante, portes ouvertes.' },
  { id: 'gr-jeunesse', nom: 'Ateliers jeunesse', description: 'Encadrants des ateliers 8–14 ans.' },
]

export const tagsInitiaux: Tag[] = [
  { id: 'tg-nouveau', nom: 'Nouveau' },
  { id: 'tg-referent', nom: 'Référent' },
  { id: 'tg-vehicule', nom: 'Véhiculé' },
  { id: 'tg-don', nom: 'Don régulier' },
  { id: 'tg-secourisme', nom: 'Secourisme' },
  { id: 'tg-photo', nom: 'Droit à l’image' },
  { id: 'tg-a-relancer', nom: 'À relancer' },
]

/* ------------------------------------------------------------------ */
/* Génération des données mockées                                      */
/* ------------------------------------------------------------------ */

export const personnes: [Civilite, string, string][] = [
  ['Madame', 'Camille', 'Beauchamp'],
  ['Monsieur', 'Yanis', 'Traoré'],
  ['Madame', 'Awa', 'Diallo'],
  ['Monsieur', 'Thibault', 'Lemoine'],
  ['Madame', 'Léa', 'Da Costa'],
  ['Monsieur', 'Moussa', 'Rivière'],
  ['Madame', 'Élodie', 'Nguyen'],
  ['Monsieur', 'Hugo', 'Fournier'],
  ['Madame', 'Fatou', 'Bertrand'],
  ['Monsieur', 'Nathan', 'Marchand'],
  ['Madame', 'Inès', 'Kouassi'],
  ['Monsieur', 'Rémi', 'Vasseur'],
  ['Madame', 'Sarah', 'Perrin'],
  ['Monsieur', 'Malik', 'Benali'],
  ['Madame', 'Chloé', 'Lacroix'],
  ['Monsieur', 'Antoine', 'Hoarau'],
  ['Madame', 'Nour', 'Guérin'],
  ['Madame', 'Gaëlle', 'Sané'],
  ['Monsieur', 'Pierre-Yves', 'Delaunay'],
  ['Madame', 'Amina', 'Marois'],
  ['Monsieur', 'Julien', 'Chevalier'],
  ['Madame', 'Maëva', 'Bamba'],
  ['Monsieur', 'Karim', 'Rousseau'],
  ['Madame', 'Solène', 'Prigent'],
  ['Monsieur', 'Étienne', 'Le Gall'],
  ['Madame', 'Jeanne', 'Morvan'],
  ['Monsieur', 'Idriss', 'Ferreira'],
  ['Madame', 'Manon', 'Cottereau'],
  ['Monsieur', 'Bastien', 'Ouedraogo'],
  ['Madame', 'Anaïs', 'Ricard'],
  ['Monsieur', 'Farid', 'Leclerc'],
  ['Madame', 'Salomé', 'Béchard'],
  ['Non précisé', 'Alex', 'Renaudin'],
  ['Madame', 'Océane', 'Tanguy'],
  ['Monsieur', 'Corentin', 'Balland'],
  ['Madame', 'Louise', 'Mercier'],
  ['Monsieur', 'Samuel', 'Coulibaly'],
  ['Madame', 'Zoé', 'Berthier'],
  ['Monsieur', 'Ludovic', 'Pasquier'],
  ['Madame', 'Hélène', 'Vanhove'],
]

export const communes: [string, string][] = [
  ['44000', 'Nantes'],
  ['35000', 'Rennes'],
  ['29200', 'Brest'],
  ['49100', 'Angers'],
  ['56000', 'Vannes'],
  ['44600', 'Saint-Nazaire'],
  ['29000', 'Quimper'],
  ['56100', 'Lorient'],
  ['72000', 'Le Mans'],
  ['85000', 'La Roche-sur-Yon'],
]

const voies = [
  'rue des Trois-Croissants',
  'avenue Jean-Jaurès',
  'impasse du Vieux-Moulin',
  'boulevard de la Liberté',
  'place Sainte-Anne',
  'chemin des Ormeaux',
  'rue du Général-Leclerc',
  'allée des Peupliers',
  'quai de la Fosse',
  'route de Vannes',
]

const complements = ['', 'Bâtiment B, 2ᵉ étage', 'Appartement 14', 'Résidence Les Tilleuls', '', 'Chez Mme Lorant', '']

const fonctions = [
  'Présidente',
  'Trésorier',
  'Secrétaire',
  'Vice-président',
  'Responsable de section',
  'Encadrante atelier',
  'Bénévole accueil',
  'Chargée de communication',
  'Animateur jeunesse',
  'Référent matériel',
  'Membre',
  'Coordinatrice événements',
]

const categoriesDoc = ['Adhésion', 'Autorisation', 'Certificat', 'Attestation', 'Courrier']
const nomsDoc = [
  'Bulletin d’adhésion signé',
  'Certificat médical',
  'Autorisation parentale',
  'Attestation d’assurance',
  'Courrier de bienvenue',
  'Charte du bénévole',
]

const auteurs = ['Camille Beauchamp', 'Yanis Traoré', 'Système', 'Élodie Nguyen']

function slug(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length]
}

function iso(y: number, m: number, d: number) {
  return new Date(Date.UTC(y, m, d, 9, 30)).toISOString()
}

function telephone(i: number, prefix: string) {
  const p = (n: number) => String(10 + ((i * n) % 80)).padStart(2, '0')
  return `${prefix} ${p(3)} ${p(7)} ${p(11)} ${p(13)}`
}

function historiquePour(i: number, prenom: string, nom: string, dateEntree: string): Evenement[] {
  const base: Evenement[] = [
    {
      id: `ev-${i}-1`,
      quand: dateEntree,
      auteur: pick(auteurs, i),
      libelle: 'Fiche créée',
      detail: `${prenom} ${nom} a été ajouté à la base de contacts.`,
      tone: 'neutral',
    },
    {
      id: `ev-${i}-2`,
      quand: iso(2025, (i + 2) % 12, ((i * 3) % 26) + 1),
      auteur: pick(auteurs, i + 1),
      libelle: 'Adhésion enregistrée',
      detail: 'Formule individuelle, saison 2025-2026.',
      tone: 'success',
    },
    {
      id: `ev-${i}-3`,
      quand: iso(2026, (i + 4) % 8, ((i * 5) % 26) + 1),
      auteur: 'Système',
      libelle: 'Lettre d’information envoyée',
      detail: 'Numéro de printemps, ouverte le jour même.',
      tone: 'neutral',
    },
  ]
  if (i % 4 === 0) {
    base.push({
      id: `ev-${i}-4`,
      quand: iso(2026, 6, ((i * 2) % 26) + 1),
      auteur: pick(auteurs, i + 2),
      libelle: 'Relance envoyée',
      detail: 'Cotisation non réglée à l’échéance.',
      tone: 'warning',
    })
  }
  if (i % 9 === 0) {
    base.push({
      id: `ev-${i}-5`,
      quand: iso(2026, 7, ((i * 3) % 26) + 1),
      auteur: pick(auteurs, i),
      libelle: 'Contact archivé',
      detail: 'Départ de la région signalé par courriel.',
      tone: 'danger',
    })
  }
  return base.sort((a, b) => (a.quand < b.quand ? 1 : -1))
}

function creerContact(i: number): Contact {
  const [civilite, prenom, nom] = personnes[i]
  const [codePostal, ville] = pick(communes, i * 3)
  const statut: ContactStatut = i % 9 === 0 ? 'archive' : i % 5 === 0 ? 'en_attente' : 'actif'
  const dateEntree = iso(2021 + (i % 5), i % 12, ((i * 4) % 26) + 1)

  const qualites: Qualite[] = []
  if (i % 7 !== 3) qualites.push('adherent')
  if (i % 3 === 0) qualites.push('benevole')
  if (i % 13 === 5) qualites.push('salarie')
  if (qualites.length === 0) qualites.push('benevole')

  const telephones: Telephone[] = [{ id: `tel-${i}-1`, type: 'mobile', numero: telephone(i, '06') }]
  if (i % 3 === 1) telephones.push({ id: `tel-${i}-2`, type: 'fixe', numero: telephone(i + 4, '02') })
  if (i % 13 === 5) telephones.push({ id: `tel-${i}-3`, type: 'professionnel', numero: telephone(i + 7, '02') })

  const groupes: string[] = []
  if (i % 6 === 0) groupes.push('Bureau')
  if (i % 4 === 1) groupes.push('Section randonnée')
  if (i % 5 === 2) groupes.push('Section théâtre')
  if (i % 7 === 3) groupes.push('Commission communication')
  if (i % 8 === 4) groupes.push('Équipe événements')
  if (i % 11 === 6) groupes.push('Ateliers jeunesse')

  const tags: string[] = []
  if (i >= 34) tags.push('Nouveau')
  if (i % 6 === 0) tags.push('Référent')
  if (i % 5 === 3) tags.push('Véhiculé')
  if (i % 9 === 2) tags.push('Don régulier')
  if (i % 12 === 7) tags.push('Secourisme')
  if (i % 5 === 0) tags.push('Droit à l’image')
  if (statut === 'en_attente') tags.push('À relancer')

  const documents: DocumentContact[] = Array.from({ length: i % 4 }, (_, d) => ({
    id: `doc-${i}-${d}`,
    nom: `${pick(nomsDoc, i + d)}.pdf`,
    categorie: pick(categoriesDoc, i + d),
    taille: `${120 + ((i * 37 + d * 91) % 1800)} Ko`,
    ajouteLe: iso(2025, (i + d) % 12, ((i * 2 + d) % 26) + 1),
    ajoutePar: pick(auteurs, i + d),
  }))

  return {
    id: `ct-${101 + i}`,
    civilite,
    prenom,
    nom,
    dateNaissance: iso(1955 + ((i * 7) % 50), (i * 5) % 12, ((i * 3) % 27) + 1).slice(0, 10),
    email: `${slug(prenom)}.${slug(nom)}@exemple.fr`,
    telephones,
    adresse: {
      ligne1: `${1 + ((i * 7) % 120)} ${pick(voies, i * 2)}`,
      ligne2: pick(complements, i),
      codePostal,
      ville,
      pays: 'France',
    },
    fonction: pick(fonctions, i * 3 + 1),
    statut,
    dateEntree,
    qualites,
    groupes,
    tags,
    communication: {
      email: i % 11 !== 4,
      sms: i % 3 === 0,
      courrier: i % 7 === 2,
      lettreInfo: i % 4 !== 1,
      convocations: qualites.includes('adherent'),
      consentementLe: i % 11 === 4 ? null : iso(2024, i % 12, ((i * 2) % 26) + 1),
    },
    documents,
    historique: historiquePour(i, prenom, nom, dateEntree),
    notes:
      i % 5 === 0
        ? 'Disponible surtout le week-end. Préfère être appelée plutôt que d’écrire.'
        : i % 5 === 2
          ? 'Dispose d’un véhicule 9 places pour les sorties de section.'
          : '',
    creeLe: dateEntree,
  }
}

export const contactsInitiaux: Contact[] = personnes.map((_, i) => creerContact(i))

/* ------------------------------------------------------------------ */
/* Autres données du socle                                             */
/* ------------------------------------------------------------------ */

export const organisations: Organisation[] = [
  { id: 'org-1', nom: 'Les Amis du Vieux Moulin', type: 'Association culturelle', ville: 'Nantes', adherents: 248 },
  { id: 'org-2', nom: 'Club Athlétique Bellevue', type: 'Club sportif', ville: 'Rennes', adherents: 512 },
  { id: 'org-3', nom: 'Fédération Solidarité Ouest', type: 'Fédération', ville: 'Brest', adherents: 1340 },
]

export type Notification = {
  id: string
  titre: string
  detail: string
  quand: string
  lu: boolean
  tone: StatusTone
}

export const notifications: Notification[] = [
  { id: 'n1', titre: '3 adhésions à valider', detail: 'Formule Famille — reçues aujourd’hui', quand: 'Il y a 12 min', lu: false, tone: 'warning' },
  { id: 'n2', titre: 'Paiement reçu — 80 €', detail: 'Awa Diallo, cotisation 2026', quand: 'Il y a 2 h', lu: false, tone: 'success' },
  { id: 'n3', titre: '2 cotisations en retard', detail: 'Relance automatique prévue lundi', quand: 'Hier', lu: false, tone: 'danger' },
  { id: 'n4', titre: 'Fiche contact mise à jour', detail: 'Hugo Fournier — nouvelle adresse', quand: 'Mardi', lu: true, tone: 'neutral' },
]

export const utilisateur = {
  nom: 'Camille Beauchamp',
  email: 'camille.beauchamp@vieuxmoulin.fr',
  role: 'Administratrice',
}
