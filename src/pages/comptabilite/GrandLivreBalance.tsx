import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, RefreshCw, Scale } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { ComptaNav, ComptaOutils } from '@/components/compta/ComptaNav'
import { useCompta } from '@/context/ComptaContext'
import { classesLabels, mouvementsDuCompte, soldesParCompte } from '@/lib/comptabilite'
import { formatDate, formatMoney } from '@/lib/utils'

const arrondi = (n: number) => Math.round(n * 100) / 100

/* ------------------------------ Grand livre ------------------------------ */

export function GrandLivre() {
  const navigate = useNavigate()
  const { ecritures, plan, exercice, exerciceId, chargement, erreur, recharger } = useCompta()
  const [filtre, setFiltre] = useState('')

  const validees = useMemo(
    () => ecritures.filter((e) => e.statut === 'validee' && e.exerciceId === exerciceId),
    [ecritures, exerciceId],
  )

  const comptesMouvementes = useMemo(() => {
    const utilises = new Set(validees.flatMap((e) => e.lignes.map((l) => l.compte)))
    return plan
      .filter((c) => utilises.has(c.numero))
      .filter((c) => `${c.numero} ${c.libelle}`.toLowerCase().includes(filtre.trim().toLowerCase()))
  }, [plan, validees, filtre])

  const enTete = (
    <PageHeader
      eyebrow="Comptabilité"
      title="Grand livre"
      description={`Détail des mouvements compte par compte pour l'exercice ${exercice.libelle}. Seules les écritures validées y figurent.`}
      meta={<Badge variant="brand">{comptesMouvementes.length} comptes mouvementés</Badge>}
      actions={<ComptaOutils />}
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <ComptaNav />
        <Alert tone="danger" titre="Le grand livre n'a pas pu être établi" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ComptaNav />

      {exercice.statut === 'cloture' && (
        <Alert tone="neutral" titre={`Exercice ${exercice.libelle} clôturé — lecture seule`}>
          Le grand livre est définitif.
        </Alert>
      )}

      <div className="max-w-md">
        <Input
          type="search"
          value={filtre}
          onChange={(e) => setFiltre(e.target.value)}
          placeholder="Filtrer par numéro ou intitulé de compte…"
          aria-label="Filtrer les comptes du grand livre"
        />
      </div>

      {chargement ? (
        <Card>
          <SkeletonTable rows={6} />
        </Card>
      ) : comptesMouvementes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen />}
            title={filtre ? 'Aucun compte ne correspond' : 'Aucun mouvement sur cet exercice'}
            description={
              filtre
                ? 'Essayez un autre numéro ou un mot de l’intitulé.'
                : 'Le grand livre se remplit à mesure que les écritures sont validées. Les brouillons n’y figurent pas.'
            }
            action={!filtre ? <Button variant="primary" onClick={() => navigate('/comptabilite/journal')}>Ouvrir le journal</Button> : undefined}
          />
        </Card>
      ) : (
        comptesMouvementes.map((c) => {
          const mouvements = mouvementsDuCompte(validees, c.numero)
          const debit = arrondi(mouvements.reduce((s, m) => s + m.debit, 0))
          const credit = arrondi(mouvements.reduce((s, m) => s + m.credit, 0))
          return (
            <Card key={c.numero}>
              <CardHeader
                title={`${c.numero} — ${c.libelle}`}
                description={`${mouvements.length} mouvement(s) · solde ${debit - credit >= 0 ? 'débiteur' : 'créditeur'} de ${formatMoney(Math.abs(debit - credit))}`}
                action={
                  <Button size="sm" onClick={() => navigate(`/comptabilite/comptes/${c.numero}`)}>
                    Ouvrir le compte
                  </Button>
                }
              />
              <div className="ac-scroll overflow-x-auto">
                <table className="w-full text-left">
                  <caption className="sr-only">Mouvements du compte {c.numero}</caption>
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-25">
                      {['Date', 'N°', 'Libellé', 'Débit', 'Crédit', 'Cumul'].map((h, i) => (
                        <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 3 ? 'text-right' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {mouvements.slice(0, 8).map((m, i) => (
                      <tr key={`${m.ecritureId}-${i}`}>
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
                        <td className="ac-num px-4 py-2 text-right text-[0.8125rem]">{m.debit > 0 ? formatMoney(m.debit) : '—'}</td>
                        <td className="ac-num px-4 py-2 text-right text-[0.8125rem]">{m.credit > 0 ? formatMoney(m.credit) : '—'}</td>
                        <td className="ac-num px-4 py-2 text-right text-[0.8125rem] text-ink-500">{formatMoney(m.cumul)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-ink-200 bg-ink-25">
                      <td colSpan={3} className="px-4 py-2 text-[0.8125rem] font-medium text-ink-700">
                        {mouvements.length > 8 ? `${mouvements.length - 8} mouvement(s) supplémentaire(s) sur la fiche du compte` : 'Totaux'}
                      </td>
                      <td className="ac-num px-4 py-2 text-right text-[0.8125rem] font-semibold">{formatMoney(debit)}</td>
                      <td className="ac-num px-4 py-2 text-right text-[0.8125rem] font-semibold">{formatMoney(credit)}</td>
                      <td className="ac-num px-4 py-2 text-right text-[0.8125rem] font-semibold">{formatMoney(debit - credit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )
        })
      )}
    </Page>
  )
}

/* -------------------------------- Balance -------------------------------- */

export function Balance() {
  const navigate = useNavigate()
  const { ecritures, plan, exercice, exerciceId, chargement, erreur, recharger } = useCompta()

  const validees = ecritures.filter((e) => e.statut === 'validee' && e.exerciceId === exerciceId)
  const soldes = soldesParCompte(validees)
  const brouillons = ecritures.filter((e) => e.statut === 'brouillon' && e.exerciceId === exerciceId).length

  const lignes = plan
    .filter((c) => soldes.has(c.numero))
    .map((c) => {
      const s = soldes.get(c.numero)!
      return { compte: c, debit: arrondi(s.debit), credit: arrondi(s.credit), solde: arrondi(s.solde) }
    })

  const totalDebit = arrondi(lignes.reduce((s, l) => s + l.debit, 0))
  const totalCredit = arrondi(lignes.reduce((s, l) => s + l.credit, 0))
  const equilibre = totalDebit === totalCredit

  const enTete = (
    <PageHeader
      eyebrow="Comptabilité"
      title="Balance générale"
      description={`Totaux et soldes de chaque compte mouvementé sur l'exercice ${exercice.libelle}.`}
      meta={<Badge variant="brand">{lignes.length} comptes</Badge>}
      actions={<ComptaOutils />}
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <ComptaNav />
        <Alert tone="danger" titre="La balance n'a pas pu être établie" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ComptaNav />

      {equilibre ? (
        <Alert tone="success" titre="Balance équilibrée">
          Total des débits et total des crédits coïncident à {formatMoney(totalDebit)}.
        </Alert>
      ) : (
        <Alert tone="danger" titre="Balance déséquilibrée">
          Écart de {formatMoney(Math.abs(totalDebit - totalCredit))} entre débits et crédits. Une écriture validée est
          incomplète : vérifiez le journal.
        </Alert>
      )}

      {brouillons > 0 && (
        <Alert tone="warning" titre={`${brouillons} écriture(s) en brouillon exclue(s)`}>
          La balance ne retient que les écritures validées. Les brouillons resteront invisibles dans les comptes
          annuels tant qu'ils ne seront pas validés.
        </Alert>
      )}

      {chargement ? (
        <Card>
          <SkeletonTable rows={8} />
        </Card>
      ) : lignes.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Scale />}
            title="Aucun compte mouvementé"
            description="La balance se construit à partir des écritures validées de l'exercice."
            action={<Button variant="primary" onClick={() => navigate('/comptabilite/journal')}>Ouvrir le journal</Button>}
          />
        </Card>
      ) : (
        <Card>
          <div className="ac-scroll overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Balance générale de l'exercice {exercice.libelle}</caption>
              <thead>
                <tr className="border-b border-ink-100 bg-ink-25">
                  {['Compte', 'Intitulé', 'Classe', 'Total débit', 'Total crédit', 'Solde débiteur', 'Solde créditeur'].map((h, i) => (
                    <th key={h} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 3 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {lignes.map((l) => (
                  <tr key={l.compte.numero} className="transition-colors hover:bg-ink-25">
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/comptabilite/comptes/${l.compte.numero}`)}
                        className="ac-num text-[0.8125rem] font-medium text-brand-600 underline-offset-2 hover:underline"
                      >
                        {l.compte.numero}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-[0.8125rem] text-ink-800">{l.compte.libelle}</td>
                    <td className="px-4 py-2 text-[0.8125rem] text-ink-500">{classesLabels[l.compte.classe]?.split('—')[1]?.trim()}</td>
                    <td className="ac-num px-4 py-2 text-right text-[0.8125rem]">{formatMoney(l.debit)}</td>
                    <td className="ac-num px-4 py-2 text-right text-[0.8125rem]">{formatMoney(l.credit)}</td>
                    <td className="ac-num px-4 py-2 text-right text-[0.8125rem] font-medium text-ink-900">
                      {l.solde > 0 ? formatMoney(l.solde) : '—'}
                    </td>
                    <td className="ac-num px-4 py-2 text-right text-[0.8125rem] font-medium text-ink-900">
                      {l.solde < 0 ? formatMoney(-l.solde) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-ink-200 bg-ink-25">
                  <td colSpan={3} className="px-4 py-2.5 text-[0.8125rem] font-semibold text-ink-900">
                    Totaux
                  </td>
                  <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-semibold">{formatMoney(totalDebit)}</td>
                  <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-semibold">{formatMoney(totalCredit)}</td>
                  <td colSpan={2} className="px-4 py-2.5 text-right text-[0.8125rem] font-semibold text-ink-900">
                    {equilibre ? 'Équilibrée' : `Écart de ${formatMoney(Math.abs(totalDebit - totalCredit))}`}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </Page>
  )
}
