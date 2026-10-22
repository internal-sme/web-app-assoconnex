import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { FileSignature, PenLine, Plus, RefreshCw, Send } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, KpiCard, CardBody } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatusBadge } from '@/components/ui/Status'
import { SignNav, SignOutils } from '@/components/signatures/SignNav'
import { cleDemande } from '@/components/documents/statuts'
import { useSignatures } from '@/context/SignaturesContext'
import { calculerKpisSign, joursAvantEcheance, maSignatureAttendue, progression, statutDemande } from '@/lib/signatures'
import { formatDate } from '@/lib/utils'

export function SignDashboard() {
  usePageTitle('Signatures électroniques')

  const navigate = useNavigate()
  const { demandes, chargement, erreur, recharger } = useSignatures()

  const kpis = calculerKpisSign(demandes)
  const aSigner = demandes.filter((d) => maSignatureAttendue(d))
  const enCours = demandes
    .filter((d) => statutDemande(d) === 'en_attente')
    .sort((a, b) => joursAvantEcheance(a) - joursAvantEcheance(b))
    .slice(0, 6)

  const enTete = (
    <PageHeader
      eyebrow="Signature électronique"
      title="Tableau de bord des signatures"
      description="Ce qui attend votre signature, ce qui attend celle des autres, et ce qui est abouti."
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
        <Alert tone="danger" titre="Les demandes n'ont pas pu être chargées" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucune signature n'a été perdue.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <SignNav />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-16" />
            </Card>
          ))}
        </div>
      </Page>
    )
  }

  if (demandes.length === 0) {
    return (
      <Page header={enTete}>
        <SignNav />
        <Card>
          <EmptyState
            icon={<FileSignature />}
            title="Aucune demande de signature"
            description="Envoyez un document à signer : conventions, contrats, procès-verbaux. Les signataires reçoivent un lien par courriel."
            action={
              <Button variant="primary" onClick={() => navigate('/signatures/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Créer une demande
              </Button>
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <SignNav />

      {kpis.aSigner > 0 && (
        <Alert
          tone="warning"
          titre={`${kpis.aSigner} document(s) attendent votre signature`}
          action={
            <Button size="sm" onClick={() => navigate('/signatures/a-signer')} iconLeft={<PenLine aria-hidden className="h-3.5 w-3.5" />}>
              Les signer
            </Button>
          }
        >
          C'est à votre tour dans l'ordre de passage. Les signataires suivants ne peuvent pas signer avant vous.
        </Alert>
      )}

      {kpis.expirees > 0 && (
        <Alert tone="warning" titre={`${kpis.expirees} demande(s) expirée(s)`}>
          L'échéance est dépassée sans que tous les signataires aient répondu. Prolongez l'échéance ou renvoyez une
          nouvelle demande.
        </Alert>
      )}

      <section aria-label="Indicateurs des signatures" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="À signer par moi" value={String(kpis.aSigner)} hint="Mon tour dans l'ordre de passage" />
        <KpiCard label="En attente" value={String(kpis.enAttente)} hint="Tous signataires confondus" />
        <KpiCard label="Signées par tous" value={String(kpis.terminees)} hint="Documents scellés disponibles" />
        <KpiCard label="Taux d'aboutissement" value={String(kpis.tauxAboutissement)} unit="%" hint="Des demandes envoyées" />
        <KpiCard label="Refusées" value={String(kpis.refusees)} hint="Motif consigné" />
        <KpiCard label="Expirées" value={String(kpis.expirees)} hint="Échéance dépassée" />
        <KpiCard label="Brouillons" value={String(kpis.brouillons)} hint="Non encore envoyées" />
        <KpiCard label="Délai moyen" value={String(kpis.delaiMoyen)} unit="j" hint="Entre envoi et dernière signature" />
      </section>

      {aSigner.length > 0 && (
        <Card>
          <CardHeader title="Votre signature est attendue" description="Ouvrez le document, vérifiez-le, puis signez ou refusez avec un motif." />
          <ul className="divide-y divide-ink-100">
            {aSigner.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/signatures/${d.id}`)}
                  className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{d.titre}</span>
                    <span className="ac-num block truncate text-xs text-ink-500">
                      {d.reference} · {d.documentNom} · échéance le {formatDate(d.echeanceLe)}
                    </span>
                  </span>
                  <Badge variant="outline">
                    {progression(d).signes} / {progression(d).total} signé(s)
                  </Badge>
                  <StatusBadge status={cleDemande[statutDemande(d)]} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Demandes en cours"
          description="Les échéances les plus proches en premier."
          action={<Button size="sm" onClick={() => navigate('/signatures/envoyees')}>Tout voir</Button>}
        />
        {enCours.length === 0 ? (
          <EmptyState icon={<Send />} title="Aucune demande en cours" description="Toutes les demandes envoyées ont abouti." compact />
        ) : (
          <ul className="divide-y divide-ink-100">
            {enCours.map((d) => {
              const p = progression(d)
              const jours = joursAvantEcheance(d)
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/signatures/${d.id}`)}
                    className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{d.titre}</span>
                      <span className="ac-num block truncate text-xs text-ink-500">
                        {d.reference} · {jours >= 0 ? `échéance dans ${jours} j` : `expirée depuis ${-jours} j`}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="h-1.5 w-24 overflow-hidden rounded-full bg-ink-100">
                        <span className="block h-full rounded-full bg-brand-500" style={{ width: `${p.pourcentage}%` }} />
                      </span>
                      <span className="ac-num w-14 text-right text-xs text-ink-600">
                        {p.signes}/{p.total}
                      </span>
                    </span>
                    <StatusBadge status={cleDemande[statutDemande(d)]} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </Page>
  )
}
