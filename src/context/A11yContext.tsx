import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type TextSize = 'sm' | 'md' | 'lg' | 'xl'

export type A11yPrefs = {
  textSize: TextSize
  contrast: 'normal' | 'high'
  motion: 'full' | 'reduced'
  focus: 'default' | 'strong'
}

const DEFAULTS: A11yPrefs = { textSize: 'md', contrast: 'normal', motion: 'full', focus: 'default' }

type Ctx = {
  prefs: A11yPrefs
  set: <K extends keyof A11yPrefs>(key: K, value: A11yPrefs[K]) => void
  reset: () => void
}

const A11yContext = createContext<Ctx | null>(null)

export function A11yProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULTS)

  useEffect(() => {
    const el = document.documentElement
    el.dataset.textSize = prefs.textSize
    el.dataset.contrast = prefs.contrast
    el.dataset.motion = prefs.motion
    el.dataset.focus = prefs.focus
  }, [prefs])

  const value = useMemo<Ctx>(
    () => ({
      prefs,
      set: (key, value) => setPrefs((p) => ({ ...p, [key]: value })),
      reset: () => setPrefs(DEFAULTS),
    }),
    [prefs],
  )

  return <A11yContext.Provider value={value}>{children}</A11yContext.Provider>
}

export function useA11y() {
  const ctx = useContext(A11yContext)
  if (!ctx) throw new Error('useA11y doit être utilisé dans A11yProvider')
  return ctx
}
