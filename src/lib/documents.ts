export const AUJOURDHUI_DOC = new Date('2026-09-03T00:00:00Z')

/** Taille maximale acceptée à l'import, en octets. */
export const TAILLE_MAX = 25 * 1024 * 1024

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type Dossier = {
  id: string
  nom: string
  parentId: string | null
  description: string
  creeLe: string
  creePar: string
}

export type NiveauDroit = 'aucun' | 'lecture' | 'ecriture' | 'admin'

export const niveauLabels: Record<NiveauDroit, string> = {
  aucun: 'Aucun accès',
  lecture: 'Lecture seule',
  ecriture: 'Lecture et modification',
  admin: 'Administration',
}

export type Groupe = 'bureau' | 'salaries' | 'benevoles' | 'adherents' | 'public'

export const groupeLabels: Record<Groupe, string> = {
  bureau: 'Membres du bureau',
  salaries: 'Salariés',
  benevoles: 'Bénévoles',
  adherents: 'Adhérents',
  public: 'Public',
}

export type Permission = { groupe: Groupe; niveau: NiveauDroit }

export type Version = {
  id: string
  numero: number
  taille: number
  creeLe: string
  creePar: string
  commentaire: string
}

export type EvenementDoc = {
  id: string
  quand: string
  auteur: string
  libelle: string
  detail?: string
  tone: 'success' | 'warning' | 'danger' | 'neutral'
}

export type Document = {
  id: string
  nom: string
  extension: string
  typeMime: string
  taille: number
  dossierId: string
  creePar: string
  creeLe: string
  modifieLe: string
  versions: Version[]
  tags: string[]
  projet: string | null
  association: string
  permissions: Permission[]
  favori: boolean
  /** Partagé par lien, avec ou sans échéance. */
  partage: { actif: boolean; lien: string; expireLe: string | null; parQui: string } | null
  supprime: boolean
  supprimeLe: string | null
  /** Faux pour les formats dont AssoConnex ne sait pas produire de rendu. */
  apercuDisponible: boolean
  historique: EvenementDoc[]
}

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

export function formatTaille(octets: number) {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}

const typesConnus: Record<string, { mime: string; apercu: boolean }> = {
  pdf: { mime: 'Document PDF', apercu: true },
  docx: { mime: 'Document Word', apercu: true },
  xlsx: { mime: 'Classeur Excel', apercu: true },
  pptx: { mime: 'Présentation PowerPoint', apercu: true },
  jpg: { mime: 'Image JPEG', apercu: true },
  png: { mime: 'Image PNG', apercu: true },
  odt: { mime: 'Document OpenDocument', apercu: true },
  csv: { mime: 'Fichier CSV', apercu: true },
  zip: { mime: 'Archive ZIP', apercu: false },
  dwg: { mime: 'Plan AutoCAD', apercu: false },
  mp4: { mime: 'Vidéo MP4', apercu: false },
}

export function typeDe(extension: string) {
  return typesConnus[extension] ?? { mime: 'Fichier', apercu: false }
}

export function cheminDe(dossierId: string, dossiers: Dossier[]): Dossier[] {
  const chemin: Dossier[] = []
  let courant = dossiers.find((d) => d.id === dossierId)
  while (courant) {
    chemin.unshift(courant)
    courant = courant.parentId ? dossiers.find((d) => d.id === courant!.parentId) : undefined
  }
  return chemin
}

export function sousDossiers(parentId: string | null, dossiers: Dossier[]) {
  return dossiers.filter((d) => d.parentId === parentId)
}

/** Compte les documents d'un dossier et de toute sa descendance. */
export function compterRecursif(dossierId: string, dossiers: Dossier[], documents: Document[]): number {
  const direct = documents.filter((d) => d.dossierId === dossierId && !d.supprime).length
  return direct + sousDossiers(dossierId, dossiers).reduce((s, sd) => s + compterRecursif(sd.id, dossiers, documents), 0)
}

/* ------------------------------------------------------------------ */
/* Arborescence                                                        */
/* ------------------------------------------------------------------ */

export const dossiersInitiaux: Dossier[] = [
  { id: 'dr-vie', nom: 'Vie associative', parentId: null, description: 'Statuts, procès-verbaux, déclarations en préfecture.', creeLe: '2021-09-01T09:00:00.000Z', creePar: 'Camille Beauchamp' },
  { id: 'dr-vie-statuts', nom: 'Statuts et règlement', parentId: 'dr-vie', description: 'Version en vigueur et historique des modifications.', creeLe: '2021-09-01T09:05:00.000Z', creePar: 'Camille Beauchamp' },
  { id: 'dr-vie-pv', nom: 'Procès-verbaux', parentId: 'dr-vie', description: 'Assemblées générales et conseils d’administration.', creeLe: '2021-09-01T09:06:00.000Z', creePar: 'Camille Beauchamp' },
  { id: 'dr-vie-prefecture', nom: 'Préfecture', parentId: 'dr-vie', description: 'Récépissés de déclaration et publications au Journal officiel.', creeLe: '2021-09-02T09:00:00.000Z', creePar: 'Yanis Traoré' },

  { id: 'dr-compta', nom: 'Comptabilité', parentId: null, description: 'Pièces comptables classées par exercice.', creeLe: '2021-09-01T10:00:00.000Z', creePar: 'Yanis Traoré' },
  { id: 'dr-compta-2425', nom: 'Exercice 2024-2025', parentId: 'dr-compta', description: 'Exercice clôturé.', creeLe: '2024-09-01T08:00:00.000Z', creePar: 'Yanis Traoré' },
  { id: 'dr-compta-2526', nom: 'Exercice 2025-2026', parentId: 'dr-compta', description: 'Exercice en cours.', creeLe: '2025-09-01T08:00:00.000Z', creePar: 'Yanis Traoré' },
  { id: 'dr-compta-2627', nom: 'Exercice 2026-2027', parentId: 'dr-compta', description: 'Exercice qui vient de s’ouvrir.', creeLe: '2026-09-01T08:00:00.000Z', creePar: 'Yanis Traoré' },

  { id: 'dr-subv', nom: 'Subventions', parentId: null, description: 'Dossiers de demande et conventions.', creeLe: '2022-01-10T09:00:00.000Z', creePar: 'Camille Beauchamp' },
  { id: 'dr-subv-ville', nom: 'Ville de Nantes', parentId: 'dr-subv', description: 'Convention pluriannuelle d’objectifs.', creeLe: '2022-01-10T09:10:00.000Z', creePar: 'Camille Beauchamp' },
  { id: 'dr-subv-dept', nom: 'Département', parentId: 'dr-subv', description: 'Appels à projets culture et jeunesse.', creeLe: '2022-01-10T09:12:00.000Z', creePar: 'Camille Beauchamp' },

  { id: 'dr-rh', nom: 'Ressources humaines', parentId: null, description: 'Contrats, paie et documents du personnel. Accès restreint.', creeLe: '2022-03-04T09:00:00.000Z', creePar: 'Camille Beauchamp' },
  { id: 'dr-rh-contrats', nom: 'Contrats', parentId: 'dr-rh', description: 'Contrats de travail et avenants.', creeLe: '2022-03-04T09:02:00.000Z', creePar: 'Camille Beauchamp' },
  { id: 'dr-rh-paie', nom: 'Paie', parentId: 'dr-rh', description: 'Bulletins et déclarations sociales.', creeLe: '2022-03-04T09:03:00.000Z', creePar: 'Yanis Traoré' },

  { id: 'dr-com', nom: 'Communication', parentId: null, description: 'Supports visuels et photographies.', creeLe: '2022-05-20T09:00:00.000Z', creePar: 'Élodie Nguyen' },
  { id: 'dr-com-affiches', nom: 'Affiches et programmes', parentId: 'dr-com', description: 'Fichiers sources et versions imprimables.', creeLe: '2022-05-20T09:05:00.000Z', creePar: 'Élodie Nguyen' },
  { id: 'dr-com-photos', nom: 'Photothèque', parentId: 'dr-com', description: 'Photographies des événements, droits à l’image vérifiés.', creeLe: '2022-05-20T09:06:00.000Z', creePar: 'Élodie Nguyen' },

  { id: 'dr-projets', nom: 'Projets', parentId: null, description: 'Un dossier par projet en cours.', creeLe: '2023-02-14T09:00:00.000Z', creePar: 'Awa Diallo' },
  { id: 'dr-projets-festival', nom: 'Festival du Vieux Moulin', parentId: 'dr-projets', description: 'Édition 2026.', creeLe: '2025-11-03T09:00:00.000Z', creePar: 'Awa Diallo' },
  { id: 'dr-projets-jeunesse', nom: 'Ateliers jeunesse', parentId: 'dr-projets', description: 'Autorisations parentales et programmes.', creeLe: '2025-09-12T09:00:00.000Z', creePar: 'Malik Benali' },
  { id: 'dr-projets-archives', nom: 'Éditions passées', parentId: 'dr-projets-festival', description: 'Archives des éditions précédentes.', creeLe: '2025-11-03T09:10:00.000Z', creePar: 'Awa Diallo' },

  { id: 'dr-assur', nom: 'Assurances', parentId: null, description: 'Contrats et attestations en cours de validité.', creeLe: '2021-10-01T09:00:00.000Z', creePar: 'Yanis Traoré' },
  { id: 'dr-modeles', nom: 'Modèles vierges', parentId: null, description: 'Dossier préparé, en attente de contenu.', creeLe: '2026-08-28T09:00:00.000Z', creePar: 'Camille Beauchamp' },
]

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

type Modele = {
  nom: string
  ext: string
  dossierId: string
  taille: number
  tags: string[]
  projet: string | null
  restreint?: boolean
  versions?: number
}

const modeles: Modele[] = [
  { nom: 'Statuts de l’association', ext: 'pdf', dossierId: 'dr-vie-statuts', taille: 412_000, tags: ['statutaire', 'référence'], projet: null, versions: 3 },
  { nom: 'Règlement intérieur', ext: 'pdf', dossierId: 'dr-vie-statuts', taille: 298_000, tags: ['statutaire'], projet: null, versions: 2 },
  { nom: 'PV assemblée générale 2026', ext: 'pdf', dossierId: 'dr-vie-pv', taille: 187_000, tags: ['assemblée générale', 'à signer'], projet: null },
  { nom: 'PV assemblée générale 2025', ext: 'pdf', dossierId: 'dr-vie-pv', taille: 176_000, tags: ['assemblée générale'], projet: null },
  { nom: 'PV conseil d’administration mars 2026', ext: 'docx', dossierId: 'dr-vie-pv', taille: 92_000, tags: ['conseil'], projet: null },
  { nom: 'PV conseil d’administration juin 2026', ext: 'docx', dossierId: 'dr-vie-pv', taille: 88_400, tags: ['conseil'], projet: null },
  { nom: 'Récépissé de déclaration en préfecture', ext: 'pdf', dossierId: 'dr-vie-prefecture', taille: 143_000, tags: ['référence'], projet: null },
  { nom: 'Publication au Journal officiel', ext: 'pdf', dossierId: 'dr-vie-prefecture', taille: 64_000, tags: ['référence'], projet: null },
  { nom: 'Déclaration de changement de bureau', ext: 'pdf', dossierId: 'dr-vie-prefecture', taille: 121_000, tags: [], projet: null },

  { nom: 'Grand livre 2024-2025', ext: 'xlsx', dossierId: 'dr-compta-2425', taille: 1_840_000, tags: ['comptabilité', 'clôture'], projet: null },
  { nom: 'Balance générale 2024-2025', ext: 'xlsx', dossierId: 'dr-compta-2425', taille: 620_000, tags: ['comptabilité', 'clôture'], projet: null },
  { nom: 'Rapport financier 2024-2025', ext: 'pdf', dossierId: 'dr-compta-2425', taille: 980_000, tags: ['comptabilité', 'assemblée générale'], projet: null, versions: 2 },
  { nom: 'Relevés bancaires 2024-2025', ext: 'zip', dossierId: 'dr-compta-2425', taille: 8_600_000, tags: ['banque'], projet: null },
  { nom: 'Grand livre 2025-2026', ext: 'xlsx', dossierId: 'dr-compta-2526', taille: 1_920_000, tags: ['comptabilité'], projet: null },
  { nom: 'Factures fournisseurs 2025-2026', ext: 'zip', dossierId: 'dr-compta-2526', taille: 12_400_000, tags: ['fournisseurs'], projet: null },
  { nom: 'Budget prévisionnel 2026-2027', ext: 'xlsx', dossierId: 'dr-compta-2627', taille: 340_000, tags: ['budget'], projet: null, versions: 4 },

  { nom: 'Convention pluriannuelle d’objectifs', ext: 'pdf', dossierId: 'dr-subv-ville', taille: 760_000, tags: ['subvention', 'à signer'], projet: null, versions: 2 },
  { nom: 'Demande de subvention 2026', ext: 'pdf', dossierId: 'dr-subv-ville', taille: 540_000, tags: ['subvention'], projet: null },
  { nom: 'Compte rendu financier de subvention', ext: 'xlsx', dossierId: 'dr-subv-ville', taille: 210_000, tags: ['subvention', 'comptabilité'], projet: null },
  { nom: 'Appel à projets culture — dossier', ext: 'pdf', dossierId: 'dr-subv-dept', taille: 1_120_000, tags: ['subvention'], projet: 'Festival du Vieux Moulin' },
  { nom: 'Notification d’attribution départementale', ext: 'pdf', dossierId: 'dr-subv-dept', taille: 96_000, tags: ['subvention'], projet: 'Festival du Vieux Moulin' },

  { nom: 'Contrat de travail — animateur', ext: 'pdf', dossierId: 'dr-rh-contrats', taille: 320_000, tags: ['confidentiel', 'à signer'], projet: null, restreint: true },
  { nom: 'Avenant temps partiel', ext: 'pdf', dossierId: 'dr-rh-contrats', taille: 180_000, tags: ['confidentiel'], projet: null, restreint: true },
  { nom: 'Bulletins de paie — août 2026', ext: 'pdf', dossierId: 'dr-rh-paie', taille: 240_000, tags: ['confidentiel', 'paie'], projet: null, restreint: true },
  { nom: 'DSN août 2026', ext: 'csv', dossierId: 'dr-rh-paie', taille: 48_000, tags: ['confidentiel', 'paie'], projet: null, restreint: true },

  { nom: 'Affiche festival 2026', ext: 'pdf', dossierId: 'dr-com-affiches', taille: 4_200_000, tags: ['communication'], projet: 'Festival du Vieux Moulin', versions: 5 },
  { nom: 'Programme de saison 2026-2027', ext: 'pdf', dossierId: 'dr-com-affiches', taille: 3_100_000, tags: ['communication'], projet: null, versions: 2 },
  { nom: 'Logo AssoConnex — sources', ext: 'zip', dossierId: 'dr-com-affiches', taille: 6_800_000, tags: ['identité'], projet: null },
  { nom: 'Photo — concert d’ouverture', ext: 'jpg', dossierId: 'dr-com-photos', taille: 2_600_000, tags: ['photo', 'droit à l’image'], projet: 'Festival du Vieux Moulin' },
  { nom: 'Photo — atelier peinture', ext: 'jpg', dossierId: 'dr-com-photos', taille: 1_900_000, tags: ['photo'], projet: 'Ateliers jeunesse' },
  { nom: 'Photo — assemblée générale', ext: 'png', dossierId: 'dr-com-photos', taille: 3_400_000, tags: ['photo'], projet: null },
  { nom: 'Captation vidéo — spectacle', ext: 'mp4', dossierId: 'dr-com-photos', taille: 18_600_000, tags: ['vidéo'], projet: 'Festival du Vieux Moulin' },

  { nom: 'Plan d’implantation du festival', ext: 'dwg', dossierId: 'dr-projets-festival', taille: 5_400_000, tags: ['technique'], projet: 'Festival du Vieux Moulin' },
  { nom: 'Fiche technique scène', ext: 'pdf', dossierId: 'dr-projets-festival', taille: 420_000, tags: ['technique'], projet: 'Festival du Vieux Moulin' },
  { nom: 'Contrat de cession — compagnie', ext: 'pdf', dossierId: 'dr-projets-festival', taille: 380_000, tags: ['à signer', 'contrat'], projet: 'Festival du Vieux Moulin' },
  { nom: 'Planning bénévoles', ext: 'xlsx', dossierId: 'dr-projets-festival', taille: 160_000, tags: ['bénévoles'], projet: 'Festival du Vieux Moulin', versions: 3 },
  { nom: 'Bilan édition 2025', ext: 'pdf', dossierId: 'dr-projets-archives', taille: 890_000, tags: ['bilan'], projet: 'Festival du Vieux Moulin' },
  { nom: 'Bilan édition 2024', ext: 'pdf', dossierId: 'dr-projets-archives', taille: 810_000, tags: ['bilan'], projet: 'Festival du Vieux Moulin' },
  { nom: 'Autorisation parentale — modèle', ext: 'docx', dossierId: 'dr-projets-jeunesse', taille: 74_000, tags: ['modèle', 'à signer'], projet: 'Ateliers jeunesse' },
  { nom: 'Programme des ateliers 2026-2027', ext: 'pdf', dossierId: 'dr-projets-jeunesse', taille: 520_000, tags: [], projet: 'Ateliers jeunesse' },
  { nom: 'Liste des encadrants', ext: 'xlsx', dossierId: 'dr-projets-jeunesse', taille: 92_000, tags: ['bénévoles'], projet: 'Ateliers jeunesse' },

  { nom: 'Contrat multirisque associations', ext: 'pdf', dossierId: 'dr-assur', taille: 640_000, tags: ['assurance', 'référence'], projet: null, versions: 2 },
  { nom: 'Attestation d’assurance 2026-2027', ext: 'pdf', dossierId: 'dr-assur', taille: 118_000, tags: ['assurance'], projet: null },
  { nom: 'Déclaration de sinistre — dégât des eaux', ext: 'pdf', dossierId: 'dr-assur', taille: 210_000, tags: ['assurance'], projet: null },
]

const auteurs = ['Camille Beauchamp', 'Yanis Traoré', 'Élodie Nguyen', 'Awa Diallo', 'Malik Benali']

function pick<T>(a: T[], i: number): T {
  return a[((i % a.length) + a.length) % a.length]
}

function jour(d: number) {
  return new Date(AUJOURDHUI_DOC.getTime() + d * 86400000).toISOString()
}

function permissionsPour(restreint: boolean, i: number): Permission[] {
  if (restreint) {
    return [
      { groupe: 'bureau', niveau: 'admin' },
      { groupe: 'salaries', niveau: 'lecture' },
      { groupe: 'benevoles', niveau: 'aucun' },
      { groupe: 'adherents', niveau: 'aucun' },
      { groupe: 'public', niveau: 'aucun' },
    ]
  }
  return [
    { groupe: 'bureau', niveau: 'admin' },
    { groupe: 'salaries', niveau: 'ecriture' },
    { groupe: 'benevoles', niveau: i % 3 === 0 ? 'ecriture' : 'lecture' },
    { groupe: 'adherents', niveau: i % 4 === 0 ? 'lecture' : 'aucun' },
    { groupe: 'public', niveau: i % 11 === 5 ? 'lecture' : 'aucun' },
  ]
}

function creerDocument(m: Modele, i: number): Document {
  const type = typeDe(m.ext)
  const creeLe = jour(-(20 + ((i * 23) % 900)))
  const nbVersions = m.versions ?? 1
  const versions: Version[] = Array.from({ length: nbVersions }, (_, k) => ({
    id: `vs-${i}-${k}`,
    numero: k + 1,
    taille: Math.round(m.taille * (0.82 + k * 0.06)),
    creeLe: new Date(new Date(creeLe).getTime() + k * 40 * 86400000).toISOString(),
    creePar: pick(auteurs, i + k),
    commentaire:
      k === 0
        ? 'Version initiale.'
        : k === nbVersions - 1
          ? 'Version en vigueur après relecture du bureau.'
          : `Corrections apportées après la réunion du ${new Date(new Date(creeLe).getTime() + k * 40 * 86400000).toLocaleDateString('fr-FR')}.`,
  })).reverse()

  const derniere = versions[0]
  const partage = i % 7 === 2

  const historique: EvenementDoc[] = [
    { id: `ed-${i}-1`, quand: creeLe, auteur: pick(auteurs, i), libelle: 'Document déposé', detail: `${m.nom}.${m.ext} — ${formatTaille(m.taille)}.`, tone: 'neutral' },
  ]
  for (const v of [...versions].reverse().slice(1)) {
    historique.push({ id: `ed-${i}-v${v.numero}`, quand: v.creeLe, auteur: v.creePar, libelle: `Version ${v.numero} déposée`, detail: v.commentaire, tone: 'success' })
  }
  if (partage) {
    historique.push({ id: `ed-${i}-p`, quand: jour(-(5 + (i % 30))), auteur: pick(auteurs, i + 1), libelle: 'Lien de partage créé', detail: 'Accès en lecture, sans authentification.', tone: 'warning' })
  }

  return {
    id: `doc-${100 + i}`,
    nom: m.nom,
    extension: m.ext,
    typeMime: type.mime,
    taille: derniere.taille,
    dossierId: m.dossierId,
    creePar: pick(auteurs, i),
    creeLe,
    modifieLe: derniere.creeLe,
    versions,
    tags: m.tags,
    projet: m.projet,
    association: 'Les Amis du Vieux Moulin',
    permissions: permissionsPour(!!m.restreint, i),
    favori: i % 6 === 1,
    partage: partage
      ? { actif: true, lien: `https://partage.assoconnex.fr/d/${(1000 + i * 37).toString(36)}`, expireLe: i % 3 === 0 ? jour(30) : null, parQui: pick(auteurs, i + 1) }
      : null,
    supprime: false,
    supprimeLe: null,
    apercuDisponible: type.apercu,
    historique: historique.sort((a, b) => (a.quand < b.quand ? 1 : -1)),
  }
}

const actifs = modeles.map((m, i) => creerDocument(m, i))

/** Quelques documents en corbeille, restaurables. */
const corbeille: Document[] = [
  { ...creerDocument({ nom: 'Brouillon de convention — obsolète', ext: 'docx', dossierId: 'dr-subv-ville', taille: 88_000, tags: [], projet: null }, 90), id: 'doc-901', supprime: true, supprimeLe: jour(-4) },
  { ...creerDocument({ nom: 'Affiche festival — version rejetée', ext: 'pdf', dossierId: 'dr-com-affiches', taille: 3_800_000, tags: ['communication'], projet: 'Festival du Vieux Moulin' }, 91), id: 'doc-902', supprime: true, supprimeLe: jour(-11) },
  { ...creerDocument({ nom: 'Ancien planning bénévoles', ext: 'xlsx', dossierId: 'dr-projets-festival', taille: 140_000, tags: ['bénévoles'], projet: 'Festival du Vieux Moulin' }, 92), id: 'doc-903', supprime: true, supprimeLe: jour(-26) },
]

export const documentsInitiaux: Document[] = [...actifs, ...corbeille]

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpisDocs = {
  total: number
  volume: number
  dossiers: number
  partages: number
  favoris: number
  corbeille: number
  sansApercu: number
  recents: number
}

export function calculerKpisDocs(documents: Document[], dossiers: Dossier[]): KpisDocs {
  const vivants = documents.filter((d) => !d.supprime)
  const limite = AUJOURDHUI_DOC.getTime() - 30 * 86400000
  return {
    total: vivants.length,
    volume: vivants.reduce((s, d) => s + d.taille, 0),
    dossiers: dossiers.length,
    partages: vivants.filter((d) => d.partage?.actif).length,
    favoris: vivants.filter((d) => d.favori).length,
    corbeille: documents.filter((d) => d.supprime).length,
    sansApercu: vivants.filter((d) => !d.apercuDisponible).length,
    recents: vivants.filter((d) => new Date(d.modifieLe).getTime() >= limite).length,
  }
}

export function volumeParDossierRacine(documents: Document[], dossiers: Dossier[]) {
  const racines = dossiers.filter((d) => d.parentId === null)
  return racines
    .map((r) => {
      const ids = new Set<string>()
      const collecter = (id: string) => {
        ids.add(id)
        sousDossiers(id, dossiers).forEach((sd) => collecter(sd.id))
      }
      collecter(r.id)
      const volume = documents
        .filter((d) => !d.supprime && ids.has(d.dossierId))
        .reduce((s, d) => s + d.taille, 0)
      return { label: r.nom, valeur: Math.round(volume / (1024 * 1024)) }
    })
    .filter((x) => x.valeur > 0)
    .sort((a, b) => b.valeur - a.valeur)
}

export function tousLesTags(documents: Document[]) {
  const m = new Map<string, number>()
  for (const d of documents) {
    if (d.supprime) continue
    for (const t of d.tags) m.set(t, (m.get(t) ?? 0) + 1)
  }
  return Array.from(m.entries())
    .map(([nom, nombre]) => ({ nom, nombre }))
    .sort((a, b) => b.nombre - a.nombre)
}
