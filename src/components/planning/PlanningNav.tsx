import { useLocation, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Chip } from '@/components/ui/Badge'
import { usePlanning, type ModeDemoPlanning } from '@/context/PlanningContext'
import type { StatutAffectation } from '@/lib/planning'

export const cleAffectation: Record<StatutAffectation, 'aff_planifiee' | 'aff_confirmee' | 'aff_remplacement' | 'aff_annulee'> = {
  planifiee: 'aff_planifiee',
  confirmee: 'aff_confirmee',
  remplacement: 'aff_remplacement',
  annulee: 'aff_annulee',
}

const liens = [
  { to: '/planning', label: 'Planning global', end: true },
  { to: '/planning/equipe', label: 'Équipe' },
  { to: '/planning/individuel', label: 'Individuel' },
  { to: '/planning/ressources', label: 'Ressources' },
  { to: '/planning/disponibilites', label: 'Disponibilités' },
  { to: '/planning/absences', label: 'Absences' },
  { to: '/planning/conflits', label: 'Conflits' },
  { to: '/planning/remplacements', label: 'Remplacements' },
]

const modes: { value: ModeDemoPlanning; label: string }[] = [
  { value: 'normal', label: 'Données normales' },
  { value: 'chargement', label: 'Chargement' },
  { value: 'vide', label: 'Planning vide' },
  { value: 'conflit', label: 'Conflit d’affectation' },
  { value: 'indisponible', label: 'Personne indisponible' },
  { value: 'erreur', label: 'Erreur de chargement' },
  { value: 'echec', label: 'Échec de sauvegarde' },
]

export function PlanningNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav aria-label="Navigation du planning" className="ac-scroll -mx-1 overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 border-b border-ink-200 px-1">
        {liens.map((l) => {
          const actif = l.end ? pathname === l.to : pathname.startsWith(l.to)
          return (
            <li key={l.to}>
              <button
                type="button"
                onClick={() => navigate(l.to)}
                aria-current={actif ? 'page' : undefined}
                className={cn(
                  '-mb-px border-b-2 px-3 py-2 text-[0.8125rem] font-medium transition-colors',
                  actif ? 'border-brand-500 text-ink-900' : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800',
                )}
              >
                {l.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function PlanningOutils() {
  const { mode, setMode, enregistrement } = usePlanning()
  return (
    <>
      {enregistrement && <Chip>Enregistrement…</Chip>}
      {mode !== 'normal' && (
        <Chip icon={<FlaskConical aria-hidden className="h-3 w-3 text-ink-500" />}>
          Démo : {modes.find((m) => m.value === mode)?.label}
        </Chip>
      )}
      <Menu
        label="États de démonstration"
        width="w-64"
        items={modes.map((m) => ({ label: (mode === m.value ? '✓ ' : '') + m.label, onSelect: () => setMode(m.value) }))}
        trigger={({ toggle, open, ref }) => (
          <Button ref={ref} onClick={toggle} aria-expanded={open} aria-haspopup="menu" iconLeft={<FlaskConical aria-hidden className="h-4 w-4" />}>
            États
          </Button>
        )}
      />
    </>
  )
}
