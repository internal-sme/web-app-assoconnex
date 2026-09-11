import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarRange, Lock, ShieldCheck } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { Checkbox } from '@/components/ui/Toggle'
import { ComptaNav, ComptaOutils } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import { useToast } from '@/context/ToastContext'
import { equilibree, soldeClasse, type Exercice } from '@/lib/comptabilite'
import { formatDateLong, formatDateTime, formatMoney } from '@/lib/utils'

export function Exercices() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { exercices, ecritures, cloturerExercice, setExerciceId } = useCompta()

  const [aCloturer, setACloturer] = useState<Exercice | null>(null)
  const [confirmeLu, setConfirmeLu] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const bilan = (ex: Exercice) => {
    const surEx = ecritures.filter((e) => e.exerciceId === ex.id)
    const validees = surEx.filter((e) => e.statut === 'validee')
    const charges = soldeClasse(validees, 6).solde
    const produits = -soldeClasse(validees, 7).solde
    return {
      total: surEx.length,
      brouillons: surEx.filter((e) => e.statut === 'brouillon').length,
      desequilibrees: surEx.filter((e) => !equilibree(e)).length,
      charges: Math.round(charges * 100) / 100,
      produits: Math.round(produits * 100) / 100,
      resultat: Math.round((produits - charges) * 100) / 100,
    }
  }

  const lancer = async (ex: Exercice) => {
    setEnCours(true)
    try {
      await cloturerExercice(ex.id)
      toast({
        titre: `Exercice ${ex.libelle} clôturé`,
        detail: 'Le résultat a été affecté en réserves et l’exercice passe en lecture seule.',
        tone: 'success',
      })
    } catch (e) {
      toast({ titre: 'Clôture impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
      setConfirmeLu(false)
    }
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Comptabilité"
          title="Exercices comptables"
          description="Un exercice court du 1ᵉʳ septembre au 31 août. La clôture arrête définitivement les comptes et affecte le résultat en réserves."
          actions={<ComptaOutils />}
        />
      }
    >
      <ComptaNav />

      {exercices.map((ex) => {
        const b = bilan(ex)
        const bloque = b.brouillons > 0 || b.desequilibrees > 0
        return (
          <Card key={ex.id}>
            <CardHeader
              title={`Exercice ${ex.libelle}`}
              description={`Du ${formatDateLong(ex.debut)} au ${formatDateLong(ex.fin)}`}
              action={
                <div className="flex items-center gap-2">
                  <StatusBadge status={ex.statut === 'ouvert' ? 'exercice_ouvert' : 'exercice_cloture'} />
                  <Button size="sm" onClick={() => { setExerciceId(ex.id); navigate('/comptabilite/journal') }}>
                    Consulter
                  </Button>
                  {ex.statut === 'ouvert' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setACloturer(ex)}
                      iconLeft={<Lock aria-hidden className="h-3.5 w-3.5" />}
                    >
                      Clôturer
                    </Button>
                  )}
                </div>
              }
            />
            <CardBody className="flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ['Écritures', String(b.total)],
                  ['Produits', formatMoney(b.produits)],
                  ['Charges', formatMoney(b.charges)],
                  [b.resultat >= 0 ? 'Excédent' : 'Déficit', formatMoney(Math.abs(b.resultat))],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-ink-200 bg-ink-25 p-3">
                    <p className="text-xs text-ink-500">{k}</p>
                    <p className="ac-num mt-1 font-display text-lg font-semibold text-ink-900">{v}</p>
                  </div>
                ))}
              </div>

              {ex.statut === 'cloture' ? (
                <Alert tone="neutral" titre="Exercice clôturé">
                  Clôturé le {ex.clotureLe ? formatDateTime(ex.clotureLe) : '—'} par {ex.clotureePar}. Les écritures sont
                  consultables mais figées : toute correction passe par l'exercice ouvert.
                </Alert>
              ) : bloque ? (
                <Alert tone="warning" titre="La clôture n'est pas encore possible">
                  {b.brouillons > 0 && `${b.brouillons} écriture(s) en brouillon. `}
                  {b.desequilibrees > 0 && `${b.desequilibrees} écriture(s) déséquilibrée(s). `}
                  Traitez ces points depuis le journal avant de clôturer.
                </Alert>
              ) : (
                <Alert tone="success" titre="Exercice prêt à être clôturé">
                  Toutes les écritures sont validées et équilibrées. La clôture générera l'écriture d'affectation du
                  résultat.
                </Alert>
              )}
            </CardBody>
          </Card>
        )
      })}

      <Card>
        <CardHeader title="Ce que fait la clôture" description="Pour lever toute ambiguïté avant de lancer l'opération." />
        <CardBody>
          <ol className="flex flex-col gap-2.5 text-[0.8125rem] leading-relaxed text-ink-700">
            <li className="flex gap-2.5">
              <span aria-hidden className="ac-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-2xs font-semibold text-ink-600">1</span>
              Vérifie qu'aucune écriture n'est en brouillon ni déséquilibrée. Sinon, la clôture est refusée.
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="ac-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-2xs font-semibold text-ink-600">2</span>
              Calcule le résultat en soldant les classes 6 et 7, puis crée une écriture d'affectation vers le compte 120000.
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="ac-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-2xs font-semibold text-ink-600">3</span>
              Vire le résultat en réserves sur le compte 106000.
            </li>
            <li className="flex gap-2.5">
              <span aria-hidden className="ac-num flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-100 text-2xs font-semibold text-ink-600">4</span>
              Passe l'exercice en lecture seule. Plus aucune écriture ne peut y être ajoutée ni modifiée.
            </li>
          </ol>
        </CardBody>
      </Card>

      {/* Clôture d'exercice — action sensible */}
      <ConfirmDialog
        open={!!aCloturer}
        onClose={() => {
          setACloturer(null)
          setConfirmeLu(false)
        }}
        onConfirm={() => {
          const ex = aCloturer!
          setACloturer(null)
          void lancer(ex)
        }}
        title={`Clôturer l'exercice ${aCloturer?.libelle} ?`}
        description={`Cette opération est définitive. L'exercice passera en lecture seule et son résultat sera affecté en réserves.`}
        confirmDisabled={!confirmeLu}
        loading={enCours}
        confirmLabel="Clôturer définitivement"
      >
        <div className="flex flex-col gap-3">
          {aCloturer && (
            <div className="rounded-lg border border-ink-200 bg-ink-25 p-3 text-[0.8125rem] text-ink-700">
              <p className="flex items-center gap-2 font-semibold text-ink-900">
                <ShieldCheck aria-hidden className="h-4 w-4 text-brand-500" />
                Résultat à affecter
              </p>
              <p className="ac-num mt-1.5">
                Produits {formatMoney(bilan(aCloturer).produits)} · charges {formatMoney(bilan(aCloturer).charges)} ·{' '}
                <strong>{bilan(aCloturer).resultat >= 0 ? 'excédent' : 'déficit'} de {formatMoney(Math.abs(bilan(aCloturer).resultat))}</strong>
              </p>
            </div>
          )}
          <div className="rounded-lg border border-danger-100 bg-danger-50 p-3 text-[0.8125rem] text-danger-700">
            <p className="flex items-center gap-2 font-semibold">
              <CalendarRange aria-hidden className="h-4 w-4" />
              Aucun retour en arrière
            </p>
            <p className="mt-1">
              Après clôture, les écritures de cet exercice ne peuvent plus être créées, modifiées ni supprimées. Une
              erreur découverte ensuite se corrige sur l'exercice suivant.
            </p>
          </div>
          <Checkbox
            checked={confirmeLu}
            onChange={(e) => setConfirmeLu(e.target.checked)}
            label="J’ai vérifié les comptes et je comprends que la clôture est irréversible"
            description="Cette case doit être cochée pour poursuivre."
          />
          {!confirmeLu && (
            <p className="text-xs font-medium text-warning-600">
              Cochez la case ci-dessus pour activer le bouton de clôture.
            </p>
          )}
        </div>
      </ConfirmDialog>
    </Page>
  )
}
