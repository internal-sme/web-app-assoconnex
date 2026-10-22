import { usePageTitle } from '@/hooks/usePageTitle'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Printer } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Alert } from '@/components/ui/Alert'
import { StatusBadge } from '@/components/ui/Status'
import { cleFacture } from '@/components/facturation/statuts'
import { useFacturation } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'
import { ligneHT, totalHT, totalTTC, totalTVA, ventilationTVA } from '@/lib/facturation'
import { formatDateLong, formatMoney } from '@/lib/utils'

export function FactureApercu() {
  usePageTitle('Aperçu facture')

  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { factureParId, clientParId, modeles } = useFacturation()

  const f = factureParId(id)

  if (!f) {
    return (
      <Page header={<PageHeader title="Document introuvable" />}>
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Ce document n'existe plus"
            description="Il a peut-être été supprimé."
            action={<Button variant="primary" onClick={() => navigate('/facturation/factures')}>Retour aux factures</Button>}
          />
        </Card>
      </Page>
    )
  }

  const client = clientParId(f.clientId)
  const modele = modeles.find((m) => m.id === f.modeleId)
  const avoir = f.type === 'avoir'
  const signe = avoir ? -1 : 1

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Facturation"
          title={`Aperçu — ${f.numero}`}
          description="Rendu du document tel qu'il sera adressé au client."
          meta={<StatusBadge status={cleFacture(f)} />}
          actions={
            <>
              <Button onClick={() => navigate(`/facturation/factures/${f.id}`)} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Retour à la fiche
              </Button>
              <Button
                onClick={() => toast({ titre: 'Impression', detail: 'La mise en page d’impression arrive en V2.', tone: 'neutral' })}
                iconLeft={<Printer aria-hidden className="h-4 w-4" />}
              >
                Imprimer
              </Button>
              <Button
                variant="primary"
                onClick={() => toast({ titre: 'Génération du PDF', detail: 'La génération de document arrive en V2.', tone: 'neutral' })}
                iconLeft={<Download aria-hidden className="h-4 w-4" />}
              >
                Télécharger le PDF
              </Button>
            </>
          }
        />
      }
    >
      {f.lignes.length === 0 && (
        <Alert tone="warning" titre="Document sans ligne">
          L'aperçu est vide car aucune prestation n'a été saisie. Le document ne peut pas être envoyé en l'état.
        </Alert>
      )}

      <article className="rounded-xl border border-ink-200 bg-white p-8 shadow-sm sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-ink-200 pb-6">
          <div>
            <p className="font-display text-lg font-bold text-brand-600">
              AssoConnex<span aria-hidden>°</span>
            </p>
            <p className="mt-1 text-[0.8125rem] font-medium text-ink-900">Les Amis du Vieux Moulin</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-500">
              12 rue des Trois-Croissants
              <br />
              44000 Nantes
              <br />
              contact@vieuxmoulin.fr
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-semibold uppercase tracking-wide text-ink-950">
              {avoir ? 'Avoir' : 'Facture'}
            </p>
            <p className="ac-num mt-1 text-[0.8125rem] font-medium text-ink-900">{f.numero}</p>
            <p className="ac-num mt-2 text-xs text-ink-500">
              Émise le {formatDateLong(f.date)}
              <br />
              {avoir ? 'Sans échéance de règlement' : `Échéance le ${formatDateLong(f.echeance)}`}
              {f.reference && (
                <>
                  <br />
                  Référence : {f.reference}
                </>
              )}
            </p>
          </div>
        </header>

        <section className="flex flex-wrap justify-between gap-6 py-6">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Objet</p>
            <p className="mt-1 text-[0.8125rem] text-ink-900">{f.objet}</p>
          </div>
          <div className="min-w-[14rem]">
            <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Destinataire</p>
            <p className="mt-1 text-[0.8125rem] font-medium text-ink-900">{client?.nom}</p>
            <p className="text-xs leading-relaxed text-ink-500">
              {client?.contact}
              <br />
              {client?.adresse}
              <br />
              <span className="ac-num">{client?.codePostal}</span> {client?.ville}
              {client?.siret && (
                <>
                  <br />
                  SIRET <span className="ac-num">{client.siret}</span>
                </>
              )}
            </p>
          </div>
        </section>

        <table className="w-full border-collapse text-left">
          <caption className="sr-only">Détail des prestations facturées</caption>
          <thead>
            <tr className="border-y border-ink-200">
              {['Désignation', 'Qté', 'P.U. HT', 'Remise', 'TVA', 'Total HT'].map((h, i) => (
                <th key={h} scope="col" className={`py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 1 ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {f.lignes.map((l) => (
              <tr key={l.id}>
                <td className="py-2.5 pr-4 text-[0.8125rem] text-ink-900">{l.designation}</td>
                <td className="ac-num py-2.5 text-right text-[0.8125rem] text-ink-700">
                  {l.quantite} {l.unite}
                </td>
                <td className="ac-num py-2.5 text-right text-[0.8125rem] text-ink-700">{formatMoney(l.prixHT)}</td>
                <td className="ac-num py-2.5 text-right text-[0.8125rem] text-ink-700">{l.remise > 0 ? `${l.remise} %` : '—'}</td>
                <td className="ac-num py-2.5 text-right text-[0.8125rem] text-ink-700">{l.tva} %</td>
                <td className="ac-num py-2.5 text-right text-[0.8125rem] font-medium text-ink-900">
                  {formatMoney(signe * ligneHT(l))}
                </td>
              </tr>
            ))}
            {f.lignes.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[0.8125rem] text-ink-500">
                  Aucune prestation saisie.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs text-[0.8125rem]">
            <div className="flex justify-between border-b border-ink-100 py-2">
              <dt className="text-ink-500">Total HT</dt>
              <dd className="ac-num font-medium text-ink-900">{formatMoney(signe * totalHT(f))}</dd>
            </div>
            {ventilationTVA(f).map((v) => (
              <div key={v.taux} className="flex justify-between border-b border-ink-100 py-2">
                <dt className="text-ink-500">TVA {v.taux} %</dt>
                <dd className="ac-num text-ink-900">{formatMoney(signe * v.montant)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-b border-ink-100 py-2">
              <dt className="text-ink-500">Total TVA</dt>
              <dd className="ac-num text-ink-900">{formatMoney(signe * totalTVA(f))}</dd>
            </div>
            <div className="flex justify-between border-t-2 border-ink-900 py-2.5">
              <dt className="font-semibold text-ink-900">{avoir ? 'Total à créditer' : 'Total TTC'}</dt>
              <dd className="ac-num font-display text-base font-semibold text-ink-950">{formatMoney(signe * totalTTC(f))}</dd>
            </div>
          </dl>
        </div>

        <footer className="mt-8 space-y-3 border-t border-ink-200 pt-5 text-xs leading-relaxed text-ink-500">
          <p>
            <span className="font-semibold text-ink-700">Conditions de règlement — </span>
            {modele?.conditions}
          </p>
          <p>
            <span className="font-semibold text-ink-700">Mentions — </span>
            {modele?.mentions}
          </p>
          <p className="pt-2 text-center text-2xs text-ink-500">{modele?.pied}</p>
        </footer>
      </article>
    </Page>
  )
}
