import type { StatusKey } from '@/components/ui/Status'
import type { StatutFormulaire } from '@/lib/formulaires'

export const cleStatutFormulaire: Record<StatutFormulaire, StatusKey> = {
  brouillon: 'form_brouillon',
  publie: 'form_publie',
  ferme: 'form_ferme',
  archive: 'form_archive',
}
