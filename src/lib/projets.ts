export const AUJOURDHUI_PROJET = new Date('2026-09-04T00:00:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type StatutProjet = 'preparation' | 'en_cours' | 'suspendu' | 'cloture'

export const statutProjetLabels: Record<StatutProjet, string> = {
  preparation: 'En préparation',
  en_cours: 'En cours',
  suspendu: 'Suspendu',
  cloture: 'Clôturé',
}

export type MembreProjet = { nom: string; role: string; charge: number }

export type LigneBudgetProjet = {
  id: string
  poste: string
  sens: 'depense' | 'recette'
  prevu: number
  realise: number
  compteComptable: string
}

export type StatutJalon = 'a_venir' | 'atteint' | 'manque'

export type Jalon = {
  id: string
  nom: string
  description: string
  date: string
  statut: StatutJalon
  livrable: string
}

export type StatutRisque = 'ouvert' | 'maitrise' | 'clos'

export type Risque = {
  id: string
  libelle: string
  /** De 1 (faible) à 3 (élevée). */
  probabilite: 1 | 2 | 3
  impact: 1 | 2 | 3
  parade: string
  responsable: string
  statut: StatutRisque
}

export type Indicateur = {
  id: string
  libelle: string
  valeur: number
  cible: number
  unite: string
  sens: 'haut' | 'bas'
}

export type DocumentProjet = { id: string; nom: string; categorie: string; ajouteLe: string }

export type EvenementProjet = {
  id: string
  quand: string
  auteur: string
  libelle: string
  detail?: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

export type Projet = {
  id: string
  code: string
  nom: string
  description: string
  objectif: string
  statut: StatutProjet
  responsable: string
  equipe: MembreProjet[]
  dateDebut: string
  dateFin: string
  budget: LigneBudgetProjet[]
  jalons: Jalon[]
  risques: Risque[]
  indicateurs: Indicateur[]
  documents: DocumentProjet[]
  activite: EvenementProjet[]
  clotureLe: string | null
  bilanCloture: string
}

/* ------------------------------------------------------------------ */
/* Calculs                                                             */
/* ------------------------------------------------------------------ */

const arrondi = (n: number) => Math.round(n * 100) / 100

export function budgetProjet(p: Projet) {
  const depensesPrevues = arrondi(p.budget.filter((l) => l.sens === 'depense').reduce((s, l) => s + l.prevu, 0))
  const depensesRealisees = arrondi(p.budget.filter((l) => l.sens === 'depense').reduce((s, l) => s + l.realise, 0))
  const recettesPrevues = arrondi(p.budget.filter((l) => l.sens === 'recette').reduce((s, l) => s + l.prevu, 0))
  const recettesRealisees = arrondi(p.budget.filter((l) => l.sens === 'recette').reduce((s, l) => s + l.realise, 0))
  const consomme = depensesPrevues === 0 ? 0 : Math.round((depensesRealisees / depensesPrevues) * 100)
  return {
    depensesPrevues,
    depensesRealisees,
    recettesPrevues,
    recettesRealisees,
    resultatPrevu: arrondi(recettesPrevues - depensesPrevues),
    resultatRealise: arrondi(recettesRealisees - depensesRealisees),
    consomme,
    depasse: depensesRealisees > depensesPrevues,
    ecart: arrondi(depensesRealisees - depensesPrevues),
  }
}

export function avancementTemporel(p: Projet) {
  const debut = new Date(p.dateDebut).getTime()
  const fin = new Date(p.dateFin).getTime()
  const maintenant = AUJOURDHUI_PROJET.getTime()
  if (maintenant <= debut) return 0
  if (maintenant >= fin) return 100
  return Math.round(((maintenant - debut) / (fin - debut)) * 100)
}

export function joursAvantFin(p: Projet) {
  return Math.round((new Date(p.dateFin).getTime() - AUJOURDHUI_PROJET.getTime()) / 86400000)
}

export function scoreRisque(r: Risque) {
  return r.probabilite * r.impact
}

export function niveauRisque(r: Risque): 'faible' | 'moyen' | 'eleve' {
  const s = scoreRisque(r)
  if (s >= 6) return 'eleve'
  if (s >= 3) return 'moyen'
  return 'faible'
}

/* ------------------------------------------------------------------ */
/* Données mockées                                                     */
/* ------------------------------------------------------------------ */

function jour(d: number) {
  return new Date(AUJOURDHUI_PROJET.getTime() + d * 86400000).toISOString()
}

export const projetsInitiaux: Projet[] = [
  {
    id: 'pj-festival',
    code: 'FEST26',
    nom: 'Festival du Vieux Moulin',
    description: 'Troisième édition du festival, sur trois jours en novembre, dans le parc et la grande salle.',
    objectif: 'Réunir 1 200 spectateurs sur trois jours et équilibrer le budget grâce aux subventions et au partenariat.',
    statut: 'en_cours',
    responsable: 'Awa Diallo',
    equipe: [
      { nom: 'Awa Diallo', role: 'Cheffe de projet', charge: 40 },
      { nom: 'Camille Beauchamp', role: 'Administration et conventions', charge: 20 },
      { nom: 'Élodie Nguyen', role: 'Communication', charge: 25 },
      { nom: 'Malik Benali', role: 'Technique et logistique', charge: 30 },
      { nom: 'Hugo Fournier', role: 'Bénévoles', charge: 15 },
    ],
    dateDebut: jour(-120),
    dateFin: jour(75),
    budget: [
      { id: 'bp-f1', poste: 'Cachets artistiques', sens: 'depense', prevu: 8600, realise: 7950, compteComptable: '623000' },
      { id: 'bp-f2', poste: 'Régie technique et matériel', sens: 'depense', prevu: 3800, realise: 3620, compteComptable: '613000' },
      { id: 'bp-f3', poste: 'Communication et impression', sens: 'depense', prevu: 1800, realise: 1740, compteComptable: '623000' },
      { id: 'bp-f4', poste: 'Sécurité et assurance', sens: 'depense', prevu: 1400, realise: 1380, compteComptable: '616000' },
      { id: 'bp-f5', poste: 'Restauration bénévoles', sens: 'depense', prevu: 900, realise: 610, compteComptable: '606400' },
      { id: 'bp-f6', poste: 'Subvention Ville de Nantes', sens: 'recette', prevu: 6000, realise: 6000, compteComptable: '740000' },
      { id: 'bp-f7', poste: 'Subvention départementale', sens: 'recette', prevu: 2600, realise: 2600, compteComptable: '740000' },
      { id: 'bp-f8', poste: 'Billetterie', sens: 'recette', prevu: 4800, realise: 0, compteComptable: '706100' },
      { id: 'bp-f9', poste: 'Partenariat et encarts', sens: 'recette', prevu: 1600, realise: 1200, compteComptable: '706100' },
      { id: 'bp-f10', poste: 'Buvette', sens: 'recette', prevu: 1200, realise: 0, compteComptable: '707000' },
    ],
    jalons: [
      { id: 'jl-f1', nom: 'Programmation arrêtée', description: 'Liste définitive des compagnies validée par le bureau.', date: jour(6), statut: 'a_venir', livrable: 'Programme définitif' },
      { id: 'jl-f2', nom: 'Autorisations obtenues', description: 'Occupation du domaine public et sécurité.', date: jour(-30), statut: 'atteint', livrable: 'Arrêté municipal' },
      { id: 'jl-f3', nom: 'Communication lancée', description: 'Affiches imprimées et diffusion en cours.', date: jour(18), statut: 'a_venir', livrable: 'Affiche et programme' },
      { id: 'jl-f4', nom: 'Équipe bénévole complète', description: 'Quarante bénévoles affectés sur les trois jours.', date: jour(-6), statut: 'atteint', livrable: 'Planning bénévoles' },
      { id: 'jl-f5', nom: 'Ouverture du festival', description: 'Premier jour, concert d’ouverture.', date: jour(68), statut: 'a_venir', livrable: 'Événement' },
    ],
    risques: [
      { id: 'rq-f1', libelle: 'Billetterie inférieure aux prévisions', probabilite: 2, impact: 3, parade: 'Renforcer la communication locale et proposer un tarif réduit le premier soir.', responsable: 'Élodie Nguyen', statut: 'ouvert' },
      { id: 'rq-f2', libelle: 'Dépassement du budget artistique', probabilite: 3, impact: 2, parade: 'Plafonner les cachets restants et renégocier les frais de déplacement.', responsable: 'Awa Diallo', statut: 'ouvert' },
      { id: 'rq-f3', libelle: 'Météo défavorable sur la scène extérieure', probabilite: 2, impact: 3, parade: 'Louer un chapiteau de repli, devis obtenu.', responsable: 'Malik Benali', statut: 'maitrise' },
      { id: 'rq-f4', libelle: 'Bénévoles en nombre insuffisant', probabilite: 2, impact: 2, parade: 'Relancer les bénévoles de l’édition précédente et solliciter les associations partenaires.', responsable: 'Hugo Fournier', statut: 'ouvert' },
      { id: 'rq-f5', libelle: 'Retard de livraison du matériel scénique', probabilite: 1, impact: 2, parade: 'Commande passée deux mois à l’avance, prestataire de secours identifié.', responsable: 'Malik Benali', statut: 'clos' },
    ],
    indicateurs: [
      { id: 'in-f1', libelle: 'Spectateurs attendus', valeur: 0, cible: 1200, unite: 'personnes', sens: 'haut' },
      { id: 'in-f2', libelle: 'Bénévoles mobilisés', valeur: 41, cible: 40, unite: 'personnes', sens: 'haut' },
      { id: 'in-f3', libelle: 'Compagnies programmées', valeur: 7, cible: 9, unite: 'compagnies', sens: 'haut' },
      { id: 'in-f4', libelle: 'Coût par spectateur', valeur: 11, cible: 12, unite: '€', sens: 'bas' },
    ],
    documents: [
      { id: 'dp-f1', nom: 'Plan d’implantation du festival.dwg', categorie: 'Technique', ajouteLe: jour(-52) },
      { id: 'dp-f2', nom: 'Fiche technique scène.pdf', categorie: 'Technique', ajouteLe: jour(-48) },
      { id: 'dp-f3', nom: 'Contrat de cession — compagnie.pdf', categorie: 'Contrat', ajouteLe: jour(-20) },
      { id: 'dp-f4', nom: 'Affiche festival 2026.pdf', categorie: 'Communication', ajouteLe: jour(-14) },
      { id: 'dp-f5', nom: 'Planning bénévoles.xlsx', categorie: 'Logistique', ajouteLe: jour(-8) },
    ],
    activite: [
      { id: 'ap-f1', quand: jour(-120), auteur: 'Awa Diallo', libelle: 'Projet créé', detail: 'Budget prévisionnel de 15 100 € en dépenses.', tone: 'neutral' },
      { id: 'ap-f2', quand: jour(-88), auteur: 'Camille Beauchamp', libelle: 'Subvention municipale notifiée', detail: '6 000 € confirmés par convention.', tone: 'success' },
      { id: 'ap-f3', quand: jour(-52), auteur: 'Malik Benali', libelle: 'Plan d’implantation déposé', detail: 'Validé par les services techniques.', tone: 'neutral' },
      { id: 'ap-f4', quand: jour(-30), auteur: 'Camille Beauchamp', libelle: 'Jalon atteint — autorisations obtenues', detail: 'Arrêté municipal reçu.', tone: 'success' },
      { id: 'ap-f5', quand: jour(-12), auteur: 'Awa Diallo', libelle: 'Budget artistique arrêté', detail: 'Les cachets sont signés pour 7 950 €, sous l’enveloppe de 8 600 €.', tone: 'success' },
      { id: 'ap-f6', quand: jour(-6), auteur: 'Hugo Fournier', libelle: 'Jalon atteint — équipe bénévole', detail: '41 bénévoles inscrits pour 40 attendus.', tone: 'success' },
    ],
    clotureLe: null,
    bilanCloture: '',
  },
  {
    id: 'pj-jeunesse',
    code: 'JEUN26',
    nom: 'Ateliers jeunesse',
    description: 'Ateliers hebdomadaires pour les 8-14 ans, sur toute la saison, encadrés par deux animateurs.',
    objectif: 'Accueillir 24 enfants sur l’année et pérenniser le financement par la caisse d’allocations familiales.',
    statut: 'en_cours',
    responsable: 'Malik Benali',
    equipe: [
      { nom: 'Malik Benali', role: 'Coordinateur des ateliers', charge: 50 },
      { nom: 'Awa Diallo', role: 'Suivi pédagogique', charge: 10 },
      { nom: 'Hugo Fournier', role: 'Logistique et matériel', charge: 10 },
    ],
    dateDebut: jour(-30),
    dateFin: jour(300),
    budget: [
      { id: 'bp-j1', poste: 'Rémunération des animateurs', sens: 'depense', prevu: 9600, realise: 1600, compteComptable: '641000' },
      { id: 'bp-j2', poste: 'Matériel pédagogique', sens: 'depense', prevu: 1400, realise: 380, compteComptable: '606300' },
      { id: 'bp-j3', poste: 'Location de salle', sens: 'depense', prevu: 2200, realise: 420, compteComptable: '613000' },
      { id: 'bp-j4', poste: 'Cotisations des familles', sens: 'recette', prevu: 3600, realise: 1980, compteComptable: '706000' },
      { id: 'bp-j5', poste: 'Subvention jeunesse', sens: 'recette', prevu: 8000, realise: 4000, compteComptable: '740000' },
      { id: 'bp-j6', poste: 'Aide de la caisse d’allocations familiales', sens: 'recette', prevu: 2200, realise: 0, compteComptable: '740000' },
    ],
    jalons: [
      { id: 'jl-j1', nom: 'Programme de la saison validé', description: 'Six thématiques sur l’année.', date: jour(-22), statut: 'atteint', livrable: 'Programme' },
      { id: 'jl-j2', nom: 'Autorisations parentales complètes', description: 'Toutes les familles ont retourné le document.', date: jour(-1), statut: 'atteint', livrable: 'Dossier d’inscription' },
      { id: 'jl-j3', nom: 'Bilan de mi-saison', description: 'Point d’étape avec les familles.', date: jour(120), statut: 'a_venir', livrable: 'Compte rendu' },
      { id: 'jl-j4', nom: 'Exposition de fin d’année', description: 'Restitution publique des travaux.', date: jour(280), statut: 'a_venir', livrable: 'Exposition' },
    ],
    risques: [
      { id: 'rq-j1', libelle: 'Effectif insuffisant pour équilibrer le budget', probabilite: 2, impact: 3, parade: 'Communiquer auprès des écoles et proposer une séance découverte gratuite.', responsable: 'Malik Benali', statut: 'ouvert' },
      { id: 'rq-j2', libelle: 'Non-obtention de l’aide de la caisse d’allocations familiales', probabilite: 2, impact: 3, parade: 'Dossier déposé en avance, relance prévue en novembre.', responsable: 'Camille Beauchamp', statut: 'ouvert' },
      { id: 'rq-j3', libelle: 'Indisponibilité d’un animateur', probabilite: 1, impact: 2, parade: 'Un encadrant remplaçant identifié et formé.', responsable: 'Malik Benali', statut: 'maitrise' },
    ],
    indicateurs: [
      { id: 'in-j1', libelle: 'Enfants inscrits', valeur: 22, cible: 24, unite: 'enfants', sens: 'haut' },
      { id: 'in-j2', libelle: 'Taux de présence moyen', valeur: 84, cible: 85, unite: '%', sens: 'haut' },
      { id: 'in-j3', libelle: 'Séances réalisées', valeur: 4, cible: 30, unite: 'séances', sens: 'haut' },
    ],
    documents: [
      { id: 'dp-j1', nom: 'Autorisation parentale — modèle.docx', categorie: 'Administratif', ajouteLe: jour(-28) },
      { id: 'dp-j2', nom: 'Programme des ateliers 2026-2027.pdf', categorie: 'Pédagogie', ajouteLe: jour(-22) },
      { id: 'dp-j3', nom: 'Liste des encadrants.xlsx', categorie: 'Équipe', ajouteLe: jour(-18) },
    ],
    activite: [
      { id: 'ap-j1', quand: jour(-30), auteur: 'Malik Benali', libelle: 'Projet créé', detail: 'Saison 2026-2027 ouverte.', tone: 'neutral' },
      { id: 'ap-j2', quand: jour(-22), auteur: 'Awa Diallo', libelle: 'Jalon atteint — programme validé', detail: 'Six thématiques retenues.', tone: 'success' },
      { id: 'ap-j3', quand: jour(-10), auteur: 'Camille Beauchamp', libelle: 'Subvention jeunesse encaissée', detail: 'Premier versement de 4 000 €.', tone: 'success' },
      { id: 'ap-j4', quand: jour(-1), auteur: 'Malik Benali', libelle: 'Jalon atteint — autorisations parentales', detail: 'Les vingt-deux familles ont retourné le document.', tone: 'success' },
    ],
    clotureLe: null,
    bilanCloture: '',
  },
  {
    id: 'pj-com',
    code: 'COM26',
    nom: 'Refonte de la communication',
    description: 'Nouvelle lettre d’information, mise à jour du site et harmonisation des supports.',
    objectif: 'Doubler le taux d’ouverture de la lettre d’information et disposer de supports cohérents.',
    statut: 'en_cours',
    responsable: 'Élodie Nguyen',
    equipe: [
      { nom: 'Élodie Nguyen', role: 'Cheffe de projet', charge: 45 },
      { nom: 'Camille Beauchamp', role: 'Validation éditoriale', charge: 10 },
      { nom: 'Hugo Fournier', role: 'Photographie', charge: 10 },
    ],
    dateDebut: jour(-60),
    dateFin: jour(90),
    budget: [
      { id: 'bp-c1', poste: 'Prestation graphique', sens: 'depense', prevu: 2400, realise: 1200, compteComptable: '623000' },
      { id: 'bp-c2', poste: 'Outil d’emailing', sens: 'depense', prevu: 480, realise: 240, compteComptable: '626000' },
      { id: 'bp-c3', poste: 'Impression des supports', sens: 'depense', prevu: 1600, realise: 0, compteComptable: '623000' },
      { id: 'bp-c4', poste: 'Fonds propres', sens: 'recette', prevu: 4480, realise: 4480, compteComptable: '758000' },
    ],
    jalons: [
      { id: 'jl-c1', nom: 'Nouvelle charte validée', description: 'Gabarits et palette arrêtés.', date: jour(-18), statut: 'atteint', livrable: 'Charte graphique' },
      { id: 'jl-c2', nom: 'Premier numéro de la lettre', description: 'Envoi test puis diffusion générale.', date: jour(12), statut: 'a_venir', livrable: 'Lettre d’information' },
      { id: 'jl-c3', nom: 'Site mis à jour', description: 'Programme de saison et photothèque.', date: jour(45), statut: 'a_venir', livrable: 'Site internet' },
    ],
    risques: [
      { id: 'rq-c1', libelle: 'Liste de diffusion obsolète', probabilite: 3, impact: 2, parade: 'Nettoyage de la base de contacts programmé avant le premier envoi.', responsable: 'Hugo Fournier', statut: 'ouvert' },
      { id: 'rq-c2', libelle: 'Retard du prestataire graphique', probabilite: 2, impact: 2, parade: 'Jalons intermédiaires contractualisés.', responsable: 'Élodie Nguyen', statut: 'maitrise' },
    ],
    indicateurs: [
      { id: 'in-c1', libelle: 'Taux d’ouverture', valeur: 21, cible: 40, unite: '%', sens: 'haut' },
      { id: 'in-c2', libelle: 'Abonnés à la lettre', valeur: 186, cible: 250, unite: 'abonnés', sens: 'haut' },
      { id: 'in-c3', libelle: 'Adresses invalides', valeur: 34, cible: 5, unite: 'adresses', sens: 'bas' },
    ],
    documents: [
      { id: 'dp-c1', nom: 'Programme de saison 2026-2027.pdf', categorie: 'Communication', ajouteLe: jour(-30) },
      { id: 'dp-c2', nom: 'Logo AssoConnex — sources.zip', categorie: 'Identité', ajouteLe: jour(-18) },
    ],
    activite: [
      { id: 'ap-c1', quand: jour(-60), auteur: 'Élodie Nguyen', libelle: 'Projet créé', detail: 'Refonte engagée sur six mois.', tone: 'neutral' },
      { id: 'ap-c2', quand: jour(-18), auteur: 'Élodie Nguyen', libelle: 'Jalon atteint — charte validée', detail: 'Gabarits approuvés par le bureau.', tone: 'success' },
    ],
    clotureLe: null,
    bilanCloture: '',
  },
  {
    id: 'pj-salle',
    code: 'SALL27',
    nom: 'Rénovation de la salle',
    description: 'Mise aux normes de l’éclairage et réfection du plancher de la grande salle.',
    objectif: 'Disposer d’une salle conforme et accueillante avant la saison 2027-2028.',
    statut: 'preparation',
    responsable: 'Yanis Traoré',
    equipe: [{ nom: 'Yanis Traoré', role: 'Chef de projet', charge: 10 }],
    dateDebut: jour(60),
    dateFin: jour(330),
    budget: [
      { id: 'bp-s1', poste: 'Travaux d’éclairage', sens: 'depense', prevu: 8500, realise: 0, compteComptable: '218000' },
      { id: 'bp-s2', poste: 'Réfection du plancher', sens: 'depense', prevu: 12000, realise: 0, compteComptable: '218000' },
      { id: 'bp-s3', poste: 'Subvention d’équipement', sens: 'recette', prevu: 14000, realise: 0, compteComptable: '740000' },
      { id: 'bp-s4', poste: 'Fonds associatifs', sens: 'recette', prevu: 6500, realise: 0, compteComptable: '102000' },
    ],
    jalons: [
      { id: 'jl-s1', nom: 'Devis comparatifs obtenus', description: 'Trois entreprises consultées.', date: jour(75), statut: 'a_venir', livrable: 'Dossier de consultation' },
      { id: 'jl-s2', nom: 'Subvention accordée', description: 'Réponse du conseil départemental.', date: jour(140), statut: 'a_venir', livrable: 'Notification' },
    ],
    risques: [
      { id: 'rq-s1', libelle: 'Refus de la subvention d’équipement', probabilite: 2, impact: 3, parade: 'Solliciter un second financeur en parallèle.', responsable: 'Yanis Traoré', statut: 'ouvert' },
    ],
    indicateurs: [{ id: 'in-s1', libelle: 'Devis reçus', valeur: 0, cible: 3, unite: 'devis', sens: 'haut' }],
    documents: [],
    activite: [{ id: 'ap-s1', quand: jour(-5), auteur: 'Yanis Traoré', libelle: 'Projet créé', detail: 'En préparation, démarrage prévu en novembre.', tone: 'neutral' }],
    clotureLe: null,
    bilanCloture: '',
  },
  {
    id: 'pj-festival25',
    code: 'FEST25',
    nom: 'Festival du Vieux Moulin — édition 2025',
    description: 'Deuxième édition, sur deux jours, dans la grande salle uniquement.',
    objectif: 'Confirmer le format et atteindre 800 spectateurs.',
    statut: 'cloture',
    responsable: 'Awa Diallo',
    equipe: [
      { nom: 'Awa Diallo', role: 'Cheffe de projet', charge: 35 },
      { nom: 'Élodie Nguyen', role: 'Communication', charge: 20 },
      { nom: 'Malik Benali', role: 'Technique', charge: 25 },
    ],
    dateDebut: jour(-480),
    dateFin: jour(-300),
    budget: [
      { id: 'bp-p1', poste: 'Cachets artistiques', sens: 'depense', prevu: 5200, realise: 5050, compteComptable: '623000' },
      { id: 'bp-p2', poste: 'Régie technique', sens: 'depense', prevu: 2400, realise: 2380, compteComptable: '613000' },
      { id: 'bp-p3', poste: 'Communication', sens: 'depense', prevu: 1200, realise: 1310, compteComptable: '623000' },
      { id: 'bp-p4', poste: 'Subventions', sens: 'recette', prevu: 6000, realise: 6000, compteComptable: '740000' },
      { id: 'bp-p5', poste: 'Billetterie', sens: 'recette', prevu: 3200, realise: 3480, compteComptable: '706100' },
    ],
    jalons: [
      { id: 'jl-p1', nom: 'Ouverture du festival', description: 'Première soirée.', date: jour(-320), statut: 'atteint', livrable: 'Événement' },
      { id: 'jl-p2', nom: 'Bilan présenté au bureau', description: 'Compte rendu financier et artistique.', date: jour(-302), statut: 'atteint', livrable: 'Bilan' },
    ],
    risques: [{ id: 'rq-p1', libelle: 'Billetterie inférieure aux prévisions', probabilite: 2, impact: 3, parade: 'Communication renforcée la dernière semaine.', responsable: 'Élodie Nguyen', statut: 'clos' }],
    indicateurs: [
      { id: 'in-p1', libelle: 'Spectateurs', valeur: 870, cible: 800, unite: 'personnes', sens: 'haut' },
      { id: 'in-p2', libelle: 'Bénévoles mobilisés', valeur: 31, cible: 30, unite: 'personnes', sens: 'haut' },
    ],
    documents: [{ id: 'dp-p1', nom: 'Bilan édition 2025.pdf', categorie: 'Bilan', ajouteLe: jour(-302) }],
    activite: [
      { id: 'ap-p1', quand: jour(-480), auteur: 'Awa Diallo', libelle: 'Projet créé', detail: 'Édition 2025 lancée.', tone: 'neutral' },
      { id: 'ap-p2', quand: jour(-320), auteur: 'Awa Diallo', libelle: 'Festival tenu', detail: '870 spectateurs sur deux jours.', tone: 'success' },
      { id: 'ap-p3', quand: jour(-300), auteur: 'Camille Beauchamp', libelle: 'Projet clôturé', detail: 'Excédent de 740 € affecté aux réserves.', tone: 'success' },
    ],
    clotureLe: jour(-300),
    bilanCloture:
      'Objectif de fréquentation dépassé de 9 %. Le budget se solde par un excédent de 740 €. Deux points à corriger pour 2026 : anticiper la commande du matériel scénique et étoffer l’équipe bénévole du dimanche.',
  },
]

/**
 * Variante volontairement dégradée, réservée au mode de démonstration :
 * le festival dépasse son enveloppe et manque son jalon bénévoles.
 */
export function projetsAvecDepassement(): Projet[] {
  return projetsInitiaux.map((p) => {
    if (p.id !== 'pj-festival') return p
    return {
      ...p,
      budget: p.budget.map((l) =>
        l.id === 'bp-f1' ? { ...l, prevu: 7800, realise: 8450 } : l.id === 'bp-f2' ? { ...l, prevu: 3200, realise: 3620 } : l,
      ),
      jalons: p.jalons.map((j) => (j.id === 'jl-f4' ? { ...j, statut: 'manque' as StatutJalon } : j)),
      indicateurs: p.indicateurs.map((i) => (i.id === 'in-f2' ? { ...i, valeur: 27 } : i)),
    }
  })
}

/* ------------------------------------------------------------------ */
/* Indicateurs consolidés                                              */
/* ------------------------------------------------------------------ */

export type KpisProjets = {
  total: number
  enCours: number
  enPreparation: number
  clotures: number
  budgetTotal: number
  depenseTotale: number
  budgetsDepasses: number
  risquesEleves: number
  jalonsManques: number
  jalonsProches: number
}

export function calculerKpisProjets(projets: Projet[]): KpisProjets {
  const actifs = projets.filter((p) => p.statut !== 'cloture')
  return {
    total: projets.length,
    enCours: projets.filter((p) => p.statut === 'en_cours').length,
    enPreparation: projets.filter((p) => p.statut === 'preparation').length,
    clotures: projets.filter((p) => p.statut === 'cloture').length,
    budgetTotal: arrondi(actifs.reduce((s, p) => s + budgetProjet(p).depensesPrevues, 0)),
    depenseTotale: arrondi(actifs.reduce((s, p) => s + budgetProjet(p).depensesRealisees, 0)),
    budgetsDepasses: actifs.filter((p) => budgetProjet(p).depasse).length,
    risquesEleves: actifs.reduce((s, p) => s + p.risques.filter((r) => r.statut === 'ouvert' && niveauRisque(r) === 'eleve').length, 0),
    jalonsManques: actifs.reduce((s, p) => s + p.jalons.filter((j) => j.statut === 'manque').length, 0),
    jalonsProches: actifs.reduce(
      (s, p) =>
        s +
        p.jalons.filter((j) => {
          const d = Math.round((new Date(j.date).getTime() - AUJOURDHUI_PROJET.getTime()) / 86400000)
          return j.statut === 'a_venir' && d >= 0 && d <= 30
        }).length,
      0,
    ),
  }
}
