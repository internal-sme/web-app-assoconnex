import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageChange: (p: number) => void
  onPageSizeChange?: (s: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const numbers: (number | 'gap')[] = []
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) numbers.push(i)
    else if (numbers[numbers.length - 1] !== 'gap') numbers.push('gap')
  }

  return (
    <nav
      aria-label="Pagination des résultats"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 px-4 py-3"
    >
      <p className="ac-num text-[0.8125rem] text-ink-500" aria-live="polite">
        {from}–{to} sur {total}
      </p>

      <div className="flex items-center gap-4">
        {onPageSizeChange && (
          <label className="flex items-center gap-2 text-[0.8125rem] text-ink-500">
            Lignes
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-lg border border-ink-200 bg-white px-2 text-[0.8125rem] text-ink-800 hover:border-ink-300"
            >
              {[10, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="icon"
            size="sm"
            label="Page précédente"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </Button>
          {numbers.map((n, i) =>
            n === 'gap' ? (
              <span key={`g${i}`} aria-hidden className="px-1 text-ink-500">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange(n)}
                aria-current={n === page ? 'page' : undefined}
                aria-label={`Page ${n}`}
                className={cn(
                  'ac-num h-8 min-w-8 rounded-lg px-2 text-[0.8125rem] font-medium transition-colors',
                  n === page ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
                )}
              >
                {n}
              </button>
            ),
          )}
          <Button
            variant="icon"
            size="sm"
            label="Page suivante"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight aria-hidden className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
