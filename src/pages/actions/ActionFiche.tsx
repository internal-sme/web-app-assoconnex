import { usePageTitle } from '@/hooks/usePageTitle'
import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Ban, CalendarDays, MapPin, Pencil, Send, Smartphone, Target, Trash2, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader, KpiCard } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Menu } from '@/components/ui/Menu'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { Timeline } from '@/components/ui/Timeline'
import { ActionsNav, ActionsOutils, cleAvancement } from '@/components/actions/ActionsNav'
import { ApercuCallToAction, FormulaireAction, type ValeursAction } from '@/components/actions/FormulaireAction'
import { ListeAssociations } from '@/components/chat/Pieces'
import { useActions } from '@/context/ActionsContext'
import { useProjets } from '@/context/ProjetsContext'
import { useAgenda } from '@/context/AgendaContext'
import { useToast } from '@/context/ToastContext'
import { associationsChat, membresChat } from '@/lib/chat'
import {
  avancementDe,
  categorieDe,
  partenairesDe,
  porteeLabels,
  typeDe,
  type BilanAction,
} from '@/lib/actions'
import { formatDate, formatDateLong } from '@/lib/utils'

function Ligne({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink-100 py-2.5 last:border-0">
      <dt className="text-[0.8125rem] text-ink-500">{label}</dt>
      <dd className="ac-num text-right text-[0.8125rem] font-medium text-ink-900">{children}</dd>
    </div>
  )
}

/** Rendu minimal du Markdown produit par l'éditeur enrichi. */
function DescriptionRendue({ texte }: { texte: string }) {
  if (!texte.trim()) return <p className="text-[0.8125rem] text-ink-500">Aucune description.</p>

  const blocs = texte.split('\n')
  return (
    <div className="flex flex-col gap-1.5">
      {blocs.map((ligne, i) => {
        const puce = /^[-*]\s+/.test(ligne)
        const numerotee = /^\d+\.\s+/.test(ligne)
        const contenu = ligne.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')
        const morceaux = contenu.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__)/g).filter(Boolean)

        const rendu = morceaux.map((m, k) => {
          if (m.startsWith('**') && m.endsWith('**')) return <strong key={k} className="font-semibold text-ink-900">{m.slice(2, -2)}</strong>
          if (m.startsWith('__') && m.endsWith('__')) return <span key={k} className="underline">{m.slice(2, -2)}</span>
          if (m.startsWith('*') && m.endsWith('*')) return <em key={k}>{m.slice(1, -1)}</em>
          return <span key={k}>{m}</span>
        })

        if (!ligne.trim()) return <span key={i} aria-hidden className="h-1" />
        if (puce || numerotee) {
          return (
            <p key={i} className="flex gap-2.5 pl-1 text-[0.8125rem] leading-relaxed text-ink-700">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{rendu}</span>
            </p>
          )
        }
        return (
          <p key={i} className="text-[0.8125rem] leading-relaxed text-ink-700">
            {rendu}
          </p>
        )
      })}
    </div>
  )
}

export function ActionFiche() {
  usePageTitle('Action')

  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { toast } = useToast()
  const { actionParId, chargement, modifier, supprimer, publier, depublier, annuler, retirerPartenaire, enregistrerBilan } = useActions()
  const { projets } = useProjets()
  const { evenements } = useAgenda()

  const [formOuvert, setFormOuvert] = useState(false)
  const [valeurs, setValeurs] = useState<ValeursAction | null>(null)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [bilanOuvert, setBilanOuvert] = useState(false)
  const [bilan, setBilan] = useState<BilanAction>({ beneficiaires: 0, heuresBenevolat: 0, commentaire: '' })
  const [depublierOuvert, setDepublierOuvert] = useState(false)
  const [motifDepublication, setMotifDepublication] = useState('')
  const [annulerOuvert, setAnnulerOuvert] = useState(false)
  const [motifAnnulation, setMotifAnnulation] = useState('')
  const [partenaireARetirer, setPartenaireARetirer] = useState<string | null>(null)
  const [aSupprimer, setASupprimer] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const a = actionParId(id)

  // La liste peut demander l'ouverture directe du formulaire d'édition
  useEffect(() => {
    if (a && params.get('modifier') === '1') {
      setValeurs({
        titre: a.titre,
        description: a.description,
        visuel: a.visuel,
        typeId: a.typeId,
        categorieId: a.categorieId,
        portee: a.portee,
        associationsIds: a.associationsIds,
        adresse: a.adresse,
        ville: a.ville,
        quartier: a.quartier,
        date: a.date.slice(0, 10),
        participantsIds: a.participantsIds,
        projetId: a.projetId ?? '',
        publiee: a.publiee,
      })
      setFormOuvert(true)
      setParams({})
    }
  }, [a, params, setParams])

  if (chargement) {
    return (
      <Page header={<PageHeader title="Action" />}>
        <ActionsNav />
        <Card className="p-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-4 h-3 w-full" />
        </Card>
      </Page>
    )
  }

  if (!a) {
    return (
      <Page header={<PageHeader title="Action introuvable" />}>
        <ActionsNav />
        <Card>
          <EmptyState
            icon={<Target />}
            title="Cette action n'existe plus"
            description="Elle a peut-être été supprimée du registre."
            action={<Button variant="primary" onClick={() => navigate('/actions/liste')}>Retour aux actions</Button>}
          />
        </Card>
      </Page>
    )
  }

  const type = typeDe(a)
  const categorie = categorieDe(a)
  const projet = projets.find((p) => p.id === a.projetId)
  const partenaires = partenairesDe(a)
  const avancement = avancementDe(a)
  const evenementsLies = evenements.filter((e) => e.actionAssociative === a.titre)
  const nomMembre = (mid: string) => membresChat.find((m) => m.id === mid)?.nom ?? mid

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, apres?: () => void) => {
    setEnCours(true)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      apres?.()
    } catch (e) {
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const ouvrirEdition = () => {
    setValeurs({
      titre: a.titre,
      description: a.description,
      visuel: a.visuel,
      typeId: a.typeId,
      categorieId: a.categorieId,
      portee: a.portee,
      associationsIds: a.associationsIds,
      adresse: a.adresse,
      ville: a.ville,
      quartier: a.quartier,
      date: a.date.slice(0, 10),
      participantsIds: a.participantsIds,
      projetId: a.projetId ?? '',
      publiee: a.publiee,
    })
    setErreurs({})
    setFormOuvert(true)
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow={`Actions associatives · ${a.reference}`}
          title={`${a.visuel}  ${a.titre}`}
          description={`${type?.nom} · ${categorie?.nom} · ${formatDateLong(a.date)}`}
          meta={
            <>
              <StatusBadge status={cleAvancement[avancement]} />
              <StatusBadge status={a.publiee ? 'action_publiee' : 'action_brouillon'} />
              <StatusBadge status={a.portee === 'partenariat' ? 'action_partenariat' : 'action_seule'} />
            </>
          }
          actions={
            <>
              <ActionsOutils />
              <Button onClick={() => navigate('/actions/liste')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Liste
              </Button>
              {!a.annulee && (
                <Button onClick={ouvrirEdition} iconLeft={<Pencil aria-hidden className="h-4 w-4" />}>
                  Modifier
                </Button>
              )}
              {!a.annulee && !a.publiee && (
                <Button
                  variant="primary"
                  loading={enCours}
                  onClick={() => void executer(() => publier(a.id), { titre: 'Action publiée', detail: `Elle est visible du public avec le bouton « ${type?.callToAction} ».` })}
                  iconLeft={<Send aria-hidden className="h-4 w-4" />}
                >
                  Publier sur l'application
                </Button>
              )}
              <Menu
                label={`Autres actions pour ${a.reference}`}
                items={[
                  ...(a.publiee
                    ? [{ label: 'Retirer de l’application mobile', icon: <Ban />, danger: true, onSelect: () => { setMotifDepublication(''); setDepublierOuvert(true) } }]
                    : []),
                  ...(!a.annulee
                    ? [{ label: 'Annuler l’action', icon: <Ban />, danger: true, onSelect: () => { setMotifAnnulation(''); setAnnulerOuvert(true) } }]
                    : []),
                  { label: 'Renseigner le bilan', icon: <Target />, onSelect: () => { setBilan(a.bilan); setBilanOuvert(true) } },
                  { type: 'separator' as const },
                  { label: 'Supprimer l’action', icon: <Trash2 />, danger: true, onSelect: () => setASupprimer(true) },
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
      <ActionsNav />

      {a.annulee && (
        <Alert tone="danger" titre="Action annulée">
          <strong>Motif : </strong>
          {a.motifAnnulation} Elle a été retirée de l'application mobile et n'entre plus dans les bilans d'activité.
        </Alert>
      )}

      {!a.annulee && !a.publiee && (
        <Alert
          tone="neutral"
          titre="Action non publiée"
          action={
            <Button
              size="sm"
              loading={enCours}
              onClick={() => void executer(() => publier(a.id), { titre: 'Action publiée', detail: 'Elle est désormais visible du public.' })}
            >
              Publier
            </Button>
          }
        >
          Elle est enregistrée dans le registre interne mais reste invisible du public sur l'application mobile.
        </Alert>
      )}

      {avancement === 'terminee' && a.bilan.beneficiaires === 0 && !a.annulee && (
        <Alert
          tone="warning"
          titre="Bilan non renseigné"
          action={
            <Button size="sm" onClick={() => { setBilan(a.bilan); setBilanOuvert(true) }}>
              Renseigner le bilan
            </Button>
          }
        >
          Sans bilan, l'action ne pèse rien dans le rapport d'activité ni dans les dossiers de subvention.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="À propos de l'action" />
            <CardBody>
              <DescriptionRendue texte={a.description} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Bilan" description="Ce que l'action a produit, pour le rapport d'activité." action={
              !a.annulee ? (
                <Button size="sm" variant="ghost" onClick={() => { setBilan(a.bilan); setBilanOuvert(true) }}>
                  {a.bilan.beneficiaires > 0 ? 'Modifier' : 'Renseigner'}
                </Button>
              ) : undefined
            } />
            <CardBody className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <KpiCard label="Bénéficiaires touchés" value={String(a.bilan.beneficiaires)} hint="Personnes concernées par l'action" />
                <KpiCard label="Heures de bénévolat" value={String(a.bilan.heuresBenevolat)} unit="h" hint="Valorisables au compte de résultat" />
              </div>
              {a.bilan.commentaire && <p className="text-[0.8125rem] leading-relaxed text-ink-700">{a.bilan.commentaire}</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Événements d'agenda rattachés"
              description={evenementsLies.length === 0 ? 'Aucun événement ne pointe vers cette action.' : `${evenementsLies.length} événement(s).`}
              action={<Button size="sm" variant="ghost" onClick={() => navigate('/agenda')}>Ouvrir l'agenda</Button>}
            />
            {evenementsLies.length === 0 ? (
              <EmptyState
                icon={<CalendarDays />}
                title="Aucun événement rattaché"
                description="Dans l'agenda, le champ « action associative » d'un événement permet de le relier à cette action."
                compact
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {evenementsLies.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => navigate(`/agenda/${e.id}`)}
                      className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-ink-25"
                    >
                      <CalendarDays aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{e.titre}</span>
                        <span className="ac-num block truncate text-xs text-ink-500">{formatDate(e.debut)} · {e.lieu}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Historique" description="Créations, publications, partenariats et bilans." />
            <CardBody>
              <Timeline evenements={a.historique} />
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Appel à l'action" description="Ce que le public voit sur l'application mobile." />
            <CardBody className="flex flex-col gap-3">
              <ApercuCallToAction typeId={a.typeId} titre={a.titre} />
              {!a.publiee && (
                <p className="flex items-start gap-2 rounded-lg border border-ink-200 bg-ink-25 p-2.5 text-xs text-ink-600">
                  <Smartphone aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Aperçu seulement : l'action n'étant pas publiée, ce bouton n'est visible de personne.
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Informations" />
            <CardBody className="py-0">
              <dl>
                <Ligne label="Référence">{a.reference}</Ligne>
                <Ligne label="Type">{type?.nom}</Ligne>
                <Ligne label="Catégorie">{categorie?.nom}</Ligne>
                <Ligne label="Date">{formatDate(a.date)}</Ligne>
                <Ligne label="Portée">{porteeLabels[a.portee]}</Ligne>
                <Ligne label="Créée par">{a.creePar}</Ligne>
                <Ligne label="Publiée le">{a.publieeLe ? formatDate(a.publieeLe) : 'Non publiée'}</Ligne>
                <Ligne label="Projet">
                  {projet ? (
                    <button type="button" onClick={() => navigate(`/projets/${projet.id}`)} className="underline-offset-2 hover:underline">
                      {projet.code}
                    </button>
                  ) : (
                    'Hors projet'
                  )}
                </Ligne>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Lieu" />
            <CardBody className="flex flex-col gap-1.5">
              <p className="flex items-start gap-2 text-[0.8125rem] text-ink-800">
                <MapPin aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                {a.adresse || 'Adresse non précisée'}
              </p>
              <p className="ac-num pl-6 text-xs text-ink-500">
                {a.ville}
                {a.quartier ? ` · quartier ${a.quartier}` : ''}
              </p>
            </CardBody>
          </Card>

          {a.portee === 'partenariat' && (
            <Card>
              <CardHeader title="Associations porteuses" description="L'action est menée conjointement." />
              <CardBody className="flex flex-col gap-2">
                <ListeAssociations ids={a.associationsIds} />
                {!a.annulee && partenaires.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 border-t border-ink-100 pt-2">
                    {partenaires.map((p) => (
                      <Button key={p} size="sm" variant="ghost" className="text-danger-600" onClick={() => setPartenaireARetirer(p)}>
                        Retirer {associationsChat.find((x) => x.id === p)?.courte}
                      </Button>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Participants" description={`${a.participantsIds.length} membre(s) mobilisés.`} />
            {a.participantsIds.length === 0 ? (
              <EmptyState icon={<Users />} title="Aucun participant" description="Aucun membre n'est rattaché à cette action." compact />
            ) : (
              <ul className="divide-y divide-ink-100">
                {a.participantsIds.map((mid) => (
                  <li key={mid} className="flex items-center gap-2.5 px-5 py-2.5">
                    <Avatar name={nomMembre(mid)} size="xs" />
                    <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-medium text-ink-900">{nomMembre(mid)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Modification */}
      {valeurs && (
        <FormulaireAction
          open={formOuvert}
          onClose={() => setFormOuvert(false)}
          titre={`Modifier « ${a.titre} »`}
          valeurs={valeurs}
          onChange={(v) => setValeurs((s) => (s ? { ...s, ...v } : s))}
          erreurs={erreurs}
          projets={projets.map((p) => ({ id: p.id, code: p.code, nom: p.nom }))}
          libelleValider="Enregistrer"
          enCours={enCours}
          onValider={() => {
            const e: Record<string, string> = {}
            if (!valeurs.titre.trim()) e.titre = 'Donnez un titre à l’action.'
            if (!valeurs.date) e.date = 'Indiquez la date de l’action.'
            if (valeurs.portee === 'partenariat' && valeurs.associationsIds.filter((x) => x !== 'org-1').length === 0) {
              e.associations = 'Désignez au moins une association de la ville.'
            }
            setErreurs(e)
            if (Object.keys(e).length > 0) return
            void executer(
              () => modifier(a.id, { ...valeurs, date: new Date(valeurs.date).toISOString(), projetId: valeurs.projetId || null }),
              { titre: 'Action modifiée', detail: valeurs.titre },
              () => setFormOuvert(false),
            )
          }}
        />
      )}

      {/* Bilan */}
      <Modal
        open={bilanOuvert}
        onClose={() => setBilanOuvert(false)}
        title="Renseigner le bilan"
        description="Ces chiffres alimentent le rapport d'activité et les dossiers de subvention."
        footer={
          <>
            <Button variant="ghost" onClick={() => setBilanOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              onClick={() =>
                void executer(() => enregistrerBilan(a.id, bilan), { titre: 'Bilan enregistré', detail: `${bilan.beneficiaires} bénéficiaires.` }, () => setBilanOuvert(false))
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Bénéficiaires touchés" required>
            {(p) => <Input {...p} type="number" min={0} value={String(bilan.beneficiaires)} onChange={(e) => setBilan((s) => ({ ...s, beneficiaires: Number(e.target.value) || 0 }))} />}
          </Field>
          <Field label="Heures de bénévolat" required>
            {(p) => <Input {...p} type="number" min={0} suffix="h" value={String(bilan.heuresBenevolat)} onChange={(e) => setBilan((s) => ({ ...s, heuresBenevolat: Number(e.target.value) || 0 }))} />}
          </Field>
          <Field label="Commentaire" className="sm:col-span-2" hint="Ce qui a marché, ce qu'il faudra ajuster.">
            {(p) => <Textarea {...p} rows={3} value={bilan.commentaire} onChange={(e) => setBilan((s) => ({ ...s, commentaire: e.target.value }))} />}
          </Field>
        </div>
      </Modal>

      {/* Dépublication — action sensible */}
      <Modal
        open={depublierOuvert}
        onClose={() => setDepublierOuvert(false)}
        title="Retirer l'action de l'application mobile ?"
        description="Elle cessera immédiatement d'être visible du public."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDepublierOuvert(false)} disabled={enCours}>Revenir</Button>
            <Button
              variant="danger"
              loading={enCours}
              disabled={!motifDepublication.trim()}
              onClick={() => {
                const m = motifDepublication
                setDepublierOuvert(false)
                void executer(() => depublier(a.id, m), { titre: 'Action retirée de l’application', detail: 'Elle reste dans le registre interne.' })
              }}
            >
              Retirer de l'application
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
            Les personnes qui avaient repéré cette action sur l'application ne la retrouveront plus. Le bouton
            « {type?.callToAction} » disparaît avec elle.
          </div>
          <Field label="Motif du retrait" required hint="Consigné dans l'historique de l'action.">
            {(p) => <Textarea {...p} rows={3} value={motifDepublication} onChange={(e) => setMotifDepublication(e.target.value)} placeholder="Date modifiée, l’action sera republiée après confirmation du lieu." />}
          </Field>
          {!motifDepublication.trim() && <p className="text-xs font-medium text-warning-600">Le motif est obligatoire.</p>}
        </div>
      </Modal>

      {/* Annulation */}
      <Modal
        open={annulerOuvert}
        onClose={() => setAnnulerOuvert(false)}
        title={`Annuler « ${a.titre} » ?`}
        description="L'action est retirée de l'application mobile et sort des bilans d'activité."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAnnulerOuvert(false)} disabled={enCours}>Revenir</Button>
            <Button
              variant="danger"
              loading={enCours}
              disabled={!motifAnnulation.trim()}
              onClick={() => {
                const m = motifAnnulation
                setAnnulerOuvert(false)
                void executer(() => annuler(a.id, m), { titre: 'Action annulée', detail: 'Elle reste consultable avec son motif.' })
              }}
            >
              Annuler l'action
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <Field label="Motif de l'annulation" required hint="Il apparaît sur la fiche et dans l'historique.">
            {(p) => <Textarea {...p} rows={3} value={motifAnnulation} onChange={(e) => setMotifAnnulation(e.target.value)} placeholder="Le local prêté par la mairie n’est pas disponible à cette date." />}
          </Field>
          {!motifAnnulation.trim() && <p className="text-xs font-medium text-warning-600">Le motif est obligatoire.</p>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!partenaireARetirer}
        loading={enCours}
        onClose={() => setPartenaireARetirer(null)}
        onConfirm={() => {
          const p = partenaireARetirer!
          setPartenaireARetirer(null)
          void executer(() => retirerPartenaire(a.id, p), {
            titre: 'Partenaire retiré',
            detail: `${associationsChat.find((x) => x.id === p)?.nom} ne figure plus parmi les porteurs.`,
          })
        }}
        title={`Retirer ${associationsChat.find((x) => x.id === partenaireARetirer)?.nom} de l'action ?`}
        description="L'association ne figurera plus parmi les porteurs de l'action, sur l'application comme dans les bilans. S'il ne reste plus de partenaire, l'action repasse en portée « menée seule »."
        confirmLabel="Retirer le partenaire"
      />

      <ConfirmDialog
        open={aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(false)}
        onConfirm={() => {
          setASupprimer(false)
          void executer(
            () => supprimer(a.id),
            { titre: 'Action supprimée', detail: `« ${a.titre} » a été retirée du registre.` },
            () => navigate('/actions/liste'),
          )
        }}
        title={`Supprimer « ${a.titre} » ?`}
        description="L'action disparaît du registre, de l'application mobile et des bilans d'activité. Si l'action a eu lieu, l'annulation est préférable : elle conserve la trace de ce qui s'est passé."
        confirmLabel="Supprimer définitivement"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          Le bilan de {a.bilan.beneficiaires} bénéficiaires et {a.bilan.heuresBenevolat} heures de bénévolat sera perdu.
        </div>
      </ConfirmDialog>
    </Page>
  )
}
