import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarOff, CheckCircle2, Plus, Trash2, UserCheck } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Status'
import { PlanningNav, PlanningOutils, cleAffectation } from '@/components/planning/PlanningNav'
import { usePlanning } from '@/context/PlanningContext'
import { useToast } from '@/context/ToastContext'
import {
  AUJOURDHUI_PLANNING,
  NOMS_JOURS_PLANNING,
  cleJour,
  conflitLabels,
  creneaux,
  libelleCreneau,
  motifAbsenceLabels,
  personnesPlanning,
  postes,
  tousLesConflits,
  type MotifAbsence,
} from '@/lib/planning'
import { formatDate } from '@/lib/utils'

/* --------------------------- Disponibilités --------------------------- */

export function DisponibilitesPlanning() {
  const { disponibilites, basculerDisponibilite, chargement } = usePlanning()
  const { toast } = useToast()
  const [personneId, setPersonneId] = useState(personnesPlanning[0].id)

  const dispo = disponibilites.find((d) => d.personneId === personneId)
  const personne = personnesPlanning.find((p) => p.id === personneId)
  const ouverts = dispo?.ouverts.length ?? 0

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Planning"
          title="Disponibilités déclarées"
          description="Chaque personne déclare les créneaux sur lesquels elle accepte d'être affectée. Une affectation hors de ces cases est signalée, sans être interdite."
          meta={<Badge variant="brand">{ouverts} créneau(x) ouverts</Badge>}
          actions={<PlanningOutils />}
        />
      }
    >
      <PlanningNav />

      <Card>
        <CardHeader
          title="Personne"
          action={
            <Select
              aria-label="Personne dont on modifie les disponibilités"
              value={personneId}
              onChange={(e) => setPersonneId(e.target.value)}
              className="h-8 w-60 text-[0.8125rem]"
              options={personnesPlanning.map((p) => ({ value: p.id, label: p.nom }))}
            />
          }
        />
        <CardBody>
          <p className="text-[0.8125rem] text-ink-600">
            {personne?.role} · compétences : {personne?.competences.join(', ')} · quota visé {personne?.quotaHebdo} h par semaine.
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Grille de disponibilité" description="Cochez les cases où la personne accepte d'être affectée, semaine type." />
        <CardBody>
          <div className="ac-scroll overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse">
              <caption className="sr-only">Disponibilités hebdomadaires de {personne?.nom}</caption>
              <thead>
                <tr>
                  <th scope="col" className="w-32 border-b border-ink-100 px-2 py-2 text-left text-2xs font-semibold uppercase tracking-wide text-ink-500">
                    Créneau
                  </th>
                  {NOMS_JOURS_PLANNING.map((j) => (
                    <th key={j} scope="col" className="border-b border-l border-ink-100 px-2 py-2 text-center text-2xs font-semibold uppercase tracking-wide text-ink-500">
                      {j.slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creneaux.map((c) => (
                  <tr key={c.id}>
                    <th scope="row" className="border-b border-ink-100 px-2 py-2 text-left">
                      <span className="block text-[0.8125rem] font-medium text-ink-900">{c.nom}</span>
                      <span className="ac-num block text-2xs text-ink-500">
                        {String(c.heureDebut).padStart(2, '0')}h – {String(c.heureFin).padStart(2, '0')}h
                      </span>
                    </th>
                    {NOMS_JOURS_PLANNING.map((nom, j) => {
                      const cle = `${j}:${c.id}`
                      const ouvert = dispo?.ouverts.includes(cle) ?? false
                      return (
                        <td key={cle} className="border-b border-l border-ink-100 p-1">
                          <button
                            type="button"
                            aria-pressed={ouvert}
                            aria-label={`${personne?.nom}, ${nom} ${c.nom} : ${ouvert ? 'disponible' : 'non disponible'}`}
                            onClick={() =>
                              void basculerDisponibilite(personneId, cle).catch((e) =>
                                toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' }),
                              )
                            }
                            className={cn(
                              'flex h-9 w-full items-center justify-center rounded text-2xs font-medium transition-colors',
                              ouvert ? 'bg-success-50 text-success-700 ring-1 ring-success-200 hover:bg-success-100' : 'bg-ink-50 text-ink-400 hover:bg-ink-100',
                            )}
                          >
                            {ouvert ? 'Libre' : '—'}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Vue d'ensemble" description="Nombre de créneaux ouverts par personne." />
        <CardBody className="grid gap-2 sm:grid-cols-2">
          {personnesPlanning.map((p) => {
            const d = disponibilites.find((x) => x.personneId === p.id)
            const n = d?.ouverts.length ?? 0
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersonneId(p.id)}
                className="flex items-center gap-3 rounded-lg border border-ink-200 p-2.5 text-left transition-colors hover:border-ink-300 hover:bg-ink-25"
              >
                <Avatar name={p.nom} size="xs" />
                <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-ink-900">{p.nom}</span>
                <Badge variant="outline">{n} créneau(x)</Badge>
              </button>
            )
          })}
        </CardBody>
      </Card>
      <span className="sr-only" aria-live="polite">{chargement ? 'Chargement' : ''}</span>
    </Page>
  )
}

/* ------------------------------- Absences ------------------------------ */

export function AbsencesPlanning() {
  const { toast } = useToast()
  const { absences, affectations, declarerAbsence, validerAbsence, supprimerAbsence } = usePlanning()
  const [ouverte, setOuverte] = useState(false)
  const [aSupprimer, setASupprimer] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [saisie, setSaisie] = useState({
    personneId: personnesPlanning[0].id,
    debut: cleJour(AUJOURDHUI_PLANNING),
    fin: cleJour(AUJOURDHUI_PLANNING),
    motif: 'conges' as MotifAbsence,
    commentaire: '',
  })

  const aujourdhui = cleJour(AUJOURDHUI_PLANNING)
  const enCoursAuj = absences.filter((a) => a.statut === 'validee' && a.debut <= aujourdhui && a.fin >= aujourdhui)
  const aValider = absences.filter((a) => a.statut === 'demandee')

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

  /** Affectations tombant pendant une absence : à repourvoir. */
  const impactees = (personneId: string, debut: string, fin: string) =>
    affectations.filter((a) => a.personneId === personneId && a.statut !== 'annulee' && a.jour >= debut && a.jour <= fin)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Planning"
          title="Absences"
          description="Congés, arrêts et indisponibilités. Une absence validée rend toute affectation sur la période conflictuelle."
          meta={<Badge variant="brand">{absences.length} absences</Badge>}
          actions={
            <>
              <PlanningOutils />
              <Button variant="primary" onClick={() => setOuverte(true)} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Déclarer une absence
              </Button>
            </>
          }
        />
      }
    >
      <PlanningNav />

      {aValider.length > 0 && (
        <Alert tone="warning" titre={`${aValider.length} demande(s) d'absence à valider`}>
          Tant qu'une absence n'est pas validée, elle n'empêche pas les affectations sur la période.
        </Alert>
      )}

      <section className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Absences en cours" value={String(enCoursAuj.length)} hint="À la date du jour" />
        <KpiCard label="À valider" value={String(aValider.length)} hint="Demandes en attente" />
        <KpiCard label="Enregistrées" value={String(absences.length)} hint="Toutes périodes confondues" />
      </section>

      {absences.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarOff />}
            title="Aucune absence déclarée"
            description="Déclarez congés, arrêts et indisponibilités pour que le planning cesse de proposer les personnes concernées."
            action={<Button variant="primary" onClick={() => setOuverte(true)}>Déclarer une absence</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Absences enregistrées" description="De la plus proche à la plus lointaine." />
          <ul className="divide-y divide-ink-100">
            {[...absences].sort((a, b) => (a.debut < b.debut ? -1 : 1)).map((a) => {
              const personne = personnesPlanning.find((p) => p.id === a.personneId)
              const touchees = a.statut === 'validee' ? impactees(a.personneId, a.debut, a.fin) : []
              return (
                <li key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <Avatar name={personne?.nom ?? ''} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.8125rem] font-medium text-ink-900">{personne?.nom}</p>
                    <p className="ac-num truncate text-xs text-ink-500">
                      Du {formatDate(a.debut)} au {formatDate(a.fin)} · {motifAbsenceLabels[a.motif]}
                    </p>
                    {a.commentaire && <p className="mt-0.5 truncate text-xs text-ink-500">{a.commentaire}</p>}
                    {touchees.length > 0 && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-warning-600">
                        <AlertTriangle aria-hidden className="h-3 w-3" />
                        {touchees.length} affectation(s) à repourvoir sur la période
                      </p>
                    )}
                  </div>
                  <StatusBadge status={a.statut === 'validee' ? 'absence_validee' : 'absence_demandee'} />
                  {a.statut === 'demandee' && (
                    <Button
                      size="sm"
                      loading={enCours}
                      onClick={() => void executer(() => validerAbsence(a.id), { titre: 'Absence validée', detail: `${personne?.nom} — ${motifAbsenceLabels[a.motif].toLowerCase()}.` })}
                      iconLeft={<CheckCircle2 aria-hidden className="h-3.5 w-3.5" />}
                    >
                      Valider
                    </Button>
                  )}
                  <Button variant="icon" size="sm" label={`Supprimer l’absence de ${personne?.nom}`} className="text-ink-500 hover:text-danger-600" onClick={() => setASupprimer(a.id)}>
                    <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <Modal
        open={ouverte}
        onClose={() => setOuverte(false)}
        title="Déclarer une absence"
        description="Une absence demandée n'a pas d'effet sur le planning tant qu'elle n'est pas validée."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOuverte(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              onClick={() =>
                void executer(
                  () => declarerAbsence({ ...saisie, statut: 'demandee' }),
                  { titre: 'Absence déclarée', detail: 'Elle attend une validation.' },
                  () => setOuverte(false),
                )
              }
            >
              Déclarer
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Personne" required className="sm:col-span-2">
            {(p) => (
              <Select {...p} value={saisie.personneId} onChange={(e) => setSaisie((s) => ({ ...s, personneId: e.target.value }))} options={personnesPlanning.map((x) => ({ value: x.id, label: x.nom }))} />
            )}
          </Field>
          <Field label="Période d’absence" required className="sm:col-span-2" hint="Du premier au dernier jour inclus.">
            {(p) => (
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  {...p}
                  type="date"
                  aria-label="Premier jour d’absence"
                  className="flex-1"
                  value={saisie.debut}
                  onChange={(e) => setSaisie((s) => ({ ...s, debut: e.target.value, fin: s.fin < e.target.value ? e.target.value : s.fin }))}
                />
                <span aria-hidden className="text-[0.8125rem] text-ink-500">au</span>
                <Input
                  type="date"
                  aria-label="Dernier jour d’absence"
                  className="flex-1"
                  min={saisie.debut}
                  value={saisie.fin}
                  onChange={(e) => setSaisie((s) => ({ ...s, fin: e.target.value }))}
                />
              </div>
            )}
          </Field>
          <Field label="Motif" required className="sm:col-span-2">
            {(p) => (
              <Select
                {...p}
                value={saisie.motif}
                onChange={(e) => setSaisie((s) => ({ ...s, motif: e.target.value as MotifAbsence }))}
                options={(Object.keys(motifAbsenceLabels) as MotifAbsence[]).map((m) => ({ value: m, label: motifAbsenceLabels[m] }))}
              />
            )}
          </Field>
          <Field label="Commentaire" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={2} value={saisie.commentaire} onChange={(e) => setSaisie((s) => ({ ...s, commentaire: e.target.value }))} />}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const id = aSupprimer!
          setASupprimer(null)
          void executer(() => supprimerAbsence(id), { titre: 'Absence supprimée', detail: 'Les affectations de la période redeviennent valides.' })
        }}
        title="Supprimer cette absence ?"
        description="Les affectations qui tombaient pendant la période cesseront d'être signalées en conflit."
        confirmLabel="Supprimer"
      />
    </Page>
  )
}

/* ------------------------------- Conflits ------------------------------ */

export function ConflitsPlanning() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { affectations, absences, disponibilites, retirer, demanderRemplacement } = usePlanning()
  const [enCours, setEnCours] = useState(false)

  const conflits = tousLesConflits(affectations, absences, disponibilites)
  const parAffectation = new Map<string, typeof conflits>()
  for (const c of conflits) {
    const liste = parAffectation.get(c.affectation.id) ?? []
    liste.push(c)
    parAffectation.set(c.affectation.id, liste)
  }

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

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Planning"
          title="Conflits d'affectation"
          description="Double affectation, personne absente, créneau hors disponibilités, compétence manquante ou ressource déjà prise."
          meta={<Badge variant="brand">{parAffectation.size} affectation(s) concernées</Badge>}
          actions={<PlanningOutils />}
        />
      }
    >
      <PlanningNav />

      {parAffectation.size === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 />}
            title="Aucun conflit"
            description="Toutes les affectations respectent les absences, les disponibilités déclarées et les compétences attendues."
            action={<Button variant="primary" onClick={() => navigate('/planning')}>Retour au planning</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Affectations à corriger" description="Un même créneau peut cumuler plusieurs motifs." />
          <ul className="divide-y divide-ink-100">
            {Array.from(parAffectation.entries()).map(([id, liste]) => {
              const a = liste[0].affectation
              const personne = personnesPlanning.find((p) => p.id === a.personneId)
              const poste = postes.find((p) => p.id === a.posteId)
              return (
                <li key={id} className="flex flex-col gap-2 px-5 py-3.5">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={personne?.nom ?? ''} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] font-medium text-ink-900">
                        {personne?.nom} · {poste?.nom}
                      </p>
                      <p className="ac-num truncate text-xs text-ink-500">
                        {formatDate(a.jour)} · {libelleCreneau(a.creneauId)}
                      </p>
                    </div>
                    <StatusBadge status={cleAffectation[a.statut]} />
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={enCours}
                      onClick={() =>
                        void executer(() => demanderRemplacement(a.id, `Conflit détecté : ${liste[0].detail}`), {
                          titre: 'Remplacement demandé',
                          detail: 'Le créneau apparaît dans les remplacements à pourvoir.',
                        })
                      }
                    >
                      Demander un remplacement
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-danger-600"
                      loading={enCours}
                      onClick={() => void executer(() => retirer(a.id), { titre: 'Affectation retirée', detail: 'Le conflit est levé.' })}
                    >
                      Retirer
                    </Button>
                  </div>
                  <ul className="ml-11 flex flex-col gap-1">
                    {liste.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-ink-600">
                        <AlertTriangle aria-hidden className="mt-0.5 h-3 w-3 shrink-0 text-danger-600" />
                        <span>
                          <span className="font-medium text-ink-800">{conflitLabels[c.type]} — </span>
                          {c.detail}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </Page>
  )
}

/* ----------------------------- Remplacements --------------------------- */

export function RemplacementsPlanning() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { remplacements, affectations, absences, disponibilites, pourvoirRemplacement, refuserRemplacement } = usePlanning()
  const [choix, setChoix] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const ouvertes = remplacements.filter((r) => r.statut === 'ouverte')
  const traitees = remplacements.filter((r) => r.statut !== 'ouverte')

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

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Planning"
          title="Remplacements"
          description="Les créneaux qu'un bénévole ne peut plus tenir, et les personnes en mesure de les reprendre."
          meta={<Badge variant="brand">{ouvertes.length} à pourvoir</Badge>}
          actions={<PlanningOutils />}
        />
      }
    >
      <PlanningNav />

      {ouvertes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UserCheck />}
            title="Aucun remplacement à traiter"
            description="Tous les créneaux sont couverts par la personne initialement prévue."
            action={<Button variant="primary" onClick={() => navigate('/planning')}>Retour au planning</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Demandes ouvertes" description="Choisissez un remplaçant parmi les personnes libres et compétentes." />
          <ul className="divide-y divide-ink-100">
            {ouvertes.map((r) => {
              const a = affectations.find((x) => x.id === r.affectationId)
              const demandeur = personnesPlanning.find((p) => p.id === r.demandeurId)
              const poste = a ? postes.find((p) => p.id === a.posteId) : undefined

              // Candidats : compétents, disponibles, non absents et non déjà pris
              const candidats = a
                ? personnesPlanning.filter((p) => {
                    if (p.id === r.demandeurId) return false
                    if (poste && !p.competences.includes(poste.competence)) return false
                    const absence = absences.find(
                      (x) => x.personneId === p.id && x.statut === 'validee' && a.jour >= x.debut && a.jour <= x.fin,
                    )
                    if (absence) return false
                    const dispo = disponibilites.find((d) => d.personneId === p.id)
                    const jourSemaine = (new Date(a.jour).getUTCDay() + 6) % 7
                    if (dispo && !dispo.ouverts.includes(`${jourSemaine}:${a.creneauId}`)) return false
                    return !affectations.some(
                      (x) => x.statut !== 'annulee' && x.jour === a.jour && x.creneauId === a.creneauId && x.personneId === p.id,
                    )
                  })
                : []

              return (
                <li key={r.id} className="flex flex-col gap-3 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <Avatar name={demandeur?.nom ?? ''} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.8125rem] font-medium text-ink-900">
                        {demandeur?.nom} · {poste?.nom}
                      </p>
                      <p className="ac-num truncate text-xs text-ink-500">
                        {a ? `${formatDate(a.jour)} · ${libelleCreneau(a.creneauId)}` : 'Créneau introuvable'} · demandé le {formatDate(r.demandeeLe)}
                      </p>
                    </div>
                    <StatusBadge status="remp_ouverte" />
                  </div>

                  <p className="ml-11 rounded-lg border border-ink-200 bg-ink-25 p-2.5 text-[0.8125rem] text-ink-700">
                    <span className="font-medium text-ink-900">Motif : </span>
                    {r.motif}
                  </p>

                  <div className="ml-11 flex flex-wrap items-center gap-2">
                    {candidats.length === 0 ? (
                      <p className="flex items-center gap-1.5 text-[0.8125rem] text-warning-600">
                        <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
                        Aucune personne libre et compétente sur ce créneau. Élargissez les disponibilités ou reportez l'activité.
                      </p>
                    ) : (
                      <>
                        <Select
                          aria-label={`Remplaçant pour ${demandeur?.nom}`}
                          value={choix[r.id] ?? ''}
                          onChange={(e) => setChoix((c) => ({ ...c, [r.id]: e.target.value }))}
                          placeholder="Choisir un remplaçant"
                          className="h-8 w-60 text-[0.8125rem]"
                          options={candidats.map((p) => ({ value: p.id, label: `${p.nom} — ${p.competences.join(', ')}` }))}
                        />
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={!choix[r.id]}
                          loading={enCours}
                          onClick={() =>
                            void executer(() => pourvoirRemplacement(r.id, choix[r.id]), {
                              titre: 'Remplacement pourvu',
                              detail: `${personnesPlanning.find((p) => p.id === choix[r.id])?.nom} reprend le créneau.`,
                            })
                          }
                        >
                          Confirmer le remplaçant
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={enCours}
                      onClick={() =>
                        void executer(() => refuserRemplacement(r.id), {
                          titre: 'Demande classée sans suite',
                          detail: 'La personne reste affectée au créneau.',
                        })
                      }
                    >
                      Classer sans suite
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {traitees.length > 0 && (
        <Card>
          <CardHeader title="Demandes traitées" />
          <ul className="divide-y divide-ink-100">
            {traitees.map((r) => {
              const demandeur = personnesPlanning.find((p) => p.id === r.demandeurId)
              const remplacant = personnesPlanning.find((p) => p.id === r.remplacantId)
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8125rem] text-ink-900">
                      {demandeur?.nom}
                      {remplacant ? ` remplacé par ${remplacant.nom}` : ' — demande classée sans suite'}
                    </span>
                    <span className="ac-num block truncate text-xs text-ink-500">
                      Demandé le {formatDate(r.demandeeLe)}
                      {r.reponduLe ? ` · traité le ${formatDate(r.reponduLe)}` : ''}
                    </span>
                  </span>
                  <StatusBadge status={r.statut === 'pourvue' ? 'remp_pourvue' : 'remp_refusee'} />
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </Page>
  )
}
