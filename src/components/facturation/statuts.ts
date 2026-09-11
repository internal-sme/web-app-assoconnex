import type { StatusKey } from '@/components/ui/Status'
import { statutFacture, type Facture, type StatutFacture } from '@/lib/facturation'

const cles: Record<StatutFacture, StatusKey> = {
  brouillon: 'facture_brouillon',
  envoyee: 'facture_envoyee',
  payee: 'facture_payee',
  retard: 'facture_retard',
  annulee: 'facture_annulee',
}

export function cleFacture(f: Facture): StatusKey {
  return cles[statutFacture(f)]
}

export function cleStatut(s: StatutFacture): StatusKey {
  return cles[s]
}
