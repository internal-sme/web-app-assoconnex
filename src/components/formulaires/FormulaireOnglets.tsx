import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function FormulaireOnglets({ id, nbReponses }: { id: string; nbReponses: number }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const liens = [
    { to: `/formulaires/${id}/editeur`, label: 'Éditeur' },
    { to: `/formulaires/${id}/apercu`, label: 'Prévisualisation' },
    { to: `/formulaires/${id}/parametres`, label: 'Paramètres' },
    { to: `/formulaires/${id}/publication`, label: 'Publication' },
    { to: `/formulaires/${id}/reponses`, label: 'Réponses', count: nbReponses },
    { to: `/formulaires/${id}/statistiques`, label: 'Statistiques' },
  ]

  return (
    <nav aria-label="Sections du formulaire" className="ac-scroll -mx-1 overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 border-b border-ink-200 px-1">
        {liens.map((l) => {
          const actif = pathname === l.to || (l.label === 'Réponses' && pathname.startsWith(l.to))
          return (
            <li key={l.to}>
              <button
                type="button"
                onClick={() => navigate(l.to)}
                aria-current={actif ? 'page' : undefined}
                className={cn(
                  '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[0.8125rem] font-medium transition-colors',
                  actif ? 'border-brand-500 text-ink-900' : 'border-transparent text-ink-500 hover:border-ink-300 hover:text-ink-800',
                )}
              >
                {l.label}
                {l.count !== undefined && (
                  <span className={cn('ac-num rounded px-1.5 py-0.5 text-2xs font-semibold', actif ? 'bg-brand-50 text-brand-700' : 'bg-ink-100 text-ink-600')}>
                    {l.count}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
