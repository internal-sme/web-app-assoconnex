import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { ProjetsNav } from '@/components/projets/ProjetsNav'
import { useProjets } from '@/context/ProjetsContext'
import { useToast } from '@/context/ToastContext'
import { statutProjetLabels, type StatutProjet } from '@/lib/projets'
import { equipe } from '@/lib/taches'
import { formatMoney } from '@/lib/utils'

export function ProjetNouveau() {
  usePageTitle('Projet')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { creer } = useProjets()

  const [code, setCode] = useState('')
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [objectif, setObjectif] = useState('')
  const [statut, setStatut] = useState<StatutProjet>('preparation')
  const [responsable, setResponsable] = useState(equipe[0].nom)
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().slice(0, 10))
  const [dateFin, setDateFin] = useState(new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10))
  const [budgetDepense, setBudgetDepense] = useState('')
  const [budgetRecette, setBudgetRecette] = useState('')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)

  const depense = Number(budgetDepense) || 0
  const recette = Number(budgetRecette) || 0

  const valider = () => {
    const e: Record<string, string> = {}
    if (!nom.trim()) e.nom = 'Donnez un nom au projet.'
    if (!code.trim()) e.code = 'Le code sert de référence courte, par exemple FEST27.'
    else if (!/^[A-Za-z0-9]{3,10}$/.test(code.trim())) e.code = 'Trois à dix caractères, lettres et chiffres uniquement.'
    if (!objectif.trim()) e.objectif = 'Formulez l’objectif : c’est lui qui permettra de juger le projet à sa clôture.'
    if (!dateDebut) e.dateDebut = 'Indiquez la date de début.'
    if (!dateFin) e.dateFin = 'Indiquez la date de fin.'
    else if (dateFin <= dateDebut) e.dateFin = 'La date de fin doit être postérieure à la date de début.'
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const enregistrer = async () => {
    if (!valider()) return
    setErreurGlobale(null)
    setEnCours(true)
    try {
      const cree = await creer({
        code: code.trim(),
        nom: nom.trim(),
        description: description.trim(),
        objectif: objectif.trim(),
        statut,
        responsable,
        dateDebut: new Date(dateDebut).toISOString(),
        dateFin: new Date(dateFin).toISOString(),
        budgetDepense: depense,
        budgetRecette: recette,
      })
      toast({ titre: 'Projet créé', detail: `${cree.code} — ${cree.nom}.`, tone: 'success' })
      navigate(`/projets/${cree.id}`)
    } catch (err) {
      setErreurGlobale((err as Error).message)
      toast({ titre: 'Création impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Projets"
          title="Nouveau projet"
          description="Un projet a un objectif, un responsable, une période et une enveloppe. Le reste — tâches, jalons, risques — se construit ensuite depuis sa fiche."
          actions={
            <Button onClick={() => navigate('/projets')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Annuler
            </Button>
          }
        />
      }
    >
      <ProjetsNav />

      {erreurGlobale && (
        <Alert tone="danger" titre="Création impossible">
          {erreurGlobale} Vos saisies sont conservées.
        </Alert>
      )}

      <Card>
        <CardHeader title="Identité" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du projet" required error={erreurs.nom} className="sm:col-span-2">
            {(p) => <Input {...p} value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Festival du Vieux Moulin" />}
          </Field>
          <Field label="Code" required error={erreurs.code} hint="Référence courte, utilisée dans les listes et les budgets.">
            {(p) => <Input {...p} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FEST27" maxLength={10} />}
          </Field>
          <Field label="Responsable" required hint="Une seule personne pilote le projet.">
            {(p) => (
              <Select {...p} value={responsable} onChange={(e) => setResponsable(e.target.value)} options={equipe.map((m) => ({ value: m.nom, label: `${m.nom} — ${m.role}` }))} />
            )}
          </Field>
          <Field label="Description" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ce que couvre le projet, en deux phrases." />}
          </Field>
          <Field
            label="Objectif"
            required
            error={erreurs.objectif}
            className="sm:col-span-2"
            hint="Formulé de façon vérifiable : c’est ce qui servira de référence au moment du bilan."
          >
            {(p) => (
              <Textarea {...p} rows={2} value={objectif} onChange={(e) => setObjectif(e.target.value)} placeholder="Réunir 1 200 spectateurs sur trois jours et équilibrer le budget." />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Période et statut" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Date de début" required error={erreurs.dateDebut}>
            {(p) => <Input {...p} type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />}
          </Field>
          <Field label="Date de fin" required error={erreurs.dateFin}>
            {(p) => <Input {...p} type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />}
          </Field>
          <Field label="Statut initial" required hint="Un projet en préparation n’apparaît pas dans les indicateurs d’activité.">
            {(p) => (
              <Select
                {...p}
                value={statut}
                onChange={(e) => setStatut(e.target.value as StatutProjet)}
                options={(['preparation', 'en_cours'] as StatutProjet[]).map((s) => ({ value: s, label: statutProjetLabels[s] }))}
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Budget prévisionnel" description="Une première enveloppe, détaillable ensuite ligne par ligne depuis la fiche." />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Dépenses prévues">
            {(p) => <Input {...p} type="number" min={0} suffix="€" value={budgetDepense} onChange={(e) => setBudgetDepense(e.target.value)} />}
          </Field>
          <Field label="Recettes prévues">
            {(p) => <Input {...p} type="number" min={0} suffix="€" value={budgetRecette} onChange={(e) => setBudgetRecette(e.target.value)} />}
          </Field>
          {(depense > 0 || recette > 0) && (
            <div className="sm:col-span-2 rounded-lg border border-ink-200 bg-ink-25 p-3">
              <p className="ac-num text-[0.8125rem] text-ink-700">
                Résultat prévisionnel :{' '}
                <span className={`font-semibold ${recette - depense >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {formatMoney(recette - depense)}
                </span>
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-200 bg-white/90 px-1 py-3 backdrop-blur">
        <p aria-live="polite" className="mr-auto text-[0.8125rem] text-ink-500">
          {enCours ? 'Création en cours…' : 'Les champs marqués d’un astérisque sont obligatoires.'}
        </p>
        <Button variant="ghost" onClick={() => navigate('/projets')} disabled={enCours}>Annuler</Button>
        <Button variant="primary" loading={enCours} onClick={() => void enregistrer()}>
          Créer le projet
        </Button>
      </div>
    </Page>
  )
}
