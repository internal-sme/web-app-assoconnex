import { useLocation, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Chip } from '@/components/ui/Badge'
import { useTresorerie, type ModeDemoTreso } from '@/context/TresorerieContext'

const liens = [
  { to: '/tresorerie', label: 'Tableau de bord', end: true },
  { to: '/tresorerie/comptes', label: 'Comptes' },
  { to: '/tresorerie/mouvements', label: 'Mouvements' },
  { to: '/tresorerie/rapprochement', label: 'Rapprochement' },
  { to: '/tresorerie/previsionnel', label: 'Prévisionnel' },
  { to: '/tresorerie/virements', label: 'Virements' },
  { to: '/tresorerie/categorisation', label: 'Catégorisation' },
  { to: '/tresorerie/rapport', label: 'Rapport' },
]

const modes: { value: ModeDemoTreso; label: string }[] = [
  { value: 'normal', label: 'Données normales' },
  { value: 'chargement', label: 'Chargement' },
  { value: 'vide', label: 'Aucune donnée' },
  { value: 'erreur', label: 'Erreur de synchronisation' },
  { value: 'echec', label: 'Échec de sauvegarde' },
]

export function TresoNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav aria-label="Navigation de la trésorerie" className="ac-scroll -mx-1 overflow-x-auto">
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

export function TresoOutils() {
  const { mode, setMode } = useTresorerie()
  return (
    <>
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
