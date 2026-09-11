import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowDownUp,
  ArrowDown,
  ArrowUp,
  Columns3,
  MoreHorizontal,
  Rows2,
  Rows4,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Toggle'
import { Chip } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Menu, type MenuItem } from '@/components/ui/Menu'
import { Pagination } from '@/components/ui/Pagination'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'

export type Column<T> = {
  id: string
  header: string
  cell: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  align?: 'left' | 'right'
  width?: string
  /** Colonne masquable depuis le sélecteur de colonnes. */
  optional?: boolean
  defaultHidden?: boolean
}

export type FilterDef<T> = {
  id: string
  label: string
  options: { value: string; label: string }[]
  match: (row: T, value: string) => boolean
}

export type RowAction<T> = {
  label: string
  icon?: ReactNode
  onSelect: (row: T) => void
  danger?: boolean
  separatorBefore?: boolean
}

export type Density = 'compact' | 'comfortable'

export function DataGrid<T extends { id: string }>({
  rows,
  columns,
  filters = [],
  searchKeys,
  searchPlaceholder = 'Rechercher…',
  rowActions = [],
  bulkActions,
  onRowClick,
  getRowLabel,
  loading,
  emptyIcon,
  emptyTitle = 'Aucun résultat',
  emptyDescription = 'Modifiez la recherche ou retirez un filtre pour élargir les résultats.',
  emptyAction,
  caption,
}: {
  rows: T[]
  columns: Column<T>[]
  filters?: FilterDef<T>[]
  searchKeys: (row: T) => string
  searchPlaceholder?: string
  rowActions?: RowAction<T>[]
  bulkActions?: (selected: T[], clear: () => void) => ReactNode
  onRowClick?: (row: T) => void
  getRowLabel?: (row: T) => string
  loading?: boolean
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  caption: string
}) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState<Record<string, string>>({})
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null)
  const [hidden, setHidden] = useState<string[]>(columns.filter((c) => c.defaultHidden).map((c) => c.id))
  const [selected, setSelected] = useState<string[]>([])
  const [density, setDensity] = useState<Density>('comfortable')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const visibleColumns = columns.filter((c) => !hidden.includes(c.id))

  const filtered = useMemo(() => {
    let out = rows
    const q = query.trim().toLowerCase()
    if (q) out = out.filter((r) => searchKeys(r).toLowerCase().includes(q))
    for (const f of filters) {
      const v = active[f.id]
      if (v) out = out.filter((r) => f.match(r, v))
    }
    if (sort) {
      const col = columns.find((c) => c.id === sort.id)
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const va = col.sortValue!(a)
          const vb = col.sortValue!(b)
          const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'fr')
          return sort.dir === 'asc' ? cmp : -cmp
        })
      }
    }
    return out
  }, [rows, query, active, sort, filters, columns, searchKeys])

  const total = filtered.length
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id))
  const someOnPageSelected = pageRows.some((r) => selected.includes(r.id)) && !allOnPageSelected
  const selectedRows = rows.filter((r) => selected.includes(r.id))
  const activeChips = filters.filter((f) => active[f.id])

  const toggleSort = (id: string) => {
    setSort((s) => (s?.id !== id ? { id, dir: 'asc' } : s.dir === 'asc' ? { id, dir: 'desc' } : null))
  }

  const cellPad = density === 'compact' ? 'px-3 py-1.5' : 'px-3 py-2.5'

  return (
    <div className="overflow-hidden rounded-xl border border-ink-200 bg-white shadow-xs">
      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-3">
        <div className="min-w-[12rem] flex-1">
          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            iconLeft={<Search />}
          />
        </div>

        {filters.map((f) => (
          <Menu
            key={f.id}
            label={f.label}
            items={[
              { label: 'Tous', onSelect: () => setActive((a) => ({ ...a, [f.id]: '' })) },
              { type: 'separator' as const },
              ...f.options.map((o) => ({
                label: o.label,
                onSelect: () => {
                  setActive((a) => ({ ...a, [f.id]: o.value }))
                  setPage(1)
                },
              })),
            ]}
            trigger={({ toggle, open, ref }) => (
              <Button
                ref={ref}
                size="md"
                variant="secondary"
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="menu"
                iconLeft={<SlidersHorizontal aria-hidden className="h-4 w-4" />}
                className={cn(active[f.id] && 'border-brand-300 bg-brand-50 text-brand-700')}
              >
                {f.label}
              </Button>
            )}
          />
        ))}

        <Menu
          label="Colonnes affichées"
          width="w-52"
          items={columns
            .filter((c) => c.optional)
            .map((c) => ({
              label: `${hidden.includes(c.id) ? 'Afficher' : 'Masquer'} « ${c.header} »`,
              onSelect: () =>
                setHidden((h) => (h.includes(c.id) ? h.filter((x) => x !== c.id) : [...h, c.id])),
            }))}
          trigger={({ toggle, open, ref }) => (
            <Button ref={ref} size="md" variant="secondary" onClick={toggle} aria-expanded={open} aria-haspopup="menu"
              iconLeft={<Columns3 aria-hidden className="h-4 w-4" />}>
              Colonnes
            </Button>
          )}
        />

        <div
          role="group"
          aria-label="Densité du tableau"
          className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5"
        >
          {(['comfortable', 'compact'] as Density[]).map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={density === d}
              onClick={() => setDensity(d)}
              className={cn(
                'flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium transition-colors',
                density === d ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100',
              )}
            >
              {d === 'compact' ? <Rows4 aria-hidden className="h-3.5 w-3.5" /> : <Rows2 aria-hidden className="h-3.5 w-3.5" />}
              {d === 'compact' ? 'Compact' : 'Confortable'}
            </button>
          ))}
        </div>
      </div>

      {/* Filtres actifs */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-ink-25 px-3 py-2">
          <span className="text-xs font-medium text-ink-500">Filtres actifs</span>
          {activeChips.map((f) => (
            <Chip key={f.id} onRemove={() => setActive((a) => ({ ...a, [f.id]: '' }))}>
              {f.label} : {f.options.find((o) => o.value === active[f.id])?.label}
            </Chip>
          ))}
          <button
            type="button"
            onClick={() => setActive({})}
            className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* Actions groupées */}
      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-brand-100 bg-brand-50 px-3 py-2">
          <p className="ac-num text-[0.8125rem] font-medium text-brand-800" aria-live="polite">
            {selected.length} ligne{selected.length > 1 ? 's' : ''} sélectionnée{selected.length > 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2">{bulkActions?.(selectedRows, () => setSelected([]))}</div>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setSelected([])}
            iconLeft={<X aria-hidden className="h-3.5 w-3.5" />}
          >
            Annuler la sélection
          </Button>
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <SkeletonTable rows={5} />
      ) : total === 0 ? (
        <EmptyState
          icon={emptyIcon ?? <Search />}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          compact
        />
      ) : (
        <div className="ac-scroll overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr className="border-b border-ink-100 bg-ink-25">
                <th scope="col" className={cn('w-10 pl-3', cellPad)}>
                  <Checkbox
                    checked={allOnPageSelected}
                    indeterminate={someOnPageSelected}
                    onChange={(e) =>
                      setSelected((s) =>
                        e.target.checked
                          ? Array.from(new Set([...s, ...pageRows.map((r) => r.id)]))
                          : s.filter((id) => !pageRows.some((r) => r.id === id)),
                      )
                    }
                    aria-label="Sélectionner toutes les lignes de la page"
                  />
                </th>
                {visibleColumns.map((col) => {
                  const sorted = sort?.id === col.id
                  const SortIcon = !sorted ? ArrowDownUp : sort!.dir === 'asc' ? ArrowUp : ArrowDown
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      style={{ width: col.width }}
                      aria-sort={sorted ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={cn('text-2xs font-semibold uppercase tracking-wide text-ink-500', cellPad, col.align === 'right' && 'text-right')}
                    >
                      {col.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.id)}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded transition-colors hover:text-ink-900',
                            col.align === 'right' && 'flex-row-reverse',
                            sorted && 'text-ink-900',
                          )}
                        >
                          {col.header}
                          <SortIcon aria-hidden className={cn('h-3 w-3', !sorted && 'opacity-40')} />
                          <span className="sr-only">
                            {sorted ? (sort!.dir === 'asc' ? '— trié croissant' : '— trié décroissant') : '— activer le tri'}
                          </span>
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  )
                })}
                {rowActions.length > 0 && (
                  <th scope="col" className={cn('w-12', cellPad)}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {pageRows.map((row) => {
                const isSelected = selected.includes(row.id)
                return (
                  <tr
                    key={row.id}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              onRowClick(row)
                            }
                          }
                        : undefined
                    }
                    aria-label={getRowLabel ? `Ouvrir la fiche de ${getRowLabel(row)}` : undefined}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-ink-25 focus-visible:bg-ink-25',
                      isSelected && 'bg-brand-50/60',
                    )}
                  >
                    <td className={cn('pl-3', cellPad)} onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) =>
                          setSelected((s) => (e.target.checked ? [...s, row.id] : s.filter((id) => id !== row.id)))
                        }
                        aria-label={`Sélectionner ${getRowLabel?.(row) ?? row.id}`}
                      />
                    </td>
                    {visibleColumns.map((col) => (
                      <td
                        key={col.id}
                        className={cn('text-[0.8125rem] text-ink-700', cellPad, col.align === 'right' && 'text-right')}
                      >
                        {col.cell(row)}
                      </td>
                    ))}
                    {rowActions.length > 0 && (
                      <td className={cellPad} onClick={(e) => e.stopPropagation()}>
                        <Menu
                          label={`Actions pour ${getRowLabel?.(row) ?? 'cette ligne'}`}
                          items={rowActions.flatMap<MenuItem>((a) =>
                            a.separatorBefore
                              ? [{ type: 'separator' }, { label: a.label, icon: a.icon, danger: a.danger, onSelect: () => a.onSelect(row) }]
                              : [{ label: a.label, icon: a.icon, danger: a.danger, onSelect: () => a.onSelect(row) }],
                          )}
                          trigger={({ toggle, open, ref }) => (
                            <Button
                              ref={ref}
                              variant="icon"
                              size="sm"
                              label={`Actions pour ${getRowLabel?.(row) ?? 'cette ligne'}`}
                              aria-expanded={open}
                              aria-haspopup="menu"
                              onClick={toggle}
                            >
                              <MoreHorizontal aria-hidden className="h-4 w-4" />
                            </Button>
                          )}
                        />
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && total > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1) }} />
      )}
    </div>
  )
}
