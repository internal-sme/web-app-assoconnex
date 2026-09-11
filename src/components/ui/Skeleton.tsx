import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('relative block overflow-hidden rounded-md bg-ink-100', className)}
    >
      <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </span>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="divide-y divide-ink-100">
      <span className="sr-only">Chargement des données…</span>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="ml-auto h-5 w-20 rounded-md" />
        </div>
      ))}
    </div>
  )
}
