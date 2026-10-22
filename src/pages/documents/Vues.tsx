import { usePageTitle } from '@/hooks/usePageTitle'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Clock, FileText, RefreshCw, RotateCcw, Search, Share2, Star, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge, Chip } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input, Select } from '@/components/ui/Input'
import { Field } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { DocsNav, DocsOutils } from '@/components/documents/DocsNav'
import { useDocuments } from '@/context/DocumentsContext'
import { useToast } from '@/context/ToastContext'
import { cheminDe, formatTaille, tousLesTags, type Document } from '@/lib/documents'
import { formatDate } from '@/lib/utils'

export type VueDoc = 'recents' | 'partages' | 'favoris' | 'corbeille'

const meta: Record<VueDoc, { titre: string; description: string; vide: string; icone: JSX.Element }> = {
  recents: {
    titre: 'Documents récents',
    description: 'Les fichiers déposés ou modifiés au cours des trente derniers jours.',
    vide: 'Aucun document n’a été modifié récemment.',
    icone: <Clock />,
  },
  partages: {
    titre: 'Documents partagés',
    description: 'Les fichiers accessibles par un lien public. Vérifiez régulièrement cette liste.',
    vide: 'Aucun document n’est partagé par lien. C’est la situation la plus sûre.',
    icone: <Share2 />,
  },
  favoris: {
    titre: 'Favoris',
    description: 'Les documents que vous avez marqués pour y revenir vite.',
    vide: 'Aucun favori. Marquez un document depuis sa fiche pour le retrouver ici.',
    icone: <Star />,
  },
  corbeille: {
    titre: 'Corbeille',
    description: 'Les documents supprimés, restaurables pendant trente jours avant purge automatique.',
    vide: 'La corbeille est vide.',
    icone: <Trash2 />,
  },
}

function useColonnes(dossiersNom: (id: string) => string): Column<Document>[] {
  return [
    {
      id: 'nom',
      header: 'Document',
      sortValue: (r) => r.nom,
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <FileText aria-hidden className="h-4 w-4 shrink-0 text-ink-500" />
          <div className="min-w-0">
            <p className="truncate font-medium text-ink-900">{r.nom}</p>
            <p className="ac-num truncate text-xs text-ink-500">
              {r.extension.toUpperCase()} · {dossiersNom(r.dossierId)}
            </p>
          </div>
          {r.favori && <Star aria-hidden className="h-3.5 w-3.5 shrink-0 fill-warning-500 text-warning-500" />}
        </div>
      ),
    },
    { id: 'taille', header: 'Taille', align: 'right', sortValue: (r) => r.taille, cell: (r) => <span className="ac-num">{formatTaille(r.taille)}</span> },
    { id: 'auteur', header: 'Déposé par', optional: true, sortValue: (r) => r.creePar, cell: (r) => r.creePar },
    { id: 'modifie', header: 'Modifié le', sortValue: (r) => r.modifieLe, cell: (r) => <span className="ac-num">{formatDate(r.modifieLe)}</span> },
    {
      id: 'etat',
      header: 'État',
      align: 'right',
      cell: (r) => (
        <span className="flex flex-wrap justify-end gap-1.5">
          {r.supprime && <StatusBadge status="doc_corbeille" />}
          {r.partage?.actif && <StatusBadge status="doc_partage" />}
          {!r.apercuDisponible && <StatusBadge status="apercu_indisponible" />}
        </span>
      ),
    },
  ]
}

export function VueDocuments({ vue }: { vue: VueDoc }) {
  usePageTitle('Documents')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { documents, dossiers, chargement, erreur, recharger, restaurer, viderCorbeille, basculerPartage, basculerFavori } = useDocuments()
  const [aVider, setAVider] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const nomDossier = (id: string) => cheminDe(id, dossiers).map((c) => c.nom).join(' › ')
  const colonnes = useColonnes(nomDossier)

  const lignes = useMemo(() => {
    const limite = Date.now() - 30 * 86400000
    if (vue === 'corbeille') return documents.filter((d) => d.supprime)
    const vivants = documents.filter((d) => !d.supprime)
    if (vue === 'favoris') return vivants.filter((d) => d.favori)
    if (vue === 'partages') return vivants.filter((d) => d.partage?.actif)
    return vivants.filter((d) => new Date(d.modifieLe).getTime() >= limite - 300 * 86400000).sort((a, b) => (a.modifieLe < b.modifieLe ? 1 : -1)).slice(0, 20)
  }, [documents, vue])

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const m = meta[vue]

  const enTete = (
    <PageHeader
      eyebrow="Documents"
      title={m.titre}
      description={m.description}
      meta={<Badge variant="brand">{lignes.length} documents</Badge>}
      actions={
        <>
          <DocsOutils />
          {vue === 'corbeille' && lignes.length > 0 && (
            <Button variant="danger" onClick={() => setAVider(true)} iconLeft={<Trash2 aria-hidden className="h-4 w-4" />}>
              Vider la corbeille
            </Button>
          )}
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <DocsNav />
        <Alert tone="danger" titre="La liste n'a pas pu être chargée" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && lignes.length === 0) {
    return (
      <Page header={enTete}>
        <DocsNav />
        <Card>
          <EmptyState
            icon={m.icone}
            title="Rien à afficher ici"
            description={m.vide}
            action={<Button variant="primary" onClick={() => navigate('/documents/explorateur')}>Ouvrir l'explorateur</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <DocsNav />

      {vue === 'partages' && lignes.length > 0 && (
        <Alert tone="warning" titre="Ces documents sont accessibles sans authentification">
          Un lien de partage contourne les droits d'accès. Révoquez les liens dont vous n'avez plus l'usage.
        </Alert>
      )}

      {vue === 'corbeille' && (
        <Alert tone="neutral" titre="Purge automatique après trente jours">
          Passé ce délai, les documents sont supprimés définitivement et ne peuvent plus être restaurés.
        </Alert>
      )}

      <DataGrid
        rows={lignes}
        columns={colonnes}
        loading={chargement}
        caption={m.titre}
        searchKeys={(r) => `${r.nom} ${r.extension} ${r.creePar} ${r.tags.join(' ')} ${nomDossier(r.dossierId)}`}
        searchPlaceholder="Rechercher un nom, un tag, un dossier…"
        getRowLabel={(r) => r.nom}
        onRowClick={(r) => navigate(`/documents/${r.id}`)}
        emptyIcon={<FileText />}
        emptyTitle="Aucun document ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre."
        rowActions={[
          { label: 'Ouvrir la fiche', icon: <FileText />, onSelect: (r) => navigate(`/documents/${r.id}`) },
          ...(vue === 'corbeille'
            ? [
                {
                  label: 'Restaurer',
                  icon: <RotateCcw />,
                  onSelect: (r: Document) => void executer(() => restaurer(r.id), { titre: 'Document restauré', detail: `${r.nom} est de retour dans son dossier.` }),
                },
              ]
            : []),
          ...(vue === 'partages'
            ? [
                {
                  label: 'Révoquer le lien',
                  icon: <Share2 />,
                  danger: true,
                  onSelect: (r: Document) => void executer(() => basculerPartage(r.id, false), { titre: 'Lien révoqué', detail: `${r.nom} n’est plus accessible par lien.` }),
                },
              ]
            : []),
          ...(vue === 'favoris'
            ? [
                {
                  label: 'Retirer des favoris',
                  icon: <Star />,
                  onSelect: (r: Document) => void executer(() => basculerFavori(r.id), { titre: 'Retiré des favoris', detail: r.nom }),
                },
              ]
            : []),
        ]}
      />

      <ConfirmDialog
        open={aVider}
        loading={enCours}
        onClose={() => setAVider(false)}
        onConfirm={() => {
          setAVider(false)
          void executer(() => viderCorbeille(), { titre: 'Corbeille vidée', detail: 'Les documents ont été supprimés définitivement.' })
        }}
        title="Vider la corbeille ?"
        description={`${lignes.length} document(s), leurs versions et leur historique seront définitivement supprimés. Cette action ne peut pas être annulée.`}
        confirmLabel="Supprimer définitivement"
      />
    </Page>
  )
}

/* ------------------------------ Recherche ------------------------------ */

export function RechercheDocuments() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { documents, dossiers, chargement, erreur, recharger } = useDocuments()

  const [terme, setTerme] = useState('')
  const [tag, setTag] = useState(params.get('tag') ?? '')
  const [extension, setExtension] = useState('')
  const [apercu, setApercu] = useState(params.get('apercu') ?? '')

  const nomDossier = (id: string) => cheminDe(id, dossiers).map((c) => c.nom).join(' › ')
  const colonnes = useColonnes(nomDossier)
  const tags = tousLesTags(documents)
  const extensions = Array.from(new Set(documents.map((d) => d.extension))).sort()

  const resultats = documents
    .filter((d) => !d.supprime)
    .filter((d) => (tag ? d.tags.includes(tag) : true))
    .filter((d) => (extension ? d.extension === extension : true))
    .filter((d) => (apercu === 'non' ? !d.apercuDisponible : apercu === 'oui' ? d.apercuDisponible : true))
    .filter((d) => {
      const q = terme.trim().toLowerCase()
      if (!q) return true
      return `${d.nom} ${d.creePar} ${d.tags.join(' ')} ${nomDossier(d.dossierId)} ${d.projet ?? ''}`.toLowerCase().includes(q)
    })

  const filtresActifs = [tag, extension, apercu].filter(Boolean).length

  const filters: FilterDef<Document>[] = [
    { id: 'projet', label: 'Projet', options: Array.from(new Set(documents.map((d) => d.projet).filter((p): p is string => !!p))).map((p) => ({ value: p, label: p })), match: (r, v) => r.projet === v },
    { id: 'auteur', label: 'Déposé par', options: Array.from(new Set(documents.map((d) => d.creePar))).map((a) => ({ value: a, label: a })), match: (r, v) => r.creePar === v },
  ]

  const enTete = (
    <PageHeader
      eyebrow="Documents"
      title="Recherche"
      description="Cherchez dans tous les dossiers à la fois. Les filtres se combinent."
      meta={<Badge variant="brand">{resultats.length} résultat(s)</Badge>}
      actions={<DocsOutils />}
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <DocsNav />
        <Alert tone="danger" titre="La recherche n'a pas pu aboutir" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <DocsNav />

      <Card>
        <CardHeader title="Critères" description="Le terme cherché porte sur le nom, l'auteur, les tags, le dossier et le projet." />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Terme recherché" className="sm:col-span-2">
            {(p) => <Input {...p} type="search" value={terme} onChange={(e) => setTerme(e.target.value)} placeholder="convention, assemblée, affiche…" iconLeft={<Search />} />}
          </Field>
          <Field label="Tag">
            {(p) => (
              <Select {...p} value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tous les tags" options={tags.map((t) => ({ value: t.nom, label: `${t.nom} (${t.nombre})` }))} />
            )}
          </Field>
          <Field label="Format">
            {(p) => (
              <Select {...p} value={extension} onChange={(e) => setExtension(e.target.value)} placeholder="Tous les formats" options={extensions.map((x) => ({ value: x, label: x.toUpperCase() }))} />
            )}
          </Field>
          <Field label="Aperçu" className="sm:col-span-2">
            {(p) => (
              <Select
                {...p}
                value={apercu}
                onChange={(e) => setApercu(e.target.value)}
                placeholder="Peu importe"
                options={[
                  { value: 'oui', label: 'Aperçu disponible' },
                  { value: 'non', label: 'Aperçu indisponible' },
                ]}
              />
            )}
          </Field>
        </CardBody>
        {filtresActifs > 0 && (
          <CardBody className="flex flex-wrap items-center gap-2 border-t border-ink-100">
            <span className="text-xs font-medium text-ink-500">Filtres actifs</span>
            {tag && <Chip onRemove={() => setTag('')}>Tag : {tag}</Chip>}
            {extension && <Chip onRemove={() => setExtension('')}>Format : {extension.toUpperCase()}</Chip>}
            {apercu && <Chip onRemove={() => setApercu('')}>Aperçu : {apercu === 'oui' ? 'disponible' : 'indisponible'}</Chip>}
            <button
              type="button"
              onClick={() => { setTag(''); setExtension(''); setApercu('') }}
              className="text-xs font-medium text-brand-600 underline-offset-2 hover:underline"
            >
              Tout effacer
            </button>
          </CardBody>
        )}
      </Card>

      {!chargement && resultats.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search />}
            title="Aucun document ne correspond"
            description="Élargissez le terme recherché ou retirez un filtre. La recherche ignore les documents en corbeille."
            action={<Button variant="primary" onClick={() => { setTerme(''); setTag(''); setExtension(''); setApercu('') }}>Réinitialiser la recherche</Button>}
          />
        </Card>
      ) : (
        <DataGrid
          rows={resultats}
          columns={colonnes}
          filters={filters}
          loading={chargement}
          caption="Résultats de recherche documentaire"
          searchKeys={(r) => `${r.nom} ${r.creePar} ${r.tags.join(' ')}`}
          searchPlaceholder="Affiner dans les résultats…"
          getRowLabel={(r) => r.nom}
          onRowClick={(r) => navigate(`/documents/${r.id}`)}
          emptyIcon={<Search />}
          emptyTitle="Aucun résultat"
          emptyDescription="Élargissez la recherche."
          rowActions={[{ label: 'Ouvrir la fiche', icon: <FileText />, onSelect: (r) => navigate(`/documents/${r.id}`) }]}
        />
      )}
    </Page>
  )
}
