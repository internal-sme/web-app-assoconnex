import type { StatusKey } from '@/components/ui/Status'
import type { StatutDemande } from '@/lib/signatures'

export const cleDemande: Record<StatutDemande, StatusKey> = {
  brouillon: 'sig_brouillon',
  en_attente: 'sig_attente',
  terminee: 'sig_terminee',
  refusee: 'sig_refusee',
  expiree: 'sig_expiree',
  annulee: 'sig_annulee',
}
