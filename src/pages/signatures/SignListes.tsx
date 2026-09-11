import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, Download, Eye, FileSignature, History, PenLine, Plus, RefreshCw, Send } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Tabs } from '@/components/ui/Tabs'
import { Timeline } from '@/components/ui/Timeline'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { SignNav, SignOutils } from '@/components/signatures/SignNav'
import { cleDemande } from '@/components/documents/statuts'
import { useSignatures } from '@/context/SignaturesContext'
import { useToast } from '@/context/ToastContext'
import {
  joursAvantEcheance,
  maSignatureAttendue,
  progression,
  statutDemande,
  statutDemandeLabels,
  type DemandeSignature,
} from '@/lib/signatures'
import { formatDate } from '@/lib/utils'

export type VueSign = 'a-signer' | 'envoyees' | 'terminees'

const meta: Record<VueSign, { titre: string; description: string; vide: string }> = {
  'a-signer': {
    titre: 'Signatures à effectuer',
    description: 'Les documents dont c’est votre tour de signer, dans l’ordre de passage défini par l’émetteur.',
    vide: 'Rien à signer pour l’instant. Vous serez notifié dès qu’un document vous attend.',
  },
  envoyees: {
    titre: 'Demandes envoyées',
    description: 'Les demandes que vous avez émises, en attente d’une réponse des signataires.',
    vide: 'Aucune demande en cours. Créez-en une pour faire signer un document.',
  },
  terminees: {
    titre: 'Demandes terminées',
    description: 'Signées par tous, refusées ou expirées. Le document scellé reste téléchargeable.',
    vide: 'Aucune demande close pour l’instant.',
  },
}

export function SignListe({ vue }: { vue: VueSign }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { demandes, chargement, erreur, recharger, relancer, envoyer } = useSignatures()
  const [enCours, setEnCours] = useState(false)

  const lignes = demandes.filter((d) => {
    const s = statutDemande(d)
    if (vue === 'a-signer') return maSignatureAttendue(d)
    if (vue === 'envoyees') return s === 'en_attente' || s === 'brouillon'
    return s === 'terminee' || s === 'refusee' || s === 'expiree' || s === 'annulee'
  })

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

  const columns: Column<DemandeSignature>[] = [
    {
      id: 'titre',
      header: 'Demande',
      sortValue: (r) => r.titre,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.titre}</p>
          <p className="ac-num truncate text-xs text-ink-500">
            {r.reference} · {r.documentNom}
          </p>
        </div>
      ),
    },
    {
      id: 'signataires',
      header: 'Signataires',
      cell: (r) => (
        <span className="min-w-0">
          <span className="block truncate text-[0.8125rem] text-ink-700">
            {r.signataires.map((s) => s.nom).join(', ')}
          </span>
          <span className="ac-num block text-xs text-ink-500">
            {progression(r).signes} sur {progression(r).total} signé(s)
          </span>
        </span>
      ),
    },
    { id: 'envoyee', header: 'Envoyée le', optional: true, sortValue: (r) => r.envoyeeLe ?? '', cell: (r) => <span className="ac-num">{r.envoyeeLe ? formatDate(r.envoyeeLe) : '—'}</span> },
    {
      id: 'echeance',
      header: 'Échéance',
      sortValue: (r) => r.echeanceLe,
      cell: (r) => {
        const j = joursAvantEcheance(r)
        return (
          <span className="ac-num">
            {formatDate(r.echeanceLe)}
            <span className={`ml-1.5 text-xs ${j < 0 ? 'text-danger-600' : 'text-ink-500'}`}>
              {j < 0 ? `(+${-j} j)` : `(dans ${j} j)`}
            </span>
          </span>
        )
      },
    },
    {
      id: 'statut',
      header: 'Statut',
      align: 'right',
      sortValue: (r) => statutDemande(r),
      cell: (r) => <StatusBadge status={cleDemande[statutDemande(r)]} />,
    },
  ]

  const filters: FilterDef<DemandeSignature>[] = [
    {
      id: 'statut',
      label: 'Statut',
      options: (Object.keys(statutDemandeLabels) as (keyof typeof statutDemandeLabels)[]).map((s) => ({ value: s, label: statutDemandeLabels[s] })),
      match: (r, v) => statutDemande(r) === v,
    },
  ]

  const m = meta[vue]

  const enTete = (
    <PageHeader
      eyebrow="Signature électronique"
      title={m.titre}
      description={m.description}
      meta={<Badge variant="brand">{lignes.length} demandes</Badge>}
      actions={
        <>
          <SignOutils />
          <Button variant="primary" onClick={() => navigate('/signatures/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouvelle demande
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <SignNav />
        <Alert tone="danger" titre="La liste n'a pas pu être chargée" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && lignes.length === 0) {
    return (
      <Page header={enTete}>
        <SignNav />
        <Card>
          <EmptyState
            icon={<FileSignature />}
            title="Aucune demande ici"
            description={m.vide}
            action={<Button variant="primary" onClick={() => navigate('/signatures/nouvelle')}>Créer une demande</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <SignNav />

      {vue === 'a-signer' && lignes.length > 0 && (
        <Alert tone="warning" titre="Vérifiez le document avant de signer">
          Une signature électronique engage l'association au même titre qu'une signature manuscrite. En cas de doute,
          refusez en indiquant le motif : l'émetteur pourra corriger et renvoyer.
        </Alert>
      )}

      <DataGrid
        rows={lignes}
        columns={columns}
        filters={filters}
        loading={chargement}
        caption={m.titre}
        searchKeys={(r) => `${r.titre} ${r.reference} ${r.documentNom} ${r.signataires.map((s) => s.nom).join(' ')}`}
        searchPlaceholder="Rechercher un titre, une référence, un signataire…"
        getRowLabel={(r) => r.titre}
        onRowClick={(r) => navigate(`/signatures/${r.id}`)}
        emptyIcon={<FileSignature />}
        emptyTitle="Aucune demande ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre."
        rowActions={[
          { label: 'Ouvrir le suivi', icon: <Eye />, onSelect: (r) => navigate(`/signatures/${r.id}`) },
          ...(vue === 'a-signer'
            ? [{ label: 'Signer le document', icon: <PenLine />, onSelect: (r: DemandeSignature) => navigate(`/signatures/${r.id}`) }]
            : []),
          ...(vue === 'envoyees'
            ? [
                {
                  label: 'Relancer les signataires',
                  icon: <Send />,
                  onSelect: (r: DemandeSignature) =>
                    void executer(() => relancer(r.id), { titre: 'Relance envoyée', detail: 'Un rappel a été adressé aux signataires en attente.' }),
                },
                {
                  label: 'Envoyer le brouillon',
                  icon: <Send />,
                  onSelect: (r: DemandeSignature) =>
                    void executer(() => envoyer(r.id), { titre: 'Demande envoyée', detail: `${r.reference} est partie aux signataires.` }),
                },
              ]
            : []),
          ...(vue === 'terminees'
            ? [
                {
                  label: 'Télécharger le document signé',
                  icon: <Download />,
                  onSelect: (r: DemandeSignature) =>
                    r.fichierSigne
                      ? toast({ titre: 'Téléchargement', detail: `${r.fichierSigne} — la génération réelle arrive en V2.`, tone: 'neutral' })
                      : toast({ titre: 'Aucun document signé', detail: 'Cette demande n’a pas abouti.', tone: 'warning' }),
                },
              ]
            : []),
        ]}
      />
      <span className="sr-only" aria-live="polite">{enCours ? 'Traitement en cours' : ''}</span>
    </Page>
  )
}

/* ------------------------------ Historique ------------------------------ */

const onglets = [
  { id: 'tout', label: 'Toutes les actions' },
  { id: 'signatures', label: 'Signatures et refus' },
  { id: 'envois', label: 'Envois et relances' },
]

export function SignHistorique() {
  const navigate = useNavigate()
  const { demandes, chargement } = useSignatures()
  const [onglet, setOnglet] = useState('tout')

  const evenements = demandes
    .flatMap((d) => d.historique.map((e) => ({ ...e, id: `${d.id}-${e.id}`, reference: d.reference, titre: d.titre })))
    .filter((e) => {
      if (onglet === 'signatures') return /signé|refus/i.test(e.libelle)
      if (onglet === 'envois') return /envoy|relance/i.test(e.libelle)
      return true
    })
    .sort((a, b) => (a.quand < b.quand ? 1 : -1))
    .slice(0, 60)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Signature électronique"
          title="Historique"
          description="Journal de toutes les actions menées sur les demandes de signature, du plus récent au plus ancien."
          meta={<Badge variant="brand">{evenements.length} événements</Badge>}
          actions={<SignOutils />}
        />
      }
    >
      <SignNav />

      <Tabs items={onglets} value={onglet} onChange={setOnglet} ariaLabel="Filtrer l'historique" />

      {chargement ? (
        <Card>
          <SkeletonTable rows={6} />
        </Card>
      ) : evenements.length === 0 ? (
        <Card>
          <EmptyState icon={<History />} title="Aucun événement" description="L'historique se remplit à mesure que les demandes circulent." />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Journal d'activité" description="Les soixante derniers événements." />
          <CardBody>
            <Timeline
              evenements={evenements.map((e) => ({
                id: e.id,
                quand: e.quand,
                auteur: `${e.auteur} · ${e.reference}`,
                libelle: e.libelle,
                detail: e.detail,
                tone: e.tone,
              }))}
            />
          </CardBody>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={() => navigate('/signatures')}>Retour au tableau de bord</Button>
      </div>
    </Page>
  )
}
