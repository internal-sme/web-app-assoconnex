import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'danger',
  confirmDisabled,
  loading,
  children,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  /** Bloque la confirmation tant qu'une condition n'est pas remplie (case à cocher, saisie…). */
  confirmDisabled?: boolean
  loading?: boolean
  children?: ReactNode
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={confirmDisabled}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children ?? (
        tone === 'danger' ? (
          <div className="flex items-start gap-2.5 rounded-lg border border-danger-100 bg-danger-50 p-3 text-[0.8125rem] text-danger-700">
            <AlertTriangle aria-hidden className="mt-px h-4 w-4 shrink-0" />
            <p>Cette action est définitive. Elle ne peut pas être annulée.</p>
          </div>
        ) : null
      )}
    </Modal>
  )
}
