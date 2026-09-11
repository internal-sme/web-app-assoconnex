export const AUJOURDHUI_AGENDA = new Date('2026-09-07T00:00:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type VisibiliteCalendrier = 'personnel' | 'association' | 'partage'

export type Calendrier = {
  id: string
  nom: string
  description: string
  visibilite: VisibiliteCalendrier
  couleur: string
  proprietaire: string
  /** Faux pour masquer temporairement le calendrier dans les vues. */
  actif: boolean
}

export type Salle = { id: string; nom: string; capacite: number; equipements: string[] }

export type Recurrence = 'aucune' | 'quotidien' | 'hebdomadaire' | 'bimensuel' | 'mensuel' | 'annuel'

export const recurrenceLabels: Record<Recurrence, string> = {
  aucune: 'Ponctuel',
  quotidien: 'Tous les jours',
  hebdomadaire: 'Toutes les semaines',
  bimensuel: 'Toutes les deux semaines',
  mensuel: 'Tous les mois',
  annuel: 'Tous les ans',
}

export type ReponseParticipant = 'attente' | 'accepte' | 'refuse' | 'peut_etre'

export const reponseLabels: Record<ReponseParticipant, string> = {
  attente: 'Sans réponse',
  accepte: 'Accepté',
  refuse: 'Refusé',
  peut_etre: 'Peut-être',
}

export type Participant = {
  id: string
  nom: string
  email: string
  reponse: ReponseParticipant
  /** Un participant facultatif n'entre pas dans le calcul du quorum. */
  requis: boolean
  estMoi: boolean
}

export type StatutEvenement = 'confirme' | 'provisoire' | 'annule'

export const statutEvenementLabels: Record<StatutEvenement, string> = {
  confirme: 'Confirmé',
  provisoire: 'Provisoire',
  annule: 'Annulé',
}

export type Notification = { id: string; delaiMinutes: number; canal: 'application' | 'email' }

export const delaiLabels: Record<number, string> = {
  0: 'À l’heure de l’événement',
  10: '10 minutes avant',
  30: '30 minutes avant',
  60: '1 heure avant',
  1440: '1 jour avant',
  10080: '1 semaine avant',
}

export type PieceJointeEvt = { id: string; nom: string; taille: string }

export type EvenementAgenda = {
  id: string
  reference: string
  titre: string
  description: string
  debut: string
  fin: string
  journeeEntiere: boolean
  lieu: string
  salleId: string | null
  recurrence: Recurrence
  recurrenceFinLe: string | null
  calendrierId: string
  organisateur: string
  participants: Participant[]
  projetId: string | null
  /** Rattachement à une action associative : assemblée, atelier, événement public… */
  actionAssociative: string | null
  piecesJointes: PieceJointeEvt[]
  notifications: Notification[]
  statut: StatutEvenement
  motifAnnulation: string
}

export type CompteSynchro = {
  id: string
  fournisseur: string
  compte: string
  sens: 'import' | 'export' | 'bidirectionnel'
  etat: 'connecte' | 'erreur' | 'inactif'
  derniereSynchro: string | null
  message: string
  evenementsImportes: number
}

/* ------------------------------------------------------------------ */
/* Référentiels                                                        */
/* ------------------------------------------------------------------ */

export const MOI_AGENDA = { nom: 'Camille Beauchamp', email: 'camille.beauchamp@vieuxmoulin.fr' }

export const calendriersInitiaux: Calendrier[] = [
  { id: 'cal-perso', nom: 'Mon agenda', description: 'Vos rendez-vous personnels, visibles de vous seul.', visibilite: 'personnel', couleur: '#2364AA', proprietaire: MOI_AGENDA.nom, actif: true },
  { id: 'cal-asso', nom: 'Agenda de l’association', description: 'Assemblées, conseils, événements publics.', visibilite: 'association', couleur: '#1D5391', proprietaire: 'Les Amis du Vieux Moulin', actif: true },
  { id: 'cal-theatre', nom: 'Section théâtre', description: 'Répétitions et représentations.', visibilite: 'partage', couleur: '#9A5B00', proprietaire: 'Awa Diallo', actif: true },
  { id: 'cal-rando', nom: 'Section randonnée', description: 'Sorties et reconnaissances de parcours.', visibilite: 'partage', couleur: '#127A4C', proprietaire: 'Hugo Fournier', actif: true },
  { id: 'cal-jeunesse', nom: 'Ateliers jeunesse', description: 'Séances hebdomadaires et sorties.', visibilite: 'partage', couleur: '#B42318', proprietaire: 'Malik Benali', actif: true },
  { id: 'cal-bureau', nom: 'Bureau', description: 'Réunions de bureau et points de coordination.', visibilite: 'partage', couleur: '#525A66', proprietaire: 'Yanis Traoré', actif: false },
]

export const sallesInitiales: Salle[] = [
  { id: 'sl-grande', nom: 'Grande salle', capacite: 180, equipements: ['Scène', 'Sonorisation', 'Gradins'] },
  { id: 'sl-atelier', nom: 'Salle d’atelier', capacite: 24, equipements: ['Tables', 'Point d’eau', 'Rangements'] },
  { id: 'sl-reunion', nom: 'Salle de réunion', capacite: 12, equipements: ['Écran', 'Visioconférence'] },
  { id: 'sl-bureau', nom: 'Bureau administratif', capacite: 4, equipements: ['Imprimante'] },
]

export const personnes = [
  { nom: 'Camille Beauchamp', email: 'camille.beauchamp@vieuxmoulin.fr' },
  { nom: 'Yanis Traoré', email: 'yanis.traore@vieuxmoulin.fr' },
  { nom: 'Awa Diallo', email: 'awa.diallo@vieuxmoulin.fr' },
  { nom: 'Élodie Nguyen', email: 'elodie.nguyen@vieuxmoulin.fr' },
  { nom: 'Malik Benali', email: 'malik.benali@vieuxmoulin.fr' },
  { nom: 'Hugo Fournier', email: 'hugo.fournier@exemple.fr' },
]

export const actionsAssociatives = [
  'Assemblée générale',
  'Conseil d’administration',
  'Réunion de bureau',
  'Atelier',
  'Répétition',
  'Représentation',
  'Sortie',
  'Événement public',
  'Formation',
  'Permanence',
]

/* ------------------------------------------------------------------ */
/* Utilitaires de date, en UTC pour rester déterministe                */
/* ------------------------------------------------------------------ */

export function jourAgenda(d: number, heure = 0, minute = 0) {
  const base = new Date(AUJOURDHUI_AGENDA.getTime() + d * 86400000)
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate(), heure, minute)).toISOString()
}

export function memeJour(a: Date | string, b: Date | string) {
  const x = new Date(a)
  const y = new Date(b)
  return x.getUTCFullYear() === y.getUTCFullYear() && x.getUTCMonth() === y.getUTCMonth() && x.getUTCDate() === y.getUTCDate()
}

export function heureDe(iso: string) {
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

export function creneauDe(e: EvenementAgenda) {
  if (e.journeeEntiere) return 'Journée entière'
  return `${heureDe(e.debut)} – ${heureDe(e.fin)}`
}

export function dureeMinutes(e: EvenementAgenda) {
  return Math.round((new Date(e.fin).getTime() - new Date(e.debut).getTime()) / 60000)
}

/** Lundi de la semaine contenant la date. */
export function debutSemaine(d: Date) {
  const jour = (d.getUTCDay() + 6) % 7
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - jour))
}

export const NOMS_JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
export const NOMS_MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/* ------------------------------------------------------------------ */
/* Conflits                                                            */
/* ------------------------------------------------------------------ */

export type Conflit = {
  evenement: EvenementAgenda
  /** Ce qui entre en collision : la salle ou une personne. */
  type: 'salle' | 'participant'
  detail: string
}

function seChevauchent(a: EvenementAgenda, b: EvenementAgenda) {
  const d1 = new Date(a.debut).getTime()
  const f1 = new Date(a.fin).getTime()
  const d2 = new Date(b.debut).getTime()
  const f2 = new Date(b.fin).getTime()
  return d1 < f2 && d2 < f1
}

/**
 * Détecte les collisions d'un événement avec les autres : même salle sur un
 * créneau qui se chevauche, ou participant requis déjà attendu ailleurs.
 */
export function detecterConflits(
  evenement: EvenementAgenda,
  tous: EvenementAgenda[],
  salles: Salle[] = sallesInitiales,
): Conflit[] {
  const out: Conflit[] = []
  const candidats = tous.filter((e) => e.id !== evenement.id && e.statut !== 'annule' && seChevauchent(evenement, e))

  for (const autre of candidats) {
    if (evenement.salleId && autre.salleId === evenement.salleId) {
      out.push({
        evenement: autre,
        type: 'salle',
        detail: `${salles.find((s) => s.id === evenement.salleId)?.nom ?? 'La salle'} est déjà réservée pour « ${autre.titre} ».`,
      })
      continue
    }
    const communs = evenement.participants
      .filter((p) => p.requis)
      .filter((p) => autre.participants.some((q) => q.requis && q.email === p.email && q.reponse !== 'refuse'))
    if (communs.length > 0) {
      out.push({
        evenement: autre,
        type: 'participant',
        detail: `${communs.map((p) => p.nom).join(', ')} ${communs.length > 1 ? 'sont attendus' : 'est attendu'} à « ${autre.titre} » sur le même créneau.`,
      })
    }
  }
  return out
}

/** Disponibilité d'une personne sur une journée, par tranche horaire. */
export function occupationDuJour(email: string, jour: Date, evenements: EvenementAgenda[]) {
  return evenements
    .filter((e) => e.statut !== 'annule' && memeJour(e.debut, jour))
    .filter((e) => e.participants.some((p) => p.email === email && p.reponse !== 'refuse'))
    .sort((a, b) => (a.debut < b.debut ? -1 : 1))
}

/* ------------------------------------------------------------------ */
/* Données mockées                                                     */
/* ------------------------------------------------------------------ */

type Modele = {
  titre: string
  description: string
  calendrierId: string
  jour: number
  heure: number
  duree: number
  lieu: string
  salleId: string | null
  recurrence: Recurrence
  organisateur: string
  participants: { index: number; requis?: boolean; reponse?: ReponseParticipant }[]
  projetId: string | null
  action: string | null
  statut?: StatutEvenement
  journeeEntiere?: boolean
}

const modeles: Modele[] = [
  // Semaine en cours
  { titre: 'Réunion de bureau', description: 'Point mensuel : budget, festival, ateliers.', calendrierId: 'cal-asso', jour: 0, heure: 18, duree: 90, lieu: 'Maison des associations', salleId: 'sl-reunion', recurrence: 'mensuel', organisateur: 'Camille Beauchamp', participants: [{ index: 0 }, { index: 1, reponse: 'accepte' }, { index: 2, reponse: 'accepte' }, { index: 3, reponse: 'peut_etre' }], projetId: null, action: 'Réunion de bureau' },
  { titre: 'Atelier peinture — séance 1', description: 'Première séance de la saison, 12 enfants inscrits.', calendrierId: 'cal-jeunesse', jour: 1, heure: 14, duree: 120, lieu: 'Maison des associations', salleId: 'sl-atelier', recurrence: 'hebdomadaire', organisateur: 'Malik Benali', participants: [{ index: 4, reponse: 'accepte' }, { index: 5, reponse: 'accepte' }], projetId: 'pj-jeunesse', action: 'Atelier' },
  { titre: 'Répétition — Compagnie du Grand Vent', description: 'Filage du premier acte.', calendrierId: 'cal-theatre', jour: 1, heure: 19, duree: 150, lieu: 'Maison des associations', salleId: 'sl-grande', recurrence: 'hebdomadaire', organisateur: 'Awa Diallo', participants: [{ index: 2, reponse: 'accepte' }, { index: 5, reponse: 'attente' }], projetId: 'pj-festival', action: 'Répétition' },
  { titre: 'Point communication festival', description: 'Validation de l’affiche et du plan de diffusion.', calendrierId: 'cal-asso', jour: 2, heure: 10, duree: 60, lieu: 'Visioconférence', salleId: null, recurrence: 'aucune', organisateur: 'Élodie Nguyen', participants: [{ index: 3 }, { index: 0, reponse: 'accepte' }, { index: 2, reponse: 'attente' }], projetId: 'pj-festival', action: null },
  // Conflit volontaire : même salle, même créneau que la répétition du jour 2
  { titre: 'Assemblée générale extraordinaire', description: 'Modification des statuts votée en juin, à ratifier.', calendrierId: 'cal-asso', jour: 2, heure: 14, duree: 120, lieu: 'Maison des associations', salleId: 'sl-reunion', recurrence: 'aucune', organisateur: 'Camille Beauchamp', participants: [{ index: 0 }, { index: 1, reponse: 'accepte' }, { index: 3, reponse: 'attente' }], projetId: null, action: 'Assemblée générale', statut: 'provisoire' },
  { titre: 'Répétition générale', description: 'Passage complet avec technique.', calendrierId: 'cal-theatre', jour: 2, heure: 19, duree: 180, lieu: 'Maison des associations', salleId: 'sl-grande', recurrence: 'aucune', organisateur: 'Awa Diallo', participants: [{ index: 2 }, { index: 4, reponse: 'accepte' }], projetId: 'pj-festival', action: 'Répétition' },
  { titre: 'Permanence adhésions', description: 'Accueil des nouveaux adhérents.', calendrierId: 'cal-asso', jour: 3, heure: 17, duree: 120, lieu: 'Maison des associations', salleId: 'sl-bureau', recurrence: 'hebdomadaire', organisateur: 'Camille Beauchamp', participants: [{ index: 0 }, { index: 5, reponse: 'accepte' }], projetId: null, action: 'Permanence' },
  { titre: 'Rendez-vous banque', description: 'Renégociation des frais de tenue de compte.', calendrierId: 'cal-perso', jour: 3, heure: 9, duree: 60, lieu: 'Banque de l’Ouest, agence centre', salleId: null, recurrence: 'aucune', organisateur: 'Camille Beauchamp', participants: [{ index: 0 }, { index: 1, reponse: 'accepte' }], projetId: null, action: null },
  { titre: 'Reconnaissance du parcours', description: 'Vérification du balisage avant la sortie de dimanche.', calendrierId: 'cal-rando', jour: 4, heure: 9, duree: 240, lieu: 'Forêt du Gâvre', salleId: null, recurrence: 'aucune', organisateur: 'Hugo Fournier', participants: [{ index: 5 }, { index: 4, reponse: 'peut_etre' }], projetId: null, action: 'Sortie' },
  { titre: 'Déjeuner partenaires', description: 'Coopérative Grand Ouest, point sur le partenariat de saison.', calendrierId: 'cal-perso', jour: 4, heure: 12, duree: 90, lieu: 'Restaurant Le Cellier', salleId: null, recurrence: 'aucune', organisateur: 'Camille Beauchamp', participants: [{ index: 0 }], projetId: null, action: null },
  { titre: 'Sortie randonnée mensuelle', description: 'Boucle de 14 km, niveau moyen. Rendez-vous au parking.', calendrierId: 'cal-rando', jour: 6, heure: 8, duree: 420, lieu: 'Forêt du Gâvre', salleId: null, recurrence: 'mensuel', organisateur: 'Hugo Fournier', participants: [{ index: 5 }, { index: 4, reponse: 'accepte' }, { index: 2, reponse: 'attente' }], projetId: null, action: 'Sortie' },

  // Semaines suivantes
  { titre: 'Conseil d’administration', description: 'Ordre du jour : budget rectificatif du festival.', calendrierId: 'cal-asso', jour: 9, heure: 18, duree: 120, lieu: 'Maison des associations', salleId: 'sl-reunion', recurrence: 'aucune', organisateur: 'Camille Beauchamp', participants: [{ index: 0 }, { index: 1 }, { index: 2 }, { index: 3, requis: false }], projetId: null, action: 'Conseil d’administration' },
  { titre: 'Atelier peinture — séance 2', description: 'Travail sur les décors du spectacle de fin d’année.', calendrierId: 'cal-jeunesse', jour: 8, heure: 14, duree: 120, lieu: 'Maison des associations', salleId: 'sl-atelier', recurrence: 'hebdomadaire', organisateur: 'Malik Benali', participants: [{ index: 4, reponse: 'accepte' }, { index: 5, reponse: 'attente' }], projetId: 'pj-jeunesse', action: 'Atelier' },
  { titre: 'Formation logiciel comptable', description: 'Prise en main du module de comptabilité par le bureau.', calendrierId: 'cal-asso', jour: 11, heure: 14, duree: 180, lieu: 'Maison des associations', salleId: 'sl-reunion', recurrence: 'aucune', organisateur: 'Yanis Traoré', participants: [{ index: 1 }, { index: 0, reponse: 'attente' }, { index: 2, requis: false, reponse: 'peut_etre' }], projetId: null, action: 'Formation' },
  { titre: 'Montage technique du festival', description: 'Installation de la scène et des gradins.', calendrierId: 'cal-asso', jour: 17, heure: 8, duree: 600, lieu: 'Parc du Vieux Moulin', salleId: 'sl-grande', recurrence: 'aucune', organisateur: 'Malik Benali', participants: [{ index: 4 }, { index: 5, reponse: 'accepte' }, { index: 2, reponse: 'accepte' }], projetId: 'pj-festival', action: 'Événement public' },
  { titre: 'Journée portes ouvertes', description: 'Présentation des sections et inscriptions sur place.', calendrierId: 'cal-asso', jour: 20, heure: 0, duree: 1440, lieu: 'Maison des associations', salleId: 'sl-grande', recurrence: 'annuel', organisateur: 'Élodie Nguyen', participants: [{ index: 3 }, { index: 0, reponse: 'attente' }, { index: 4, reponse: 'accepte' }, { index: 5, reponse: 'attente' }], projetId: null, action: 'Événement public', journeeEntiere: true },
  { titre: 'Réunion de bureau', description: 'Point mensuel.', calendrierId: 'cal-asso', jour: 28, heure: 18, duree: 90, lieu: 'Maison des associations', salleId: 'sl-reunion', recurrence: 'mensuel', organisateur: 'Camille Beauchamp', participants: [{ index: 0 }, { index: 1 }, { index: 2 }], projetId: null, action: 'Réunion de bureau' },
  { titre: 'Dépôt du dossier de subvention', description: 'Date limite de dépôt en ligne.', calendrierId: 'cal-perso', jour: 12, heure: 0, duree: 1440, lieu: 'En ligne', salleId: null, recurrence: 'aucune', organisateur: 'Camille Beauchamp', participants: [{ index: 0 }], projetId: null, action: null, journeeEntiere: true },
  { titre: 'Répétition costumée', description: 'Essayage et raccords.', calendrierId: 'cal-theatre', jour: 16, heure: 19, duree: 150, lieu: 'Maison des associations', salleId: 'sl-grande', recurrence: 'aucune', organisateur: 'Awa Diallo', participants: [{ index: 2 }, { index: 3, requis: false, reponse: 'attente' }], projetId: 'pj-festival', action: 'Répétition' },
  { titre: 'Atelier peinture — séance 3', description: 'Finalisation des décors.', calendrierId: 'cal-jeunesse', jour: 15, heure: 14, duree: 120, lieu: 'Maison des associations', salleId: 'sl-atelier', recurrence: 'hebdomadaire', organisateur: 'Malik Benali', participants: [{ index: 4 }, { index: 5, reponse: 'accepte' }], projetId: 'pj-jeunesse', action: 'Atelier' },
  { titre: 'Comité de programmation', description: 'Arbitrage final sur les compagnies retenues.', calendrierId: 'cal-asso', jour: 5, heure: 18, duree: 120, lieu: 'Maison des associations', salleId: 'sl-reunion', recurrence: 'aucune', organisateur: 'Awa Diallo', participants: [{ index: 2 }, { index: 0, reponse: 'attente' }, { index: 3, reponse: 'accepte' }], projetId: 'pj-festival', action: null },

  // Passé
  { titre: 'Réunion de rentrée des bénévoles', description: 'Présentation de la saison et des besoins.', calendrierId: 'cal-asso', jour: -6, heure: 18, duree: 120, lieu: 'Maison des associations', salleId: 'sl-grande', recurrence: 'aucune', organisateur: 'Awa Diallo', participants: [{ index: 2 }, { index: 5, reponse: 'accepte' }, { index: 0, reponse: 'accepte' }], projetId: null, action: 'Réunion de bureau' },
  { titre: 'Répétition — filage', description: 'Deuxième acte.', calendrierId: 'cal-theatre', jour: -7, heure: 19, duree: 150, lieu: 'Maison des associations', salleId: 'sl-grande', recurrence: 'hebdomadaire', organisateur: 'Awa Diallo', participants: [{ index: 2 }], projetId: 'pj-festival', action: 'Répétition', statut: 'annule' },
  { titre: 'Rendez-vous assurance', description: 'Avenant pour la couverture du festival.', calendrierId: 'cal-perso', jour: -10, heure: 11, duree: 60, lieu: 'Mutuelle des Associations', salleId: null, recurrence: 'aucune', organisateur: 'Yanis Traoré', participants: [{ index: 1 }, { index: 0, reponse: 'accepte' }], projetId: null, action: null },
  { titre: 'Atelier découverte', description: 'Séance gratuite d’essai, 18 enfants présents.', calendrierId: 'cal-jeunesse', jour: -13, heure: 14, duree: 120, lieu: 'Maison des associations', salleId: 'sl-atelier', recurrence: 'aucune', organisateur: 'Malik Benali', participants: [{ index: 4 }, { index: 5, reponse: 'accepte' }], projetId: 'pj-jeunesse', action: 'Atelier' },
  { titre: 'Assemblée générale ordinaire', description: 'Approbation des comptes de l’exercice écoulé.', calendrierId: 'cal-asso', jour: -25, heure: 18, duree: 180, lieu: 'Maison des associations', salleId: 'sl-grande', recurrence: 'annuel', organisateur: 'Camille Beauchamp', participants: [{ index: 0 }, { index: 1, reponse: 'accepte' }, { index: 2, reponse: 'accepte' }, { index: 3, reponse: 'accepte' }, { index: 4, reponse: 'accepte' }, { index: 5, reponse: 'refuse' }], projetId: null, action: 'Assemblée générale' },
]

function creerEvenement(m: Modele, i: number): EvenementAgenda {
  const debut = jourAgenda(m.jour, m.heure)
  const fin = new Date(new Date(debut).getTime() + m.duree * 60000).toISOString()

  const participants: Participant[] = m.participants.map((p, k) => {
    const base = personnes[p.index]
    return {
      id: `pa-${i}-${k}`,
      nom: base.nom,
      email: base.email,
      reponse: p.reponse ?? (k === 0 ? 'accepte' : 'attente'),
      requis: p.requis ?? true,
      estMoi: base.email === MOI_AGENDA.email,
    }
  })

  return {
    id: `ev-${100 + i}`,
    reference: `EVT-${String(100 + i)}`,
    titre: m.titre,
    description: m.description,
    debut,
    fin,
    journeeEntiere: !!m.journeeEntiere,
    lieu: m.lieu,
    salleId: m.salleId,
    recurrence: m.recurrence,
    recurrenceFinLe: m.recurrence === 'aucune' ? null : jourAgenda(m.jour + 180, 0),
    calendrierId: m.calendrierId,
    organisateur: m.organisateur,
    participants,
    projetId: m.projetId,
    actionAssociative: m.action,
    piecesJointes:
      i % 5 === 2 ? [{ id: `pje-${i}`, nom: `Ordre du jour ${String(100 + i)}.pdf`, taille: `${90 + ((i * 31) % 320)} Ko` }] : [],
    notifications:
      m.journeeEntiere
        ? [{ id: `nt-${i}-1`, delaiMinutes: 1440, canal: 'email' }]
        : [
            { id: `nt-${i}-1`, delaiMinutes: 30, canal: 'application' },
            ...(i % 3 === 0 ? [{ id: `nt-${i}-2`, delaiMinutes: 1440, canal: 'email' as const }] : []),
          ],
    statut: m.statut ?? 'confirme',
    motifAnnulation: m.statut === 'annule' ? 'Salle indisponible, répétition reportée à la semaine suivante.' : '',
  }
}

export const evenementsInitiaux: EvenementAgenda[] = modeles
  .map((m, i) => creerEvenement(m, i))
  .sort((a, b) => (a.debut < b.debut ? -1 : 1))

/**
 * Variante volontairement en conflit, réservée au mode de démonstration.
 * Deux collisions : la grande salle réservée deux fois le même soir, et deux
 * personnes requises attendues au même moment sur deux événements.
 */
export function evenementsAvecConflits(): EvenementAgenda[] {
  const base = evenementsInitiaux.map((e) => ({ ...e }))
  const reunion = base.find((e) => e.titre === 'Assemblée générale extraordinaire')
  if (reunion) {
    reunion.debut = jourAgenda(2, 19)
    reunion.fin = jourAgenda(2, 21)
    reunion.salleId = 'sl-grande'
  }
  const montage = base.find((e) => e.titre === 'Montage technique du festival')
  if (montage) {
    montage.debut = jourAgenda(15, 8)
    montage.fin = jourAgenda(15, 18)
  }
  return base.sort((a, b) => (a.debut < b.debut ? -1 : 1))
}

export const comptesSynchroInitiaux: CompteSynchro[] = [
  {
    id: 'sy-google',
    fournisseur: 'Google Agenda',
    compte: 'camille.beauchamp@gmail.com',
    sens: 'bidirectionnel',
    etat: 'connecte',
    derniereSynchro: jourAgenda(0, 7, 42),
    message: '',
    evenementsImportes: 14,
  },
  {
    id: 'sy-outlook',
    fournisseur: 'Outlook',
    compte: 'contact@vieuxmoulin.fr',
    sens: 'import',
    etat: 'connecte',
    derniereSynchro: jourAgenda(0, 6, 55),
    message: '',
    evenementsImportes: 9,
  },
  {
    id: 'sy-ical',
    fournisseur: 'Flux iCal public',
    compte: 'agenda.vieuxmoulin.fr/public.ics',
    sens: 'export',
    etat: 'connecte',
    derniereSynchro: jourAgenda(0, 6, 0),
    message: '',
    evenementsImportes: 0,
  },
  {
    id: 'sy-apple',
    fournisseur: 'Calendrier Apple',
    compte: '—',
    sens: 'bidirectionnel',
    etat: 'inactif',
    derniereSynchro: null,
    message: 'Jamais connecté.',
    evenementsImportes: 0,
  },
]

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpisAgenda = {
  total: number
  cetteSemaine: number
  aujourdhui: number
  sansReponse: number
  conflits: number
  provisoires: number
}

export function calculerKpisAgenda(evenements: EvenementAgenda[]): KpisAgenda {
  const debut = debutSemaine(AUJOURDHUI_AGENDA).getTime()
  const fin = debut + 7 * 86400000

  const conflits = new Set<string>()
  for (const e of evenements) {
    if (e.statut === 'annule') continue
    if (detecterConflits(e, evenements).length > 0) conflits.add(e.id)
  }

  return {
    total: evenements.length,
    cetteSemaine: evenements.filter((e) => {
      const t = new Date(e.debut).getTime()
      return t >= debut && t < fin && e.statut !== 'annule'
    }).length,
    aujourdhui: evenements.filter((e) => memeJour(e.debut, AUJOURDHUI_AGENDA) && e.statut !== 'annule').length,
    sansReponse: evenements.filter(
      (e) => e.statut !== 'annule' && new Date(e.debut) >= AUJOURDHUI_AGENDA && e.participants.some((p) => p.estMoi && p.reponse === 'attente'),
    ).length,
    conflits: conflits.size,
    provisoires: evenements.filter((e) => e.statut === 'provisoire').length,
  }
}
