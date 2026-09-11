import {
  Bell,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarDays,
  CalendarRange,
  Check,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileSignature,
  FolderKanban,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Mail,
  Megaphone,
  MessagesSquare,
  MessageCircle,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useOrg } from '@/context/OrgContext'
import { Button } from '@/components/ui/Button'
import { Menu } from '@/components/ui/Menu'
import logo from '@/assets/logo.png'

type Entree = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean }
type Groupe = { id: string; titre: string; entrees: Entree[] }

/**
 * Deux dossiers : ce qui vaut au-delà d'une association, puis ce qui appartient
 * à l'association sélectionnée.
 */
const groupes: Groupe[] = [
  {
    id: 'commun',
    titre: 'Module commun',
    entrees: [
      { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
      { to: '/actions', label: 'Actions', icon: Target },
      { to: '/contacts', label: 'Contacts', icon: UserRound },
      { to: '/chat-collaboratif', label: 'Chat collaboratif', icon: MessageCircle },
    ],
  },
  {
    id: 'specifique',
    titre: 'Module spécifique',
    entrees: [
      { to: '/adherents', label: 'Adhérents', icon: Users },
      { to: '/comptabilite', label: 'Comptabilité', icon: Calculator },
      { to: '/facturation', label: 'Facturation', icon: ReceiptText },
      { to: '/tresorerie', label: 'Trésorerie', icon: Landmark },
      { to: '/notes-de-frais', label: 'Notes de frais', icon: Wallet },
      { to: '/documents', label: 'Documents', icon: FolderOpen },
      { to: '/signatures', label: 'Signature électronique', icon: FileSignature },
      { to: '/taches', label: 'Tâches', icon: ListChecks },
      { to: '/projets', label: 'Projets', icon: FolderKanban },
      { to: '/agenda', label: 'Agenda', icon: CalendarDays },
      { to: '/planning', label: 'Planning', icon: CalendarRange },
      { to: '/email-interne', label: 'Email interne', icon: Mail },
      { to: '/campagnes-emailing', label: 'Campagne d’emailing', icon: Megaphone },
      { to: '/notifications', label: 'Notifications', icon: Bell },
      { to: '/formulaires', label: 'Formulaires', icon: ClipboardList },
      { to: '/inventaire', label: 'Inventaire', icon: Package },
      { to: '/achats', label: 'Achats', icon: ShoppingCart },
      { to: '/rh', label: 'RH', icon: BriefcaseBusiness },
    ],
  },
]

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { org, orgs, setOrg } = useOrg()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // Les deux dossiers sont ouverts par défaut
  const [ouverts, setOuverts] = useState<string[]>(groupes.map((g) => g.id))

  const basculer = (id: string) => setOuverts((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]))

  /** Actif si la route correspond, ou si l'on est sur une sous-route du module. */
  const estActif = (to: string, end?: boolean) =>
    end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)

  const styleLien = (actif: boolean) =>
    cn(
      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] font-medium transition-colors',
      collapsed && 'justify-center px-0',
      actif ? 'bg-white text-ink-900 shadow-xs ring-1 ring-ink-200' : 'text-ink-600 hover:bg-white/70 hover:text-ink-900',
    )

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 shrink-0 flex-col border-r border-ink-200 bg-ink-25 transition-[width] duration-200',
        collapsed ? 'w-[4.25rem]' : 'w-64',
      )}
    >
      {/* Marque */}
      <div className={cn('flex h-14 items-center border-b border-ink-200', collapsed ? 'justify-center px-2' : 'px-4')}>
        {collapsed ? (
          <span
            aria-hidden
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-display text-sm font-bold text-white"
          >
            A°
          </span>
        ) : (
          <img src={logo} alt="AssoConnex" className="h-[1.35rem] w-auto object-contain" />
        )}
        {collapsed && <span className="sr-only">AssoConnex</span>}
      </div>

      {/* Sélecteur d'organisation */}
      <div className={cn('border-b border-ink-200 p-2', collapsed && 'px-2')}>
        <Menu
          label="Changer d'organisation"
          align="start"
          width="w-64"
          className="w-full"
          items={orgs.map((o) => ({
            label: o.nom,
            icon: o.id === org.id ? <Check /> : <Building2 />,
            onSelect: () => setOrg(o),
          }))}
          trigger={({ toggle, open, ref }) => (
            <button
              ref={ref}
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="menu"
              title={collapsed ? org.nom : undefined}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg border border-transparent p-2 text-left transition-colors hover:border-ink-200 hover:bg-white',
                collapsed && 'justify-center px-0',
              )}
            >
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-500 text-2xs font-bold text-white"
              >
                {org.nom.slice(0, 2).toUpperCase()}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-semibold text-ink-900">{org.nom}</span>
                    <span className="block truncate text-2xs text-ink-500">{org.type}</span>
                  </span>
                  <ChevronsUpDown aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                </>
              )}
            </button>
          )}
        />
      </div>

      {/* Navigation */}
      <nav aria-label="Navigation principale" className="ac-scroll min-h-0 flex-1 overflow-y-auto p-2">
        {groupes.map((groupe) => {
          const ouvert = ouverts.includes(groupe.id)
          const contientLaPage = groupe.entrees.some((e) => estActif(e.to, e.end))
          return (
            <div key={groupe.id} className="mb-2 last:mb-0">
              {collapsed ? (
                <span aria-hidden className="mx-auto mb-1 block h-px w-6 bg-ink-200" />
              ) : (
                <button
                  type="button"
                  onClick={() => basculer(groupe.id)}
                  aria-expanded={ouvert}
                  aria-controls={`groupe-${groupe.id}`}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-2xs font-semibold uppercase tracking-wide text-ink-500 transition-colors hover:bg-white/70 hover:text-ink-800"
                >
                  {ouvert ? (
                    <ChevronDown aria-hidden className="h-3 w-3 shrink-0" />
                  ) : (
                    <ChevronRight aria-hidden className="h-3 w-3 shrink-0" />
                  )}
                  <span className="flex-1 truncate">{groupe.titre}</span>
                  {!ouvert && contientLaPage && (
                    <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  )}
                </button>
              )}

              {(ouvert || collapsed) && (
                <ul id={`groupe-${groupe.id}`} className={cn('flex flex-col gap-0.5', !collapsed && 'mt-0.5')}>
                  {groupe.entrees.map((item) => {
                    const actif = estActif(item.to, item.end)
                    return (
                      <li key={item.to}>
                        <button
                          type="button"
                          onClick={() => navigate(item.to)}
                          aria-current={actif ? 'page' : undefined}
                          title={collapsed ? item.label : undefined}
                          className={styleLien(actif)}
                        >
                          <item.icon aria-hidden className={cn('h-4 w-4 shrink-0', actif ? 'text-brand-500' : 'text-ink-500')} />
                          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                          {actif && !collapsed && (
                            <span aria-hidden className="font-display text-base leading-none text-brand-500">
                              °
                            </span>
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>

      {/* Pied */}
      <div className="border-t border-ink-200 p-2">
        <button
          type="button"
          onClick={() => navigate('/parametres')}
          aria-current={estActif('/parametres') ? 'page' : undefined}
          title={collapsed ? 'Paramètres' : undefined}
          className={cn('mb-1', styleLien(estActif('/parametres')))}
        >
          <Settings aria-hidden className="h-4 w-4 shrink-0 text-ink-500" />
          {!collapsed && <span className="flex-1 truncate">Paramètres</span>}
        </button>
        <button
          type="button"
          onClick={() => navigate('/design-system')}
          aria-current={estActif('/design-system') ? 'page' : undefined}
          title={collapsed ? 'Design system' : undefined}
          className={cn('mb-1', styleLien(estActif('/design-system')))}
        >
          <Sparkles aria-hidden className="h-4 w-4 shrink-0 text-ink-500" />
          {!collapsed && <span className="flex-1 truncate">Design system</span>}
        </button>
        <Button
          variant="ghost"
          size="sm"
          className={cn('w-full', collapsed ? 'justify-center px-0' : 'justify-start')}
          onClick={onToggle}
          aria-expanded={!collapsed}
          iconLeft={
            collapsed ? (
              <ChevronsRight aria-hidden className="h-4 w-4" />
            ) : (
              <ChevronsLeft aria-hidden className="h-4 w-4" />
            )
          }
        >
          {collapsed ? <span className="sr-only">Déplier le menu</span> : 'Replier le menu'}
        </Button>
      </div>
    </aside>
  )
}
