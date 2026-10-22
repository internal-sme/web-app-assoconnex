import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CalendarX2, Contact, Eye, Mail, Megaphone, MoreHorizontal, PencilLine, RefreshCw, Send, Trash2, UserRound,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid } from '@/components/data/DataGrid'
import { Menu } from '@/components/ui/Menu'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Input } from '@/components/ui/Input'
import { HorizontalBars } from '@/components/ui/Chart'
import { CampNav, CampOutils } from '@/components/campagnes/CampNav'
import { CorpsRendu } from '@/components/campagnes/CorpsRendu'
import { useCampagnes } from '@/context/CampagnesContext'
import { useToast } from '@/context/ToastContext'
import {
  cibleNom,
  courbeOuverturesHeures,
  decompteSegment,
  etatDestinataireStatusKey,
  personnaliser,
  statsCampagne,
  statutCampagneLabels,
  statutCampagneStatusKey,
} from '@/lib/campagnes'
import { formatDateTime } from '@/lib/utils'

export function CampFiche() {
  usePageTitle('Campagne')

  const navigate = useNavigate()
  const { id } = useParams()
  const {
    campagnes, chargement, erreur, desinscritsIds, envoiEnCours,
    relancer, annulerProgrammation, supprimer, renommer, envoyerTest,
  } = useCampagnes()
  const { toast } = useToast()

  const campagne = campagnes.find((c) => c.id === id)

  const [relance, setRelance] = useState(false)
  const [test, setTest] = useState(false)
  const [suppression, setSuppression] = useState(false)
  const [renommage, setRenommage] = useState(false)
  const [nomValeur, setNomValeur] = useState(campagne?.nom ?? '')

  const relancerEnvoi = async () => {
    if (!campagne) return
    setRelance(true)
    try {
      await relancer(campagne.id)
      toast({ titre: 'Envoi relancé', detail: 'La campagne est repartie vers ses destinataires.', tone: 'success' })
    } catch (err) {
      toast({ titre: 'Relance impossible', detail: err instanceof Error ? err.message : undefined, tone: 'danger' })
    } finally {
      setRelance(false)
    }
  }

  const tester = async () => {
    if (!campagne) return
    setTest(true)
    try {
      await envoyerTest(campagne.id)
      toast({ titre: 'E-mail de test envoyé', detail: 'Vérifiez la réception du message de test.', tone: 'success' })
    } catch (err) {
      toast({ titre: 'Test impossible', detail: err instanceof Error ? err.message : undefined, tone: 'danger' })
    } finally {
      setTest(false)
    }
  }

  if (chargement) {
    return (
      <Page header={<PageHeader eyebrow="Campagne d’emailing" title="Campagne" actions={<CampOutils />} />}>
        <CampNav />
        <Card className="p-4">
          <Skeleton className="mb-3 h-5 w-48" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="mt-3 h-40 w-full" />
        </Card>
      </Page>
    )
  }

  if (erreur) {
    return (
      <Page header={<PageHeader eyebrow="Campagne d’emailing" title="Campagne" actions={<CampOutils />} />}>
        <CampNav />
        <Alert tone="danger" titre="Impossible de charger cette campagne">{erreur}</Alert>
      </Page>
    )
  }

  if (!campagne) {
    return (
      <Page header={<PageHeader eyebrow="Campagne d’emailing" title="Campagne" actions={<CampOutils />} />}>
        <CampNav />
        <Card>
          <EmptyState
            icon={<Megaphone />}
            title="Campagne introuvable"
            description="Elle a peut-être été supprimée, ou l'état de démonstration a changé."
            action={<Button onClick={() => navigate('/campagnes-emailing/liste')} iconLeft={<Contact aria-hidden className="h-4 w-4" />}>Retour aux campagnes</Button>}
          />
        </Card>
      </Page>
    )
  }

  const stats = campagne.statut === 'envoyee' ? statsCampagne(campagne) : null
  const decompte = decompteSegment(campagne.cible.definition, desinscritsIds)
  const courbe = courbeOuverturesHeures(campagne)
  const comptesEtats = campagne.destinataires.reduce<Record<string, number>>((acc, d) => {
    acc[d.etat] = (acc[d.etat] ?? 0) + 1
    return acc
  }, {})

  const periodes = [
    campagne.creeLe ? { label: 'Créée le', valeur: formatDateTime(campagne.creeLe) } : null,
    campagne.programmeeLe ? { label: 'Départ programmé', valeur: formatDateTime(campagne.programmeeLe) } : null,
    campagne.envoyeLe ? { label: 'Envoyée le', valeur: formatDateTime(campagne.envoyeLe) } : null,
    campagne.testEnvoyeALe ? { label: 'Dernier test', valeur: formatDateTime(campagne.testEnvoyeALe) } : null,
  ].filter((p): p is { label: string; valeur: string } => p !== null)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Campagne d’emailing"
          title={campagne.nom}
          description={`${statutCampagneLabels[campagne.statut]} · destinataires : ${cibleNom(campagne.cible)}`}
          meta={<StatusBadge status={statutCampagneStatusKey[campagne.statut]} />}
          actions={
            <>
              <CampOutils />
              {campagne.statut === 'brouillon' && (
                <Button onClick={() => navigate(`/campagnes-emailing/nouvelle?brouillon=${campagne.id}`)} iconLeft={<PencilLine aria-hidden className="h-4 w-4" />}>
                  Continuer la rédaction
                </Button>
              )}
              {campagne.statut === 'programmee' && (
                <Button
                  onClick={async () => {
                    await annulerProgrammation(campagne.id)
                    toast({ titre: 'Programmation annulée', detail: 'La campagne est revenue à l’état de brouillon.', tone: 'success' })
                  }}
                  iconLeft={<CalendarX2 aria-hidden className="h-4 w-4" />}
                >
                  Annuler la programmation
                </Button>
              )}
              {campagne.statut === 'echec' && (
                <Button variant="primary" loading={relance} onClick={relancerEnvoi} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>
                  {envoiEnCours ? 'Relance en cours…' : 'Relancer l’envoi'}
                </Button>
              )}
              <Menu
                label={`Actions pour ${campagne.nom}`}
                align="end"
                items={[
                  { label: 'Envoyer un test', icon: <Send aria-hidden className="text-ink-500" />, onSelect: tester, shortcut: 'v' },
                  { label: 'Renommer', icon: <PencilLine aria-hidden className="text-ink-500" />, onSelect: () => { setNomValeur(campagne.nom); setRenommage(true) } },
                  { type: 'separator' },
                  { label: 'Supprimer', icon: <Trash2 aria-hidden className="text-danger-600" />, danger: true, onSelect: () => setSuppression(true) },
                ]}
                trigger={({ toggle, open, ref }) => (
                  <Button ref={ref} onClick={toggle} aria-expanded={open} aria-haspopup="menu" iconLeft={<MoreHorizontal aria-hidden className="h-4 w-4" />}>
                    Actions
                  </Button>
                )}
              />
            </>
          }
        />
      }
    >
      <CampNav />

      <ConfirmDialog
        open={suppression}
        onClose={() => setSuppression(false)}
        onConfirm={async () => {
          setSuppression(true)
          await supprimer(campagne.id)
          setSuppression(false)
          toast({ titre: 'Campagne supprimée', detail: 'Le brouillon et ses statistiques ont été retirés.', tone: 'success' })
          navigate('/campagnes-emailing/liste')
        }}
        loading={suppression}
        title="Supprimer cette campagne ?"
        description={`« ${campagne.nom} » sera effacée définitivement.`}
        confirmLabel="Supprimer"
      />

      <Modal
        open={renommage}
        onClose={() => setRenommage(false)}
        title="Renommer la campagne"
        description="Le nom est interne à l'équipe ; les destinataires ne le voient pas."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenommage(false)}>Annuler</Button>
            <Button
              variant="primary"
              disabled={!nomValeur.trim()}
              onClick={async () => {
                await renommer(campagne.id, nomValeur)
                setRenommage(false)
                toast({ titre: 'Campagne renommée', detail: nomValeur.trim(), tone: 'success' })
              }}
            >
              Renommer
            </Button>
          </>
        }
      >
        <Field label="Nom de la campagne" required>
          {(props) => <Input {...props} value={nomValeur} onChange={(e) => setNomValeur(e.target.value)} />}
        </Field>
      </Modal>

      {campagne.statut === 'echec' && (
        <Alert tone="danger" titre="Cet envoi a échoué" action={<Button onClick={relancerEnvoi} loading={relance} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Relancer l’envoi</Button>}>
          L'envoi s'est arrêté à {campagne.envoiProgression} % sans atteindre les destinataires suivants. La relance reprend à zéro, sans rien reconstruire.
        </Alert>
      )}

      {campagne.statut === 'en_cours' && (
        <Alert tone="warning" titre="Envoi en cours">
          <span className="flex items-center gap-3">
            <span className="h-1.5 w-40 overflow-hidden rounded-full bg-ink-200">
              <span className="block h-full rounded-full bg-brand-500" style={{ width: `${campagne.envoiProgression}%` }} />
            </span>
            {campagne.envoiProgression} % du message parti.
          </span>
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader title="Détails" description="Expéditeur, périmètre et dates." />
          <CardBody className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium text-ink-500">Expéditeur</p>
              <p className="mt-0.5 text-sm font-medium text-ink-900">{campagne.expediteurNom}</p>
              <p className="text-xs text-ink-500">{campagne.adresseReponse}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-500">Destinataires</p>
              <p className="mt-0.5 flex items-center gap-2 text-sm text-ink-900">
                <UserRound aria-hidden className="h-4 w-4 text-ink-400" />
                {decompte.joignables} joignables sur {decompte.total} retenus
              </p>
              {decompte.ecarts.some((e) => e.nombre > 0) && (
                <ul className="mt-1.5 flex flex-col gap-0.5 text-xs text-ink-500">
                  {decompte.ecarts.filter((e) => e.nombre > 0).map((e) => (
                    <li key={e.motif}>
                      {e.nombre} {e.label.toLowerCase()}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <dl className="flex flex-col gap-1.5 text-sm">
              {periodes.map((p) => (
                <div key={p.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-xs text-ink-500">{p.label}</dt>
                  <dd className="text-ink-800">{p.valeur}</dd>
                </div>
              ))}
            </dl>
            {Object.keys(comptesEtats).length > 0 && (
              <div>
                <p className="text-xs font-medium text-ink-500">État des destinataires</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {Object.entries(comptesEtats).map(([etat, n]) => (
                    <li key={etat} className="flex items-center gap-1.5 rounded-md bg-ink-100 px-2 py-1 text-xs text-ink-700">
                      <StatusBadge status={etatDestinataireStatusKey[etat as keyof typeof etatDestinataireStatusKey]} />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Message" description="Le contenu envoyé aux destinataires." />
          <CardBody>
            <p className="text-[0.8125rem] font-semibold text-ink-900">{campagne.objet || 'Sans objet'}</p>
            {campagne.previsualisation && <p className="mt-0.5 text-xs text-ink-500">{campagne.previsualisation}</p>}
            <div className="mt-3 border-t border-ink-100 pt-3">
              <CorpsRendu texte={personnaliser(campagne.corps, { prenom: 'Amina', nom: 'Benali' })} />
            </div>
          </CardBody>
        </Card>
      </div>

      {stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Envoyés" value={stats.envoye.toLocaleString('fr-FR')} hint={cibleNom(campagne.cible)} />
            <KpiCard label="Taux d'ouverture" value={String(stats.tauxOuverture)} unit="%" hint={`${stats.ouvert} messages ouverts`} />
            <KpiCard label="Taux de clic" value={String(stats.tauxClic)} unit="%" hint={`${stats.clique} clics`} />
            <KpiCard label="Rebonds répondus" value={String(stats.rebond + stats.desinscrit)} hint={`${stats.rebond} invalides · ${stats.desinscrit} désinscrit·e·s`} />
          </div>

          <Card>
            <CardHeader title="Ouvertures dans le temps" description="Ouvertures cumulées après l'envoi." />
            <CardBody>
              <HorizontalBars data={courbe} total={courbe.length > 0 ? courbe[courbe.length - 1].valeur : 0} titre="Ouvertures cumulées après l'envoi" />
            </CardBody>
          </Card>
        </>
      )}

      <Card>
        <CardHeader
          title="Destinataires"
          description={`${campagne.destinataires.length} personne${campagne.destinataires.length > 1 ? 's' : ''} retenue${campagne.destinataires.length > 1 ? 's' : ''} au moment de la campagne.`}
        />
        <CardBody>
          <DataGrid
            rows={campagne.destinataires}
            caption="Destinataires de la campagne et leur état de réception."
            searchKeys={(r) => `${r.prenom} ${r.nom} ${r.email}`}
            searchPlaceholder="Rechercher un destinataire…"
            getRowLabel={(r) => `${r.prenom} ${r.nom}`}
            columns={[
              {
                id: 'personne',
                header: 'Personne',
                cell: (r) => (
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold text-ink-700">
                      {r.prenom[0]}
                      {r.nom[0]}
                    </span>
                    <span>
                      <span className="block text-sm font-medium text-ink-900">{r.prenom} {r.nom}</span>
                      <span className="block text-xs text-ink-500">{r.email}</span>
                    </span>
                  </span>
                ),
                sortValue: (r) => `${r.nom} ${r.prenom}`,
              },
              {
                id: 'etat',
                header: 'État',
                cell: (r) => <StatusBadge status={etatDestinataireStatusKey[r.etat]} />,
              },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
          <Mail aria-hidden className="h-4 w-4 text-ink-400" />
          L'ouverture est mesurée au pixel invisible inclus en pied de message ; le clic, au suivi des liens.
          <Eye aria-hidden className="ml-2 h-4 w-4 text-ink-400" />
          Les adresses en rebond ne sont jamais recontactées.
        </CardBody>
      </Card>
    </Page>
  )
}