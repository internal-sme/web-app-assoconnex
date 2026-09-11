import { useLocation, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Chip } from '@/components/ui/Badge'
import { useAgenda, type ModeDemoAgenda } from '@/context/AgendaContext'
import type { ReponseParticipant, StatutEvenement } from '@/lib/agenda'

export const cleStatutEvt: Record<StatutEvenement, 'evt_confirme' | 'evt_provisoire' | 'evt_annule'> = {
  confirme: 'evt_confirme',
  provisoire: 'evt_provisoire',
  annule: 'evt_annule',
}

export const cleReponse: Record<ReponseParticipant, 'reponse_attente' | 'reponse_accepte' | 'reponse_refuse' | 'reponse_peut_etre'> = {
  attente: 'reponse_attente',
  accepte: 'reponse_accepte',
  refuse: 'reponse_refuse',
  peut_etre: 'reponse_peut_etre',
}

const liens = [
  { to: '/agenda', label: 'Mon agenda', end: true },
  { to: '/agenda/association', label: 'Agenda de l’association' },
  { to: '/agenda/partages', label: 'Agendas partagés' },
  { to: '/agenda/disponibilites', label: 'Disponibilités' },
  { to: '/agenda/synchronisation', label: 'Synchronisation' },
]

const modes: { value: ModeDemoAgenda; label: string }[] = [
  { value: 'normal', label: 'Données normales' },
  { value: 'chargement', label: 'Chargement' },
  { value: 'vide', label: 'Agenda vide' },
  { value: 'conflit', label: 'Conflit d’horaire' },
  { value: 'erreur', label: 'Erreur de chargement' },
  { value: 'erreur-synchro', label: 'Erreur de synchronisation' },
  { value: 'echec', label: 'Échec de sauvegarde' },
]

export function AgendaNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav aria-label="Navigation de l’agenda" className="ac-scroll -mx-1 overflow-x-auto">
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

export function AgendaOutils() {
  const { mode, setMode, enregistrement } = useAgenda()
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
