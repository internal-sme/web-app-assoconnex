import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, FileText, Paperclip, Pencil, Scale, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { Menu } from '@/components/ui/Menu'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { ComptaNav } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import { useToast } from '@/context/ToastContext'
import { ecart, equilibree, journaux, totalCredit, totalDebit } from '@/lib/comptabilite'
import { formatDateLong, formatDateTime, formatMoney } from '@/lib/utils'

export function EcritureFiche() {
  usePageTitle('Écriture')

  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { ecritureParId, compteParNumero, exercices, pieces, chargement, validerEcritures, supprimerEcriture } = useCompta()

  const [aValider, setAValider] = useState(false)
  const [aSupprimer, setASupprimer] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const e = ecritureParId(id)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Écriture comptable" />}>
        <Card className="p-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </Card>
      </Page>
    )
  }

  if (!e) {
    return (
      <Page header={<PageHeader title="Écriture introuvable" />}>
        <Card>
          <EmptyState
            icon={<Scale />}
            title="Cette écriture n'existe plus"
            description="Elle a peut-être été supprimée alors qu'elle était encore en brouillon."
            action={<Button variant="primary" onClick={() => navigate('/comptabilite/journal')}>Retour au journal</Button>}
          />
        </Card>
      </Page>
    )
  }

  const exercice = exercices.find((x) => x.id === e.exerciceId)!
  const lectureSeule = exercice.statut === 'cloture'
  const journal = journaux.find((j) => j.code === e.journal)
  const piece = pieces.find((p) => p.id === e.pieceId || p.ecritureId === e.id)
  const balanced = equilibree(e)

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, apres?: () => void) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      apres?.()
    } catch (err) {
      toast({ titre: 'Action impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow={`Comptabilité · exercice ${exercice.libelle}`}
          title={e.libelle}
          description={`${journal?.code} — ${journal?.libelle} · ${formatDateLong(e.date)}`}
          meta={
            <>
              {!balanced ? (
                <StatusBadge status="ecriture_desequilibree" />
              ) : (
                <StatusBadge status={e.statut === 'validee' ? 'ecriture_validee' : 'ecriture_brouillon'} />
              )}
              <span className="ac-num text-2xs text-ink-500">{e.numero}</span>
              <Badge variant="outline">{e.reference}</Badge>
            </>
          }
          actions={
            <>
              <Button onClick={() => navigate('/comptabilite/journal')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Journal
              </Button>
              {e.statut === 'brouillon' && !lectureSeule && (
                <>
                  <Button onClick={() => navigate(`/comptabilite/ecritures/${e.id}/modifier`)} iconLeft={<Pencil aria-hidden className="h-4 w-4" />}>
                    Modifier
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!balanced}
                    onClick={() => setAValider(true)}
                    iconLeft={<CheckCircle2 aria-hidden className="h-4 w-4" />}
                  >
                    Valider
                  </Button>
                </>
              )}
              <Menu
                label="Autres actions"
                items={[
                  {
                    label: 'Voir le compte débité',
                    icon: <FileText />,
                    onSelect: () => navigate(`/comptabilite/comptes/${e.lignes.find((l) => l.debit > 0)?.compte ?? ''}`),
                  },
                  { label: 'Pièces comptables', icon: <Paperclip />, onSelect: () => navigate('/comptabilite/pieces') },
                  ...(e.statut === 'brouillon' && !lectureSeule
                    ? [{ type: 'separator' as const }, { label: 'Supprimer l’écriture', icon: <Trash2 />, danger: true, onSelect: () => setASupprimer(true) }]
                    : []),
                ]}
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
      <ComptaNav />

      {lectureSeule && (
        <Alert tone="neutral" titre={`Exercice ${exercice.libelle} clôturé — lecture seule`}>
          Cette écriture est figée. Toute correction passe par une écriture sur l'exercice ouvert.
        </Alert>
      )}

      {!balanced && (
        <Alert tone="danger" titre="Écriture déséquilibrée">
          Débit {formatMoney(totalDebit(e))} contre crédit {formatMoney(totalCredit(e))}, soit un écart de{' '}
          <strong>{formatMoney(Math.abs(ecart(e)))}</strong>. Tant que l'écart n'est pas résorbé, l'écriture reste en
          brouillon et n'entre ni dans la balance ni dans le résultat.
        </Alert>
      )}

      {e.statut === 'validee' && (
        <Alert tone="success" titre="Écriture validée">
          Validée le {e.valideeLe ? formatDateTime(e.valideeLe) : '—'}. Elle ne peut plus être modifiée : une correction
          se fait par contrepassation.
        </Alert>
      )}

      <Card>
        <CardHeader title="Lignes d'écriture" description={`${e.lignes.length} lignes · tiers : ${e.tiers}`} />
        <div className="ac-scroll overflow-x-auto">
          <table className="w-full text-left">
            <caption className="sr-only">Lignes de l'écriture {e.numero}</caption>
            <thead>
              <tr className="border-b border-ink-100 bg-ink-25">
                {['Compte', 'Intitulé', 'Libellé', 'Débit', 'Crédit'].map((h, i) => (
                  <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 3 ? 'text-right' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {e.lignes.map((l) => {
                const c = compteParNumero(l.compte)
                return (
                  <tr key={l.id}>
                    <td className="px-4 py-2.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/comptabilite/comptes/${l.compte}`)}
                        className="ac-num text-[0.8125rem] font-medium text-brand-600 underline-offset-2 hover:underline"
                      >
                        {l.compte}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-[0.8125rem] text-ink-700">{c?.libelle ?? 'Compte hors plan'}</td>
                    <td className="px-4 py-2.5 text-[0.8125rem] text-ink-700">{l.libelle}</td>
                    <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-900">
                      {l.debit > 0 ? formatMoney(l.debit) : '—'}
                    </td>
                    <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-900">
                      {l.credit > 0 ? formatMoney(l.credit) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink-200 bg-ink-25">
                <td colSpan={3} className="px-4 py-2.5 text-[0.8125rem] font-semibold text-ink-900">
                  Totaux
                </td>
                <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-semibold text-ink-900">
                  {formatMoney(totalDebit(e))}
                </td>
                <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-semibold text-ink-900">
                  {formatMoney(totalCredit(e))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Informations" />
          <CardBody className="py-0">
            <dl className="text-[0.8125rem]">
              {[
                ['Numéro', e.numero],
                ['Journal', `${journal?.code} — ${journal?.libelle}`],
                ['Date', formatDateLong(e.date)],
                ['Référence', e.reference],
                ['Tiers', e.tiers],
                ['Saisie par', e.creeePar],
                ['Validée le', e.valideeLe ? formatDateTime(e.valideeLe) : 'Non validée'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
                  <dt className="text-ink-500">{k}</dt>
                  <dd className="ac-num text-right font-medium text-ink-900">{v}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pièce justificative" />
          {piece ? (
            <CardBody className="flex items-center gap-3">
              <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-ink-50 text-ink-600">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.8125rem] font-medium text-ink-900">{piece.nom}</p>
                <p className="ac-num truncate text-xs text-ink-500">
                  {piece.type} · {formatMoney(piece.montant)} · {piece.fournisseur}
                </p>
              </div>
              <StatusBadge status="piece_rattachee" />
            </CardBody>
          ) : (
            <EmptyState
              icon={<Paperclip />}
              title="Aucune pièce rattachée"
              description="Rattachez la facture ou le reçu correspondant depuis l'écran des pièces comptables."
              compact
              action={<Button onClick={() => navigate('/comptabilite/pieces')}>Ouvrir les pièces</Button>}
            />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={aValider}
        tone="primary"
        onClose={() => setAValider(false)}
        onConfirm={() => {
          setAValider(false)
          void executer(() => validerEcritures([e.id]), {
            titre: 'Écriture validée',
            detail: `${e.numero} entre dans la balance et le résultat.`,
          })
        }}
        title="Valider cette écriture ?"
        description={`${e.numero} — ${e.libelle}, ${formatMoney(totalDebit(e))}. Après validation, elle ne pourra plus être modifiée ni supprimée.`}
        confirmLabel="Valider définitivement"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          La validation est irréversible. Une erreur constatée plus tard se corrige par contrepassation.
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={aSupprimer}
        onClose={() => setASupprimer(false)}
        onConfirm={() => {
          setASupprimer(false)
          void executer(
            () => supprimerEcriture(e.id),
            { titre: 'Écriture supprimée', detail: `${e.numero} a été retirée du journal.` },
            () => navigate('/comptabilite/journal'),
          )
        }}
        title="Supprimer cette écriture ?"
        description={`${e.numero} — ${e.libelle} et ses ${e.lignes.length} lignes seront définitivement retirées du journal.`}
        confirmLabel="Supprimer définitivement"
      />
      <span className="sr-only" aria-live="polite">
        {enCours ? 'Traitement en cours' : ''}
      </span>
    </Page>
  )
}
