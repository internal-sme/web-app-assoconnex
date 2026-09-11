import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ListChecks, Paperclip, Pencil, Plus, Send, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { Menu } from '@/components/ui/Menu'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Checkbox } from '@/components/ui/Toggle'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Timeline } from '@/components/ui/Timeline'
import { TachesNav, TachesOutils } from '@/components/taches/TachesNav'
import { BadgeStatut } from '@/components/taches/Vues'
import { useTaches } from '@/context/TachesContext'
import { useToast } from '@/context/ToastContext'
import {
  COLONNES,
  avancementChecklist,
  enRetard,
  joursRestants,
  prioriteLabels,
  statutTacheLabels,
  type StatutTache,
} from '@/lib/taches'
import { formatDate, formatDateLong, formatDateTime } from '@/lib/utils'

export function TacheFiche() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    tacheParId, chargement, enregistrement,
    changerStatut, supprimer, ajouterCommentaire, basculerChecklist, ajouterChecklist, retirerChecklist,
  } = useTaches()

  const [commentaire, setCommentaire] = useState('')
  const [nouvelElement, setNouvelElement] = useState('')
  const [aSupprimer, setASupprimer] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const t = tacheParId(id)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Tâche" />}>
        <Card className="p-5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-3/4" />
        </Card>
      </Page>
    )
  }

  if (!t) {
    return (
      <Page header={<PageHeader title="Tâche introuvable" />}>
        <Card>
          <EmptyState
            icon={<ListChecks />}
            title="Cette tâche n'existe plus"
            description="Elle a peut-être été supprimée depuis un autre onglet."
            action={<Button variant="primary" onClick={() => navigate('/taches/toutes')}>Retour aux tâches</Button>}
          />
        </Card>
      </Page>
    )
  }

  const check = avancementChecklist(t)
  const retard = enRetard(t)
  const jours = joursRestants(t)

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

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Tâches"
          title={t.titre}
          description={`${t.reference} · responsable : ${t.responsable}`}
          meta={
            <>
              <BadgeStatut statut={t.statut} />
              <Badge variant="outline">Priorité {prioriteLabels[t.priorite].toLowerCase()}</Badge>
              {retard && <Badge variant="outline">En retard de {-jours} j</Badge>}
              {t.etiquettes.map((e) => (
                <Badge key={e}>{e}</Badge>
              ))}
            </>
          }
          actions={
            <>
              <Button onClick={() => navigate('/taches/toutes')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Liste
              </Button>
              <Button onClick={() => navigate(`/taches/${t.id}/modifier`)} iconLeft={<Pencil aria-hidden className="h-4 w-4" />}>
                Modifier
              </Button>
              {t.statut !== 'termine' && (
                <Button
                  variant="primary"
                  loading={enCours}
                  onClick={() => void executer(() => changerStatut(t.id, 'termine'), { titre: 'Tâche terminée', detail: t.titre })}
                  iconLeft={<CheckCircle2 aria-hidden className="h-4 w-4" />}
                >
                  Marquer terminée
                </Button>
              )}
              <Menu
                label={`Autres actions pour ${t.reference}`}
                items={[
                  ...COLONNES.filter((c) => c.id !== t.statut).map((c) => ({
                    label: `Déplacer vers « ${c.label} »`,
                    icon: <ListChecks />,
                    onSelect: () =>
                      void executer(() => changerStatut(t.id, c.id as StatutTache), {
                        titre: 'Statut modifié',
                        detail: `« ${t.titre} » passe en ${c.label.toLowerCase()}.`,
                      }),
                  })),
                  { type: 'separator' as const },
                  { label: 'Supprimer la tâche', icon: <Trash2 />, danger: true, onSelect: () => setASupprimer(true) },
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
      <TachesNav />

      {retard && (
        <Alert tone="danger" titre={`Échéance dépassée de ${-jours} jour(s)`}>
          Prévue le {formatDateLong(t.echeance)}. Reprogrammez-la ou faites-la avancer : un retard qui traîne fausse le
          pilotage de l'équipe.
        </Alert>
      )}

      {t.statut === 'a_valider' && (
        <Alert tone="warning" titre="En attente de validation">
          Le travail est déclaré achevé. Un contrôle est attendu avant de clore définitivement la tâche.
        </Alert>
      )}

      {t.statut === 'termine' && (
        <Alert tone="success" titre="Tâche terminée">
          Close le {t.termineeLe ? formatDateLong(t.termineeLe) : '—'}. Elle reste consultable pour mémoire.
        </Alert>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Description" />
            <CardBody>
              <p className="text-[0.8125rem] leading-relaxed text-ink-700">
                {t.description || <span className="text-ink-500">Aucune description.</span>}
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Checklist"
              description={check ? `${check.faits} sur ${check.total} élément(s) fait(s).` : 'Découpez la tâche en étapes vérifiables.'}
            />
            <CardBody className="flex flex-col gap-3">
              {check && (
                <div className="flex items-center gap-3">
                  <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                    <span className="block h-full rounded-full bg-brand-500 transition-[width]" style={{ width: `${check.pourcentage}%` }} />
                  </span>
                  <span className="ac-num text-[0.8125rem] font-medium text-ink-800">{check.pourcentage} %</span>
                </div>
              )}

              {t.checklist.length === 0 ? (
                <p className="text-[0.8125rem] text-ink-500">Aucun élément. Ajoutez les étapes ci-dessous.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {t.checklist.map((c) => (
                    <li key={c.id} className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-ink-25">
                      <Checkbox
                        checked={c.fait}
                        onChange={() => void basculerChecklist(t.id, c.id)}
                        label={c.libelle}
                        className={c.fait ? '[&_label]:text-ink-500 [&_label]:line-through' : ''}
                      />
                      <Button
                        variant="icon"
                        size="sm"
                        label={`Retirer « ${c.libelle} »`}
                        className="ml-auto text-ink-500 hover:text-danger-600"
                        onClick={() => void retirerChecklist(t.id, c.id)}
                      >
                        <Trash2 aria-hidden className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-2 border-t border-ink-100 pt-3">
                <Input
                  value={nouvelElement}
                  onChange={(e) => setNouvelElement(e.target.value)}
                  placeholder="Ajouter une étape"
                  aria-label="Nouvel élément de checklist"
                  className="h-8 text-[0.8125rem]"
                />
                <Button
                  size="sm"
                  disabled={!nouvelElement.trim()}
                  onClick={() =>
                    void executer(() => ajouterChecklist(t.id, nouvelElement), { titre: 'Étape ajoutée', detail: nouvelElement.trim() }, () => setNouvelElement(''))
                  }
                  iconLeft={<Plus aria-hidden className="h-3.5 w-3.5" />}
                >
                  Ajouter
                </Button>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Commentaires" description={`${t.commentaires.length} message(s).`} />
            <CardBody className="flex flex-col gap-4">
              {t.commentaires.length === 0 ? (
                <p className="text-[0.8125rem] text-ink-500">Aucun commentaire. Ouvrez la discussion ci-dessous.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {t.commentaires.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <Avatar name={c.auteur} size="sm" />
                      <div className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-ink-25 p-3">
                        <p className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[0.8125rem] font-medium text-ink-900">{c.auteur}</span>
                          <span className="ac-num text-2xs text-ink-500">{formatDateTime(c.quand)}</span>
                        </p>
                        <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-700">{c.texte}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-2 border-t border-ink-100 pt-4">
                <Textarea
                  rows={2}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Écrire un commentaire…"
                  aria-label="Nouveau commentaire"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={!commentaire.trim()}
                    loading={enCours}
                    onClick={() =>
                      void executer(() => ajouterCommentaire(t.id, commentaire), { titre: 'Commentaire publié', detail: 'Les participants sont notifiés.' }, () => setCommentaire(''))
                    }
                    iconLeft={<Send aria-hidden className="h-3.5 w-3.5" />}
                  >
                    Publier
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Historique" description="Créations, changements de statut et validations." />
            <CardBody>
              <Timeline evenements={t.historique} />
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader title="Détails" />
            <CardBody className="py-0">
              <dl className="text-[0.8125rem]">
                {[
                  ['Statut', statutTacheLabels[t.statut]],
                  ['Priorité', prioriteLabels[t.priorite]],
                  ['Date de début', formatDate(t.dateDebut)],
                  ['Échéance', formatDate(t.echeance)],
                  ['Charge estimée', `${t.chargeEstimee} h`],
                  ['Projet', t.projetId ?? 'Hors projet'],
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
            <CardHeader title="Équipe" />
            <CardBody className="flex flex-col gap-3">
              <div>
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Responsable</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Avatar name={t.responsable} size="sm" />
                  <span className="text-[0.8125rem] font-medium text-ink-900">{t.responsable}</span>
                </div>
              </div>
              <div className="border-t border-ink-100 pt-3">
                <p className="text-2xs font-semibold uppercase tracking-wide text-ink-500">Participants</p>
                {t.participants.length === 0 ? (
                  <p className="mt-1.5 text-[0.8125rem] text-ink-500">Aucun participant.</p>
                ) : (
                  <div className="mt-1.5">
                    <AvatarGroup names={t.participants} max={4} />
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Pièces jointes"
              action={
                <Button size="sm" variant="ghost" onClick={() => toast({ titre: 'Pièce jointe', detail: 'Le dépôt de fichiers passe par l’espace documentaire.', tone: 'neutral' })}>
                  Ajouter
                </Button>
              }
            />
            {t.piecesJointes.length === 0 ? (
              <EmptyState icon={<Paperclip />} title="Aucune pièce jointe" description="Rattachez un devis, un plan ou un compte rendu." compact />
            ) : (
              <ul className="divide-y divide-ink-100">
                {t.piecesJointes.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 px-5 py-2.5">
                    <Paperclip aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-medium text-ink-900">{p.nom}</span>
                      <span className="ac-num block text-xs text-ink-500">
                        {p.taille} · {formatDate(p.ajouteLe)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(false)}
        onConfirm={() => {
          setASupprimer(false)
          void executer(
            () => supprimer(t.id),
            { titre: 'Tâche supprimée', detail: `« ${t.titre} » a été retirée.` },
            () => navigate('/taches/toutes'),
          )
        }}
        title={`Supprimer « ${t.titre} » ?`}
        description={`La tâche, ses ${t.commentaires.length} commentaire(s), sa checklist et son historique seront définitivement supprimés.`}
        confirmLabel="Supprimer définitivement"
      />
      <span className="sr-only" aria-live="polite">{enregistrement ? 'Enregistrement en cours' : ''}</span>
    </Page>
  )
}
