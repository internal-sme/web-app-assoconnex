import { useLocation, useNavigate } from 'react-router-dom'
import { FlaskConical, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Chip } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Input'
import { useCompta, type ModeDemoCompta } from '@/context/ComptaContext'

const liens = [
  { to: '/comptabilite', label: 'Tableau de bord', end: true },
  { to: '/comptabilite/journal', label: 'Journal' },
  { to: '/comptabilite/grand-livre', label: 'Grand livre' },
  { to: '/comptabilite/balance', label: 'Balance' },
  { to: '/comptabilite/plan', label: 'Plan comptable' },
  { to: '/comptabilite/rapprochement', label: 'Rapprochement' },
  { to: '/comptabilite/pieces', label: 'Pièces' },
  { to: '/comptabilite/rapports', label: 'Rapports' },
  { to: '/comptabilite/exercices', label: 'Exercices' },
]

export const modesCompta: { value: ModeDemoCompta; label: string }[] = [
  { value: 'normal', label: 'Données normales' },
  { value: 'chargement', label: 'Chargement' },
  { value: 'vide', label: 'Aucune écriture' },
  { value: 'desequilibre', label: 'Écriture déséquilibrée' },
  { value: 'erreur', label: 'Erreur de chargement' },
  { value: 'echec', label: 'Échec de sauvegarde' },
]

/** Navigation interne du module : neuf écrans, une seule barre. */
export function ComptaNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav aria-label="Navigation de la comptabilité" className="ac-scroll -mx-1 overflow-x-auto">
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

/** Sélecteur d'exercice + menu des états, communs à tous les écrans du module. */
export function ComptaOutils() {
  const { exercices, exerciceId, setExerciceId, lectureSeule, mode, setMode } = useCompta()
  return (
    <>
      <label className="flex items-center gap-2 text-[0.8125rem] text-ink-500">
        <span className="sr-only sm:not-sr-only">Exercice</span>
        <Select
          value={exerciceId}
          onChange={(e) => setExerciceId(e.target.value)}
          aria-label="Exercice comptable"
          className="h-9 w-44"
          options={exercices.map((e) => ({ value: e.id, label: `${e.libelle}${e.statut === 'cloture' ? ' (clôturé)' : ''}` }))}
        />
      </label>
      <Menu
        label="États de démonstration"
        width="w-60"
        items={modesCompta.map((m) => ({ label: (mode === m.value ? '✓ ' : '') + m.label, onSelect: () => setMode(m.value) }))}
        trigger={({ toggle, open, ref }) => (
          <Button ref={ref} onClick={toggle} aria-expanded={open} aria-haspopup="menu" iconLeft={<FlaskConical aria-hidden className="h-4 w-4" />}>
            États
          </Button>
        )}
      />
      {lectureSeule && (
        <Chip icon={<Lock aria-hidden className="h-3 w-3 text-ink-500" />}>Lecture seule</Chip>
      )}
    </>
  )
}
