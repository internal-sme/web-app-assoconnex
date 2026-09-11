import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CalendarRange, ChevronLeft, ChevronRight, RefreshCw, UserPlus } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Status'
import { PlanningNav, PlanningOutils, cleAffectation } from '@/components/planning/PlanningNav'
import { GrillePlanning, LegendePostes, ReservePersonnes, type LigneGrille } from '@/components/planning/Grille'
import { usePlanning } from '@/context/PlanningContext'
import { useToast } from '@/context/ToastContext'
import {
  AUJOURDHUI_PLANNING,
  NOMS_JOURS_PLANNING,
  NOMS_MOIS_PLANNING,
  calculerKpisPlanning,
  cleJour,
  conflitsDe,
  creneaux,
  dateDe,
  debutSemainePlanning,
  heuresSemaine,
  joursDeLaSemaine,
  libelleCreneau,
  personnesPlanning,
  postes,
  ressources,
  statutAffectationLabels,
  type Affectation,
  type StatutAffectation,
} from '@/lib/planning'

export type PorteePlanning = 'global' | 'equipe' | 'individuel' | 'ressources'
type Vue = 'jour' | 'semaine' | 'mois'

const meta: Record<PorteePlanning, { titre: string; description: string; legende: string }> = {
  global: {
    titre: 'Planning global',
    description: 'Les créneaux en lignes, les jours en colonnes. Faites glisser une personne de la réserve vers une cellule pour l’affecter.',
    legende: 'Créneau',
  },
  equipe: {
    titre: 'Planning d’équipe',
    description: 'Une ligne par personne : qui travaille quand, et combien d’heures cela représente.',
    legende: 'Personne',
  },
  individuel: {
    titre: 'Planning individuel',
    description: 'Le planning d’une seule personne, créneau par créneau.',
    legende: 'Créneau',
  },
  ressources: {
    titre: 'Planning des ressources',
    description: 'L’occupation des salles, du véhicule et du matériel. Une double réservation apparaît en rouge.',
    legende: 'Ressource',
  },
}

export function PlanningGrilles({ portee }: { portee: PorteePlanning }) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    affectations, absences, disponibilites, remplacements,
    chargement, erreur, recharger, affecter, deplacer, retirer, modifierAffectation, changerStatutAffectation,
  } = usePlanning()

  const [vue, setVue] = useState<Vue>('semaine')
  const [reference, setReference] = useState(new Date(AUJOURDHUI_PLANNING))
  const [personneId, setPersonneId] = useState(personnesPlanning[0].id)
  const [ouverte, setOuverte] = useState<Affectation | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [depot, setDepot] = useState<{ personneId: string; ligneId: string; jour: string } | null>(null)
  const [posteChoisi, setPosteChoisi] = useState(postes[0].id)
  const [creneauChoisi, setCreneauChoisi] = useState(creneaux[0].id)
  const [ressourceChoisie, setRessourceChoisie] = useState('')

  const jours =
    vue === 'jour'
      ? [reference]
      : vue === 'semaine'
        ? joursDeLaSemaine(reference)
        : Array.from({ length: new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth() + 1, 0)).getUTCDate() }, (_, i) =>
            new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), i + 1)),
          )

  const clesJours = jours.map(cleJour)
  const visibles = affectations.filter((a) => clesJours.includes(a.jour) && a.statut !== 'annulee')
  const kpis = calculerKpisPlanning(affectations, absences, disponibilites, remplacements, reference)

  const lignes: LigneGrille[] =
    portee === 'equipe'
      ? personnesPlanning.map((p) => ({
          id: p.id,
          label: p.nom,
          sous: `${heuresSemaine(p.id, reference, affectations)} h sur ${p.quotaHebdo} h`,
          couleur: p.couleur,
        }))
      : portee === 'ressources'
        ? ressources.map((r) => ({ id: r.id, label: r.nom, sous: `${r.detail}` }))
        : creneaux.map((c) => ({ id: c.id, label: c.nom, sous: `${String(c.heureDebut).padStart(2, '0')}h – ${String(c.heureFin).padStart(2, '0')}h` }))

  const cellulesDe = (ligneId: string, jour: string) => {
    const duJour = visibles.filter((a) => a.jour === jour)
    if (portee === 'equipe') return duJour.filter((a) => a.personneId === ligneId)
    if (portee === 'ressources') return duJour.filter((a) => a.ressourceId === ligneId)
    if (portee === 'individuel') return duJour.filter((a) => a.creneauId === ligneId && a.personneId === personneId)
    return duJour.filter((a) => a.creneauId === ligneId)
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

  const deposer = (charge: { affectationId?: string; personneId?: string }, ligneId: string, jour: string) => {
    if (charge.affectationId) {
      const a = affectations.find((x) => x.id === charge.affectationId)
      if (!a) return
      const creneauId = portee === 'equipe' || portee === 'ressources' ? a.creneauId : ligneId
      const patch: Partial<Affectation> = { jour, creneauId }
      if (portee === 'equipe') patch.personneId = ligneId
      if (portee === 'ressources') patch.ressourceId = ligneId
      if (a.jour === jour && a.creneauId === creneauId && (portee !== 'equipe' || a.personneId === ligneId)) return
      void executer(() => modifierAffectation(a.id, patch), {
        titre: 'Affectation déplacée',
        detail: `${personnesPlanning.find((p) => p.id === (patch.personneId ?? a.personneId))?.nom} — ${jour}.`,
      })
      return
    }

    if (charge.personneId) {
      // Le poste n'est pas déductible de la grille : on le demande avant de créer
      setPosteChoisi(postes[0].id)
      setCreneauChoisi(portee === 'equipe' || portee === 'ressources' ? creneaux[0].id : ligneId)
      setRessourceChoisie(portee === 'ressources' ? ligneId : '')
      setDepot({ personneId: charge.personneId, ligneId, jour })
    }
  }

  const decaler = (n: number) => {
    setReference((d) => {
      if (vue === 'jour') return new Date(d.getTime() + n * 86400000)
      if (vue === 'semaine') return new Date(d.getTime() + n * 7 * 86400000)
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1))
    })
  }

  const debut = debutSemainePlanning(reference)
  const fin = new Date(debut.getTime() + 6 * 86400000)
  const titrePeriode =
    vue === 'jour'
      ? `${NOMS_JOURS_PLANNING[(reference.getUTCDay() + 6) % 7]} ${reference.getUTCDate()} ${NOMS_MOIS_PLANNING[reference.getUTCMonth()]}`
      : vue === 'semaine'
        ? `${debut.getUTCDate()} – ${fin.getUTCDate()} ${NOMS_MOIS_PLANNING[fin.getUTCMonth()]} ${fin.getUTCFullYear()}`
        : `${NOMS_MOIS_PLANNING[reference.getUTCMonth()]} ${reference.getUTCFullYear()}`

  const enTete = (
    <PageHeader
      eyebrow="Planning"
      title={meta[portee].titre}
      description={meta[portee].description}
      meta={<Badge variant="brand">{visibles.length} affectations affichées</Badge>}
      actions={
        <>
          <PlanningOutils />
          <Button variant="primary" onClick={() => navigate('/planning/affectation')} iconLeft={<UserPlus aria-hidden className="h-4 w-4" />}>
            Nouvelle affectation
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <PlanningNav />
        <Alert tone="danger" titre="Le planning n'a pas pu être chargé" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucune affectation n'a été perdue.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <PlanningNav />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-7 w-14" />
            </Card>
          ))}
        </div>
        <Card className="p-5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-4 h-64 w-full" />
        </Card>
      </Page>
    )
  }

  if (affectations.length === 0) {
    return (
      <Page header={enTete}>
        <PlanningNav />
        <Card>
          <EmptyState
            icon={<CalendarRange />}
            title="Planning vide"
            description="Aucune affectation enregistrée. Faites glisser une personne sur un créneau, ou passez par l'écran d'affectation pour construire une semaine type."
            action={
              <Button variant="primary" onClick={() => navigate('/planning/affectation')} iconLeft={<UserPlus aria-hidden className="h-4 w-4" />}>
                Créer une affectation
              </Button>
            }
            secondaryAction={<Button onClick={() => navigate('/planning/disponibilites')}>Voir les disponibilités</Button>}
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <PlanningNav />

      {kpis.conflits > 0 && (
        <Alert
          tone="warning"
          titre={`${kpis.conflits} affectation(s) en conflit`}
          action={<Button size="sm" onClick={() => navigate('/planning/conflits')}>Les examiner</Button>}
        >
          Double affectation, personne absente ou créneau hors disponibilités. Les cellules concernées sont encadrées de
          rouge dans la grille.
        </Alert>
      )}

      {kpis.remplacementsOuverts > 0 && (
        <Alert
          tone="warning"
          titre={`${kpis.remplacementsOuverts} remplacement(s) à traiter`}
          action={<Button size="sm" onClick={() => navigate('/planning/remplacements')}>Trouver un remplaçant</Button>}
        >
          Un bénévole s'est déclaré empêché. Tant que personne ne reprend le créneau, le poste reste à découvert.
        </Alert>
      )}

      <section aria-label="Indicateurs du planning" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Affectations de la semaine" value={String(kpis.cetteSemaine)} hint={`${kpis.heuresSemaine} heures planifiées`} />
        <KpiCard label="À confirmer" value={String(kpis.aConfirmer)} hint="Affectations encore au statut planifié" />
        <KpiCard label="Conflits" value={String(kpis.conflits)} hint="Double affectation, absence, disponibilité" />
        <KpiCard label="Remplacements ouverts" value={String(kpis.remplacementsOuverts)} hint="Créneaux à repourvoir" />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="icon" size="sm" label="Période précédente" onClick={() => decaler(-1)}>
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setReference(new Date(AUJOURDHUI_PLANNING))}>
            Cette semaine
          </Button>
          <Button variant="icon" size="sm" label="Période suivante" onClick={() => decaler(1)}>
            <ChevronRight aria-hidden className="h-4 w-4" />
          </Button>
          <h2 aria-live="polite" className="ml-2 font-display text-[0.9375rem] font-semibold capitalize text-ink-900">
            {titrePeriode}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {portee === 'individuel' && (
            <Select
              aria-label="Personne affichée"
              value={personneId}
              onChange={(e) => setPersonneId(e.target.value)}
              className="h-8 w-56 text-[0.8125rem]"
              options={personnesPlanning.map((p) => ({ value: p.id, label: p.nom }))}
            />
          )}
          <div role="group" aria-label="Vue du planning" className="flex items-center gap-0.5 rounded-lg border border-ink-200 p-0.5">
            {(['jour', 'semaine', 'mois'] as Vue[]).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={vue === v}
                onClick={() => setVue(v)}
                className={cn(
                  'h-7 rounded-md px-2.5 text-xs font-medium capitalize transition-colors',
                  vue === v ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100',
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="flex flex-col gap-3">
          <GrillePlanning
            lignes={lignes}
            jours={jours}
            affectations={affectations}
            absences={absences}
            disponibilites={disponibilites}
            cellulesDe={cellulesDe}
            onDeposer={deposer}
            onOuvrir={(a) => setOuverte(a)}
            onRetirer={(a) =>
              void executer(() => retirer(a.id), {
                titre: 'Affectation retirée',
                detail: `${personnesPlanning.find((p) => p.id === a.personneId)?.nom} n’est plus sur ce créneau.`,
              })
            }
            legendeLigne={meta[portee].legende}
          />
          <LegendePostes />
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Réserve" description="Faites glisser une personne vers une cellule." />
            <CardBody>
              <ReservePersonnes heuresDe={(id) => heuresSemaine(id, reference, affectations)} />
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Choix du poste au dépôt d'une personne */}
      <Modal
        open={!!depot}
        onClose={() => setDepot(null)}
        title="Affecter cette personne"
        description={
          depot
            ? `${personnesPlanning.find((p) => p.id === depot.personneId)?.nom} — ${depot.jour}. Précisez le poste tenu.`
            : ''
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setDepot(null)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              onClick={() => {
                const d = depot!
                setDepot(null)
                void executer(
                  () =>
                    affecter({
                      jour: d.jour,
                      creneauId: creneauChoisi,
                      posteId: posteChoisi,
                      personneId: d.personneId,
                      ressourceId: ressourceChoisie || null,
                      statut: 'planifiee',
                      note: '',
                    }).then(() => undefined),
                  {
                    titre: 'Affectation créée',
                    detail: `${personnesPlanning.find((p) => p.id === d.personneId)?.nom} — ${postes.find((p) => p.id === posteChoisi)?.nom}.`,
                  },
                )
              }}
            >
              Affecter
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Poste" required className="sm:col-span-2">
            {(p) => (
              <Select {...p} value={posteChoisi} onChange={(e) => setPosteChoisi(e.target.value)} options={postes.map((x) => ({ value: x.id, label: `${x.nom} — compétence ${x.competence}` }))} />
            )}
          </Field>
          <Field label="Créneau" required>
            {(p) => <Select {...p} value={creneauChoisi} onChange={(e) => setCreneauChoisi(e.target.value)} options={creneaux.map((c) => ({ value: c.id, label: libelleCreneau(c.id) }))} />}
          </Field>
          <Field label="Ressource" hint="Salle, véhicule ou matériel mobilisé.">
            {(p) => (
              <Select {...p} value={ressourceChoisie} onChange={(e) => setRessourceChoisie(e.target.value)} placeholder="Aucune" options={ressources.map((r) => ({ value: r.id, label: r.nom }))} />
            )}
          </Field>
        </div>
      </Modal>

      {/* Détail d'une affectation */}
      <Modal
        open={!!ouverte}
        onClose={() => setOuverte(null)}
        title={ouverte ? `${personnesPlanning.find((p) => p.id === ouverte.personneId)?.nom}` : ''}
        description={ouverte ? `${postes.find((p) => p.id === ouverte.posteId)?.nom} · ${libelleCreneau(ouverte.creneauId)} · ${ouverte.jour}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOuverte(null)} disabled={enCours}>Fermer</Button>
            {ouverte?.statut === 'planifiee' && (
              <Button
                variant="primary"
                loading={enCours}
                onClick={() => {
                  const a = ouverte!
                  setOuverte(null)
                  void executer(() => changerStatutAffectation(a.id, 'confirmee'), { titre: 'Affectation confirmée', detail: 'La personne est prévenue.' })
                }}
              >
                Confirmer
              </Button>
            )}
          </>
        }
      >
        {ouverte && (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={cleAffectation[ouverte.statut]} />
              {conflitsDe(ouverte, affectations, absences, disponibilites).length > 0 && <StatusBadge status="conflit_affectation" />}
            </div>
            {conflitsDe(ouverte, affectations, absences, disponibilites).map((c, i) => (
              <p key={i} className="flex gap-2 rounded-lg border border-danger-100 bg-danger-50 p-2.5 text-[0.8125rem] text-danger-700">
                <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {c.detail}
              </p>
            ))}
            <dl className="text-[0.8125rem]">
              {[
                ['Statut', statutAffectationLabels[ouverte.statut]],
                ['Ressource', ressources.find((r) => r.id === ouverte.ressourceId)?.nom ?? 'Aucune'],
                ['Note', ouverte.note || '—'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-ink-100 py-2 last:border-0">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="text-right font-medium text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
            <Button size="sm" onClick={() => { setOuverte(null); navigate('/planning/remplacements') }}>
              Demander un remplacement
            </Button>
          </div>
        )}
      </Modal>
    </Page>
  )
}
