import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ChevronRight,
  FileText,
  FolderOpen,
  FolderPlus,
  Grid3x3,
  List,
  RefreshCw,
  Share2,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { Menu } from '@/components/ui/Menu'
import { StatusBadge } from '@/components/ui/Status'
import { DocsNav, DocsOutils } from '@/components/documents/DocsNav'
import { ZoneDepot } from '@/components/documents/Upload'
import { useDocuments } from '@/context/DocumentsContext'
import { useToast } from '@/context/ToastContext'
import { cheminDe, compterRecursif, formatTaille, sousDossiers, type Document, type Dossier } from '@/lib/documents'
import { formatDate } from '@/lib/utils'

function Arborescence({
  parentId,
  dossiers,
  documents,
  courant,
  onChoisir,
  niveau = 0,
}: {
  parentId: string | null
  dossiers: Dossier[]
  documents: Document[]
  courant: string
  onChoisir: (id: string) => void
  niveau?: number
}) {
  const enfants = sousDossiers(parentId, dossiers)
  if (enfants.length === 0) return null
  return (
    <ul className={cn(niveau > 0 && 'ml-3 border-l border-ink-200 pl-2')}>
      {enfants.map((d) => {
        const actif = d.id === courant
        const aDesEnfants = sousDossiers(d.id, dossiers).length > 0
        return (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onChoisir(d.id)}
              aria-current={actif ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[0.8125rem] transition-colors',
                actif ? 'bg-brand-50 font-medium text-brand-800' : 'text-ink-700 hover:bg-ink-100',
              )}
            >
              <FolderOpen aria-hidden className={cn('h-3.5 w-3.5 shrink-0', actif ? 'text-brand-600' : 'text-ink-500')} />
              <span className="min-w-0 flex-1 truncate">{d.nom}</span>
              <span className="ac-num text-2xs text-ink-500">{compterRecursif(d.id, dossiers, documents)}</span>
            </button>
            {aDesEnfants && (
              <Arborescence parentId={d.id} dossiers={dossiers} documents={documents} courant={courant} onChoisir={onChoisir} niveau={niveau + 1} />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function Explorateur() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const { documents, dossiers, chargement, erreur, recharger, creerDossier, basculerFavori, supprimer } = useDocuments()

  const racines = sousDossiers(null, dossiers)
  const dossierId = params.get('dossier') ?? racines[0]?.id ?? ''
  const [vue, setVue] = useState<'liste' | 'grille'>('liste')
  const [importOuvert, setImportOuvert] = useState(false)
  const [dossierOuvert, setDossierOuvert] = useState(false)
  const [nomDossier, setNomDossier] = useState('')
  const [descDossier, setDescDossier] = useState('')
  const [aSupprimer, setASupprimer] = useState<Document | null>(null)
  const [enCours, setEnCours] = useState(false)

  const chemin = useMemo(() => cheminDe(dossierId, dossiers), [dossierId, dossiers])
  const enfants = sousDossiers(dossierId, dossiers)
  const fichiers = documents.filter((d) => d.dossierId === dossierId && !d.supprime)

  const choisir = (id: string) => setParams({ dossier: id })

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

  const enTete = (
    <PageHeader
      eyebrow="Documents"
      title="Explorateur"
      description="Parcourez l'arborescence, basculez entre vue liste et vue grille, importez par glisser-déposer."
      actions={
        <>
          <DocsOutils />
          <Button onClick={() => { setNomDossier(''); setDescDossier(''); setDossierOuvert(true) }} iconLeft={<FolderPlus aria-hidden className="h-4 w-4" />}>
            Nouveau dossier
          </Button>
          <Button variant="primary" onClick={() => setImportOuvert(true)} iconLeft={<Upload aria-hidden className="h-4 w-4" />}>
            Importer
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <DocsNav />
        <Alert tone="danger" titre="L'explorateur n'a pas pu être chargé" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <DocsNav />

      {/* Fil d'Ariane */}
      <nav aria-label="Chemin du dossier" className="flex flex-wrap items-center gap-1 text-[0.8125rem]">
        <button type="button" onClick={() => choisir(racines[0]?.id ?? '')} className="text-ink-500 hover:text-ink-900">
          Espace documentaire
        </button>
        {chemin.map((d, i) => (
          <span key={d.id} className="flex items-center gap-1">
            <ChevronRight aria-hidden className="h-3.5 w-3.5 text-ink-500" />
            <button
              type="button"
              onClick={() => choisir(d.id)}
              aria-current={i === chemin.length - 1 ? 'page' : undefined}
              className={i === chemin.length - 1 ? 'font-medium text-ink-900' : 'text-ink-500 hover:text-ink-900'}
            >
              {d.nom}
            </button>
          </span>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Card className="h-fit">
          <CardHeader title="Dossiers" description={`${dossiers.length} au total`} />
          <CardBody className="ac-scroll max-h-[32rem] overflow-y-auto py-2">
            <Arborescence parentId={null} dossiers={dossiers} documents={documents} courant={dossierId} onChoisir={choisir} />
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[0.8125rem] text-ink-500">
              {enfants.length} sous-dossier(s) · {fichiers.length} document(s)
            </p>
            <div role="group" aria-label="Mode d'affichage" className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5">
              {([
                ['liste', 'Liste', List],
                ['grille', 'Grille', Grid3x3],
              ] as const).map(([v, label, Icone]) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={vue === v}
                  onClick={() => setVue(v)}
                  className={cn(
                    'flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors',
                    vue === v ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100',
                  )}
                >
                  <Icone aria-hidden className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {chargement ? (
            <Card>
              <SkeletonTable rows={6} />
            </Card>
          ) : enfants.length === 0 && fichiers.length === 0 ? (
            <Card>
              <EmptyState
                icon={<FolderOpen />}
                title="Ce dossier est vide"
                description="Aucun sous-dossier ni document ici. Importez un fichier ou créez un sous-dossier pour l'organiser."
                action={
                  <Button variant="primary" onClick={() => setImportOuvert(true)} iconLeft={<Upload aria-hidden className="h-4 w-4" />}>
                    Importer un fichier
                  </Button>
                }
                secondaryAction={<Button onClick={() => setDossierOuvert(true)}>Créer un sous-dossier</Button>}
              />
            </Card>
          ) : vue === 'liste' ? (
            <Card>
              <div className="ac-scroll overflow-x-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">Contenu du dossier {chemin[chemin.length - 1]?.nom}</caption>
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-25">
                      {['Nom', 'Type', 'Taille', 'Modifié le', 'État', ''].map((h, i) => (
                        <th key={h || i} scope="col" className={cn('px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500', i === 2 && 'text-right')}>
                          {h || <span className="sr-only">Actions</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {enfants.map((d) => (
                      <tr key={d.id} className="cursor-pointer transition-colors hover:bg-ink-25" onClick={() => choisir(d.id)}>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2.5">
                            <FolderOpen aria-hidden className="h-4 w-4 shrink-0 text-brand-500" />
                            <span className="text-[0.8125rem] font-medium text-ink-900">{d.nom}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[0.8125rem] text-ink-500">Dossier</td>
                        <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-500">
                          {compterRecursif(d.id, dossiers, documents)} fichiers
                        </td>
                        <td className="ac-num px-4 py-2.5 text-[0.8125rem] text-ink-500">{formatDate(d.creeLe)}</td>
                        <td className="px-4 py-2.5" />
                        <td className="px-4 py-2.5" />
                      </tr>
                    ))}
                    {fichiers.map((d) => (
                      <tr key={d.id} className="cursor-pointer transition-colors hover:bg-ink-25" onClick={() => navigate(`/documents/${d.id}`)}>
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2.5">
                            <FileText aria-hidden className="h-4 w-4 shrink-0 text-ink-500" />
                            <span className="min-w-0">
                              <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{d.nom}</span>
                              {d.tags.length > 0 && (
                                <span className="block truncate text-xs text-ink-500">{d.tags.join(' · ')}</span>
                              )}
                            </span>
                            {d.favori && <Star aria-hidden className="h-3.5 w-3.5 shrink-0 fill-warning-500 text-warning-500" />}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[0.8125rem] text-ink-500">{d.extension.toUpperCase()}</td>
                        <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-700">{formatTaille(d.taille)}</td>
                        <td className="ac-num px-4 py-2.5 text-[0.8125rem] text-ink-500">{formatDate(d.modifieLe)}</td>
                        <td className="px-4 py-2.5">
                          <span className="flex flex-wrap gap-1.5">
                            {d.partage?.actif && <StatusBadge status="doc_partage" />}
                            {!d.apercuDisponible && <StatusBadge status="apercu_indisponible" />}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <Menu
                            label={`Actions sur ${d.nom}`}
                            items={[
                              { label: 'Ouvrir la fiche', icon: <FileText />, onSelect: () => navigate(`/documents/${d.id}`) },
                              { label: d.favori ? 'Retirer des favoris' : 'Ajouter aux favoris', icon: <Star />, onSelect: () => void basculerFavori(d.id) },
                              { label: 'Gérer le partage', icon: <Share2 />, onSelect: () => navigate(`/documents/${d.id}`) },
                              { type: 'separator' },
                              { label: 'Mettre à la corbeille', icon: <Trash2 />, danger: true, onSelect: () => setASupprimer(d) },
                            ]}
                            trigger={({ toggle, open, ref }) => (
                              <Button ref={ref} variant="icon" size="sm" label={`Actions sur ${d.nom}`} aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                                <span aria-hidden className="text-base leading-none">⋯</span>
                              </Button>
                            )}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {enfants.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => choisir(d.id)}
                  className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-ink-300 hover:bg-ink-25"
                >
                  <FolderOpen aria-hidden className="h-6 w-6 shrink-0 text-brand-500" />
                  <span className="min-w-0">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{d.nom}</span>
                    <span className="ac-num block text-xs text-ink-500">{compterRecursif(d.id, dossiers, documents)} document(s)</span>
                  </span>
                </button>
              ))}
              {fichiers.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => navigate(`/documents/${d.id}`)}
                  className="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-ink-300 hover:bg-ink-25"
                >
                  <span className="flex h-24 items-center justify-center rounded-lg border border-ink-200 bg-ink-25">
                    {d.apercuDisponible ? (
                      <span className="text-center">
                        <FileText aria-hidden className="mx-auto h-7 w-7 text-ink-500" />
                        <span className="ac-num mt-1 block text-2xs font-semibold uppercase text-ink-500">{d.extension}</span>
                      </span>
                    ) : (
                      <span className="px-3 text-center text-2xs text-ink-500">Aperçu indisponible pour ce format</span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-ink-900">{d.nom}</span>
                      {d.favori && <Star aria-hidden className="h-3.5 w-3.5 shrink-0 fill-warning-500 text-warning-500" />}
                    </span>
                    <span className="ac-num mt-0.5 block text-xs text-ink-500">
                      {formatTaille(d.taille)} · {formatDate(d.modifieLe)}
                    </span>
                    {d.partage?.actif && (
                      <span className="mt-2 block">
                        <StatusBadge status="doc_partage" />
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={importOuvert}
        onClose={() => setImportOuvert(false)}
        size="lg"
        title={`Importer dans « ${chemin[chemin.length - 1]?.nom ?? 'ce dossier'} »`}
        description="Un ou plusieurs fichiers. La progression s'affiche pour chacun."
        footer={<Button variant="primary" onClick={() => setImportOuvert(false)}>Terminé</Button>}
      >
        <div className="py-2">
          <ZoneDepot dossierId={dossierId} />
        </div>
      </Modal>

      <Modal
        open={dossierOuvert}
        onClose={() => setDossierOuvert(false)}
        title="Nouveau dossier"
        description={`Il sera créé dans « ${chemin[chemin.length - 1]?.nom ?? 'la racine'} ».`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDossierOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nomDossier.trim()}
              onClick={() =>
                void executer(
                  () => creerDossier(nomDossier, dossierId, descDossier),
                  { titre: 'Dossier créé', detail: `« ${nomDossier} » est prêt à recevoir des fichiers.` },
                  () => setDossierOuvert(false),
                )
              }
            >
              Créer le dossier
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Nom du dossier" required>
            {(p) => <Input {...p} value={nomDossier} onChange={(e) => setNomDossier(e.target.value)} placeholder="Assemblée générale 2027" />}
          </Field>
          <Field label="Description" hint="Ce que ce dossier est censé contenir.">
            {(p) => <Textarea {...p} rows={2} value={descDossier} onChange={(e) => setDescDossier(e.target.value)} />}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const d = aSupprimer!
          setASupprimer(null)
          void executer(() => supprimer(d.id), { titre: 'Document mis à la corbeille', detail: `${d.nom} est restaurable pendant trente jours.` })
        }}
        title={`Mettre « ${aSupprimer?.nom} » à la corbeille ?`}
        description="Le document sort de l'explorateur mais reste restaurable depuis la corbeille pendant trente jours."
        confirmLabel="Mettre à la corbeille"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          Ses {aSupprimer?.versions.length ?? 0} version(s) et son historique sont conservés. La suppression définitive
          se fait depuis la corbeille.
        </div>
      </ConfirmDialog>
    </Page>
  )
}
