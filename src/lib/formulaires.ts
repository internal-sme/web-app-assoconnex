import { uid } from '@/lib/utils'

export const AUJOURDHUI_FORM = new Date('2026-09-10T00:00:00Z')

export const MOI_FORM = { nom: 'Camille Beauchamp', email: 'camille.beauchamp@vieuxmoulin.fr' }

/* ------------------------------------------------------------------ */
/* Modèle — champs du formulaire                                       */
/* ------------------------------------------------------------------ */

/** Type de contrôle utilisable par une question conditionnelle. */
export type SousTypeConditionnel = 'texte' | 'texte_long' | 'choix_unique' | 'choix_multiple' | 'liste' | 'date' | 'echelle'

export type TypeChamp =
  | 'texte'
  | 'texte_long'
  | 'email'
  | 'telephone'
  | 'date'
  | 'choix_unique'
  | 'choix_multiple'
  | 'liste'
  | 'echelle'
  | 'adresse'
  | 'fichier'
  | 'signature'
  | 'consentement'
  | 'section'
  | 'conditionnelle'

export const champLabels: Record<TypeChamp, string> = {
  texte: 'Question courte',
  texte_long: 'Question longue',
  email: 'Adresse e-mail',
  telephone: 'Numéro de téléphone',
  date: 'Date',
  choix_unique: 'Choix unique',
  choix_multiple: 'Choix multiple',
  liste: 'Liste déroulante',
  echelle: 'Échelle d’appréciation',
  adresse: 'Adresse postale',
  fichier: 'Dépôt de fichier',
  signature: 'Signature',
  consentement: 'Consentement',
  section: 'Section',
  conditionnelle: 'Question conditionnelle',
}

export const champAide: Record<TypeChamp, string> = {
  texte: 'Réponse libre sur une ligne.',
  texte_long: 'Réponse libre sur plusieurs lignes.',
  email: 'Validée au format d’une adresse e-mail.',
  telephone: 'Numéro de téléphone, en France ou à l’étranger.',
  date: 'Sélecteur de date.',
  choix_unique: 'Une seule réponse possible parmi une liste de choix.',
  choix_multiple: 'Plusieurs réponses possibles parmi une liste de choix.',
  liste: 'Une réponse choisie dans un menu déroulant.',
  echelle: 'Notation sur une échelle numérique.',
  adresse: 'Rue, code postal et ville.',
  fichier: 'Le répondant dépose un document.',
  signature: 'Le répondant appose sa signature.',
  consentement: 'Case à cocher liée à un texte légal.',
  section: 'Titre de section, sans réponse attendue.',
  conditionnelle: 'N’apparaît que si la réponse à une autre question le déclenche.',
}

export const groupesPalette: { titre: string; types: TypeChamp[] }[] = [
  { titre: 'Champs de saisie', types: ['texte', 'texte_long', 'email', 'telephone', 'date'] },
  { titre: 'Choix', types: ['choix_unique', 'choix_multiple', 'liste', 'echelle'] },
  { titre: 'Spécifiques', types: ['adresse', 'fichier', 'signature', 'consentement'] },
  { titre: 'Structure', types: ['section', 'conditionnelle'] },
]

export const sousTypesConditionnels: { value: SousTypeConditionnel; label: string }[] = [
  { value: 'texte', label: 'Question courte' },
  { value: 'texte_long', label: 'Question longue' },
  { value: 'choix_unique', label: 'Choix unique' },
  { value: 'choix_multiple', label: 'Choix multiple' },
  { value: 'liste', label: 'Liste déroulante' },
  { value: 'date', label: 'Date' },
  { value: 'echelle', label: 'Échelle d’appréciation' },
]

export type Condition = { champId: string; valeur: string }

export type Champ = {
  id: string
  type: TypeChamp
  label: string
  aide: string
  obligatoire: boolean
  placeholder: string
  /** Options pour choix_unique / choix_multiple / liste, ou pour une question conditionnelle de ces sous-types. */
  options: string[]
  echelleMin: number
  echelleMax: number
  echelleLabelMin: string
  echelleLabelMax: string
  /** Texte légal affiché à côté de la case, pour les champs de type consentement. */
  consentementTexte: string
  /** Type de contrôle réellement affiché, quand type === 'conditionnelle'. */
  sousType: SousTypeConditionnel
  /** N'affiche ce champ que si le champ désigné porte la valeur attendue. */
  condition: Condition | null
}

/** Le type effectivement rendu à l'écran — celui du sous-type pour une question conditionnelle. */
export function typeEffectif(champ: Pick<Champ, 'type' | 'sousType'>): Exclude<TypeChamp, 'conditionnelle'> | SousTypeConditionnel {
  return champ.type === 'conditionnelle' ? champ.sousType : champ.type
}

export function champAvecOptions(champ: Champ) {
  return ['choix_unique', 'choix_multiple', 'liste'].includes(typeEffectif(champ))
}

export function champEstEchelle(champ: Champ) {
  return typeEffectif(champ) === 'echelle'
}

/** Un champ « saisissable » attend une réponse — une section n'en attend pas. */
export function champSaisissable(champ: Champ) {
  return champ.type !== 'section'
}

/** Une question conditionnelle ne s'affiche que si le champ désigné porte la valeur attendue. */
export function champVisible(champ: Champ, valeurs: Record<string, string | string[]>) {
  if (!champ.condition) return true
  const v = valeurs[champ.condition.champId]
  return Array.isArray(v) ? v.includes(champ.condition.valeur) : v === champ.condition.valeur
}

export function champVide(type: TypeChamp): Champ {
  const base: Champ = {
    id: uid('ch'),
    type,
    label: champLabels[type],
    aide: '',
    obligatoire: type !== 'section' && type !== 'consentement',
    placeholder: '',
    options: [],
    echelleMin: 1,
    echelleMax: 5,
    echelleLabelMin: 'Pas du tout satisfait',
    echelleLabelMax: 'Tout à fait satisfait',
    consentementTexte: '',
    sousType: 'texte',
    condition: null,
  }
  if (type === 'choix_unique' || type === 'choix_multiple' || type === 'liste') {
    base.options = ['Option 1', 'Option 2']
  }
  if (type === 'consentement') {
    base.consentementTexte = "J'accepte que mes données soient utilisées dans le cadre de cette démarche."
    base.obligatoire = true
  }
  if (type === 'section') {
    base.label = 'Nouvelle section'
    base.aide = 'Décrivez ce que couvre cette section.'
  }
  if (type === 'fichier') {
    base.aide = 'Formats acceptés : PDF, JPG, PNG — 10 Mo maximum.'
  }
  if (type === 'conditionnelle') {
    base.label = 'Question conditionnelle'
    base.sousType = 'texte'
  }
  return base
}

/* ------------------------------------------------------------------ */
/* Modèle — formulaire                                                 */
/* ------------------------------------------------------------------ */

export type StatutFormulaire = 'brouillon' | 'publie' | 'ferme' | 'archive'

export const statutFormulaireLabels: Record<StatutFormulaire, string> = {
  brouillon: 'Brouillon',
  publie: 'Publié',
  ferme: 'Fermé',
  archive: 'Archivé',
}

export const categoriesFormulaire = ['Adhésion', 'Inscription', 'Bénévolat', 'Événement', 'Contact'] as const

export type ParametresFormulaire = {
  messageConfirmation: string
  emailNotification: string
  limiteReponses: number | null
  dateLimite: string | null
  unReponseParPersonne: boolean
  creerContact: boolean
  redirectionUrl: string
}

export function parametresParDefaut(): ParametresFormulaire {
  return {
    messageConfirmation: 'Merci, votre réponse a bien été enregistrée.',
    emailNotification: MOI_FORM.email,
    limiteReponses: null,
    dateLimite: null,
    unReponseParPersonne: false,
    creerContact: true,
    redirectionUrl: '',
  }
}

export type ReponseFormulaire = {
  id: string
  soumiseLe: string
  repondant: { nom: string; email: string }
  valeurs: Record<string, string | string[]>
  dureeSecondes: number
}

export type Formulaire = {
  id: string
  titre: string
  description: string
  categorie: string
  statut: StatutFormulaire
  champs: Champ[]
  creePar: string
  creeLe: string
  modifieLe: string
  publieLe: string | null
  fermeLe: string | null
  archiveLe: string | null
  lienPublic: string
  vues: number
  parametres: ParametresFormulaire
  reponses: ReponseFormulaire[]
}

export function formulaireVide(titre: string, description: string, categorie: string): Formulaire {
  const maintenant = new Date().toISOString()
  const slug = titre.trim() ? slugify(titre) : `formulaire-${Math.random().toString(36).slice(2, 7)}`
  return {
    id: uid('frm'),
    titre,
    description,
    categorie,
    statut: 'brouillon',
    champs: [],
    creePar: MOI_FORM.nom,
    creeLe: maintenant,
    modifieLe: maintenant,
    publieLe: null,
    fermeLe: null,
    archiveLe: null,
    lienPublic: `https://formulaires.assoconnex.fr/f/${slug}`,
    vues: 0,
    parametres: parametresParDefaut(),
    reponses: [],
  }
}

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

/* ------------------------------------------------------------------ */
/* Règles et calculs                                                   */
/* ------------------------------------------------------------------ */

export function champsSaisissables(f: Pick<Formulaire, 'champs'>) {
  return f.champs.filter(champSaisissable)
}

export function peutPublier(f: Pick<Formulaire, 'titre' | 'champs'>): { ok: boolean; raison?: string } {
  if (!f.titre.trim()) return { ok: false, raison: 'Donnez un titre au formulaire avant de le publier.' }
  if (champsSaisissables(f).length === 0) {
    return { ok: false, raison: 'Ajoutez au moins un champ de réponse avant de publier.' }
  }
  return { ok: true }
}

export function tauxCompletion(f: Pick<Formulaire, 'vues' | 'reponses'>) {
  if (f.vues === 0) return 0
  return Math.min(100, Math.round((f.reponses.length / f.vues) * 100))
}

export function dureeMoyenne(f: Pick<Formulaire, 'reponses'>) {
  if (f.reponses.length === 0) return 0
  return Math.round(f.reponses.reduce((s, r) => s + r.dureeSecondes, 0) / f.reponses.length)
}

export function derniereReponseLe(f: Pick<Formulaire, 'reponses'>) {
  if (f.reponses.length === 0) return null
  return f.reponses.reduce((max, r) => (r.soumiseLe > max ? r.soumiseLe : max), f.reponses[0].soumiseLe)
}

/** Distribution des réponses pour un champ à options ou une échelle. */
export function repartitionChamp(f: Pick<Formulaire, 'reponses'>, champ: Champ): { label: string; valeur: number }[] {
  if (champEstEchelle(champ)) {
    const paliers = Array.from({ length: champ.echelleMax - champ.echelleMin + 1 }, (_, i) => champ.echelleMin + i)
    return paliers.map((p) => ({
      label: String(p),
      valeur: f.reponses.filter((r) => r.valeurs[champ.id] === String(p)).length,
    }))
  }
  return champ.options.map((o) => ({
    label: o,
    valeur: f.reponses.filter((r) => {
      const v = r.valeurs[champ.id]
      return Array.isArray(v) ? v.includes(o) : v === o
    }).length,
  }))
}

export function formaterValeurReponse(champ: Champ, valeur: string | string[] | undefined): string {
  if (valeur === undefined || valeur === '' || (Array.isArray(valeur) && valeur.length === 0)) return '—'
  if (Array.isArray(valeur)) return valeur.join(', ')
  if (typeEffectif(champ) === 'date') return new Date(valeur).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  if (champ.type === 'consentement') return valeur === 'oui' ? 'Accepté' : 'Refusé'
  if (champ.type === 'signature') return 'Signature apposée'
  return valeur
}

export type KpisFormulaires = {
  total: number
  publies: number
  brouillons: number
  fermes: number
  archives: number
  totalReponses: number
  tauxCompletionMoyen: number
}

export function calculerKpisFormulaires(formulaires: Formulaire[]): KpisFormulaires {
  const actifs = formulaires.filter((f) => f.statut !== 'archive')
  const taux = actifs.filter((f) => f.vues > 0).map((f) => tauxCompletion(f))
  return {
    total: formulaires.length,
    publies: formulaires.filter((f) => f.statut === 'publie').length,
    brouillons: formulaires.filter((f) => f.statut === 'brouillon').length,
    fermes: formulaires.filter((f) => f.statut === 'ferme').length,
    archives: formulaires.filter((f) => f.statut === 'archive').length,
    totalReponses: formulaires.reduce((s, f) => s + f.reponses.length, 0),
    tauxCompletionMoyen: taux.length === 0 ? 0 : Math.round(taux.reduce((s, t) => s + t, 0) / taux.length),
  }
}

/* ------------------------------------------------------------------ */
/* Données mockées                                                     */
/* ------------------------------------------------------------------ */

const prenoms = ['Camille', 'Yanis', 'Awa', 'Thibault', 'Léa', 'Moussa', 'Élodie', 'Hugo', 'Fatou', 'Nathan', 'Inès', 'Rémi', 'Sarah', 'Malik', 'Chloé', 'Antoine', 'Nour', 'Gaëlle', 'Julien', 'Maëva', 'Karim', 'Solène', 'Jeanne', 'Manon', 'Bastien', 'Anaïs', 'Farid', 'Salomé', 'Océane', 'Louise']
const noms = ['Beauchamp', 'Traoré', 'Diallo', 'Lemoine', 'Da Costa', 'Rivière', 'Nguyen', 'Fournier', 'Bertrand', 'Marchand', 'Kouassi', 'Vasseur', 'Perrin', 'Benali', 'Lacroix', 'Hoarau', 'Guérin', 'Sané', 'Chevalier', 'Bamba', 'Rousseau', 'Prigent', 'Morvan', 'Cottereau', 'Ouedraogo', 'Ricard', 'Leclerc', 'Béchard', 'Tanguy', 'Mercier']
const voies = ['rue des Trois-Croissants', 'avenue Jean-Jaurès', 'impasse du Vieux-Moulin', 'boulevard de la Liberté', 'place Sainte-Anne', 'chemin des Ormeaux', 'quai de la Fosse']
const communesForm: [string, string][] = [['44000', 'Nantes'], ['35000', 'Rennes'], ['29200', 'Brest'], ['49100', 'Angers'], ['56000', 'Vannes']]

function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length]
}

function slug(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
}

function jourForm(d: number, h = 10, m = 0) {
  return new Date(AUJOURDHUI_FORM.getTime() + d * 86400000 + h * 3600000 + m * 60000).toISOString()
}

/** Produit une valeur plausible pour un champ, à partir de son type et d'un index. */
function valeurPour(champ: Champ, i: number): string | string[] {
  const t = typeEffectif(champ)
  const libelle = champ.label.toLowerCase()
  if (libelle.includes('prénom')) return pick(prenoms, i)
  if (libelle.includes('nom') && !libelle.includes('prénom')) return pick(noms, i + 3)
  switch (t) {
    case 'email':
      return `${slug(pick(prenoms, i))}.${slug(pick(noms, i + 3))}@exemple.fr`
    case 'telephone': {
      const n = (k: number) => String(10 + ((i * k) % 80)).padStart(2, '0')
      return `06 ${n(3)} ${n(7)} ${n(11)} ${n(13)}`
    }
    case 'date':
      return jourForm(-3650 - ((i * 37) % 3650)).slice(0, 10)
    case 'adresse': {
      const [cp, ville] = pick(communesForm, i)
      return `${1 + ((i * 7) % 90)} ${pick(voies, i)}, ${cp} ${ville}`
    }
    case 'choix_unique':
    case 'liste':
      return pick(champ.options, i)
    case 'choix_multiple': {
      const n = 1 + (i % Math.max(champ.options.length, 1))
      return champ.options.filter((_, k) => (i + k) % 2 === 0).slice(0, n)
    }
    case 'echelle':
      return String(champ.echelleMin + (i % (champ.echelleMax - champ.echelleMin + 1)))
    case 'fichier':
      return `document-${pick(noms, i).toLowerCase()}.pdf`
    case 'signature':
      return 'signee'
    case 'consentement':
      return i % 6 === 0 ? 'non' : 'oui'
    case 'texte_long':
      return pick(
        [
          'Disponible principalement le week-end.',
          'Peut apporter du matériel supplémentaire si besoin.',
          'Première participation à ce type d’événement.',
          'Aucune remarque particulière.',
          'Merci de m’envoyer un rappel la veille.',
        ],
        i,
      )
    default:
      return pick(['Réponse libre', 'Rien à signaler', 'Voir avec le bureau', 'À confirmer'], i)
  }
}

function genererReponses(formulaire: Pick<Formulaire, 'id' | 'champs'>, n: number): ReponseFormulaire[] {
  const out: ReponseFormulaire[] = []
  for (let i = 0; i < n; i++) {
    const valeurs: Record<string, string | string[]> = {}
    for (const champ of champsSaisissables(formulaire)) {
      if (!champVisible(champ, valeurs)) continue
      valeurs[champ.id] = valeurPour(champ, i)
    }
    const prenom = pick(prenoms, i)
    const nom = pick(noms, i + 3)
    out.push({
      id: uid('rep'),
      soumiseLe: jourForm(-Math.floor((i * 31) % 45) - 1, 8 + (i % 10), (i * 17) % 60),
      repondant: { nom: `${prenom} ${nom}`, email: `${slug(prenom)}.${slug(nom)}@exemple.fr` },
      valeurs,
      dureeSecondes: 45 + ((i * 53) % 240),
    })
  }
  return out.sort((a, b) => (a.soumiseLe < b.soumiseLe ? 1 : -1))
}

function creerChamp(type: TypeChamp, overrides: Partial<Champ> = {}): Champ {
  return { ...champVide(type), ...overrides }
}

function construireFormulaire(base: Omit<Formulaire, 'reponses'>, nbReponses: number): Formulaire {
  const reponses = genererReponses(base, nbReponses)
  return { ...base, reponses }
}

const chAdhFormule = creerChamp('choix_unique', { label: 'Formule d’adhésion', options: ['Individuelle — 35 €', 'Famille — 60 €', 'Étudiant — 20 €'] })

const formAdhesion = construireFormulaire(
  {
    id: 'frm-adhesion-2026',
    titre: 'Adhésion en ligne 2026',
    description: "Formulaire d'adhésion pour la saison 2026-2027, avec choix de la formule et signature électronique.",
    categorie: 'Adhésion',
    statut: 'publie',
    champs: [
      creerChamp('texte', { label: 'Prénom' }),
      creerChamp('texte', { label: 'Nom' }),
      creerChamp('email', { label: 'Adresse e-mail' }),
      creerChamp('telephone', { label: 'Téléphone' }),
      creerChamp('adresse', { label: 'Adresse postale' }),
      creerChamp('date', { label: 'Date de naissance' }),
      chAdhFormule,
      creerChamp('consentement', { label: 'Droit à l’image', obligatoire: false, consentementTexte: "J'autorise l'association à utiliser mon image dans ses supports de communication." }),
      creerChamp('consentement', { label: 'Règlement intérieur', consentementTexte: "J'accepte le règlement intérieur de l'association." }),
      creerChamp('signature', { label: 'Signature du membre' }),
    ],
    creePar: MOI_FORM.nom,
    creeLe: jourForm(-40),
    modifieLe: jourForm(-12),
    publieLe: jourForm(-38),
    fermeLe: null,
    archiveLe: null,
    lienPublic: 'https://formulaires.assoconnex.fr/f/adhesion-2026',
    vues: 340,
    parametres: { ...parametresParDefaut(), creerContact: true, unReponseParPersonne: true },
  },
  18,
)

const formAtelierPeinture = construireFormulaire(
  {
    id: 'frm-atelier-peinture',
    titre: 'Inscription — Atelier peinture',
    description: 'Inscription aux séances hebdomadaires de l’atelier peinture, tous niveaux.',
    categorie: 'Inscription',
    statut: 'publie',
    champs: [
      creerChamp('texte', { label: 'Prénom' }),
      creerChamp('texte', { label: 'Nom' }),
      creerChamp('email', { label: 'Adresse e-mail' }),
      creerChamp('choix_multiple', { label: 'Créneaux souhaités', options: ['Lundi 18h', 'Mercredi 14h', 'Samedi 10h'] }),
      creerChamp('echelle', { label: 'Niveau en peinture', echelleMin: 1, echelleMax: 5, echelleLabelMin: 'Débutant', echelleLabelMax: 'Confirmé' }),
      creerChamp('texte_long', { label: 'Motivation', obligatoire: false }),
      creerChamp('consentement', { label: 'Droit à l’image', consentementTexte: "J'autorise la prise de photos pendant l'atelier." }),
    ],
    creePar: MOI_FORM.nom,
    creeLe: jourForm(-20),
    modifieLe: jourForm(-18),
    publieLe: jourForm(-19),
    fermeLe: null,
    archiveLe: null,
    lienPublic: 'https://formulaires.assoconnex.fr/f/atelier-peinture',
    vues: 64,
    parametres: parametresParDefaut(),
  },
  6,
)

const chDisponible = creerChamp('choix_unique', { label: 'Disponible le jour de la fête ?', options: ['Oui', 'Non'] })

const formBenevoles = construireFormulaire(
  {
    id: 'frm-benevoles-fete',
    titre: 'Appel à bénévoles — Fête annuelle',
    description: 'Recensement des bénévoles disponibles pour la fête annuelle du 4 octobre.',
    categorie: 'Bénévolat',
    statut: 'publie',
    champs: [
      creerChamp('texte', { label: 'Prénom' }),
      creerChamp('texte', { label: 'Nom' }),
      creerChamp('email', { label: 'Adresse e-mail' }),
      creerChamp('telephone', { label: 'Téléphone' }),
      chDisponible,
      creerChamp('conditionnelle', {
        label: 'Sur quel créneau ?',
        sousType: 'liste',
        options: ['Matin (8h – 12h)', 'Après-midi (12h – 18h)', 'Soirée (18h – 23h)'],
        condition: { champId: chDisponible.id, valeur: 'Oui' },
      }),
      creerChamp('texte_long', { label: 'Compétences ou matériel que vous pouvez apporter', obligatoire: false }),
    ],
    creePar: MOI_FORM.nom,
    creeLe: jourForm(-6),
    modifieLe: jourForm(-5),
    publieLe: jourForm(-5),
    fermeLe: null,
    archiveLe: null,
    lienPublic: 'https://formulaires.assoconnex.fr/f/benevoles-fete-annuelle',
    vues: 22,
    parametres: parametresParDefaut(),
  },
  0,
)

const formStageEte = construireFormulaire(
  {
    id: 'frm-stage-ete',
    titre: 'Inscription — Stage d’été jeunesse',
    description: 'Inscriptions closes : le nombre de places disponibles a été atteint.',
    categorie: 'Inscription',
    statut: 'ferme',
    champs: [
      creerChamp('texte', { label: 'Prénom de l’enfant' }),
      creerChamp('texte', { label: 'Nom de l’enfant' }),
      creerChamp('date', { label: 'Date de naissance de l’enfant' }),
      creerChamp('texte', { label: 'Prénom du parent' }),
      creerChamp('email', { label: 'E-mail du parent' }),
      creerChamp('telephone', { label: 'Téléphone du parent' }),
      creerChamp('choix_multiple', { label: 'Semaines choisies', options: ['Semaine 1 (7–11 juillet)', 'Semaine 2 (14–18 juillet)', 'Semaine 3 (21–25 juillet)'] }),
      creerChamp('fichier', { label: 'Certificat médical' }),
      creerChamp('consentement', { label: 'Autorisation parentale', consentementTexte: "J'autorise mon enfant à participer au stage." }),
    ],
    creePar: MOI_FORM.nom,
    creeLe: jourForm(-70),
    modifieLe: jourForm(-69),
    publieLe: jourForm(-69),
    fermeLe: jourForm(-15),
    archiveLe: null,
    lienPublic: 'https://formulaires.assoconnex.fr/f/stage-ete-jeunesse',
    vues: 51,
    parametres: { ...parametresParDefaut(), limiteReponses: 24 },
  },
  24,
)

const formSortieScolaire = construireFormulaire(
  {
    id: 'frm-sortie-musee',
    titre: 'Autorisation sortie — Musée des Beaux-Arts',
    description: 'Brouillon en cours de préparation : encore à compléter avant publication.',
    categorie: 'Événement',
    statut: 'brouillon',
    champs: [
      creerChamp('texte', { label: 'Prénom de l’enfant' }),
      creerChamp('texte', { label: 'Nom de l’enfant' }),
      creerChamp('consentement', { label: 'Autorisation de sortie', consentementTexte: "J'autorise mon enfant à participer à la sortie du 14 mars." }),
    ],
    creePar: MOI_FORM.nom,
    creeLe: jourForm(-2),
    modifieLe: jourForm(-1),
    publieLe: null,
    fermeLe: null,
    archiveLe: null,
    lienPublic: 'https://formulaires.assoconnex.fr/f/sortie-musee-beaux-arts',
    vues: 0,
    parametres: parametresParDefaut(),
  },
  0,
)

const formVierge = construireFormulaire(
  {
    id: 'frm-sans-titre',
    titre: 'Sans titre',
    description: '',
    categorie: '',
    statut: 'brouillon',
    champs: [],
    creePar: MOI_FORM.nom,
    creeLe: jourForm(0, 9, 10),
    modifieLe: jourForm(0, 9, 10),
    publieLe: null,
    fermeLe: null,
    archiveLe: null,
    lienPublic: 'https://formulaires.assoconnex.fr/f/sans-titre',
    vues: 0,
    parametres: parametresParDefaut(),
  },
  0,
)

const formEnquete = construireFormulaire(
  {
    id: 'frm-enquete-2025',
    titre: 'Enquête de satisfaction 2025',
    description: 'Bilan de fin de saison, clos et archivé.',
    categorie: 'Contact',
    statut: 'archive',
    champs: [
      creerChamp('echelle', { label: 'Satisfaction générale', echelleMin: 1, echelleMax: 5, echelleLabelMin: 'Pas du tout satisfait', echelleLabelMax: 'Tout à fait satisfait' }),
      creerChamp('choix_unique', { label: 'Recommanderiez-vous l’association ?', options: ['Oui', 'Non', 'Peut-être'] }),
      creerChamp('texte_long', { label: 'Suggestions d’amélioration', obligatoire: false }),
    ],
    creePar: MOI_FORM.nom,
    creeLe: jourForm(-330),
    modifieLe: jourForm(-329),
    publieLe: jourForm(-329),
    fermeLe: jourForm(-260),
    archiveLe: jourForm(-250),
    lienPublic: 'https://formulaires.assoconnex.fr/f/enquete-satisfaction-2025',
    vues: 120,
    parametres: parametresParDefaut(),
  },
  40,
)

export const formulairesInitiaux: Formulaire[] = [
  formVierge,
  formSortieScolaire,
  formBenevoles,
  formAtelierPeinture,
  formStageEte,
  formAdhesion,
  formEnquete,
].sort((a, b) => (a.modifieLe < b.modifieLe ? 1 : -1))
