import { useNavigate } from 'react-router-dom'
import { BarChart3, Send } from 'lucide-react'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { AnneauProgression, HorizontalBars, LineChart } from '@/components/ui/Chart'
import { FormulairePage } from '@/components/formulaires/FormulairePage'
import {
  champAvecOptions,
  champEstEchelle,
  champsSaisissables,
  derniereReponseLe,
  dureeMoyenne,
  repartitionChamp,
  tauxCompletion,
  type Formulaire,
} from '@/lib/formulaires'
import { formatDate } from '@/lib/utils'

function dureeLisible(s: number) {
  const min = Math.floor(s / 60)
  const sec = s % 60
  return min > 0 ? `${min} min ${sec}s` : `${sec}s`
}

function CorpsStatistiques({ formulaire }: { formulaire: Formulaire }) {
  const navigate = useNavigate()

  if (formulaire.reponses.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<BarChart3 />}
          title="Pas encore de statistiques"
          description="Elles apparaîtront dès la première réponse reçue."
          action={
            <Button variant="primary" onClick={() => navigate(`/formulaires/${formulaire.id}/publication`)} iconLeft={<Send aria-hidden className="h-4 w-4" />}>
              Ouvrir la publication
            </Button>
          }
        />
      </Card>
    )
  }

  const taux = tauxCompletion(formulaire)
  const derniere = derniereReponseLe(formulaire)

  const parJour = new Map<string, number>()
  for (const r of formulaire.reponses) {
    const jour = r.soumiseLe.slice(0, 10)
    parJour.set(jour, (parJour.get(jour) ?? 0) + 1)
  }
  const jours = Array.from(parJour.keys()).sort()
  const evolution = jours.map((j) => ({ label: formatDate(new Date(j).toISOString()), valeur: parJour.get(j) ?? 0 }))

  const champsAnalyses = champsSaisissables(formulaire).filter((c) => champAvecOptions(c) || champEstEchelle(c))

  return (
    <>
      <section aria-label="Indicateurs" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Réponses reçues" value={String(formulaire.reponses.length)} hint={`Sur ${formulaire.vues} visite(s)`} />
        <KpiCard label="Taux de complétion" value={String(taux)} unit="%" hint="Réponses envoyées sur visites" />
        <KpiCard label="Durée moyenne" value={dureeLisible(dureeMoyenne(formulaire))} hint="Entre l'ouverture et l'envoi" />
        <KpiCard label="Dernière réponse" value={derniere ? formatDate(derniere) : '—'} hint="Date de la réponse la plus récente" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Complétion" description="Part des visites qui aboutissent à une réponse envoyée." />
          <CardBody>
            <AnneauProgression
              titre="Taux de complétion"
              valeur={taux}
              segments={[{ label: 'Réponses envoyées', part: taux / 100, couleur: '#2364AA' }]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Réponses reçues" description="Nombre de réponses par jour." />
          <CardBody>
            {evolution.length > 1 ? (
              <LineChart points={evolution} titre="Réponses par jour" />
            ) : (
              <p className="py-8 text-center text-[0.8125rem] text-ink-500">Pas assez de jours distincts pour tracer une évolution.</p>
            )}
          </CardBody>
        </Card>
      </div>

      {champsAnalyses.length > 0 && (
        <Card>
          <CardHeader title="Réponses par question" description="Répartition des choix pour les questions à options ou à échelle." />
          <CardBody className="flex flex-col gap-6">
            {champsAnalyses.map((champ) => {
              const total = formulaire.reponses.filter((r) => r.valeurs[champ.id] !== undefined).length
              return (
                <div key={champ.id}>
                  <p className="mb-3 text-[0.8125rem] font-medium text-ink-800">{champ.label}</p>
                  {total === 0 ? (
                    <p className="text-[0.8125rem] text-ink-500">Cette question n’a reçu aucune réponse.</p>
                  ) : (
                    <HorizontalBars data={repartitionChamp(formulaire, champ)} titre={champ.label} total={total} />
                  )}
                </div>
              )
            })}
          </CardBody>
        </Card>
      )}
    </>
  )
}

export function FormulaireStatistiques() {
  return <FormulairePage eyebrow="Formulaires">{(f) => <CorpsStatistiques formulaire={f} />}</FormulairePage>
}
