import { useLocation, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Chip } from '@/components/ui/Badge'
import { useChat, type ModeDemoChat } from '@/context/ChatContext'

const liens = [
  { to: '/chat-collaboratif', label: 'Conversations', end: true },
  { to: '/chat-collaboratif/mentions', label: 'Mentions et non-lus' },
  { to: '/chat-collaboratif/recherche', label: 'Recherche' },
  { to: '/chat-collaboratif/nouveau', label: 'Nouveau chat' },
]

const modes: { value: ModeDemoChat; label: string }[] = [
  { value: 'normal', label: 'Données normales' },
  { value: 'chargement', label: 'Chargement' },
  { value: 'vide', label: 'Aucune conversation' },
  { value: 'salon-vide', label: 'Salon sans message' },
  { value: 'echec-envoi', label: 'Échec d’envoi' },
  { value: 'archive', label: 'Salons archivés' },
  { value: 'erreur', label: 'Erreur de chargement' },
  { value: 'echec', label: 'Échec de sauvegarde' },
]

export function ChatNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <nav aria-label="Navigation du chat" className="ac-scroll -mx-1 overflow-x-auto">
      <ul className="flex min-w-max items-center gap-1 border-b border-ink-200 px-1">
        {liens.map((l) => {
          const actif = l.end ? pathname === l.to || /^\/chat-collaboratif\/sl-/.test(pathname) : pathname.startsWith(l.to)
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

export function ChatOutils() {
  const { mode, setMode } = useChat()
  return (
    <>
      {mode !== 'normal' && (
        <Chip icon={<FlaskConical aria-hidden className="h-3 w-3 text-ink-500" />}>
          Démo : {modes.find((m) => m.value === mode)?.label}
        </Chip>
      )}
      <Menu
        label="États de démonstration"
        width="w-60"
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
