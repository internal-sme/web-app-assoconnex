import { usePageTitle } from '@/hooks/usePageTitle'
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Flag,
  FolderKanban,
  ListChecks,
  Lock,
  Pause,
  Play,
  Plus,
  ShieldAlert,
  Target,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Menu } from '@/components/ui/Menu'
import { Modal } from '@/components/ui/Modal'
import { Alert } from '@/components/ui/Alert'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Toggle'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { Timeline } from '@/components/ui/Timeline'
import { GroupedBars } from '@/components/ui/Chart'
import { Gantt } from '@/components/projets/Gantt'
import { SelecteurVue, VueCalendrier, VueKanban, BadgeStatut } from '@/components/taches/Vues'
import { ProjetsNav, ProjetsOutils, cleStatutProjet } from '@/components/projets/ProjetsNav'
import { useProjets } from '@/context/ProjetsContext'
import { useTaches } from '@/context/TachesContext'
import { useToast } from '@/context/ToastContext'
import {
  AUJOURDHUI_PROJET,
  avancementTemporel,
  budgetProjet,
  joursAvantFin,
  niveauRisque,
  scoreRisque,
  statutProjetLabels,
  type Jalon,
  type Projet,
  type Risque,
  type StatutProjet,
} from '@/lib/projets'
import { AUJOURDHUI_TACHE, equipe, type StatutTache } from '@/lib/taches'
import { formatDate, formatDateLong, formatMoney } from '@/lib/utils'

const onglets = [
  { id: 'general', label: 'Vue générale' },
  { id: 'taches', label: 'Tâches' },
  { id: 'planning', label: 'Planning' },
  { id: 'budget', label: 'Budget' },
  { id: 'equipe', label: 'Équipe' },
  { id: 'documents', label: 'Documents' },
  { id: 'activite', label: 'Activité' },
  { id: 'indicateurs', label: 'Indicateurs' },
  { id: 'risques', label: 'Risques' },
  { id: 'jalons', label: 'Jalons' },
]

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
      <dt className="text-[0.8125rem] text-ink-500">{label}</dt>
      <dd className="ac-num text-right text-[0.8125rem] font-medium text-ink-900">{children}</dd>
    </div>
  )
}

const cleJalon = { a_venir: 'jalon_a_venir', atteint: 'jalon_atteint', manque: 'jalon_manque' } as const
const cleRisque = { ouvert: 'risque_ouvert', maitrise: 'risque_maitrise', clos: 'risque_clos' } as const

export function ProjetFiche() {
  usePageTitle('Projet')

  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    projetParId, chargement, enregistrement,
    changerStatut, cloturer, ajouterJalon, changerStatutJalon, ajouterRisque, changerStatutRisque, ajouterLigneBudget,
  } = useProjets()
  const { taches, changerStatut: changerStatutTache } = useTaches()

  const [onglet, setOnglet] = useState(params.get('onglet') ?? 'general')
  const [vuePlanning, setVuePlanning] = useState<'kanban' | 'liste' | 'calendrier'>('kanban')
  const [gantt, setGantt] = useState(true)
  const [clotureOuverte, setClotureOuverte] = useState(false)
  const [bilan, setBilan] = useState('')
  const [confirmeLu, setConfirmeLu] = useState(false)
  const [jalonOuvert, setJalonOuvert] = useState(false)
  const [risqueOuvert, setRisqueOuvert] = useState(false)
  const [ligneOuverte, setLigneOuverte] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const [nouveauJalon, setNouveauJalon] = useState({ nom: '', description: '', date: new Date().toISOString().slice(0, 10), livrable: '' })
  const [nouveauRisque, setNouveauRisque] = useState({ libelle: '', probabilite: 2, impact: 2, parade: '', responsable: equipe[0].nom })
  const [nouvelleLigne, setNouvelleLigne] = useState({ poste: '', sens: 'depense' as 'depense' | 'recette', prevu: '', realise: '', compteComptable: '' })

  const p = projetParId(id)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Projet" />}>
        <ProjetsNav />
        <Card className="p-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-4 h-3 w-full" />
        </Card>
      </Page>
    )
  }

  if (!p) {
    return (
      <Page header={<PageHeader title="Projet introuvable" />}>
        <ProjetsNav />
        <Card>
          <EmptyState
            icon={<FolderKanban />}
            title="Ce projet n'existe plus"
            description="Il a peut-être été supprimé depuis un autre onglet."
            action={<Button variant="primary" onClick={() => navigate('/projets/liste')}>Retour à la liste</Button>}
          />
        </Card>
      </Page>
    )
  }

  const b = budgetProjet(p)
  const temps = avancementTemporel(p)
  const jours = joursAvantFin(p)
  const tachesProjet = taches.filter((t) => t.projetId === p.id)
  const tachesTerminees = tachesProjet.filter((t) => t.statut === 'termine').length
  const avancementTaches = tachesProjet.length === 0 ? 0 : Math.round((tachesTerminees / tachesProjet.length) * 100)
  const lectureSeule = p.statut === 'cloture'
  const jalonsOuverts = p.jalons.filter((j) => j.statut === 'a_venir').length

  const changerOnglet = (o: string) => {
    setOnglet(o)
    setParams(o === 'general' ? {} : { onglet: o })
  }

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, apres?: () => void) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      apres?.()
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow={`Projets · ${p.code}`}
          title={p.nom}
          description={p.description}
          meta={
            <>
              <StatusBadge status={cleStatutProjet[p.statut]} />
              <StatusBadge status={b.depasse ? 'budget_depasse' : 'budget_tenu'} />
              <Badge variant="outline">
                {formatDate(p.dateDebut)} → {formatDate(p.dateFin)}
              </Badge>
              {!lectureSeule && jours >= 0 && <Badge variant="outline">Fin dans {jours} j</Badge>}
            </>
          }
          actions={
            <>
              <ProjetsOutils />
              <Button onClick={() => navigate('/projets/liste')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Liste
              </Button>
              {!lectureSeule && (
                <Button
                  variant="primary"
                  onClick={() => { setBilan(''); setConfirmeLu(false); setClotureOuverte(true) }}
                  iconLeft={<Lock aria-hidden className="h-4 w-4" />}
                >
                  Clôturer le projet
                </Button>
              )}
              <Menu
                label={`Autres actions pour ${p.code}`}
                items={
                  lectureSeule
                    ? [{ label: 'Projet clôturé, aucune action possible', onSelect: () => undefined }]
                    : [
                        ...(p.statut !== 'en_cours'
                          ? [{ label: 'Démarrer le projet', icon: <Play />, onSelect: () => void executer(() => changerStatut(p.id, 'en_cours'), { titre: 'Projet démarré', detail: `${p.nom} passe en cours.` }) }]
                          : []),
                        ...(p.statut === 'en_cours'
                          ? [{ label: 'Suspendre le projet', icon: <Pause />, onSelect: () => void executer(() => changerStatut(p.id, 'suspendu'), { titre: 'Projet suspendu', detail: 'Il reste consultable et modifiable.' }) }]
                          : []),
                        { label: 'Ajouter un jalon', icon: <Flag />, onSelect: () => setJalonOuvert(true) },
                        { label: 'Déclarer un risque', icon: <ShieldAlert />, onSelect: () => setRisqueOuvert(true) },
                        { label: 'Ajouter une ligne de budget', icon: <Plus />, onSelect: () => setLigneOuverte(true) },
                      ]
                }
                trigger={({ toggle, open, ref }) => (
                  <Button ref={ref} variant="icon" label="Autres actions" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                    <span aria-hidden className="text-lg leading-none">⋯</span>
                  </Button>
                )}
              />
            </>
          }
        />
      }
    >
      <ProjetsNav />

      {lectureSeule && (
        <Alert tone="neutral" titre="Projet clôturé — lecture seule">
          Clôturé le {p.clotureLe ? formatDateLong(p.clotureLe) : '—'}. Les tâches, le budget et les jalons sont figés.
          {p.bilanCloture && (
            <>
              <br />
              <strong>Bilan : </strong>
              {p.bilanCloture}
            </>
          )}
        </Alert>
      )}

      {!lectureSeule && b.depasse && (
        <Alert
          tone="danger"
          titre={`Budget dépassé de ${formatMoney(b.ecart)}`}
          action={<Button size="sm" onClick={() => changerOnglet('budget')}>Voir le budget</Button>}
        >
          Les dépenses engagées atteignent {formatMoney(b.depensesRealisees)} pour une enveloppe de{' '}
          {formatMoney(b.depensesPrevues)}. Arbitrez les postes restants ou demandez un budget rectificatif.
        </Alert>
      )}

      {!lectureSeule && tachesProjet.length === 0 && (
        <Alert
          tone="warning"
          titre="Aucune tâche rattachée à ce projet"
          action={<Button size="sm" onClick={() => navigate('/taches/nouvelle')} iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}>Créer une tâche</Button>}
        >
          Sans tâche, le planning et l'avancement restent vides. Découpez le projet en tâches pour le rendre pilotable.
        </Alert>
      )}

      <Tabs items={onglets} value={onglet} onChange={changerOnglet} ariaLabel="Sections du projet" className="ac-scroll overflow-x-auto" />

      <div role="tabpanel" aria-label={onglets.find((o) => o.id === onglet)?.label} className="flex flex-col gap-4">
        {/* ---------------- Vue générale ---------------- */}
        {onglet === 'general' && (
          <>
            <section aria-label="Indicateurs du projet" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Avancement des tâches" value={String(avancementTaches)} unit="%" hint={`${tachesTerminees} sur ${tachesProjet.length} terminée(s)`} />
              <KpiCard label="Temps écoulé" value={String(temps)} unit="%" hint={lectureSeule ? 'Projet clos' : jours >= 0 ? `${jours} jours restants` : `${-jours} jours de dépassement`} />
              <KpiCard label="Budget consommé" value={String(b.consomme)} unit="%" hint={`${formatMoney(b.depensesRealisees)} sur ${formatMoney(b.depensesPrevues)}`} />
              <KpiCard
                label="Résultat prévisionnel"
                value={formatMoney(b.resultatPrevu)}
                trend={{ direction: b.resultatPrevu >= 0 ? 'up' : 'down', value: b.resultatPrevu >= 0 ? 'excédent' : 'déficit', description: 'recettes moins dépenses' }}
              />
            </section>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <Card>
                <CardHeader title="Objectif" description="La référence qui servira au bilan de clôture." />
                <CardBody>
                  <p className="text-[0.8125rem] leading-relaxed text-ink-800">{p.objectif}</p>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Informations" />
                <CardBody className="py-0">
                  <dl>
                    <Ligne label="Code">{p.code}</Ligne>
                    <Ligne label="Statut">{statutProjetLabels[p.statut]}</Ligne>
                    <Ligne label="Responsable">{p.responsable}</Ligne>
                    <Ligne label="Début">{formatDate(p.dateDebut)}</Ligne>
                    <Ligne label="Fin prévue">{formatDate(p.dateFin)}</Ligne>
                    <Ligne label="Équipe">{p.equipe.length} personne(s)</Ligne>
                  </dl>
                </CardBody>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="Prochains jalons" action={<Button size="sm" onClick={() => changerOnglet('jalons')}>Tous les jalons</Button>} />
                {p.jalons.filter((j) => j.statut === 'a_venir').length === 0 ? (
                  <EmptyState icon={<Flag />} title="Aucun jalon à venir" description="Tous les jalons ont été traités." compact />
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {p.jalons.filter((j) => j.statut === 'a_venir').slice(0, 4).map((j) => (
                      <li key={j.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{j.nom}</span>
                          <span className="ac-num block text-xs text-ink-500">{formatDate(j.date)} · {j.livrable}</span>
                        </span>
                        <StatusBadge status={cleJalon[j.statut]} />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <CardHeader title="Risques ouverts" action={<Button size="sm" onClick={() => changerOnglet('risques')}>Tous les risques</Button>} />
                {p.risques.filter((r) => r.statut === 'ouvert').length === 0 ? (
                  <EmptyState icon={<ShieldAlert />} title="Aucun risque ouvert" description="Les risques identifiés sont maîtrisés ou clos." compact />
                ) : (
                  <ul className="divide-y divide-ink-100">
                    {p.risques.filter((r) => r.statut === 'ouvert').slice(0, 4).map((r) => (
                      <li key={r.id} className="flex items-center gap-3 px-5 py-2.5">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{r.libelle}</span>
                          <span className="block truncate text-xs text-ink-500">{r.responsable}</span>
                        </span>
                        <Badge variant="outline">{niveauRisque(r) === 'eleve' ? 'Élevé' : niveauRisque(r) === 'moyen' ? 'Moyen' : 'Faible'}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}

        {/* ---------------- Tâches ---------------- */}
        {onglet === 'taches' && (
          <Card>
            <CardHeader
              title="Tâches du projet"
              description={`${tachesProjet.length} tâche(s), dont ${tachesTerminees} terminée(s).`}
              action={
                <Button size="sm" onClick={() => navigate('/taches/nouvelle')} iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}>
                  Nouvelle tâche
                </Button>
              }
            />
            {tachesProjet.length === 0 ? (
              <EmptyState
                icon={<ListChecks />}
                title="Ce projet n'a aucune tâche"
                description="Découpez le projet en tâches pour suivre son avancement et remplir le planning."
                compact
                action={<Button variant="primary" onClick={() => navigate('/taches/nouvelle')}>Créer la première tâche</Button>}
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {tachesProjet.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/taches/${t.id}`)}
                      className="flex w-full flex-wrap items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                    >
                      <Avatar name={t.responsable} size="xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{t.titre}</span>
                        <span className="ac-num block truncate text-xs text-ink-500">
                          {t.reference} · {t.responsable} · échéance {formatDate(t.echeance)}
                        </span>
                      </span>
                      <BadgeStatut statut={t.statut} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {/* ---------------- Planning ---------------- */}
        {onglet === 'planning' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SelecteurVue vue={vuePlanning} onChange={(v) => { setVuePlanning(v); setGantt(false) }} />
                <Button
                  size="sm"
                  aria-pressed={gantt}
                  onClick={() => setGantt(true)}
                  className={gantt ? 'border-brand-300 bg-brand-50 text-brand-700' : undefined}
                >
                  Gantt
                </Button>
              </div>
              <p className="text-[0.8125rem] text-ink-500">{tachesProjet.length} tâche(s) sur la période du projet.</p>
            </div>

            {gantt ? (
              <Card>
                <CardHeader title="Diagramme de Gantt" description="Une barre par tâche, les jalons en repères verticaux." />
                <CardBody>
                  <Gantt projet={p} taches={tachesProjet} />
                </CardBody>
              </Card>
            ) : vuePlanning === 'kanban' ? (
              <VueKanban
                taches={tachesProjet}
                onDeplacer={(tid, statut: StatutTache) =>
                  lectureSeule
                    ? toast({ titre: 'Projet clôturé', detail: 'Les tâches sont figées.', tone: 'warning' })
                    : void executer(() => changerStatutTache(tid, statut), { titre: 'Tâche déplacée', detail: 'Le statut a été mis à jour.' })
                }
                onCreer={() => navigate('/taches/nouvelle')}
              />
            ) : vuePlanning === 'calendrier' ? (
              <VueCalendrier taches={tachesProjet} reference={AUJOURDHUI_TACHE} />
            ) : (
              <Card>
                <ul className="divide-y divide-ink-100">
                  {tachesProjet.map((t) => (
                    <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                      <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-ink-900">{t.titre}</span>
                      <span className="ac-num text-xs text-ink-500">
                        {formatDate(t.dateDebut)} → {formatDate(t.echeance)}
                      </span>
                      <BadgeStatut statut={t.statut} />
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </>
        )}

        {/* ---------------- Budget ---------------- */}
        {onglet === 'budget' && (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Dépenses prévues" value={formatMoney(b.depensesPrevues)} hint="Enveloppe votée" />
              <KpiCard label="Dépenses engagées" value={formatMoney(b.depensesRealisees)} hint={`${b.consomme} % de l'enveloppe`} />
              <KpiCard label="Recettes encaissées" value={formatMoney(b.recettesRealisees)} hint={`sur ${formatMoney(b.recettesPrevues)} prévues`} />
              <KpiCard
                label="Résultat réalisé"
                value={formatMoney(b.resultatRealise)}
                trend={{ direction: b.resultatRealise >= 0 ? 'up' : 'down', value: b.resultatRealise >= 0 ? 'excédent' : 'déficit', description: 'à date' }}
              />
            </section>

            {b.depasse && (
              <Alert tone="danger" titre={`Enveloppe dépassée de ${formatMoney(b.ecart)}`}>
                Le dépassement est concentré sur les postes dont le réalisé excède le prévu, signalés en rouge dans le
                tableau ci-dessous.
              </Alert>
            )}

            <Card>
              <CardHeader title="Prévu et réalisé par poste" />
              <CardBody>
                <GroupedBars
                  titre="Comparaison du budget prévu et réalisé par poste"
                  colonneLabel="Poste"
                  formatValeur={(v) => formatMoney(v)}
                  data={p.budget.map((l) => ({ label: l.poste.slice(0, 12), prevu: l.prevu, realise: l.realise }))}
                  series={[
                    { key: 'prevu', label: 'Prévu', couleur: '#8DB5DE', motif: true },
                    { key: 'realise', label: 'Réalisé', couleur: '#2364AA' },
                  ]}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Détail du budget"
                description={`${p.budget.length} ligne(s).`}
                action={
                  !lectureSeule ? (
                    <Button size="sm" onClick={() => setLigneOuverte(true)} iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}>
                      Ajouter une ligne
                    </Button>
                  ) : undefined
                }
              />
              <div className="ac-scroll overflow-x-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">Budget du projet {p.nom}</caption>
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-25">
                      {['Poste', 'Sens', 'Compte', 'Prévu', 'Réalisé', 'Écart', 'Consommé'].map((h, i) => (
                        <th key={h} scope="col" className={cn('px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500', i >= 3 && 'text-right')}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {p.budget.map((l) => {
                      const ecart = Math.round((l.realise - l.prevu) * 100) / 100
                      const pct = l.prevu === 0 ? 0 : Math.round((l.realise / l.prevu) * 100)
                      const defavorable = l.sens === 'depense' ? ecart > 0 : ecart < 0
                      return (
                        <tr key={l.id}>
                          <td className="px-4 py-2 text-[0.8125rem] font-medium text-ink-900">{l.poste}</td>
                          <td className="px-4 py-2">
                            <Badge variant="outline">{l.sens === 'depense' ? 'Dépense' : 'Recette'}</Badge>
                          </td>
                          <td className="ac-num px-4 py-2 text-xs text-ink-500">{l.compteComptable}</td>
                          <td className="ac-num px-4 py-2 text-right text-[0.8125rem]">{formatMoney(l.prevu)}</td>
                          <td className="ac-num px-4 py-2 text-right text-[0.8125rem] font-medium text-ink-900">{formatMoney(l.realise)}</td>
                          <td className={cn('ac-num px-4 py-2 text-right text-[0.8125rem] font-medium', defavorable ? 'text-danger-600' : 'text-success-600')}>
                            {ecart > 0 ? '+' : ''}
                            {formatMoney(ecart)}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <span className="inline-flex items-center gap-2">
                              <span aria-hidden className="h-1.5 w-14 overflow-hidden rounded-full bg-ink-100">
                                <span className={cn('block h-full rounded-full', defavorable ? 'bg-danger-500' : 'bg-success-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </span>
                              <span className="ac-num w-10 text-right text-[0.8125rem] text-ink-700">{pct} %</span>
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

        {/* ---------------- Équipe ---------------- */}
        {onglet === 'equipe' && (
          <Card>
            <CardHeader title="Équipe projet" description={`${p.equipe.length} personne(s). La charge est exprimée en pourcentage du temps consacré au projet.`} />
            <ul className="divide-y divide-ink-100">
              {p.equipe.map((m) => {
                const sesTaches = tachesProjet.filter((t) => t.responsable === m.nom)
                return (
                  <li key={m.nom} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <Avatar name={m.nom} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] font-medium text-ink-900">
                        {m.nom}
                        {m.nom === p.responsable && <Badge variant="brand" className="ml-2">Responsable</Badge>}
                      </p>
                      <p className="text-xs text-ink-500">{m.role}</p>
                    </div>
                    <Badge variant="outline">{sesTaches.length} tâche(s)</Badge>
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-100">
                        <span className="block h-full rounded-full bg-brand-500" style={{ width: `${m.charge}%` }} />
                      </span>
                      <span className="ac-num w-10 text-right text-[0.8125rem] text-ink-700">{m.charge} %</span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        {/* ---------------- Documents ---------------- */}
        {onglet === 'documents' && (
          <Card>
            <CardHeader
              title="Documents du projet"
              description="Rattachés depuis l'espace documentaire."
              action={<Button size="sm" onClick={() => navigate('/documents/explorateur')}>Ouvrir l'explorateur</Button>}
            />
            {p.documents.length === 0 ? (
              <EmptyState
                icon={<FileText />}
                title="Aucun document rattaché"
                description="Déposez les conventions, plans et comptes rendus dans l'espace documentaire, puis rattachez-les au projet."
                compact
                action={<Button variant="primary" onClick={() => navigate('/documents/explorateur')}>Ouvrir l'explorateur</Button>}
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {p.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
                      <FileText className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{d.nom}</span>
                      <span className="ac-num block text-xs text-ink-500">Ajouté le {formatDate(d.ajouteLe)}</span>
                    </span>
                    <Badge variant="outline">{d.categorie}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {/* ---------------- Activité ---------------- */}
        {onglet === 'activite' && (
          <Card>
            <CardHeader title="Activité" description="Toutes les actions consignées sur le projet, de la plus récente à la plus ancienne." />
            <CardBody>
              <Timeline evenements={p.activite} />
            </CardBody>
          </Card>
        )}

        {/* ---------------- Indicateurs ---------------- */}
        {onglet === 'indicateurs' && (
          <Card>
            <CardHeader title="Indicateurs" description="Ce que le projet cherche à atteindre, et où il en est." />
            {p.indicateurs.length === 0 ? (
              <EmptyState icon={<Target />} title="Aucun indicateur défini" description="Un indicateur mesurable rend le bilan de clôture vérifiable." compact />
            ) : (
              <CardBody className="grid gap-3 sm:grid-cols-2">
                {p.indicateurs.map((ind) => {
                  const pct = ind.cible === 0 ? 0 : Math.round((ind.valeur / ind.cible) * 100)
                  const atteint = ind.sens === 'haut' ? ind.valeur >= ind.cible : ind.valeur <= ind.cible
                  return (
                    <div key={ind.id} className="rounded-lg border border-ink-200 p-3">
                      <p className="text-[0.8125rem] font-medium text-ink-900">{ind.libelle}</p>
                      <p className="ac-num mt-1.5 font-display text-xl font-semibold text-ink-950">
                        {ind.valeur}
                        <span className="ml-1 text-sm font-medium text-ink-500">{ind.unite}</span>
                        <span className="ml-2 text-[0.8125rem] font-normal text-ink-500">cible {ind.cible}</span>
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span aria-hidden className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
                          <span className={cn('block h-full rounded-full', atteint ? 'bg-success-500' : 'bg-warning-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </span>
                        <span className={cn('ac-num text-xs font-medium', atteint ? 'text-success-600' : 'text-warning-600')}>
                          {atteint ? 'Atteint' : `${pct} %`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </CardBody>
            )}
          </Card>
        )}

        {/* ---------------- Risques ---------------- */}
        {onglet === 'risques' && (
          <Card>
            <CardHeader
              title="Risques"
              description="Probabilité et impact notés de 1 à 3. Le produit des deux donne le niveau."
              action={
                !lectureSeule ? (
                  <Button size="sm" onClick={() => setRisqueOuvert(true)} iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}>
                    Déclarer un risque
                  </Button>
                ) : undefined
              }
            />
            {p.risques.length === 0 ? (
              <EmptyState icon={<ShieldAlert />} title="Aucun risque déclaré" description="Identifier les risques tôt permet de préparer les parades avant d'en avoir besoin." compact />
            ) : (
              <ul className="divide-y divide-ink-100">
                {[...p.risques].sort((a, r) => scoreRisque(r) - scoreRisque(a)).map((r) => {
                  const n = niveauRisque(r)
                  return (
                    <li key={r.id} className="flex flex-col gap-2 px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          aria-hidden
                          className={cn(
                            'ac-num flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white',
                            n === 'eleve' ? 'bg-danger-500' : n === 'moyen' ? 'bg-warning-500' : 'bg-ink-400',
                          )}
                        >
                          {scoreRisque(r)}
                        </span>
                        <span className="min-w-0 flex-1 text-[0.8125rem] font-medium text-ink-900">{r.libelle}</span>
                        <Badge variant="outline">
                          Probabilité {r.probabilite} · impact {r.impact}
                        </Badge>
                        <StatusBadge status={cleRisque[r.statut]} />
                        {!lectureSeule && r.statut !== 'clos' && (
                          <Select
                            aria-label={`Statut du risque : ${r.libelle}`}
                            value={r.statut}
                            className="h-8 w-36 text-[0.8125rem]"
                            onChange={(e) => void executer(() => changerStatutRisque(p.id, r.id, e.target.value as Risque['statut']), { titre: 'Risque mis à jour', detail: r.libelle })}
                            options={[
                              { value: 'ouvert', label: 'Ouvert' },
                              { value: 'maitrise', label: 'Maîtrisé' },
                              { value: 'clos', label: 'Clos' },
                            ]}
                          />
                        )}
                      </div>
                      <p className="pl-10 text-xs leading-relaxed text-ink-500">
                        <strong className="font-medium text-ink-700">Parade : </strong>
                        {r.parade} — suivi par {r.responsable}.
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        )}

        {/* ---------------- Jalons ---------------- */}
        {onglet === 'jalons' && (
          <Card>
            <CardHeader
              title="Jalons"
              description={`${p.jalons.length} jalon(s), dont ${jalonsOuverts} encore à venir.`}
              action={
                !lectureSeule ? (
                  <Button size="sm" onClick={() => setJalonOuvert(true)} iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}>
                    Ajouter un jalon
                  </Button>
                ) : undefined
              }
            />
            {p.jalons.length === 0 ? (
              <EmptyState icon={<Flag />} title="Aucun jalon" description="Un jalon marque une étape vérifiable, avec une date et un livrable." compact />
            ) : (
              <ul className="divide-y divide-ink-100">
                {p.jalons.map((j) => (
                  <li key={j.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <span
                      aria-hidden
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                        j.statut === 'atteint' && 'border-success-100 bg-success-50 text-success-600',
                        j.statut === 'manque' && 'border-danger-100 bg-danger-50 text-danger-600',
                        j.statut === 'a_venir' && 'border-warning-100 bg-warning-50 text-warning-600',
                      )}
                    >
                      <Flag className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] font-medium text-ink-900">{j.nom}</p>
                      <p className="text-xs leading-relaxed text-ink-500">{j.description}</p>
                      <p className="ac-num mt-0.5 text-2xs text-ink-500">
                        {formatDate(j.date)} · livrable : {j.livrable}
                      </p>
                    </div>
                    <StatusBadge status={cleJalon[j.statut]} />
                    {!lectureSeule && j.statut === 'a_venir' && (
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => void executer(() => changerStatutJalon(p.id, j.id, 'atteint'), { titre: 'Jalon atteint', detail: j.nom })}
                          iconLeft={<CheckCircle2 aria-hidden className="h-3.5 w-3.5" />}
                        >
                          Atteint
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger-600"
                          onClick={() => void executer(() => changerStatutJalon(p.id, j.id, 'manque'), { titre: 'Jalon manqué', detail: j.nom })}
                        >
                          Manqué
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>

      {/* Clôture — action sensible */}
      <Modal
        open={clotureOuverte}
        onClose={() => { setClotureOuverte(false); setConfirmeLu(false) }}
        size="lg"
        title={`Clôturer le projet ${p.code} ?`}
        description="La clôture est définitive : le projet passe en lecture seule et ne peut plus être rouvert."
        footer={
          <>
            <Button variant="ghost" onClick={() => { setClotureOuverte(false); setConfirmeLu(false) }} disabled={enCours}>
              Annuler
            </Button>
            <Button
              variant="danger"
              loading={enCours}
              disabled={!confirmeLu || !bilan.trim() || jalonsOuverts > 0}
              onClick={() => {
                const texte = bilan
                setClotureOuverte(false)
                setConfirmeLu(false)
                void executer(() => cloturer(p.id, texte), {
                  titre: `Projet ${p.code} clôturé`,
                  detail: 'Il passe en lecture seule et rejoint les projets clos.',
                })
              }}
            >
              Clôturer définitivement
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          {jalonsOuverts > 0 && (
            <Alert tone="warning" titre={`${jalonsOuverts} jalon(s) encore à venir`}>
              Marquez chaque jalon comme atteint ou manqué avant de clôturer. Un projet clos avec des jalons en suspens
              ne dit rien de ce qui a réellement été fait.
            </Alert>
          )}

          <div className="rounded-lg border border-ink-200 bg-ink-25 p-3 text-[0.8125rem] text-ink-700">
            <p className="flex items-center gap-2 font-semibold text-ink-900">
              <Target aria-hidden className="h-4 w-4 text-brand-500" />
              Bilan chiffré
            </p>
            <p className="ac-num mt-1.5">
              Dépenses {formatMoney(b.depensesRealisees)} sur {formatMoney(b.depensesPrevues)} · recettes{' '}
              {formatMoney(b.recettesRealisees)} sur {formatMoney(b.recettesPrevues)} ·{' '}
              <strong>{b.resultatRealise >= 0 ? 'excédent' : 'déficit'} de {formatMoney(Math.abs(b.resultatRealise))}</strong>
            </p>
            <p className="ac-num mt-1">
              {tachesTerminees} tâche(s) terminée(s) sur {tachesProjet.length} · {p.jalons.filter((j) => j.statut === 'atteint').length} jalon(s)
              atteint(s), {p.jalons.filter((j) => j.statut === 'manque').length} manqué(s)
            </p>
          </div>

          <div className="rounded-lg border border-danger-100 bg-danger-50 p-3 text-[0.8125rem] text-danger-700">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle aria-hidden className="h-4 w-4" />
              Aucun retour en arrière
            </p>
            <p className="mt-1">
              Après clôture, le budget, les tâches, les jalons et les risques du projet sont figés. Les risques ouverts
              sont automatiquement clos. Une action oubliée devra être reprise dans un nouveau projet.
            </p>
          </div>

          <Field
            label="Bilan de clôture"
            required
            hint="Ce que le projet a atteint au regard de son objectif, et ce qu’il faudra corriger la prochaine fois."
          >
            {(pr) => (
              <Textarea
                {...pr}
                rows={4}
                value={bilan}
                onChange={(e) => setBilan(e.target.value)}
                placeholder="Objectif de fréquentation dépassé de 9 %. Budget en excédent de 740 €. À corriger : anticiper la commande du matériel scénique."
              />
            )}
          </Field>
          {!bilan.trim() && <p className="text-xs font-medium text-warning-600">Le bilan est obligatoire.</p>}

          <Checkbox
            checked={confirmeLu}
            onChange={(e) => setConfirmeLu(e.target.checked)}
            label="J’ai vérifié le bilan et je comprends que la clôture est irréversible"
            description="Cette case doit être cochée pour poursuivre."
          />
        </div>
      </Modal>

      {/* Ajout de jalon */}
      <Modal
        open={jalonOuvert}
        onClose={() => setJalonOuvert(false)}
        title="Ajouter un jalon"
        description="Un jalon marque une étape vérifiable, avec une date et un livrable attendu."
        footer={
          <>
            <Button variant="ghost" onClick={() => setJalonOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nouveauJalon.nom.trim() || !nouveauJalon.date}
              onClick={() =>
                void executer(
                  () => ajouterJalon(p.id, { ...nouveauJalon, date: new Date(nouveauJalon.date).toISOString(), statut: 'a_venir' as Jalon['statut'] }),
                  { titre: 'Jalon ajouté', detail: nouveauJalon.nom },
                  () => { setJalonOuvert(false); setNouveauJalon({ nom: '', description: '', date: new Date().toISOString().slice(0, 10), livrable: '' }) },
                )
              }
            >
              Ajouter
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Nom du jalon" required className="sm:col-span-2">
            {(pr) => <Input {...pr} value={nouveauJalon.nom} onChange={(e) => setNouveauJalon((s) => ({ ...s, nom: e.target.value }))} placeholder="Programmation arrêtée" />}
          </Field>
          <Field label="Date attendue" required>
            {(pr) => <Input {...pr} type="date" value={nouveauJalon.date} onChange={(e) => setNouveauJalon((s) => ({ ...s, date: e.target.value }))} />}
          </Field>
          <Field label="Livrable" hint="Ce qui prouve que le jalon est atteint.">
            {(pr) => <Input {...pr} value={nouveauJalon.livrable} onChange={(e) => setNouveauJalon((s) => ({ ...s, livrable: e.target.value }))} placeholder="Programme définitif" />}
          </Field>
          <Field label="Description" className="sm:col-span-2">
            {(pr) => <Textarea {...pr} rows={2} value={nouveauJalon.description} onChange={(e) => setNouveauJalon((s) => ({ ...s, description: e.target.value }))} />}
          </Field>
        </div>
      </Modal>

      {/* Déclaration de risque */}
      <Modal
        open={risqueOuvert}
        onClose={() => setRisqueOuvert(false)}
        title="Déclarer un risque"
        description="Probabilité et impact notés de 1 à 3. Le produit détermine le niveau de vigilance."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRisqueOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nouveauRisque.libelle.trim() || !nouveauRisque.parade.trim()}
              onClick={() =>
                void executer(
                  () =>
                    ajouterRisque(p.id, {
                      libelle: nouveauRisque.libelle.trim(),
                      probabilite: nouveauRisque.probabilite as 1 | 2 | 3,
                      impact: nouveauRisque.impact as 1 | 2 | 3,
                      parade: nouveauRisque.parade.trim(),
                      responsable: nouveauRisque.responsable,
                      statut: 'ouvert',
                    }),
                  { titre: 'Risque déclaré', detail: nouveauRisque.libelle },
                  () => { setRisqueOuvert(false); setNouveauRisque({ libelle: '', probabilite: 2, impact: 2, parade: '', responsable: equipe[0].nom }) },
                )
              }
            >
              Déclarer
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Risque identifié" required className="sm:col-span-2">
            {(pr) => <Input {...pr} value={nouveauRisque.libelle} onChange={(e) => setNouveauRisque((s) => ({ ...s, libelle: e.target.value }))} placeholder="Billetterie inférieure aux prévisions" />}
          </Field>
          <Field label="Probabilité" required>
            {(pr) => (
              <Select
                {...pr}
                value={String(nouveauRisque.probabilite)}
                onChange={(e) => setNouveauRisque((s) => ({ ...s, probabilite: Number(e.target.value) }))}
                options={[
                  { value: '1', label: '1 — faible' },
                  { value: '2', label: '2 — moyenne' },
                  { value: '3', label: '3 — élevée' },
                ]}
              />
            )}
          </Field>
          <Field label="Impact" required>
            {(pr) => (
              <Select
                {...pr}
                value={String(nouveauRisque.impact)}
                onChange={(e) => setNouveauRisque((s) => ({ ...s, impact: Number(e.target.value) }))}
                options={[
                  { value: '1', label: '1 — mineur' },
                  { value: '2', label: '2 — sérieux' },
                  { value: '3', label: '3 — majeur' },
                ]}
              />
            )}
          </Field>
          <Field label="Parade" required className="sm:col-span-2" hint="Ce qui est prévu si le risque se réalise.">
            {(pr) => <Textarea {...pr} rows={2} value={nouveauRisque.parade} onChange={(e) => setNouveauRisque((s) => ({ ...s, parade: e.target.value }))} />}
          </Field>
          <Field label="Responsable du suivi" required className="sm:col-span-2">
            {(pr) => (
              <Select {...pr} value={nouveauRisque.responsable} onChange={(e) => setNouveauRisque((s) => ({ ...s, responsable: e.target.value }))} options={equipe.map((m) => ({ value: m.nom, label: m.nom }))} />
            )}
          </Field>
        </div>
      </Modal>

      {/* Ligne budgétaire */}
      <Modal
        open={ligneOuverte}
        onClose={() => setLigneOuverte(false)}
        title="Ajouter une ligne de budget"
        footer={
          <>
            <Button variant="ghost" onClick={() => setLigneOuverte(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!nouvelleLigne.poste.trim() || !Number(nouvelleLigne.prevu)}
              onClick={() =>
                void executer(
                  () =>
                    ajouterLigneBudget(p.id, {
                      poste: nouvelleLigne.poste.trim(),
                      sens: nouvelleLigne.sens,
                      prevu: Number(nouvelleLigne.prevu) || 0,
                      realise: Number(nouvelleLigne.realise) || 0,
                      compteComptable: nouvelleLigne.compteComptable.trim() || '658000',
                    }),
                  { titre: 'Ligne ajoutée', detail: nouvelleLigne.poste },
                  () => { setLigneOuverte(false); setNouvelleLigne({ poste: '', sens: 'depense', prevu: '', realise: '', compteComptable: '' }) },
                )
              }
            >
              Ajouter
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Poste" required className="sm:col-span-2">
            {(pr) => <Input {...pr} value={nouvelleLigne.poste} onChange={(e) => setNouvelleLigne((s) => ({ ...s, poste: e.target.value }))} placeholder="Location de matériel" />}
          </Field>
          <Field label="Sens" required>
            {(pr) => (
              <Select
                {...pr}
                value={nouvelleLigne.sens}
                onChange={(e) => setNouvelleLigne((s) => ({ ...s, sens: e.target.value as 'depense' | 'recette' }))}
                options={[
                  { value: 'depense', label: 'Dépense' },
                  { value: 'recette', label: 'Recette' },
                ]}
              />
            )}
          </Field>
          <Field label="Compte comptable" hint="Rattachement au plan comptable.">
            {(pr) => <Input {...pr} value={nouvelleLigne.compteComptable} onChange={(e) => setNouvelleLigne((s) => ({ ...s, compteComptable: e.target.value }))} placeholder="613000" />}
          </Field>
          <Field label="Prévu" required>
            {(pr) => <Input {...pr} type="number" min={0} suffix="€" value={nouvelleLigne.prevu} onChange={(e) => setNouvelleLigne((s) => ({ ...s, prevu: e.target.value }))} />}
          </Field>
          <Field label="Déjà réalisé">
            {(pr) => <Input {...pr} type="number" min={0} suffix="€" value={nouvelleLigne.realise} onChange={(e) => setNouvelleLigne((s) => ({ ...s, realise: e.target.value }))} />}
          </Field>
        </div>
      </Modal>

      <span className="sr-only" aria-live="polite">{enregistrement ? 'Enregistrement en cours' : ''}</span>
    </Page>
  )
}
