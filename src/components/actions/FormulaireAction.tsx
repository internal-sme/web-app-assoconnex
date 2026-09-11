import { useRef, useState } from 'react'
import { Bold, Image as ImageIcon, Italic, Link2, List, ListOrdered, Maximize2, Minimize2, Smartphone, Underline } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Badge } from '@/components/ui/Badge'
import { Drawer } from '@/components/ui/Drawer'
import { Modal } from '@/components/ui/Modal'
import { Menu } from '@/components/ui/Menu'
import { ListeAssociations } from '@/components/chat/Pieces'
import { associationsChat, membresChat } from '@/lib/chat'
import {
  callToActionDe,
  categoriesAction,
  porteeLabels,
  quartiersParVille,
  typesAction,
  villesAction,
  type PorteeAction,
} from '@/lib/actions'

const VISUELS = ['🤝', '🥫', '🎨', '🚲', '📚', '🎪', '🩺', '🌱', '🎁', '🏃', '💡', '🧰']

export type ValeursAction = {
  titre: string
  description: string
  visuel: string
  typeId: string
  categorieId: string
  portee: PorteeAction
  associationsIds: string[]
  adresse: string
  ville: string
  quartier: string
  date: string
  participantsIds: string[]
  projetId: string
  publiee: boolean
}

export const valeursVides: ValeursAction = {
  titre: '',
  description: '',
  visuel: '🤝',
  typeId: typesAction[0].id,
  categorieId: categoriesAction[0].id,
  portee: 'seule',
  associationsIds: ['org-1'],
  adresse: '',
  ville: villesAction[0],
  quartier: '',
  date: new Date().toISOString().slice(0, 10),
  participantsIds: [],
  projetId: '',
  publiee: true,
}

/* ---------------------- Éditeur de texte enrichi ---------------------- */

function EditeurEnrichi({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null)

  /** Entoure la sélection, ou insère un préfixe de ligne. */
  const appliquer = (avant: string, apres = avant, prefixeLigne = false) => {
    const el = ref.current
    if (!el) return
    const debut = el.selectionStart
    const fin = el.selectionEnd
    const selection = valeur.slice(debut, fin)

    let remplacement: string
    if (prefixeLigne) {
      const lignes = (selection || 'Élément').split('\n')
      remplacement = lignes.map((l, i) => `${avant.replace('{n}', String(i + 1))}${l}`).join('\n')
    } else {
      remplacement = `${avant}${selection || 'texte'}${apres}`
    }

    const nouveau = valeur.slice(0, debut) + remplacement + valeur.slice(fin)
    onChange(nouveau)
    window.requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(debut, debut + remplacement.length)
    })
  }

  const outils = [
    { label: 'Gras', icone: Bold, action: () => appliquer('**') },
    { label: 'Italique', icone: Italic, action: () => appliquer('*') },
    { label: 'Souligné', icone: Underline, action: () => appliquer('__') },
    { separateur: true },
    { label: 'Liste à puces', icone: List, action: () => appliquer('- ', '', true) },
    { label: 'Liste numérotée', icone: ListOrdered, action: () => appliquer('{n}. ', '', true) },
    { separateur: true },
    { label: 'Insérer une image', icone: ImageIcon, action: () => appliquer('![', '](adresse-de-l-image)') },
    { label: 'Insérer un lien', icone: Link2, action: () => appliquer('[', '](https://)') },
  ] as const

  return (
    <div className="overflow-hidden rounded-lg border border-ink-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
      <div role="toolbar" aria-label="Mise en forme du texte" className="flex items-center gap-0.5 border-b border-ink-200 bg-ink-25 px-1.5 py-1">
        {outils.map((o, i) =>
          'separateur' in o ? (
            <span key={i} aria-hidden className="mx-1 h-4 w-px bg-ink-200" />
          ) : (
            <Button key={o.label} variant="icon" size="sm" label={o.label} onClick={o.action}>
              <o.icone aria-hidden className="h-3.5 w-3.5" />
            </Button>
          ),
        )}
      </div>
      <textarea
        ref={ref}
        value={valeur}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        aria-label="À propos de l’action"
        placeholder="Décrivez l’action : à qui elle s’adresse, comment elle se déroule, ce qu’elle apporte."
        className="ac-scroll w-full resize-y bg-white px-3 py-2 text-[0.8125rem] leading-relaxed text-ink-900 outline-none placeholder:text-ink-400"
      />
      <p className="border-t border-ink-100 bg-ink-25 px-3 py-1.5 text-[0.5rem] text-ink-500">
        La mise en forme est enregistrée en Markdown : **gras**, *italique*, listes, liens.
      </p>
    </div>
  )
}

/* --------------------- Aperçu du bouton mobile ------------------------ */

export function ApercuCallToAction({ typeId, titre }: { typeId: string; titre: string }) {
  const type = typesAction.find((t) => t.id === typeId)
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-25 p-3">
      <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-ink-500">
        <Smartphone aria-hidden className="h-3 w-3" />
        Ce que verra le public sur l’application
      </p>
      <div className="mx-auto mt-2.5 w-full max-w-[15rem] rounded-xl border border-ink-200 bg-white p-3 shadow-xs">
        <p className="truncate text-[0.8125rem] font-semibold text-ink-900">{titre || 'Titre de l’action'}</p>
        <p className="mt-0.5 text-2xs text-ink-500">{type?.nom}</p>
        <span
          className="mt-2.5 flex h-8 items-center justify-center rounded-lg px-3 text-xs font-semibold text-white"
          style={{ backgroundColor: type?.couleur ?? '#2364AA' }}
        >
          {callToActionDe(typeId)}
        </span>
      </div>
      <p className="mt-2 text-2xs leading-relaxed text-ink-500">
        Le bouton découle du type d’action : le changer change ce que le bénéficiaire pourra faire.
      </p>
    </div>
  )
}

/* --------------------------- Le formulaire ---------------------------- */

function Corps({
  valeurs,
  onChange,
  erreurs,
  projets,
}: {
  valeurs: ValeursAction
  onChange: (v: Partial<ValeursAction>) => void
  erreurs: Record<string, string>
  projets: { id: string; code: string; nom: string }[]
}) {
  const partenaires = valeurs.associationsIds.filter((x) => x !== 'org-1')

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h3 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-900">Informations générales</h3>
        <div className="flex flex-col gap-4">
          <Field label="Titre de l’action" required error={erreurs.titre}>
            {(p) => <Input {...p} value={valeurs.titre} onChange={(e) => onChange({ titre: e.target.value })} placeholder="Campagne de dons de vêtements" />}
          </Field>

          <Field label="À propos de l’action">
            {() => <EditeurEnrichi valeur={valeurs.description} onChange={(v) => onChange({ description: v })} />}
          </Field>

          <Field label="Visuel" hint="Symbole affiché dans la liste et sur l’application.">
            {() => (
              <div className="flex flex-wrap gap-1.5">
                {VISUELS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={valeurs.visuel === v}
                    aria-label={`Visuel ${v}`}
                    onClick={() => onChange({ visuel: v })}
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg border text-base transition-colors',
                      valeurs.visuel === v ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:bg-ink-50',
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-1 font-display text-[0.9375rem] font-semibold text-ink-900">Chip d’action</h3>
        <p className="mb-3 text-xs leading-relaxed text-ink-500">
          Le type détermine le bouton proposé au public. La catégorie sert au classement et aux bilans d’activité.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type de l’action" required>
            {(p) => (
              <Select {...p} value={valeurs.typeId} onChange={(e) => onChange({ typeId: e.target.value })} options={typesAction.map((t) => ({ value: t.id, label: t.nom }))} />
            )}
          </Field>
          <Field label="Catégorie de l’action" required>
            {(p) => (
              <Select {...p} value={valeurs.categorieId} onChange={(e) => onChange({ categorieId: e.target.value })} options={categoriesAction.map((c) => ({ value: c.id, label: c.nom }))} />
            )}
          </Field>
          <div className="sm:col-span-2">
            <ApercuCallToAction typeId={valeurs.typeId} titre={valeurs.titre} />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-900">Portée</h3>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {(['seule', 'partenariat'] as PorteeAction[]).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={valeurs.portee === p}
                onClick={() => onChange({ portee: p, associationsIds: p === 'seule' ? ['org-1'] : valeurs.associationsIds })}
                className={cn(
                  'flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
                  valeurs.portee === p ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300 hover:bg-ink-25',
                )}
              >
                <span className="text-[0.8125rem] font-medium text-ink-900">{porteeLabels[p]}</span>
                <span className="text-xs leading-relaxed text-ink-500">
                  {p === 'seule' ? 'Votre association porte l’action seule.' : 'D’autres associations de la ville sont associées.'}
                </span>
              </button>
            ))}
          </div>

          {valeurs.portee === 'partenariat' && (
            <>
              <Field label="Associations de la ville conviées" required error={erreurs.associations}>
                {(p) => (
                  <MultiSelect
                    {...p}
                    value={partenaires}
                    onChange={(ids) => onChange({ associationsIds: ['org-1', ...ids] })}
                    options={associationsChat.filter((a) => !a.interne).map((a) => ({ value: a.id, label: a.nom }))}
                    placeholder="Choisir les associations"
                  />
                )}
              </Field>
              {partenaires.length > 0 && <ListeAssociations ids={valeurs.associationsIds} />}
            </>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-900">Lieux et autres</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Adresse complète" className="sm:col-span-2">
            {(p) => <Input {...p} value={valeurs.adresse} onChange={(e) => onChange({ adresse: e.target.value })} placeholder="52, route des Mineurs" />}
          </Field>
          <Field label="Ville" required>
            {(p) => (
              <Select
                {...p}
                value={valeurs.ville}
                onChange={(e) => onChange({ ville: e.target.value, quartier: '' })}
                options={villesAction.map((v) => ({ value: v, label: v }))}
              />
            )}
          </Field>
          <Field label="Quartier">
            {(p) => (
              <Select
                {...p}
                value={valeurs.quartier}
                onChange={(e) => onChange({ quartier: e.target.value })}
                placeholder="Non précisé"
                options={(quartiersParVille[valeurs.ville] ?? []).map((q) => ({ value: q, label: q }))}
              />
            )}
          </Field>
          <Field label="Date de l’action" required error={erreurs.date} className="sm:col-span-2">
            {(p) => <Input {...p} type="date" value={valeurs.date} onChange={(e) => onChange({ date: e.target.value })} />}
          </Field>
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-900">Participants</h3>
        <Field label="Membres mobilisés" hint="Ils apparaissent dans la liste des actions.">
          {(p) => (
            <MultiSelect
              {...p}
              value={valeurs.participantsIds}
              onChange={(ids) => onChange({ participantsIds: ids })}
              options={membresChat.filter((m) => m.associationId === 'org-1').map((m) => ({ value: m.id, label: m.nom }))}
              placeholder="Choisir les participants"
            />
          )}
        </Field>
      </section>

      <section>
        <h3 className="mb-3 font-display text-[0.9375rem] font-semibold text-ink-900">Publication</h3>
        <div className="flex flex-col gap-4">
          <Field label="Projet rattaché" hint="Facultatif.">
            {(p) => (
              <Select
                {...p}
                value={valeurs.projetId}
                onChange={(e) => onChange({ projetId: e.target.value })}
                placeholder="Hors projet"
                options={projets.map((x) => ({ value: x.id, label: `${x.code} — ${x.nom}` }))}
              />
            )}
          </Field>
          <Switch
            label="Publier sur l’application mobile"
            description="L’action devient visible du public, avec son bouton d’appel à l’action."
            checked={valeurs.publiee}
            onCheckedChange={(v) => onChange({ publiee: v })}
          />
          {!valeurs.publiee && (
            <p className="rounded-lg border border-ink-200 bg-ink-25 p-2.5 text-xs text-ink-600">
              L'action sera enregistrée sans être visible du public. Vous pourrez la publier depuis sa fiche.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

/**
 * Le formulaire s'ouvre en panneau latéral, et bascule en plein écran
 * depuis le menu de l'en-tête.
 */
export function FormulaireAction({
  open,
  onClose,
  titre,
  valeurs,
  onChange,
  erreurs,
  projets,
  onValider,
  libelleValider,
  enCours,
}: {
  open: boolean
  onClose: () => void
  titre: string
  valeurs: ValeursAction
  onChange: (v: Partial<ValeursAction>) => void
  erreurs: Record<string, string>
  projets: { id: string; code: string; nom: string }[]
  onValider: () => void
  libelleValider: string
  enCours: boolean
}) {
  const [pleinEcran, setPleinEcran] = useState(false)

  const menu = (
    <Menu
      label="Affichage du formulaire"
      width="w-56"
      items={[
        {
          label: pleinEcran ? 'Afficher en panneau latéral' : 'Ouvrir en plein écran',
          icon: pleinEcran ? <Minimize2 /> : <Maximize2 />,
          onSelect: () => setPleinEcran((v) => !v),
        },
      ]}
      trigger={({ toggle, open: ouvert, ref }) => (
        <Button ref={ref} variant="icon" size="sm" label="Affichage du formulaire" aria-expanded={ouvert} aria-haspopup="menu" onClick={toggle}>
          <span aria-hidden className="text-lg leading-none">⋯</span>
        </Button>
      )}
    />
  )

  const pied = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={enCours}>
        Annuler
      </Button>
      <Button variant="primary" loading={enCours} onClick={onValider}>
        {libelleValider}
      </Button>
    </>
  )

  const corps = <Corps valeurs={valeurs} onChange={onChange} erreurs={erreurs} projets={projets} />

  if (pleinEcran) {
    return (
      <Modal open={open} onClose={onClose} size="lg" title={titre} footer={pied}>
        <div className="flex justify-end pb-2">{menu}</div>
        {corps}
      </Modal>
    )
  }

  return (
    <Drawer open={open} onClose={onClose} width="lg" title={titre} headerAction={menu} footer={pied}>
      {corps}
    </Drawer>
  )
}
