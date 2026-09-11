import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, History, Link2, Lock, Share2, Star, Trash2, Upload } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge, Chip } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Menu } from '@/components/ui/Menu'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { Timeline } from '@/components/ui/Timeline'
import { DocsNav } from '@/components/documents/DocsNav'
import { useDocuments } from '@/context/DocumentsContext'
import { useToast } from '@/context/ToastContext'
import {
  cheminDe,
  formatTaille,
  groupeLabels,
  niveauLabels,
  type Groupe,
  type NiveauDroit,
  type Permission,
} from '@/lib/documents'
import { formatDate, formatDateLong } from '@/lib/utils'

const onglets = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'versions', label: 'Versions' },
  { id: 'droits', label: 'Droits d’accès' },
  { id: 'historique', label: 'Historique' },
]

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
      <dt className="text-[0.8125rem] text-ink-500">{label}</dt>
      <dd className="ac-num text-right text-[0.8125rem] font-medium text-ink-900">{children}</dd>
    </div>
  )
}

export function DocumentFiche() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    documentParId, dossiers, chargement,
    basculerFavori, supprimer, restaurer, modifierDroits, basculerPartage,
    ajouterVersion, restaurerVersion, ajouterTag, retirerTag, renommer,
  } = useDocuments()

  const [onglet, setOnglet] = useState('apercu')
  const [droitsOuverts, setDroitsOuverts] = useState(false)
  const [brouillonDroits, setBrouillonDroits] = useState<Permission[]>([])
  const [versionOuverte, setVersionOuverte] = useState(false)
  const [commentaireVersion, setCommentaireVersion] = useState('')
  const [aRestaurer, setARestaurer] = useState<string | null>(null)
  const [aSupprimer, setASupprimer] = useState(false)
  const [nouveauTag, setNouveauTag] = useState('')
  const [renommerOuvert, setRenommerOuvert] = useState(false)
  const [nouveauNom, setNouveauNom] = useState('')
  const [enCours, setEnCours] = useState(false)

  const d = documentParId(id)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Document" />}>
        <Card className="p-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-4 h-40 w-full" />
        </Card>
      </Page>
    )
  }

  if (!d) {
    return (
      <Page header={<PageHeader title="Document introuvable" />}>
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Ce document n'existe plus"
            description="Il a peut-être été supprimé définitivement depuis la corbeille."
            action={<Button variant="primary" onClick={() => navigate('/documents/explorateur')}>Retour à l'explorateur</Button>}
          />
        </Card>
      </Page>
    )
  }

  const chemin = cheminDe(d.dossierId, dossiers)
  const versionCourante = d.versions[0]
  const restreint = d.permissions.filter((p) => p.niveau === 'aucun').length >= 3

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
          eyebrow={chemin.map((c) => c.nom).join(' › ')}
          title={d.nom}
          description={`${d.typeMime} · ${formatTaille(d.taille)} · version ${versionCourante.numero}`}
          meta={
            <>
              <Badge variant="outline">{d.extension.toUpperCase()}</Badge>
              {d.supprime && <StatusBadge status="doc_corbeille" />}
              {d.partage?.actif && <StatusBadge status="doc_partage" />}
              {restreint && <StatusBadge status="doc_prive" />}
              {!d.apercuDisponible && <StatusBadge status="apercu_indisponible" />}
            </>
          }
          actions={
            <>
              <Button onClick={() => navigate(`/documents/explorateur?dossier=${d.dossierId}`)} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Dossier
              </Button>
              <Button
                onClick={() => void basculerFavori(d.id)}
                iconLeft={<Star aria-hidden className={d.favori ? 'h-4 w-4 fill-warning-500 text-warning-500' : 'h-4 w-4'} />}
              >
                {d.favori ? 'Retiré des favoris' : 'Ajouter aux favoris'}
              </Button>
              <Button
                variant="primary"
                onClick={() => toast({ titre: 'Téléchargement', detail: 'Le stockage réel de fichiers arrive en V2.', tone: 'neutral' })}
                iconLeft={<Download aria-hidden className="h-4 w-4" />}
              >
                Télécharger
              </Button>
              <Menu
                label={`Autres actions pour ${d.nom}`}
                items={[
                  { label: 'Renommer', icon: <FileText />, onSelect: () => { setNouveauNom(d.nom); setRenommerOuvert(true) } },
                  { label: 'Déposer une nouvelle version', icon: <Upload />, onSelect: () => { setCommentaireVersion(''); setVersionOuverte(true) } },
                  { label: 'Modifier les droits', icon: <Lock />, onSelect: () => { setBrouillonDroits(d.permissions); setDroitsOuverts(true) } },
                  { label: d.partage?.actif ? 'Révoquer le lien de partage' : 'Créer un lien de partage', icon: <Share2 />, onSelect: () => void executer(() => basculerPartage(d.id, !d.partage?.actif), { titre: d.partage?.actif ? 'Lien révoqué' : 'Lien créé', detail: d.partage?.actif ? 'Le lien ne fonctionne plus.' : 'Toute personne détenant le lien peut consulter le fichier.' }) },
                  { type: 'separator' },
                  d.supprime
                    ? { label: 'Restaurer', icon: <History />, onSelect: () => void executer(() => restaurer(d.id), { titre: 'Document restauré', detail: `${d.nom} est de retour dans son dossier.` }) }
                    : { label: 'Mettre à la corbeille', icon: <Trash2 />, danger: true, onSelect: () => setASupprimer(true) },
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
      <DocsNav />

      {d.supprime && (
        <Alert
          tone="neutral"
          titre="Ce document est dans la corbeille"
          action={
            <Button size="sm" loading={enCours} onClick={() => void executer(() => restaurer(d.id), { titre: 'Document restauré', detail: `${d.nom} est de retour dans son dossier.` })}>
              Restaurer
            </Button>
          }
        >
          Supprimé le {d.supprimeLe ? formatDateLong(d.supprimeLe) : '—'}. Il sera purgé automatiquement après trente jours.
        </Alert>
      )}

      {d.partage?.actif && (
        <Alert tone="warning" titre="Document accessible par lien public">
          <span className="ac-num">{d.partage.lien}</span> — partagé par {d.partage.parQui}
          {d.partage.expireLe ? `, expire le ${formatDate(d.partage.expireLe)}` : ', sans date d’expiration'}. Ce lien
          contourne les droits d'accès définis ci-dessous.
        </Alert>
      )}

      <Tabs items={onglets} value={onglet} onChange={setOnglet} ariaLabel="Sections du document" />

      <div role="tabpanel" aria-label={onglets.find((o) => o.id === onglet)?.label} className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {onglet === 'apercu' && (
            <Card>
              <CardHeader title="Aperçu" description={`Version ${versionCourante.numero}, déposée le ${formatDate(versionCourante.creeLe)}.`} />
              <CardBody>
                {d.apercuDisponible ? (
                  <div className="flex h-80 flex-col items-center justify-center rounded-lg border border-ink-200 bg-ink-25">
                    <FileText aria-hidden className="h-10 w-10 text-ink-500" />
                    <p className="ac-num mt-3 text-sm font-semibold uppercase text-ink-600">{d.extension}</p>
                    <p className="mt-1 max-w-sm px-6 text-center text-[0.8125rem] leading-relaxed text-ink-500">
                      Le rendu du fichier s'affichera ici. La génération d'aperçus arrive avec le stockage réel.
                    </p>
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText />}
                    title="Aperçu indisponible pour ce format"
                    description={`AssoConnex ne sait pas produire de rendu pour un fichier ${d.extension.toUpperCase()}. Téléchargez-le pour le consulter dans le logiciel adapté.`}
                    compact
                    action={
                      <Button variant="primary" onClick={() => toast({ titre: 'Téléchargement', detail: 'Le stockage réel arrive en V2.', tone: 'neutral' })} iconLeft={<Download aria-hidden className="h-4 w-4" />}>
                        Télécharger le fichier
                      </Button>
                    }
                  />
                )}
              </CardBody>
            </Card>
          )}

          {onglet === 'versions' && (
            <Card>
              <CardHeader
                title="Versions"
                description={`${d.versions.length} version(s). La plus récente fait foi.`}
                action={
                  <Button size="sm" onClick={() => { setCommentaireVersion(''); setVersionOuverte(true) }} iconLeft={<Upload aria-hidden className="h-3.5 w-3.5" />}>
                    Déposer une version
                  </Button>
                }
              />
              <ul className="divide-y divide-ink-100">
                {d.versions.map((v, i) => (
                  <li key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <span aria-hidden className="ac-num flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-xs font-semibold text-ink-700">
                      v{v.numero}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] text-ink-900">{v.commentaire}</p>
                      <p className="ac-num truncate text-xs text-ink-500">
                        {formatDate(v.creeLe)} · {v.creePar} · {formatTaille(v.taille)}
                      </p>
                    </div>
                    {i === 0 ? (
                      <StatusBadge status="version_courante" />
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setARestaurer(v.id)}>
                        Restaurer
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {onglet === 'droits' && (
            <Card>
              <CardHeader
                title="Droits d’accès"
                description="Qui peut consulter, modifier ou administrer ce document."
                action={
                  <Button size="sm" onClick={() => { setBrouillonDroits(d.permissions); setDroitsOuverts(true) }} iconLeft={<Lock aria-hidden className="h-3.5 w-3.5" />}>
                    Modifier
                  </Button>
                }
              />
              <ul className="divide-y divide-ink-100">
                {d.permissions.map((p) => (
                  <li key={p.groupe} className="flex items-center gap-3 px-5 py-3">
                    <span className="min-w-0 flex-1 text-[0.8125rem] font-medium text-ink-900">{groupeLabels[p.groupe]}</span>
                    <Badge variant={p.niveau === 'aucun' ? 'outline' : p.niveau === 'admin' ? 'brand' : 'neutral'}>
                      {niveauLabels[p.niveau]}
                    </Badge>
                  </li>
                ))}
              </ul>
              <CardBody className="border-t border-ink-100">
                <p className="text-xs leading-relaxed text-ink-500">
                  Un lien de partage public passe outre ces droits. Vérifiez l'onglet Aperçu pour savoir si un lien est
                  actif sur ce document.
                </p>
              </CardBody>
            </Card>
          )}

          {onglet === 'historique' && (
            <Card>
              <CardHeader title="Historique" description="Dépôts, versions, partages et modifications de droits." />
              <CardBody>
                <Timeline evenements={d.historique} />
              </CardBody>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Informations" />
            <CardBody className="py-0">
              <dl>
                <Ligne label="Nom">{d.nom}</Ligne>
                <Ligne label="Type">{d.typeMime}</Ligne>
                <Ligne label="Taille">{formatTaille(d.taille)}</Ligne>
                <Ligne label="Version">{versionCourante.numero}</Ligne>
                <Ligne label="Déposé par">{d.creePar}</Ligne>
                <Ligne label="Déposé le">{formatDate(d.creeLe)}</Ligne>
                <Ligne label="Modifié le">{formatDate(d.modifieLe)}</Ligne>
                <Ligne label="Dossier">{chemin[chemin.length - 1]?.nom ?? '—'}</Ligne>
                <Ligne label="Association">{d.association}</Ligne>
                <Ligne label="Projet">{d.projet ?? 'Non rattaché'}</Ligne>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Tags" description="Servent aux filtres et à la recherche." />
            <CardBody className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-1.5">
                {d.tags.length === 0 && <p className="text-[0.8125rem] text-ink-500">Aucun tag sur ce document.</p>}
                {d.tags.map((t) => (
                  <Chip key={t} onRemove={() => void retirerTag(d.id, t)}>
                    {t}
                  </Chip>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={nouveauTag}
                  onChange={(e) => setNouveauTag(e.target.value)}
                  placeholder="Ajouter un tag"
                  aria-label="Nouveau tag"
                  className="h-8 text-[0.8125rem]"
                />
                <Button
                  size="sm"
                  disabled={!nouveauTag.trim()}
                  onClick={() =>
                    void executer(() => ajouterTag(d.id, nouveauTag.trim()), { titre: 'Tag ajouté', detail: nouveauTag.trim() }, () => setNouveauTag(''))
                  }
                >
                  Ajouter
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Partage" />
            <CardBody className="flex flex-col gap-3">
              <Switch
                label="Lien de partage public"
                description="Accessible sans authentification par toute personne détenant l’adresse."
                checked={!!d.partage?.actif}
                onCheckedChange={(v) =>
                  void executer(() => basculerPartage(d.id, v), {
                    titre: v ? 'Lien créé' : 'Lien révoqué',
                    detail: v ? 'Le document est accessible par lien.' : 'Le lien ne fonctionne plus.',
                  })
                }
              />
              {d.partage?.actif && (
                <div className="flex items-center gap-2 rounded-lg border border-ink-200 bg-ink-25 p-2.5">
                  <Link2 aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                  <span className="ac-num min-w-0 flex-1 truncate text-xs text-ink-700">{d.partage.lien}</span>
                  <Button size="sm" variant="ghost" onClick={() => toast({ titre: 'Lien copié', detail: 'Collez-le dans votre message.', tone: 'success' })}>
                    Copier
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modification des droits — action sensible */}
      <Modal
        open={droitsOuverts}
        onClose={() => setDroitsOuverts(false)}
        size="lg"
        title="Modifier les droits d’accès"
        description="Ces droits s'appliquent à toutes les versions du document."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDroitsOuverts(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="danger"
              loading={enCours}
              onClick={() =>
                void executer(
                  () => modifierDroits(d.id, brouillonDroits),
                  { titre: 'Droits modifiés', detail: 'Les nouveaux droits prennent effet immédiatement.' },
                  () => setDroitsOuverts(false),
                )
              }
            >
              Appliquer les nouveaux droits
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
            Modifier les droits prend effet immédiatement pour tous les membres concernés, sans notification. Retirer
            l'accès au bureau peut rendre le document inadministrable.
          </div>
          <div className="flex flex-col gap-3">
            {brouillonDroits.map((p) => (
              <div key={p.groupe} className="grid grid-cols-[minmax(0,1fr)_14rem] items-center gap-3">
                <span className="text-[0.8125rem] font-medium text-ink-900">{groupeLabels[p.groupe as Groupe]}</span>
                <Select
                  aria-label={`Niveau d’accès pour ${groupeLabels[p.groupe as Groupe]}`}
                  value={p.niveau}
                  onChange={(e) =>
                    setBrouillonDroits((l) =>
                      l.map((x) => (x.groupe === p.groupe ? { ...x, niveau: e.target.value as NiveauDroit } : x)),
                    )
                  }
                  options={(Object.keys(niveauLabels) as NiveauDroit[]).map((n) => ({ value: n, label: niveauLabels[n] }))}
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={versionOuverte}
        onClose={() => setVersionOuverte(false)}
        title="Déposer une nouvelle version"
        description="La version précédente reste consultable et restaurable."
        footer={
          <>
            <Button variant="ghost" onClick={() => setVersionOuverte(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!commentaireVersion.trim()}
              onClick={() =>
                void executer(
                  () => ajouterVersion(d.id, commentaireVersion.trim(), Math.round(d.taille * 1.05)),
                  { titre: 'Nouvelle version déposée', detail: `Version ${versionCourante.numero + 1} en vigueur.` },
                  () => { setVersionOuverte(false); setOnglet('versions') },
                )
              }
            >
              Déposer
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border border-dashed border-ink-300 bg-ink-25 px-4 py-6 text-center">
            <Upload aria-hidden className="mx-auto h-6 w-6 text-ink-500" />
            <p className="mt-2 text-[0.8125rem] font-medium text-ink-800">Déposez le fichier mis à jour</p>
            <p className="mt-1 text-xs text-ink-500">Le dépôt réel arrive avec le stockage de fichiers.</p>
          </div>
          <Field label="Commentaire de version" required hint="Ce qui change par rapport à la version précédente.">
            {(p) => (
              <Textarea {...p} rows={2} value={commentaireVersion} onChange={(e) => setCommentaireVersion(e.target.value)} placeholder="Corrections apportées après relecture du bureau." />
            )}
          </Field>
        </div>
      </Modal>

      <Modal
        open={renommerOuvert}
        onClose={() => setRenommerOuvert(false)}
        size="sm"
        title="Renommer le document"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenommerOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nouveauNom.trim()}
              onClick={() =>
                void executer(() => renommer(d.id, nouveauNom.trim()), { titre: 'Document renommé', detail: nouveauNom.trim() }, () => setRenommerOuvert(false))
              }
            >
              Renommer
            </Button>
          </>
        }
      >
        <div className="py-2">
          <Field label="Nouveau nom" required>
            {(p) => <Input {...p} value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} />}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!aRestaurer}
        tone="primary"
        loading={enCours}
        onClose={() => setARestaurer(null)}
        onConfirm={() => {
          const vid = aRestaurer!
          setARestaurer(null)
          void executer(() => restaurerVersion(d.id, vid), { titre: 'Version restaurée', detail: 'Elle devient la version en vigueur.' })
        }}
        title="Restaurer cette version ?"
        description="La version choisie est recopiée en tête : elle devient la version en vigueur. Aucune version n'est perdue, l'historique reste complet."
        confirmLabel="Restaurer la version"
      />

      <ConfirmDialog
        open={aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(false)}
        onConfirm={() => {
          setASupprimer(false)
          void executer(() => supprimer(d.id), { titre: 'Document mis à la corbeille', detail: `${d.nom} est restaurable pendant trente jours.` })
        }}
        title={`Mettre « ${d.nom} » à la corbeille ?`}
        description="Le document sort de l'explorateur et des recherches. Il reste restaurable depuis la corbeille pendant trente jours."
        confirmLabel="Mettre à la corbeille"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          Ses {d.versions.length} version(s), son historique et ses droits sont conservés. Un lien de partage actif est
          immédiatement révoqué.
        </div>
      </ConfirmDialog>
    </Page>
  )
}
