import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEscape, useFocusTrap } from '@/lib/hooks'
import { Button } from './Button'

export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'md',
  headerAction,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  width?: 'md' | 'lg'
  /** Contrôle supplémentaire placé à gauche du bouton de fermeture. */
  headerAction?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId()
  useFocusTrap(ref, open)
  useEscape(onClose, open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-ink-950/40 animate-fade-in" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        className={cn(
          'absolute right-0 top-0 flex h-full w-full flex-col border-l border-ink-200 bg-white shadow-pop animate-slide-left',
          width === 'lg' ? 'w-full sm:w-[32rem]' : 'w-full sm:w-[26rem]',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id={`${id}-title`} className="font-display text-base font-semibold text-ink-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[0.8125rem] text-ink-500">{description}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {headerAction}
            <Button variant="icon" size="sm" label="Fermer le panneau" onClick={onClose}>
              <X aria-hidden className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="ac-scroll flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
