/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type Compte = {
  email: string
  motDePasse: string
  nom: string
  role: string
  organisation: string
}

/**
 * Comptes de démonstration. Ils sont volontairement lisibles : ce parcours
 * démontre une expérience, il ne protège pas l'accès.
 */
export const comptesDemo: Compte[] = [
  {
    email: 'camille.beauchamp@vieuxmoulin.fr',
    motDePasse: 'AssoConnex2026!',
    nom: 'Camille Beauchamp',
    role: 'Présidente',
    organisation: 'Les Amis du Vieux Moulin',
  },
  {
    email: 'yanis.traore@vieuxmoulin.fr',
    motDePasse: 'AssoConnex2026!',
    nom: 'Yanis Traoré',
    role: 'Trésorier',
    organisation: 'Les Amis du Vieux Moulin',
  },
]

/** Code attendu à l'étape de vérification, rappelé à l'écran. */
export const CODE_DEMO = '481902'

export const MAX_TENTATIVES = 5
export const MAX_TENTATIVES_CODE = 3
export const VERROUILLAGE_MINUTES = 15
export const PEREMPTION_CODE_MINUTES = 10
export const DELAI_RENVOI_SECONDES = 45

/* ------------------------------------------------------------------ */
/* Robustesse du mot de passe                                          */
/* ------------------------------------------------------------------ */

export type RegleMotDePasse = { cle: string; libelle: string; satisfaite: (v: string) => boolean }

export const reglesMotDePasse: RegleMotDePasse[] = [
  { cle: 'longueur', libelle: 'Au moins 10 caractères', satisfaite: (v) => v.length >= 10 },
  { cle: 'majuscule', libelle: 'Une majuscule', satisfaite: (v) => /[A-ZÀ-Ý]/.test(v) },
  { cle: 'minuscule', libelle: 'Une minuscule', satisfaite: (v) => /[a-zà-ÿ]/.test(v) },
  { cle: 'chiffre', libelle: 'Un chiffre', satisfaite: (v) => /\d/.test(v) },
  { cle: 'special', libelle: 'Un caractère spécial', satisfaite: (v) => /[^\wÀ-ÿ]/.test(v) },
]

export function robustesse(valeur: string) {
  const satisfaites = reglesMotDePasse.filter((r) => r.satisfaite(valeur)).length
  const pourcentage = Math.round((satisfaites / reglesMotDePasse.length) * 100)
  const niveau = satisfaites <= 2 ? 'faible' : satisfaites <= 4 ? 'correct' : 'solide'
  return { satisfaites, total: reglesMotDePasse.length, pourcentage, niveau } as const
}

export const niveauLabels = {
  faible: { libelle: 'Trop faible', couleur: '#B42318' },
  correct: { libelle: 'Correct', couleur: '#9A5B00' },
  solide: { libelle: 'Solide', couleur: '#127A4C' },
} as const

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

export function emailValide(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
}

/** Masque l'adresse pour l'écran de vérification : c****e@exemple.fr */
export function masquerEmail(email: string) {
  const [local, domaine] = email.split('@')
  if (!domaine || local.length < 3) return email
  return `${local[0]}${'*'.repeat(Math.max(local.length - 2, 1))}${local[local.length - 1]}@${domaine}`
}

export function formatCompteARebours(secondes: number) {
  const m = Math.floor(secondes / 60)
  const s = secondes % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
