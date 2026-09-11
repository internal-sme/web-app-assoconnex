import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { champLabels, champTailles, type Champ, type Signataire, type TypeChamp } from '@/lib/signatures'
import { uid } from '@/lib/utils'

const couleurs = ['#2364AA', '#127A4C', '#9A5B00', '#B42318', '#525A66']

/**
 * Éditeur de placement des champs sur le document.
 * Les positions sont exprimées en pourcentage de la page : elles restent justes
 * quel que soit le zoom ou la taille d'écran.
 */
export function EditeurPlacement({
  pages,
  champs,
  signataires,
  onChange,
  lectureSeule = false,
}: {
  pages: number
  champs: Champ[]
  signataires: Signataire[]
  onChange: (champs: Champ[]) => void
  lectureSeule?: boolean
}) {
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [typeActif, setTypeActif] = useState<TypeChamp>('signature')
  const [signataireActif, setSignataireActif] = useState(signataires[0]?.id ?? '')
  const [selection, setSelection] = useState<string | null>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const glisse = useRef<{ id: string; dx: number; dy: number } | null>(null)

  const couleurDe = (signataireId: string) => couleurs[Math.max(0, signataires.findIndex((s) => s.id === signataireId)) % couleurs.length]
  const champsDeLaPage = champs.filter((c) => c.page === page)

  const poser = (e: React.MouseEvent) => {
    if (lectureSeule || !pageRef.current || !signataireActif) return
    const r = pageRef.current.getBoundingClientRect()
    const taille = champTailles[typeActif]
    const x = Math.min(100 - taille.largeur, Math.max(0, ((e.clientX - r.left) / r.width) * 100 - taille.largeur / 2))
    const y = Math.min(100 - taille.hauteur, Math.max(0, ((e.clientY - r.top) / r.height) * 100 - taille.hauteur / 2))
    const nouveau: Champ = {
      id: uid('ch'),
      type: typeActif,
      signataireId: signataireActif,
      page,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      largeur: taille.largeur,
      hauteur: taille.hauteur,
      obligatoire: typeActif === 'signature',
      libelle: champLabels[typeActif],
    }
    onChange([...champs, nouveau])
    setSelection(nouveau.id)
  }

  const deplacerAuClavier = (id: string, dx: number, dy: number) => {
    onChange(
      champs.map((c) =>
        c.id === id
          ? { ...c, x: Math.min(100 - c.largeur, Math.max(0, c.x + dx)), y: Math.min(100 - c.hauteur, Math.max(0, c.y + dy)) }
          : c,
      ),
    )
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {!lectureSeule && (
        <div className="flex shrink-0 flex-col gap-4 lg:w-60">
          <div className="rounded-xl border border-ink-200 bg-white p-3 shadow-xs">
            <p className="text-[0.8125rem] font-semibold text-ink-900">Champ à poser</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">
              Choisissez un type, puis cliquez sur la page pour le déposer.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {(Object.keys(champLabels) as TypeChamp[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={typeActif === t}
                  onClick={() => setTypeActif(t)}
                  className={cn(
                    'rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors',
                    typeActif === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-600 hover:bg-ink-50',
                  )}
                >
                  {champLabels[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-ink-200 bg-white p-3 shadow-xs">
            <p className="text-[0.8125rem] font-semibold text-ink-900">Pour quel signataire</p>
            <div className="mt-2 flex flex-col gap-1">
              {signataires.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={signataireActif === s.id}
                  onClick={() => setSignataireActif(s.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors',
                    signataireActif === s.id ? 'bg-ink-100 font-medium text-ink-900' : 'text-ink-600 hover:bg-ink-50',
                  )}
                >
                  <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: couleurDe(s.id) }} />
                  <span className="min-w-0 flex-1 truncate">{s.nom}</span>
                  <span className="ac-num text-2xs text-ink-500">{champs.filter((c) => c.signataireId === s.id).length}</span>
                </button>
              ))}
            </div>
          </div>

          {selection && (
            <div className="rounded-xl border border-ink-200 bg-white p-3 shadow-xs">
              <p className="text-[0.8125rem] font-semibold text-ink-900">Champ sélectionné</p>
              <p className="mt-1 text-xs text-ink-500">
                Déplacez-le à la souris, ou avec les flèches du clavier une fois sélectionné.
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-danger-600"
                onClick={() => {
                  onChange(champs.filter((c) => c.id !== selection))
                  setSelection(null)
                }}
                iconLeft={<Trash2 aria-hidden className="h-3.5 w-3.5" />}
              >
                Retirer ce champ
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Button variant="icon" size="sm" label="Page précédente" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft aria-hidden className="h-4 w-4" />
            </Button>
            <span className="ac-num px-2 text-[0.8125rem] text-ink-700" aria-live="polite">
              Page {page} sur {pages}
            </span>
            <Button variant="icon" size="sm" label="Page suivante" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight aria-hidden className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="icon" size="sm" label="Réduire le zoom" disabled={zoom <= 0.6} onClick={() => setZoom((z) => Math.round((z - 0.2) * 10) / 10)}>
              <ZoomOut aria-hidden className="h-4 w-4" />
            </Button>
            <span className="ac-num px-1 text-[0.8125rem] text-ink-700">{Math.round(zoom * 100)} %</span>
            <Button variant="icon" size="sm" label="Augmenter le zoom" disabled={zoom >= 1.6} onClick={() => setZoom((z) => Math.round((z + 0.2) * 10) / 10)}>
              <ZoomIn aria-hidden className="h-4 w-4" />
            </Button>
            <Badge variant="outline">{champsDeLaPage.length} champ(s) sur la page</Badge>
          </div>
        </div>

        <div className="ac-scroll overflow-auto rounded-xl border border-ink-200 bg-ink-100 p-4">
          <div
            ref={pageRef}
            onClick={poser}
            className={cn('relative mx-auto bg-white shadow-md', lectureSeule ? 'cursor-default' : 'cursor-crosshair')}
            style={{ width: `${620 * zoom}px`, height: `${877 * zoom}px` }}
          >
            {/* Rendu simplifié de la page du document */}
            <div aria-hidden className="pointer-events-none absolute inset-0 p-10">
              <div className="h-4 w-2/5 rounded bg-ink-200" />
              <div className="mt-6 space-y-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="h-2 rounded bg-ink-100" style={{ width: `${55 + ((i * 37) % 42)}%` }} />
                ))}
              </div>
              <div className="mt-8 space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-2 rounded bg-ink-100" style={{ width: `${48 + ((i * 53) % 48)}%` }} />
                ))}
              </div>
              <p className="ac-num absolute bottom-6 right-10 text-2xs text-ink-400">Page {page} / {pages}</p>
            </div>

            {champsDeLaPage.map((c) => {
              const couleur = couleurDe(c.signataireId)
              const signataire = signataires.find((s) => s.id === c.signataireId)
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`${champLabels[c.type]} pour ${signataire?.nom ?? 'signataire'}, page ${c.page}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelection(c.id)
                  }}
                  onKeyDown={(e) => {
                    if (lectureSeule) return
                    const pas = e.shiftKey ? 5 : 1
                    if (e.key === 'ArrowLeft') { e.preventDefault(); deplacerAuClavier(c.id, -pas, 0) }
                    if (e.key === 'ArrowRight') { e.preventDefault(); deplacerAuClavier(c.id, pas, 0) }
                    if (e.key === 'ArrowUp') { e.preventDefault(); deplacerAuClavier(c.id, 0, -pas) }
                    if (e.key === 'ArrowDown') { e.preventDefault(); deplacerAuClavier(c.id, 0, pas) }
                    if ((e.key === 'Delete' || e.key === 'Backspace') && !lectureSeule) {
                      e.preventDefault()
                      onChange(champs.filter((x) => x.id !== c.id))
                    }
                  }}
                  onMouseDown={(e) => {
                    if (lectureSeule || !pageRef.current) return
                    e.stopPropagation()
                    const r = pageRef.current.getBoundingClientRect()
                    glisse.current = {
                      id: c.id,
                      dx: ((e.clientX - r.left) / r.width) * 100 - c.x,
                      dy: ((e.clientY - r.top) / r.height) * 100 - c.y,
                    }
                    const bouger = (ev: MouseEvent) => {
                      if (!glisse.current || !pageRef.current) return
                      const rect = pageRef.current.getBoundingClientRect()
                      const nx = ((ev.clientX - rect.left) / rect.width) * 100 - glisse.current.dx
                      const ny = ((ev.clientY - rect.top) / rect.height) * 100 - glisse.current.dy
                      onChange(
                        champs.map((x) =>
                          x.id === glisse.current!.id
                            ? {
                                ...x,
                                x: Math.round(Math.min(100 - x.largeur, Math.max(0, nx)) * 10) / 10,
                                y: Math.round(Math.min(100 - x.hauteur, Math.max(0, ny)) * 10) / 10,
                              }
                            : x,
                        ),
                      )
                    }
                    const relacher = () => {
                      glisse.current = null
                      window.removeEventListener('mousemove', bouger)
                      window.removeEventListener('mouseup', relacher)
                    }
                    window.addEventListener('mousemove', bouger)
                    window.addEventListener('mouseup', relacher)
                  }}
                  className={cn(
                    'absolute flex items-center justify-center rounded border-2 border-dashed text-2xs font-medium transition-shadow',
                    selection === c.id ? 'shadow-md ring-2 ring-offset-1' : '',
                    lectureSeule ? 'cursor-default' : 'cursor-move',
                  )}
                  style={{
                    left: `${c.x}%`,
                    top: `${c.y}%`,
                    width: `${c.largeur}%`,
                    height: `${c.hauteur}%`,
                    borderColor: couleur,
                    color: couleur,
                    backgroundColor: `${couleur}14`,
                  }}
                >
                  <span className="truncate px-1">{champLabels[c.type]}</span>
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          Cliquez sur la page pour poser un champ, faites-le glisser pour l'ajuster. Une fois sélectionné, les flèches
          du clavier le déplacent d'un pas — cinq pas avec Maj — et Suppr le retire.
        </p>
      </div>
    </div>
  )
}
