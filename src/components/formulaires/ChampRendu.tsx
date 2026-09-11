import { PenLine, UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Checkbox, Radio } from '@/components/ui/Toggle'
import { typeEffectif, type Champ } from '@/lib/formulaires'

type Valeur = string | string[]

function Etoile({ obligatoire }: { obligatoire: boolean }) {
  if (!obligatoire) return null
  return (
    <span className="ml-1 text-danger-500" aria-hidden>
      *
    </span>
  )
}

/**
 * Rend le contrôle de saisie d'un champ, tel que le verra un répondant.
 * Purement local : aucune réponse n'est jamais transmise ni conservée.
 */
export function ChampRendu({
  champ,
  valeur,
  onChange,
}: {
  champ: Champ
  valeur: Valeur | undefined
  onChange: (v: Valeur) => void
}) {
  const t = typeEffectif(champ)

  if (t === 'section') {
    return (
      <div className="border-b border-ink-200 pb-2 pt-4 first:pt-0">
        <h3 className="font-display text-[1.0625rem] font-semibold text-ink-950">{champ.label}</h3>
        {champ.aide && <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-500">{champ.aide}</p>}
      </div>
    )
  }

  if (champ.type === 'consentement') {
    return (
      <Checkbox
        label={
          <>
            {champ.consentementTexte || champ.label}
            <Etoile obligatoire={champ.obligatoire} />
          </>
        }
        checked={valeur === 'oui'}
        onChange={(e) => onChange(e.target.checked ? 'oui' : 'non')}
      />
    )
  }

  if (champ.type === 'signature') {
    const signee = valeur === 'signee'
    return (
      <div>
        <p className="mb-1.5 text-[0.8125rem] font-medium text-ink-800">
          {champ.label}
          <Etoile obligatoire={champ.obligatoire} />
        </p>
        <button
          type="button"
          onClick={() => onChange(signee ? '' : 'signee')}
          className={cn(
            'flex h-24 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed text-[0.8125rem] transition-colors',
            signee ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-300 text-ink-500 hover:border-ink-400 hover:bg-ink-25',
          )}
        >
          <PenLine aria-hidden className="h-5 w-5" />
          {signee ? 'Signature apposée — cliquez pour effacer' : 'Cliquez pour signer'}
        </button>
      </div>
    )
  }

  if (champ.type === 'fichier') {
    const nomFichier = typeof valeur === 'string' ? valeur : ''
    return (
      <div>
        <p className="mb-1.5 text-[0.8125rem] font-medium text-ink-800">
          {champ.label}
          <Etoile obligatoire={champ.obligatoire} />
        </p>
        <button
          type="button"
          onClick={() => onChange(nomFichier ? '' : 'document-depose.pdf')}
          className={cn(
            'flex h-20 w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-[0.8125rem] transition-colors',
            nomFichier ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-300 text-ink-500 hover:border-ink-400 hover:bg-ink-25',
          )}
        >
          <UploadCloud aria-hidden className="h-5 w-5" />
          {nomFichier || 'Cliquez pour déposer un fichier'}
        </button>
        {champ.aide && <p className="mt-1 text-xs text-ink-500">{champ.aide}</p>}
      </div>
    )
  }

  if (t === 'choix_unique') {
    return (
      <fieldset>
        <legend className="mb-1.5 text-[0.8125rem] font-medium text-ink-800">
          {champ.label}
          <Etoile obligatoire={champ.obligatoire} />
        </legend>
        <div className="flex flex-col gap-2">
          {champ.options.map((o) => (
            <Radio key={o} name={champ.id} label={o} checked={valeur === o} onChange={() => onChange(o)} />
          ))}
        </div>
      </fieldset>
    )
  }

  if (t === 'choix_multiple') {
    const liste = Array.isArray(valeur) ? valeur : []
    return (
      <fieldset>
        <legend className="mb-1.5 text-[0.8125rem] font-medium text-ink-800">
          {champ.label}
          <Etoile obligatoire={champ.obligatoire} />
        </legend>
        <div className="flex flex-col gap-2">
          {champ.options.map((o) => (
            <Checkbox
              key={o}
              label={o}
              checked={liste.includes(o)}
              onChange={(e) => onChange(e.target.checked ? [...liste, o] : liste.filter((x) => x !== o))}
            />
          ))}
        </div>
      </fieldset>
    )
  }

  if (t === 'echelle') {
    const n = Number(valeur) || 0
    const paliers = Array.from({ length: champ.echelleMax - champ.echelleMin + 1 }, (_, i) => champ.echelleMin + i)
    return (
      <div>
        <p className="mb-1.5 text-[0.8125rem] font-medium text-ink-800">
          {champ.label}
          <Etoile obligatoire={champ.obligatoire} />
        </p>
        <div role="radiogroup" aria-label={champ.label} className="flex flex-wrap gap-1.5">
          {paliers.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={n === p}
              onClick={() => onChange(String(p))}
              className={cn(
                'ac-num flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
                n === p ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-200 text-ink-700 hover:border-ink-300 hover:bg-ink-25',
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-2xs text-ink-500">
          <span>{champ.echelleLabelMin}</span>
          <span>{champ.echelleLabelMax}</span>
        </div>
      </div>
    )
  }

  const texte = typeof valeur === 'string' ? valeur : ''

  return (
    <Field label={champ.label} required={champ.obligatoire} hint={champ.aide || undefined}>
      {(p) => {
        if (t === 'texte_long') return <Textarea {...p} value={texte} onChange={(e) => onChange(e.target.value)} placeholder={champ.placeholder} />
        if (t === 'liste') return <Select {...p} value={texte} onChange={(e) => onChange(e.target.value)} placeholder="Choisir…" options={champ.options.map((o) => ({ value: o, label: o }))} />
        if (t === 'adresse') return <Input {...p} value={texte} onChange={(e) => onChange(e.target.value)} placeholder="Numéro, rue, code postal, ville" />
        if (t === 'email') return <Input {...p} type="email" value={texte} onChange={(e) => onChange(e.target.value)} placeholder={champ.placeholder || 'adresse@exemple.fr'} />
        if (t === 'telephone') return <Input {...p} type="tel" value={texte} onChange={(e) => onChange(e.target.value)} placeholder={champ.placeholder || '06 12 34 56 78'} />
        if (t === 'date') return <Input {...p} type="date" value={texte} onChange={(e) => onChange(e.target.value)} />
        return <Input {...p} value={texte} onChange={(e) => onChange(e.target.value)} placeholder={champ.placeholder} />
      }}
    </Field>
  )
}
