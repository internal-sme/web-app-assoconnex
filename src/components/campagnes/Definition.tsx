import { Info } from 'lucide-react'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Field } from '@/components/ui/Field'
import { cn } from '@/lib/utils'
import {
  definitionEstVide,
  decompteSegment,
  groupesDisponibles,
  statutAdhesionLabels,
  statutsAdhesionDisponibles,
  tagsDisponibles,
  type SegmentDefinition,
} from '@/lib/campagnes'
import { useCampagnes } from '@/context/CampagnesContext'

/**
 * Éditeur partagé d'une définition de segment : groupes, tags et statuts
 * d'adhésion, avec le décompte en direct des personnes retenues et des écarts.
 */
export function DefinitionEditeur({
  definition,
  onChange,
}: {
  definition: SegmentDefinition
  onChange: (d: SegmentDefinition) => void
}) {
  const { desinscritsIds } = useCampagnes()
  const d = definition
  const decompte = decompteSegment(d, desinscritsIds)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Groupes" hint="Ou : le contact est retenu s'il appartient à au moins un groupe choisi.">
          {(props) => (
            <MultiSelect
              {...props}
              options={groupesDisponibles.map((g) => ({ value: g, label: g }))}
              value={d.groupes}
              onChange={(v) => onChange({ ...d, groupes: v })}
              placeholder="Tous les groupes…"
            />
          )}
        </Field>

        <Field label="Tags" hint="Ou : un seul tag suffit pour retenir le contact.">
          {(props) => (
            <MultiSelect
              {...props}
              options={tagsDisponibles.map((t) => ({ value: t, label: t }))}
              value={d.tags}
              onChange={(v) => onChange({ ...d, tags: v })}
              placeholder="Tous les tags…"
            />
          )}
        </Field>

        <Field label="Statut d'adhésion" hint="Les adhérents dont le statut correspond à l'un de ceux choisis.">
          {(props) => (
            <MultiSelect
              {...props}
              options={statutsAdhesionDisponibles.map((s) => ({ value: s, label: statutAdhesionLabels[s] }))}
              value={d.statutsAdhesion}
              onChange={(v) => onChange({ ...d, statutsAdhesion: v as SegmentDefinition['statutsAdhesion'] })}
              placeholder="Tous les statuts…"
            />
          )}
        </Field>
      </div>

      {definitionEstVide(d) && (
        <p className="rounded-lg border border-ink-200 bg-ink-25 px-3 py-2 text-xs text-ink-600">
          Aucun critère : le segment retiendrait toutes les personnes joignables de l'annuaire.
        </p>
      )}

      <div className="rounded-xl border border-brand-100 bg-brand-50 p-3.5">
        <p className="text-[0.8125rem] font-semibold text-brand-800">
          {decompte.joignables.toLocaleString('fr-FR')} personne{decompte.joignables > 1 ? 's' : ''} joignable
          {decompte.joignables > 1 ? 's' : ''}
        </p>
        {decompte.total > decompte.joignables && (
          <p className="mt-1 text-xs text-brand-700">
            {decompte.total - decompte.joignables} exclue{decompte.total - decompte.joignables > 1 ? 's' : ''} du périmètre ({decompte.total} retenu
            {decompte.total > 1 ? 's' : ''} avant exclusions).
          </p>
        )}
        <ul className="mt-2 flex flex-col gap-1">
          {decompte.ecarts
            .filter((e) => e.nombre > 0)
            .map((e) => (
              <li key={e.motif} className="flex items-start gap-2 text-xs text-brand-700">
                <Info aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <strong>{e.nombre}</strong> {e.label.toLowerCase()} — {e.detail}
                </span>
              </li>
            ))}
          {decompte.ecarts.every((e) => e.nombre === 0) && (
            <li className={cn('text-xs')}>Aucune exclusion : personne écartée ou refusée sur ce périmètre.</li>
          )}
        </ul>
      </div>
    </div>
  )
}