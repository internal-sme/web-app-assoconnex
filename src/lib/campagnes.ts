import { adherentsInitiaux, statutAdhesion, type StatutAdhesion } from './adherents'
import { emailValide } from './auth'
import { groupesInitiaux, tagsInitiaux, contactsInitiaux } from './mock'
import type { StatusKey } from '@/components/ui/Status'

/* ------------------------------------------------------------------ */
/* Repères temporels                                                   */
/* ------------------------------------------------------------------ */

/** Date de référence de la démonstration. */
export const MAINTENANT_CAMP = new Date('2026-09-08T09:00:00Z')

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

export const groupesDisponibles = groupesInitiaux.map((g) => g.nom)
export const tagsDisponibles = tagsInitiaux.map((t) => t.nom)

export const statutsAdhesionDisponibles: StatutAdhesion[] = ['active', 'expirant', 'expiree', 'resiliee']

export const statutAdhesionLabels: Record<StatutAdhesion, string> = {
  active: 'Adhésion active',
  expirant: 'Expire bientôt',
  expiree: 'Adhésion expirée',
  resiliee: 'Adhésion résiliée',
}

/* ------------------------------------------------------------------ */
/* Annuaire des personnes joignables                                   */
/* ------------------------------------------------------------------ */

export type CiblePersonne = {
  id: string
  prenom: string
  nom: string
  email: string
  groupes: string[]
  tags: string[]
  statutAdhesion: StatutAdhesion | null
  /** Consentement à recevoir des e-mails, enregistré sur la fiche contact. */
  consentementEmail: boolean
  consentementLe: string | null
  archive: boolean
}

function slug(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}

function nomPrenomEquivalent(a: string, b: string) {
  return slug(a) === slug(b)
}

/** Adresses volontairement invalides pour rendre l'exclusion visible sans manipulation. */
function emailDelaVariante(i: number, email: string) {
  if (i === 13 || i === 27) return 'adresse.invalide'
  if (i === 34) return '—'
  return email
}

/**
 * L'annuaire du module est dérivé des fiches contacts : les groupes et tags sont
 * ceux des contacts, le statut d'adhésion vient de l'adhérent de même identité.
 * Un seul point de vérité par nature d'information.
 */
export const annuaire: CiblePersonne[] = contactsInitiaux.map((c, i) => {
  const adherent = adherentsInitiaux.find((a) => nomPrenomEquivalent(`${a.prenom} ${a.nom}`, `${c.prenom} ${c.nom}`))
  return {
    id: c.id,
    prenom: c.prenom,
    nom: c.nom,
    email: emailDelaVariante(i, c.email),
    groupes: c.groupes,
    tags: c.tags,
    statutAdhesion: adherent ? statutAdhesion(adherent) : null,
    consentementEmail: c.communication.email,
    consentementLe: c.communication.consentementLe,
    archive: c.statut === 'archive',
  }
})

export function personneParId(id: string) {
  return annuaire.find((p) => p.id === id)
}

/* ------------------------------------------------------------------ */
/* Segments                                                            */
/* ------------------------------------------------------------------ */

export type SegmentDefinition = {
  groupes: string[]
  tags: string[]
  statutsAdhesion: StatutAdhesion[]
}

export function definitionVide(): SegmentDefinition {
  return { groupes: [], tags: [], statutsAdhesion: [] }
}

export function definitionEstVide(d: SegmentDefinition) {
  return d.groupes.length === 0 && d.tags.length === 0 && d.statutsAdhesion.length === 0
}

export function definitionEstVideRaison(d: SegmentDefinition) {
  return d.groupes.length === 0 && d.tags.length === 0 && d.statutsAdhesion.length === 0
}

/** Les personnes retenues par une définition : « ou » à l'intérieur d'un critère, « et » entre les critères. */
export function personnesDuSegment(def: SegmentDefinition): CiblePersonne[] {
  return annuaire.filter((p) => {
    if (p.archive) return false
    const groupes = def.groupes.length === 0 || def.groupes.some((g) => p.groupes.includes(g))
    const tags = def.tags.length === 0 || def.tags.some((t) => p.tags.includes(t))
    const statuts =
      def.statutsAdhesion.length === 0 ||
      (p.statutAdhesion !== null && def.statutsAdhesion.includes(p.statutAdhesion))
    return groupes && tags && statuts
  })
}

export function joignablesDuSegment(def: SegmentDefinition, desinscritsIds: string[]): CiblePersonne[] {
  const exclus = new Set(desinscritsIds)
  return personnesDuSegment(def).filter((p) => !exclus.has(p.id) && emailValide(p.email) && p.consentementEmail)
}

export type MotifEcart = 'consentement' | 'desinscrit' | 'invalide'
export type Ecart = { motif: MotifEcart; label: string; nombre: number; detail: string }

export type DecompteSegment = {
  total: number
  joignables: number
  ecarts: Ecart[]
  personnes: CiblePersonne[]
}

/**
 * Décompte en direct : les consentements refusés, les désinscrits et les adresses
 * invalides sont déduits des destinataires joignables, avec le détail de ce qui
 * est écarté et pourquoi.
 */
export function decompteSegment(def: SegmentDefinition, desinscritsIds: string[]): DecompteSegment {
  const exclus = new Set(desinscritsIds)
  const pool = personnesDuSegment(def)
  const personnes: CiblePersonne[] = []
  const ecarts: Ecart[] = [
    { motif: 'desinscrit', label: 'Désinscrit·e·s', nombre: 0, detail: 'Se sont retirés des envois ; la désinscription est définitive.' },
    { motif: 'invalide', label: 'Adresses invalides', nombre: 0, detail: "L'adresse ne peut pas recevoir de message : elle ne sera pas contactée." },
    { motif: 'consentement', label: 'Consentement refusé', nombre: 0, detail: "Ces personnes n'ont pas consenti aux communications par e-mail." },
  ]

  for (const p of pool) {
    if (exclus.has(p.id)) {
      ecarts[0].nombre++
    } else if (!emailValide(p.email)) {
      ecarts[1].nombre++
    } else if (!p.consentementEmail) {
      ecarts[2].nombre++
    } else {
      personnes.push(p)
    }
  }

  return { total: pool.length, joignables: personnes.length, ecarts, personnes }
}

export type Segment = {
  id: string
  nom: string
  description: string
  definition: SegmentDefinition
}

/* ------------------------------------------------------------------ */
/* Campagnes                                                           */
/* ------------------------------------------------------------------ */

export type StatutCampagne = 'brouillon' | 'programmee' | 'en_cours' | 'envoyee' | 'echec' | 'annulee'

export type ChampPersonnalisation = '{{prenom}}' | '{{nom}}' | '{{nom_complet}}'

export const champsPersonnalisation: { valeur: ChampPersonnalisation; label: string }[] = [
  { valeur: '{{prenom}}', label: 'Prénom' },
  { valeur: '{{nom}}', label: 'Nom' },
  { valeur: '{{nom_complet}}', label: 'Nom complet' },
]

/**
 * Cible d'une campagne : un segment existant (par référence, avec sa définition
 * recopiée pour rester stable) ou une construction à la volée.
 */
export type CibleCampagne =
  | { type: 'segment'; segmentId: string; nom: string; definition: SegmentDefinition }
  | { type: 'libre'; definition: SegmentDefinition }

export function cibleDefinition(c: CibleCampagne): SegmentDefinition {
  return c.definition
}

export function cibleNom(c: CibleCampagne): string {
  return c.type === 'segment' ? c.nom : 'Segment construit à la volée'
}

export type EtatDestinataire = 'envoye' | 'ouvert' | 'clique' | 'desinscrit' | 'rebond'

export type DestinataireCampagne = {
  id: string
  prenom: string
  nom: string
  email: string
  etat: EtatDestinataire
}

export type Campagne = {
  id: string
  nom: string
  objet: string
  /** Texte de prévisualisation affiché dans la liste des messages. */
  previsualisation: string
  /** Corps au format Markdown léger, produit par l'éditeur enrichi. */
  corps: string
  expediteurNom: string
  adresseReponse: string
  cible: CibleCampagne
  /** Envoi immédiat vrai ; sinon une date de programmation. */
  immediat: boolean
  programmeeLe: string | null
  statut: StatutCampagne
  creeLe: string
  envoyeLe: string | null
  testEnvoyeALe: string | null
  /** Avancement de l'envoi en cours, de 0 à 100. */
  envoiProgression: number
  /** Instantané des destinataires au moment de l'envoi. */
  destinataires: DestinataireCampagne[]
}

export const statutCampagneLabels: Record<StatutCampagne, string> = {
  brouillon: 'Brouillon',
  programmee: 'Programmée',
  en_cours: 'Envoi en cours',
  envoyee: 'Envoyée',
  echec: 'Envoi échoué',
  annulee: 'Annulée',
}

/** Correspondance vers le système de badges du design system. */
export const statutCampagneStatusKey: Record<StatutCampagne, StatusKey> = {
  brouillon: 'brouillon',
  programmee: 'camp_programmee',
  en_cours: 'camp_en_cours',
  envoyee: 'camp_envoyee',
  echec: 'camp_echec',
  annulee: 'camp_annulee',
}

export const etatDestinataireStatusKey: Record<EtatDestinataire, StatusKey> = {
  envoye: 'dest_envoye',
  ouvert: 'dest_ouvert',
  clique: 'dest_clique',
  desinscrit: 'dest_desinscrit',
  rebond: 'dest_rebond',
}

export type StatsCampagne = {
  envoye: number
  ouvert: number
  clique: number
  desinscrit: number
  rebond: number
  tauxOuverture: number
  tauxClic: number
  tauxRebond: number
}

export function statsCampagne(c: Campagne): StatsCampagne {
  const d = c.destinataires
  const envoye = d.length
  const ouvert = d.filter((x) => x.etat === 'ouvert' || x.etat === 'clique').length
  const clique = d.filter((x) => x.etat === 'clique').length
  const desinscrit = d.filter((x) => x.etat === 'desinscrit').length
  const rebond = d.filter((x) => x.etat === 'rebond').length
  return {
    envoye,
    ouvert,
    clique,
    desinscrit,
    rebond,
    tauxOuverture: envoye === 0 ? 0 : Math.round((ouvert / envoye) * 100),
    tauxClic: envoye === 0 ? 0 : Math.round((clique / envoye) * 100),
    tauxRebond: envoye === 0 ? 0 : Math.round((rebond / envoye) * 100),
  }
}

/** Répartition temporelle de la courbe d'ouverture après l'envoi. */
export function courbeOuverturesHeures(c: Campagne) {
  const total = c.destinataires.filter((x) => x.etat === 'ouvert' || x.etat === 'clique').length
  const parts = [0.18, 0.4, 0.58, 0.76, 0.92, 1]
  const bornes = ['+1 h', '+3 h', '+6 h', '+12 h', '+24 h', '+48 h']
  return bornes.map((label, i) => ({
    label,
    valeur: Math.round(total * parts[i]),
  }))
}

/** Personnalisation des champs dans le corps, comme à l'envoi. */
export function personnaliser(texte: string, p: { prenom: string; nom: string }) {
  return texte
    .replace(/\{\{prenom\}\}/g, p.prenom)
    .replace(/\{\{nom\}\}/g, p.nom)
    .replace(/\{\{nom_complet\}\}/g, `${p.prenom} ${p.nom}`)
}

/* ------------------------------------------------------------------ */
/* Modèles de campagne                                                 */
/* ------------------------------------------------------------------ */

export type ModeleCampagne = {
  id: string
  nom: string
  categorie: string
  objet: string
  previsualisation: string
  corps: string
}

export const modelesCampagneInitiaux: ModeleCampagne[] = [
  {
    id: 'mo-camp-cotisation',
    nom: 'Relance de cotisation à l’échéance',
    categorie: 'Adhésions',
    objet: 'Votre cotisation pour la saison en cours',
    previsualisation: 'Sauf erreur de notre part, votre cotisation pour la saison en cours ne nous est pas encore parvenue.',
    corps: 'Bonjour {{prenom}},\n\nSauf erreur de notre part, votre cotisation pour la saison en cours ne nous est pas encore parvenue.\n\n**Comment régler**\n\n- Par virement à l’ordre de l’association\n- Par chèque, lors d’une permanence\n- En ligne, depuis l’espace adhérent\n\nMerci de votre soutien, ',
  },
  {
    id: 'mo-camp-info',
    nom: 'Lettre d’information',
    categorie: 'Vie associative',
    objet: 'Les nouvelles de {{prenom}} association',
    previsualisation: 'Vie de l’association, rendez-vous à venir et coulisses de nos actions.',
    corps: 'Bonjour {{prenom}},\n\nVoici les nouvelles du trimestre.\n\n**Au programme**\n\n- Le festival, et comment nous y préparer\n- Les permanences d’octobre\n- Une demande de soutien pour la restauration du moulin\n\nÀ très bientôt, ',
  },
  {
    id: 'mo-camp-invitation',
    nom: 'Invitation à une manifestation',
    categorie: 'Événements',
    objet: 'Vous êtes invité à {{nomCompletPiece}}…',
    previsualisation: 'Date, lieu et programme de la manifestation.',
    corps: 'Bonjour {{prenom}},\n\nL’association a le plaisir de vous convier à sa prochaine manifestation.\n\n**Où et quand**\n\n- {date}\n- {lieu}\n\nL’entrée est libre. Venez nombreux !',
  },
  {
    id: 'mo-camp-benevoles',
    nom: 'Appel à bénévoles',
    categorie: 'Bénévolat',
    objet: 'Donnez un coup de main à la fête annuelle',
    previsualisation: 'Quelques heures suffisent. Chaque aide compte.',
    corps: 'Bonjour {{prenom}},\n\nSans les bénévoles, rien ne serait possible. Pour la fête annuelle, il nous manque des bras pour la buvette, l’accueil et le rangement.\n\n**Vous pouvez proposer vos disponibilités dès maintenant**\n\nMerci uniquement, ',
  },
  {
    id: 'mo-camp-remerciement',
    nom: 'Remerciement après une action',
    categorie: 'Bénévolat',
    objet: 'Merci pour votre engagement',
    previsualisation: 'Un grand merci, et les résultats de l’action en chiffres.',
    corps: 'Bonjour {{prenom}},\n\nMerci. Grâce à vous, cette action a été un succès : 230 participants, 1 400 € récoltés pour les ateliers jeunesse.\n\nÀ très bientôt, ',
  },
]

/* ------------------------------------------------------------------ */
/* Désinscriptions                                                     */
/* ------------------------------------------------------------------ */

export type Desinscription = {
  id: string
  contactId: string
  prenom: string
  nom: string
  email: string
  campagneId: string
  campagneNom: string
  quand: string
  motif: string
}

/* ------------------------------------------------------------------ */
/* Données mockées                                                     */
/* ------------------------------------------------------------------ */

function instant(joursAvant: number, heure = 9) {
  return new Date(MAINTENANT_CAMP.getTime() - joursAvant * 86400000).toISOString().slice(0, 11) + `${String(heure).padStart(2, '0')}:00:00.000Z`
}

function jourAvec(decaleJours: number, heure = 9) {
  return new Date(MAINTENANT_CAMP.getTime() + decaleJours * 86400000).toISOString().slice(0, 11) + `${String(heure).padStart(2, '0')}:00:00.000Z`
}

export const segmentsInitiaux: Segment[] = [
  {
    id: 'seg-adherents-actifs',
    nom: 'Adhérents actifs',
    description: 'Les personnes dont l’adhésion est active ou va bientôt expirer.',
    definition: { groupes: [], tags: [], statutsAdhesion: ['active', 'expirant'] },
  },
  {
    id: 'seg-section-rando',
    nom: 'Section randonnée',
    description: 'Les contacts inscrits à la section randonnée.',
    definition: { groupes: ['Section randonnée'], tags: [], statutsAdhesion: [] },
  },
  {
    id: 'seg-communication',
    nom: 'Commission communication',
    description: 'Les membres de la commission, pour la préparation d’une lettre.',
    definition: { groupes: ['Commission communication'], tags: [], statutsAdhesion: [] },
  },
  {
    id: 'seg-evenements-photo',
    nom: 'Équipe événements — droit à l’image',
    description: 'Les bénévoles des événements ayant donné leur droit à l’image.',
    definition: { groupes: ['Équipe événements'], tags: ['Droit à l’image'], statutsAdhesion: [] },
  },
  {
    id: 'seg-donateurs',
    nom: 'Donateurs réguliers',
    description: 'Les personnes taguées « Don régulier ».',
    definition: { groupes: [], tags: ['Don régulier'], statutsAdhesion: [] },
  },
]

/** Un segment volontairement sans correspondance, pour le menu « États ». */
export function segmentsAvecVide(): Segment[] {
  return [
    ...segmentsInitiaux,
    {
      id: 'seg-vide',
      nom: 'Sans correspondance',
      description: 'Panne de droits sur un groupe qui n’existe plus — aucune personne retenue.',
      definition: { groupes: ['Section orchestre'], tags: [], statutsAdhesion: [] },
    },
  ]
}

/* --- Génération des destinataires d'une campagne envoyée --- */

function genererDestinataires(
  def: SegmentDefinition,
  desinscritsIds: string[],
  totals: { envoye: number; ouvert: number; clique: number; rebond: number; desinscrit: number },
): DestinataireCampagne[] {
  const joignables = joignablesDuSegment(def, desinscritsIds)
  const pris = joignables.slice(0, totals.envoye)
  let rebond = totals.rebond
  let desinscrit = totals.desinscrit
  let clique = totals.clique
  let ouvert = totals.ouvert
  return pris.map((p) => {
    if (rebond > 0) {
      rebond--
      return { id: p.id, prenom: p.prenom, nom: p.nom, email: p.email, etat: 'rebond' }
    }
    if (desinscrit > 0) {
      desinscrit--
      return { id: p.id, prenom: p.prenom, nom: p.nom, email: p.email, etat: 'desinscrit' }
    }
    if (clique > 0) {
      clique--
      return { id: p.id, prenom: p.prenom, nom: p.nom, email: p.email, etat: 'clique' }
    }
    if (ouvert > 0) {
      ouvert--
      return { id: p.id, prenom: p.prenom, nom: p.nom, email: p.email, etat: 'ouvert' }
    }
    return { id: p.id, prenom: p.prenom, nom: p.nom, email: p.email, etat: 'envoye' }
  })
}

/* --- Campagnes du jeu nominal --- */

export const campagnesNominales: Campagne[] = [
  {
    id: 'camp-1',
    nom: 'Lettre d’information — avril',
    objet: 'Les nouvelles du printemps',
    previsualisation: 'Résultats de la brocante, ateliers jeunesse, et le programme de l’été.',
    corps: 'Bonjour {{prenom}},\n\nVoici les nouvelles du printemps.\n\n**La brocante** a rapporté 1 850 €, un record.\n\n**Les ateliers jeunesse** reprennent le mercredi.\n\nÀ très bientôt, ',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'segment', segmentId: 'seg-adherents-actifs', nom: 'Adhérents actifs', definition: segmentsInitiaux[0].definition },
    immediat: true,
    programmeeLe: null,
    statut: 'envoyee',
    creeLe: instant(140),
    envoyeLe: instant(128),
    testEnvoyeALe: instant(128, 8),
    envoiProgression: 100,
    destinataires: genererDestinataires(segmentsInitiaux[0].definition, [], { envoye: 88, ouvert: 52, clique: 18, rebond: 2, desinscrit: 0 }),
  },
  {
    id: 'camp-2',
    nom: 'Invitation — assemblée générale',
    objet: 'Convocation à l’assemblée générale 2026',
    previsualisation: 'Ordre du jour détaillé, modalités de vote et procuration.',
    corps: 'Bonjour {{prenom}},\n\nVous êtes convié à l’assemblée générale.\n\n**Ordre du jour**\n\n- Rapport d’activité\n- Rapport financier\n- Élections\n- Questions diverses\n\nMerci de répondre avant le 5 mai.',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'segment', segmentId: 'seg-adherents-actifs', nom: 'Adhérents actifs', definition: segmentsInitiaux[0].definition },
    immediat: true,
    programmeeLe: null,
    statut: 'envoyee',
    creeLe: instant(80),
    envoyeLe: instant(72),
    testEnvoyeALe: instant(72, 8),
    envoiProgression: 100,
    destinataires: genererDestinataires(segmentsInitiaux[0].definition, [], { envoye: 105, ouvert: 70, clique: 31, rebond: 1, desinscrit: 0 }),
  },
  {
    id: 'camp-3',
    nom: 'Lettre d’information — juin',
    objet: 'Le programme de l’été est prêt',
    previsualisation: 'Permanences estivales et premiers détails du festival.',
    corps: 'Bonjour {{prenom}},\n\nL’été approche. Voici ce qui vous attend.\n\n- Les permanences changent d’horaires\n- Le festival se prépare\n- Appel à bénévoles en fin de message\n\nÀ très bientôt, ',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'libre', definition: { groupes: ['Section randonnée'], tags: [], statutsAdhesion: [] } },
    immediat: true,
    programmeeLe: null,
    statut: 'envoyee',
    creeLe: instant(48),
    envoyeLe: instant(40),
    testEnvoyeALe: null,
    envoiProgression: 100,
    destinataires: genererDestinataires({ groupes: ['Section randonnée'], tags: [], statutsAdhesion: [] }, [], { envoye: 97, ouvert: 58, clique: 24, rebond: 3, desinscrit: 0 }),
  },
  {
    id: 'camp-4',
    nom: 'Invitation — fête annuelle',
    objet: 'La fête annuelle, le 18 juillet',
    previsualisation: 'Buvette, tombola, spectacle — réservez votre soirée.',
    corps: 'Bonjour {{prenom}},\n\nLa fête annuelle revient le 18 juillet.\n\n**Le programme**\n\n- 18 h : apéritif offert\n- 19 h : spectacle vivant\n- 21 h : bal et buvette\n\nUne participation de 5 € est demandée à l’entrée.',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'segment', segmentId: 'seg-evenements-photo', nom: 'Équipe événements — droit à l’image', definition: segmentsInitiaux[3].definition },
    immediat: true,
    programmeeLe: null,
    statut: 'envoyee',
    creeLe: instant(30),
    envoyeLe: instant(22),
    testEnvoyeALe: instant(22, 8),
    envoiProgression: 100,
    destinataires: genererDestinataires(segmentsInitiaux[3].definition, ['ct-desinscrit-2'], { envoye: 96, ouvert: 61, clique: 28, rebond: 1, desinscrit: 2 }),
  },
  {
    id: 'camp-5',
    nom: 'Rappel des permanences d’août',
    objet: 'Permanences d’août : horaires allégés',
    previsualisation: 'L’accueil reste ouvert le samedi matin.',
    corps: 'Bonjour {{prenom}},\n\nEn août, l’accueil est ouvert le samedi matin uniquement.\n\nMerci de votre compréhension, ',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'libre', definition: { groupes: [], tags: [], statutsAdhesion: ['active', 'expirant', 'expiree'] } },
    immediat: true,
    programmeeLe: null,
    statut: 'envoyee',
    creeLe: instant(12),
    envoyeLe: instant(6),
    testEnvoyeALe: null,
    envoiProgression: 100,
    destinataires: genererDestinataires({ groupes: [], tags: [], statutsAdhesion: ['active', 'expirant', 'expiree'] }, [], { envoye: 64, ouvert: 35, clique: 6, rebond: 4, desinscrit: 0 }),
  },
  {
    id: 'camp-6',
    nom: 'Lettre d’information — rentrée',
    objet: 'La rentrée, le festival, et vos prochaines échéances',
    previsualisation: 'Les dates du festival, le changement de permanence et le renouvellement des cotisations.',
    corps: 'Bonjour {{prenom}},\n\nLa rentrée démarre fort.\n\n**Le festival** aura lieu les 3 et 4 octobre.\n\n**Les cotisations** seront relancées à partir du 15 septembre.\n\nÀ très bientôt, ',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'segment', segmentId: 'seg-adherents-actifs', nom: 'Adhérents actifs', definition: segmentsInitiaux[0].definition },
    immediat: true,
    programmeeLe: null,
    statut: 'envoyee',
    creeLe: instant(5),
    envoyeLe: instant(2),
    testEnvoyeALe: instant(2, 8),
    envoiProgression: 100,
    destinataires: genererDestinataires(segmentsInitiaux[0].definition, [], { envoye: 118, ouvert: 66, clique: 30, rebond: 1, desinscrit: 1 }),
  },
  {
    id: 'camp-7',
    nom: 'Sélection — programme du festival',
    objet: 'Le programme du festival en avant-première',
    previsualisation: 'Un avant-goût du programme avant l’ouverture des réservations.',
    corps: 'Bonjour {{prenom}},\n\nLe programme du festival est prêt. En avant-première, voici les temps forts.\n\n**Vendredi** — concert d’ouverture\n**Samedi** — marché des producteurs et spectacles\n**Dimanche** — balades et clôture\n\nLes réservations ouvriront le 12 septembre.',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'segment', segmentId: 'seg-adherents-actifs', nom: 'Adhérents actifs', definition: segmentsInitiaux[0].definition },
    immediat: true,
    programmeeLe: null,
    statut: 'brouillon',
    creeLe: instant(3),
    envoyeLe: null,
    testEnvoyeALe: null,
    envoiProgression: 0,
    destinataires: [],
  },
  {
    id: 'camp-8',
    nom: 'Brouillon — lettre aux randonneurs',
    objet: '',
    previsualisation: '',
    corps: 'Bonjour,\n\nLes sorties d’automne sont en préparation. \n\nÀ bientôt sur les chemins, ',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'segment', segmentId: 'seg-section-rando', nom: 'Section randonnée', definition: segmentsInitiaux[1].definition },
    immediat: true,
    programmeeLe: null,
    statut: 'brouillon',
    creeLe: instant(1),
    envoyeLe: null,
    testEnvoyeALe: null,
    envoiProgression: 0,
    destinataires: [],
  },
  {
    id: 'camp-9',
    nom: 'Portes ouvertes du 4 octobre',
    objet: 'Portes ouvertes — le festival a besoin de vous',
    previsualisation: 'Ouverture des portes ouvertes : inscriptions des bénévoles d’ici le 19 septembre.',
    corps: 'Bonjour {{prenom}},\n\nAvant de vous envoyer la suite, nous comptons sur vous.\n\nNous avons besoin d’équipes pour l’accueil et la buvette pendant les portes ouvertes du 4 octobre.\n\nMerci de répondre avant le 19 septembre.',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'segment', segmentId: 'seg-evenements-photo', nom: 'Équipe événements — droit à l’image', definition: segmentsInitiaux[3].definition },
    immediat: false,
    programmeeLe: jourAvec(17, 10),
    statut: 'programmee',
    creeLe: instant(2),
    envoyeLe: null,
    testEnvoyeALe: instant(2, 14),
    envoiProgression: 0,
    destinataires: [],
  },
]

/** Une campagne restée en échec d'envoi, que l'on peut relancer. */
export function campagneAvecEchec(): Campagne {
  return {
    id: 'camp-echec',
    nom: 'Programme du festival — envoi public',
    objet: 'Le programme complet du festival',
    previsualisation: 'Le programme complet, enfin : week-end des 3 et 4 octobre.',
    corps: 'Bonjour {{prenom}},\n\nVoici le programme complet du festival.\n\n**Consultez la suite dès maintenant**\n\nÀ très bientôt, ',
    expediteurNom: 'Les Amis du Vieux Moulin',
    adresseReponse: 'contact@vieuxmoulin.fr',
    cible: { type: 'segment', segmentId: 'seg-adherents-actifs', nom: 'Adhérents actifs', definition: segmentsInitiaux[0].definition },
    immediat: true,
    programmeeLe: null,
    statut: 'echec',
    creeLe: instant(1),
    envoyeLe: null,
    testEnvoyeALe: instant(1, 14),
    envoiProgression: 34,
    destinataires: [],
  }
}

/** Une campagne figée en cours d'envoi, pour montrer la progression. */
export function campagneEnCours(): Campagne {
  return {
    ...campagnesNominales[6],
    id: 'camp-en-cours',
    statut: 'en_cours',
    envoiProgression: 55,
    destinataires: genererDestinataires(campagnesNominales[6].cible.definition, [], { envoye: 48, ouvert: 12, clique: 3, rebond: 0, desinscrit: 0 }),
  }
}

/* --- Désinscriptions du registre --- */

function contactPar(echecNom: string) {
  return annuaire.find((p) => slug(`${p.prenom} ${p.nom}`) === slug(echecNom))
}

const desinscritsRegistre: { nomComplet: string; campagneId: string; decalageJours: number; motif: string }[] = [
  { nomComplet: 'Inès Kouassi', campagneId: 'camp-4', decalageJours: 19, motif: 'Je souhaite rester membre, sans recevoir vos invitations.' },
  { nomComplet: 'Karim Rousseau', campagneId: 'camp-4', decalageJours: 18, motif: '' },
  { nomComplet: 'Rémi Vasseur', campagneId: 'camp-6', decalageJours: 0, motif: 'Trop de messages. Retirez-moi de vos listes.' },
]

export const desinscriptionsInitiaux: Desinscription[] = desinscritsRegistre
  .map((d, i) => {
    const p = contactPar(d.nomComplet)
    if (!p) return null
    return {
      id: `ds-${i + 1}`,
      contactId: p.id,
      prenom: p.prenom,
      nom: p.nom,
      email: p.email,
      campagneId: d.campagneId,
      campagneNom: campagnesNominales.find((c) => c.id === d.campagneId)?.nom ?? 'Campagne',
      quand: instant(d.decalageJours, 16),
      motif: d.motif,
    }
  })
  .filter((d): d is Desinscription => d !== null)

export const desinscritsIdsInitiaux = desinscriptionsInitiaux.map((d) => d.contactId)

/* ------------------------------------------------------------------ */
/* Indicateurs du tableau de bord                                      */
/* ------------------------------------------------------------------ */

export type KpisCampagnes = {
  envoyees: number
  destinataires: number
  tauxOuvertureMoyen: number
  tauxClicMoyen: number
  desinscriptions: number
  enPreparation: number
}

export function calculerKpis(campagnes: Campagne[], desinscriptions: Desinscription[]): KpisCampagnes {
  const envoyees = campagnes.filter((c) => c.statut === 'envoyee')
  const stats = envoyees.map(statsCampagne)
  const destinataires = stats.reduce((s, x) => s + x.envoye, 0)
  const tauxOuvertureMoyen =
    envoyees.length === 0 ? 0 : Math.round((stats.reduce((s, x) => s + x.tauxOuverture, 0) / envoyees.length))
  const tauxClicMoyen = envoyees.length === 0 ? 0 : Math.round((stats.reduce((s, x) => s + x.tauxClic, 0) / envoyees.length))
  return {
    envoyees: envoyees.length,
    destinataires,
    tauxOuvertureMoyen,
    tauxClicMoyen,
    desinscriptions: desinscriptions.length,
    enPreparation: campagnes.filter((c) => c.statut === 'brouillon' || c.statut === 'programmee' || c.statut === 'en_cours').length,
  }
}

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Envois et ouvertures cumulés des six derniers mois, pour la courbe du tableau de bord. */
export function serieEnvoisOuvertures(campagnes: Campagne[]) {
  const envoyees = campagnes.filter((c) => c.statut === 'envoyee' && c.envoyeLe)
  const labels: string[] = []
  const envois: number[] = []
  const ouvertures: number[] = []
  for (let k = 5; k >= 0; k--) {
    const d = new Date(Date.UTC(MAINTENANT_CAMP.getUTCFullYear(), MAINTENANT_CAMP.getUTCMonth() - k, 1))
    const dans = (c: Campagne) => {
      const t = new Date(c.envoyeLe!).getTime()
      return (
        t >= Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) &&
        t < Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
      )
    }
    const mois = envoyees.filter(dans)
    labels.push(`${MOIS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`)
    envois.push(mois.reduce((s, c) => s + c.destinataires.length, 0))
    ouvertures.push(mois.reduce((s, c) => s + statsCampagne(c).ouvert, 0))
  }
  return { labels, envois, ouvertures }
}