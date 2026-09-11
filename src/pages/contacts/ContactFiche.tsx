import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Ban,
  Check,
  FileText,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge, Chip } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs } from '@/components/ui/Tabs'
import { Menu } from '@/components/ui/Menu'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { Timeline } from '@/components/ui/Timeline'
import { useContacts } from '@/context/ContactsContext'
import { useToast } from '@/context/ToastContext'
import { qualiteLabels, telephoneLabels, type Contact } from '@/lib/mock'
import { formatDate, formatDateLong } from '@/lib/utils'

const onglets = [
  { id: 'identite', label: 'Identité' },
  { id: 'association', label: 'Association' },
  { id: 'communication', label: 'Communication' },
  { id: 'documents', label: 'Documents' },
  { id: 'historique', label: 'Historique' },
]

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink-100 py-3 last:border-0 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="w-52 shrink-0 text-[0.8125rem] text-ink-500">{label}</dt>
      <dd className="min-w-0 flex-1 text-[0.8125rem] text-ink-900">{children}</dd>
    </div>
  )
}

function Vide({ children = 'Non renseigné' }: { children?: ReactNode }) {
  return <span className="text-ink-500">{children}</span>
}

export function ContactFiche() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { parId, chargement, supprimer, archiver } = useContacts()
  const [onglet, setOnglet] = useState('identite')
  const [aSupprimer, setASupprimer] = useState(false)
  const [aArchiver, setAArchiver] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const contact = parId(id)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Fiche contact" />}>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </Card>
      </Page>
    )
  }

  if (!contact) {
    return (
      <Page header={<PageHeader title="Contact introuvable" />}>
        <Card>
          <EmptyState
            icon={<UserRound />}
            title="Cette fiche n'existe plus"
            description="Elle a peut-être été supprimée. La liste des contacts reste accessible."
            action={<Button variant="primary" onClick={() => navigate('/contacts')}>Retour à la liste</Button>}
          />
        </Card>
      </Page>
    )
  }

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, apres?: () => void) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      apres?.()
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Contacts"
          title={`${contact.prenom} ${contact.nom}`}
          description={contact.fonction}
          meta={
            <>
              <StatusBadge status={contact.statut} />
              {contact.qualites.map((q) => (
                <Badge key={q} variant="outline">
                  {qualiteLabels[q]}
                </Badge>
              ))}
              <span className="ac-num text-2xs text-ink-500">Fiche {contact.id.toUpperCase()}</span>
            </>
          }
          actions={
            <>
              <Button onClick={() => navigate('/contacts')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Liste
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate(`/contacts/${contact.id}/modifier`)}
                iconLeft={<Pencil aria-hidden className="h-4 w-4" />}
              >
                Modifier
              </Button>
              <Menu
                label={`Autres actions pour ${contact.prenom} ${contact.nom}`}
                items={[
                  {
                    label: 'Envoyer un e-mail',
                    icon: <Mail />,
                    onSelect: () => toast({ titre: 'Brouillon préparé', detail: `Destinataire : ${contact.email}`, tone: 'neutral' }),
                  },
                  {
                    label: contact.statut === 'archive' ? 'Réactiver la fiche' : 'Archiver la fiche',
                    icon: contact.statut === 'archive' ? <ArchiveRestore /> : <Archive />,
                    onSelect: () => setAArchiver(true),
                  },
                  { type: 'separator' },
                  { label: 'Supprimer la fiche', icon: <Trash2 />, danger: true, onSelect: () => setASupprimer(true) },
                ]}
                trigger={({ toggle, open, ref }) => (
                  <Button ref={ref} variant="icon" label="Autres actions" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                    <span aria-hidden className="text-lg leading-none">⋯</span>
                  </Button>
                )}
              />
            </>
          }
        />
      }
    >
      {contact.statut === 'archive' && (
        <Alert
          tone="neutral"
          titre="Cette fiche est archivée"
          action={
            <Button size="sm" loading={enCours} onClick={() => setAArchiver(true)} iconLeft={<ArchiveRestore aria-hidden className="h-3.5 w-3.5" />}>
              Réactiver
            </Button>
          }
        >
          Elle est exclue de la liste active et des envois groupés. Ses données sont conservées.
        </Alert>
      )}

      <Tabs items={onglets} value={onglet} onChange={setOnglet} ariaLabel="Sections de la fiche contact" />

      <div role="tabpanel" aria-label={onglets.find((o) => o.id === onglet)?.label}>
        {onglet === 'identite' && <Identite contact={contact} />}
        {onglet === 'association' && <Association contact={contact} />}
        {onglet === 'communication' && <CommunicationTab contact={contact} />}
        {onglet === 'documents' && <Documents contact={contact} />}
        {onglet === 'historique' && (
          <Card>
            <CardHeader title="Historique" description="Toutes les actions consignées sur cette fiche, de la plus récente à la plus ancienne." />
            <CardBody>
              <Timeline evenements={contact.historique} />
            </CardBody>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={aSupprimer}
        onClose={() => setASupprimer(false)}
        onConfirm={() => {
          setASupprimer(false)
          void executer(
            () => supprimer([contact.id]),
            { titre: 'Contact supprimé', detail: `${contact.prenom} ${contact.nom} a été retiré de la base.` },
            () => navigate('/contacts'),
          )
        }}
        title="Supprimer cette fiche ?"
        description={`${contact.prenom} ${contact.nom}, ses ${contact.documents.length} document(s) et son historique seront définitivement retirés de la base.`}
        confirmLabel="Supprimer définitivement"
      />

      <ConfirmDialog
        open={aArchiver}
        tone={contact.statut === 'archive' ? 'primary' : 'danger'}
        onClose={() => setAArchiver(false)}
        onConfirm={() => {
          const versArchive = contact.statut !== 'archive'
          setAArchiver(false)
          void executer(() => archiver([contact.id], versArchive), {
            titre: versArchive ? 'Fiche archivée' : 'Fiche réactivée',
            detail: versArchive
              ? 'Elle reste consultable via le filtre Statut : Archivé.'
              : 'Elle réintègre la liste active.',
          })
        }}
        title={contact.statut === 'archive' ? 'Réactiver cette fiche ?' : 'Archiver cette fiche ?'}
        description={
          contact.statut === 'archive'
            ? 'La fiche réintègre la liste active, les envois groupés et les statistiques.'
            : "La fiche sort de la liste active et des envois groupés. Aucune donnée n'est supprimée."
        }
        confirmLabel={contact.statut === 'archive' ? 'Réactiver' : 'Archiver'}
      >
        {contact.statut !== 'archive' ? (
          <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
            L'archivage est réversible à tout moment depuis cette même fiche.
          </div>
        ) : undefined}
      </ConfirmDialog>
    </Page>
  )
}

/* ---------------- onglets ---------------- */

function Identite({ contact }: { contact: Contact }) {
  const a = contact.adresse
  const adresseVide = !a.ligne1 && !a.ville
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Identité" />
        <CardBody className="py-0">
          <dl>
            <Ligne label="Civilité">{contact.civilite}</Ligne>
            <Ligne label="Nom complet">
              {contact.prenom} {contact.nom}
            </Ligne>
            <Ligne label="Date de naissance">
              {contact.dateNaissance ? <span className="ac-num">{formatDateLong(contact.dateNaissance)}</span> : <Vide />}
            </Ligne>
            <Ligne label="Adresse e-mail">
              <span className="inline-flex items-center gap-1.5">
                <Mail aria-hidden className="h-3.5 w-3.5 text-ink-500" />
                {contact.email}
              </span>
            </Ligne>
            <Ligne label="Téléphones">
              {contact.telephones.length === 0 ? (
                <Vide />
              ) : (
                <ul className="flex flex-col gap-1">
                  {contact.telephones.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <Phone aria-hidden className="h-3.5 w-3.5 text-ink-500" />
                      <span className="ac-num">{t.numero}</span>
                      <Badge variant="outline">{telephoneLabels[t.type]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Ligne>
            <Ligne label="Adresse postale">
              {adresseVide ? (
                <Vide />
              ) : (
                <span className="flex items-start gap-2">
                  <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                  <span>
                    {a.ligne1}
                    {a.ligne2 && (
                      <>
                        <br />
                        {a.ligne2}
                      </>
                    )}
                    <br />
                    <span className="ac-num">{a.codePostal}</span> {a.ville}
                    <br />
                    {a.pays}
                  </span>
                </span>
              )}
            </Ligne>
          </dl>
        </CardBody>
      </Card>

      <div className="flex flex-col gap-4">
        <Card>
          <CardBody className="flex flex-col items-center gap-3 text-center">
            <Avatar name={`${contact.prenom} ${contact.nom}`} size="xl" />
            <div>
              <p className="font-display text-[0.9375rem] font-semibold text-ink-900">
                {contact.prenom} {contact.nom}
              </p>
              <p className="text-[0.8125rem] text-ink-500">{contact.fonction}</p>
            </div>
            <StatusBadge status={contact.statut} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Note interne" description="Non visible par le contact." />
          <CardBody>
            {contact.notes ? (
              <p className="text-[0.8125rem] leading-relaxed text-ink-700">{contact.notes}</p>
            ) : (
              <p className="text-[0.8125rem] text-ink-500">Aucune note pour cette fiche.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function Association({ contact }: { contact: Contact }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Rôle dans l'association" />
        <CardBody className="py-0">
          <dl>
            <Ligne label="Fonction">{contact.fonction || <Vide />}</Ligne>
            <Ligne label="Statut">
              <StatusBadge status={contact.statut} />
            </Ligne>
            <Ligne label="Date d'entrée">
              <span className="ac-num">{formatDateLong(contact.dateEntree)}</span>
            </Ligne>
            <Ligne label="Qualités">
              <span className="flex flex-wrap gap-1.5">
                {contact.qualites.map((q) => (
                  <Badge key={q} variant="brand">
                    {qualiteLabels[q]}
                  </Badge>
                ))}
              </span>
            </Ligne>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Groupes et tags" description="Modifiables depuis l'écran de modification." />
        <CardBody className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">Groupes</p>
            {contact.groupes.length === 0 ? (
              <p className="text-[0.8125rem] text-ink-500">Ce contact n'appartient à aucun groupe.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {contact.groupes.map((g) => (
                  <Chip key={g}>{g}</Chip>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-ink-100 pt-4">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">Tags</p>
            {contact.tags.length === 0 ? (
              <p className="text-[0.8125rem] text-ink-500">Aucun tag posé sur cette fiche.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {contact.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}

function CommunicationTab({ contact }: { contact: Contact }) {
  const c = contact.communication
  const canaux: [string, boolean, string][] = [
    ['E-mails de l’association', c.email, 'Convocations, comptes rendus, informations pratiques.'],
    ['SMS', c.sms, 'Rappels de dernière minute uniquement.'],
    ['Courrier postal', c.courrier, 'Envoi papier à l’adresse renseignée.'],
    ['Lettre d’information', c.lettreInfo, 'Un envoi par mois.'],
    ['Convocations aux assemblées', c.convocations, 'Obligatoire pour les adhérents à jour.'],
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader title="Canaux acceptés" description="Chaque canal est refusable indépendamment des autres." />
        <CardBody className="py-0">
          <ul>
            {canaux.map(([nom, actif, detail]) => (
              <li key={nom} className="flex items-start gap-3 border-b border-ink-100 py-3 last:border-0">
                <span
                  className={
                    actif
                      ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success-100 bg-success-50 text-success-600'
                      : 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-ink-100 text-ink-600'
                  }
                >
                  {actif ? <Check aria-hidden className="h-3 w-3" strokeWidth={3} /> : <Ban aria-hidden className="h-3 w-3" />}
                </span>
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium text-ink-900">
                    {nom} — {actif ? 'accepté' : 'refusé'}
                  </p>
                  <p className="text-xs text-ink-500">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Consentement" />
        <CardBody>
          {c.consentementLe ? (
            <>
              <p className="text-[0.8125rem] text-ink-700">
                Consentement recueilli le <span className="ac-num font-medium">{formatDateLong(c.consentementLe)}</span>.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-500">
                Conservé pour justifier les envois auprès du contact en cas de réclamation.
              </p>
            </>
          ) : (
            <Alert tone="warning" titre="Aucun consentement enregistré">
              Ce contact ne peut pas être inclus dans les envois groupés tant qu'un consentement n'a pas été recueilli.
            </Alert>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

function Documents({ contact }: { contact: Contact }) {
  const { toast } = useToast()
  return (
    <Card>
      <CardHeader
        title="Documents"
        description="Pièces rattachées à la fiche : bulletins, certificats, autorisations."
        action={
          <Button
            size="sm"
            iconLeft={<Upload aria-hidden className="h-3.5 w-3.5" />}
            onClick={() => toast({ titre: 'Dépôt de document', detail: 'Le stockage de fichiers arrive avec le module Documents.', tone: 'neutral' })}
          >
            Ajouter un document
          </Button>
        }
      />
      {contact.documents.length === 0 ? (
        <EmptyState
          icon={<FileText />}
          title="Aucun document sur cette fiche"
          description="Déposez le bulletin d'adhésion signé, un certificat médical ou une autorisation parentale."
          compact
          action={
            <Button
              variant="primary"
              iconLeft={<Upload aria-hidden className="h-4 w-4" />}
              onClick={() => toast({ titre: 'Dépôt de document', detail: 'Le stockage de fichiers arrive avec le module Documents.', tone: 'neutral' })}
            >
              Ajouter un document
            </Button>
          }
        />
      ) : (
        <ul className="divide-y divide-ink-100">
          {contact.documents.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-5 py-3">
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-ink-900">{d.nom}</p>
                <p className="ac-num truncate text-xs text-ink-500">
                  {d.categorie} · {d.taille} · ajouté le {formatDate(d.ajouteLe)} par {d.ajoutePar}
                </p>
              </div>
              <Badge variant="outline">{d.categorie}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
