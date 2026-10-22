import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeftRight, Plus, RefreshCw, Wallet } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { HorizontalBars, LineChart } from '@/components/ui/Chart'
import { StatusBadge } from '@/components/ui/Status'
import { TresoNav, TresoOutils } from '@/components/tresorerie/TresoNav'
import { EnchainementTresorerie } from '@/components/tresorerie/Enchainement'
import { useTresorerie } from '@/context/TresorerieContext'
import {
  calculerEnchainement,
  previsionsDansHorizon,
  repartitionCategories,
  serieProjection,
  serieSolde,
  soldeCompte,
  typeCompteLabels,
  type Horizon,
} from '@/lib/tresorerie'
import { formatDate, formatMoney } from '@/lib/utils'

const horizons: Horizon[] = [30, 60, 90]

export function TresoDashboard() {
  usePageTitle('Trésorerie')

  const navigate = useNavigate()
  const { comptes, mouvements, previsions, categories, horizon, setHorizon, chargement, erreur, recharger } = useTresorerie()

  const enchainement = calculerEnchainement(comptes, mouvements, previsions, horizon)
  const projection = serieProjection(comptes, mouvements, previsions, horizon)
  const historique = serieSolde(comptes, mouvements)
  const sorties = repartitionCategories(mouvements, categories, 'sortie')
  const aVenir = previsionsDansHorizon(previsions, horizon).sort((a, b) => (a.dateAttendue < b.dateAttendue ? -1 : 1))
  const nonCategorises = mouvements.filter((m) => !m.categorieId && !m.virementId).length
  const creuse = Math.min(...projection.map((p) => p.valeur))

  const enTete = (
    <PageHeader
      eyebrow="Trésorerie"
      title="Tableau de bord de trésorerie"
      description="Ce que vous avez, ce qui doit rentrer, ce qui doit sortir, et ce qu'il restera. Lisez la ligne de gauche à droite."
      actions={
        <>
          <div role="group" aria-label="Horizon de projection" className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5">
            {horizons.map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={horizon === h}
                onClick={() => setHorizon(h)}
                className={`h-7 rounded-md px-2.5 text-xs font-medium transition-colors ${
                  horizon === h ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                {h} j
              </button>
            ))}
          </div>
          <TresoOutils />
          <Button variant="primary" onClick={() => navigate('/tresorerie/mouvements/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouvelle transaction
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <TresoNav />
        <Alert
          tone="danger"
          titre="La trésorerie n'a pas pu être chargée"
          action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}
        >
          {erreur} Les soldes affichés seraient faux : rien n'est présenté tant que la synchronisation n'a pas abouti.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <TresoNav />
        <div className="grid gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-3 h-7 w-24" />
              <Skeleton className="mt-3 h-3 w-32" />
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

  if (mouvements.length === 0) {
    return (
      <Page header={enTete}>
        <TresoNav />
        <Card>
          <EmptyState
            icon={<Wallet />}
            title="Aucun mouvement enregistré"
            description="Les soldes et la projection apparaîtront dès la première transaction. Vérifiez d'abord que vos comptes bancaires sont déclarés."
            action={
              <Button variant="primary" onClick={() => navigate('/tresorerie/mouvements/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Saisir une transaction
              </Button>
            }
            secondaryAction={<Button onClick={() => navigate('/tresorerie/comptes')}>Déclarer un compte</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <TresoNav />

      {creuse < 0 && (
        <Alert
          tone="warning"
          titre={`Trésorerie négative anticipée : ${formatMoney(creuse)}`}
          action={
            <Button size="sm" onClick={() => navigate('/tresorerie/virements')} iconLeft={<ArrowLeftRight aria-hidden className="h-3.5 w-3.5" />}>
              Préparer un virement
            </Button>
          }
        >
          La projection passe sous zéro avant {horizon} jours. Un virement depuis le livret peut couvrir le creux.
        </Alert>
      )}

      <EnchainementTresorerie donnees={enchainement} horizon={horizon} />

      <Alert tone="neutral" titre="Lecture prudente">
        En ne retenant que les entrées confirmées, le solde à {horizon} jours serait de{' '}
        <strong>{formatMoney(enchainement.soldePrudent)}</strong> au lieu de {formatMoney(enchainement.soldePrevisionnel)}.
        L'écart correspond aux encaissements seulement probables.
      </Alert>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Projection" description={`Solde semaine par semaine sur ${horizon} jours.`} />
          <CardBody>
            <LineChart points={projection} titre={`Projection de trésorerie à ${horizon} jours`} unite=" €" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Historique" description="Solde à la fin de chaque mois, sur douze mois." />
          <CardBody>
            <LineChart points={historique} titre="Évolution du solde de trésorerie" unite=" €" />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Comptes"
            description={`${comptes.length} comptes déclarés.`}
            action={<Button size="sm" onClick={() => navigate('/tresorerie/comptes')}>Gérer</Button>}
          />
          <ul className="divide-y divide-ink-100">
            {comptes.map((c) => {
              const solde = soldeCompte(c, mouvements)
              const alerte = solde < -c.decouvertAutorise
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/tresorerie/comptes/${c.id}`)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{c.nom}</span>
                      <span className="block truncate text-xs text-ink-500">
                        {typeCompteLabels[c.type]} · {c.banque}
                      </span>
                    </span>
                    {alerte && <AlertTriangle aria-hidden className="h-4 w-4 shrink-0 text-danger-600" />}
                    <span className={`ac-num shrink-0 text-[0.8125rem] font-semibold ${alerte ? 'text-danger-600' : 'text-ink-900'}`}>
                      {formatMoney(solde)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Échéances à venir"
            description={`${aVenir.length} mouvement(s) attendus sur ${horizon} jours.`}
            action={<Button size="sm" onClick={() => navigate('/tresorerie/previsionnel')}>Prévisionnel</Button>}
          />
          {aVenir.length === 0 ? (
            <EmptyState icon={<Wallet />} title="Aucune échéance connue" description="Ajoutez vos prévisions pour affiner la projection." compact />
          ) : (
            <ul className="divide-y divide-ink-100">
              {aVenir.slice(0, 7).map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{p.libelle}</span>
                    <span className="ac-num block truncate text-xs text-ink-500">
                      {p.tiers} · {formatDate(p.dateAttendue)}
                    </span>
                  </span>
                  <StatusBadge status={p.fiabilite === 'confirmee' ? 'prevision_confirmee' : 'prevision_probable'} />
                  <span className={`ac-num shrink-0 text-[0.8125rem] font-semibold ${p.sens === 'entree' ? 'text-success-600' : 'text-danger-600'}`}>
                    {p.sens === 'entree' ? '+' : '−'}
                    {formatMoney(p.montant)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Répartition des sorties"
          description="Douze derniers mois, hors virements internes."
          action={
            nonCategorises > 0 ? (
              <Button size="sm" onClick={() => navigate('/tresorerie/categorisation')}>
                {nonCategorises} à catégoriser
              </Button>
            ) : (
              <Badge variant="outline">Tout est catégorisé</Badge>
            )
          }
        />
        <CardBody>
          <HorizontalBars titre="Répartition des sorties par catégorie" data={sorties} total={sorties.reduce((s, c) => s + c.valeur, 0)} />
        </CardBody>
      </Card>
    </Page>
  )
}
