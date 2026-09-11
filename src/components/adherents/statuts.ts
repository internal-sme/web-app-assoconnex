import type { StatusKey } from '@/components/ui/Status'
import type { Adherent, Paiement, StatutCotisation } from '@/lib/adherents'
import { statutAdhesion } from '@/lib/adherents'

export function cleAdhesion(a: Adherent): StatusKey {
  const s = statutAdhesion(a)
  if (s === 'active') return 'adhesion_active'
  if (s === 'expirant') return 'adhesion_expirant'
  if (s === 'expiree') return 'adhesion_expiree'
  return 'adhesion_resiliee'
}

export function cleCotisation(s: StatutCotisation): StatusKey {
  switch (s) {
    case 'payee':
      return 'cotisation_payee'
    case 'partielle':
      return 'cotisation_partielle'
    case 'attente':
      return 'cotisation_attente'
    case 'retard':
      return 'cotisation_impayee'
    default:
      return 'cotisation_annulee'
  }
}

export function clePaiement(s: Paiement['statut']): StatusKey {
  if (s === 'valide') return 'paiement_encaisse'
  if (s === 'attente') return 'paiement_attente'
  return 'paiement_refuse'
}
