import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { FileBarChart } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { GroupedBars } from '@/components/ui/Chart'
import { ComptaNav, ComptaOutils } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import { budgetVsRealise, soldesParCompte } from '@/lib/comptabilite'
import { formatMoney } from '@/lib/utils'

const arrondi = (n: number) => Math.round(n * 100) / 100

const onglets = [
  { id: 'resultat', label: 'Compte de résultat' },
  { id: 'bilan', label: 'Bilan simplifié' },
  { id: 'budget', label: 'Budget et réalisé' },
]

export function Rapports() {
  usePageTitle('Rapports comptables')

  const { ecritures, plan, budget, exercice, exerciceId, chargement } = useCompta()
  const [onglet, setOnglet] = useState('resultat')

  const validees = ecritures.filter((e) => e.statut === 'validee' && e.exerciceId === exerciceId)
  const soldesExercice = soldesParCompte(validees)
  const soldesCumules = soldesParCompte(ecritures.filter((e) => e.statut === 'validee'))
  const brouillons = ecritures.filter((e) => e.statut === 'brouillon' && e.exerciceId === exerciceId).length

  const charges = plan
    .filter((c) => c.sens === 'charge' && soldesExercice.has(c.numero))
    .map((c) => ({ compte: c, montant: arrondi(soldesExercice.get(c.numero)!.solde) }))
    .filter((l) => l.montant !== 0)
  const produits = plan
    .filter((c) => c.sens === 'produit' && soldesExercice.has(c.numero))
    .map((c) => ({ compte: c, montant: arrondi(-soldesExercice.get(c.numero)!.solde) }))
    .filter((l) => l.montant !== 0)

  const totalCharges = arrondi(charges.reduce((s, l) => s + l.montant, 0))
  const totalProduits = arrondi(produits.reduce((s, l) => s + l.montant, 0))
  const resultat = arrondi(totalProduits - totalCharges)

  const actif = plan
    .filter((c) => c.sens === 'actif' && soldesCumules.has(c.numero))
    .map((c) => ({ compte: c, montant: arrondi(soldesCumules.get(c.numero)!.solde) }))
    .filter((l) => l.montant !== 0)
  const passif = plan
    .filter((c) => c.sens === 'passif' && soldesCumules.has(c.numero))
    .map((c) => ({ compte: c, montant: arrondi(-soldesCumules.get(c.numero)!.solde) }))
    .filter((l) => l.montant !== 0)

  const totalActif = arrondi(actif.reduce((s, l) => s + l.montant, 0))
  const totalPassif = arrondi(passif.reduce((s, l) => s + l.montant, 0))

  const lignesBudget = budgetVsRealise(ecritures, budget, plan, exerciceId)

  const Tableau = ({
    titre,
    lignes,
    total,
    libelleTotal,
  }: {
    titre: string
    lignes: { compte: { numero: string; libelle: string }; montant: number }[]
    total: number
    libelleTotal: string
  }) => (
    <Card>
      <CardHeader title={titre} description={`${lignes.length} postes`} />
      <div className="ac-scroll overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">{titre}</caption>
          <thead>
            <tr className="border-b border-ink-100 bg-ink-25">
              <th scope="col" className="px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">Compte</th>
              <th scope="col" className="px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500">Intitulé</th>
              <th scope="col" className="px-4 py-2 text-right text-2xs font-semibold uppercase tracking-wide text-ink-500">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {lignes.map((l) => (
              <tr key={l.compte.numero}>
                <td className="ac-num px-4 py-2 text-[0.8125rem] text-ink-500">{l.compte.numero}</td>
                <td className="px-4 py-2 text-[0.8125rem] text-ink-800">{l.compte.libelle}</td>
                <td className="ac-num px-4 py-2 text-right text-[0.8125rem] font-medium text-ink-900">{formatMoney(l.montant)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink-200 bg-ink-25">
              <td colSpan={2} className="px-4 py-2.5 text-[0.8125rem] font-semibold text-ink-900">{libelleTotal}</td>
              <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-semibold text-ink-900">{formatMoney(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Comptabilité"
          title="Rapports"
          description={`Compte de résultat, bilan et suivi budgétaire de l'exercice ${exercice.libelle}. Seules les écritures validées sont retenues.`}
          meta={<Badge variant="brand">Exercice {exercice.libelle}</Badge>}
          actions={<ComptaOutils />}
        />
      }
    >
      <ComptaNav />

      {brouillons > 0 && (
        <Alert tone="warning" titre={`${brouillons} écriture(s) en brouillon exclue(s) des rapports`}>
          Les montants ci-dessous ne reflètent pas les brouillons. Validez-les pour qu'ils soient pris en compte.
        </Alert>
      )}

      <Tabs items={onglets} value={onglet} onChange={setOnglet} ariaLabel="Rapports comptables" />

      {chargement ? (
        <Card>
          <SkeletonTable rows={8} />
        </Card>
      ) : validees.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileBarChart />}
            title="Aucune écriture validée sur cet exercice"
            description="Les rapports se construisent à partir des écritures validées."
          />
        </Card>
      ) : (
        <div role="tabpanel" aria-label={onglets.find((o) => o.id === onglet)?.label} className="flex flex-col gap-4">
          {onglet === 'resultat' && (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <Tableau titre="Charges" lignes={charges} total={totalCharges} libelleTotal="Total des charges" />
                <Tableau titre="Produits" lignes={produits} total={totalProduits} libelleTotal="Total des produits" />
              </div>
              <Alert tone={resultat >= 0 ? 'success' : 'danger'} titre={resultat >= 0 ? 'Excédent de l’exercice' : 'Déficit de l’exercice'}>
                Produits {formatMoney(totalProduits)} moins charges {formatMoney(totalCharges)}, soit{' '}
                <strong>{formatMoney(Math.abs(resultat))}</strong>. Ce montant sera affecté en réserves à la clôture.
              </Alert>
            </>
          )}

          {onglet === 'bilan' && (
            <>
              <Alert tone="neutral" titre="Bilan simplifié, soldes cumulés">
                Les comptes de bilan ne se remettent pas à zéro d'un exercice à l'autre : les montants ci-dessous
                cumulent tous les exercices. Le résultat de l'exercice en cours n'y est pas encore affecté.
              </Alert>
              <div className="grid gap-4 lg:grid-cols-2">
                <Tableau titre="Actif" lignes={actif} total={totalActif} libelleTotal="Total de l’actif" />
                <Tableau titre="Passif" lignes={passif} total={totalPassif} libelleTotal="Total du passif" />
              </div>
              <Alert tone={arrondi(totalActif - totalPassif - resultat) === 0 ? 'success' : 'warning'} titre="Contrôle d’équilibre">
                Actif {formatMoney(totalActif)} · passif {formatMoney(totalPassif)} · résultat non affecté{' '}
                {formatMoney(resultat)}. L'écart résiduel s'élève à{' '}
                {formatMoney(Math.abs(arrondi(totalActif - totalPassif - resultat)))}.
              </Alert>
            </>
          )}

          {onglet === 'budget' && (
            <>
              <Card>
                <CardHeader title="Budget et réalisé" description="Postes suivis au budget de l'exercice." />
                <CardBody>
                  <GroupedBars
                    titre="Comparaison du budget prévu et du réalisé"
                    colonneLabel="Compte"
                    formatValeur={(v) => formatMoney(v)}
                    data={lignesBudget.map((l) => ({ label: l.compte.slice(0, 3), prevu: l.prevu, realise: l.realise }))}
                    series={[
                      { key: 'prevu', label: 'Prévu', couleur: '#8DB5DE', motif: true },
                      { key: 'realise', label: 'Réalisé', couleur: '#2364AA' },
                    ]}
                  />
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Détail par poste" description="Écart entre le budget voté et les montants comptabilisés." />
                <div className="ac-scroll overflow-x-auto">
                  <table className="w-full text-left">
                    <caption className="sr-only">Comparaison détaillée du budget et du réalisé</caption>
                    <thead>
                      <tr className="border-b border-ink-100 bg-ink-25">
                        {['Compte', 'Intitulé', 'Nature', 'Prévu', 'Réalisé', 'Écart', 'Consommé'].map((h, i) => (
                          <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 3 ? 'text-right' : ''}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {lignesBudget.map((l) => {
                        const ecartL = arrondi(l.realise - l.prevu)
                        const pct = l.prevu === 0 ? 0 : Math.round((l.realise / l.prevu) * 100)
                        const favorable = l.sens === 'produit' ? ecartL >= 0 : ecartL <= 0
                        return (
                          <tr key={l.compte}>
                            <td className="ac-num px-4 py-2 text-[0.8125rem] text-ink-500">{l.compte}</td>
                            <td className="px-4 py-2 text-[0.8125rem] text-ink-800">{l.label}</td>
                            <td className="px-4 py-2 text-[0.8125rem] text-ink-500">{l.sens === 'produit' ? 'Produit' : 'Charge'}</td>
                            <td className="ac-num px-4 py-2 text-right text-[0.8125rem]">{formatMoney(l.prevu)}</td>
                            <td className="ac-num px-4 py-2 text-right text-[0.8125rem] font-medium text-ink-900">{formatMoney(l.realise)}</td>
                            <td className={`ac-num px-4 py-2 text-right text-[0.8125rem] font-medium ${favorable ? 'text-success-600' : 'text-warning-600'}`}>
                              {ecartL > 0 ? '+' : ''}
                              {formatMoney(ecartL)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <span className="inline-flex items-center gap-2">
                                <span aria-hidden className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
                                  <span
                                    className={`block h-full rounded-full ${favorable ? 'bg-success-500' : 'bg-warning-500'}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </span>
                                <span className="ac-num w-12 text-right text-[0.8125rem] text-ink-700">{pct} %</span>
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </div>
      )}
    </Page>
  )
}
