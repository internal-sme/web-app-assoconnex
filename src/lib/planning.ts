export const AUJOURDHUI_PLANNING = new Date('2026-09-07T00:00:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type Creneau = {
  id: string
  nom: string
  heureDebut: number
  heureFin: number
}

/** Les lignes de la grille : des tranches horaires, pas des heures pleines. */
export const creneaux: Creneau[] = [
  { id: 'cr-matin', nom: 'Matin', heureDebut: 8, heureFin: 12 },
  { id: 'cr-midi', nom: 'Midi', heureDebut: 12, heureFin: 14 },
  { id: 'cr-aprem', nom: 'Après-midi', heureDebut: 14, heureFin: 18 },
  { id: 'cr-soir', nom: 'Soirée', heureDebut: 18, heureFin: 22 },
]

export type Poste = {
  id: string
  nom: string
  description: string
  couleur: string
  competence: string
  /** Nombre de personnes attendues sur le poste, par créneau ouvert. */
  effectifCible: number
}

export const postes: Poste[] = [
  { id: 'po-accueil', nom: 'Accueil et permanence', description: 'Tenue du bureau, accueil du public, inscriptions.', couleur: '#2364AA', competence: 'Accueil', effectifCible: 1 },
  { id: 'po-atelier', nom: 'Encadrement atelier', description: 'Animation des séances jeunesse.', couleur: '#B42318', competence: 'Animation', effectifCible: 1 },
  { id: 'po-regie', nom: 'Régie technique', description: 'Son, lumière, montage et démontage.', couleur: '#9A5B00', competence: 'Technique', effectifCible: 1 },
  { id: 'po-buvette', nom: 'Buvette', description: 'Tenue de la buvette lors des événements.', couleur: '#127A4C', competence: 'Buvette', effectifCible: 2 },
  { id: 'po-entretien', nom: 'Entretien des locaux', description: 'Remise en état des salles après usage.', couleur: '#525A66', competence: 'Entretien', effectifCible: 1 },
]

export type TypeRessource = 'salle' | 'vehicule' | 'materiel'

export const typeRessourceLabels: Record<TypeRessource, string> = {
  salle: 'Salle',
  vehicule: 'Véhicule',
  materiel: 'Matériel',
}

export type Ressource = {
  id: string
  nom: string
  type: TypeRessource
  capacite: number
  detail: string
}

export const ressources: Ressource[] = [
  { id: 'rs-grande', nom: 'Grande salle', type: 'salle', capacite: 180, detail: 'Scène, gradins, sonorisation' },
  { id: 'rs-atelier', nom: 'Salle d’atelier', type: 'salle', capacite: 24, detail: 'Tables, point d’eau' },
  { id: 'rs-reunion', nom: 'Salle de réunion', type: 'salle', capacite: 12, detail: 'Écran, visioconférence' },
  { id: 'rs-minibus', nom: 'Minibus', type: 'vehicule', capacite: 9, detail: 'Permis B, neuf places' },
  { id: 'rs-sono', nom: 'Pack sonorisation', type: 'materiel', capacite: 1, detail: 'Console, enceintes, micros' },
]

export type Personne = {
  id: string
  nom: string
  role: string
  competences: string[]
  /** Volume horaire hebdomadaire visé. */
  quotaHebdo: number
  couleur: string
}

export const personnesPlanning: Personne[] = [
  { id: 'pe-camille', nom: 'Camille Beauchamp', role: 'Administratrice', competences: ['Accueil', 'Animation'], quotaHebdo: 20, couleur: '#2364AA' },
  { id: 'pe-yanis', nom: 'Yanis Traoré', role: 'Trésorier', competences: ['Accueil'], quotaHebdo: 8, couleur: '#1D5391' },
  { id: 'pe-awa', nom: 'Awa Diallo', role: 'Responsable de section', competences: ['Animation', 'Accueil'], quotaHebdo: 16, couleur: '#9A5B00' },
  { id: 'pe-elodie', nom: 'Élodie Nguyen', role: 'Chargée de communication', competences: ['Accueil', 'Buvette'], quotaHebdo: 12, couleur: '#127A4C' },
  { id: 'pe-malik', nom: 'Malik Benali', role: 'Animateur', competences: ['Animation', 'Technique'], quotaHebdo: 24, couleur: '#B42318' },
  { id: 'pe-hugo', nom: 'Hugo Fournier', role: 'Bénévole', competences: ['Technique', 'Buvette', 'Entretien'], quotaHebdo: 10, couleur: '#525A66' },
  { id: 'pe-sofia', nom: 'Sofia Marchetti', role: 'Bénévole', competences: ['Buvette', 'Entretien', 'Accueil'], quotaHebdo: 8, couleur: '#653B00' },
]

export type StatutAffectation = 'planifiee' | 'confirmee' | 'remplacement' | 'annulee'

export const statutAffectationLabels: Record<StatutAffectation, string> = {
  planifiee: 'Planifiée',
  confirmee: 'Confirmée',
  remplacement: 'Remplacement demandé',
  annulee: 'Annulée',
}

export type Affectation = {
  id: string
  /** Date au format AAAA-MM-JJ, en UTC. */
  jour: string
  creneauId: string
  posteId: string
  personneId: string
  ressourceId: string | null
  statut: StatutAffectation
  note: string
}

export type MotifAbsence = 'conges' | 'maladie' | 'formation' | 'indisponible'

export const motifAbsenceLabels: Record<MotifAbsence, string> = {
  conges: 'Congés',
  maladie: 'Arrêt maladie',
  formation: 'Formation',
  indisponible: 'Indisponibilité déclarée',
}

export type Absence = {
  id: string
  personneId: string
  debut: string
  fin: string
  motif: MotifAbsence
  commentaire: string
  statut: 'demandee' | 'validee'
}

/**
 * Disponibilité récurrente : pour chaque personne, les créneaux ouverts
 * par jour de la semaine (0 = lundi).
 */
export type Disponibilite = {
  personneId: string
  /** Clé « jourSemaine:creneauId ». */
  ouverts: string[]
}

export type StatutRemplacement = 'ouverte' | 'pourvue' | 'refusee'

export type Remplacement = {
  id: string
  affectationId: string
  demandeurId: string
  motif: string
  demandeeLe: string
  statut: StatutRemplacement
  remplacantId: string | null
  reponduLe: string | null
}

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

export function cleJour(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export function jourPlanning(decalage: number) {
  return cleJour(new Date(AUJOURDHUI_PLANNING.getTime() + decalage * 86400000))
}

export function dateDe(cle: string) {
  const [a, m, j] = cle.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, j))
}

export function debutSemainePlanning(d: Date) {
  const jour = (d.getUTCDay() + 6) % 7
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - jour))
}

export function joursDeLaSemaine(reference: Date) {
  const debut = debutSemainePlanning(reference)
  return Array.from({ length: 7 }, (_, i) => new Date(debut.getTime() + i * 86400000))
}

export const NOMS_JOURS_PLANNING = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']
export const NOMS_MOIS_PLANNING = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

export function dureeCreneau(creneauId: string) {
  const c = creneaux.find((x) => x.id === creneauId)
  return c ? c.heureFin - c.heureDebut : 0
}

export function libelleCreneau(creneauId: string) {
  const c = creneaux.find((x) => x.id === creneauId)
  return c ? `${c.nom} · ${String(c.heureDebut).padStart(2, '0')}h–${String(c.heureFin).padStart(2, '0')}h` : ''
}

/* ------------------------------------------------------------------ */
/* Disponibilités et absences                                          */
/* ------------------------------------------------------------------ */

export function estAbsent(personneId: string, jour: string, absences: Absence[]) {
  return absences.find(
    (a) => a.personneId === personneId && a.statut === 'validee' && jour >= a.debut && jour <= a.fin,
  )
}

export function estDisponible(personneId: string, jour: string, creneauId: string, disponibilites: Disponibilite[]) {
  const d = disponibilites.find((x) => x.personneId === personneId)
  if (!d) return true
  const jourSemaine = (dateDe(jour).getUTCDay() + 6) % 7
  return d.ouverts.includes(`${jourSemaine}:${creneauId}`)
}

/* ------------------------------------------------------------------ */
/* Conflits                                                            */
/* ------------------------------------------------------------------ */

export type TypeConflit = 'double_affectation' | 'absence' | 'indisponible' | 'competence' | 'ressource'

export const conflitLabels: Record<TypeConflit, string> = {
  double_affectation: 'Double affectation',
  absence: 'Personne absente',
  indisponible: 'Hors disponibilités',
  competence: 'Compétence manquante',
  ressource: 'Ressource déjà prise',
}

export type ConflitAffectation = {
  affectation: Affectation
  type: TypeConflit
  detail: string
}

/** Contrôle une affectation contre les autres, les absences et les disponibilités. */
export function conflitsDe(
  a: Affectation,
  toutes: Affectation[],
  absences: Absence[],
  disponibilites: Disponibilite[],
): ConflitAffectation[] {
  if (a.statut === 'annulee') return []
  const out: ConflitAffectation[] = []
  const personne = personnesPlanning.find((p) => p.id === a.personneId)
  const poste = postes.find((p) => p.id === a.posteId)

  const doublon = toutes.find(
    (x) => x.id !== a.id && x.statut !== 'annulee' && x.jour === a.jour && x.creneauId === a.creneauId && x.personneId === a.personneId,
  )
  if (doublon) {
    out.push({
      affectation: a,
      type: 'double_affectation',
      detail: `${personne?.nom} est déjà affecté au poste « ${postes.find((p) => p.id === doublon.posteId)?.nom} » sur ce créneau.`,
    })
  }

  const absence = estAbsent(a.personneId, a.jour, absences)
  if (absence) {
    out.push({
      affectation: a,
      type: 'absence',
      detail: `${personne?.nom} est absent pour ${motifAbsenceLabels[absence.motif].toLowerCase()} du ${absence.debut} au ${absence.fin}.`,
    })
  } else if (!estDisponible(a.personneId, a.jour, a.creneauId, disponibilites)) {
    out.push({
      affectation: a,
      type: 'indisponible',
      detail: `${personne?.nom} n’a pas déclaré ce créneau comme disponible.`,
    })
  }

  if (poste && personne && !personne.competences.includes(poste.competence)) {
    out.push({
      affectation: a,
      type: 'competence',
      detail: `${personne.nom} n’a pas la compétence « ${poste.competence} » attendue sur ce poste.`,
    })
  }

  if (a.ressourceId) {
    const prise = toutes.find(
      (x) => x.id !== a.id && x.statut !== 'annulee' && x.jour === a.jour && x.creneauId === a.creneauId && x.ressourceId === a.ressourceId,
    )
    if (prise) {
      out.push({
        affectation: a,
        type: 'ressource',
        detail: `${ressources.find((r) => r.id === a.ressourceId)?.nom} est déjà réservé sur ce créneau.`,
      })
    }
  }

  return out
}

export function tousLesConflits(affectations: Affectation[], absences: Absence[], disponibilites: Disponibilite[]) {
  return affectations.flatMap((a) => conflitsDe(a, affectations, absences, disponibilites))
}

/* ------------------------------------------------------------------ */
/* Charge                                                              */
/* ------------------------------------------------------------------ */

export function heuresSemaine(personneId: string, reference: Date, affectations: Affectation[]) {
  const jours = joursDeLaSemaine(reference).map(cleJour)
  return affectations
    .filter((a) => a.personneId === personneId && a.statut !== 'annulee' && jours.includes(a.jour))
    .reduce((s, a) => s + dureeCreneau(a.creneauId), 0)
}

/* ------------------------------------------------------------------ */
/* Données mockées                                                     */
/* ------------------------------------------------------------------ */

const TOUS_CRENEAUX = creneaux.map((c) => c.id)

/** Disponibilités déclarées : chacun ouvre les créneaux qui lui conviennent. */
export const disponibilitesInitiales: Disponibilite[] = [
  { personneId: 'pe-camille', ouverts: [0, 1, 2, 3, 4].flatMap((j) => ['cr-matin', 'cr-aprem'].map((c) => `${j}:${c}`)).concat(['3:cr-soir', '5:cr-matin']) },
  { personneId: 'pe-yanis', ouverts: ['0:cr-soir', '2:cr-aprem', '2:cr-soir', '3:cr-aprem', '3:cr-soir', '5:cr-matin'] },
  { personneId: 'pe-awa', ouverts: [0, 1, 2, 3, 4].flatMap((j) => ['cr-aprem', 'cr-soir'].map((c) => `${j}:${c}`)).concat(['5:cr-matin', '5:cr-aprem']) },
  { personneId: 'pe-elodie', ouverts: ['0:cr-matin', '1:cr-matin', '2:cr-matin', '3:cr-matin', '4:cr-matin', '4:cr-aprem', '5:cr-aprem', '5:cr-soir'] },
  { personneId: 'pe-malik', ouverts: [0, 1, 2, 3, 4, 5].flatMap((j) => TOUS_CRENEAUX.map((c) => `${j}:${c}`)) },
  { personneId: 'pe-hugo', ouverts: ['1:cr-soir', '2:cr-soir', '4:cr-aprem', '4:cr-soir', '5:cr-matin', '5:cr-aprem', '5:cr-soir', '6:cr-matin'] },
  { personneId: 'pe-sofia', ouverts: ['0:cr-aprem', '2:cr-aprem', '3:cr-aprem', '4:cr-soir', '5:cr-aprem', '5:cr-soir', '6:cr-matin', '6:cr-aprem'] },
]

export const absencesInitiales: Absence[] = [
  { id: 'ab-1', personneId: 'pe-yanis', debut: jourPlanning(21), fin: jourPlanning(28), motif: 'conges', commentaire: 'Congés annuels, posés en juin.', statut: 'validee' },
  { id: 'ab-2', personneId: 'pe-elodie', debut: jourPlanning(10), fin: jourPlanning(11), motif: 'formation', commentaire: 'Formation communication numérique à Rennes.', statut: 'validee' },
  { id: 'ab-3', personneId: 'pe-sofia', debut: jourPlanning(35), fin: jourPlanning(42), motif: 'conges', commentaire: 'Vacances de la Toussaint.', statut: 'demandee' },
  { id: 'ab-4', personneId: 'pe-hugo', debut: jourPlanning(-12), fin: jourPlanning(-9), motif: 'maladie', commentaire: 'Arrêt de quatre jours.', statut: 'validee' },
]

type ModeleAffectation = { jour: number; creneauId: string; posteId: string; personneId: string; ressourceId?: string | null; statut?: StatutAffectation; note?: string }

const modelesAffectations: ModeleAffectation[] = [
  // Semaine en cours
  { jour: 0, creneauId: 'cr-matin', posteId: 'po-accueil', personneId: 'pe-camille', ressourceId: 'rs-reunion', statut: 'confirmee' },
  { jour: 0, creneauId: 'cr-aprem', posteId: 'po-accueil', personneId: 'pe-sofia', statut: 'confirmee' },
  { jour: 0, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-awa', ressourceId: 'rs-atelier', statut: 'confirmee' },
  { jour: 0, creneauId: 'cr-soir', posteId: 'po-accueil', personneId: 'pe-yanis', ressourceId: 'rs-reunion', statut: 'confirmee', note: 'Réunion de bureau' },

  { jour: 1, creneauId: 'cr-matin', posteId: 'po-accueil', personneId: 'pe-elodie', statut: 'confirmee' },
  { jour: 1, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-malik', ressourceId: 'rs-atelier', statut: 'confirmee', note: 'Atelier peinture, douze enfants' },
  { jour: 1, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-awa', statut: 'confirmee' },
  { jour: 1, creneauId: 'cr-soir', posteId: 'po-regie', personneId: 'pe-hugo', ressourceId: 'rs-sono', statut: 'confirmee', note: 'Répétition théâtre' },

  { jour: 2, creneauId: 'cr-matin', posteId: 'po-accueil', personneId: 'pe-camille', statut: 'confirmee' },
  { jour: 2, creneauId: 'cr-aprem', posteId: 'po-accueil', personneId: 'pe-sofia', statut: 'planifiee' },
  { jour: 2, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-malik', ressourceId: 'rs-atelier', statut: 'confirmee' },
  { jour: 2, creneauId: 'cr-soir', posteId: 'po-regie', personneId: 'pe-hugo', ressourceId: 'rs-grande', statut: 'confirmee' },

  { jour: 3, creneauId: 'cr-matin', posteId: 'po-accueil', personneId: 'pe-elodie', statut: 'confirmee' },
  { jour: 3, creneauId: 'cr-aprem', posteId: 'po-accueil', personneId: 'pe-yanis', statut: 'planifiee' },
  { jour: 3, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-awa', ressourceId: 'rs-atelier', statut: 'confirmee' },
  { jour: 3, creneauId: 'cr-soir', posteId: 'po-accueil', personneId: 'pe-camille', ressourceId: 'rs-bureau', statut: 'confirmee', note: 'Permanence adhésions' },

  { jour: 4, creneauId: 'cr-matin', posteId: 'po-accueil', personneId: 'pe-elodie', statut: 'confirmee' },
  { jour: 4, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-malik', ressourceId: 'rs-atelier', statut: 'confirmee' },
  { jour: 4, creneauId: 'cr-soir', posteId: 'po-buvette', personneId: 'pe-sofia', statut: 'planifiee', note: 'Soirée de section' },
  { jour: 4, creneauId: 'cr-soir', posteId: 'po-buvette', personneId: 'pe-hugo', statut: 'planifiee' },

  { jour: 5, creneauId: 'cr-matin', posteId: 'po-accueil', personneId: 'pe-camille', statut: 'confirmee' },
  { jour: 5, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-awa', ressourceId: 'rs-atelier', statut: 'confirmee' },
  { jour: 5, creneauId: 'cr-aprem', posteId: 'po-buvette', personneId: 'pe-sofia', statut: 'remplacement', note: 'Empêchement familial' },
  { jour: 5, creneauId: 'cr-aprem', posteId: 'po-buvette', personneId: 'pe-hugo', statut: 'confirmee' },
  { jour: 5, creneauId: 'cr-soir', posteId: 'po-regie', personneId: 'pe-malik', ressourceId: 'rs-grande', statut: 'confirmee' },
  { jour: 5, creneauId: 'cr-soir', posteId: 'po-buvette', personneId: 'pe-hugo', statut: 'confirmee' },
  { jour: 5, creneauId: 'cr-soir', posteId: 'po-buvette', personneId: 'pe-sofia', statut: 'confirmee' },

  { jour: 6, creneauId: 'cr-matin', posteId: 'po-entretien', personneId: 'pe-hugo', statut: 'planifiee', note: 'Remise en état après la soirée' },
  { jour: 6, creneauId: 'cr-aprem', posteId: 'po-entretien', personneId: 'pe-sofia', statut: 'planifiee' },

  // Semaine suivante
  { jour: 7, creneauId: 'cr-matin', posteId: 'po-accueil', personneId: 'pe-camille', statut: 'planifiee' },
  { jour: 7, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-awa', ressourceId: 'rs-atelier', statut: 'planifiee' },
  { jour: 8, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-malik', ressourceId: 'rs-atelier', statut: 'planifiee' },
  { jour: 8, creneauId: 'cr-soir', posteId: 'po-regie', personneId: 'pe-hugo', ressourceId: 'rs-sono', statut: 'planifiee' },
  { jour: 9, creneauId: 'cr-matin', posteId: 'po-accueil', personneId: 'pe-camille', statut: 'planifiee' },
  { jour: 9, creneauId: 'cr-soir', posteId: 'po-accueil', personneId: 'pe-yanis', ressourceId: 'rs-reunion', statut: 'planifiee', note: 'Conseil d’administration' },
  { jour: 11, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-malik', ressourceId: 'rs-atelier', statut: 'planifiee' },
  { jour: 12, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-awa', ressourceId: 'rs-atelier', statut: 'planifiee' },
  { jour: 12, creneauId: 'cr-soir', posteId: 'po-regie', personneId: 'pe-malik', ressourceId: 'rs-grande', statut: 'planifiee' },
  { jour: 13, creneauId: 'cr-matin', posteId: 'po-entretien', personneId: 'pe-hugo', statut: 'planifiee' },

  // Semaine passée
  { jour: -7, creneauId: 'cr-matin', posteId: 'po-accueil', personneId: 'pe-camille', statut: 'confirmee' },
  { jour: -6, creneauId: 'cr-aprem', posteId: 'po-atelier', personneId: 'pe-malik', ressourceId: 'rs-atelier', statut: 'confirmee' },
  { jour: -5, creneauId: 'cr-soir', posteId: 'po-regie', personneId: 'pe-malik', ressourceId: 'rs-grande', statut: 'confirmee' },
  { jour: -4, creneauId: 'cr-aprem', posteId: 'po-accueil', personneId: 'pe-sofia', statut: 'confirmee' },
  { jour: -2, creneauId: 'cr-soir', posteId: 'po-buvette', personneId: 'pe-sofia', statut: 'confirmee' },
]

export const affectationsInitiales: Affectation[] = modelesAffectations.map((m, i) => ({
  id: `af-${100 + i}`,
  jour: jourPlanning(m.jour),
  creneauId: m.creneauId,
  posteId: m.posteId,
  personneId: m.personneId,
  ressourceId: m.ressourceId ?? null,
  statut: m.statut ?? 'planifiee',
  note: m.note ?? '',
}))

export const remplacementsInitiaux: Remplacement[] = [
  {
    id: 'rp-1',
    affectationId: affectationsInitiales.find((a) => a.statut === 'remplacement')?.id ?? 'af-122',
    demandeurId: 'pe-sofia',
    motif: 'Empêchement familial, je ne peux pas tenir la buvette samedi après-midi.',
    demandeeLe: jourPlanning(-1),
    statut: 'ouverte',
    remplacantId: null,
    reponduLe: null,
  },
  {
    id: 'rp-2',
    affectationId: 'af-113',
    demandeurId: 'pe-yanis',
    motif: 'Rendez-vous professionnel déplacé sur le créneau.',
    demandeeLe: jourPlanning(-9),
    statut: 'pourvue',
    remplacantId: 'pe-camille',
    reponduLe: jourPlanning(-8),
  },
]

/* ------------------------------------------------------------------ */
/* Variantes de démonstration                                          */
/* ------------------------------------------------------------------ */

/** Ajoute une double affectation et une réservation de ressource en doublon. */
export function affectationsEnConflit(): Affectation[] {
  return [
    ...affectationsInitiales,
    {
      id: 'af-conflit-1',
      jour: jourPlanning(1),
      creneauId: 'cr-aprem',
      posteId: 'po-accueil',
      personneId: 'pe-malik',
      ressourceId: null,
      statut: 'planifiee',
      note: 'Ajouté sans vérifier le planning',
    },
    {
      id: 'af-conflit-2',
      jour: jourPlanning(2),
      creneauId: 'cr-soir',
      posteId: 'po-buvette',
      personneId: 'pe-sofia',
      ressourceId: 'rs-grande',
      statut: 'planifiee',
      note: 'Salle déjà prise par la régie',
    },
  ]
}

/** Affecte une personne sur un créneau qu'elle n'a pas déclaré disponible, et une autre pendant son absence. */
export function affectationsIndisponibles(): Affectation[] {
  return [
    ...affectationsInitiales,
    {
      id: 'af-indispo-1',
      jour: jourPlanning(6),
      creneauId: 'cr-soir',
      posteId: 'po-accueil',
      personneId: 'pe-elodie',
      ressourceId: null,
      statut: 'planifiee',
      note: 'Créneau non déclaré par la personne',
    },
    {
      id: 'af-indispo-2',
      jour: jourPlanning(10),
      creneauId: 'cr-matin',
      posteId: 'po-accueil',
      personneId: 'pe-elodie',
      ressourceId: null,
      statut: 'planifiee',
      note: 'En formation à cette date',
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpisPlanning = {
  affectations: number
  cetteSemaine: number
  heuresSemaine: number
  aConfirmer: number
  conflits: number
  remplacementsOuverts: number
  absencesEnCours: number
  postesNonPourvus: number
}

export function calculerKpisPlanning(
  affectations: Affectation[],
  absences: Absence[],
  disponibilites: Disponibilite[],
  remplacements: Remplacement[],
  reference: Date = AUJOURDHUI_PLANNING,
): KpisPlanning {
  const jours = joursDeLaSemaine(reference).map(cleJour)
  const semaine = affectations.filter((a) => jours.includes(a.jour) && a.statut !== 'annulee')
  const aujourdhui = cleJour(AUJOURDHUI_PLANNING)

  // Un poste est réputé non pourvu quand un créneau ouvert reste sous son effectif cible
  let nonPourvus = 0
  for (const j of jours) {
    for (const c of creneaux) {
      for (const p of postes) {
        const sur = semaine.filter((a) => a.jour === j && a.creneauId === c.id && a.posteId === p.id).length
        if (sur > 0 && sur < p.effectifCible) nonPourvus++
      }
    }
  }

  return {
    affectations: affectations.length,
    cetteSemaine: semaine.length,
    heuresSemaine: semaine.reduce((s, a) => s + dureeCreneau(a.creneauId), 0),
    aConfirmer: semaine.filter((a) => a.statut === 'planifiee').length,
    conflits: new Set(tousLesConflits(affectations, absences, disponibilites).map((c) => c.affectation.id)).size,
    remplacementsOuverts: remplacements.filter((r) => r.statut === 'ouverte').length,
    absencesEnCours: absences.filter((a) => a.statut === 'validee' && a.debut <= aujourdhui && a.fin >= aujourdhui).length,
    postesNonPourvus: nonPourvus,
  }
}
