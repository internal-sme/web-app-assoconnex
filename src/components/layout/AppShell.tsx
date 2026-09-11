import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { GlobalSearch } from './GlobalSearch'
import { A11yCenter } from './A11yCenter'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [a11yOpen, setA11yOpen] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-full min-h-0 overflow-hidden bg-white">
      <button
        type="button"
        className="ac-skip-link"
        onClick={() => document.getElementById('contenu-principal')?.focus()}
      >
        Aller au contenu principal
      </button>

      <div className="hidden min-h-0 md:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Topbar onOpenSearch={() => setSearchOpen(true)} onOpenA11y={() => setA11yOpen(true)} />
        <main id="contenu-principal" tabIndex={-1} className="ac-scroll min-h-0 flex-1 overflow-y-auto bg-ink-25/60">
          <Outlet />
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <A11yCenter open={a11yOpen} onClose={() => setA11yOpen(false)} />
    </div>
  )
}
