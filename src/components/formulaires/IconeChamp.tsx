import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  CircleDot,
  GitBranch,
  List,
  Mail,
  MapPin,
  PenLine,
  Phone,
  Rows3,
  ShieldCheck,
  SlidersHorizontal,
  Type,
  UploadCloud,
  type LucideIcon,
} from 'lucide-react'
import type { TypeChamp } from '@/lib/formulaires'

export const iconesChamp: Record<TypeChamp, LucideIcon> = {
  texte: Type,
  texte_long: AlignLeft,
  email: Mail,
  telephone: Phone,
  date: CalendarDays,
  choix_unique: CircleDot,
  choix_multiple: CheckSquare,
  liste: List,
  echelle: SlidersHorizontal,
  adresse: MapPin,
  fichier: UploadCloud,
  signature: PenLine,
  consentement: ShieldCheck,
  section: Rows3,
  conditionnelle: GitBranch,
}

export function IconeChamp({ type, className = 'h-4 w-4' }: { type: TypeChamp; className?: string }) {
  const Icone = iconesChamp[type]
  return <Icone aria-hidden className={className} />
}
