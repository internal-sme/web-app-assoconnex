import { useEffect } from 'react'
import { setPageTitle } from '@/services/seo'

export function usePageTitle(titre: string) {
  useEffect(() => {
    setPageTitle(titre)
  }, [titre])
}
