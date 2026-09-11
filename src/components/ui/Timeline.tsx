import { cn } from '@/lib/utils'
import { toneStyles } from './Status'
import type { Evenement } from '@/lib/mock'
import { formatDateTime } from '@/lib/utils'

export function Timeline({ evenements }: { evenements: Evenement[] }) {
  return (
    <ol className="relative">
      {evenements.map((e, i) => {
        const style = toneStyles[e.tone]
        const Icon = style.icon
        const dernier = i === evenements.length - 1
        return (
          <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
            {!dernier && <span aria-hidden className="absolute left-[0.9375rem] top-8 bottom-0 w-px bg-ink-200" />}
            <span
              className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border', style.soft)}
            >
              <Icon aria-hidden className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-[0.8125rem] font-medium text-ink-900">{e.libelle}</p>
              {e.detail && <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-ink-500">{e.detail}</p>}
              <p className="ac-num mt-1 text-2xs text-ink-500">
                {formatDateTime(e.quand)} · {e.auteur}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
