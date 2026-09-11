import { useRef, useState } from 'react'
import { Trash2, Upload } from 'lucide-react'
import { cn, initials } from '@/lib/utils'
import { Button } from './Button'

const sizes = {
  xs: 'h-6 w-6 text-[0.625rem]',
  sm: 'h-7 w-7 text-[0.6875rem]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
  xl: 'h-16 w-16 text-lg',
}

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string
  src?: string
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full border border-ink-200 bg-ink-100 font-semibold uppercase tracking-wide text-ink-600',
        sizes[size],
        className,
      )}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : <span aria-hidden>{initials(name)}</span>}
      <span className="sr-only">{name}</span>
    </span>
  )
}

export function AvatarGroup({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max)
  const rest = names.length - shown.length
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((n) => (
          <Avatar key={n} name={n} size="sm" className="ring-2 ring-white" />
        ))}
      </div>
      {rest > 0 && <span className="ml-2 text-xs text-ink-500">+{rest}</span>}
    </div>
  )
}

export function AvatarUpload({ name, id }: { name: string; id?: string }) {
  const [src, setSrc] = useState<string | undefined>()
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} src={src} size="xl" />
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button size="sm" iconLeft={<Upload aria-hidden className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>
            Choisir une photo
          </Button>
          {src && (
            <Button
              size="sm"
              variant="ghost"
              iconLeft={<Trash2 aria-hidden className="h-4 w-4" />}
              onClick={() => setSrc(undefined)}
            >
              Retirer
            </Button>
          )}
        </div>
        <p className="text-xs text-ink-500">JPG ou PNG, 2 Mo maximum.</p>
      </div>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        aria-label="Photo de profil"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) setSrc(URL.createObjectURL(file))
        }}
      />
    </div>
  )
}
