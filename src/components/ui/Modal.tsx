import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEscape, useFocusTrap } from '@/lib/hooks'
import { Button } from './Button'

/**
 * Boîte de dialogue. Sa hauteur est plafonnée : l'en-tête et le pied restent
 * fixes, seul le corps défile, pour que le bouton de validation demeure
 * visible quelle que soit la longueur du contenu.
 *
 * Sur téléphone, les grandes tailles s'ancrent en bas de l'écran et occupent
 * toute la largeur — le geste attendu sur mobile.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useFocusTrap(ref, open)
  useEscape(onClose, open)

  if (!open) return null

  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-3xl' }
  // Les petites boîtes restent centrées partout ; les grandes deviennent une
  // feuille en bas d'écran sur téléphone.
  const feuilleMobile = size === 'lg' || size === 'xl'

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[70] flex justify-center p-0 sm:items-center sm:p-4',
        feuilleMobile ? 'items-end' : 'items-center p-4',
      )}
    >
      <div className="fixed inset-0 bg-ink-950/40 animate-fade-in" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-desc` : undefined}
        className={cn(
          'relative flex w-full flex-col border border-ink-200 bg-white shadow-pop animate-scale-in',
          'max-h-[92dvh] sm:max-h-[85dvh]',
          feuilleMobile ? 'rounded-t-2xl sm:rounded-2xl' : 'rounded-2xl',
          widths[size],
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 pb-3 pt-5">
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="font-display text-base font-semibold text-ink-900">
              {title}
            </h2>
            {description && (
              <p id={`${id}-desc`} className="mt-1 text-[0.8125rem] leading-relaxed text-ink-500">
                {description}
              </p>
            )}
          </div>
          <Button variant="icon" size="sm" label="Fermer" onClick={onClose}>
            <X aria-hidden className="h-4 w-4" />
          </Button>
        </div>

        {children && <div className="ac-scroll min-h-0 flex-1 overflow-y-auto px-5 py-2">{children}</div>}

        {footer && (
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-ink-100 bg-ink-25 px-5 py-3 sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
