import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, History, RefreshCw, Send } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Status'
import { Timeline } from '@/components/ui/Timeline'
import { Tabs } from '@/components/ui/Tabs'
import { FactNav, FactOutils } from '@/components/facturation/FactNav'
import { cleFacture } from '@/components/facturation/statuts'
import { useFacturation } from '@/context/FacturationContext'
import { useToast } from '@/context/ToastContext'
import { joursRetard, resteDuFacture, statutFacture, totalTTC } from '@/lib/facturation'
import { formatDate, formatMoney } from '@/lib/utils'

/* ------------------------------- Relances ------------------------------- */

const niveaux = [
  { niveau: 1, titre: 'Rappel d’échéance', delai: 'à J+7', ton: 'Courtois, sans reproche : un simple rappel.' },
  { niveau: 2, titre: 'Relance', delai: 'à J+21', ton: 'Ferme, rappelle les conditions de règlement.' },
  { niveau: 3, titre: 'Mise en demeure', delai: 'à J+45', ton: 'Formel, annonce le recouvrement. Envoyé par courrier.' },
]

export function Relances() {
  usePageTitle('Relances')

  const navigate = useNavigate()
  const { toast } = useToast()
  const { factures, clients, chargement, erreur, recharger, relancer } = useFacturation()
  const [enCours, setEnCours] = useState<string | null>(null)
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null)

  const aRelancer = factures
    .filter((f) => f.type === 'facture' && statutFacture(f) === 'retard')
    .sort((a, b) => joursRetard(b) - joursRetard(a))

  const nomClient = (id: string) => clients.find((c) => c.id === id)?.nom ?? '—'

  const lancer = (id: string, numero: string) => {
    setEnCours(id)
    setErreurEnvoi(null)
    void (async () => {
      try {
        await relancer(id, 'email')
        toast({ titre: 'Relance envoyée', detail: `${numero} — le client a été notifié par e-mail.`, tone: 'success' })
      } catch (e) {
        setErreurEnvoi((e as Error).message)
        toast({ titre: 'Envoi impossible', detail: (e as Error).message, tone: 'danger' })
      } finally {
        setEnCours(null)
      }
    })()
  }

  const enTete = (
    <PageHeader
      eyebrow="Facturation"
      title="Relances"
      description="Les factures échues non soldées, classées de la plus ancienne à la plus récente. La relance est graduée en trois niveaux."
      meta={<Badge variant="brand">{aRelancer.length} factures en retard</Badge>}
      actions={<FactOutils />}
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <FactNav />
        <Alert tone="danger" titre="Les relances n'ont pas pu être chargées" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <FactNav />

      {erreurEnvoi && (
        <Alert tone="danger" titre="L'envoi de la relance a échoué">
          {erreurEnvoi} Aucune relance n'a été consignée : vous pouvez réessayer.
        </Alert>
      )}

      <Card>
        <CardHeader title="Politique de relance" description="Appliquée automatiquement à partir de l'échéance." />
        <CardBody className="grid gap-3 sm:grid-cols-3">
          {niveaux.map((n) => (
            <div key={n.niveau} className="rounded-lg border border-ink-200 bg-ink-25 p-3">
              <p className="flex items-center gap-2 text-[0.8125rem] font-semibold text-ink-900">
                <span aria-hidden className="ac-num flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-2xs font-bold text-white">
                  {n.niveau}
                </span>
                {n.titre}
              </p>
              <p className="ac-num mt-1.5 text-xs text-ink-500">Déclenché {n.delai}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">{n.ton}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      {chargement ? (
        <Card>
          <SkeletonTable rows={5} />
        </Card>
      ) : aRelancer.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CheckCircle2 />}
            title="Aucune facture en retard"
            description="Tous les règlements sont à jour. Rien à relancer aujourd'hui."
            action={<Button variant="primary" onClick={() => navigate('/facturation/factures')}>Voir les factures</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Factures à relancer" description="Le niveau proposé dépend des relances déjà envoyées." />
          <div className="ac-scroll overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Factures échues non réglées</caption>
              <thead>
                <tr className="border-b border-ink-100 bg-ink-25">
                  {['Facture', 'Client', 'Échéance', 'Retard', 'Reste dû', 'Relances', 'Statut', ''].map((h, i) => (
                    <th key={h || i} scope="col" className={`px-4 py-2 text-2xs font-semibold uppercase tracking-wide text-ink-500 ${i >= 3 && i <= 5 ? 'text-right' : ''}`}>
                      {h || <span className="sr-only">Action</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {aRelancer.map((f) => {
                  const prochain = Math.min(f.relances.length + 1, 3)
                  return (
                    <tr key={f.id} className="transition-colors hover:bg-ink-25">
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/facturation/factures/${f.id}`)}
                          className="ac-num text-[0.8125rem] font-medium text-brand-600 underline-offset-2 hover:underline"
                        >
                          {f.numero}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-[0.8125rem] text-ink-800">{nomClient(f.clientId)}</td>
                      <td className="ac-num px-4 py-2.5 text-[0.8125rem] text-ink-700">{formatDate(f.echeance)}</td>
                      <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-medium text-danger-600">
                        {joursRetard(f)} j
                      </td>
                      <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] font-medium text-ink-900">
                        {formatMoney(resteDuFacture(f))}
                        <span className="ml-1 text-xs font-normal text-ink-500">/ {formatMoney(totalTTC(f))}</span>
                      </td>
                      <td className="ac-num px-4 py-2.5 text-right text-[0.8125rem] text-ink-700">{f.relances.length}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={cleFacture(f)} /></td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          size="sm"
                          loading={enCours === f.id}
                          onClick={() => lancer(f.id, f.numero)}
                          iconLeft={<Send aria-hidden className="h-3.5 w-3.5" />}
                        >
                          Relancer niveau {prochain}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Page>
  )
}

/* ------------------------------ Historique ------------------------------ */

const onglets = [
  { id: 'tout', label: 'Toutes les actions' },
  { id: 'envois', label: 'Envois et relances' },
  { id: 'paiements', label: 'Paiements' },
]

export function HistoriqueFacturation() {
  const navigate = useNavigate()
  const { factures, clients, chargement } = useFacturation()
  const [onglet, setOnglet] = useState('tout')

  const evenements = factures
    .flatMap((f) =>
      f.historique.map((e) => ({
        ...e,
        id: `${f.id}-${e.id}`,
        factureId: f.id,
        numero: f.numero,
        client: clients.find((c) => c.id === f.clientId)?.nom ?? '—',
      })),
    )
    .filter((e) => {
      if (onglet === 'envois') return /envoy|relance/i.test(e.libelle)
      if (onglet === 'paiements') return /règlement|paiement/i.test(e.libelle)
      return true
    })
    .sort((a, b) => (a.quand < b.quand ? 1 : -1))
    .slice(0, 60)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Facturation"
          title="Historique"
          description="Journal de toutes les actions menées sur les factures et les avoirs, du plus récent au plus ancien."
          meta={<Badge variant="brand">{evenements.length} événements affichés</Badge>}
          actions={<FactOutils />}
        />
      }
    >
      <FactNav />

      <Tabs items={onglets} value={onglet} onChange={setOnglet} ariaLabel="Filtrer l'historique" />

      {chargement ? (
        <Card>
          <SkeletonTable rows={6} />
        </Card>
      ) : evenements.length === 0 ? (
        <Card>
          <EmptyState
            icon={<History />}
            title="Aucun événement"
            description="L'historique se remplit à mesure que des factures sont créées, envoyées et réglées."
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Journal d'activité" description="Les soixante derniers événements." />
          <CardBody>
            <Timeline
              evenements={evenements.map((e) => ({
                id: e.id,
                quand: e.quand,
                auteur: `${e.auteur} · ${e.numero} · ${e.client}`,
                libelle: e.libelle,
                detail: e.detail,
                tone: e.tone,
              }))}
            />
          </CardBody>
        </Card>
      )}

      <div className="flex justify-center">
        <Button onClick={() => navigate('/facturation/factures')}>Retour aux factures</Button>
      </div>
    </Page>
  )
}
