const BASE_TITLE = 'AssoConnex°'

export function setPageTitle(titre: string) {
  if (typeof document === 'undefined') return
  if (!titre || titre.trim() === '') {
    document.title = BASE_TITLE
    return
  }
  document.title = `${BASE_TITLE} | ${titre.trim()}`
}

export function resetPageTitle() {
  setPageTitle('')
}
