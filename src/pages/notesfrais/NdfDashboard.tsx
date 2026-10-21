import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate } from 'react-router-dom'
import { FileWarning, Plus, ReceiptText, RefreshCw, Wallet } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { HorizontalBars, LineChart } from '@/components/ui/Chart'
import { StatusBadge } from '@/components/ui/Status'
import { NdfNav, NdfOutils } from '@/components/notesfrais/NdfNav'
import { WorkflowStepper, cleStatutNote } from '@/components/notesfrais/Workflow'
import { useNotesFrais } from '@/context/NotesFraisContext'
import {
  calculerKpisNdf,
  repartitionParNature,
  repartitionParProjet,
  serieNotesParMois,
} from '@/lib/notesFrais'
import { formatDate, formatMoney } from '@/lib/utils'

export function NdfDashboard() {
  usePageTitle('Notes de frais')

  const navigate = useNavigate()
  const { notes, natures, projets, demandeurs, chargement, erreur, recharger } = useNotesFrais()

  const kpis = calculerKpisNdf(notes)
  const parNature = repartitionParNature(notes, natures)
  const parProjet = repartitionParProjet(notes, projets)
  const serie = serieNotesParMois(notes)
  const aTraiter = notes
    .filter((n) => n.statut === 'soumise' || n.statut === 'validee_responsable')
    .sort((a, b) => (a.soumiseLe ?? '') < (b.soumiseLe ?? '') ? -1 : 1)
    .slice(0, 5)

  const nomDemandeur = (id: string) => demandeurs.find((d) => d.id === id)?.nom ?? '—'

  const enTete = (
    <PageHeader
      eyebrow="Notes de frais"
      title="Tableau de bord des notes de frais"
      description="Ce qui attend une validation, ce qui attend un remboursement, et ce que les dépenses recouvrent."
      actions={
        <>
          <NdfOutils />
          <Button onClick={() => navigate('/notes-de-frais/a-valider')} iconLeft={<FileWarning aria-hidden className="h-4 w-4" />}>
            Notes à valider
          </Button>
          <Button variant="primary" onClick={() => navigate('/notes-de-frais/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouvelle note
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <NdfNav />
        <Alert tone="danger" titre="Les notes de frais n'ont pas pu être chargées" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucune note n'a été perdue.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <NdfNav />
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

  if (notes.length === 0) {
    return (
      <Page header={enTete}>
        <NdfNav />
        <Card>
          <EmptyState
            icon={<ReceiptText />}
            title="Aucune note de frais"
            description="Les bénévoles et salariés déclarent ici leurs dépenses avancées. Chaque note suit un circuit de validation en cinq étapes."
            action={
              <Button variant="primary" onClick={() => navigate('/notes-de-frais/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Créer une note de frais
              </Button>
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <NdfNav />

      {kpis.sansJustificatif > 0 && (
        <Alert
          tone="warning"
          titre={`${kpis.sansJustificatif} note(s) sans justificatif`}
          action={
            <Button size="sm" onClick={() => navigate('/notes-de-frais/a-valider')}>
              Les examiner
            </Button>
          }
        >
          Le trésorier ne peut pas valider une note sans pièce jointe. Le demandeur doit être relancé.
        </Alert>
      )}

      <section aria-label="Indicateurs des notes de frais" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Notes enregistrées" value={String(kpis.total)} hint="Tous statuts confondus" />
        <KpiCard label="En attente de validation" value={String(kpis.aValider)} hint={`${formatMoney(kpis.montantAValider)} concernés`} />
        <KpiCard label="À rembourser" value={formatMoney(kpis.montantARembourser)} hint={`${kpis.validees} note(s) validées`} />
        <KpiCard label="Délai moyen" value={String(kpis.delaiMoyen)} unit="j" hint="Entre soumission et remboursement" />
        <KpiCard label="Remboursées" value={String(kpis.remboursees)} hint={`${formatMoney(kpis.montantRembourse)} versés`} />
        <KpiCard label="Rejetées" value={String(kpis.rejetees)} hint="À corriger et resoumettre" />
        <KpiCard label="Sans justificatif" value={String(kpis.sansJustificatif)} hint="Blocantes pour le trésorier" />
        <KpiCard label="Brouillons" value={String(notes.filter((n) => n.statut === 'brouillon').length)} hint="Non encore soumis" />
      </section>

      <Card>
        <CardHeader title="Le circuit de validation" description="Toute note suit ces cinq étapes. Un rejet renvoie la note à son auteur." />
        <CardBody>
          <WorkflowStepper note={{ ...notes[0], statut: 'validee_responsable' }} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Montant déclaré par mois" description="Huit derniers mois, toutes natures confondues." />
        <CardBody>
          <LineChart points={serie} titre="Montant des notes de frais déclarées par mois" unite=" €" />
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Par nature de frais" description="Notes validées ou remboursées." />
          <CardBody>
            <HorizontalBars titre="Répartition des notes de frais par nature" data={parNature} total={parNature.reduce((s, n) => s + n.valeur, 0)} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Par projet" description="Imputation analytique des dépenses." />
          <CardBody>
            <HorizontalBars titre="Répartition des notes de frais par projet" data={parProjet} total={parProjet.reduce((s, n) => s + n.valeur, 0)} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Notes en attente"
          description="Les plus anciennes en premier."
          action={<Button size="sm" onClick={() => navigate('/notes-de-frais/a-valider')}>Tout voir</Button>}
        />
        {aTraiter.length === 0 ? (
          <EmptyState icon={<Wallet />} title="Rien à valider" description="Toutes les notes soumises ont été traitées." compact />
        ) : (
          <ul className="divide-y divide-ink-100">
            {aTraiter.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/notes-de-frais/${n.id}`)}
                  className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{n.libelle}</span>
                    <span className="ac-num block truncate text-xs text-ink-500">
                      {n.numero} · {nomDemandeur(n.demandeurId)} · {formatDate(n.dateDepense)}
                    </span>
                  </span>
                  <span className="hidden sm:block"><WorkflowStepper note={n} compact /></span>
                  {!n.justificatif && <StatusBadge status="justificatif_manquant" />}
                  <span className="ac-num shrink-0 text-[0.8125rem] font-semibold text-ink-900">{formatMoney(n.montantTTC)}</span>
                  <StatusBadge status={cleStatutNote(n)} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Page>
  )
}
