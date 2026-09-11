import { useNavigate } from 'react-router-dom'
import { Clock, FileText, FolderOpen, HardDrive, RefreshCw, Share2, Star, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge, Chip } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { HorizontalBars } from '@/components/ui/Chart'
import { StatusBadge } from '@/components/ui/Status'
import { DocsNav, DocsOutils } from '@/components/documents/DocsNav'
import { ZoneDepot } from '@/components/documents/Upload'
import { useDocuments } from '@/context/DocumentsContext'
import {
  calculerKpisDocs,
  compterRecursif,
  formatTaille,
  sousDossiers,
  tousLesTags,
  volumeParDossierRacine,
} from '@/lib/documents'
import { formatDate } from '@/lib/utils'

export function DocsAccueil() {
  const navigate = useNavigate()
  const { documents, dossiers, chargement, erreur, recharger } = useDocuments()

  const kpis = calculerKpisDocs(documents, dossiers)
  const volumes = volumeParDossierRacine(documents, dossiers)
  const tags = tousLesTags(documents).slice(0, 10)
  const racines = sousDossiers(null, dossiers)
  const recents = documents
    .filter((d) => !d.supprime)
    .sort((a, b) => (a.modifieLe < b.modifieLe ? 1 : -1))
    .slice(0, 6)

  const enTete = (
    <PageHeader
      eyebrow="Documents"
      title="Espace documentaire"
      description="Tous les fichiers de l'association, classés par dossier. Chaque document porte ses droits d'accès, ses versions et son historique."
      actions={
        <>
          <DocsOutils />
          <Button variant="primary" onClick={() => navigate('/documents/explorateur')} iconLeft={<FolderOpen aria-hidden className="h-4 w-4" />}>
            Ouvrir l'explorateur
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <DocsNav />
        <Alert tone="danger" titre="L'espace documentaire n'a pas pu être chargé" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucun fichier n'a été perdu.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <DocsNav />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-20" />
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-32 w-full" />
        </Card>
      </Page>
    )
  }

  if (documents.length === 0) {
    return (
      <Page header={enTete}>
        <DocsNav />
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Aucun document"
            description="L'arborescence de dossiers est prête. Déposez vos premiers fichiers pour commencer."
            action={<Button variant="primary" onClick={() => navigate('/documents/explorateur')}>Ouvrir l'explorateur</Button>}
          />
        </Card>
        <Card>
          <CardHeader title="Import rapide" description="Glissez-déposez un ou plusieurs fichiers." />
          <CardBody>
            <ZoneDepot dossierId={racines[0]?.id ?? ''} />
          </CardBody>
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <DocsNav />

      <section aria-label="Indicateurs documentaires" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Documents" value={String(kpis.total)} hint={`répartis dans ${kpis.dossiers} dossiers`} />
        <KpiCard label="Volume total" value={formatTaille(kpis.volume)} hint="Version en vigueur de chaque fichier" />
        <KpiCard label="Partagés par lien" value={String(kpis.partages)} hint="Accessibles sans authentification" />
        <KpiCard label="Modifiés ce mois" value={String(kpis.recents)} hint={`${kpis.corbeille} dans la corbeille`} />
      </section>

      {kpis.partages > 0 && (
        <Alert
          tone="neutral"
          titre={`${kpis.partages} document(s) accessibles par lien public`}
          action={<Button size="sm" onClick={() => navigate('/documents/partages')}>Les vérifier</Button>}
        >
          Un lien de partage contourne les droits d'accès : toute personne qui le détient peut consulter le fichier.
        </Alert>
      )}

      <Card>
        <CardHeader title="Dossiers" description={`${racines.length} dossiers à la racine.`} />
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {racines.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => navigate(`/documents/explorateur?dossier=${d.id}`)}
              className="flex items-start gap-3 rounded-lg border border-ink-200 p-3 text-left transition-colors hover:border-ink-300 hover:bg-ink-25"
            >
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-brand-500">
                <FolderOpen className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{d.nom}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">{d.description}</span>
                <span className="ac-num mt-1.5 block text-2xs text-ink-500">
                  {compterRecursif(d.id, dossiers, documents)} document(s) · {sousDossiers(d.id, dossiers).length} sous-dossier(s)
                </span>
              </span>
            </button>
          ))}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Volume par dossier" description="En mégaoctets, sous-dossiers inclus." />
          <CardBody>
            <HorizontalBars titre="Volume occupé par dossier racine" data={volumes} total={volumes.reduce((s, v) => s + v.valeur, 0)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Derniers documents modifiés"
            action={<Button size="sm" onClick={() => navigate('/documents/recents')}>Tout voir</Button>}
          />
          <ul className="divide-y divide-ink-100">
            {recents.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/documents/${d.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-ink-25"
                >
                  <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{d.nom}</span>
                    <span className="ac-num block truncate text-xs text-ink-500">
                      {d.extension.toUpperCase()} · {formatTaille(d.taille)} · {formatDate(d.modifieLe)}
                    </span>
                  </span>
                  {d.favori && <Star aria-hidden className="h-3.5 w-3.5 shrink-0 fill-warning-500 text-warning-500" />}
                  {!d.apercuDisponible && <StatusBadge status="apercu_indisponible" />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Import rapide" description="Déposez vos fichiers dans le dossier de votre choix depuis l'explorateur." />
          <CardBody>
            <ZoneDepot dossierId={racines[0]?.id ?? ''} />
          </CardBody>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Tags les plus utilisés" />
            <CardBody className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button key={t.nom} type="button" onClick={() => navigate(`/documents/recherche?tag=${encodeURIComponent(t.nom)}`)}>
                  <Chip>
                    {t.nom} · {t.nombre}
                  </Chip>
                </button>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Accès rapides" />
            <CardBody className="flex flex-col gap-2">
              {[
                { label: 'Favoris', icon: <Star aria-hidden className="h-4 w-4" />, to: '/documents/favoris', n: kpis.favoris },
                { label: 'Partagés', icon: <Share2 aria-hidden className="h-4 w-4" />, to: '/documents/partages', n: kpis.partages },
                { label: 'Récents', icon: <Clock aria-hidden className="h-4 w-4" />, to: '/documents/recents', n: kpis.recents },
                { label: 'Corbeille', icon: <Trash2 aria-hidden className="h-4 w-4" />, to: '/documents/corbeille', n: kpis.corbeille },
                { label: 'Sans aperçu', icon: <HardDrive aria-hidden className="h-4 w-4" />, to: '/documents/recherche?apercu=non', n: kpis.sansApercu },
              ].map((a) => (
                <button
                  key={a.to}
                  type="button"
                  onClick={() => navigate(a.to)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] text-ink-700 transition-colors hover:bg-ink-100"
                >
                  <span aria-hidden className="text-ink-500">{a.icon}</span>
                  <span className="flex-1">{a.label}</span>
                  <Badge variant="outline">{a.n}</Badge>
                </button>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </Page>
  )
}
