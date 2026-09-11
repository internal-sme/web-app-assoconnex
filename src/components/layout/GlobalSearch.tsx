import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, LayoutDashboard, Search, Settings, UserRound, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEscape, useFocusTrap } from '@/lib/hooks'
import { contactsInitiaux } from '@/lib/mock'
import { adherentsInitiaux } from '@/lib/adherents'
import { Avatar } from '@/components/ui/Avatar'

type Item = { id: string; label: string; hint: string; group: string; to: string; icon?: React.ReactNode }

const pages: Item[] = [
  { id: 'p1', label: 'Tableau de bord', hint: 'Page', group: 'Aller à', to: '/', icon: <LayoutDashboard /> },
  { id: 'p2', label: 'Contacts', hint: 'Page', group: 'Aller à', to: '/contacts', icon: <UserRound /> },
  { id: 'p3', label: 'Adhérents', hint: 'Page', group: 'Aller à', to: '/adherents', icon: <Users /> },
  { id: 'p6', label: 'Liste des adhérents', hint: 'Page', group: 'Aller à', to: '/adherents/liste', icon: <Users /> },
  { id: 'p17', label: 'Actions associatives', hint: 'Page', group: 'Aller à', to: '/actions', icon: <Settings /> },
  { id: 'p18', label: 'Chat collaboratif', hint: 'Page', group: 'Aller à', to: '/chat-collaboratif', icon: <Settings /> },
  { id: 'p19', label: 'Agenda', hint: 'Page', group: 'Aller à', to: '/agenda', icon: <Settings /> },
  { id: 'p20', label: 'Planning', hint: 'Page', group: 'Aller à', to: '/planning', icon: <Settings /> },
  { id: 'p15', label: 'Projets', hint: 'Page', group: 'Aller à', to: '/projets', icon: <Settings /> },
  { id: 'p16', label: 'Tâches', hint: 'Page', group: 'Aller à', to: '/taches', icon: <Settings /> },
  { id: 'p13', label: 'Documents', hint: 'Page', group: 'Aller à', to: '/documents', icon: <Settings /> },
  { id: 'p14', label: 'Signatures', hint: 'Page', group: 'Aller à', to: '/signatures', icon: <Settings /> },
  { id: 'p11', label: 'Trésorerie', hint: 'Page', group: 'Aller à', to: '/tresorerie', icon: <Settings /> },
  { id: 'p12', label: 'Notes de frais', hint: 'Page', group: 'Aller à', to: '/notes-de-frais', icon: <Settings /> },
  { id: 'p9', label: 'Facturation', hint: 'Page', group: 'Aller à', to: '/facturation', icon: <Settings /> },
  { id: 'p10', label: 'Factures', hint: 'Page', group: 'Aller à', to: '/facturation/factures', icon: <Settings /> },
  { id: 'p7', label: 'Comptabilité', hint: 'Page', group: 'Aller à', to: '/comptabilite', icon: <Settings /> },
  { id: 'p8', label: 'Journal comptable', hint: 'Page', group: 'Aller à', to: '/comptabilite/journal', icon: <Settings /> },
  { id: 'p4', label: 'Paramètres', hint: 'Page', group: 'Aller à', to: '/parametres', icon: <Settings /> },
  { id: 'p5', label: 'Design system', hint: 'Page', group: 'Aller à', to: '/design-system', icon: <Settings /> },
]

export function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useFocusTrap(ref, open)
  useEscape(onClose, open)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  const results = useMemo<Item[]>(() => {
    const q = query.trim().toLowerCase()
    const people: Item[] = [
      ...contactsInitiaux.slice(0, 30).map((c) => ({
        id: c.id,
        label: `${c.prenom} ${c.nom}`,
        hint: c.email,
        group: 'Contacts',
        to: `/contacts/${c.id}`,
      })),
      ...adherentsInitiaux.slice(0, 30).map((a) => ({
        id: a.id,
        label: `${a.prenom} ${a.nom}`,
        hint: `${a.numero} · ${a.ville}`,
        group: 'Adhérents',
        to: `/adherents/${a.id}`,
      })),
    ]
    const all = [...pages, ...people]
    if (!q) return pages
    return all.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(q)).slice(0, 12)
  }, [query])

  if (!open) return null

  const groups = Array.from(new Set(results.map((r) => r.group)))
  const go = (item: Item) => {
    navigate(item.to)
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-ink-950/40 animate-fade-in" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Recherche globale"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-pop animate-scale-in"
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4">
          <Search aria-hidden className="h-4 w-4 shrink-0 text-ink-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter' && results[active]) {
                e.preventDefault()
                go(results[active])
              }
            }}
            placeholder="Rechercher un contact, un adhérent, une page…"
            aria-label="Rechercher dans AssoConnex"
            aria-controls="recherche-resultats"
            className="h-12 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500"
          />
          <kbd className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-mono text-2xs text-ink-500">Échap</kbd>
        </div>

        <div id="recherche-resultats" className="ac-scroll max-h-80 overflow-y-auto p-2" role="listbox" aria-label="Résultats">
          {results.length === 0 && (
            <p className="px-3 py-8 text-center text-[0.8125rem] text-ink-500">
              Aucun résultat pour « {query} ». Essayez un nom, un e-mail ou une ville.
            </p>
          )}
          {groups.map((g) => (
            <div key={g} className="mb-1">
              <p className="px-2 py-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-500">{g}</p>
              {results
                .filter((r) => r.group === g)
                .map((item) => {
                  const idx = results.indexOf(item)
                  return (
                    <button
                      key={item.id}
                      role="option"
                      aria-selected={idx === active}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(item)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left',
                        idx === active && 'bg-ink-100',
                      )}
                    >
                      {item.icon ? (
                        <span aria-hidden className="text-ink-500 [&>svg]:h-4 [&>svg]:w-4">
                          {item.icon}
                        </span>
                      ) : (
                        <Avatar name={item.label} size="xs" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{item.label}</span>
                        <span className="block truncate text-xs text-ink-500">{item.hint}</span>
                      </span>
                      {idx === active && <CornerDownLeft aria-hidden className="h-3.5 w-3.5 text-ink-500" />}
                    </button>
                  )
                })}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
