import { usePageTitle } from '@/hooks/usePageTitle'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { ArrowDown, ArrowUp, Copy, GripVertical, LayoutTemplate, RotateCcw, Save, Trash2, X } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn, uid } from '@/lib/utils'
import { FormulairePage } from '@/components/formulaires/FormulairePage'
import { IconeChamp } from '@/components/formulaires/IconeChamp'
import { PanneauChamp } from '@/components/formulaires/PanneauChamp'
import { useFormulaires } from '@/context/FormulairesContext'
import { useToast } from '@/context/ToastContext'
import {
  categoriesFormulaire,
  champLabels,
  champSaisissable,
  champVide,
  groupesPalette,
  type Champ,
  type Formulaire,
  type TypeChamp,
} from '@/lib/formulaires'

function BlocChamp({
  champ,
  index,
  total,
  selectionne,
  onSelectionner,
  onChanger,
  onDupliquer,
  onSupprimer,
  onMonter,
  onDescendre,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  champ: Champ
  index: number
  total: number
  selectionne: boolean
  onSelectionner: () => void
  onChanger: (patch: Partial<Champ>) => void
  onDupliquer: () => void
  onSupprimer: () => void
  onMonter: () => void
  onDescendre: () => void
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragEnd: () => void
}) {
  const estSection = champ.type === 'section'
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onClick={onSelectionner}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelectionner()
        }
      }}
      aria-pressed={selectionne}
      className={cn(
        'group flex cursor-pointer gap-2.5 rounded-xl border bg-white p-3 shadow-xs transition-colors',
        selectionne ? 'border-brand-400 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300',
        estSection && 'bg-ink-25',
      )}
    >
      <span aria-hidden className="mt-1 flex h-5 w-5 shrink-0 cursor-grab items-center justify-center text-ink-400">
        <GripVertical className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <IconeChamp type={champ.type} className="h-3.5 w-3.5 shrink-0 text-ink-500" />
          <span className={cn('truncate text-[0.8125rem] font-medium', estSection ? 'font-display text-[0.9375rem] font-semibold text-ink-900' : 'text-ink-900')}>
            {champ.label || champLabels[champ.type]}
          </span>
          {champ.obligatoire && !estSection && <span className="text-danger-500">*</span>}
          {champ.condition && <Badge variant="outline">Conditionnelle</Badge>}
        </div>
        {champ.aide && <p className="mt-0.5 truncate text-xs text-ink-500">{champ.aide}</p>}
        {!estSection && champ.type !== 'conditionnelle' && (champ.type === 'choix_unique' || champ.type === 'choix_multiple' || champ.type === 'liste') && (
          <p className="mt-1 truncate text-xs text-ink-500">{champ.options.join(' · ')}</p>
        )}
      </div>

      <div
        className="flex shrink-0 items-start gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="icon" size="sm" label="Monter ce champ" disabled={index === 0} onClick={onMonter}>
          <ArrowUp aria-hidden className="h-3.5 w-3.5" />
        </Button>
        <Button variant="icon" size="sm" label="Descendre ce champ" disabled={index === total - 1} onClick={onDescendre}>
          <ArrowDown aria-hidden className="h-3.5 w-3.5" />
        </Button>
        <Button variant="icon" size="sm" label="Dupliquer ce champ" onClick={onDupliquer}>
          <Copy aria-hidden className="h-3.5 w-3.5" />
        </Button>
        <Button variant="icon" size="sm" label="Supprimer ce champ" className="hover:text-danger-600" onClick={onSupprimer}>
          <Trash2 aria-hidden className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function Indicateur({ actif }: { actif: boolean }) {
  return <div className={cn('mx-1 h-1 rounded-full transition-colors', actif ? 'bg-brand-400' : 'bg-transparent')} />
}

function CorpsEditeur({ formulaire }: { formulaire: Formulaire }) {
  const { toast } = useToast()
  const { mettreAJour } = useFormulaires()

  const [titre, setTitre] = useState(formulaire.titre)
  const [description, setDescription] = useState(formulaire.description)
  const [categorie, setCategorie] = useState(formulaire.categorie)
  const [champs, setChamps] = useState<Champ[]>(formulaire.champs)
  const [selectionId, setSelectionId] = useState<string | null>(null)
  const [modifie, setModifie] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [enGlissement, setEnGlissement] = useState(false)
  const idPrecedent = useRef(formulaire.id)

  useEffect(() => {
    if (idPrecedent.current !== formulaire.id) {
      idPrecedent.current = formulaire.id
      setTitre(formulaire.titre)
      setDescription(formulaire.description)
      setCategorie(formulaire.categorie)
      setChamps(formulaire.champs)
      setSelectionId(null)
      setModifie(false)
    }
  }, [formulaire])

  const marquer = () => setModifie(true)
  const selection = champs.find((c) => c.id === selectionId) ?? null
  const indexSelection = selection ? champs.findIndex((c) => c.id === selection.id) : -1

  const inserer = (type: TypeChamp, index: number) => {
    const nouveau = champVide(type)
    setChamps((cs) => {
      const copie = [...cs]
      copie.splice(index, 0, nouveau)
      return copie
    })
    setSelectionId(nouveau.id)
    marquer()
  }

  const changerChamp = (id: string, patch: Partial<Champ>) => {
    setChamps((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    marquer()
  }

  const dupliquerChamp = (id: string) => {
    setChamps((cs) => {
      const i = cs.findIndex((c) => c.id === id)
      if (i < 0) return cs
      const copie = [...cs]
      copie.splice(i + 1, 0, { ...cs[i], id: uid('ch') })
      return copie
    })
    marquer()
  }

  const supprimerChamp = (id: string) => {
    setChamps((cs) => cs.filter((c) => c.id !== id).map((c) => (c.condition?.champId === id ? { ...c, condition: null } : c)))
    if (selectionId === id) setSelectionId(null)
    marquer()
  }

  const deplacerChamp = (id: string, i: number, versIndex: number) => {
    setChamps((cs) => {
      const copie = [...cs]
      const [item] = copie.splice(i, 1)
      copie.splice(versIndex, 0, item)
      return copie
    })
    marquer()
  }

  const deposer = (index: number, data: string) => {
    if (data.startsWith('palette:')) {
      inserer(data.slice('palette:'.length) as TypeChamp, index)
    } else if (data.startsWith('champ:')) {
      const id = data.slice('champ:'.length)
      const from = champs.findIndex((c) => c.id === id)
      if (from < 0) return
      const dest = from < index ? index - 1 : index
      deplacerChamp(id, from, Math.max(0, dest))
    }
  }

  const enregistrer = async () => {
    setEnCours(true)
    try {
      await mettreAJour(formulaire.id, { titre, description, categorie }, champs)
      setModifie(false)
      toast({ titre: 'Formulaire enregistré', detail: `${champs.length} champ(s) enregistré(s).`, tone: 'success' })
    } catch (e) {
      toast({ titre: 'Enregistrement impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const reinitialiser = () => {
    setTitre(formulaire.titre)
    setDescription(formulaire.description)
    setCategorie(formulaire.categorie)
    setChamps(formulaire.champs)
    setSelectionId(null)
    setModifie(false)
  }

  return (
    <>
      <Card>
        <CardHeader
          title="Informations générales"
          action={
            <div className="flex items-center gap-2">
              <span aria-live="polite" className="text-xs text-ink-500">
                {enCours ? 'Enregistrement…' : modifie ? 'Modifications non enregistrées' : 'Tout est enregistré'}
              </span>
              {modifie && (
                <Button size="sm" onClick={reinitialiser} disabled={enCours} iconLeft={<RotateCcw aria-hidden className="h-3.5 w-3.5" />}>
                  Annuler
                </Button>
              )}
              <Button size="sm" variant="primary" onClick={() => void enregistrer()} loading={enCours} iconLeft={<Save aria-hidden className="h-3.5 w-3.5" />}>
                Enregistrer
              </Button>
            </div>
          }
        />
        <CardBody className="flex flex-col gap-4">
          <Field label="Titre du formulaire">
            {(p) => <Input {...p} value={titre} onChange={(e) => { setTitre(e.target.value); marquer() }} />}
          </Field>
          <Field label="Catégorie" className="max-w-xs">
            {(p) => (
              <Select {...p} value={categorie} onChange={(e) => { setCategorie(e.target.value); marquer() }} placeholder="Non classée" options={categoriesFormulaire.map((c) => ({ value: c, label: c }))} />
            )}
          </Field>
          <Field label="Description">
            {(p) => <Textarea {...p} rows={2} value={description} onChange={(e) => { setDescription(e.target.value); marquer() }} />}
          </Field>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* Palette */}
        <div className="order-2 flex shrink-0 flex-col gap-3 lg:order-1 lg:w-60">
          {groupesPalette.map((groupe) => (
            <div key={groupe.titre} className="rounded-xl border border-ink-200 bg-white p-3 shadow-xs">
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">{groupe.titre}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {groupe.types.map((type) => (
                  <button
                    key={type}
                    type="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'copy'
                      e.dataTransfer.setData('text/plain', `palette:${type}`)
                      setEnGlissement(true)
                    }}
                    onDragEnd={() => { setEnGlissement(false); setOverIndex(null) }}
                    onClick={() => inserer(type, champs.length)}
                    title={champLabels[type]}
                    className="flex cursor-grab flex-col items-center gap-1 rounded-lg border border-ink-200 px-1.5 py-2 text-center text-2xs font-medium text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <IconeChamp type={type} className="h-4 w-4" />
                    <span className="leading-tight">{champLabels[type]}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="px-1 text-xs leading-relaxed text-ink-500">
            Glissez un champ dans le formulaire, ou cliquez dessus pour l’ajouter à la fin.
          </p>
        </div>

        {/* Canevas */}
        <div
          className="order-1 min-w-0 flex-1 lg:order-2"
          onDragOver={(e) => {
            e.preventDefault()
            if (champs.length === 0) setOverIndex(0)
          }}
          onDrop={(e) => {
            e.preventDefault()
            const data = e.dataTransfer.getData('text/plain')
            if (data) deposer(overIndex ?? champs.length, data)
            setOverIndex(null)
            setEnGlissement(false)
          }}
        >
          {champs.length === 0 ? (
            <Card className={cn('border-2 border-dashed', enGlissement ? 'border-brand-400 bg-brand-50/40' : 'border-ink-300')}>
              <EmptyState
                icon={<LayoutTemplate />}
                title="Formulaire vide"
                description="Glissez un champ depuis la palette pour commencer, ou cliquez sur l’un d’eux."
              />
            </Card>
          ) : (
            <div className="flex flex-col rounded-xl border border-ink-200 bg-ink-25 p-2.5">
              {enGlissement && <Indicateur actif={overIndex === 0} />}
              {champs.map((champ, i) => (
                <div key={champ.id}>
                  <BlocChamp
                    champ={champ}
                    index={i}
                    total={champs.length}
                    selectionne={selectionId === champ.id}
                    onSelectionner={() => setSelectionId(champ.id)}
                    onChanger={(patch) => changerChamp(champ.id, patch)}
                    onDupliquer={() => dupliquerChamp(champ.id)}
                    onSupprimer={() => supprimerChamp(champ.id)}
                    onMonter={() => deplacerChamp(champ.id, i, i - 1)}
                    onDescendre={() => deplacerChamp(champ.id, i, i + 1)}
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move'
                      e.dataTransfer.setData('text/plain', `champ:${champ.id}`)
                      setEnGlissement(true)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const rect = e.currentTarget.getBoundingClientRect()
                      setOverIndex(e.clientY < rect.top + rect.height / 2 ? i : i + 1)
                    }}
                    onDragEnd={() => { setEnGlissement(false); setOverIndex(null) }}
                  />
                  {enGlissement && <Indicateur actif={overIndex === i + 1} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panneau de propriétés */}
        <div className="order-3 shrink-0 lg:w-80">
          <div className="sticky top-4 rounded-xl border border-ink-200 bg-white p-4 shadow-xs">
            {selection ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="font-display text-[0.9375rem] font-semibold text-ink-900">Propriétés du champ</p>
                  <Button variant="icon" size="sm" label="Désélectionner" onClick={() => setSelectionId(null)}>
                    <X aria-hidden className="h-4 w-4" />
                  </Button>
                </div>
                <PanneauChamp
                  champ={selection}
                  champsPrecedents={champs.slice(0, indexSelection)}
                  onChange={(patch) => changerChamp(selection.id, patch)}
                />
              </>
            ) : (
              <p className="text-[0.8125rem] leading-relaxed text-ink-500">
                Sélectionnez un champ du formulaire pour en modifier l’intitulé, les options et les réglages.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-ink-500">
        {champs.filter(champSaisissable).length} champ(s) de réponse, {champs.filter((c) => c.type === 'section').length} section(s).
      </p>
    </>
  )
}

export function Editeur() {
  usePageTitle('Éditeur de formulaire')

  return <FormulairePage eyebrow="Formulaires">{(f) => <CorpsEditeur formulaire={f} />}</FormulairePage>
}
