import { useMemo } from 'react'
import { Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AUJOURDHUI_PROJET, type Jalon, type Projet } from '@/lib/projets'
import { enRetard, type Tache } from '@/lib/taches'
import { formatDate } from '@/lib/utils'

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/**
 * Diagramme de Gantt simplifié : une barre par tâche, positionnée en pourcentage
 * de la durée du projet. Les jalons apparaissent en repères verticaux.
 */
export function Gantt({ projet, taches }: { projet: Projet; taches: Tache[] }) {
  const debut = new Date(projet.dateDebut).getTime()
  const fin = new Date(projet.dateFin).getTime()
  const duree = Math.max(fin - debut, 1)

  const pct = (t: number) => Math.max(0, Math.min(100, ((t - debut) / duree) * 100))

  const mois = useMemo(() => {
    const out: { label: string; position: number }[] = []
    const d = new Date(debut)
    d.setUTCDate(1)
    while (d.getTime() <= fin) {
      const t = d.getTime()
      if (t >= debut) out.push({ label: `${MOIS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`, position: pct(t) })
      d.setUTCMonth(d.getUTCMonth() + 1)
    }
    return out
  }, [debut, fin])

  const aujourdhui = pct(AUJOURDHUI_PROJET.getTime())
  const triees = [...taches].sort((a, b) => (a.dateDebut < b.dateDebut ? -1 : 1))

  return (
    <div className="ac-scroll overflow-x-auto">
      <div className="min-w-[48rem]">
        {/* Échelle des mois */}
        <div className="relative mb-2 h-6 border-b border-ink-200">
          {mois.map((m) => (
            <span
              key={m.label}
              aria-hidden
              className="absolute top-0 -translate-x-1/2 text-2xs text-ink-500"
              style={{ left: `${m.position}%` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="relative">
          {/* Repère du jour */}
          {aujourdhui > 0 && aujourdhui < 100 && (
            <div aria-hidden className="pointer-events-none absolute inset-y-0 z-10 w-px bg-brand-500" style={{ left: `${aujourdhui}%` }}>
              <span className="absolute -top-1 -translate-x-1/2 rounded bg-brand-500 px-1 py-0.5 text-[0.5rem] font-semibold text-white">
                aujourd’hui
              </span>
            </div>
          )}

          {/* Jalons */}
          {projet.jalons.map((j: Jalon) => {
            const p = pct(new Date(j.date).getTime())
            const couleur = j.statut === 'atteint' ? 'bg-success-500' : j.statut === 'manque' ? 'bg-danger-500' : 'bg-warning-500'
            return (
              <div key={j.id} aria-hidden className="pointer-events-none absolute inset-y-0 w-px border-l border-dashed border-ink-300" style={{ left: `${p}%` }}>
                <span className={cn('absolute -bottom-1 flex h-3 w-3 -translate-x-1/2 items-center justify-center rounded-sm', couleur)} />
              </div>
            )
          })}

          <ul className="relative flex flex-col gap-1.5 py-2">
            {triees.length === 0 && (
              <li className="rounded-lg border border-dashed border-ink-300 px-4 py-8 text-center text-[0.8125rem] text-ink-500">
                Aucune tâche rattachée : le diagramme se remplira dès la première tâche créée sur ce projet.
              </li>
            )}
            {triees.map((t) => {
              const d = pct(new Date(t.dateDebut).getTime())
              const f = pct(new Date(t.echeance).getTime())
              const largeur = Math.max(f - d, 1.5)
              const retard = enRetard(t)
              return (
                <li key={t.id} className="grid grid-cols-[13rem_minmax(0,1fr)] items-center gap-3">
                  <span className="truncate text-[0.8125rem] text-ink-700" title={t.titre}>
                    {t.titre}
                  </span>
                  <span className="relative h-6">
                    <span
                      className={cn(
                        'absolute top-1 flex h-4 items-center rounded px-1.5 text-[0.5rem] font-medium text-white',
                        t.statut === 'termine' ? 'bg-success-500' : retard ? 'bg-danger-500' : t.statut === 'en_cours' ? 'bg-brand-500' : 'bg-ink-400',
                      )}
                      style={{ left: `${d}%`, width: `${largeur}%` }}
                      title={`${t.titre} — du ${formatDate(t.dateDebut)} au ${formatDate(t.echeance)}`}
                    >
                      <span className="truncate">{t.responsable.split(' ')[0]}</span>
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>

        {/* Légende */}
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-ink-100 pt-3 text-2xs text-ink-500">
          {[
            ['bg-ink-400', 'À faire'],
            ['bg-brand-500', 'En cours'],
            ['bg-success-500', 'Terminé'],
            ['bg-danger-500', 'En retard'],
          ].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1.5">
              <span aria-hidden className={cn('h-2.5 w-4 rounded-sm', c)} />
              {l}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <Flag aria-hidden className="h-3 w-3" />
            Repères verticaux : jalons du projet
          </span>
        </div>

        {/* Équivalent textuel */}
        <table className="sr-only">
          <caption>Planning des tâches du projet {projet.nom}</caption>
          <thead>
            <tr>
              <th scope="col">Tâche</th>
              <th scope="col">Début</th>
              <th scope="col">Échéance</th>
              <th scope="col">Responsable</th>
              <th scope="col">Statut</th>
            </tr>
          </thead>
          <tbody>
            {triees.map((t) => (
              <tr key={t.id}>
                <th scope="row">{t.titre}</th>
                <td>{formatDate(t.dateDebut)}</td>
                <td>{formatDate(t.echeance)}</td>
                <td>{t.responsable}</td>
                <td>{t.statut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
