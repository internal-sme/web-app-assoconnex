import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderPlus, Pencil, Plus, Tag as TagIcon, Trash2, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Menu } from '@/components/ui/Menu'
import { useContacts } from '@/context/ContactsContext'
import { useToast } from '@/context/ToastContext'
import type { Groupe, Tag } from '@/lib/mock'

export function GroupesTags() {
  usePageTitle('Groupes et étiquettes')

  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    groupes,
    tags,
    compterGroupe,
    compterTag,
    creerGroupe,
    modifierGroupe,
    supprimerGroupe,
    creerTag,
    renommerTag,
    supprimerTag,
  } = useContacts()

  const [formGroupe, setFormGroupe] = useState<{ mode: 'creer' | 'modifier'; groupe?: Groupe } | null>(null)
  const [nomGroupe, setNomGroupe] = useState('')
  const [descGroupe, setDescGroupe] = useState('')
  const [groupeASupprimer, setGroupeASupprimer] = useState<Groupe | null>(null)

  const [formTag, setFormTag] = useState<{ mode: 'creer' | 'modifier'; tag?: Tag } | null>(null)
  const [nomTag, setNomTag] = useState('')
  const [tagASupprimer, setTagASupprimer] = useState<Tag | null>(null)

  const [enCours, setEnCours] = useState(false)
  const [erreurForm, setErreurForm] = useState<string | null>(null)

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, fermer?: () => void) => {
    setEnCours(true)
    setErreurForm(null)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      fermer?.()
    } catch (e) {
      setErreurForm((e as Error).message)
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const ouvrirGroupe = (mode: 'creer' | 'modifier', groupe?: Groupe) => {
    setErreurForm(null)
    setNomGroupe(groupe?.nom ?? '')
    setDescGroupe(groupe?.description ?? '')
    setFormGroupe({ mode, groupe })
  }

  const ouvrirTag = (mode: 'creer' | 'modifier', tag?: Tag) => {
    setErreurForm(null)
    setNomTag(tag?.nom ?? '')
    setFormTag({ mode, tag })
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Contacts"
          title="Groupes et tags"
          description="Les groupes structurent l'association — sections, commissions, bureau. Les tags qualifient librement une fiche et servent aux filtres et aux envois ciblés."
          actions={
            <Button onClick={() => navigate('/contacts')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Retour aux contacts
            </Button>
          }
        />
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Groupes */}
        <Card>
          <CardHeader
            title="Groupes"
            description={`${groupes.length} groupe(s). Un contact peut appartenir à plusieurs groupes.`}
            action={
              <Button size="sm" variant="primary" iconLeft={<FolderPlus aria-hidden className="h-3.5 w-3.5" />} onClick={() => ouvrirGroupe('creer')}>
                Nouveau groupe
              </Button>
            }
          />
          {groupes.length === 0 ? (
            <EmptyState
              icon={<Users />}
              title="Aucun groupe"
              description="Créez un groupe pour rassembler les membres d'une section ou d'une commission."
              compact
              action={<Button variant="primary" onClick={() => ouvrirGroupe('creer')}>Créer un groupe</Button>}
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {groupes.map((g) => (
                <li key={g.id} className="flex items-start gap-3 px-5 py-3">
                  <span aria-hidden className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-medium text-ink-900">{g.nom}</p>
                    <p className="text-xs leading-relaxed text-ink-500">{g.description}</p>
                  </div>
                  <Badge variant="outline">{compterGroupe(g.nom)} membres</Badge>
                  <Menu
                    label={`Actions sur le groupe ${g.nom}`}
                    items={[
                      { label: 'Renommer', icon: <Pencil />, onSelect: () => ouvrirGroupe('modifier', g) },
                      { label: 'Supprimer', icon: <Trash2 />, danger: true, onSelect: () => setGroupeASupprimer(g) },
                    ]}
                    trigger={({ toggle, open, ref }) => (
                      <Button ref={ref} variant="icon" size="sm" label={`Actions sur ${g.nom}`} aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                        <span aria-hidden className="text-base leading-none">⋯</span>
                      </Button>
                    )}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader
            title="Tags"
            description={`${tags.length} tag(s). Libres, cumulables, utilisables comme filtre.`}
            action={
              <Button size="sm" variant="primary" iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />} onClick={() => ouvrirTag('creer')}>
                Nouveau tag
              </Button>
            }
          />
          {tags.length === 0 ? (
            <EmptyState
              icon={<TagIcon />}
              title="Aucun tag"
              description="Les tags servent à qualifier une fiche sans créer de structure : « Véhiculé », « À relancer »…"
              compact
              action={<Button variant="primary" onClick={() => ouvrirTag('creer')}>Créer un tag</Button>}
            />
          ) : (
            <CardBody className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-white py-1 pl-3 pr-1 shadow-xs">
                  <span className="text-[0.8125rem] text-ink-800">{t.nom}</span>
                  <span className="ac-num rounded-full bg-ink-100 px-1.5 py-0.5 text-2xs font-semibold text-ink-600">
                    {compterTag(t.nom)}
                  </span>
                  <Button variant="icon" size="sm" label={`Renommer le tag ${t.nom}`} onClick={() => ouvrirTag('modifier', t)}>
                    <Pencil aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="icon"
                    size="sm"
                    label={`Supprimer le tag ${t.nom}`}
                    className="text-ink-500 hover:bg-danger-50 hover:text-danger-600"
                    onClick={() => setTagASupprimer(t)}
                  >
                    <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                </span>
              ))}
            </CardBody>
          )}
        </Card>
      </div>

      {/* Formulaire groupe */}
      <Modal
        open={!!formGroupe}
        onClose={() => setFormGroupe(null)}
        title={formGroupe?.mode === 'creer' ? 'Nouveau groupe' : `Modifier « ${formGroupe?.groupe?.nom} »`}
        description="Le renommage met à jour toutes les fiches rattachées au groupe."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormGroupe(null)} disabled={enCours}>
              Annuler
            </Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nomGroupe.trim()}
              onClick={() => {
                const f = formGroupe!
                void executer(
                  () =>
                    f.mode === 'creer'
                      ? creerGroupe(nomGroupe.trim(), descGroupe.trim())
                      : modifierGroupe(f.groupe!.id, { nom: nomGroupe.trim(), description: descGroupe.trim() }),
                  {
                    titre: f.mode === 'creer' ? 'Groupe créé' : 'Groupe mis à jour',
                    detail: `« ${nomGroupe.trim()} » est disponible dans les filtres et les fiches.`,
                  },
                  () => setFormGroupe(null),
                )
              }}
            >
              {formGroupe?.mode === 'creer' ? 'Créer le groupe' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          {erreurForm && (
            <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 p-3 text-[0.8125rem] text-danger-700">
              {erreurForm}
            </p>
          )}
          <Field label="Nom du groupe" required error={!nomGroupe.trim() ? undefined : undefined}>
            {(p) => <Input {...p} value={nomGroupe} onChange={(e) => setNomGroupe(e.target.value)} placeholder="Section randonnée" />}
          </Field>
          <Field label="Description" hint="Ce que fait le groupe, en une phrase.">
            {(p) => <Textarea {...p} rows={3} value={descGroupe} onChange={(e) => setDescGroupe(e.target.value)} placeholder="Sorties du dimanche et séjours annuels." />}
          </Field>
        </div>
      </Modal>

      {/* Formulaire tag */}
      <Modal
        open={!!formTag}
        onClose={() => setFormTag(null)}
        size="sm"
        title={formTag?.mode === 'creer' ? 'Nouveau tag' : `Renommer « ${formTag?.tag?.nom} »`}
        description="Le renommage s'applique à toutes les fiches portant ce tag."
        footer={
          <>
            <Button variant="ghost" onClick={() => setFormTag(null)} disabled={enCours}>
              Annuler
            </Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nomTag.trim()}
              onClick={() => {
                const f = formTag!
                void executer(
                  () => (f.mode === 'creer' ? creerTag(nomTag.trim()) : renommerTag(f.tag!.id, nomTag.trim())),
                  {
                    titre: f.mode === 'creer' ? 'Tag créé' : 'Tag renommé',
                    detail: `« ${nomTag.trim()} » est disponible dans les filtres et les fiches.`,
                  },
                  () => setFormTag(null),
                )
              }}
            >
              {formTag?.mode === 'creer' ? 'Créer le tag' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="py-2">
          {erreurForm && (
            <p role="alert" className="mb-3 rounded-lg border border-danger-100 bg-danger-50 p-3 text-[0.8125rem] text-danger-700">
              {erreurForm}
            </p>
          )}
          <Field label="Nom du tag" required>
            {(p) => <Input {...p} value={nomTag} onChange={(e) => setNomTag(e.target.value)} placeholder="Véhiculé" />}
          </Field>
        </div>
      </Modal>

      {/* Suppressions — actions sensibles */}
      <ConfirmDialog
        open={!!groupeASupprimer}
        onClose={() => setGroupeASupprimer(null)}
        onConfirm={() => {
          const g = groupeASupprimer!
          setGroupeASupprimer(null)
          void executer(() => supprimerGroupe(g.id), {
            titre: 'Groupe supprimé',
            detail: `« ${g.nom} » a été retiré des fiches concernées.`,
          })
        }}
        title={`Supprimer le groupe « ${groupeASupprimer?.nom} » ?`}
        description={`Le groupe sera retiré de ${compterGroupe(groupeASupprimer?.nom ?? '')} fiche(s). Les contacts eux-mêmes ne sont pas supprimés.`}
        confirmLabel="Supprimer le groupe"
      />

      <ConfirmDialog
        open={!!tagASupprimer}
        onClose={() => setTagASupprimer(null)}
        onConfirm={() => {
          const t = tagASupprimer!
          setTagASupprimer(null)
          void executer(() => supprimerTag(t.id), {
            titre: 'Tag supprimé',
            detail: `« ${t.nom} » a été retiré des fiches concernées.`,
          })
        }}
        title={`Supprimer le tag « ${tagASupprimer?.nom} » ?`}
        description={`Le tag sera retiré de ${compterTag(tagASupprimer?.nom ?? '')} fiche(s). Les contacts eux-mêmes ne sont pas supprimés.`}
        confirmLabel="Supprimer le tag"
      />
    </Page>
  )
}
