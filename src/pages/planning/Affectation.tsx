import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, UserPlus } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Toggle'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { PlanningNav } from '@/components/planning/PlanningNav'
import { usePlanning } from '@/context/PlanningContext'
import { useToast } from '@/context/ToastContext'
import {
  AUJOURDHUI_PLANNING,
  NOMS_JOURS_PLANNING,
  cleJour,
  conflitsDe,
  creneaux,
  estAbsent,
  estDisponible,
  libelleCreneau,
  motifAbsenceLabels,
  personnesPlanning,
  postes,
  ressources,
  type Affectation as TypeAffectation,
} from '@/lib/planning'

export function Affectation() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { affectations, absences, disponibilites, affecter } = usePlanning()

  const [jour, setJour] = useState(cleJour(AUJOURDHUI_PLANNING))
  const [creneauId, setCreneauId] = useState(creneaux[0].id)
  const [posteId, setPosteId] = useState(postes[0].id)
  const [personneId, setPersonneId] = useState('')
  const [ressourceId, setRessourceId] = useState('')
  const [note, setNote] = useState('')
  const [repeter, setRepeter] = useState(false)
  const [semaines, setSemaines] = useState('4')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)

  const poste = postes.find((p) => p.id === posteId)

  // Les personnes sont classées : compétentes et disponibles d'abord
  const candidats = personnesPlanning.map((p) => {
    const absence = estAbsent(p.id, jour, absences)
    const dispo = estDisponible(p.id, jour, creneauId, disponibilites)
    const competent = poste ? p.competences.includes(poste.competence) : true
    const dejaPris = affectations.some(
      (a) => a.statut !== 'annulee' && a.jour === jour && a.creneauId === creneauId && a.personneId === p.id,
    )
    return { personne: p, absence, dispo, competent, dejaPris, score: (competent ? 4 : 0) + (dispo ? 2 : 0) + (absence || dejaPris ? -4 : 1) }
  })
  const tries = [...candidats].sort((a, b) => b.score - a.score)

  const provisoire: TypeAffectation = {
    id: 'provisoire',
    jour,
    creneauId,
    posteId,
    personneId,
    ressourceId: ressourceId || null,
    statut: 'planifiee',
    note,
  }
  const conflits = personneId ? conflitsDe(provisoire, affectations, absences, disponibilites) : []

  const enregistrer = async () => {
    const e: Record<string, string> = {}
    if (!personneId) e.personneId = 'Choisissez la personne à affecter.'
    if (!jour) e.jour = 'Indiquez la date.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    setEnCours(true)
    try {
      const nb = repeter ? Math.max(1, Number(semaines) || 1) : 1
      for (let k = 0; k < nb; k++) {
        const date = new Date(new Date(jour).getTime() + k * 7 * 86400000)
        await affecter({
          jour: cleJour(date),
          creneauId,
          posteId,
          personneId,
          ressourceId: ressourceId || null,
          statut: 'planifiee',
          note,
        })
      }
      toast({
        titre: nb > 1 ? `${nb} affectations créées` : 'Affectation créée',
        detail: `${personnesPlanning.find((p) => p.id === personneId)?.nom} — ${poste?.nom}.`,
        tone: 'success',
      })
      navigate('/planning')
    } catch (err) {
      toast({ titre: 'Affectation impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Planning"
          title="Nouvelle affectation"
          description="Choisissez le créneau et le poste : la liste des personnes se réordonne selon leurs compétences, leurs disponibilités et leurs absences."
          actions={
            <Button onClick={() => navigate('/planning')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Annuler
            </Button>
          }
        />
      }
    >
      <PlanningNav />

      {conflits.length > 0 && (
        <Alert tone="warning" titre={`${conflits.length} point(s) de vigilance sur cette affectation`}>
          <ul className="mt-1 flex flex-col gap-1">
            {conflits.map((c, i) => (
              <li key={i} className="flex gap-2">
                <AlertTriangle aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{c.detail}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2">L'affectation reste possible : c'est à vous de trancher, en connaissance de cause.</p>
        </Alert>
      )}

      <Card>
        <CardHeader title="Le créneau" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" required error={erreurs.jour}>
            {(p) => <Input {...p} type="date" value={jour} onChange={(e) => setJour(e.target.value)} />}
          </Field>
          <Field label="Créneau" required>
            {(p) => <Select {...p} value={creneauId} onChange={(e) => setCreneauId(e.target.value)} options={creneaux.map((c) => ({ value: c.id, label: libelleCreneau(c.id) }))} />}
          </Field>
          <Field label="Poste" required hint={poste ? `Compétence attendue : ${poste.competence}` : undefined}>
            {(p) => <Select {...p} value={posteId} onChange={(e) => setPosteId(e.target.value)} options={postes.map((x) => ({ value: x.id, label: x.nom }))} />}
          </Field>
          <Field label="Ressource" hint="Salle, véhicule ou matériel mobilisé.">
            {(p) => <Select {...p} value={ressourceId} onChange={(e) => setRessourceId(e.target.value)} placeholder="Aucune" options={ressources.map((r) => ({ value: r.id, label: `${r.nom} — ${r.detail}` }))} />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="La personne" description="Les plus adaptées au créneau apparaissent en premier." />
        <CardBody className="flex flex-col gap-2">
          {erreurs.personneId && (
            <p role="alert" className="rounded-lg border border-danger-100 bg-danger-50 p-2.5 text-[0.8125rem] text-danger-700">
              {erreurs.personneId}
            </p>
          )}
          {tries.map(({ personne, absence, dispo, competent, dejaPris }) => {
            const choisi = personneId === personne.id
            return (
              <button
                key={personne.id}
                type="button"
                aria-pressed={choisi}
                onClick={() => setPersonneId(personne.id)}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                  choisi ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300 hover:bg-ink-25',
                )}
              >
                <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: personne.couleur }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{personne.nom}</span>
                  <span className="block truncate text-xs text-ink-500">
                    {personne.role} · {personne.competences.join(', ')}
                  </span>
                </span>
                {competent ? <Badge variant="outline">Compétence acquise</Badge> : <Badge variant="outline">Compétence manquante</Badge>}
                {absence ? (
                  <Badge variant="outline">Absent — {motifAbsenceLabels[absence.motif].toLowerCase()}</Badge>
                ) : dispo ? (
                  <Badge variant="brand">Disponible</Badge>
                ) : (
                  <Badge variant="outline">Hors disponibilités</Badge>
                )}
                {dejaPris && <Badge variant="outline">Déjà affecté sur ce créneau</Badge>}
                {choisi && <Check aria-hidden className="h-4 w-4 shrink-0 text-brand-600" />}
              </button>
            )
          })}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Répétition et note" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Checkbox
              checked={repeter}
              onChange={(e) => setRepeter(e.target.checked)}
              label="Répéter chaque semaine"
              description="Crée la même affectation sur les semaines suivantes, au même jour et au même créneau."
            />
          </div>
          {repeter && (
            <Field label="Nombre de semaines" hint="La première semaine comprise.">
              {(p) => <Input {...p} type="number" min={1} max={26} value={semaines} onChange={(e) => setSemaines(e.target.value)} />}
            </Field>
          )}
          <Field label="Note" className="sm:col-span-2" hint="Contexte utile à la personne affectée.">
            {(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Atelier peinture, douze enfants inscrits." />}
          </Field>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours
            ? 'Enregistrement en cours…'
            : conflits.length > 0
              ? `${conflits.length} point(s) de vigilance.`
              : personneId
                ? 'Aucun point de vigilance sur ce créneau.'
                : 'Choisissez une personne pour poursuivre.'}
        </p>
        <Button variant="ghost" onClick={() => navigate('/planning')} disabled={enCours}>Annuler</Button>
        <Button variant="primary" loading={enCours} onClick={() => void enregistrer()} iconLeft={<UserPlus aria-hidden className="h-4 w-4" />}>
          Affecter
        </Button>
      </div>
    </Page>
  )
}
