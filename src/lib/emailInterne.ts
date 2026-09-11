export const MAINTENANT_EMAIL = new Date('2026-09-08T15:00:00Z')

/* ------------------------------------------------------------------ */
/* Modèle                                                              */
/* ------------------------------------------------------------------ */

export type Dossier = 'reception' | 'brouillons' | 'envoyes' | 'archives' | 'corbeille'

export const dossierLabels: Record<Dossier, string> = {
  reception: 'Boîte de réception',
  brouillons: 'Brouillons',
  envoyes: 'Envoyés',
  archives: 'Archivés',
  corbeille: 'Corbeille',
}

export type Correspondant = { id: string; nom: string; email: string; role: string }

export const correspondants: Correspondant[] = [
  { id: 'co-camille', nom: 'Camille Beauchamp', email: 'camille.beauchamp@vieuxmoulin.fr', role: 'Présidente' },
  { id: 'co-yanis', nom: 'Yanis Traoré', email: 'yanis.traore@vieuxmoulin.fr', role: 'Trésorier' },
  { id: 'co-awa', nom: 'Awa Diallo', email: 'awa.diallo@vieuxmoulin.fr', role: 'Responsable de section' },
  { id: 'co-elodie', nom: 'Élodie Nguyen', email: 'elodie.nguyen@vieuxmoulin.fr', role: 'Chargée de communication' },
  { id: 'co-malik', nom: 'Malik Benali', email: 'malik.benali@vieuxmoulin.fr', role: 'Animateur' },
  { id: 'co-hugo', nom: 'Hugo Fournier', email: 'hugo.fournier@vieuxmoulin.fr', role: 'Bénévole' },
  { id: 'co-sofia', nom: 'Sofia Marchetti', email: 'sofia.marchetti@vieuxmoulin.fr', role: 'Bénévole' },
  { id: 'co-bureau', nom: 'Le bureau', email: 'bureau@vieuxmoulin.fr', role: 'Liste de diffusion' },
]

export const MOI_EMAIL = 'co-camille'

/** Taille maximale acceptée pour une pièce jointe, en octets. */
export const TAILLE_MAX_PJ = 10 * 1024 * 1024

export type PieceJointeMail = { id: string; nom: string; taille: number }

export type TypeRattachement = 'adherent' | 'facture' | 'document'

export const rattachementLabels: Record<TypeRattachement, string> = {
  adherent: 'Adhérent',
  facture: 'Facture',
  document: 'Document',
}

export type Rattachement = { type: TypeRattachement; libelle: string; cible: string }

export type StatutEnvoiMail = 'envoye' | 'en_cours' | 'echec'

export type Message = {
  id: string
  /** Identifiant du fil : les messages d'un même échange le partagent. */
  filId: string
  expediteurId: string
  destinatairesIds: string[]
  copieIds: string[]
  copieCacheeIds: string[]
  objet: string
  /** Corps au format Markdown léger, produit par l'éditeur enrichi. */
  corps: string
  quand: string
  lu: boolean
  important: boolean
  /** Accusé demandé par l'expéditeur, et sa réception. */
  accuseDemande: boolean
  accuseRecuLe: string | null
  piecesJointes: PieceJointeMail[]
  rattachement: Rattachement | null
  dossier: Dossier
  statutEnvoi: StatutEnvoiMail
}

export type ModeleMessage = {
  id: string
  nom: string
  objet: string
  corps: string
  categorie: string
}

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */

export function correspondant(id: string) {
  return correspondants.find((c) => c.id === id)
}

export function formatTaillePJ(octets: number) {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}

export function horodatageMail(iso: string) {
  const d = new Date(iso)
  const minutes = Math.floor((MAINTENANT_EMAIL.getTime() - d.getTime()) / 60000)
  if (minutes < 1) return "à l'instant"
  if (minutes < 60) return `il y a ${minutes} min`
  if (minutes < 1440) return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
  const jours = Math.floor(minutes / 1440)
  if (jours === 1) return 'hier'
  if (jours < 7) return `il y a ${jours} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

/** Tous les destinataires d'un message, copies comprises. */
export function tousDestinataires(m: Message) {
  return [...m.destinatairesIds, ...m.copieIds, ...m.copieCacheeIds]
}

/* ------------------------------------------------------------------ */
/* Fils de discussion                                                  */
/* ------------------------------------------------------------------ */

export type Fil = {
  id: string
  objet: string
  messages: Message[]
  dernier: Message
  nonLus: number
  important: boolean
  avecPieces: boolean
  /** Les personnes ayant participé au fil, dans l'ordre d'apparition. */
  participantsIds: string[]
}

export function filsDuDossier(dossier: Dossier, messages: Message[]): Fil[] {
  const duDossier = messages.filter((m) => m.dossier === dossier)
  const parFil = new Map<string, Message[]>()
  for (const m of duDossier) {
    const liste = parFil.get(m.filId) ?? []
    liste.push(m)
    parFil.set(m.filId, liste)
  }

  return Array.from(parFil.entries())
    .map(([id, liste]) => {
      const tries = [...liste].sort((a, b) => (a.quand < b.quand ? -1 : 1))
      const dernier = tries[tries.length - 1]
      const participantsIds: string[] = []
      for (const m of tries) {
        for (const p of [m.expediteurId, ...m.destinatairesIds]) {
          if (!participantsIds.includes(p)) participantsIds.push(p)
        }
      }
      return {
        id,
        objet: dernier.objet,
        messages: tries,
        dernier,
        nonLus: tries.filter((m) => !m.lu && m.expediteurId !== MOI_EMAIL).length,
        important: tries.some((m) => m.important),
        avecPieces: tries.some((m) => m.piecesJointes.length > 0),
        participantsIds,
      }
    })
    .sort((a, b) => (a.dernier.quand < b.dernier.quand ? 1 : -1))
}

export function compterNonLus(dossier: Dossier, messages: Message[]) {
  return messages.filter((m) => m.dossier === dossier && !m.lu && m.expediteurId !== MOI_EMAIL).length
}

/* ------------------------------------------------------------------ */
/* Modèles de message                                                  */
/* ------------------------------------------------------------------ */

export const modelesInitiaux: ModeleMessage[] = [
  {
    id: 'mo-relance',
    nom: 'Relance de cotisation',
    categorie: 'Adhésions',
    objet: 'Votre cotisation pour la saison en cours',
    corps:
      'Bonjour,\n\nSauf erreur de notre part, votre cotisation pour la saison en cours ne nous est pas encore parvenue.\n\nVous pouvez la régler par virement, par chèque à l’ordre de l’association, ou directement lors d’une permanence.\n\nBien cordialement,',
  },
  {
    id: 'mo-convocation',
    nom: 'Convocation à une réunion',
    categorie: 'Vie associative',
    objet: 'Convocation — réunion du bureau',
    corps:
      'Bonjour,\n\nVous êtes convié à la prochaine réunion du bureau.\n\n**Ordre du jour**\n\n- Point financier\n- Préparation des prochaines actions\n- Questions diverses\n\nMerci de confirmer votre présence.',
  },
  {
    id: 'mo-remerciement',
    nom: 'Remerciement aux bénévoles',
    categorie: 'Bénévolat',
    objet: 'Merci pour votre engagement',
    corps:
      'Bonjour,\n\nUn grand merci pour le temps que vous avez consacré à cette action. Sans vous, rien n’aurait été possible.\n\nÀ très bientôt,',
  },
  {
    id: 'mo-recu',
    nom: 'Envoi de reçu fiscal',
    categorie: 'Comptabilité',
    objet: 'Votre reçu fiscal',
    corps:
      'Bonjour,\n\nVeuillez trouver ci-joint votre reçu fiscal au titre de votre don.\n\nCe document vous permet de bénéficier d’une réduction d’impôt selon la réglementation en vigueur.\n\nBien cordialement,',
  },
]

/* ------------------------------------------------------------------ */
/* Données mockées                                                     */
/* ------------------------------------------------------------------ */

function instant(minutesAvant: number) {
  return new Date(MAINTENANT_EMAIL.getTime() - minutesAvant * 60000).toISOString()
}

type ModeleMail = {
  filId: string
  de: string
  a: string[]
  copie?: string[]
  copieCachee?: string[]
  objet: string
  corps: string
  minutes: number
  lu?: boolean
  important?: boolean
  accuse?: boolean
  accuseRecu?: boolean
  pieces?: { nom: string; taille: number }[]
  rattachement?: Rattachement
  dossier?: Dossier
}

const modeles: ModeleMail[] = [
  // Fil — budget prévisionnel
  {
    filId: 'fl-budget', de: 'co-yanis', a: ['co-camille'], copie: ['co-awa'],
    objet: 'Budget prévisionnel 2026-2027 — pour relecture',
    corps: 'Bonjour Camille,\n\nJe te transmets le budget prévisionnel consolidé. Les recettes de billetterie sont volontairement prudentes : j’ai retenu 80 % de la fréquentation de l’an dernier.\n\n**Points à arbitrer**\n\n- La ligne mécénat, que je n’ai pas inscrite faute d’engagement écrit\n- Le montant de la régie technique, en hausse de 18 %\n\nJe reste disponible pour en discuter.\n\nYanis',
    minutes: 60 * 26, lu: true, accuse: true, accuseRecu: true,
    pieces: [{ nom: 'Budget prévisionnel 2026-2027.xlsx', taille: 348_000 }],
    rattachement: { type: 'document', libelle: 'Budget prévisionnel 2026-2027.xlsx', cible: '/documents' },
  },
  {
    filId: 'fl-budget', de: 'co-camille', a: ['co-yanis'], copie: ['co-awa'],
    objet: 'Re : Budget prévisionnel 2026-2027 — pour relecture',
    corps: 'Bonjour Yanis,\n\nMerci, c’est très clair. Je suis d’accord sur la prudence côté billetterie.\n\nPour le mécénat, Awa a un contact à la Fondation Loire : attendons sa réponse avant d’inscrire quoi que ce soit.\n\nCamille',
    minutes: 60 * 25, lu: true, dossier: 'envoyes',
  },
  {
    filId: 'fl-budget', de: 'co-awa', a: ['co-camille', 'co-yanis'],
    objet: 'Re : Budget prévisionnel 2026-2027 — pour relecture',
    corps: 'Bonjour à tous les deux,\n\nJ’ai rendez-vous avec la fondation mardi prochain. Je vous fais un retour dans la foulée.\n\nAwa',
    minutes: 60 * 4,
  },

  // Fil — convention
  {
    filId: 'fl-convention', de: 'co-camille', a: ['co-yanis'],
    objet: 'Convention avec la ville — signature',
    corps: 'Yanis,\n\nLa convention pluriannuelle est prête à signer. Peux-tu la relire avant que je l’envoie en signature électronique ?\n\nCamille',
    minutes: 60 * 50, lu: true, dossier: 'envoyes',
    rattachement: { type: 'document', libelle: 'Convention pluriannuelle d’objectifs.pdf', cible: '/documents' },
  },
  {
    filId: 'fl-convention', de: 'co-yanis', a: ['co-camille'],
    objet: 'Re : Convention avec la ville — signature',
    corps: 'C’est relu, rien à signaler. Tu peux envoyer.\n\nYanis',
    minutes: 60 * 48, lu: true,
  },

  // Fil — relance de cotisation
  {
    filId: 'fl-cotisation', de: 'co-camille', a: ['co-hugo'],
    objet: 'Votre cotisation pour la saison en cours',
    corps: 'Bonjour Hugo,\n\nSauf erreur de notre part, votre cotisation pour la saison en cours ne nous est pas encore parvenue.\n\nVous pouvez la régler par virement ou lors d’une permanence.\n\nBien cordialement,\nCamille',
    minutes: 60 * 72, lu: true, dossier: 'envoyes', accuse: true,
    rattachement: { type: 'adherent', libelle: 'Hugo Fournier — adhésion 2026', cible: '/adherents' },
  },
  {
    filId: 'fl-cotisation', de: 'co-hugo', a: ['co-camille'],
    objet: 'Re : Votre cotisation pour la saison en cours',
    corps: 'Bonjour Camille,\n\nToutes mes excuses, j’avais complètement oublié. Le virement part aujourd’hui.\n\nHugo',
    minutes: 60 * 70, lu: true,
  },

  // Messages isolés en réception
  {
    filId: 'fl-materiel', de: 'co-malik', a: ['co-camille'], copie: ['co-hugo'],
    objet: 'Commande de matériel pour les ateliers',
    corps: 'Bonjour,\n\nLe devis pour la peinture et les fournitures est arrivé : 412 € TTC, soit 32 € au-dessus de l’enveloppe.\n\nJe peux réduire en prenant une marque moins chère, mais la qualité s’en ressentira sur les grands formats. Que faites-vous ?\n\nMalik',
    minutes: 95, important: true,
    pieces: [{ nom: 'Devis-Coop-Materiel.pdf', taille: 186_000 }],
  },
  {
    filId: 'fl-facture', de: 'co-yanis', a: ['co-camille'],
    objet: 'Facture F-2026-0041 — relance client',
    corps: 'Camille,\n\nLa facture de la Coopérative Grand Ouest arrive à échéance vendredi. Je propose une relance courtoise lundi si rien n’est arrivé d’ici là.\n\nYanis',
    minutes: 180,
    rattachement: { type: 'facture', libelle: 'F-2026-0041 — Coopérative Grand Ouest', cible: '/facturation' },
  },
  {
    filId: 'fl-photos', de: 'co-elodie', a: ['co-camille', 'co-awa'],
    objet: 'Photos du dernier atelier — droits à l’image',
    corps: 'Bonjour,\n\nJ’ai trié les photos de l’atelier de mercredi. Deux enfants n’ont pas d’autorisation de droit à l’image : je les ai écartées de la sélection publiable.\n\nDites-moi si vous voulez que je prépare un article pour la lettre d’information.\n\nÉlodie',
    minutes: 60 * 8,
    pieces: [{ nom: 'Selection-ateliers-septembre.zip', taille: 6_400_000 }],
  },
  {
    filId: 'fl-permanence', de: 'co-sofia', a: ['co-camille'],
    objet: 'Permanence de samedi — empêchement',
    corps: 'Bonjour Camille,\n\nJe ne pourrai finalement pas tenir la permanence de samedi matin, un imprévu familial.\n\nJ’ai posé une demande de remplacement dans le planning, mais je préférais te prévenir directement.\n\nDésolée,\nSofia',
    minutes: 60 * 20,
  },
  {
    filId: 'fl-bureau', de: 'co-bureau', a: ['co-camille', 'co-yanis', 'co-awa', 'co-elodie'],
    objet: 'Convocation — conseil d’administration du 16 septembre',
    corps: 'Bonjour à toutes et tous,\n\nVous êtes convié au conseil d’administration.\n\n**Ordre du jour**\n\n- Approbation du budget rectificatif\n- Point sur le festival\n- Renouvellement de la convention d’occupation\n- Questions diverses\n\nMerci de confirmer votre présence par retour de message.',
    minutes: 60 * 12, important: true, accuse: true,
    pieces: [{ nom: 'Ordre-du-jour-CA-16-09.pdf', taille: 94_000 }],
  },
  {
    filId: 'fl-assurance', de: 'co-yanis', a: ['co-camille'],
    objet: 'Attestation d’assurance reçue',
    corps: 'L’attestation pour la saison est arrivée. Je l’ai déposée dans l’espace documentaire, dossier Assurances.\n\nYanis',
    minutes: 60 * 30, lu: true, dossier: 'archives',
  },
  {
    filId: 'fl-forum', de: 'co-elodie', a: ['co-camille'],
    objet: 'Forum des associations — stand partagé',
    corps: 'Bonjour,\n\nLe stand commun avec le CA Bellevue et Solidarité Ouest est confirmé. J’ai lancé un salon de discussion avec eux pour la coordination.\n\nÉlodie',
    minutes: 60 * 40, lu: true, dossier: 'archives',
  },

  // Brouillons
  {
    filId: 'fl-brouillon-1', de: 'co-camille', a: ['co-malik'],
    objet: 'Réponse — commande de matériel',
    corps: 'Malik,\n\nPour le dépassement de 32 €, je pense qu’on peut',
    minutes: 30, dossier: 'brouillons', lu: true,
  },
  {
    filId: 'fl-brouillon-2', de: 'co-camille', a: [],
    objet: '',
    corps: 'Note pour le rapport d’activité :',
    minutes: 60 * 6, dossier: 'brouillons', lu: true,
  },

  // Corbeille
  {
    filId: 'fl-corbeille-1', de: 'co-hugo', a: ['co-camille'],
    objet: 'Test d’envoi',
    corps: 'Message de test, à ignorer.',
    minutes: 60 * 90, lu: true, dossier: 'corbeille',
  },
  {
    filId: 'fl-corbeille-2', de: 'co-elodie', a: ['co-camille'],
    objet: 'Ancienne version du programme',
    corps: 'Remplacée par la version définitive envoyée depuis.',
    minutes: 60 * 120, lu: true, dossier: 'corbeille',
  },
]

export const messagesInitiaux: Message[] = modeles.map((m, i) => ({
  id: `me-${100 + i}`,
  filId: m.filId,
  expediteurId: m.de,
  destinatairesIds: m.a,
  copieIds: m.copie ?? [],
  copieCacheeIds: m.copieCachee ?? [],
  objet: m.objet,
  corps: m.corps,
  quand: instant(m.minutes),
  lu: m.lu ?? false,
  important: !!m.important,
  accuseDemande: !!m.accuse,
  accuseRecuLe: m.accuseRecu ? instant(m.minutes - 40) : null,
  piecesJointes: (m.pieces ?? []).map((p, k) => ({ id: `pjm-${i}-${k}`, ...p })),
  rattachement: m.rattachement ?? null,
  dossier: m.dossier ?? 'reception',
  statutEnvoi: 'envoye',
}))

/* ------------------------------------------------------------------ */
/* Variante de démonstration                                           */
/* ------------------------------------------------------------------ */

/** Un message resté en échec d'envoi, que l'on peut réessayer. */
export function messagesAvecEchec(): Message[] {
  return [
    ...messagesInitiaux,
    {
      id: 'me-echec',
      filId: 'fl-echec',
      expediteurId: MOI_EMAIL,
      destinatairesIds: ['co-awa'],
      copieIds: [],
      copieCacheeIds: [],
      objet: 'Point sur la programmation du festival',
      corps: 'Awa,\n\nPeux-tu me confirmer les deux dernières compagnies avant le conseil ?\n\nCamille',
      quand: instant(3),
      lu: true,
      important: false,
      accuseDemande: false,
      accuseRecuLe: null,
      piecesJointes: [],
      rattachement: null,
      dossier: 'envoyes',
      statutEnvoi: 'echec',
    },
  ]
}

/* ------------------------------------------------------------------ */
/* Indicateurs                                                         */
/* ------------------------------------------------------------------ */

export type KpisEmail = {
  reception: number
  nonLus: number
  brouillons: number
  envoyes: number
  importants: number
  accusesEnAttente: number
}

export function calculerKpisEmail(messages: Message[]): KpisEmail {
  return {
    reception: messages.filter((m) => m.dossier === 'reception').length,
    nonLus: compterNonLus('reception', messages),
    brouillons: messages.filter((m) => m.dossier === 'brouillons').length,
    envoyes: messages.filter((m) => m.dossier === 'envoyes').length,
    importants: messages.filter((m) => m.important && m.dossier === 'reception').length,
    accusesEnAttente: messages.filter((m) => m.expediteurId === MOI_EMAIL && m.accuseDemande && !m.accuseRecuLe).length,
  }
}
