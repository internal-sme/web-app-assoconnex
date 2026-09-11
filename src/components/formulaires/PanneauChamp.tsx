import { Plus, X } from 'lucide-react'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'
import {
  champAvecOptions,
  champEstEchelle,
  champLabels,
  sousTypesConditionnels,
  typeEffectif,
  type Champ,
} from '@/lib/formulaires'

function EditeurOptions({ champ, onChange }: { champ: Champ; onChange: (patch: Partial<Champ>) => void }) {
  return (
    <Field label="Options" hint="Une réponse possible par ligne.">
      {() => (
        <div className="flex flex-col gap-1.5">
          {champ.options.map((o, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Input
                value={o}
                onChange={(e) => onChange({ options: champ.options.map((x, k) => (k === i ? e.target.value : x)) })}
                placeholder={`Option ${i + 1}`}
              />
              <Button
                variant="icon"
                size="sm"
                label={`Retirer l’option ${i + 1}`}
                disabled={champ.options.length <= 1}
                onClick={() => onChange({ options: champ.options.filter((_, k) => k !== i) })}
              >
                <X aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            className="self-start"
            onClick={() => onChange({ options: [...champ.options, `Option ${champ.options.length + 1}`] })}
            iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}
          >
            Ajouter une option
          </Button>
        </div>
      )}
    </Field>
  )
}

function EditeurEchelle({ champ, onChange }: { champ: Champ; onChange: (patch: Partial<Champ>) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Valeur minimale">
        {(p) => <Input {...p} type="number" min={0} max={champ.echelleMax - 1} value={String(champ.echelleMin)} onChange={(e) => onChange({ echelleMin: Number(e.target.value) || 0 })} />}
      </Field>
      <Field label="Valeur maximale">
        {(p) => <Input {...p} type="number" min={champ.echelleMin + 1} max={10} value={String(champ.echelleMax)} onChange={(e) => onChange({ echelleMax: Number(e.target.value) || champ.echelleMin + 1 })} />}
      </Field>
      <Field label="Libellé du minimum" className="col-span-2">
        {(p) => <Input {...p} value={champ.echelleLabelMin} onChange={(e) => onChange({ echelleLabelMin: e.target.value })} />}
      </Field>
      <Field label="Libellé du maximum" className="col-span-2">
        {(p) => <Input {...p} value={champ.echelleLabelMax} onChange={(e) => onChange({ echelleLabelMax: e.target.value })} />}
      </Field>
    </div>
  )
}

/**
 * Configuration de l'affichage conditionnel : ne propose comme déclencheurs
 * que les champs qui précèdent celui-ci dans le formulaire, pour éviter les
 * références en avant et les boucles.
 */
function EditeurCondition({ champ, champsPrecedents, onChange }: { champ: Champ; champsPrecedents: Champ[]; onChange: (patch: Partial<Champ>) => void }) {
  const candidats = champsPrecedents.filter((c) => c.type !== 'section' && c.id !== champ.id)
  const source = candidats.find((c) => c.id === champ.condition?.champId)

  if (candidats.length === 0) {
    return (
      <p className="rounded-lg border border-ink-200 bg-ink-25 p-2.5 text-xs leading-relaxed text-ink-600">
        Ajoutez d’abord une autre question au-dessus de celle-ci : la condition se base sur sa réponse.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-ink-200 p-3">
      <Field label="N’afficher cette question que si">
        {(p) => (
          <Select
            {...p}
            value={champ.condition?.champId ?? ''}
            onChange={(e) => onChange({ condition: e.target.value ? { champId: e.target.value, valeur: '' } : null })}
            placeholder="Toujours affichée"
            options={candidats.map((c) => ({ value: c.id, label: c.label }))}
          />
        )}
      </Field>
      {source && (
        <Field label="est égale à">
          {(p) =>
            champAvecOptions(source) ? (
              <Select
                {...p}
                value={champ.condition?.valeur ?? ''}
                onChange={(e) => onChange({ condition: { champId: source.id, valeur: e.target.value } })}
                placeholder="Choisir une réponse"
                options={source.options.map((o) => ({ value: o, label: o }))}
              />
            ) : (
              <Input {...p} value={champ.condition?.valeur ?? ''} onChange={(e) => onChange({ condition: { champId: source.id, valeur: e.target.value } })} placeholder="Valeur attendue" />
            )
          }
        </Field>
      )}
    </div>
  )
}

export function PanneauChamp({
  champ,
  champsPrecedents,
  onChange,
}: {
  champ: Champ
  champsPrecedents: Champ[]
  onChange: (patch: Partial<Champ>) => void
}) {
  const t = typeEffectif(champ)
  const avecPlaceholder = ['texte', 'texte_long', 'email', 'telephone', 'adresse'].includes(t)

  return (
    <div className="flex flex-col gap-4">
      <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">{champLabels[champ.type]}</p>

      <Field label={champ.type === 'section' ? 'Titre de la section' : 'Intitulé de la question'}>
        {(p) => <Input {...p} value={champ.label} onChange={(e) => onChange({ label: e.target.value })} />}
      </Field>

      <Field label={champ.type === 'section' ? 'Description' : 'Texte d’aide'} hint="Facultatif.">
        {(p) => <Textarea {...p} rows={2} value={champ.aide} onChange={(e) => onChange({ aide: e.target.value })} />}
      </Field>

      {avecPlaceholder && (
        <Field label="Texte d’exemple" hint="Affiché en filigrane dans le champ vide.">
          {(p) => <Input {...p} value={champ.placeholder} onChange={(e) => onChange({ placeholder: e.target.value })} />}
        </Field>
      )}

      {champAvecOptions(champ) && <EditeurOptions champ={champ} onChange={onChange} />}
      {champEstEchelle(champ) && <EditeurEchelle champ={champ} onChange={onChange} />}

      {champ.type === 'consentement' && (
        <Field label="Texte légal" hint="Affiché à côté de la case à cocher.">
          {(p) => <Textarea {...p} rows={3} value={champ.consentementTexte} onChange={(e) => onChange({ consentementTexte: e.target.value })} />}
        </Field>
      )}

      {champ.type === 'conditionnelle' && (
        <>
          <Field label="Type de question posée">
            {(p) => (
              <Select
                {...p}
                value={champ.sousType}
                onChange={(e) => onChange({ sousType: e.target.value as Champ['sousType'], options: ['choix_unique', 'choix_multiple', 'liste'].includes(e.target.value) ? ['Option 1', 'Option 2'] : champ.options })}
                options={sousTypesConditionnels.map((s) => ({ value: s.value, label: s.label }))}
              />
            )}
          </Field>
          <EditeurCondition champ={champ} champsPrecedents={champsPrecedents} onChange={onChange} />
        </>
      )}

      {champ.type !== 'section' && (
        <Switch label="Réponse obligatoire" checked={champ.obligatoire} onCheckedChange={(v) => onChange({ obligatoire: v })} />
      )}
    </div>
  )
}
