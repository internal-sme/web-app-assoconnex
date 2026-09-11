export const MAINTENANT_CHAT = new Date('2026-09-07T14:30:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type AssociationChat = {
  id: string
  nom: string
  courte: string
  couleur: string
  /** Faux pour les associations partenaires, vrai pour la nôtre. */
  interne: boolean
}

export const associationsChat: AssociationChat[] = [
  { id: 'org-1', nom: 'Les Amis du Vieux Moulin', courte: 'Vieux Moulin', couleur: '#2364AA', interne: true },
  { id: 'org-2', nom: 'Club Athlétique Bellevue', courte: 'CA Bellevue', couleur: '#127A4C', interne: false },
  { id: 'org-3', nom: 'Fédération Solidarité Ouest', courte: 'Solidarité Ouest', couleur: '#9A5B00', interne: false },
  { id: 'org-4', nom: 'Compagnie du Grand Vent', courte: 'Grand Vent', couleur: '#B42318', interne: false },
]

export type MembreChat = {
  id: string
  nom: string
  role: string
  associationId: string
  enLigne: boolean
  /** Dernière activité, pour les membres hors ligne. */
  vuLe: string | null
}

export const membresChat: MembreChat[] = [
  { id: 'mb-camille', nom: 'Camille Beauchamp', role: 'Présidente', associationId: 'org-1', enLigne: true, vuLe: null },
  { id: 'mb-yanis', nom: 'Yanis Traoré', role: 'Trésorier', associationId: 'org-1', enLigne: true, vuLe: null },
  { id: 'mb-awa', nom: 'Awa Diallo', role: 'Responsable de section', associationId: 'org-1', enLigne: true, vuLe: null },
  { id: 'mb-elodie', nom: 'Élodie Nguyen', role: 'Chargée de communication', associationId: 'org-1', enLigne: false, vuLe: '2026-09-07T11:20:00Z' },
  { id: 'mb-malik', nom: 'Malik Benali', role: 'Animateur', associationId: 'org-1', enLigne: true, vuLe: null },
  { id: 'mb-hugo', nom: 'Hugo Fournier', role: 'Bénévole', associationId: 'org-1', enLigne: false, vuLe: '2026-09-06T19:05:00Z' },
  { id: 'mb-sofia', nom: 'Sofia Marchetti', role: 'Bénévole', associationId: 'org-1', enLigne: false, vuLe: '2026-09-05T17:40:00Z' },

  { id: 'mb-nadia', nom: 'Nadia Kerbrat', role: 'Secrétaire générale', associationId: 'org-2', enLigne: true, vuLe: null },
  { id: 'mb-thomas', nom: 'Thomas Le Goff', role: 'Responsable événements', associationId: 'org-2', enLigne: false, vuLe: '2026-09-07T09:15:00Z' },
  { id: 'mb-ines', nom: 'Inès Rahmani', role: 'Coordinatrice réseau', associationId: 'org-3', enLigne: true, vuLe: null },
  { id: 'mb-pierre', nom: 'Pierre Vasseur', role: 'Chargé de mission', associationId: 'org-3', enLigne: false, vuLe: '2026-09-04T16:00:00Z' },
  { id: 'mb-manon', nom: 'Manon Cottereau', role: 'Chargée de production', associationId: 'org-4', enLigne: true, vuLe: null },
]

export const MOI_CHAT = 'mb-camille'

export type TypeSalon = 'association' | 'inter' | 'direct'

export const typeSalonLabels: Record<TypeSalon, string> = {
  association: 'Salon de l’association',
  inter: 'Salon inter-associations',
  direct: 'Message direct',
}

export type VisibiliteSalon = 'ouvert' | 'invitation'

export const visibiliteLabels: Record<VisibiliteSalon, string> = {
  ouvert: 'Ouvert à tous les membres',
  invitation: 'Sur invitation',
}

export type NiveauNotification = 'tous' | 'mentions' | 'aucune'

export const notificationLabels: Record<NiveauNotification, string> = {
  tous: 'Tous les messages',
  mentions: 'Mentions seulement',
  aucune: 'Aucune notification',
}

export type Salon = {
  id: string
  nom: string
  description: string
  type: TypeSalon
  visibilite: VisibiliteSalon
  membresIds: string[]
  /** Associations conviées : la nôtre plus les partenaires, pour un salon inter. */
  associationsIds: string[]
  projetId: string | null
  epingle: boolean
  archive: boolean
  notifications: NiveauNotification
  creePar: string
  creeLe: string
}

export type PieceJointeChat = { id: string; nom: string; taille: string }

export type Reaction = { emoji: string; membresIds: string[] }

export type StatutEnvoi = 'envoye' | 'en_cours' | 'echec'

export type MessageChat = {
  id: string
  salonId: string
  auteurId: string
  quand: string
  contenu: string
  /** Identifiants des membres mentionnés par @. */
  mentions: string[]
  piecesJointes: PieceJointeChat[]
  reactions: Reaction[]
  /** Identifiant du message parent, pour les réponses en fil. */
  reponseA: string | null
  epingle: boolean
  modifieLe: string | null
  supprime: boolean
  lecteursIds: string[]
  statutEnvoi: StatutEnvoi
}

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

export function membre(id: string) {
  return membresChat.find((m) => m.id === id)
}

export function associationDe(membreId: string) {
  const m = membre(membreId)
  return associationsChat.find((a) => a.id === m?.associationId)
}

export function estExterne(membreId: string) {
  return !associationDe(membreId)?.interne
}

/** Nom d'affichage d'un salon : pour un direct, celui de l'interlocuteur. */
export function nomSalon(s: Salon) {
  if (s.type !== 'direct') return s.nom
  const autre = s.membresIds.find((id) => id !== MOI_CHAT)
  return membre(autre ?? '')?.nom ?? s.nom
}

export function interlocuteurDirect(s: Salon) {
  if (s.type !== 'direct') return undefined
  return membre(s.membresIds.find((id) => id !== MOI_CHAT) ?? '')
}

export function messagesDuSalon(salonId: string, messages: MessageChat[]) {
  return messages.filter((m) => m.salonId === salonId && !m.reponseA).sort((a, b) => (a.quand < b.quand ? -1 : 1))
}

export function reponsesDe(messageId: string, messages: MessageChat[]) {
  return messages.filter((m) => m.reponseA === messageId).sort((a, b) => (a.quand < b.quand ? -1 : 1))
}

export function dernierMessage(salonId: string, messages: MessageChat[]) {
  return messages
    .filter((m) => m.salonId === salonId && !m.supprime)
    .sort((a, b) => (a.quand < b.quand ? 1 : -1))[0]
}

export function nonLus(salonId: string, messages: MessageChat[]) {
  return messages.filter((m) => m.salonId === salonId && !m.supprime && m.auteurId !== MOI_CHAT && !m.lecteursIds.includes(MOI_CHAT)).length
}

export function mentionsNonLues(messages: MessageChat[]) {
  return messages.filter((m) => !m.supprime && m.mentions.includes(MOI_CHAT) && !m.lecteursIds.includes(MOI_CHAT))
}

/** Rend le contenu en isolant les mentions, pour les mettre en valeur. */
export function fragmenterContenu(contenu: string) {
  return contenu.split(/(@[\wÀ-ÿ'’-]+(?:\s[A-ZÀ-Ý][\wÀ-ÿ'’-]+)?)/g).filter(Boolean)
}

export function heureCourte(iso: string) {
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

export function jourRelatif(iso: string) {
  const d = new Date(iso)
  const jours = Math.floor((MAINTENANT_CHAT.getTime() - d.getTime()) / 86400000)
  if (jours <= 0) return "Aujourd'hui"
  if (jours === 1) return 'Hier'
  if (jours < 7) return `Il y a ${jours} jours`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' })
}

export function horodatageCourt(iso: string) {
  const d = new Date(iso)
  const minutes = Math.floor((MAINTENANT_CHAT.getTime() - d.getTime()) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  if (minutes < 1440) return `il y a ${Math.floor(minutes / 60)} h`
  const jours = Math.floor(minutes / 1440)
  if (jours === 1) return 'hier'
  if (jours < 7) return `il y a ${jours} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/* ------------------------------------------------------------------ */
/* Salons                                                              */
/* ------------------------------------------------------------------ */

function instant(minutesAvant: number) {
  return new Date(MAINTENANT_CHAT.getTime() - minutesAvant * 60000).toISOString()
}

const INTERNE = ['mb-camille', 'mb-yanis', 'mb-awa', 'mb-elodie', 'mb-malik', 'mb-hugo', 'mb-sofia']

export const salonsInitiaux: Salon[] = [
  {
    id: 'sl-general',
    nom: 'Général',
    description: 'Le salon où tout le monde se retrouve. Annonces, questions, coups de main.',
    type: 'association',
    visibilite: 'ouvert',
    membresIds: INTERNE,
    associationsIds: ['org-1'],
    projetId: null,
    epingle: true,
    archive: false,
    notifications: 'tous',
    creePar: 'mb-camille',
    creeLe: instant(60 * 24 * 400),
  },
  {
    id: 'sl-bureau',
    nom: 'Bureau',
    description: 'Échanges du bureau : budget, préparation des conseils, arbitrages.',
    type: 'association',
    visibilite: 'invitation',
    membresIds: ['mb-camille', 'mb-yanis', 'mb-awa'],
    associationsIds: ['org-1'],
    projetId: null,
    epingle: true,
    archive: false,
    notifications: 'tous',
    creePar: 'mb-camille',
    creeLe: instant(60 * 24 * 380),
  },
  {
    id: 'sl-festival',
    nom: 'Festival du Vieux Moulin',
    description: 'Préparation de l’édition 2026 : programmation, technique, bénévoles.',
    type: 'association',
    visibilite: 'ouvert',
    membresIds: ['mb-camille', 'mb-awa', 'mb-elodie', 'mb-malik', 'mb-hugo'],
    associationsIds: ['org-1'],
    projetId: 'pj-festival',
    epingle: false,
    archive: false,
    notifications: 'tous',
    creePar: 'mb-awa',
    creeLe: instant(60 * 24 * 120),
  },
  {
    id: 'sl-benevoles',
    nom: 'Bénévoles',
    description: 'Appels à renfort, plannings, remplacements de dernière minute.',
    type: 'association',
    visibilite: 'ouvert',
    membresIds: INTERNE,
    associationsIds: ['org-1'],
    projetId: null,
    epingle: false,
    archive: false,
    notifications: 'mentions',
    creePar: 'mb-awa',
    creeLe: instant(60 * 24 * 200),
  },
  {
    id: 'sl-forum',
    nom: 'Forum des associations 2026',
    description: 'Organisation commune du forum de rentrée, stand partagé et communication mutualisée.',
    type: 'inter',
    visibilite: 'invitation',
    membresIds: ['mb-camille', 'mb-elodie', 'mb-nadia', 'mb-thomas', 'mb-ines'],
    associationsIds: ['org-1', 'org-2', 'org-3'],
    projetId: null,
    epingle: true,
    archive: false,
    notifications: 'tous',
    creePar: 'mb-ines',
    creeLe: instant(60 * 24 * 45),
  },
  {
    id: 'sl-mutualisation',
    nom: 'Mutualisation de matériel',
    description: 'Prêt de sonorisation, de grilles d’exposition et de mobilier entre associations du réseau.',
    type: 'inter',
    visibilite: 'ouvert',
    membresIds: ['mb-camille', 'mb-malik', 'mb-hugo', 'mb-thomas', 'mb-pierre'],
    associationsIds: ['org-1', 'org-2', 'org-3'],
    projetId: null,
    epingle: false,
    archive: false,
    notifications: 'mentions',
    creePar: 'mb-camille',
    creeLe: instant(60 * 24 * 90),
  },
  {
    id: 'sl-cession',
    nom: 'Résidence Grand Vent',
    description: 'Accueil de la compagnie en résidence : technique, hébergement, représentation.',
    type: 'inter',
    visibilite: 'invitation',
    membresIds: ['mb-camille', 'mb-awa', 'mb-malik', 'mb-manon'],
    associationsIds: ['org-1', 'org-4'],
    projetId: 'pj-festival',
    epingle: false,
    archive: false,
    notifications: 'tous',
    creePar: 'mb-awa',
    creeLe: instant(60 * 24 * 30),
  },
  {
    id: 'sl-forum2025',
    nom: 'Forum des associations 2025',
    description: 'Édition précédente. Salon conservé pour mémoire.',
    type: 'inter',
    visibilite: 'invitation',
    membresIds: ['mb-camille', 'mb-elodie', 'mb-nadia'],
    associationsIds: ['org-1', 'org-2'],
    projetId: null,
    epingle: false,
    archive: true,
    notifications: 'aucune',
    creePar: 'mb-camille',
    creeLe: instant(60 * 24 * 400),
  },
  {
    id: 'sl-dm-yanis',
    nom: 'Yanis Traoré',
    description: '',
    type: 'direct',
    visibilite: 'invitation',
    membresIds: ['mb-camille', 'mb-yanis'],
    associationsIds: ['org-1'],
    projetId: null,
    epingle: false,
    archive: false,
    notifications: 'tous',
    creePar: 'mb-camille',
    creeLe: instant(60 * 24 * 60),
  },
  {
    id: 'sl-dm-awa',
    nom: 'Awa Diallo',
    description: '',
    type: 'direct',
    visibilite: 'invitation',
    membresIds: ['mb-camille', 'mb-awa'],
    associationsIds: ['org-1'],
    projetId: null,
    epingle: false,
    archive: false,
    notifications: 'tous',
    creePar: 'mb-awa',
    creeLe: instant(60 * 24 * 40),
  },
  {
    id: 'sl-dm-nadia',
    nom: 'Nadia Kerbrat',
    description: '',
    type: 'direct',
    visibilite: 'invitation',
    membresIds: ['mb-camille', 'mb-nadia'],
    associationsIds: ['org-1', 'org-2'],
    projetId: null,
    epingle: false,
    archive: false,
    notifications: 'tous',
    creePar: 'mb-nadia',
    creeLe: instant(60 * 24 * 20),
  },
  {
    id: 'sl-projets',
    nom: 'Ateliers jeunesse',
    description: 'Coordination des séances, matériel, effectifs.',
    type: 'association',
    visibilite: 'ouvert',
    membresIds: ['mb-camille', 'mb-awa', 'mb-malik', 'mb-hugo'],
    associationsIds: ['org-1'],
    projetId: 'pj-jeunesse',
    epingle: false,
    archive: false,
    notifications: 'tous',
    creePar: 'mb-malik',
    creeLe: instant(60 * 24 * 70),
  },
]

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

type ModeleMessage = {
  salonId: string
  auteurId: string
  minutes: number
  contenu: string
  mentions?: string[]
  pieces?: { nom: string; taille: string }[]
  reactions?: { emoji: string; par: string[] }[]
  epingle?: boolean
  modifie?: boolean
  supprime?: boolean
  /** Index, dans ce tableau, du message parent. */
  reponseAIndex?: number
  nonLuParMoi?: boolean
}

const modelesMessages: ModeleMessage[] = [
  // Général
  { salonId: 'sl-general', auteurId: 'mb-camille', minutes: 60 * 30, contenu: 'Bonjour à toutes et tous. La saison est lancée, le programme est en ligne depuis ce matin.', epingle: true, reactions: [{ emoji: '👍', par: ['mb-awa', 'mb-malik', 'mb-hugo'] }] },
  { salonId: 'sl-general', auteurId: 'mb-elodie', minutes: 60 * 28, contenu: 'J’ai mis à jour la page d’accueil du site en conséquence. Si vous voyez des coquilles, dites-le-moi.' },
  { salonId: 'sl-general', auteurId: 'mb-hugo', minutes: 60 * 27, contenu: 'Vu, c’est propre. Petite remarque : la date du forum n’apparaît pas.', reponseAIndex: 1 },
  { salonId: 'sl-general', auteurId: 'mb-elodie', minutes: 60 * 26, contenu: 'Bien vu, je corrige.', reponseAIndex: 1 },
  { salonId: 'sl-general', auteurId: 'mb-malik', minutes: 60 * 6, contenu: 'Quelqu’un aurait un jeu de clés de la salle d’atelier ? La mienne reste bloquée dans la serrure.' },
  { salonId: 'sl-general', auteurId: 'mb-awa', minutes: 60 * 5, contenu: 'J’en ai un au bureau, passe le prendre quand tu veux.', reactions: [{ emoji: '🙏', par: ['mb-malik'] }] },
  { salonId: 'sl-general', auteurId: 'mb-yanis', minutes: 95, contenu: 'Rappel : les notes de frais du mois sont à déposer avant vendredi, sinon elles basculent sur le mois suivant.', mentions: [], nonLuParMoi: true },

  // Bureau
  { salonId: 'sl-bureau', auteurId: 'mb-yanis', minutes: 60 * 20, contenu: 'J’ai bouclé le budget prévisionnel. Les recettes de billetterie sont volontairement prudentes.', pieces: [{ nom: 'Budget prévisionnel 2026-2027.xlsx', taille: '340 Ko' }] },
  { salonId: 'sl-bureau', auteurId: 'mb-camille', minutes: 60 * 19, contenu: 'Merci. Je regarde ce soir et je reviens vers toi demain.' },
  { salonId: 'sl-bureau', auteurId: 'mb-awa', minutes: 60 * 4, contenu: '@Camille Beauchamp est-ce qu’on ajoute la ligne mécénat au prochain conseil ? Le contact de la fondation attend une réponse.', mentions: ['mb-camille'], nonLuParMoi: true },
  { salonId: 'sl-bureau', auteurId: 'mb-yanis', minutes: 40, contenu: 'De mon côté c’est sans objection, tant qu’on reste sur un engagement d’un an.', reponseAIndex: 9, nonLuParMoi: true },

  // Festival
  { salonId: 'sl-festival', auteurId: 'mb-awa', minutes: 60 * 50, contenu: 'La programmation est arrêtée : sept compagnies confirmées, deux en attente de réponse.' },
  { salonId: 'sl-festival', auteurId: 'mb-malik', minutes: 60 * 48, contenu: 'Côté technique, le plan d’implantation est validé par les services de la ville.', pieces: [{ nom: 'Plan d’implantation.pdf', taille: '2,1 Mo' }], reactions: [{ emoji: '🎉', par: ['mb-awa', 'mb-camille', 'mb-elodie'] }] },
  { salonId: 'sl-festival', auteurId: 'mb-elodie', minutes: 60 * 30, contenu: 'L’affiche part à l’impression demain. Dernier appel pour les relectures.', epingle: true },
  { salonId: 'sl-festival', auteurId: 'mb-hugo', minutes: 60 * 29, contenu: 'Relu, rien à signaler de mon côté.', reponseAIndex: 13 },
  { salonId: 'sl-festival', auteurId: 'mb-camille', minutes: 60 * 28, contenu: 'Pareil. Bon pour tirage.', reponseAIndex: 13 },
  { salonId: 'sl-festival', auteurId: 'mb-awa', minutes: 60 * 3, contenu: 'Il nous manque encore quatre bénévoles sur le créneau du dimanche après-midi.', nonLuParMoi: true },

  // Bénévoles
  { salonId: 'sl-benevoles', auteurId: 'mb-awa', minutes: 60 * 26, contenu: 'Le planning de la semaine est publié. Merci de confirmer vos créneaux.' },
  { salonId: 'sl-benevoles', auteurId: 'mb-sofia', minutes: 60 * 25, contenu: 'Confirmé pour moi, sauf samedi après-midi : je viens de poser une demande de remplacement.' },
  { salonId: 'sl-benevoles', auteurId: 'mb-hugo', minutes: 60 * 24, contenu: 'Je peux prendre le samedi après-midi si personne ne se propose.', reponseAIndex: 18, reactions: [{ emoji: '🙌', par: ['mb-sofia', 'mb-awa'] }] },
  { salonId: 'sl-benevoles', auteurId: 'mb-malik', minutes: 60 * 12, contenu: 'Message supprimé', supprime: true },

  // Forum inter-associations
  { salonId: 'sl-forum', auteurId: 'mb-ines', minutes: 60 * 40, contenu: 'Bonjour à toutes et tous. J’ouvre ce salon pour préparer le forum du 3 octobre. Trois associations pour un stand commun, c’est une première.', epingle: true, reactions: [{ emoji: '👋', par: ['mb-camille', 'mb-nadia', 'mb-thomas'] }] },
  { salonId: 'sl-forum', auteurId: 'mb-nadia', minutes: 60 * 39, contenu: 'Très bien. De notre côté nous pouvons fournir deux tables et une banderole.' },
  { salonId: 'sl-forum', auteurId: 'mb-camille', minutes: 60 * 38, contenu: 'Nous apportons les grilles d’exposition et le pack sonorisation. Reste à voir qui tient le stand et quand.' },
  { salonId: 'sl-forum', auteurId: 'mb-thomas', minutes: 60 * 22, contenu: 'J’ai commencé un tableau de permanences. Je le partage ici une fois complété.', pieces: [{ nom: 'Permanences forum — brouillon.xlsx', taille: '48 Ko' }] },
  { salonId: 'sl-forum', auteurId: 'mb-ines', minutes: 60 * 21, contenu: 'Parfait. @Camille Beauchamp tu confirmes que vous tenez le créneau du matin ?', mentions: ['mb-camille'], nonLuParMoi: true },
  { salonId: 'sl-forum', auteurId: 'mb-nadia', minutes: 60 * 2, contenu: 'Petite question logistique : est-ce que quelqu’un a un contact pour l’électricité sur le parvis ?', nonLuParMoi: true },

  // Mutualisation
  { salonId: 'sl-mutualisation', auteurId: 'mb-thomas', minutes: 60 * 70, contenu: 'Bonjour, nous cherchons une sonorisation légère pour une remise de prix le 12 octobre. Quelqu’un peut prêter ?' },
  { salonId: 'sl-mutualisation', auteurId: 'mb-camille', minutes: 60 * 69, contenu: 'Notre pack est libre à cette date, sous réserve du festival. Je confirme en fin de semaine.' },
  { salonId: 'sl-mutualisation', auteurId: 'mb-hugo', minutes: 60 * 68, contenu: 'Attention, la console a un canal capricieux. Prévoir un test la veille.', reponseAIndex: 28 },
  { salonId: 'sl-mutualisation', auteurId: 'mb-pierre', minutes: 60 * 10, contenu: 'De notre côté nous avons dix grilles d’exposition disponibles toute l’année. N’hésitez pas.' },

  // Résidence Grand Vent
  { salonId: 'sl-cession', auteurId: 'mb-manon', minutes: 60 * 18, contenu: 'Bonjour, voici la fiche technique du spectacle. Nous arrivons le 12 au matin pour le montage.', pieces: [{ nom: 'Fiche technique — Grand Vent.pdf', taille: '420 Ko' }] },
  { salonId: 'sl-cession', auteurId: 'mb-malik', minutes: 60 * 17, contenu: 'Bien reçu. Le plateau sera dégagé la veille au soir, vous aurez la salle dès 8 h.' },
  { salonId: 'sl-cession', auteurId: 'mb-awa', minutes: 60 * 16, contenu: 'Pour l’hébergement, nous avons réservé trois chambres au centre-ville. Je vous envoie l’adresse par courriel.' },
  { salonId: 'sl-cession', auteurId: 'mb-manon', minutes: 60 * 8, contenu: 'Merci beaucoup. Une dernière chose : prévoyez-vous une captation vidéo ?', nonLuParMoi: true },

  // Ateliers jeunesse
  { salonId: 'sl-projets', auteurId: 'mb-malik', minutes: 60 * 34, contenu: 'Vingt-deux inscrits pour la saison, les autorisations parentales sont toutes rentrées.', reactions: [{ emoji: '👏', par: ['mb-awa', 'mb-camille'] }] },
  { salonId: 'sl-projets', auteurId: 'mb-hugo', minutes: 60 * 33, contenu: 'Je passe commande de la peinture cette semaine.' },
  { salonId: 'sl-projets', auteurId: 'mb-awa', minutes: 60 * 9, contenu: 'La séance de mercredi se tiendra en salle d’atelier, pas dans la grande salle.', modifie: true },

  // Messages directs
  { salonId: 'sl-dm-yanis', auteurId: 'mb-yanis', minutes: 60 * 5, contenu: 'Tu as pu regarder le rapprochement bancaire ? Il reste deux lignes que je n’arrive pas à pointer.' },
  { salonId: 'sl-dm-yanis', auteurId: 'mb-camille', minutes: 60 * 4, contenu: 'Pas encore, je m’y mets cet après-midi. Ce sont les deux virements de subvention ?' },
  { salonId: 'sl-dm-yanis', auteurId: 'mb-yanis', minutes: 55, contenu: 'Oui, exactement. Merci.', nonLuParMoi: true },

  { salonId: 'sl-dm-awa', auteurId: 'mb-awa', minutes: 60 * 12, contenu: 'Je pense qu’il faudra trancher sur le budget artistique avant le conseil. On en parle demain ?' },
  { salonId: 'sl-dm-awa', auteurId: 'mb-camille', minutes: 60 * 11, contenu: 'Volontiers, disons 14 h au bureau.' },

  { salonId: 'sl-dm-nadia', auteurId: 'mb-nadia', minutes: 60 * 26, contenu: 'Bonjour Camille, ravie que nos deux associations travaillent ensemble sur le forum.' },
  { salonId: 'sl-dm-nadia', auteurId: 'mb-camille', minutes: 60 * 25, contenu: 'Bonjour Nadia, tout pareil. C’est l’occasion de tester une organisation commune.' },
  { salonId: 'sl-dm-nadia', auteurId: 'mb-nadia', minutes: 60 * 3, contenu: 'Je vous envoie notre kit de communication dans la journée, vous y piocherez ce qui vous convient.', nonLuParMoi: true },

  // Forum 2025, archivé
  { salonId: 'sl-forum2025', auteurId: 'mb-camille', minutes: 60 * 24 * 350, contenu: 'Bilan de l’édition : 340 visiteurs sur la journée, 18 nouvelles adhésions.' },
  { salonId: 'sl-forum2025', auteurId: 'mb-nadia', minutes: 60 * 24 * 349, contenu: 'Excellente première. On refait la même l’an prochain ?' },
]

const LECTEURS_PAR_DEFAUT = ['mb-camille', 'mb-yanis', 'mb-awa', 'mb-malik']

export const messagesInitiaux: MessageChat[] = modelesMessages.map((m, i) => ({
  id: `ms-${100 + i}`,
  salonId: m.salonId,
  auteurId: m.auteurId,
  quand: instant(m.minutes),
  contenu: m.supprime ? '' : m.contenu,
  mentions: m.mentions ?? [],
  piecesJointes: (m.pieces ?? []).map((p, k) => ({ id: `pj-${i}-${k}`, ...p })),
  reactions: (m.reactions ?? []).map((r) => ({ emoji: r.emoji, membresIds: r.par })),
  reponseA: m.reponseAIndex !== undefined ? `ms-${100 + m.reponseAIndex}` : null,
  epingle: !!m.epingle,
  modifieLe: m.modifie ? instant(m.minutes - 5) : null,
  supprime: !!m.supprime,
  lecteursIds: m.nonLuParMoi ? LECTEURS_PAR_DEFAUT.filter((x) => x !== MOI_CHAT) : LECTEURS_PAR_DEFAUT,
  statutEnvoi: 'envoye',
}))

/* ------------------------------------------------------------------ */
/* Variantes de démonstration                                          */
/* ------------------------------------------------------------------ */

/** Un message resté en échec d'envoi, que l'on peut réessayer. */
export function messagesAvecEchec(): MessageChat[] {
  return [
    ...messagesInitiaux,
    {
      id: 'ms-echec',
      salonId: 'sl-general',
      auteurId: MOI_CHAT,
      quand: instant(2),
      contenu: 'Je passe récupérer les clés en fin de journée, prévenez-moi si le bureau est fermé.',
      mentions: [],
      piecesJointes: [],
      reactions: [],
      reponseA: null,
      epingle: false,
      modifieLe: null,
      supprime: false,
      lecteursIds: [MOI_CHAT],
      statutEnvoi: 'echec',
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpisChat = {
  salons: number
  salonsInter: number
  nonLus: number
  mentions: number
  associationsPartenaires: number
  membresEnLigne: number
}

export function calculerKpisChat(salons: Salon[], messages: MessageChat[]): KpisChat {
  const actifs = salons.filter((s) => !s.archive)
  return {
    salons: actifs.length,
    salonsInter: actifs.filter((s) => s.type === 'inter').length,
    nonLus: actifs.reduce((s, x) => s + nonLus(x.id, messages), 0),
    mentions: mentionsNonLues(messages).length,
    associationsPartenaires: new Set(actifs.flatMap((s) => s.associationsIds).filter((id) => id !== 'org-1')).size,
    membresEnLigne: membresChat.filter((m) => m.enLigne).length,
  }
}
