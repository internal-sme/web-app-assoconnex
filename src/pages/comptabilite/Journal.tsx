import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Pencil, Plus, RefreshCw, Scale, Trash2, Eye } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { ComptaNav, ComptaOutils } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import { useToast } from '@/context/ToastContext'
import { equilibree, journaux, totalDebit, type Ecriture } from '@/lib/comptabilite'
import { formatDate, formatMoney } from '@/lib/utils'

export function Journal() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { ecritures, exercice, exerciceId, lectureSeule, chargement, erreur, recharger, validerEcritures, supprimerEcriture } =
    useCompta()

  const [aValider, setAValider] = useState<Ecriture[] | null>(null)
  const [aSupprimer, setASupprimer] = useState<Ecriture | null>(null)
  const [viderSelection, setViderSelection] = useState<(() => void) | null>(null)

  const lignes = ecritures.filter((e) => e.exerciceId === exerciceId)
  const desequilibrees = lignes.filter((e) => !equilibree(e))

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }) => {
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      viderSelection?.()
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    }
  }

  const columns: Column<Ecriture>[] = [
    {
      id: 'date',
      header: 'Date',
      sortValue: (r) => r.date,
      width: '7rem',
      cell: (r) => <span className="ac-num">{formatDate(r.date)}</span>,
    },
    { id: 'journal', header: 'Journal', sortValue: (r) => r.journal, width: '5rem', cell: (r) => <Badge variant="outline">{r.journal}</Badge> },
    {
      id: 'numero',
      header: 'N° d’écriture',
      optional: true,
      sortValue: (r) => r.numero,
      cell: (r) => <span className="ac-num text-ink-500">{r.numero}</span>,
    },
    {
      id: 'libelle',
      header: 'Libellé',
      sortValue: (r) => r.libelle,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.libelle}</p>
          <p className="truncate text-xs text-ink-500">
            {r.tiers} · {r.lignes.length} lignes
          </p>
        </div>
      ),
    },
    { id: 'reference', header: 'Référence', optional: true, defaultHidden: true, sortValue: (r) => r.reference, cell: (r) => <span className="ac-num">{r.reference}</span> },
    {
      id: 'montant',
      header: 'Montant',
      align: 'right',
      sortValue: (r) => totalDebit(r),
      cell: (r) => <span className="ac-num font-medium">{formatMoney(totalDebit(r))}</span>,
    },
    {
      id: 'statut',
      header: 'Statut',
      align: 'right',
      sortValue: (r) => r.statut,
      cell: (r) =>
        !equilibree(r) ? (
          <StatusBadge status="ecriture_desequilibree" />
        ) : (
          <StatusBadge status={r.statut === 'validee' ? 'ecriture_validee' : 'ecriture_brouillon'} />
        ),
    },
  ]

  const filters: FilterDef<Ecriture>[] = [
    {
      id: 'journal',
      label: 'Journal',
      options: journaux.map((j) => ({ value: j.code, label: `${j.code} — ${j.libelle}` })),
      match: (r, v) => r.journal === v,
    },
    {
      id: 'statut',
      label: 'Statut',
      options: [
        { value: 'validee', label: 'Validée' },
        { value: 'brouillon', label: 'Brouillon' },
        { value: 'desequilibree', label: 'Déséquilibrée' },
      ],
      match: (r, v) => (v === 'desequilibree' ? !equilibree(r) : r.statut === v),
    },
  ]

  const enTete = (
    <PageHeader
      eyebrow="Comptabilité"
      title="Journal comptable"
      description={`Toutes les écritures de l'exercice ${exercice.libelle}, du plus récent au plus ancien. Une écriture validée n'est plus modifiable : elle se corrige par contrepassation.`}
      meta={<Badge variant="brand">{lignes.length} écritures</Badge>}
      actions={
        <>
          <ComptaOutils />
          <Button
            variant="primary"
            disabled={lectureSeule}
            onClick={() => navigate('/comptabilite/ecritures/nouvelle')}
            iconLeft={<Plus aria-hidden className="h-4 w-4" />}
          >
            Nouvelle écriture
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <ComptaNav />
        <Alert
          tone="danger"
          titre="Le journal n'a pas pu être chargé"
          action={
            <Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>
              Réessayer
            </Button>
          }
        >
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && lignes.length === 0) {
    return (
      <Page header={enTete}>
        <ComptaNav />
        <Card>
          <EmptyState
            icon={<Scale />}
            title="Aucune écriture sur cet exercice"
            description="Saisissez la première écriture, ou changez d'exercice si vous cherchiez un historique."
            action={
              <Button variant="primary" disabled={lectureSeule} onClick={() => navigate('/comptabilite/ecritures/nouvelle')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Saisir une écriture
              </Button>
            }
          />
        </Card>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ComptaNav />

      {lectureSeule && (
        <Alert tone="neutral" titre={`Exercice ${exercice.libelle} clôturé — lecture seule`}>
          Consultation possible, saisie et modification impossibles.
        </Alert>
      )}

      {desequilibrees.length > 0 && (
        <Alert tone="danger" titre={`${desequilibrees.length} écriture(s) déséquilibrée(s)`}>
          {desequilibrees.map((e) => e.numero).join(', ')} — le total des débits diffère du total des crédits. Ouvrez
          l'écriture pour corriger la ligne manquante.
        </Alert>
      )}

      <DataGrid
        rows={lignes}
        columns={columns}
        filters={filters}
        loading={chargement}
        caption={`Écritures comptables de l'exercice ${exercice.libelle}`}
        searchKeys={(r) => `${r.numero} ${r.libelle} ${r.reference} ${r.tiers} ${r.journal} ${r.lignes.map((l) => l.compte).join(' ')}`}
        searchPlaceholder="Rechercher un libellé, un numéro, un tiers, un compte…"
        getRowLabel={(r) => `${r.numero} — ${r.libelle}`}
        onRowClick={(r) => navigate(`/comptabilite/ecritures/${r.id}`)}
        emptyIcon={<Scale />}
        emptyTitle="Aucune écriture ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre. La recherche porte aussi sur les numéros de compte."
        rowActions={[
          { label: 'Ouvrir l’écriture', icon: <Eye />, onSelect: (r) => navigate(`/comptabilite/ecritures/${r.id}`) },
          {
            label: 'Modifier',
            icon: <Pencil />,
            onSelect: (r) =>
              r.statut === 'validee'
                ? toast({ titre: 'Modification impossible', detail: 'Une écriture validée se corrige par contrepassation.', tone: 'warning' })
                : navigate(`/comptabilite/ecritures/${r.id}/modifier`),
          },
          { label: 'Valider', icon: <CheckCircle2 />, onSelect: (r) => setAValider([r]) },
          { label: 'Supprimer', icon: <Trash2 />, danger: true, separatorBefore: true, onSelect: (r) => setASupprimer(r) },
        ]}
        bulkActions={(selected, clear) => (
          <>
            <Button
              size="sm"
              iconLeft={<CheckCircle2 aria-hidden className="h-3.5 w-3.5" />}
              onClick={() => {
                setViderSelection(() => clear)
                setAValider(selected.filter((e) => e.statut === 'brouillon'))
              }}
            >
              Valider les brouillons
            </Button>
            <Button size="sm" variant="ghost" onClick={clear}>
              Vider la sélection
            </Button>
          </>
        )}
      />

      {/* Validation comptable — action sensible */}
      <ConfirmDialog
        open={!!aValider && aValider.length > 0}
        tone="primary"
        onClose={() => setAValider(null)}
        onConfirm={() => {
          const cibles = aValider ?? []
          setAValider(null)
          void executer(() => validerEcritures(cibles.map((e) => e.id)), {
            titre: cibles.length > 1 ? `${cibles.length} écritures validées` : 'Écriture validée',
            detail: 'Elles entrent désormais dans la balance et le résultat.',
          })
        }}
        title={aValider && aValider.length > 1 ? `Valider ${aValider.length} écritures ?` : 'Valider cette écriture ?'}
        description={
          aValider && aValider.length === 1
            ? `${aValider[0].numero} — ${aValider[0].libelle}, ${formatMoney(totalDebit(aValider[0]))}. Après validation, elle ne pourra plus être modifiée ni supprimée.`
            : `${aValider?.length ?? 0} écritures passeront en validé. Elles ne pourront plus être modifiées ni supprimées.`
        }
        confirmLabel="Valider définitivement"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          La validation est irréversible. Une erreur constatée après coup se corrige par une écriture de
          contrepassation, jamais par modification.
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={!!aSupprimer}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const e = aSupprimer!
          setASupprimer(null)
          void executer(() => supprimerEcriture(e.id), {
            titre: 'Écriture supprimée',
            detail: `${e.numero} a été retirée du journal.`,
          })
        }}
        title="Supprimer cette écriture ?"
        description={`${aSupprimer?.numero} — ${aSupprimer?.libelle}. Seules les écritures en brouillon peuvent être supprimées.`}
        confirmLabel="Supprimer"
      />
    </Page>
  )
}
