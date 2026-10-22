import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, RefreshCw, Send } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { HorizontalBars, LineChart } from '@/components/ui/Chart'
import { StatusBadge } from '@/components/ui/Status'
import { FactNav, FactOutils } from '@/components/facturation/FactNav'
import { cleFacture } from '@/components/facturation/statuts'
import { useFacturation } from '@/context/FacturationContext'
import {
  calculerKpisFacturation,
  encoursParAnciennete,
  repartitionParClient,
  resteDuFacture,
  serieChiffreAffaires,
  statutFacture,
  totalTTC,
} from '@/lib/facturation'
import { formatDate, formatMoney } from '@/lib/utils'

export function FactDashboard() {
  usePageTitle('Facturation')

  const navigate = useNavigate()
  const { factures, clients, chargement, erreur, recharger } = useFacturation()

  const kpis = calculerKpisFacturation(factures)
  const ca = serieChiffreAffaires(factures)
  const parClient = repartitionParClient(factures, clients)
  const encours = encoursParAnciennete(factures)

  const aRelancer = factures
    .filter((f) => statutFacture(f) === 'retard')
    .sort((a, b) => (a.echeance < b.echeance ? -1 : 1))
    .slice(0, 6)

  const enTete = (
    <PageHeader
      eyebrow="Facturation"
      title="Tableau de bord de la facturation"
      description="Chiffre d'affaires, encaissements et encours client sur les douze derniers mois."
      actions={
        <>
          <FactOutils />
          <Button onClick={() => navigate('/facturation/factures')} iconLeft={<FileText aria-hidden className="h-4 w-4" />}>
            Toutes les factures
          </Button>
          <Button variant="primary" onClick={() => navigate('/facturation/factures/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouvelle facture
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <FactNav />
        <Alert
          tone="danger"
          titre="La facturation n'a pas pu être chargée"
          action={
            <Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>
              Réessayer
            </Button>
          }
        >
          {erreur} Aucune facture n'a été perdue.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <FactNav />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-20" />
              <Skeleton className="mt-3 h-3 w-28" />
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-4 h-40 w-full" />
        </Card>
      </Page>
    )
  }

  if (factures.length === 0) {
    return (
      <Page header={enTete}>
        <FactNav />
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Aucune facture émise"
            description="Créez votre première facture. Vérifiez d'abord que vos clients et votre catalogue de prestations sont renseignés."
            action={
              <Button variant="primary" onClick={() => navigate('/facturation/factures/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Créer une facture
              </Button>
            }
            secondaryAction={<Button onClick={() => navigate('/facturation/clients')}>Gérer les clients</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <FactNav />

      {kpis.enRetard > 0 && (
        <Alert
          tone="warning"
          titre={`${kpis.enRetard} facture(s) en retard — ${formatMoney(kpis.montantRetard)}`}
          action={
            <Button size="sm" onClick={() => navigate('/facturation/relances')} iconLeft={<Send aria-hidden className="h-3.5 w-3.5" />}>
              Gérer les relances
            </Button>
          }
        >
          L'échéance est dépassée et le solde reste dû. Une relance graduée en trois niveaux est prévue.
        </Alert>
      )}

      <section aria-label="Indicateurs de facturation" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Factures émises" value={String(kpis.facturesEmises)} hint="Hors brouillons et annulations" />
        <KpiCard label="Chiffre d'affaires HT" value={formatMoney(kpis.chiffreAffairesHT)} hint="Douze derniers mois" />
        <KpiCard label="Encaissé" value={formatMoney(kpis.encaisse)} hint="Règlements enregistrés" />
        <KpiCard label="En attente de règlement" value={formatMoney(kpis.enAttente)} hint="Factures envoyées non échues" />
        <KpiCard
          label="En retard"
          value={formatMoney(kpis.montantRetard)}
          trend={{ direction: 'down', value: `${kpis.enRetard} factures`, description: 'échéance dépassée' }}
        />
        <KpiCard label="Délai moyen de paiement" value={String(kpis.delaiMoyenPaiement)} unit="j" hint="Entre émission et règlement" />
        <KpiCard label="Brouillons" value={String(kpis.brouillons)} hint="Non envoyés au client" />
        <KpiCard label="Avoirs émis" value={String(kpis.avoirs)} hint={`${formatMoney(kpis.montantAvoirs)} au total`} />
      </section>

      <Card>
        <CardHeader title="Chiffre d'affaires" description="Montant hors taxes facturé chaque mois, sur douze mois." />
        <CardBody>
          <LineChart points={ca} titre="Chiffre d'affaires hors taxes par mois" unite=" €" />
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Premiers clients" description="Chiffre d'affaires hors taxes, douze derniers mois." />
          <CardBody>
            <HorizontalBars
              titre="Répartition du chiffre d'affaires par client"
              data={parClient}
              total={parClient.reduce((s, c) => s + c.valeur, 0)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Encours client" description="Montants restant à encaisser, par ancienneté d'échéance." />
          <CardBody>
            <HorizontalBars
              titre="Encours client par ancienneté"
              data={encours}
              total={encours.reduce((s, c) => s + c.valeur, 0)}
            />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Factures à relancer"
          description="Échéance dépassée, solde non réglé."
          action={
            <Button size="sm" onClick={() => navigate('/facturation/relances')}>
              Ouvrir les relances
            </Button>
          }
        />
        {aRelancer.length === 0 ? (
          <EmptyState icon={<Send />} title="Aucune facture en retard" description="Tous les règlements sont à jour." compact />
        ) : (
          <ul className="divide-y divide-ink-100">
            {aRelancer.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/facturation/factures/${f.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">
                      {clients.find((c) => c.id === f.clientId)?.nom}
                    </span>
                    <span className="ac-num block truncate text-xs text-ink-500">
                      {f.numero} · échéance le {formatDate(f.echeance)} · {f.relances.length} relance(s)
                    </span>
                  </span>
                  <span className="ac-num shrink-0 text-[0.8125rem] font-semibold text-ink-900">
                    {formatMoney(resteDuFacture(f))}
                    <span className="ml-1 text-xs font-normal text-ink-500">/ {formatMoney(totalTTC(f))}</span>
                  </span>
                  <StatusBadge status={cleFacture(f)} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  )
}
