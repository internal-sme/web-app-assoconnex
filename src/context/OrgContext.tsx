import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { organisations, type Organisation } from '@/lib/mock'

type Ctx = { org: Organisation; orgs: Organisation[]; setOrg: (o: Organisation) => void }
const OrgContext = createContext<Ctx | null>(null)

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrg] = useState<Organisation>(organisations[0])
  const value = useMemo(() => ({ org, orgs: organisations, setOrg }), [org])
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg doit être utilisé dans OrgProvider')
  return ctx
}
