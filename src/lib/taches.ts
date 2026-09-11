export const AUJOURDHUI_TACHE = new Date('2026-09-03T00:00:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type StatutTache = 'a_faire' | 'en_cours' | 'en_attente' | 'a_valider' | 'termine'

export const COLONNES: { id: StatutTache; label: string; description: string }[] = [
  { id: 'a_faire', label: 'À faire', description: 'Prêtes à être prises en charge.' },
  { id: 'en_cours', label: 'En cours', description: 'Quelqu’un y travaille.' },
  { id: 'en_attente', label: 'En attente', description: 'Bloquées par un tiers ou une décision.' },
  { id: 'a_valider', label: 'À valider', description: 'Terminées, en attente d’un contrôle.' },
  { id: 'termine', label: 'Terminé', description: 'Closes et validées.' },
]

export const statutTacheLabels: Record<StatutTache, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  en_attente: 'En attente',
  a_valider: 'À valider',
  termine: 'Terminé',
}

export type Priorite = 'basse' | 'normale' | 'haute' | 'critique'

export const prioriteLabels: Record<Priorite, string> = {
  basse: 'Basse',
  normale: 'Normale',
  haute: 'Haute',
  critique: 'Critique',
}

export type ElementChecklist = { id: string; libelle: string; fait: boolean }

export type Commentaire = { id: string; auteur: string; quand: string; texte: string }

export type PieceJointe = { id: string; nom: string; taille: string; ajouteLe: string }

export type EvenementTache = {
  id: string
  quand: string
  auteur: string
  libelle: string
  detail?: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

export type Tache = {
  id: string
  reference: string
  titre: string
  description: string
  responsable: string
  participants: string[]
  dateDebut: string
  echeance: string
  priorite: Priorite
  statut: StatutTache
  projetId: string | null
  etiquettes: string[]
  checklist: ElementChecklist[]
  commentaires: Commentaire[]
  piecesJointes: PieceJointe[]
  historique: EvenementTache[]
  termineeLe: string | null
  chargeEstimee: number
}

/* ------------------------------------------------------------------ */
/* Calculs                                                             */
/* ------------------------------------------------------------------ */

export function joursRestants(t: Tache) {
  return Math.round((new Date(t.echeance).getTime() - AUJOURDHUI_TACHE.getTime()) / 86400000)
}

export function enRetard(t: Tache) {
  return t.statut !== 'termine' && joursRestants(t) < 0
}

export function avancementChecklist(t: Tache) {
  if (t.checklist.length === 0) return null
  const faits = t.checklist.filter((c) => c.fait).length
  return { faits, total: t.checklist.length, pourcentage: Math.round((faits / t.checklist.length) * 100) }
}

/* ------------------------------------------------------------------ */
/* Équipe                                                              */
/* ------------------------------------------------------------------ */

export const MOI_TACHE = 'Camille Beauchamp'

export const equipe = [
  { nom: 'Camille Beauchamp', role: 'Administratrice' },
  { nom: 'Yanis Traoré', role: 'Trésorier' },
  { nom: 'Awa Diallo', role: 'Responsable de section' },
  { nom: 'Élodie Nguyen', role: 'Chargée de communication' },
  { nom: 'Malik Benali', role: 'Animateur' },
  { nom: 'Hugo Fournier', role: 'Bénévole' },
]

export const etiquettesDisponibles = [
  'administratif', 'communication', 'logistique', 'financier', 'partenariat', 'technique', 'urgent',
]

/* ------------------------------------------------------------------ */
/* Données mockées                                                     */
/* ------------------------------------------------------------------ */

type Modele = {
  titre: string
  description: string
  responsable: string
  participants: string[]
  projetId: string | null
  priorite: Priorite
  statut: StatutTache
  jourDebut: number
  jourEcheance: number
  etiquettes: string[]
  checklist?: string[]
  charge: number
}

const modeles: Modele[] = [
  { titre: 'Boucler la programmation du festival', description: 'Arrêter la liste définitive des compagnies et confirmer les créneaux.', responsable: 'Awa Diallo', participants: ['Camille Beauchamp', 'Élodie Nguyen'], projetId: 'pj-festival', priorite: 'critique', statut: 'en_cours', jourDebut: -22, jourEcheance: 6, etiquettes: ['partenariat'], checklist: ['Relancer la Compagnie du Grand Vent', 'Valider le budget artistique', 'Caler les horaires de plateau', 'Envoyer les contrats de cession'], charge: 12 },
  { titre: 'Envoyer les contrats de cession', description: 'Préparer et transmettre les contrats aux trois compagnies retenues.', responsable: 'Camille Beauchamp', participants: ['Awa Diallo'], projetId: 'pj-festival', priorite: 'haute', statut: 'a_faire', jourDebut: -3, jourEcheance: 9, etiquettes: ['administratif'], checklist: ['Vérifier les cachets', 'Faire relire par le bureau'], charge: 4 },
  { titre: 'Réserver le matériel son et lumière', description: 'Devis comparatif auprès de deux prestataires.', responsable: 'Malik Benali', participants: [], projetId: 'pj-festival', priorite: 'haute', statut: 'en_attente', jourDebut: -10, jourEcheance: 4, etiquettes: ['technique', 'logistique'], checklist: ['Demander le devis Armor Son', 'Demander le devis Scéno Ouest'], charge: 6 },
  { titre: 'Affiche du festival — validation finale', description: 'Dernière relecture avant envoi à l’imprimeur.', responsable: 'Élodie Nguyen', participants: ['Camille Beauchamp'], projetId: 'pj-festival', priorite: 'haute', statut: 'a_valider', jourDebut: -14, jourEcheance: 2, etiquettes: ['communication'], checklist: ['Vérifier les logos partenaires', 'Corriger les mentions légales'], charge: 3 },
  { titre: 'Recruter les bénévoles du festival', description: 'Objectif : quarante bénévoles sur trois jours.', responsable: 'Awa Diallo', participants: ['Hugo Fournier'], projetId: 'pj-festival', priorite: 'normale', statut: 'en_cours', jourDebut: -30, jourEcheance: 14, etiquettes: ['logistique'], checklist: ['Publier l’appel', 'Relancer les bénévoles de 2025', 'Construire le planning'], charge: 10 },
  { titre: 'Demander l’autorisation d’occupation du domaine public', description: 'Dossier à déposer en mairie deux mois avant.', responsable: 'Camille Beauchamp', participants: [], projetId: 'pj-festival', priorite: 'critique', statut: 'termine', jourDebut: -60, jourEcheance: -30, etiquettes: ['administratif'], charge: 5 },
  { titre: 'Souscrire l’assurance événementielle', description: 'Extension de la multirisque pour les trois jours.', responsable: 'Yanis Traoré', participants: [], projetId: 'pj-festival', priorite: 'haute', statut: 'termine', jourDebut: -45, jourEcheance: -18, etiquettes: ['financier', 'administratif'], charge: 2 },

  { titre: 'Préparer le budget prévisionnel 2026-2027', description: 'Consolidation des postes et arbitrages du bureau.', responsable: 'Yanis Traoré', participants: ['Camille Beauchamp'], projetId: 'pj-siege', priorite: 'critique', statut: 'en_cours', jourDebut: -12, jourEcheance: 8, etiquettes: ['financier'], checklist: ['Recenser les charges fixes', 'Estimer les recettes de cotisation', 'Chiffrer les projets', 'Présenter au bureau'], charge: 15 },
  { titre: 'Clôturer l’exercice 2025-2026', description: 'Valider les derniers brouillons puis lancer la clôture.', responsable: 'Yanis Traoré', participants: [], projetId: 'pj-siege', priorite: 'haute', statut: 'a_faire', jourDebut: 0, jourEcheance: 25, etiquettes: ['financier'], checklist: ['Valider les cinq brouillons', 'Vérifier le rapprochement bancaire', 'Éditer la balance'], charge: 8 },
  { titre: 'Relancer les cotisations impayées', description: 'Sept adhérents en retard sur la saison écoulée.', responsable: 'Camille Beauchamp', participants: ['Élodie Nguyen'], projetId: 'pj-siege', priorite: 'normale', statut: 'a_faire', jourDebut: -5, jourEcheance: 7, etiquettes: ['administratif'], charge: 3 },
  { titre: 'Mettre à jour les statuts', description: 'Intégrer les modifications votées en assemblée générale.', responsable: 'Camille Beauchamp', participants: ['Yanis Traoré'], projetId: 'pj-siege', priorite: 'normale', statut: 'en_attente', jourDebut: -40, jourEcheance: 22, etiquettes: ['administratif'], checklist: ['Rédiger la version modifiée', 'Faire relire par le bureau', 'Déposer en préfecture'], charge: 6 },
  { titre: 'Déclarer le changement de bureau en préfecture', description: 'Suite au renouvellement de juin.', responsable: 'Camille Beauchamp', participants: [], projetId: 'pj-siege', priorite: 'haute', statut: 'termine', jourDebut: -70, jourEcheance: -50, etiquettes: ['administratif'], charge: 2 },
  { titre: 'Archiver les pièces comptables 2024-2025', description: 'Numérisation et classement dans l’espace documentaire.', responsable: 'Hugo Fournier', participants: [], projetId: 'pj-siege', priorite: 'basse', statut: 'a_faire', jourDebut: -20, jourEcheance: 40, etiquettes: ['administratif'], charge: 7 },

  { titre: 'Programmer les ateliers du premier trimestre', description: 'Six séances, deux encadrants par séance.', responsable: 'Malik Benali', participants: ['Awa Diallo'], projetId: 'pj-jeunesse', priorite: 'haute', statut: 'en_cours', jourDebut: -16, jourEcheance: 5, etiquettes: ['logistique'], checklist: ['Réserver la salle', 'Confirmer les encadrants', 'Commander le matériel'], charge: 9 },
  { titre: 'Collecter les autorisations parentales', description: 'Vingt-deux inscrits, dix-huit autorisations reçues.', responsable: 'Malik Benali', participants: [], projetId: 'pj-jeunesse', priorite: 'critique', statut: 'en_attente', jourDebut: -12, jourEcheance: 9, etiquettes: ['administratif', 'urgent'], checklist: ['Relancer les quatre familles manquantes'], charge: 4 },
  { titre: 'Commander le matériel de peinture', description: 'Devis validé, commande à passer.', responsable: 'Hugo Fournier', participants: [], projetId: 'pj-jeunesse', priorite: 'normale', statut: 'a_faire', jourDebut: 1, jourEcheance: 11, etiquettes: ['logistique'], charge: 2 },
  { titre: 'Bilan des ateliers de l’an dernier', description: 'Synthèse à présenter au conseil d’administration.', responsable: 'Awa Diallo', participants: ['Malik Benali'], projetId: 'pj-jeunesse', priorite: 'basse', statut: 'a_valider', jourDebut: -25, jourEcheance: 3, etiquettes: ['administratif'], charge: 5 },

  { titre: 'Refondre la lettre d’information', description: 'Nouveau gabarit et rythme mensuel.', responsable: 'Élodie Nguyen', participants: ['Camille Beauchamp'], projetId: 'pj-com', priorite: 'normale', statut: 'en_cours', jourDebut: -18, jourEcheance: 12, etiquettes: ['communication'], checklist: ['Choisir le gabarit', 'Rédiger le premier numéro', 'Nettoyer la liste de diffusion'], charge: 8 },
  { titre: 'Mettre à jour le site internet', description: 'Programme de saison et nouvelles photos.', responsable: 'Élodie Nguyen', participants: [], projetId: 'pj-com', priorite: 'normale', statut: 'a_faire', jourDebut: -2, jourEcheance: 18, etiquettes: ['communication', 'technique'], charge: 6 },
  { titre: 'Photographier les ateliers pour la photothèque', description: 'Vérifier les droits à l’image avant publication.', responsable: 'Hugo Fournier', participants: ['Élodie Nguyen'], projetId: 'pj-com', priorite: 'basse', statut: 'a_faire', jourDebut: 4, jourEcheance: 30, etiquettes: ['communication'], charge: 4 },
  { titre: 'Rédiger le communiqué de presse du festival', description: 'Diffusion auprès de la presse locale.', responsable: 'Élodie Nguyen', participants: ['Awa Diallo'], projetId: 'pj-festival', priorite: 'haute', statut: 'a_faire', jourDebut: 2, jourEcheance: 10, etiquettes: ['communication'], charge: 3 },
  { titre: 'Organiser la réunion de rentrée des bénévoles', description: 'Convocation, ordre du jour, collation.', responsable: 'Awa Diallo', participants: ['Hugo Fournier'], projetId: 'pj-siege', priorite: 'normale', statut: 'a_valider', jourDebut: -8, jourEcheance: 1, etiquettes: ['logistique'], checklist: ['Envoyer les convocations', 'Réserver la salle', 'Prévoir la collation'], charge: 4 },
  { titre: 'Répondre à l’appel à projets départemental', description: 'Dossier culture et jeunesse, dépôt en ligne.', responsable: 'Camille Beauchamp', participants: ['Yanis Traoré', 'Awa Diallo'], projetId: 'pj-siege', priorite: 'critique', statut: 'en_cours', jourDebut: -9, jourEcheance: 3, etiquettes: ['financier', 'partenariat'], checklist: ['Rédiger la note d’intention', 'Joindre le budget', 'Faire signer le président'], charge: 11 },
  { titre: 'Nettoyer la base de contacts', description: 'Doublons et adresses invalides.', responsable: 'Hugo Fournier', participants: [], projetId: null, priorite: 'basse', statut: 'a_faire', jourDebut: -6, jourEcheance: 45, etiquettes: ['administratif'], charge: 5 },
  { titre: 'Former le bureau à AssoConnex', description: 'Deux séances de prise en main.', responsable: 'Camille Beauchamp', participants: ['Yanis Traoré', 'Awa Diallo', 'Élodie Nguyen'], projetId: null, priorite: 'normale', statut: 'termine', jourDebut: -35, jourEcheance: -14, etiquettes: ['technique'], charge: 6 },
  { titre: 'Remplacer l’ordinateur du secrétariat', description: 'Devis validé par le bureau.', responsable: 'Yanis Traoré', participants: [], projetId: null, priorite: 'basse', statut: 'en_attente', jourDebut: -28, jourEcheance: 20, etiquettes: ['technique'], charge: 2 },
  { titre: 'Vérifier les extincteurs de la salle', description: 'Contrôle annuel obligatoire.', responsable: 'Malik Benali', participants: [], projetId: null, priorite: 'haute', statut: 'a_faire', jourDebut: -1, jourEcheance: 5, etiquettes: ['logistique', 'urgent'], charge: 1 },
  { titre: 'Établir les reçus fiscaux des donateurs', description: 'Trente-quatre reçus à générer et envoyer.', responsable: 'Yanis Traoré', participants: [], projetId: 'pj-siege', priorite: 'haute', statut: 'a_faire', jourDebut: 3, jourEcheance: 28, etiquettes: ['financier', 'administratif'], charge: 6 },
]

const commentairesTypes = [
  'J’ai relancé par téléphone ce matin, réponse attendue en fin de semaine.',
  'Le devis est arrivé, il dépasse l’enveloppe de 200 €. À arbitrer en bureau.',
  'Bien noté, je m’en occupe dès lundi.',
  'Attention, cette tâche dépend de la validation du budget.',
  'C’est fait de mon côté, je passe la main pour la relecture.',
]

function jour(d: number) {
  return new Date(AUJOURDHUI_TACHE.getTime() + d * 86400000).toISOString()
}

function pick<T>(a: T[], i: number): T {
  return a[((i % a.length) + a.length) % a.length]
}

function creerTache(m: Modele, i: number): Tache {
  const dateDebut = jour(m.jourDebut)
  const echeance = jour(m.jourEcheance)

  const checklist: ElementChecklist[] = (m.checklist ?? []).map((libelle, k) => ({
    id: `cl-${i}-${k}`,
    libelle,
    fait: m.statut === 'termine' ? true : m.statut === 'a_valider' ? k < (m.checklist?.length ?? 0) - 1 : m.statut === 'en_cours' ? k === 0 : false,
  }))

  const commentaires: Commentaire[] = Array.from({ length: i % 3 }, (_, k) => ({
    id: `cm-${i}-${k}`,
    auteur: pick([m.responsable, ...m.participants, 'Camille Beauchamp'], i + k),
    quand: jour(m.jourDebut + 2 + k * 3),
    texte: pick(commentairesTypes, i + k),
  }))

  const piecesJointes: PieceJointe[] = i % 4 === 1
    ? [{ id: `pj-${i}`, nom: `Devis-${100 + i}.pdf`, taille: `${180 + ((i * 47) % 700)} Ko`, ajouteLe: jour(m.jourDebut + 1) }]
    : []

  const historique: EvenementTache[] = [
    { id: `et-${i}-1`, quand: dateDebut, auteur: 'Camille Beauchamp', libelle: 'Tâche créée', detail: `Assignée à ${m.responsable}.`, tone: 'neutral' },
  ]
  if (m.statut !== 'a_faire') {
    historique.push({ id: `et-${i}-2`, quand: jour(m.jourDebut + 2), auteur: m.responsable, libelle: 'Passée en cours', detail: 'Prise en charge par le responsable.', tone: 'neutral' })
  }
  if (m.statut === 'en_attente') {
    historique.push({ id: `et-${i}-3`, quand: jour(m.jourDebut + 5), auteur: m.responsable, libelle: 'Mise en attente', detail: 'Bloquée par une réponse extérieure.', tone: 'warning' })
  }
  if (m.statut === 'a_valider' || m.statut === 'termine') {
    historique.push({ id: `et-${i}-4`, quand: jour(m.jourEcheance - 2), auteur: m.responsable, libelle: 'Passée à valider', detail: 'Travail achevé, en attente de contrôle.', tone: 'success' })
  }
  if (m.statut === 'termine') {
    historique.push({ id: `et-${i}-5`, quand: jour(m.jourEcheance), auteur: 'Camille Beauchamp', libelle: 'Tâche terminée', detail: 'Validée et close.', tone: 'success' })
  }

  return {
    id: `tk-${100 + i}`,
    reference: `T-${String(100 + i)}`,
    titre: m.titre,
    description: m.description,
    responsable: m.responsable,
    participants: m.participants,
    dateDebut,
    echeance,
    priorite: m.priorite,
    statut: m.statut,
    projetId: m.projetId,
    etiquettes: m.etiquettes,
    checklist,
    commentaires,
    piecesJointes,
    historique: historique.sort((a, b) => (a.quand < b.quand ? 1 : -1)),
    termineeLe: m.statut === 'termine' ? jour(m.jourEcheance) : null,
    chargeEstimee: m.charge,
  }
}

export const tachesInitiales: Tache[] = modeles.map((m, i) => creerTache(m, i))

/**
 * Variante de démonstration : quelques échéances repassent derrière nous,
 * ce qui alimente l'écran « Tâches en retard ».
 */
export function tachesEnRetard(): Tache[] {
  const cibles = ['Relancer les cotisations impayées', 'Mettre à jour les statuts', 'Collecter les autorisations parentales', 'Vérifier les extincteurs de la salle']
  return tachesInitiales.map((t, i) =>
    cibles.includes(t.titre) ? { ...t, echeance: jour(-(2 + i % 6)) } : t,
  )
}

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpisTaches = {
  total: number
  mesTaches: number
  enCours: number
  enRetard: number
  aValider: number
  terminees: number
  echeanceProche: number
  charge: number
}

export function calculerKpisTaches(taches: Tache[]): KpisTaches {
  return {
    total: taches.length,
    mesTaches: taches.filter((t) => t.responsable === MOI_TACHE && t.statut !== 'termine').length,
    enCours: taches.filter((t) => t.statut === 'en_cours').length,
    enRetard: taches.filter((t) => enRetard(t)).length,
    aValider: taches.filter((t) => t.statut === 'a_valider').length,
    terminees: taches.filter((t) => t.statut === 'termine').length,
    echeanceProche: taches.filter((t) => t.statut !== 'termine' && joursRestants(t) >= 0 && joursRestants(t) <= 7).length,
    charge: taches.filter((t) => t.statut !== 'termine').reduce((s, t) => s + t.chargeEstimee, 0),
  }
}

export function repartitionParResponsable(taches: Tache[]) {
  const m = new Map<string, number>()
  for (const t of taches) {
    if (t.statut === 'termine') continue
    m.set(t.responsable, (m.get(t.responsable) ?? 0) + 1)
  }
  return Array.from(m.entries())
    .map(([label, valeur]) => ({ label, valeur }))
    .sort((a, b) => b.valeur - a.valeur)
}
