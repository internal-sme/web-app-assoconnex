import { useState, type ReactNode } from 'react'
import {
  Archive,
  Copy,
  Download,
  Mail,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button, type ButtonVariant } from '@/components/ui/Button'
import { Badge, Chip } from '@/components/ui/Badge'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Avatar, AvatarGroup, AvatarUpload } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { Pagination } from '@/components/ui/Pagination'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Checkbox, Switch } from '@/components/ui/Toggle'
import { Modal } from '@/components/ui/Modal'
import { Drawer } from '@/components/ui/Drawer'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge, StatusInline, statusMap, toneStyles, type StatusKey } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { useToast } from '@/context/ToastContext'
import { contactsInitiaux, type Contact } from '@/lib/mock'
import { cn, formatDate } from '@/lib/utils'

/* ---------- éléments de mise en page de la documentation ---------- */

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titre`} className="scroll-mt-20">
      <div className="mb-4">
        <h2 id={`${id}-titre`} className="font-display text-lg font-semibold tracking-tight text-ink-950">
          {title}
          <span aria-hidden className="text-brand-500">°</span>
        </h2>
        <p className="mt-1 max-w-2xl text-[0.875rem] leading-relaxed text-ink-500">{description}</p>
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </section>
  )
}

function Specimen({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white shadow-xs">
      <p className="border-b border-ink-100 px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <div className={cn('p-4', className)}>{children}</div>
    </div>
  )
}

function Swatch({ hex, name, note }: { hex: string; name: string; note?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-9 w-9 shrink-0 rounded-lg border border-ink-200" style={{ backgroundColor: hex }} aria-hidden />
      <span className="min-w-0">
        <span className="block text-[0.8125rem] font-medium text-ink-900">{name}</span>
        <span className="block font-mono text-2xs uppercase text-ink-500">{hex}</span>
        {note && <span className="block text-2xs text-ink-500">{note}</span>}
      </span>
    </div>
  )
}

/* ---------- page ---------- */

const sections = [
  { id: 'fondations', label: 'Fondations' },
  { id: 'boutons', label: 'Boutons' },
  { id: 'formulaires', label: 'Formulaires' },
  { id: 'statuts', label: 'Statuts' },
  { id: 'composants', label: 'Composants' },
  { id: 'surfaces', label: 'Surfaces' },
  { id: 'datagrid', label: 'Data grid' },
]

import { usePageTitle } from '@/hooks/usePageTitle'

export function DesignSystem() {
  usePageTitle('Design System')
  const [tab, setTab] = useState('fondations')
  const { toast } = useToast()

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Socle applicatif"
          title="Design system"
          description="Les briques visuelles et d'interaction d'AssoConnex. Chaque composant est utilisable au clavier, respecte le contraste AA et n'utilise jamais la couleur seule pour porter une information."
          meta={
            <>
              <Badge variant="brand">v0.1</Badge>
              <Badge variant="outline">Contraste AA</Badge>
              <Badge variant="outline">Navigation clavier</Badge>
            </>
          }
          actions={
            <Button
              iconLeft={<Copy aria-hidden className="h-4 w-4" />}
              onClick={() => toast({ titre: 'Jetons copiés', detail: 'La palette a été copiée au format JSON.', tone: 'success' })}
            >
              Copier les jetons
            </Button>
          }
        />
      }
    >
      <Tabs items={sections} value={tab} onChange={setTab} ariaLabel="Sections du design system" className="sticky top-0 z-20 -mx-5 bg-ink-25/95 px-5 backdrop-blur" />

      {tab === 'fondations' && <Fondations />}
      {tab === 'boutons' && <Boutons />}
      {tab === 'formulaires' && <Formulaires />}
      {tab === 'statuts' && <Statuts />}
      {tab === 'composants' && <Composants />}
      {tab === 'surfaces' && <Surfaces />}
      {tab === 'datagrid' && <GrilleDemo />}
    </Page>
  )
}

/* ---------- 1. Fondations ---------- */

const brandScale = [
  ['50', '#EFF5FB'], ['100', '#DCE9F6'], ['200', '#BBD3EC'], ['300', '#8DB5DE'], ['400', '#5892C9'],
  ['500', '#2364AA'], ['600', '#1D5391'], ['700', '#184476'], ['800', '#14375F'], ['900', '#112C4B'],
]
const inkScale = [
  ['25', '#FBFBFC'], ['50', '#F6F7F9'], ['100', '#EDEFF2'], ['200', '#E0E3E9'], ['300', '#C7CCD5'], ['400', '#98A0AC'],
  ['500', '#6E7684'], ['600', '#525A66'], ['700', '#3B424B'], ['800', '#23272E'], ['900', '#14171B'], ['950', '#0A0C0F'],
]

function Fondations() {
  return (
    <div className="flex flex-col gap-8">
      <Section
        id="couleur"
        title="Couleur"
        description="Une seule couleur porteuse de sens — le bleu du logo — sur une base de blanc et de noir. Les trois teintes de statut sont réservées aux états et n'habillent jamais l'interface."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Bleu de marque — dérivé du logo #2364AA">
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-brand-500 px-4 py-3">
              <span className="font-display text-lg font-bold text-white">AssoConnex°</span>
              <span className="ml-auto rounded bg-white/15 px-2 py-0.5 font-mono text-2xs text-white">6,05:1</span>
            </div>
            <div className="flex overflow-hidden rounded-lg border border-ink-200">
              {brandScale.map(([k, hex]) => (
                <div key={k} className="flex-1">
                  <div className="h-12" style={{ backgroundColor: hex }} />
                  <p className="py-1 text-center font-mono text-2xs text-ink-500">{k}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-ink-500">
              Le 500 est la valeur exacte du logo. Il sert aux actions principales, à l'état actif et au focus. Les
              teintes 50 à 200 servent de fond ; 600 et 700 aux états survol et pressé.
            </p>
          </Specimen>

          <Specimen label="Neutres — la structure de l'interface">
            <div className="flex overflow-hidden rounded-lg border border-ink-200">
              {inkScale.map(([k, hex]) => (
                <div key={k} className="flex-1">
                  <div className="h-12" style={{ backgroundColor: hex }} />
                  <p className="py-1 text-center font-mono text-2xs text-ink-500">{k}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Swatch hex="#FFFFFF" name="Fond des surfaces" note="Cartes, modales, tableaux" />
              <Swatch hex="#FBFBFC" name="Fond de l'application" note="Zone de contenu" />
              <Swatch hex="#14171B" name="Texte principal" note="16,4:1 sur blanc" />
              <Swatch hex="#6E7684" name="Texte secondaire" note="4,8:1 sur blanc" />
            </div>
          </Specimen>
        </div>

        <Specimen label="Couleurs de statut — usage réservé">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Swatch hex="#127A4C" name="Vert — abouti" note="Actif, validé, payé" />
            <Swatch hex="#9A5B00" name="Orange — en cours" note="En attente, échéance proche" />
            <Swatch hex="#B42318" name="Rouge — bloquant" note="Refusé, en retard" />
            <Swatch hex="#525A66" name="Gris — hors flux" note="Archivé, brouillon" />
          </div>
        </Specimen>
      </Section>

      <Section
        id="typographie"
        title="Typographie"
        description="Instrument Sans pour les titres, Inter pour l'interface et le texte courant, JetBrains Mono pour les identifiants et les raccourcis clavier. Les chiffres des tableaux sont tabulaires."
      >
        <Specimen label="Échelle" className="space-y-4">
          <div className="flex items-baseline gap-4 border-b border-ink-100 pb-3">
            <span className="w-28 shrink-0 font-mono text-2xs text-ink-500">display / 22</span>
            <span className="font-display text-[1.375rem] font-semibold tracking-tight text-ink-950">Titre de page</span>
          </div>
          <div className="flex items-baseline gap-4 border-b border-ink-100 pb-3">
            <span className="w-28 shrink-0 font-mono text-2xs text-ink-500">display / 18</span>
            <span className="font-display text-lg font-semibold tracking-tight text-ink-950">Titre de section</span>
          </div>
          <div className="flex items-baseline gap-4 border-b border-ink-100 pb-3">
            <span className="w-28 shrink-0 font-mono text-2xs text-ink-500">display / 15</span>
            <span className="font-display text-[0.9375rem] font-semibold text-ink-900">Titre de carte</span>
          </div>
          <div className="flex items-baseline gap-4 border-b border-ink-100 pb-3">
            <span className="w-28 shrink-0 font-mono text-2xs text-ink-500">sans / 14</span>
            <span className="text-sm text-ink-800">Texte courant de l'interface, boutons et champs.</span>
          </div>
          <div className="flex items-baseline gap-4 border-b border-ink-100 pb-3">
            <span className="w-28 shrink-0 font-mono text-2xs text-ink-500">sans / 13</span>
            <span className="text-[0.8125rem] text-ink-700">Cellules de tableau et texte secondaire.</span>
          </div>
          <div className="flex items-baseline gap-4">
            <span className="w-28 shrink-0 font-mono text-2xs text-ink-500">mono / 11</span>
            <span className="font-mono text-2xs text-ink-600">CT-104 · Ctrl K</span>
          </div>
        </Specimen>
      </Section>

      <Section
        id="formes"
        title="Rayons, ombres et espacement"
        description="Quatre rayons, quatre profondeurs, une trame de 4 pixels. Rien d'autre."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Rayons">
            <div className="flex flex-wrap gap-4">
              {[['rounded-md', '6 px'], ['rounded-lg', '8 px'], ['rounded-xl', '12 px'], ['rounded-full', 'pilule']].map(([cls, l]) => (
                <div key={cls} className="text-center">
                  <div className={cn('h-14 w-14 border border-ink-200 bg-ink-50', cls)} />
                  <p className="mt-1.5 font-mono text-2xs text-ink-500">{l}</p>
                </div>
              ))}
            </div>
          </Specimen>
          <Specimen label="Profondeurs">
            <div className="flex flex-wrap gap-4">
              {[['shadow-xs', 'xs'], ['shadow-sm', 'sm'], ['shadow-md', 'md'], ['shadow-lg', 'lg']].map(([cls, l]) => (
                <div key={cls} className="text-center">
                  <div className={cn('h-14 w-14 rounded-xl border border-ink-200 bg-white', cls)} />
                  <p className="mt-1.5 font-mono text-2xs text-ink-500">{l}</p>
                </div>
              ))}
            </div>
          </Specimen>
        </div>
      </Section>
    </div>
  )
}

/* ---------- 2. Boutons ---------- */

const variants: { key: ButtonVariant; label: string; usage: string }[] = [
  { key: 'primary', label: 'Primary', usage: "Une seule par écran : l'action attendue." },
  { key: 'secondary', label: 'Secondary', usage: 'Actions courantes de la barre de page.' },
  { key: 'ghost', label: 'Ghost', usage: 'Actions discrètes, menus, annulation.' },
  { key: 'danger', label: 'Danger', usage: 'Suppression et actions irréversibles.' },
]

function Boutons() {
  const [loading, setLoading] = useState(false)
  return (
    <div className="flex flex-col gap-8">
      <Section id="variantes" title="Variantes" description="Quatre variantes textuelles et une variante icône. Chaque bouton icône porte un nom accessible explicite.">
        <Specimen label="États">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left">
              <thead>
                <tr className="border-b border-ink-100">
                  {['Variante', 'Repos', 'Désactivé', 'Chargement', 'Avec icône'].map((h) => (
                    <th key={h} scope="col" className="pb-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {variants.map((v) => (
                  <tr key={v.key}>
                    <td className="py-3 pr-4">
                      <p className="text-[0.8125rem] font-medium text-ink-900">{v.label}</p>
                      <p className="max-w-[12rem] text-xs text-ink-500">{v.usage}</p>
                    </td>
                    <td className="py-3 pr-4"><Button variant={v.key}>Enregistrer</Button></td>
                    <td className="py-3 pr-4"><Button variant={v.key} disabled>Enregistrer</Button></td>
                    <td className="py-3 pr-4"><Button variant={v.key} loading>Enregistrer</Button></td>
                    <td className="py-3"><Button variant={v.key} iconLeft={<Send aria-hidden className="h-4 w-4" />}>Envoyer</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Survol et pression sont perceptibles au clavier comme à la souris ; l'anneau de focus reste visible sur toutes les variantes.
          </p>
        </Specimen>

        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Tailles">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm" variant="primary">Petit</Button>
              <Button size="md" variant="primary">Moyen</Button>
              <Button size="lg" variant="primary">Grand</Button>
            </div>
          </Specimen>
          <Specimen label="Boutons icône">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="icon" label="Modifier"><Pencil aria-hidden className="h-4 w-4" /></Button>
              <Button variant="icon" label="Dupliquer"><Copy aria-hidden className="h-4 w-4" /></Button>
              <Button variant="icon" label="Archiver"><Archive aria-hidden className="h-4 w-4" /></Button>
              <Button variant="icon" label="Supprimer" className="text-danger-600 hover:bg-danger-50"><Trash2 aria-hidden className="h-4 w-4" /></Button>
              <Button variant="icon" label="Télécharger" disabled><Download aria-hidden className="h-4 w-4" /></Button>
              <Button
                variant="primary"
                loading={loading}
                onClick={() => {
                  setLoading(true)
                  window.setTimeout(() => setLoading(false), 1600)
                }}
              >
                Tester le chargement
              </Button>
            </div>
          </Specimen>
        </div>
      </Section>
    </div>
  )
}

/* ---------- 3. Formulaires ---------- */

function Formulaires() {
  const [multi, setMulti] = useState<string[]>(['benevole'])
  const [switchOn, setSwitchOn] = useState(true)

  return (
    <div className="flex flex-col gap-8">
      <Section
        id="champs"
        title="Champs"
        description="Chaque champ possède une étiquette visible reliée par « for », une aide facultative et un message d'erreur relié par aria-describedby. L'erreur est toujours accompagnée d'une icône."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Champs simples" className="space-y-4">
            <Field label="Prénom" required hint="Tel qu'il apparaîtra sur le reçu fiscal.">
              {(p) => <Input {...p} placeholder="Camille" defaultValue="Camille" />}
            </Field>
            <Field label="Adresse e-mail" required error="Cette adresse est déjà utilisée par un autre contact.">
              {(p) => <Input {...p} type="email" defaultValue="camille.beauchamp@exemple.fr" iconLeft={<Mail />} />}
            </Field>
            <Field label="Téléphone" hint="Format français, mobile ou fixe.">
              {(p) => <Input {...p} type="tel" placeholder="06 12 34 56 78" />}
            </Field>
            <Field label="Date d'adhésion">
              {(p) => <Input {...p} type="date" defaultValue="2026-01-15" />}
            </Field>
            <Field label="Champ désactivé" hint="Renseigné automatiquement par le module Adhésions.">
              {(p) => <Input {...p} disabled defaultValue="CT-104" />}
            </Field>
          </Specimen>

          <Specimen label="Sélection et texte long" className="space-y-4">
            <Field label="Formule d'adhésion" required>
              {(p) => (
                <Select
                  {...p}
                  placeholder="Choisir une formule"
                  options={[
                    { value: 'individuelle', label: 'Individuelle — 45 €' },
                    { value: 'famille', label: 'Famille — 80 €' },
                    { value: 'etudiant', label: 'Étudiant — 20 €' },
                    { value: 'bienfaiteur', label: 'Bienfaiteur — 150 €' },
                  ]}
                />
              )}
            </Field>
            <Field label="Rôles dans l'association" hint="Plusieurs choix possibles.">
              {(p) => (
                <MultiSelect
                  {...p}
                  value={multi}
                  onChange={setMulti}
                  options={[
                    { value: 'adherent', label: 'Adhérent' },
                    { value: 'benevole', label: 'Bénévole' },
                    { value: 'bureau', label: 'Membre du bureau' },
                    { value: 'donateur', label: 'Donateur' },
                  ]}
                />
              )}
            </Field>
            <Field label="Note interne" hint="Visible uniquement par l'équipe administrative.">
              {(p) => <Textarea {...p} placeholder="Contexte, historique, points d'attention…" />}
            </Field>
          </Specimen>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Cases et interrupteurs" className="space-y-4">
            <Checkbox defaultChecked label="Recevoir la lettre d'information" description="Un envoi par mois, désinscription à tout moment." />
            <Checkbox label="Accepter le règlement intérieur" />
            <Checkbox indeterminate label="Sélection partielle" description="État intermédiaire d'une sélection de tableau." />
            <Checkbox disabled label="Option indisponible" description="Nécessite le module Adhésions." />
            <div className="border-t border-ink-100 pt-4">
              <Switch
                label="Relance automatique"
                description="Envoie un rappel 15 jours avant l'échéance."
                checked={switchOn}
                onCheckedChange={setSwitchOn}
              />
            </div>
            <Switch label="Interrupteur désactivé" description="Disponible avec la facturation." checked={false} onCheckedChange={() => {}} disabled />
          </Specimen>

          <Specimen label="Photo de profil">
            <AvatarUpload name="Camille Beauchamp" />
          </Specimen>
        </div>
      </Section>
    </div>
  )
}

/* ---------- 4. Statuts ---------- */

const groupes: { tone: keyof typeof toneStyles; keys: StatusKey[]; regle: string }[] = [
  { tone: 'success', keys: ['actif', 'valide', 'paye'], regle: "L'objet est en règle, aucune action attendue." },
  { tone: 'warning', keys: ['en_attente', 'echeance_proche'], regle: 'Une action est attendue, sans urgence immédiate.' },
  { tone: 'danger', keys: ['refuse', 'retard'], regle: "L'objet est bloqué ou hors délai." },
  { tone: 'neutral', keys: ['archive', 'brouillon'], regle: 'Hors du flux de travail courant.' },
]

function Statuts() {
  return (
    <div className="flex flex-col gap-8">
      <Section
        id="systeme-statuts"
        title="Système de statuts"
        description="Quatre familles seulement. Chaque statut combine systématiquement trois signaux : un texte explicite, une couleur et une icône. Un daltonien, un écran monochrome ou un lecteur d'écran restituent la même information."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {groupes.map((g) => {
            const s = toneStyles[g.tone]
            const Icon = s.icon
            return (
              <div key={g.tone} className="rounded-xl border border-ink-200 bg-white p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', s.soft)}>
                    <Icon aria-hidden className="h-4 w-4" />
                  </span>
                  <h3 className="text-[0.8125rem] font-semibold text-ink-900">{s.nom}</h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-ink-500">{g.regle}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {g.keys.map((k) => (
                    <StatusBadge key={k} status={k} />
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 border-t border-ink-100 pt-3">
                  {g.keys.map((k) => (
                    <StatusInline key={k} status={k} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <Specimen label="Ce qu'il ne faut pas faire">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-danger-100 bg-danger-50 p-3">
              <p className="mb-2 text-[0.8125rem] font-semibold text-danger-700">À éviter</p>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-success-500" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-warning-500" aria-hidden />
                <span className="h-2.5 w-2.5 rounded-full bg-danger-500" aria-hidden />
              </div>
              <p className="mt-2 text-xs text-danger-700">
                Une pastille seule. L'information disparaît en niveaux de gris et n'est pas restituée à l'oral.
              </p>
            </div>
            <div className="rounded-lg border border-success-100 bg-success-50 p-3">
              <p className="mb-2 text-[0.8125rem] font-semibold text-success-700">À faire</p>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="paye" />
                <StatusBadge status="en_attente" />
                <StatusBadge status="retard" />
              </div>
              <p className="mt-2 text-xs text-success-700">Texte, couleur et icône, toujours ensemble.</p>
            </div>
          </div>
        </Specimen>

        <Specimen label="Correspondance complète">
          <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {(Object.keys(statusMap) as StatusKey[]).map((k) => (
              <div key={k} className="flex items-center justify-between gap-4 border-b border-ink-100 py-1.5">
                <dt className="font-mono text-2xs text-ink-500">{k}</dt>
                <dd><StatusBadge status={k} /></dd>
              </div>
            ))}
          </dl>
        </Specimen>
      </Section>
    </div>
  )
}

/* ---------- 5. Composants ---------- */

function Composants() {
  const [tab, setTab] = useState('tous')
  const [page, setPage] = useState(3)

  return (
    <div className="flex flex-col gap-8">
      <Section id="indicateurs" title="Indicateurs et étiquettes" description="Badges, chips, avatars et cartes d'indicateur.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Badges et chips" className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Neutre</Badge>
              <Badge variant="brand">Marque</Badge>
              <Badge variant="outline">Contour</Badge>
              <Badge variant="solid">Plein</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 pt-4">
              <Chip>Ville : Nantes</Chip>
              <Chip onRemove={() => {}}>Rôle : Bénévole</Chip>
              <Chip icon={<Search aria-hidden className="h-3 w-3 text-ink-500" />} onRemove={() => {}}>
                « Traoré »
              </Chip>
            </div>
          </Specimen>

          <Specimen label="Avatars" className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
                <Avatar key={s} name="Awa Diallo" size={s} />
              ))}
            </div>
            <div className="border-t border-ink-100 pt-4">
              <AvatarGroup names={['Camille Beauchamp', 'Yanis Traoré', 'Awa Diallo', 'Hugo Fournier', 'Léa Rivière']} />
            </div>
          </Specimen>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Adhérents actifs" value="248" trend={{ direction: 'up', value: '+12', description: 'sur 30 jours' }} />
          <KpiCard label="Cotisations encaissées" value="9 480" unit="€" trend={{ direction: 'up', value: '+8 %', description: 'vs. saison précédente' }} />
          <KpiCard label="Relances en cours" value="7" trend={{ direction: 'down', value: '−3', description: 'depuis lundi' }} />
          <KpiCard label="Taux de renouvellement" value="82" unit="%" trend={{ direction: 'flat', value: '=', description: 'stable' }} />
        </div>
      </Section>

      <Section id="navigation" title="Navigation et états" description="Onglets, pagination, état vide et squelettes de chargement.">
        <Specimen label="Onglets">
          <Tabs
            ariaLabel="Exemple d'onglets"
            value={tab}
            onChange={setTab}
            items={[
              { id: 'tous', label: 'Tous', count: 248 },
              { id: 'actifs', label: 'À jour', count: 214 },
              { id: 'attente', label: 'En attente', count: 27 },
              { id: 'archives', label: 'Archivés', count: 7 },
            ]}
          />
          <p className="px-1 pt-3 text-[0.8125rem] text-ink-500">
            Flèches gauche et droite pour changer d'onglet, Début et Fin pour aller aux extrémités.
          </p>
        </Specimen>

        <Specimen label="Pagination" className="p-0">
          <Pagination page={page} pageSize={10} total={248} onPageChange={setPage} onPageSizeChange={() => {}} />
        </Specimen>

        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="État vide" className="p-0">
            <EmptyState
              icon={<UserRound />}
              title="Aucun contact pour l'instant"
              description="Importez un fichier CSV ou créez votre premier contact pour démarrer la base."
              action={<Button variant="primary" iconLeft={<Plus aria-hidden className="h-4 w-4" />}>Nouveau contact</Button>}
              secondaryAction={<Button>Importer un CSV</Button>}
              compact
            />
          </Specimen>

          <Specimen label="Chargement" className="space-y-4 p-0">
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="border-t border-ink-100">
              <SkeletonTable rows={3} />
            </div>
          </Specimen>
        </div>
      </Section>
    </div>
  )
}

/* ---------- 6. Surfaces ---------- */

function Surfaces() {
  const [modal, setModal] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const { toast } = useToast()

  return (
    <div className="flex flex-col gap-8">
      <Section
        id="surfaces"
        title="Surfaces et superpositions"
        description="Modale, tiroir, dialogue de confirmation et notifications. Toutes les superpositions piègent le focus, se ferment avec Échap et rendent le focus à l'élément déclencheur."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Carte" description="Conteneur de base d'une section de contenu." action={<Button size="sm" variant="ghost">Action</Button>} />
            <CardBody>
              <p className="text-[0.8125rem] leading-relaxed text-ink-600">
                La carte porte un titre, une description facultative et une action. Elle sert de contenant à un tableau,
                un formulaire ou un état vide.
              </p>
            </CardBody>
          </Card>

          <Specimen label="Déclencheurs">
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => setModal(true)}>Ouvrir la modale</Button>
              <Button onClick={() => setDrawer(true)}>Ouvrir le tiroir</Button>
              <Button variant="danger" onClick={() => setConfirm(true)}>Supprimer un contact</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
              <Button size="sm" onClick={() => toast({ titre: 'Contact enregistré', detail: 'Yanis Traoré a été ajouté à la base.', tone: 'success' })}>Toast succès</Button>
              <Button size="sm" onClick={() => toast({ titre: 'Échéance dans 5 jours', detail: '12 cotisations arrivent à échéance.', tone: 'warning' })}>Toast attente</Button>
              <Button size="sm" onClick={() => toast({ titre: 'Import interrompu', detail: 'Ligne 42 : adresse e-mail invalide.', tone: 'danger', action: { label: 'Voir le rapport', onClick: () => {} } })}>Toast erreur</Button>
              <Button size="sm" onClick={() => toast({ titre: 'Brouillon enregistré', detail: 'Reprenez quand vous voulez.', tone: 'neutral' })}>Toast neutre</Button>
            </div>
          </Specimen>
        </div>
      </Section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Nouveau contact"
        description="Les champs marqués d'un astérisque sont obligatoires."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>Annuler</Button>
            <Button
              variant="primary"
              onClick={() => {
                setModal(false)
                toast({ titre: 'Contact créé', detail: 'La fiche est disponible dans la liste.', tone: 'success' })
              }}
            >
              Créer le contact
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Prénom" required>{(p) => <Input {...p} placeholder="Awa" />}</Field>
          <Field label="Nom" required>{(p) => <Input {...p} placeholder="Diallo" />}</Field>
          <Field label="Adresse e-mail" required className="sm:col-span-2">
            {(p) => <Input {...p} type="email" placeholder="awa.diallo@exemple.fr" iconLeft={<Mail />} />}
          </Field>
        </div>
      </Modal>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Awa Diallo"
        description="Adhérente depuis janvier 2025"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDrawer(false)}>Fermer</Button>
            <Button variant="primary" onClick={() => setDrawer(false)}>Enregistrer</Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Avatar name="Awa Diallo" size="lg" />
            <div>
              <p className="text-sm font-semibold text-ink-900">Awa Diallo</p>
              <p className="text-[0.8125rem] text-ink-500">awa.diallo@exemple.fr</p>
              <div className="mt-1.5"><StatusBadge status="paye" /></div>
            </div>
          </div>
          <dl className="divide-y divide-ink-100 border-y border-ink-100">
            {[['Formule', 'Famille — 80 €'], ['Ville', 'Rennes'], ['Adhésion', '15 janvier 2025'], ['Échéance', '15 janvier 2026']].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-[0.8125rem] text-ink-500">{k}</dt>
                <dd className="text-[0.8125rem] font-medium text-ink-900">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false)
          toast({ titre: 'Contact supprimé', detail: 'Yanis Traoré a été retiré de la base.', tone: 'neutral' })
        }}
        title="Supprimer ce contact ?"
        description="Yanis Traoré et son historique d'adhésion seront définitivement retirés de la base."
        confirmLabel="Supprimer définitivement"
      />
    </div>
  )
}

/* ---------- 7. Data grid ---------- */

function GrilleDemo() {
  const { toast } = useToast()
  const [drawerRow, setDrawerRow] = useState<Contact | null>(null)
  const [confirmRow, setConfirmRow] = useState<Contact | null>(null)

  const columns: Column<Contact>[] = [
    {
      id: 'nom',
      header: 'Contact',
      sortValue: (r) => `${r.nom} ${r.prenom}`,
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={`${r.prenom} ${r.nom}`} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{r.prenom} {r.nom}</p>
            <p className="truncate text-xs text-ink-500">{r.email}</p>
          </div>
        </div>
      ),
    },
    { id: 'role', header: 'Fonction', sortValue: (r) => r.fonction, cell: (r) => r.fonction },
    { id: 'ville', header: 'Ville', sortValue: (r) => r.adresse.ville, cell: (r) => r.adresse.ville },
    { id: 'telephone', header: 'Téléphone', optional: true, defaultHidden: true, cell: (r) => <span className="ac-num">{r.telephones[0]?.numero ?? '—'}</span> },
    { id: 'cree', header: 'Ajouté le', optional: true, sortValue: (r) => r.creeLe, cell: (r) => <span className="ac-num">{formatDate(r.creeLe)}</span> },
    { id: 'statut', header: 'Statut', sortValue: (r) => r.statut, align: 'right', cell: (r) => <StatusBadge status={r.statut === 'archive' ? 'archive' : r.statut === 'en_attente' ? 'en_attente' : 'actif'} /> },
  ]

  const filters: FilterDef<Contact>[] = [
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'actif', label: 'Actif' },
        { value: 'en_attente', label: 'En attente' },
        { value: 'archive', label: 'Archivé' },
      ],
      match: (r, v) => r.statut === v,
    },
    {
      id: 'role',
      label: 'Fonction',
      options: Array.from(new Set(contactsInitiaux.map((c) => c.fonction))).map((r) => ({ value: r, label: r })),
      match: (r, v) => r.fonction === v,
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <Section
        id="datagrid"
        title="Data grid"
        description="Un seul composant pour toutes les listes du produit : recherche, filtres, colonnes configurables, tri, sélection multiple, actions groupées, actions par ligne, densité et pagination. Chaque ligne ouvre la fiche détaillée au clic ou avec Entrée."
      >
        <DataGrid
          rows={contactsInitiaux}
          columns={columns}
          filters={filters}
          caption="Liste des contacts de l'association, triable et filtrable"
          searchKeys={(r) => `${r.prenom} ${r.nom} ${r.email} ${r.adresse.ville} ${r.fonction}`}
          searchPlaceholder="Rechercher un contact…"
          getRowLabel={(r) => `${r.prenom} ${r.nom}`}
          onRowClick={setDrawerRow}
          emptyIcon={<UserRound />}
          emptyAction={<Button variant="primary" iconLeft={<Plus aria-hidden className="h-4 w-4" />}>Nouveau contact</Button>}
          rowActions={[
            { label: 'Ouvrir la fiche', icon: <UserRound />, onSelect: setDrawerRow },
            { label: 'Envoyer un e-mail', icon: <Mail />, onSelect: (r) => toast({ titre: 'E-mail préparé', detail: `Destinataire : ${r.email}`, tone: 'neutral' }) },
            { label: 'Archiver', icon: <Archive />, onSelect: (r) => toast({ titre: 'Contact archivé', detail: `${r.prenom} ${r.nom} a été archivé.`, tone: 'neutral' }) },
            { label: 'Supprimer', icon: <Trash2 />, danger: true, separatorBefore: true, onSelect: setConfirmRow },
          ]}
          bulkActions={(selected, clear) => (
            <>
              <Button size="sm" iconLeft={<Mail aria-hidden className="h-3.5 w-3.5" />} onClick={() => { toast({ titre: `E-mail à ${selected.length} contacts`, detail: 'La campagne est prête à être relue.', tone: 'neutral' }); clear() }}>
                Envoyer un e-mail
              </Button>
              <Button size="sm" iconLeft={<Download aria-hidden className="h-3.5 w-3.5" />} onClick={() => { toast({ titre: 'Export lancé', detail: `${selected.length} lignes exportées en CSV.`, tone: 'success' }); clear() }}>
                Exporter
              </Button>
              <Button size="sm" variant="danger" iconLeft={<Trash2 aria-hidden className="h-3.5 w-3.5" />} onClick={() => { toast({ titre: 'Suppression annulée', detail: 'Confirmez chaque suppression depuis la fiche.', tone: 'warning' }); clear() }}>
                Supprimer
              </Button>
            </>
          )}
        />
      </Section>

      <Drawer
        open={!!drawerRow}
        onClose={() => setDrawerRow(null)}
        title={drawerRow ? `${drawerRow.prenom} ${drawerRow.nom}` : ''}
        description={drawerRow?.fonction}
      >
        {drawerRow && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={`${drawerRow.prenom} ${drawerRow.nom}`} size="lg" />
              <div>
                <p className="text-[0.8125rem] text-ink-500">{drawerRow.email}</p>
                <div className="mt-1.5">
                  <StatusBadge status={drawerRow.statut === 'archive' ? 'archive' : drawerRow.statut === 'en_attente' ? 'en_attente' : 'actif'} />
                </div>
              </div>
            </div>
            <dl className="divide-y divide-ink-100 border-y border-ink-100">
              {[
                ['Identifiant', drawerRow.id.toUpperCase()],
                ['Téléphone', drawerRow.telephones[0]?.numero ?? '—'],
                ['Ville', drawerRow.adresse.ville],
                ['Ajouté le', formatDate(drawerRow.creeLe)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-[0.8125rem] text-ink-500">{k}</dt>
                  <dd className="ac-num text-[0.8125rem] font-medium text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={!!confirmRow}
        onClose={() => setConfirmRow(null)}
        onConfirm={() => {
          toast({ titre: 'Contact supprimé', detail: `${confirmRow?.prenom} ${confirmRow?.nom} a été retiré de la base.`, tone: 'neutral' })
          setConfirmRow(null)
        }}
        title="Supprimer ce contact ?"
        description={`${confirmRow?.prenom ?? ''} ${confirmRow?.nom ?? ''} et son historique seront définitivement retirés de la base.`}
        confirmLabel="Supprimer définitivement"
      />
    </div>
  )
}
