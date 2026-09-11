import { useId } from 'react'
import { cn } from '@/lib/utils'

/** Tableau de données équivalent, lisible par les lecteurs d'écran. */
function TableauEquivalent({
  titre,
  entetes,
  lignes,
}: {
  titre: string
  entetes: string[]
  lignes: (string | number)[][]
}) {
  return (
    <table className="sr-only">
      <caption>{titre}</caption>
      <thead>
        <tr>
          {entetes.map((e) => (
            <th key={e} scope="col">
              {e}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lignes.map((l, i) => (
          <tr key={i}>
            {l.map((c, j) =>
              j === 0 ? (
                <th key={j} scope="row">
                  {c}
                </th>
              ) : (
                <td key={j}>{c}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ------------------------------------------------------------------ */

export function LineChart({
  points,
  titre,
  unite = '',
  className,
}: {
  points: { label: string; valeur: number }[]
  titre: string
  unite?: string
  className?: string
}) {
  const id = useId()
  const w = 640
  const h = 200
  const padX = 8
  const padY = 16
  const max = Math.max(...points.map((p) => p.valeur), 1)
  const min = Math.min(...points.map((p) => p.valeur), 0)
  const span = Math.max(max - min, 1)

  const x = (i: number) => padX + (i * (w - padX * 2)) / Math.max(points.length - 1, 1)
  const y = (v: number) => padY + (1 - (v - min) / span) * (h - padY * 2)

  const ligne = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.valeur).toFixed(1)}`).join(' ')
  const aire = `${ligne} L${x(points.length - 1).toFixed(1)},${h - padY} L${x(0).toFixed(1)},${h - padY} Z`

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-48 w-full"
        role="img"
        aria-label={`${titre}. De ${points[0]?.valeur ?? 0} à ${points[points.length - 1]?.valeur ?? 0}${unite}.`}
      >
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2364AA" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#2364AA" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={w - padX}
            y1={padY + f * (h - padY * 2)}
            y2={padY + f * (h - padY * 2)}
            stroke="#EDEFF2"
            strokeWidth="1"
          />
        ))}
        <path d={aire} fill={`url(#grad-${id})`} />
        <path d={ligne} fill="none" stroke="#2364AA" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={p.label} cx={x(i)} cy={y(p.valeur)} r={i === points.length - 1 ? 4 : 2.5} fill="#2364AA">
            <title>
              {p.label} : {p.valeur}
              {unite}
            </title>
          </circle>
        ))}
      </svg>
      <div aria-hidden className="mt-1 flex justify-between text-2xs text-ink-500">
        <span>{points[0]?.label}</span>
        <span>{points[Math.floor(points.length / 2)]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
      <TableauEquivalent
        titre={titre}
        entetes={['Période', 'Valeur']}
        lignes={points.map((p) => [p.label, p.valeur])}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */

const HAUTEUR_TRACE = 148

export function GroupedBars({
  data,
  titre,
  series,
  className,
  colonneLabel = 'Catégorie',
  formatValeur = (v: number) => String(v),
}: {
  data: { label: string; [k: string]: string | number }[]
  titre: string
  series: { key: string; label: string; couleur: string; motif?: boolean }[]
  className?: string
  /** En-tête de la première colonne du tableau équivalent. */
  colonneLabel?: string
  /** Mise en forme des valeurs affichées au-dessus des barres. */
  formatValeur?: (v: number) => string
}) {
  const max = Math.max(...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)), 1)

  if (data.length === 0) {
    return (
      <p className={cn('py-8 text-center text-[0.8125rem] text-ink-500', className)}>
        Aucune donnée à représenter pour l’instant.
      </p>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-ink-600">
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundColor: s.couleur,
                backgroundImage: s.motif
                  ? 'repeating-linear-gradient(45deg, rgba(255,255,255,.85) 0 2px, transparent 2px 4px)'
                  : undefined,
              }}
            />
            {s.label}
          </span>
        ))}
      </div>

      {/* La hauteur des barres est calculée en pixels : une hauteur en pourcentage
          ne se résout pas dans un conteneur flex dont la hauteur reste automatique. */}
      <div role="img" aria-label={titre} className="ac-scroll overflow-x-auto pt-5">
        <div className="flex min-w-full items-end gap-4" style={{ height: `${HAUTEUR_TRACE}px` }}>
          {data.map((d) => (
            <div key={d.label} className="flex min-w-[3.5rem] flex-1 flex-col items-center justify-end gap-2">
              <div className="flex w-full items-end justify-center gap-1" style={{ height: `${HAUTEUR_TRACE}px` }}>
                {series.map((s) => {
                  const v = Number(d[s.key]) || 0
                  const hauteur = v > 0 ? Math.max(Math.round((v / max) * HAUTEUR_TRACE), 4) : 0
                  return (
                    <div
                      key={s.key}
                      className="relative w-full max-w-[1.75rem] rounded-t"
                      style={{
                        height: `${hauteur}px`,
                        backgroundColor: v > 0 ? s.couleur : 'transparent',
                        backgroundImage:
                          s.motif && v > 0
                            ? 'repeating-linear-gradient(45deg, rgba(255,255,255,.85) 0 2px, transparent 2px 4px)'
                            : undefined,
                      }}
                    >
                      <span className="ac-num absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-2xs font-semibold text-ink-700">
                        {formatValeur(v)}
                      </span>
                    </div>
                  )
                })}
              </div>
              <span className="w-full truncate text-center text-2xs text-ink-500" title={d.label}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <TableauEquivalent
        titre={titre}
        entetes={[colonneLabel, ...series.map((s) => s.label)]}
        lignes={data.map((d) => [String(d.label), ...series.map((s) => Number(d[s.key]) || 0)])}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */

export function HorizontalBars({
  data,
  titre,
  total,
  className,
}: {
  data: { label: string; valeur: number }[]
  titre: string
  total: number
  className?: string
}) {
  const max = Math.max(...data.map((d) => d.valeur), 1)
  return (
    <div className={cn('flex flex-col gap-3', className)} role="img" aria-label={titre}>
      {data.map((d) => {
        const pct = total === 0 ? 0 : Math.round((d.valeur / total) * 100)
        return (
          <div key={d.label} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-[0.8125rem] text-ink-600">{d.label}</span>
            <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-100">
              <span
                className="block h-full rounded-full bg-brand-500"
                style={{ width: `${Math.max((d.valeur / max) * 100, d.valeur > 0 ? 2 : 0)}%` }}
              />
            </span>
            <span className="ac-num w-20 shrink-0 text-right text-[0.8125rem] text-ink-700">
              {d.valeur} · {pct} %
            </span>
          </div>
        )
      })}
      <TableauEquivalent
        titre={titre}
        entetes={['Tranche d’âge', 'Adhérents']}
        lignes={data.map((d) => [d.label, d.valeur])}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Anneau de progression                                               */
/* ------------------------------------------------------------------ */

export function AnneauProgression({
  titre,
  valeur,
  segments,
  className,
}: {
  titre: string
  /** Nombre affiché au centre. */
  valeur: number
  /** Anneaux concentriques, du plus extérieur au plus intérieur. */
  segments: { label: string; part: number; couleur: string }[]
  className?: string
}) {
  const taille = 200
  const centre = taille / 2
  const epaisseur = 14
  const ecart = 6

  return (
    <div className={cn('flex w-full items-center justify-center', className)}>
      <div className="relative">
        <svg viewBox={`0 0 ${taille} ${taille}`} className="h-48 w-48" role="img" aria-label={titre}>
          {segments.map((s, i) => {
            const rayon = centre - epaisseur / 2 - i * (epaisseur + ecart)
            const circonference = 2 * Math.PI * rayon
            const part = Math.max(0, Math.min(1, s.part))
            return (
              <g key={s.label}>
                <circle cx={centre} cy={centre} r={rayon} fill="none" stroke="#EEF1F4" strokeWidth={epaisseur} />
                <circle
                  cx={centre}
                  cy={centre}
                  r={rayon}
                  fill="none"
                  stroke={s.couleur}
                  strokeWidth={epaisseur}
                  strokeLinecap="round"
                  strokeDasharray={`${circonference * part} ${circonference}`}
                  transform={`rotate(-90 ${centre} ${centre})`}
                />
              </g>
            )
          })}
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="ac-num font-display text-3xl font-semibold text-brand-700">{valeur}</span>
        </span>
      </div>

      <TableauEquivalent
        titre={titre}
        entetes={['Série', 'Part']}
        lignes={segments.map((s) => [s.label, `${Math.round(s.part * 100)} %`])}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Courbes superposées                                                 */
/* ------------------------------------------------------------------ */

export function CourbesSuperposees({
  labels,
  series,
  titre,
  className,
}: {
  labels: string[]
  series: { nom: string; couleur: string; valeurs: number[] }[]
  titre: string
  className?: string
}) {
  const w = 640
  const h = 210
  const padX = 10
  const padY = 18
  const max = Math.max(...series.flatMap((s) => s.valeurs), 1)

  const x = (i: number) => padX + (i * (w - padX * 2)) / Math.max(labels.length - 1, 1)
  const y = (v: number) => padY + (1 - v / max) * (h - padY * 2)

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex flex-wrap items-center justify-end gap-4">
        {series.map((s) => (
          <span key={s.nom} className="flex items-center gap-1.5 text-xs text-ink-600">
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: s.couleur }} />
            {s.nom}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full" role="img" aria-label={titre} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={padX} x2={w - padX} y1={padY + p * (h - padY * 2)} y2={padY + p * (h - padY * 2)} stroke="#EEF1F4" strokeWidth={1} />
        ))}
        {series.map((s) => (
          <path
            key={s.nom}
            d={s.valeurs.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')}
            fill="none"
            stroke={s.couleur}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1">
        {labels.map((l) => (
          <span key={l} className="text-2xs text-ink-500">
            {l}
          </span>
        ))}
      </div>

      <TableauEquivalent
        titre={titre}
        entetes={['Mois', ...series.map((s) => s.nom)]}
        lignes={labels.map((l, i) => [l, ...series.map((s) => s.valeurs[i] ?? 0)])}
      />
    </div>
  )
}
