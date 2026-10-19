import { useNavigate } from 'react-router-dom'
import { ArrowRight, CalendarClock, LineChart, ListChecks, Plus, UserRound, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/Status'
import { LineChart as Courbe } from '@/components/ui/Chart'
import { cleAdhesion } from '@/components/adherents/statuts'
import { useOrg } from '@/context/OrgContext'
import { useContacts } from '@/context/ContactsContext'
import { useAdherents } from '@/context/AdherentsContext'
import { useCompta } from '@/context/ComptaContext'
import { useTresorerie } from '@/context/TresorerieContext'
import { useNotesFrais } from '@/context/NotesFraisContext'
import { soldeGlobal } from '@/lib/tresorerie'
import { calculerKpisNdf } from '@/lib/notesFrais'
import { calculerKpisCompta } from '@/lib/comptabilite'
import { useToast } from '@/context/ToastContext'
import { EXERCICE_COURANT, calculerKpis, serieEvolution, statutAdhesion } from '@/lib/adherents'
import { formatDate, formatMoney } from '@/lib/utils'

export function Dashboard() {
  const { org } = useOrg()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { contacts } = useContacts()
  const { adherents, types, chargement } = useAdherents()
  const { ecritures, exerciceId: exerciceCompta } = useCompta()
  const compta = calculerKpisCompta(ecritures, exerciceCompta)
  const { comptes, mouvements } = useTresorerie()
  const { notes } = useNotesFrais()
  const ndf = calculerKpisNdf(notes)

  const kpis = calculerKpis(adherents, types)
  const evolution = serieEvolution(adherents)
  const aTraiter = adherents
    .filter((a) => ['expirant', 'expiree'].includes(statutAdhesion(a)))
    .sort((a, b) => (a.dateFin < b.dateFin ? -1 : 1))
    .slice(0, 5)

  return (
    <Page
      header={
        <PageHeader
          eyebrow={org.type}
          title={`Bonjour, voici ${org.nom}`}
          description="Une vue d'ensemble de l'activité. Chaque indicateur renvoie vers le module qui le produit."
          meta={<Badge variant="brand">Exercice {EXERCICE_COURANT}</Badge>}
          actions={
            <>
              <Button onClick={() => navigate('/contacts/nouveau')} iconLeft={<UserRound aria-hidden className="h-4 w-4" />}>
                Nouveau contact
              </Button>
              <Button variant="primary" onClick={() => navigate('/adherents/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouvelle adhésion
              </Button>
            </>
          }
        />
      }
    >
      <section aria-label="Indicateurs clés" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Contacts enregistrés" value={String(contacts.length)} hint="Toutes catégories confondues" />
        <KpiCard label="Adhérents" value={chargement ? '—' : String(kpis.actifs)} hint="Adhésions en cours" />
        <KpiCard label="Notes de frais à traiter" value={String(ndf.aValider)} hint={`${formatMoney(ndf.montantAValider)} en attente`} />
        <KpiCard label="Trésorerie" value={formatMoney(soldeGlobal(comptes, mouvements))} hint="Tous comptes bancaires et caisse" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Évolution des adhérents"
            description="Douze derniers mois"
            action={
              <Button size="sm" onClick={() => navigate('/adherents')} iconRight={<ArrowRight aria-hidden className="h-3.5 w-3.5" />}>
                Détail
              </Button>
            }
          />
          <CardBody>
            {adherents.length === 0 ? (
              <EmptyState
                icon={<LineChart />}
                title="Pas encore de données à représenter"
                description="Le graphique s'affichera dès la première adhésion enregistrée."
                compact
              />
            ) : (
              <Courbe points={evolution} titre="Évolution du nombre d'adhérents sur douze mois" />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="À traiter cette semaine"
            description="Adhésions arrivant à échéance ou expirées"
            action={
              <Button size="sm" onClick={() => navigate('/adherents/liste')} iconRight={<ArrowRight aria-hidden className="h-3.5 w-3.5" />}>
                Tout voir
              </Button>
            }
          />
          {aTraiter.length === 0 ? (
            <EmptyState
              icon={<ListChecks />}
              title="Rien à traiter"
              description="Aucune adhésion n'arrive à échéance dans l'immédiat."
              compact
              action={
                <Button
                  iconLeft={<CalendarClock aria-hidden className="h-4 w-4" />}
                  onClick={() => toast({ titre: 'Rappel programmé', detail: 'Vous serez alerté chaque lundi à 9 h.', tone: 'success' })}
                >
                  Programmer un rappel
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {aTraiter.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/adherents/${a.id}`)}
                    className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                  >
                    <Users aria-hidden className="h-4 w-4 shrink-0 text-ink-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-ink-900">
                        {a.prenom} {a.nom}
                      </span>
                      <span className="ac-num block truncate text-xs text-ink-500">
                        échéance le {formatDate(a.dateFin)}
                      </span>
                    </span>
                    <StatusBadge status={cleAdhesion(a)} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}
