import { AlertTriangle, Archive, CheckCircle2, Clock, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StatusTone } from '@/lib/mock'

/**
 * Système de statuts AssoConnex°.
 * Règle : un statut est TOUJOURS porté par trois signaux — texte, couleur et icône.
 * La couleur seule ne véhicule jamais d'information.
 */
export const toneStyles: Record<StatusTone, { solid: string; soft: string; text: string; icon: LucideIcon; nom: string }> = {
  success: {
    solid: 'bg-success-500',
    soft: 'bg-success-50 text-success-700 border-success-100',
    text: 'text-success-600',
    icon: CheckCircle2,
    nom: 'Vert — abouti',
  },
  warning: {
    solid: 'bg-warning-500',
    soft: 'bg-warning-50 text-warning-700 border-warning-100',
    text: 'text-warning-600',
    icon: Clock,
    nom: 'Orange — en cours',
  },
  danger: {
    solid: 'bg-danger-500',
    soft: 'bg-danger-50 text-danger-700 border-danger-100',
    text: 'text-danger-600',
    icon: AlertTriangle,
    nom: 'Rouge — bloquant',
  },
  neutral: {
    solid: 'bg-ink-400',
    soft: 'bg-ink-100 text-ink-700 border-ink-200',
    text: 'text-ink-600',
    icon: Archive,
    nom: 'Gris — hors flux',
  },
}

export type StatusKey =
  | 'actif' | 'valide' | 'paye'
  | 'en_attente' | 'echeance_proche'
  | 'refuse' | 'retard'
  | 'archive' | 'brouillon'
  // Cycle de vie des adhésions
  | 'adhesion_active' | 'adhesion_expirant' | 'adhesion_expiree' | 'adhesion_resiliee'
  // Cotisations
  | 'cotisation_payee' | 'cotisation_partielle' | 'cotisation_attente' | 'cotisation_impayee' | 'cotisation_annulee'
  // Paiements
  | 'paiement_encaisse' | 'paiement_attente' | 'paiement_refuse'
  // Comptabilité
  | 'ecriture_brouillon' | 'ecriture_validee' | 'ecriture_desequilibree'
  | 'exercice_ouvert' | 'exercice_cloture'
  | 'piece_rattachee' | 'piece_orpheline'
  | 'rapproche' | 'non_rapproche'
  // Facturation
  | 'facture_brouillon' | 'facture_envoyee' | 'facture_payee' | 'facture_retard' | 'facture_annulee'
  // Trésorerie
  | 'virement_planifie' | 'virement_execute' | 'virement_annule'
  | 'prevision_confirmee' | 'prevision_probable' | 'non_categorise'
  // Notes de frais
  | 'ndf_brouillon' | 'ndf_soumise' | 'ndf_responsable' | 'ndf_validee' | 'ndf_rejetee' | 'ndf_remboursee'
  | 'justificatif_manquant' | 'justificatif_fourni'
  // Documents
  | 'doc_partage' | 'doc_prive' | 'doc_corbeille' | 'apercu_indisponible'
  | 'upload_en_cours' | 'upload_termine' | 'upload_echec' | 'version_courante'
  // Signature électronique
  | 'sig_brouillon' | 'sig_attente' | 'sig_terminee' | 'sig_refusee' | 'sig_expiree' | 'sig_annulee'
  | 'signataire_attente' | 'signataire_signe' | 'signataire_refuse'
  // Projets
  | 'projet_preparation' | 'projet_en_cours' | 'projet_suspendu' | 'projet_cloture'
  | 'jalon_a_venir' | 'jalon_atteint' | 'jalon_manque'
  | 'risque_ouvert' | 'risque_maitrise' | 'risque_clos'
  | 'budget_tenu' | 'budget_depasse'
  // Agenda
  | 'evt_confirme' | 'evt_provisoire' | 'evt_annule' | 'conflit_horaire'
  | 'reponse_attente' | 'reponse_accepte' | 'reponse_refuse' | 'reponse_peut_etre'
  | 'sync_connecte' | 'sync_erreur' | 'sync_inactif'
  // Planning
  | 'aff_planifiee' | 'aff_confirmee' | 'aff_remplacement' | 'aff_annulee'
  | 'conflit_affectation' | 'personne_indisponible' | 'personne_absente'
  | 'remp_ouverte' | 'remp_pourvue' | 'remp_refusee'
  | 'absence_demandee' | 'absence_validee'
  // Chat collaboratif
  | 'salon_association' | 'salon_inter' | 'salon_direct' | 'salon_archive'
  | 'envoi_en_cours' | 'envoi_echec' | 'membre_en_ligne' | 'membre_hors_ligne'
  // Actions associatives
  | 'action_a_venir' | 'action_en_cours' | 'action_terminee' | 'action_annulee'
  | 'action_publiee' | 'action_brouillon' | 'action_partenariat' | 'action_seule'
  // Email interne
  | 'mail_envoi' | 'mail_echec' | 'mail_important' | 'mail_accuse_recu' | 'mail_accuse_attente'
  // Formulaires
  | 'form_brouillon' | 'form_publie' | 'form_ferme' | 'form_archive'

export const statusMap: Record<StatusKey, { label: string; tone: StatusTone }> = {
  actif: { label: 'Actif', tone: 'success' },
  valide: { label: 'Validé', tone: 'success' },
  paye: { label: 'Payé', tone: 'success' },
  en_attente: { label: 'En attente', tone: 'warning' },
  echeance_proche: { label: 'Échéance proche', tone: 'warning' },
  refuse: { label: 'Refusé', tone: 'danger' },
  retard: { label: 'En retard', tone: 'danger' },
  archive: { label: 'Archivé', tone: 'neutral' },
  brouillon: { label: 'Brouillon', tone: 'neutral' },
  adhesion_active: { label: 'Active', tone: 'success' },
  adhesion_expirant: { label: 'Expire bientôt', tone: 'warning' },
  adhesion_expiree: { label: 'Expirée', tone: 'danger' },
  adhesion_resiliee: { label: 'Résiliée', tone: 'neutral' },
  cotisation_payee: { label: 'Payée', tone: 'success' },
  cotisation_partielle: { label: 'Partielle', tone: 'warning' },
  cotisation_attente: { label: 'En attente', tone: 'warning' },
  cotisation_impayee: { label: 'Impayée', tone: 'danger' },
  cotisation_annulee: { label: 'Annulée', tone: 'neutral' },
  paiement_encaisse: { label: 'Encaissé', tone: 'success' },
  paiement_attente: { label: 'En attente', tone: 'warning' },
  paiement_refuse: { label: 'Refusé', tone: 'danger' },
  ecriture_brouillon: { label: 'Brouillon', tone: 'neutral' },
  ecriture_validee: { label: 'Validée', tone: 'success' },
  ecriture_desequilibree: { label: 'Déséquilibrée', tone: 'danger' },
  exercice_ouvert: { label: 'Ouvert', tone: 'success' },
  exercice_cloture: { label: 'Clôturé', tone: 'neutral' },
  piece_rattachee: { label: 'Rattachée', tone: 'success' },
  piece_orpheline: { label: 'À rattacher', tone: 'warning' },
  rapproche: { label: 'Rapproché', tone: 'success' },
  non_rapproche: { label: 'Non rapproché', tone: 'warning' },
  facture_brouillon: { label: 'Brouillon', tone: 'neutral' },
  facture_envoyee: { label: 'Envoyée', tone: 'warning' },
  facture_payee: { label: 'Payée', tone: 'success' },
  facture_retard: { label: 'En retard', tone: 'danger' },
  facture_annulee: { label: 'Annulée', tone: 'neutral' },
  virement_planifie: { label: 'Planifié', tone: 'warning' },
  virement_execute: { label: 'Exécuté', tone: 'success' },
  virement_annule: { label: 'Annulé', tone: 'neutral' },
  prevision_confirmee: { label: 'Confirmée', tone: 'success' },
  prevision_probable: { label: 'Probable', tone: 'warning' },
  non_categorise: { label: 'À catégoriser', tone: 'warning' },
  ndf_brouillon: { label: 'Brouillon', tone: 'neutral' },
  ndf_soumise: { label: 'Attente responsable', tone: 'warning' },
  ndf_responsable: { label: 'Attente trésorier', tone: 'warning' },
  ndf_validee: { label: 'Bon à rembourser', tone: 'success' },
  ndf_rejetee: { label: 'Rejetée', tone: 'danger' },
  ndf_remboursee: { label: 'Remboursée', tone: 'success' },
  justificatif_manquant: { label: 'Justificatif manquant', tone: 'warning' },
  justificatif_fourni: { label: 'Justificatif fourni', tone: 'success' },
  doc_partage: { label: 'Partagé par lien', tone: 'warning' },
  doc_prive: { label: 'Accès restreint', tone: 'neutral' },
  doc_corbeille: { label: 'Dans la corbeille', tone: 'neutral' },
  apercu_indisponible: { label: 'Aperçu indisponible', tone: 'warning' },
  upload_en_cours: { label: 'Import en cours', tone: 'warning' },
  upload_termine: { label: 'Importé', tone: 'success' },
  upload_echec: { label: 'Import échoué', tone: 'danger' },
  version_courante: { label: 'Version en vigueur', tone: 'success' },
  sig_brouillon: { label: 'Brouillon', tone: 'neutral' },
  sig_attente: { label: 'En attente de signature', tone: 'warning' },
  sig_terminee: { label: 'Signée par tous', tone: 'success' },
  sig_refusee: { label: 'Refusée', tone: 'danger' },
  sig_expiree: { label: 'Expirée', tone: 'danger' },
  sig_annulee: { label: 'Annulée', tone: 'neutral' },
  signataire_attente: { label: 'En attente', tone: 'warning' },
  signataire_signe: { label: 'Signé', tone: 'success' },
  signataire_refuse: { label: 'Refusé', tone: 'danger' },
  projet_preparation: { label: 'En préparation', tone: 'neutral' },
  projet_en_cours: { label: 'En cours', tone: 'success' },
  projet_suspendu: { label: 'Suspendu', tone: 'warning' },
  projet_cloture: { label: 'Clôturé', tone: 'neutral' },
  jalon_a_venir: { label: 'À venir', tone: 'warning' },
  jalon_atteint: { label: 'Atteint', tone: 'success' },
  jalon_manque: { label: 'Manqué', tone: 'danger' },
  risque_ouvert: { label: 'Ouvert', tone: 'warning' },
  risque_maitrise: { label: 'Maîtrisé', tone: 'success' },
  risque_clos: { label: 'Clos', tone: 'neutral' },
  budget_tenu: { label: 'Budget tenu', tone: 'success' },
  budget_depasse: { label: 'Budget dépassé', tone: 'danger' },
  evt_confirme: { label: 'Confirmé', tone: 'success' },
  evt_provisoire: { label: 'Provisoire', tone: 'warning' },
  evt_annule: { label: 'Annulé', tone: 'danger' },
  conflit_horaire: { label: 'Conflit d’horaire', tone: 'danger' },
  reponse_attente: { label: 'Sans réponse', tone: 'warning' },
  reponse_accepte: { label: 'Accepté', tone: 'success' },
  reponse_refuse: { label: 'Refusé', tone: 'danger' },
  reponse_peut_etre: { label: 'Peut-être', tone: 'warning' },
  sync_connecte: { label: 'Synchronisé', tone: 'success' },
  sync_erreur: { label: 'Erreur de synchronisation', tone: 'danger' },
  sync_inactif: { label: 'Non connecté', tone: 'neutral' },
  aff_planifiee: { label: 'Planifiée', tone: 'neutral' },
  aff_confirmee: { label: 'Confirmée', tone: 'success' },
  aff_remplacement: { label: 'Remplacement demandé', tone: 'warning' },
  aff_annulee: { label: 'Annulée', tone: 'neutral' },
  conflit_affectation: { label: 'Conflit d’affectation', tone: 'danger' },
  personne_indisponible: { label: 'Hors disponibilités', tone: 'warning' },
  personne_absente: { label: 'Personne absente', tone: 'danger' },
  remp_ouverte: { label: 'À pourvoir', tone: 'warning' },
  remp_pourvue: { label: 'Pourvue', tone: 'success' },
  remp_refusee: { label: 'Sans suite', tone: 'neutral' },
  absence_demandee: { label: 'À valider', tone: 'warning' },
  absence_validee: { label: 'Validée', tone: 'success' },
  salon_association: { label: 'Salon de l’association', tone: 'neutral' },
  salon_inter: { label: 'Inter-associations', tone: 'success' },
  salon_direct: { label: 'Message direct', tone: 'neutral' },
  salon_archive: { label: 'Archivé, lecture seule', tone: 'warning' },
  envoi_en_cours: { label: 'Envoi en cours', tone: 'warning' },
  envoi_echec: { label: 'Non envoyé', tone: 'danger' },
  membre_en_ligne: { label: 'En ligne', tone: 'success' },
  membre_hors_ligne: { label: 'Hors ligne', tone: 'neutral' },
  action_a_venir: { label: 'À venir', tone: 'warning' },
  action_en_cours: { label: 'En cours', tone: 'success' },
  action_terminee: { label: 'Terminée', tone: 'neutral' },
  action_annulee: { label: 'Annulée', tone: 'danger' },
  action_publiee: { label: 'Publiée sur l’application', tone: 'success' },
  action_brouillon: { label: 'Non publiée', tone: 'neutral' },
  action_partenariat: { label: 'En partenariat', tone: 'success' },
  action_seule: { label: 'Menée seule', tone: 'neutral' },
  mail_envoi: { label: 'Envoi en cours', tone: 'warning' },
  mail_echec: { label: 'Non envoyé', tone: 'danger' },
  mail_important: { label: 'Important', tone: 'warning' },
  mail_accuse_recu: { label: 'Accusé reçu', tone: 'success' },
  mail_accuse_attente: { label: 'Accusé en attente', tone: 'warning' },
  form_brouillon: { label: 'Brouillon', tone: 'neutral' },
  form_publie: { label: 'Publié', tone: 'success' },
  form_ferme: { label: 'Fermé', tone: 'warning' },
  form_archive: { label: 'Archivé', tone: 'neutral' },
}

export function StatusBadge({ status, className }: { status: StatusKey; className?: string }) {
  const { label, tone } = statusMap[status]
  const style = toneStyles[tone]
  const Icon = style.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        style.soft,
        className,
      )}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  )
}

/** Variante compacte pour les tableaux denses — icône + texte, jamais l'un sans l'autre. */
export function StatusInline({ status }: { status: StatusKey }) {
  const { label, tone } = statusMap[status]
  const style = toneStyles[tone]
  const Icon = style.icon
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[0.8125rem] font-medium', style.text)}>
      <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
      {label}
    </span>
  )
}
