import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, RefreshCw } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Checkbox } from '@/components/ui/Toggle'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Status'
import { ComptaNav, ComptaOutils } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import { useToast } from '@/context/ToastContext'
import { formatDate, formatMoney } from '@/lib/utils'

const arrondi = (n: number) => Math.round(n * 100) / 100

export function Rapprochement() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { ecritures, plan, exercice, exerciceId, lectureSeule, chargement, erreur, recharger, pointer } = useCompta()

  const comptesTresorerie = plan.filter((c) => c.tresorerie)
  const [compte, setCompte] = useState(comptesTresorerie[0]?.numero ?? '512000')
  const [soldeReleve, setSoldeReleve] = useState('')

  const mouvements = useMemo(() => {
    const out: { ecritureId: string; ligneId: string; numero: string; date: string; libelle: string; montant: number; rapprochee: boolean }[] = []
    for (const e of ecritures) {
      if (e.statut !== 'validee' || e.exerciceId !== exerciceId) continue
      for (const l of e.lignes) {
        if (l.compte !== compte) continue
        out.push({
          ecritureId: e.id,
          ligneId: l.id,
          numero: e.numero,
          date: e.date,
          libelle: l.libelle || e.libelle,
          montant: arrondi(l.debit - l.credit),
          rapprochee: l.rapprochee,
        })
      }
    }
    return out.sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [ecritures, compte, exerciceId])

  const soldeComptable = arrondi(mouvements.reduce((s, m) => s + m.montant, 0))
  const soldeRapproche = arrondi(mouvements.filter((m) => m.rapprochee).reduce((s, m) => s + m.montant, 0))
  const nonPointes = mouvements.filter((m) => !m.rapprochee)
  const enSuspens = arrondi(nonPointes.reduce((s, m) => s + m.montant, 0))
  const releve = soldeReleve === '' ? null : Number(soldeReleve)
  const ecartReleve = releve === null ? null : arrondi(releve - soldeRapproche)

  const basculer = async (ecritureId: string, ligneId: string, valeur: boolean) => {
    try {
      await pointer(ecritureId, ligneId, valeur)
    } catch (e) {
      toast({ titre: 'Pointage impossible', detail: (e as Error).message, tone: 'danger' })
    }
  }

  const enTete = (
    <PageHeader
      eyebrow="Comptabilité"
      title="Rapprochement bancaire"
      description="Pointez les mouvements présents sur le relevé. L'écart entre le solde pointé et le solde du relevé doit être nul."
      meta={<Badge variant="brand">{nonPointes.length} mouvement(s) non pointé(s)</Badge>}
      actions={<ComptaOutils />}
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <ComptaNav />
        <Alert tone="danger" titre="Les mouvements n'ont pas pu être chargés" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ComptaNav />

      {lectureSeule && (
        <Alert tone="neutral" titre={`Exercice ${exercice.libelle} clôturé — lecture seule`}>
          Le pointage reste consultable mais ne peut plus être modifié.
        </Alert>
      )}

      <Card>
        <CardHeader title="Paramètres du rapprochement" />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="Compte de trésorerie" required>
            {(p) => (
              <Select
                {...p}
                value={compte}
                onChange={(e) => setCompte(e.target.value)}
                options={comptesTresorerie.map((c) => ({ value: c.numero, label: `${c.numero} — ${c.libelle}` }))}
              />
            )}
          </Field>
          <Field label="Solde du relevé bancaire" hint="Saisissez le solde figurant sur le dernier relevé reçu.">
            {(p) => (
              <Input
                {...p}
                type="number"
                step="0.01"
                suffix="€"
                value={soldeReleve}
                onChange={(e) => setSoldeReleve(e.target.value)}
                placeholder="0,00"
              />
            )}
          </Field>
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Solde comptable', formatMoney(soldeComptable), 'Tous mouvements de l’exercice'],
          ['Solde pointé', formatMoney(soldeRapproche), 'Mouvements rapprochés'],
          ['En suspens', formatMoney(enSuspens), `${nonPointes.length} mouvement(s)`],
          [
            'Écart avec le relevé',
            ecartReleve === null ? '—' : formatMoney(ecartReleve),
            ecartReleve === null ? 'Saisissez le solde du relevé' : ecartReleve === 0 ? 'Rapprochement juste' : 'À justifier',
          ],
        ].map(([k, v, h]) => (
          <Card key={k} className="p-4">
            <p className="text-[0.8125rem] text-ink-500">{k}</p>
            <p className="ac-num mt-1.5 font-display text-xl font-semibold text-ink-900">{v}</p>
            <p className="mt-1.5 text-xs text-ink-500">{h}</p>
          </Card>
        ))}
      </div>

      {ecartReleve !== null && (
        <Alert
          tone={ecartReleve === 0 ? 'success' : 'warning'}
          titre={ecartReleve === 0 ? 'Rapprochement équilibré' : `Écart de ${formatMoney(Math.abs(ecartReleve))}`}
        >
          {ecartReleve === 0
            ? 'Le solde pointé correspond au relevé. Le rapprochement peut être considéré comme terminé.'
            : 'Vérifiez les mouvements en suspens : un chèque non encaissé ou un virement en cours explique souvent la différence.'}
        </Alert>
      )}

      <Card>
        <CardHeader
          title="Mouvements à pointer"
          description="Cochez chaque ligne retrouvée sur le relevé bancaire."
          action={
            <Button size="sm" onClick={() => navigate(`/comptabilite/comptes/${compte}`)}>
              Voir le compte
            </Button>
          }
        />
        {chargement ? (
          <SkeletonTable rows={6} />
        ) : mouvements.length === 0 ? (
          <EmptyState
            icon={<Landmark />}
            title="Aucun mouvement sur ce compte"
            description="Choisissez un autre compte de trésorerie ou vérifiez que les écritures ont bien été validées."
            compact
          />
        ) : (
          <div className="ac-scroll overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Mouvements de trésorerie à rapprocher pour le compte {compte}</caption>
              <thead>
                <tr className="border-b border-ink-100 bg-ink-25">
                  {['Pointé', 'Date', 'N°', 'Libellé', 'Montant', 'État'].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i === 4 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {mouvements.map((m) => (
                  <tr key={m.ligneId} className={m.rapprochee ? 'bg-success-50/40' : undefined}>
                    <td className="px-4 py-2">
                      <Checkbox
                        checked={m.rapprochee}
                        disabled={lectureSeule}
                        onChange={(e) => void basculer(m.ecritureId, m.ligneId, e.target.checked)}
                        aria-label={`Pointer le mouvement ${m.numero} du ${formatDate(m.date)}`}
                      />
                    </td>
                    <td className="ac-num px-4 py-2 text-[0.8125rem] text-ink-700">{formatDate(m.date)}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/comptabilite/ecritures/${m.ecritureId}`)}
                        className="ac-num text-[0.8125rem] text-brand-600 underline-offset-2 hover:underline"
                      >
                        {m.numero}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-[0.8125rem] text-ink-800">{m.libelle}</td>
                    <td className={`ac-num px-4 py-2 text-right text-[0.8125rem] font-medium ${m.montant < 0 ? 'text-danger-600' : 'text-success-600'}`}>
                      {m.montant > 0 ? '+' : ''}
                      {formatMoney(m.montant)}
                    </td>
                    <td className="px-4 py-2">
                      <StatusBadge status={m.rapprochee ? 'rapproche' : 'non_rapproche'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Page>
  )
}
