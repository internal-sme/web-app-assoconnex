import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  FlaskConical,
  FolderPlus,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Tags,
  Trash2,
  UserRound,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, Chip } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Menu } from '@/components/ui/Menu'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { useContacts, type ModeDemo } from '@/context/ContactsContext'
import { useToast } from '@/context/ToastContext'
import { qualiteLabels, type Contact } from '@/lib/mock'
import { formatDate } from '@/lib/utils'

const modes: { value: ModeDemo; label: string }[] = [
  { value: 'normal', label: 'Données normales' },
  { value: 'chargement', label: 'Chargement' },
  { value: 'vide', label: 'Liste vide' },
  { value: 'erreur', label: 'Erreur de chargement' },
  { value: 'echec', label: 'Échec de sauvegarde' },
]

export function ContactsListe() {
  usePageTitle('Contacts')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { contacts, groupes, chargement, erreur, recharger, mode, setMode, supprimer, archiver, ajouterAuGroupe } =
    useContacts()

  const [aSupprimer, setASupprimer] = useState<Contact[] | null>(null)
  const [aArchiver, setAArchiver] = useState<{ rows: Contact[]; archiver: boolean } | null>(null)
  const [groupeCible, setGroupeCible] = useState<Contact[] | null>(null)
  const [groupeChoisi, setGroupeChoisi] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [viderSelection, setViderSelection] = useState<(() => void) | null>(null)

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      viderSelection?.()
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const columns: Column<Contact>[] = [
    {
      id: 'nom',
      header: 'Contact',
      sortValue: (r) => `${r.nom} ${r.prenom}`,
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={`${r.prenom} ${r.nom}`} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">
              {r.prenom} {r.nom}
            </p>
            <p className="truncate text-xs text-ink-500">{r.email}</p>
          </div>
        </div>
      ),
    },
    { id: 'fonction', header: 'Fonction', sortValue: (r) => r.fonction, cell: (r) => r.fonction },
    {
      id: 'qualites',
      header: 'Qualités',
      cell: (r) => (
        <span className="flex flex-wrap gap-1">
          {r.qualites.map((q) => (
            <Badge key={q} variant="outline">
              {qualiteLabels[q]}
            </Badge>
          ))}
        </span>
      ),
    },
    {
      id: 'groupes',
      header: 'Groupes',
      optional: true,
      cell: (r) =>
        r.groupes.length === 0 ? (
          <span className="text-ink-500">—</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {r.groupes.map((g) => (
              <Badge key={g}>{g}</Badge>
            ))}
          </span>
        ),
    },
    { id: 'ville', header: 'Ville', optional: true, sortValue: (r) => r.adresse.ville, cell: (r) => r.adresse.ville },
    {
      id: 'telephone',
      header: 'Téléphone',
      optional: true,
      defaultHidden: true,
      cell: (r) => <span className="ac-num">{r.telephones[0]?.numero ?? '—'}</span>,
    },
    {
      id: 'entree',
      header: 'Entrée le',
      optional: true,
      defaultHidden: true,
      sortValue: (r) => r.dateEntree,
      cell: (r) => <span className="ac-num">{formatDate(r.dateEntree)}</span>,
    },
    {
      id: 'statut',
      header: 'Statut',
      align: 'right',
      sortValue: (r) => r.statut,
      cell: (r) => <StatusBadge status={r.statut} />,
    },
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
      id: 'qualite',
      label: 'Qualité',
      options: [
        { value: 'adherent', label: 'Adhérent' },
        { value: 'benevole', label: 'Bénévole' },
        { value: 'salarie', label: 'Salarié' },
      ],
      match: (r, v) => r.qualites.includes(v as never),
    },
    {
      id: 'groupe',
      label: 'Groupe',
      options: groupes.map((g) => ({ value: g.nom, label: g.nom })),
      match: (r, v) => r.groupes.includes(v),
    },
  ]

  const enTete = (
    <PageHeader
      eyebrow="Base de données"
      title="Contacts"
      description="Toutes les personnes liées à l'association : adhérents, bénévoles, salariés, partenaires. Chaque fiche centralise l'identité, le rôle, les préférences de communication et l'historique."
      meta={
        <>
          <Badge variant="brand">{contacts.length} fiches</Badge>
          {mode !== 'normal' && <Chip icon={<FlaskConical aria-hidden className="h-3 w-3" />}>Démo : {modes.find((m) => m.value === mode)?.label}</Chip>}
        </>
      }
      actions={
        <>
          <Menu
            label="États de démonstration"
            width="w-60"
            items={modes.map((m) => ({
              label: (mode === m.value ? '✓ ' : '') + m.label,
              onSelect: () => setMode(m.value),
            }))}
            trigger={({ toggle, open, ref }) => (
              <Button ref={ref} onClick={toggle} aria-expanded={open} aria-haspopup="menu" iconLeft={<FlaskConical aria-hidden className="h-4 w-4" />}>
                États
              </Button>
            )}
          />
          <Button onClick={() => navigate('/contacts/groupes')} iconLeft={<Tags aria-hidden className="h-4 w-4" />}>
            Groupes et tags
          </Button>
          <Button variant="primary" onClick={() => navigate('/contacts/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouveau contact
          </Button>
        </>
      }
    />
  )

  /* --- état erreur --- */
  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <Alert
          tone="danger"
          titre="Les contacts n'ont pas pu être chargés"
          action={
            <Button variant="secondary" onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>
              Réessayer
            </Button>
          }
        >
          {erreur} Vos données ne sont pas perdues : elles n'ont simplement pas pu être récupérées.
        </Alert>
      </Page>
    )
  }

  /* --- état liste vide --- */
  if (!chargement && contacts.length === 0) {
    return (
      <Page header={enTete}>
        <Card>
          <EmptyState
            icon={<UserRound />}
            title="Aucun contact pour l'instant"
            description="Créez la première fiche pour démarrer la base. Vous pourrez ensuite la rattacher à un groupe, lui poser des tags et suivre son historique."
            action={
              <Button variant="primary" onClick={() => navigate('/contacts/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Créer un contact
              </Button>
            }
            secondaryAction={
              <Button onClick={() => navigate('/contacts/groupes')}>Préparer les groupes</Button>
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <DataGrid
        rows={contacts}
        columns={columns}
        filters={filters}
        loading={chargement}
        caption="Liste des contacts de l'association, triable, filtrable et sélectionnable"
        searchKeys={(r) =>
          `${r.prenom} ${r.nom} ${r.email} ${r.adresse.ville} ${r.fonction} ${r.groupes.join(' ')} ${r.tags.join(' ')} ${r.telephones.map((t) => t.numero).join(' ')}`
        }
        searchPlaceholder="Rechercher un nom, un e-mail, une ville, un groupe…"
        getRowLabel={(r) => `${r.prenom} ${r.nom}`}
        onRowClick={(r) => navigate(`/contacts/${r.id}`)}
        emptyIcon={<UserRound />}
        emptyTitle="Aucun contact ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre. Les contacts archivés sont masqués tant que le filtre Statut n'est pas réglé sur « Archivé »."
        rowActions={[
          { label: 'Ouvrir la fiche', icon: <UserRound />, onSelect: (r) => navigate(`/contacts/${r.id}`) },
          { label: 'Modifier', icon: <Pencil />, onSelect: (r) => navigate(`/contacts/${r.id}/modifier`) },
          {
            label: 'Envoyer un e-mail',
            icon: <Mail />,
            onSelect: (r) => toast({ titre: 'Brouillon préparé', detail: `Destinataire : ${r.email}`, tone: 'neutral' }),
          },
          {
            label: 'Archiver',
            icon: <Archive />,
            onSelect: (r) => setAArchiver({ rows: [r], archiver: r.statut !== 'archive' }),
          },
          { label: 'Supprimer', icon: <Trash2 />, danger: true, separatorBefore: true, onSelect: (r) => setASupprimer([r]) },
        ]}
        bulkActions={(selected, clear) => {
          return (
            <>
              <Button
                size="sm"
                iconLeft={<FolderPlus aria-hidden className="h-3.5 w-3.5" />}
                onClick={() => {
                  setViderSelection(() => clear)
                  setGroupeChoisi(groupes[0]?.nom ?? '')
                  setGroupeCible(selected)
                }}
              >
                Ajouter à un groupe
              </Button>
              <Button
                size="sm"
                iconLeft={<Archive aria-hidden className="h-3.5 w-3.5" />}
                onClick={() => {
                  setViderSelection(() => clear)
                  setAArchiver({ rows: selected, archiver: true })
                }}
              >
                Archiver
              </Button>
              <Button
                size="sm"
                iconLeft={<ArchiveRestore aria-hidden className="h-3.5 w-3.5" />}
                onClick={() => {
                  setViderSelection(() => clear)
                  setAArchiver({ rows: selected, archiver: false })
                }}
              >
                Réactiver
              </Button>
              <Button
                size="sm"
                variant="danger"
                iconLeft={<Trash2 aria-hidden className="h-3.5 w-3.5" />}
                onClick={() => {
                  setViderSelection(() => clear)
                  setASupprimer(selected)
                }}
              >
                Supprimer
              </Button>
            </>
          )
        }}
      />

      {/* Suppression — action sensible, confirmation explicite */}
      <ConfirmDialog
        open={!!aSupprimer}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const cibles = aSupprimer ?? []
          setASupprimer(null)
          void executer(() => supprimer(cibles.map((c) => c.id)), {
            titre: cibles.length > 1 ? `${cibles.length} contacts supprimés` : 'Contact supprimé',
            detail:
              cibles.length === 1
                ? `${cibles[0].prenom} ${cibles[0].nom} a été retiré de la base.`
                : 'Les fiches et leur historique ont été retirés de la base.',
          })
        }}
        title={aSupprimer && aSupprimer.length > 1 ? `Supprimer ${aSupprimer.length} contacts ?` : 'Supprimer ce contact ?'}
        description={
          aSupprimer && aSupprimer.length === 1
            ? `${aSupprimer[0].prenom} ${aSupprimer[0].nom}, ses documents et son historique seront définitivement retirés de la base.`
            : `${aSupprimer?.length ?? 0} fiches, leurs documents et leur historique seront définitivement retirés de la base.`
        }
        confirmLabel="Supprimer définitivement"
      />

      {/* Archivage — action sensible, confirmation explicite */}
      <ConfirmDialog
        open={!!aArchiver}
        tone={aArchiver?.archiver ? 'danger' : 'primary'}
        onClose={() => setAArchiver(null)}
        onConfirm={() => {
          const c = aArchiver
          setAArchiver(null)
          if (!c) return
          void executer(() => archiver(c.rows.map((r) => r.id), c.archiver), {
            titre: c.archiver
              ? c.rows.length > 1
                ? `${c.rows.length} contacts archivés`
                : 'Contact archivé'
              : c.rows.length > 1
                ? `${c.rows.length} contacts réactivés`
                : 'Contact réactivé',
            detail: c.archiver
              ? 'Les fiches restent consultables via le filtre Statut : Archivé.'
              : 'Les fiches reviennent dans la liste active.',
          })
        }}
        title={aArchiver?.archiver ? (aArchiver.rows.length > 1 ? `Archiver ${aArchiver.rows.length} contacts ?` : 'Archiver ce contact ?') : 'Réactiver ces contacts ?'}
        description={
          aArchiver?.archiver
            ? "Les fiches sortent de la liste active et des envois groupés. Elles restent consultables et peuvent être réactivées à tout moment."
            : 'Les fiches réintègrent la liste active et les envois groupés.'
        }
        confirmLabel={aArchiver?.archiver ? 'Archiver' : 'Réactiver'}
      >
        {aArchiver?.archiver ? (
          <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
            L'archivage est réversible. Pour un retrait définitif, utilisez la suppression.
          </div>
        ) : undefined}
      </ConfirmDialog>

      {/* Action groupée : rattachement à un groupe */}
      <Modal
        open={!!groupeCible}
        onClose={() => setGroupeCible(null)}
        title={`Ajouter ${groupeCible?.length ?? 0} contact(s) à un groupe`}
        description="Les contacts déjà membres du groupe ne seront pas dupliqués."
        footer={
          <>
            <Button variant="ghost" onClick={() => setGroupeCible(null)} disabled={enCours}>
              Annuler
            </Button>
            <Button
              variant="primary"
              loading={enCours}
              onClick={() => {
                const cibles = groupeCible ?? []
                const nom = groupeChoisi
                setGroupeCible(null)
                void executer(() => ajouterAuGroupe(cibles.map((c) => c.id), nom), {
                  titre: 'Groupe mis à jour',
                  detail: `${cibles.length} contact(s) ajouté(s) à « ${nom} ».`,
                })
              }}
            >
              Ajouter au groupe
            </Button>
          </>
        }
      >
        <div className="py-2">
          <Field label="Groupe" required>
            {(p) => (
              <Select
                {...p}
                value={groupeChoisi}
                onChange={(e) => setGroupeChoisi(e.target.value)}
                options={groupes.map((g) => ({ value: g.nom, label: g.nom }))}
              />
            )}
          </Field>
        </div>
      </Modal>
    </Page>
  )
}
