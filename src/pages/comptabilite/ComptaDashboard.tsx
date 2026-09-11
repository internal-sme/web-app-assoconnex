import { useNavigate } from 'react-router-dom'
import { FileWarning, Plus, RefreshCw, Scale } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { GroupedBars, HorizontalBars, LineChart } from '@/components/ui/Chart'
import { StatusBadge } from '@/components/ui/Status'
import { ComptaNav, ComptaOutils } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import {
  budgetVsRealise,
  calculerKpisCompta,
  repartitionCharges,
  serieTresorerie,
} from '@/lib/comptabilite'
import { formatMoney } from '@/lib/utils'

export function ComptaDashboard() {
  const navigate = useNavigate()
  const { ecritures, plan, budget, exercice, exerciceId, lectureSeule, chargement, erreur, recharger } = useCompta()

  const kpis = calculerKpisCompta(ecritures, exerciceId)
  const tresorerie = serieTresorerie(ecritures, exercice)
  const budgetLignes = budgetVsRealise(ecritures, budget, plan, exerciceId)
  const charges = repartitionCharges(ecritures, plan, exerciceId)

  const enTete = (
    <PageHeader
      eyebrow="Comptabilité"
      title="Tableau de bord comptable"
      description={`Exercice ${exercice.libelle}, du 1ᵉʳ septembre au 31 août. Les comptes de bilan sont cumulés, les comptes de gestion arrêtés à l'exercice.`}
      actions={
        <>
          <ComptaOutils />
          <Button
            variant="primary"
            disabled={lectureSeule}
            onClick={() => navigate('/comptabilite/ecritures/nouvelle')}
            iconLeft={<Plus aria-hidden className="h-4 w-4" />}
          >
            Nouvelle écriture
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <ComptaNav />
        <Alert
          tone="danger"
          titre="La comptabilité n'a pas pu être chargée"
          action={
            <Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>
              Réessayer
            </Button>
          }
        >
          {erreur} Aucune écriture n'a été perdue.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <ComptaNav />
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

  if (ecritures.length === 0) {
    return (
      <Page header={enTete}>
        <ComptaNav />
        <Card>
          <EmptyState
            icon={<Scale />}
            title="Aucune écriture sur cet exercice"
            description="La comptabilité démarre avec sa première écriture. Vérifiez d'abord que votre plan comptable contient les comptes dont vous avez besoin."
            action={
              <Button variant="primary" onClick={() => navigate('/comptabilite/ecritures/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Saisir une écriture
              </Button>
            }
            secondaryAction={<Button onClick={() => navigate('/comptabilite/plan')}>Voir le plan comptable</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ComptaNav />

      {lectureSeule && (
        <Alert tone="neutral" titre={`L'exercice ${exercice.libelle} est clôturé`}>
          Les écritures sont consultables mais ne peuvent plus être créées ni modifiées. Basculez sur un exercice ouvert
          pour saisir.
        </Alert>
      )}

      {kpis.brouillons > 0 && (
        <Alert
          tone="warning"
          titre={`${kpis.brouillons} écriture(s) en brouillon`}
          action={
            <Button size="sm" onClick={() => navigate('/comptabilite/journal')} iconLeft={<FileWarning aria-hidden className="h-3.5 w-3.5" />}>
              Les valider
            </Button>
          }
        >
          Les brouillons n'entrent ni dans la balance, ni dans le résultat, ni dans les rapports.
        </Alert>
      )}

      <section aria-label="Indicateurs comptables" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Trésorerie" value={formatMoney(kpis.tresorerie)} hint="Banque et caisse, tous exercices" />
        <KpiCard label="Revenus" value={formatMoney(kpis.produits)} hint={`Classe 7 · exercice ${exercice.libelle}`} />
        <KpiCard label="Dépenses" value={formatMoney(kpis.charges)} hint={`Classe 6 · exercice ${exercice.libelle}`} />
        <KpiCard
          label="Résultat"
          value={formatMoney(kpis.resultat)}
          trend={{
            direction: kpis.resultat >= 0 ? 'up' : 'down',
            value: kpis.resultat >= 0 ? 'excédent' : 'déficit',
            description: `exercice ${exercice.libelle}`,
          }}
        />
        <KpiCard label="Solde bancaire" value={formatMoney(kpis.banque)} hint="Compte courant 512000" />
        <KpiCard label="Factures à payer" value={formatMoney(kpis.fournisseursAPayer)} hint="Solde fournisseurs 401000" />
        <KpiCard label="Factures à recevoir" value={formatMoney(kpis.clientsARecevoir)} hint="Adhérents et subventions notifiées" />
        <KpiCard label="Notes de frais" value={formatMoney(kpis.notesDeFrais)} hint="Restant à rembourser aux bénévoles" />
      </section>

      <Card>
        <CardHeader title="Trésorerie" description={`Solde de banque et caisse à la fin de chaque mois, report de l'exercice précédent inclus.`} />
        <CardBody>
          {tresorerie.length === 0 ? (
            <p className="py-6 text-center text-[0.8125rem] text-ink-500">Aucun mois clos sur cet exercice.</p>
          ) : (
            <LineChart points={tresorerie} titre="Évolution de la trésorerie sur l'exercice" unite=" €" />
          )}
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Budget et réalisé"
            description="Postes principaux, prévu au budget contre montants comptabilisés."
            action={
              <Button size="sm" onClick={() => navigate('/comptabilite/rapports')}>
                Détail
              </Button>
            }
          />
          <CardBody>
            <GroupedBars
              titre="Comparaison du budget prévu et du réalisé par poste"
              colonneLabel="Compte"
              formatValeur={(v) => formatMoney(v)}
              data={budgetLignes.slice(0, 5).map((l) => ({
                label: l.compte.slice(0, 3),
                prevu: l.prevu,
                realise: l.realise,
              }))}
              series={[
                { key: 'prevu', label: 'Prévu', couleur: '#8DB5DE', motif: true },
                { key: 'realise', label: 'Réalisé', couleur: '#2364AA' },
              ]}
            />
            <p className="mt-3 text-xs text-ink-500">
              Les libellés sont abrégés au numéro de compte. Le rapport détaillé donne les intitulés complets et l'écart.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Répartition des dépenses" description="Six premiers postes de charges de l'exercice." />
          <CardBody>
            {charges.length === 0 ? (
              <p className="py-6 text-center text-[0.8125rem] text-ink-500">Aucune charge comptabilisée.</p>
            ) : (
              <HorizontalBars
                titre="Répartition des charges par poste"
                data={charges}
                total={charges.reduce((s, c) => s + c.valeur, 0)}
              />
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Dernières écritures"
          description="Sur l'exercice en cours."
          action={
            <Button size="sm" onClick={() => navigate('/comptabilite/journal')}>
              Ouvrir le journal
            </Button>
          }
        />
        <ul className="divide-y divide-ink-100">
          {ecritures
            .filter((e) => e.exerciceId === exerciceId)
            .slice(0, 6)
            .map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/comptabilite/ecritures/${e.id}`)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                >
                  <Badge variant="outline">{e.journal}</Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{e.libelle}</span>
                    <span className="ac-num block truncate text-xs text-ink-500">
                      {e.numero} · {new Date(e.date).toLocaleDateString('fr-FR')} · {e.tiers}
                    </span>
                  </span>
                  <span className="ac-num shrink-0 text-[0.8125rem] font-semibold text-ink-900">
                    {formatMoney(e.lignes.reduce((s, l) => s + l.debit, 0))}
                  </span>
                  <StatusBadge status={e.statut === 'validee' ? 'ecriture_validee' : 'ecriture_brouillon'} />
                </button>
              </li>
            ))}
        </ul>
      </Card>
    </Page>
  )
}
