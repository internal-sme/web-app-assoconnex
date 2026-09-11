import { useLocation, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Chip } from '@/components/ui/Badge'
import { useFacturation, type ModeDemoFact } from '@/context/FacturationContext'

const liens = [
  { to: '/facturation', label: 'Tableau de bord', end: true },
  { to: '/facturation/factures', label: 'Factures' },
  { to: '/facturation/avoirs', label: 'Avoirs' },
  { to: '/facturation/relances', label: 'Relances' },
  { to: '/facturation/clients', label: 'Clients' },
  { to: '/facturation/produits', label: 'Produits et services' },
  { to: '/facturation/tarifs', label: 'Tarifs' },
  { to: '/facturation/modeles', label: 'Modèles' },
  { to: '/facturation/numerotation', label: 'Numérotation' },
  { to: '/facturation/historique', label: 'Historique' },
]

export const modesFact: { value: ModeDemoFact; label: string }[] = [
  { value: 'normal', label: 'Données normales' },
  { value: 'chargement', label: 'Chargement' },
  { value: 'vide', label: 'Aucune facture' },
  { value: 'sans-ligne', label: 'Facture sans ligne' },
  { value: 'erreur', label: 'Erreur de chargement' },
  { value: 'echec-envoi', label: 'Erreur d’envoi' },
  { value: 'echec', label: 'Échec de sauvegarde' },
]

export function FactNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav aria-label="Navigation de la facturation" className="ac-scroll -mx-1 overflow-x-auto">
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

export function FactOutils() {
  const { mode, setMode } = useFacturation()
  return (
    <>
      {mode !== 'normal' && (
        <Chip icon={<FlaskConical aria-hidden className="h-3 w-3 text-ink-500" />}>
          Démo : {modesFact.find((m) => m.value === mode)?.label}
        </Chip>
      )}
      <Menu
        label="États de démonstration"
        width="w-60"
        items={modesFact.map((m) => ({ label: (mode === m.value ? '✓ ' : '') + m.label, onSelect: () => setMode(m.value) }))}
        trigger={({ toggle, open, ref }) => (
          <Button ref={ref} onClick={toggle} aria-expanded={open} aria-haspopup="menu" iconLeft={<FlaskConical aria-hidden className="h-4 w-4" />}>
            États
          </Button>
        )}
      />
    </>
  )
}
