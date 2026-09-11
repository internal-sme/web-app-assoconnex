import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Accessibility,
  Bell,
  BookOpen,
  CircleHelp,
  FileText,
  LogOut,
  Mail,
  Plus,
  Search,
  UserRound,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { notifications as mockNotifications } from '@/lib/mock'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toneStyles } from '@/components/ui/Status'

export function Topbar({
  onOpenSearch,
  onOpenA11y,
}: {
  onOpenSearch: () => void
  onOpenA11y: () => void
}) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState(mockNotifications)
  const unread = notifications.filter((n) => !n.lu).length
  const { session, deconnecter } = useAuth()
  const [deconnexionOuverte, setDeconnexionOuverte] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-ink-200 bg-white/85 px-3 backdrop-blur">
      {/* Recherche globale */}
      <button
        type="button"
        onClick={onOpenSearch}
        className="group flex h-9 w-full max-w-md items-center gap-2.5 rounded-lg border border-ink-200 bg-ink-25 px-3 text-left text-[0.8125rem] text-ink-500 transition-colors hover:border-ink-300 hover:bg-white"
      >
        <Search aria-hidden className="h-4 w-4 shrink-0 text-ink-500" />
        <span className="flex-1 truncate">Rechercher…</span>
        <kbd className="hidden rounded border border-ink-200 bg-white px-1.5 py-0.5 font-mono text-2xs text-ink-500 sm:block">
          Ctrl K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* Création rapide */}
        <Menu
          label="Créer"
          items={[
            { label: 'Nouveau contact', icon: <UserRound />, onSelect: () => navigate('/contacts/nouveau') },
            { label: 'Nouvelle adhésion', icon: <Users />, onSelect: () => navigate('/adherents/nouveau') },
            { type: 'separator' },
            { label: 'Gérer les groupes et tags', icon: <FileText />, onSelect: () => navigate('/contacts/groupes') },
            { label: 'Envoyer un e-mail', icon: <Mail />, onSelect: () => toast({ titre: 'Campagne e-mail', detail: 'Module non disponible dans le socle.', tone: 'warning' }) },
          ]}
          trigger={({ toggle, open, ref }) => (
            <Button
              ref={ref}
              variant="primary"
              size="md"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="menu"
              iconLeft={<Plus aria-hidden className="h-4 w-4" />}
            >
              <span className="hidden sm:inline">Créer</span>
              <span className="sm:hidden sr-only">Créer</span>
            </Button>
          )}
        />

        <span aria-hidden className="mx-1 h-5 w-px bg-ink-200" />

        {/* Notifications */}
        <Menu
          label="Notifications"
          width="w-80"
          items={[]}
          trigger={({ toggle, open, ref }) => (
            <div className="relative">
              <Button
                ref={ref}
                variant="icon"
                label={`Notifications${unread ? ` — ${unread} non lues` : ''}`}
                aria-expanded={open}
                aria-haspopup="dialog"
                onClick={toggle}
              >
                <Bell aria-hidden className="h-[1.125rem] w-[1.125rem]" />
              </Button>
              {unread > 0 && (
                <span
                  aria-hidden
                  className="ac-num absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[0.625rem] font-bold text-white"
                >
                  {unread}
                </span>
              )}
              {open && (
                <div
                  role="dialog"
                  aria-label="Notifications"
                  className="absolute right-0 z-40 mt-1.5 w-80 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-lg animate-scale-in"
                >
                  <div className="flex items-center justify-between border-b border-ink-100 px-3 py-2">
                    <p className="text-[0.8125rem] font-semibold text-ink-900">Notifications</p>
                    <button
                      type="button"
                      onClick={() => setNotifications((n) => n.map((x) => ({ ...x, lu: true })))}
                      className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
                    >
                      Tout marquer comme lu
                    </button>
                  </div>
                  <ul className="ac-scroll max-h-80 divide-y divide-ink-100 overflow-y-auto">
                    {notifications.map((n) => {
                      const Icon = toneStyles[n.tone].icon
                      return (
                        <li key={n.id} className={cn('flex gap-2.5 px-3 py-2.5', !n.lu && 'bg-brand-50/40')}>
                          <Icon aria-hidden className={cn('mt-0.5 h-4 w-4 shrink-0', toneStyles[n.tone].text)} />
                          <div className="min-w-0">
                            <p className="text-[0.8125rem] font-medium text-ink-900">
                              {n.titre}
                              {!n.lu && <span className="sr-only"> (non lue)</span>}
                            </p>
                            <p className="text-xs text-ink-500">{n.detail}</p>
                            <p className="mt-0.5 text-2xs text-ink-500">{n.quand}</p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        />

        {/* Aide */}
        <Menu
          label="Aide"
          items={[
            { label: 'Guide de démarrage', icon: <BookOpen />, onSelect: () => toast({ titre: 'Guide de démarrage', detail: 'La documentation ouvrira dans un onglet.', tone: 'neutral' }) },
            { label: 'Raccourcis clavier', icon: <CircleHelp />, shortcut: '?', onSelect: () => toast({ titre: 'Raccourcis clavier', detail: 'Ctrl K ouvre la recherche globale.', tone: 'neutral' }) },
            { label: 'Contacter le support', icon: <Mail />, onSelect: () => toast({ titre: 'Support contacté', detail: 'Réponse sous un jour ouvré.', tone: 'success' }) },
          ]}
          trigger={({ toggle, open, ref }) => (
            <Button ref={ref} variant="icon" label="Aide" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
              <CircleHelp aria-hidden className="h-[1.125rem] w-[1.125rem]" />
            </Button>
          )}
        />

        {/* Accessibilité */}
        <Button variant="icon" label="Centre d'accessibilité" onClick={onOpenA11y}>
          <Accessibility aria-hidden className="h-[1.125rem] w-[1.125rem]" />
        </Button>

        <span aria-hidden className="mx-1 h-5 w-px bg-ink-200" />

        {/* Profil */}
        <Menu
          label="Menu du compte"
          items={[
            { label: 'Mon profil', icon: <UserRound />, onSelect: () => toast({ titre: 'Profil', detail: 'Page profil à venir.', tone: 'neutral' }) },
            { label: 'Préférences d’accessibilité', icon: <Accessibility />, onSelect: onOpenA11y },
            { type: 'separator' },
            { label: 'Se déconnecter', icon: <LogOut />, danger: true, onSelect: () => setDeconnexionOuverte(true) },
          ]}
          trigger={({ toggle, open, ref }) => (
            <button
              ref={ref}
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-ink-100"
            >
              <Avatar name={session?.nom ?? ''} size="sm" />
              <span className="hidden text-left lg:block">
                <span className="block text-[0.8125rem] font-medium leading-tight text-ink-900">{session?.nom}</span>
                <span className="block text-2xs leading-tight text-ink-500">{session?.role}</span>
              </span>
            </button>
          )}
        />
      </div>

      <ConfirmDialog
        open={deconnexionOuverte}
        onClose={() => setDeconnexionOuverte(false)}
        onConfirm={() => {
          setDeconnexionOuverte(false)
          deconnecter()
        }}
        title="Se déconnecter ?"
        description="Vous reviendrez à l'écran de connexion. Les saisies en cours qui n'ont pas été enregistrées seront perdues."
        confirmLabel="Se déconnecter"
      />
    </header>
  )
}
