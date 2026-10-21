import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ListChecks } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { MultiSelect } from '@/components/ui/MultiSelect'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { TachesNav } from '@/components/taches/TachesNav'
import { useTaches } from '@/context/TachesContext'
import { useToast } from '@/context/ToastContext'
import {
  COLONNES,
  MOI_TACHE,
  equipe,
  etiquettesDisponibles,
  prioriteLabels,
  type Priorite,
  type StatutTache,
} from '@/lib/taches'
import { toInputDate } from '@/lib/utils'

const projets = [
  { id: 'pj-festival', nom: 'Festival du Vieux Moulin' },
  { id: 'pj-jeunesse', nom: 'Ateliers jeunesse' },
  { id: 'pj-com', nom: 'Communication' },
  { id: 'pj-siege', nom: 'Fonctionnement général' },
]

export function TacheForm({ mode }: { mode: 'creation' | 'modification' }) {
  usePageTitle('Tâche')

  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { tacheParId, creer, modifier } = useTaches()

  const source = mode === 'modification' ? tacheParId(id) : undefined
  const aujourdhui = new Date().toISOString().slice(0, 10)

  const [titre, setTitre] = useState(source?.titre ?? '')
  const [description, setDescription] = useState(source?.description ?? '')
  const [responsable, setResponsable] = useState(source?.responsable ?? MOI_TACHE)
  const [participants, setParticipants] = useState<string[]>(source?.participants ?? [])
  const [dateDebut, setDateDebut] = useState(toInputDate(source?.dateDebut ?? new Date().toISOString()))
  const [echeance, setEcheance] = useState(toInputDate(source?.echeance ?? new Date(Date.now() + 14 * 86400000).toISOString()))
  const [priorite, setPriorite] = useState<Priorite>(source?.priorite ?? 'normale')
  const [statut, setStatut] = useState<StatutTache>(source?.statut ?? (params.get('statut') as StatutTache) ?? 'a_faire')
  const [projetId, setProjetId] = useState(source?.projetId ?? '')
  const [etiquettes, setEtiquettes] = useState<string[]>(source?.etiquettes ?? [])
  const [charge, setCharge] = useState(String(source?.chargeEstimee ?? 4))
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  if (mode === 'modification' && !source) {
    return (
      <Page header={<PageHeader title="Tâche introuvable" />}>
        <Card>
          <EmptyState
            icon={<ListChecks />}
            title="Cette tâche n'existe plus"
            description="Elle a peut-être été supprimée."
            action={<Button variant="primary" onClick={() => navigate('/taches/toutes')}>Retour aux tâches</Button>}
          />
        </Card>
      </Page>
    )
  }

  const valider = () => {
    const e: Record<string, string> = {}
    if (!titre.trim()) e.titre = 'Donnez un titre à la tâche.'
    if (!responsable) e.responsable = 'Désignez un responsable : une tâche sans responsable n’avance pas.'
    if (!dateDebut) e.dateDebut = 'Indiquez la date de début.'
    if (!echeance) e.echeance = 'Indiquez l’échéance.'
    else if (echeance < dateDebut) e.echeance = 'L’échéance ne peut pas précéder la date de début.'
    if (Number(charge) < 0) e.charge = 'La charge ne peut pas être négative.'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const enregistrer = async () => {
    if (!valider()) return
    setErreurGlobale(null)
    setEnCours(true)
    try {
      const donnees = {
        titre: titre.trim(),
        description: description.trim(),
        responsable,
        participants,
        dateDebut: new Date(dateDebut).toISOString(),
        echeance: new Date(echeance).toISOString(),
        priorite,
        statut,
        projetId: projetId || null,
        etiquettes,
        chargeEstimee: Number(charge) || 0,
      }
      if (mode === 'creation') {
        const creee = await creer(donnees)
        toast({ titre: 'Tâche créée', detail: `${creee.reference} — assignée à ${responsable}.`, tone: 'success' })
        navigate(`/taches/${creee.id}`)
      } else {
        await modifier(source!.id, donnees)
        toast({ titre: 'Modifications enregistrées', detail: source!.titre, tone: 'success' })
        navigate(`/taches/${source!.id}`)
      }
    } catch (err) {
      setErreurGlobale((err as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Tâches"
          title={mode === 'creation' ? 'Nouvelle tâche' : `Modifier ${source!.reference}`}
          description="Une tâche a toujours un responsable et une échéance : c'est ce qui la rend suivable."
          actions={
            <Button
              onClick={() => navigate(mode === 'creation' ? '/taches' : `/taches/${id}`)}
              iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}
            >
              Annuler
            </Button>
          }
        />
      }
    >
      <TachesNav />

      {erreurGlobale && (
        <Alert tone="danger" titre="Enregistrement impossible">
          {erreurGlobale} Vos saisies sont conservées.
        </Alert>
      )}

      <Card>
        <CardHeader title="La tâche" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Titre" required error={erreurs.titre} className="sm:col-span-2">
            {(p) => <Input {...p} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Réserver le matériel son et lumière" />}
          </Field>
          <Field label="Description" className="sm:col-span-2" hint="Ce qu’il y a à faire, et ce qui compte pour que ce soit bien fait.">
            {(p) => <Textarea {...p} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />}
          </Field>
          <Field label="Responsable" required error={erreurs.responsable} hint="Une seule personne responsable, sinon personne ne l’est.">
            {(p) => (
              <Select {...p} value={responsable} onChange={(e) => setResponsable(e.target.value)} options={equipe.map((m) => ({ value: m.nom, label: `${m.nom} — ${m.role}` }))} />
            )}
          </Field>
          <Field label="Participants" hint="Personnes associées, sans être responsables.">
            {(p) => (
              <MultiSelect
                {...p}
                value={participants}
                onChange={setParticipants}
                options={equipe.filter((m) => m.nom !== responsable).map((m) => ({ value: m.nom, label: m.nom }))}
                placeholder="Aucun participant"
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Planification" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Date de début" required error={erreurs.dateDebut}>
            {(p) => <Input {...p} type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />}
          </Field>
          <Field label="Échéance" required error={erreurs.echeance}>
            {(p) => <Input {...p} type="date" value={echeance} onChange={(e) => setEcheance(e.target.value)} />}
          </Field>
          <Field label="Priorité" required>
            {(p) => (
              <Select
                {...p}
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as Priorite)}
                options={(Object.keys(prioriteLabels) as Priorite[]).map((x) => ({ value: x, label: prioriteLabels[x] }))}
              />
            )}
          </Field>
          <Field label="Statut" required hint="Où placer la carte dans le tableau.">
            {(p) => (
              <Select
                {...p}
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutTache)}
                options={COLONNES.map((c) => ({ value: c.id, label: c.label }))}
              />
            )}
          </Field>
          <Field label="Charge estimée" error={erreurs.charge} hint="En heures, pour équilibrer la répartition.">
            {(p) => <Input {...p} type="number" min={0} suffix="h" value={charge} onChange={(e) => setCharge(e.target.value)} />}
          </Field>
          <Field label="Projet" hint="Une tâche peut rester hors projet.">
            {(p) => (
              <Select {...p} value={projetId} onChange={(e) => setProjetId(e.target.value)} placeholder="Hors projet" options={projets.map((x) => ({ value: x.id, label: x.nom }))} />
            )}
          </Field>
          <Field label="Étiquettes" className="sm:col-span-2">
            {(p) => (
              <MultiSelect
                {...p}
                value={etiquettes}
                onChange={setEtiquettes}
                options={etiquettesDisponibles.map((e) => ({ value: e, label: e }))}
                placeholder="Aucune étiquette"
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours ? 'Enregistrement en cours…' : 'Les champs marqués d’un astérisque sont obligatoires.'}
        </p>
        <Button variant="ghost" onClick={() => navigate('/taches')} disabled={enCours}>Annuler</Button>
        <Button variant="primary" loading={enCours} onClick={() => void enregistrer()}>
          {mode === 'creation' ? 'Créer la tâche' : 'Enregistrer les modifications'}
        </Button>
      </div>
    </Page>
  )
}
