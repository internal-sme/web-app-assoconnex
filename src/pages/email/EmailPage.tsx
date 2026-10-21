import { usePageTitle } from '@/hooks/usePageTitle'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Archive,
  ArchiveRestore,
  ChevronLeft,
  CornerUpLeft,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  RotateCw,
  Send,
  Star,
  Trash2,
} from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Menu } from '@/components/ui/Menu'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Status'
import { EmailNav, EmailOutils } from '@/components/email/EmailNav'
import { FenetreComposition, compositionVide, type ValeursComposition } from '@/components/email/Composition'
import { useEmailInterne } from '@/context/EmailInterneContext'
import { useToast } from '@/context/ToastContext'
import {
  MOI_EMAIL,
  compterNonLus,
  correspondant,
  dossierLabels,
  filsDuDossier,
  formatTaillePJ,
  horodatageMail,
  rattachementLabels,
  type Dossier,
  type Fil,
  type Message,
} from '@/lib/emailInterne'
import { formatDateTime } from '@/lib/utils'

const dossiers: { id: Dossier; icone: typeof Inbox }[] = [
  { id: 'reception', icone: Inbox },
  { id: 'brouillons', icone: Pencil },
  { id: 'envoyes', icone: Send },
  { id: 'archives', icone: Archive },
  { id: 'corbeille', icone: Trash2 },
]

/** Rendu minimal du Markdown produit par l'éditeur. */
function CorpsRendu({ texte }: { texte: string }) {
  if (!texte.trim()) return <p className="text-[0.8125rem] text-ink-500">Message vide.</p>
  return (
    <div className="flex flex-col gap-1.5">
      {texte.split('\n').map((ligne, i) => {
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
        if (!ligne.trim()) return <span key={i} aria-hidden className="h-2" />
        if (puce || numerotee) {
          return (
            <p key={i} className="flex gap-2.5 pl-1 text-[0.8125rem] leading-relaxed text-ink-700">
              <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>{rendu}</span>
            </p>
          )
        }
        return <p key={i} className="text-[0.8125rem] leading-relaxed text-ink-700">{rendu}</p>
      })}
    </div>
  )
}

function MessageLu({ message, onReessayer }: { message: Message; onReessayer: (m: Message) => void }) {
  const de = correspondant(message.expediteurId)
  const destinataires = message.destinatairesIds.map((id) => correspondant(id)?.nom).filter(Boolean)
  const copies = message.copieIds.map((id) => correspondant(id)?.nom).filter(Boolean)

  return (
    <article className="border-b border-ink-100 px-5 py-4 last:border-0">
      <header className="flex flex-wrap items-start gap-3">
        <Avatar name={de?.nom ?? ''} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-2">
            <span className="text-[0.8125rem] font-semibold text-ink-900">{de?.nom}</span>
            <span className="ac-num text-2xs text-ink-500">{formatDateTime(message.quand)}</span>
            {message.important && <StatusBadge status="mail_important" />}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">
            À {destinataires.join(', ') || '—'}
            {copies.length > 0 && ` · copie : ${copies.join(', ')}`}
            {message.copieCacheeIds.length > 0 && message.expediteurId === MOI_EMAIL && ` · ${message.copieCacheeIds.length} en copie cachée`}
          </p>
        </div>
      </header>

      <div className="mt-3 pl-11">
        <CorpsRendu texte={message.corps} />

        {message.piecesJointes.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {message.piecesJointes.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5">
                <Paperclip aria-hidden className="h-3 w-3 shrink-0 text-ink-500" />
                <span className="text-2xs font-medium text-ink-900">{p.nom}</span>
                <span className="ac-num text-[0.5rem] text-ink-500">{formatTaillePJ(p.taille)}</span>
              </li>
            ))}
          </ul>
        )}

        {message.accuseDemande && (
          <p className="mt-3">
            <StatusBadge status={message.accuseRecuLe ? 'mail_accuse_recu' : 'mail_accuse_attente'} />
          </p>
        )}

        {message.statutEnvoi === 'en_cours' && (
          <p className="mt-3 flex items-center gap-1.5 text-2xs text-ink-500">
            <Loader2 aria-hidden className="h-3 w-3 animate-spin" />
            Envoi en cours…
          </p>
        )}

        {message.statutEnvoi === 'echec' && (
          <p className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-danger-100 bg-danger-50 px-2.5 py-2 text-2xs text-danger-700">
            <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
            Ce message n'est pas parti.
            <Button size="sm" variant="ghost" onClick={() => onReessayer(message)} iconLeft={<RotateCw aria-hidden className="h-3 w-3" />}>
              Réessayer
            </Button>
          </p>
        )}
      </div>
    </article>
  )
}

export function EmailPage() {
  usePageTitle('Messagerie interne')

  const { filId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    messages, chargement, erreur, recharger,
    marquerLu, basculerImportant, deplacer, supprimerDefinitivement, viderCorbeille, reessayer,
  } = useEmailInterne()

  const [dossier, setDossier] = useState<Dossier>('reception')
  const [composition, setComposition] = useState<ValeursComposition | null>(null)
  const [aSupprimer, setASupprimer] = useState<Fil | null>(null)
  const [viderOuvert, setViderOuvert] = useState(false)
  const [enCours, setEnCours] = useState(false)

  const fils = useMemo(() => filsDuDossier(dossier, messages), [dossier, messages])
  const fil = fils.find((f) => f.id === filId) ?? null

  useEffect(() => {
    if (fil && fil.nonLus > 0) marquerLu(fil.id, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fil?.id])

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

  const enTete = (
    <PageHeader
      eyebrow="Email interne"
      title="Messages"
      description="Les échanges écrits entre membres de l'association, rattachables à un adhérent, une facture ou un document."
      actions={
        <>
          <EmailOutils />
          <Button variant="primary" onClick={() => setComposition(compositionVide)} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
            Nouveau message
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <EmailNav />
        <Alert tone="danger" titre="La boîte n'a pas pu être chargée" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur} Aucun message n'a été perdu.
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={enTete}>
        <EmailNav />
        <div className="grid gap-4 lg:grid-cols-[13rem_20rem_minmax(0,1fr)]">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3">
              {Array.from({ length: 5 }).map((_, k) => (
                <Skeleton key={k} className="mb-2 h-9 w-full" />
              ))}
            </Card>
          ))}
        </div>
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <EmailNav />

      <div className="grid gap-4 lg:grid-cols-[13rem_minmax(0,20rem)_minmax(0,1fr)]">
        {/* Colonne 1 — dossiers */}
        <Card className="h-fit p-2">
          <ul className="flex flex-col gap-0.5">
            {dossiers.map((d) => {
              const actif = dossier === d.id
              const nombre = d.id === 'reception' ? compterNonLus('reception', messages) : messages.filter((m) => m.dossier === d.id).length
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setDossier(d.id)
                      navigate('/email-interne')
                    }}
                    aria-current={actif ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[0.8125rem] transition-colors',
                      actif ? 'bg-brand-50 font-medium text-brand-800' : 'text-ink-700 hover:bg-ink-100',
                    )}
                  >
                    <d.icone aria-hidden className={cn('h-4 w-4 shrink-0', actif ? 'text-brand-600' : 'text-ink-500')} />
                    <span className="min-w-0 flex-1 truncate">{dossierLabels[d.id]}</span>
                    {nombre > 0 && (
                      <span
                        className={cn(
                          'ac-num flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.5rem] font-bold',
                          d.id === 'reception' ? 'bg-brand-500 text-white' : 'bg-ink-200 text-ink-700',
                        )}
                      >
                        {nombre}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>

          {dossier === 'corbeille' && fils.length > 0 && (
            <div className="mt-2 border-t border-ink-100 pt-2">
              <Button size="sm" variant="ghost" className="w-full text-danger-600" onClick={() => setViderOuvert(true)}>
                Vider la corbeille
              </Button>
            </div>
          )}
        </Card>

        {/* Colonne 2 — liste des fils */}
        <Card className={cn('flex h-[36rem] flex-col overflow-hidden', fil && 'hidden lg:flex')}>
          <header className="flex items-center justify-between border-b border-ink-200 px-4 py-3">
            <h2 className="font-display text-[0.9375rem] font-semibold text-ink-900">{dossierLabels[dossier]}</h2>
            <Badge variant="outline">{fils.length}</Badge>
          </header>

          <div className="ac-scroll flex-1 overflow-y-auto">
            {fils.length === 0 ? (
              <EmptyState
                icon={<Inbox />}
                title={dossier === 'reception' ? 'Boîte vide' : `Aucun message dans « ${dossierLabels[dossier]} »`}
                description={
                  dossier === 'reception'
                    ? 'Aucun message reçu. Les échanges internes de votre association apparaîtront ici.'
                    : 'Rien à afficher dans ce dossier.'
                }
                compact
              />
            ) : (
              <ul className="divide-y divide-ink-100">
                {fils.map((f) => {
                  const actif = f.id === filId
                  const de = correspondant(f.dernier.expediteurId)
                  const nonLu = f.nonLus > 0
                  return (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/email-interne/${f.id}`)}
                        aria-current={actif ? 'true' : undefined}
                        className={cn('flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors', actif ? 'bg-brand-50' : 'hover:bg-ink-25')}
                      >
                        <span className="flex items-center gap-2">
                          {nonLu && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                          <span className={cn('min-w-0 flex-1 truncate text-[0.8125rem]', nonLu ? 'font-semibold text-ink-900' : 'text-ink-700')}>
                            {de?.nom}
                            {f.messages.length > 1 && <span className="ac-num ml-1.5 text-2xs text-ink-500">({f.messages.length})</span>}
                          </span>
                          <span className="ac-num shrink-0 text-[0.5rem] text-ink-500">{horodatageMail(f.dernier.quand)}</span>
                        </span>
                        <span className={cn('truncate text-[0.8125rem]', nonLu ? 'font-medium text-ink-900' : 'text-ink-600')}>
                          {f.objet || '(sans objet)'}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-2xs text-ink-500">{f.dernier.corps.split('\n')[0]}</span>
                          {f.avecPieces && <Paperclip aria-hidden className="h-3 w-3 shrink-0 text-ink-400" />}
                          {f.important && <Star aria-hidden className="h-3 w-3 shrink-0 fill-warning-500 text-warning-500" />}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* Colonne 3 — message lu */}
        <Card className="flex h-[36rem] flex-col overflow-hidden">
          {!fil ? (
            <EmptyState
              icon={<MailOpen />}
              title="Choisissez un message"
              description="Sélectionnez un échange à gauche pour en afficher le contenu."
            />
          ) : (
            <>
              <header className="flex flex-wrap items-center gap-2 border-b border-ink-200 px-4 py-3">
                <Button variant="icon" size="sm" label="Retour à la liste" className="lg:hidden" onClick={() => navigate('/email-interne')}>
                  <ChevronLeft aria-hidden className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-[0.9375rem] font-semibold text-ink-900">{fil.objet || '(sans objet)'}</h2>
                  <p className="ac-num truncate text-xs text-ink-500">
                    {fil.messages.length} message(s) · {fil.participantsIds.map((id) => correspondant(id)?.nom.split(' ')[0]).join(', ')}
                  </p>
                </div>

                <Button
                  variant="icon"
                  size="sm"
                  label={fil.dernier.important ? 'Retirer l’importance' : 'Marquer comme important'}
                  onClick={() => void executer(() => basculerImportant(fil.dernier.id), { titre: 'Message mis à jour', detail: fil.objet })}
                >
                  <Star aria-hidden className={cn('h-4 w-4', fil.important ? 'fill-warning-500 text-warning-500' : 'text-ink-500')} />
                </Button>

                <Menu
                  label={`Actions sur ${fil.objet}`}
                  items={[
                    { label: 'Marquer comme non lu', icon: <Mail />, onSelect: () => marquerLu(fil.id, false) },
                    ...(dossier !== 'archives'
                      ? [{ label: 'Archiver', icon: <Archive />, onSelect: () => void executer(() => deplacer(fil.id, 'archives'), { titre: 'Message archivé', detail: 'Il reste consultable dans les archives.' }, () => navigate('/email-interne')) }]
                      : [{ label: 'Remettre en réception', icon: <ArchiveRestore />, onSelect: () => void executer(() => deplacer(fil.id, 'reception'), { titre: 'Message restauré', detail: 'Il est de retour dans la boîte de réception.' }, () => navigate('/email-interne')) }]),
                    ...(dossier !== 'corbeille'
                      ? [{ label: 'Mettre à la corbeille', icon: <Trash2 />, danger: true, onSelect: () => void executer(() => deplacer(fil.id, 'corbeille'), { titre: 'Message mis à la corbeille', detail: 'Restaurable depuis la corbeille.' }, () => navigate('/email-interne')) }]
                      : [
                          { label: 'Restaurer', icon: <ArchiveRestore />, onSelect: () => void executer(() => deplacer(fil.id, 'reception'), { titre: 'Message restauré', detail: 'Il est de retour dans la boîte de réception.' }, () => navigate('/email-interne')) },
                          { type: 'separator' as const },
                          { label: 'Supprimer définitivement', icon: <Trash2 />, danger: true, onSelect: () => setASupprimer(fil) },
                        ]),
                  ]}
                  trigger={({ toggle, open, ref }) => (
                    <Button ref={ref} variant="icon" size="sm" label="Actions du message" aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                      <span aria-hidden className="text-lg leading-none">⋯</span>
                    </Button>
                  )}
                />
              </header>

              {fil.dernier.rattachement && (
                <div className="border-b border-ink-100 bg-ink-25 px-4 py-2">
                  <button
                    type="button"
                    onClick={() => navigate(fil.dernier.rattachement!.cible)}
                    className="flex items-center gap-2 text-xs text-ink-600 underline-offset-2 hover:text-ink-900 hover:underline"
                  >
                    <Badge variant="outline">{rattachementLabels[fil.dernier.rattachement.type]}</Badge>
                    {fil.dernier.rattachement.libelle}
                  </button>
                </div>
              )}

              <div className="ac-scroll flex-1 overflow-y-auto">
                {fil.messages.map((m) => (
                  <MessageLu
                    key={m.id}
                    message={m}
                    onReessayer={(x) => void executer(() => reessayer(x.id), { titre: 'Message envoyé', detail: 'Il est parti cette fois.' })}
                  />
                ))}
              </div>

              {dossier !== 'corbeille' && (
                <footer className="flex flex-wrap gap-2 border-t border-ink-200 px-4 py-3">
                  <Button
                    variant="primary"
                    size="sm"
                    iconLeft={<CornerUpLeft aria-hidden className="h-3.5 w-3.5" />}
                    onClick={() =>
                      setComposition({
                        ...compositionVide,
                        destinatairesIds: [fil.dernier.expediteurId].filter((id) => id !== MOI_EMAIL),
                        objet: fil.objet.startsWith('Re : ') ? fil.objet : `Re : ${fil.objet}`,
                        filId: fil.id,
                      })
                    }
                  >
                    Répondre
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      setComposition({
                        ...compositionVide,
                        objet: fil.objet.startsWith('Tr : ') ? fil.objet : `Tr : ${fil.objet}`,
                        corps: `\n\n---\nMessage transféré de ${correspondant(fil.dernier.expediteurId)?.nom} :\n\n${fil.dernier.corps}`,
                        piecesJointes: fil.dernier.piecesJointes,
                      })
                    }
                  >
                    Transférer
                  </Button>
                </footer>
              )}
            </>
          )}
        </Card>
      </div>

      {composition && (
        <FenetreComposition
          open
          onClose={() => setComposition(null)}
          valeurs={composition}
          onChange={(v) => setComposition((s) => (s ? { ...s, ...v } : s))}
          titre={composition.filId ? 'Répondre au message' : 'Nouveau message'}
        />
      )}

      <ConfirmDialog
        open={!!aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const f = aSupprimer!
          setASupprimer(null)
          void executer(
            () => supprimerDefinitivement(f.id),
            { titre: 'Message supprimé', detail: 'Il ne peut plus être récupéré.' },
            () => navigate('/email-interne'),
          )
        }}
        title={`Supprimer définitivement « ${aSupprimer?.objet} » ?`}
        description="Le message et ses pièces jointes seront effacés sans retour possible. Il ne restera aucune trace de l'échange."
        confirmLabel="Supprimer définitivement"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          {aSupprimer?.messages.length} message(s) du fil seront perdus.
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={viderOuvert}
        loading={enCours}
        onClose={() => setViderOuvert(false)}
        onConfirm={() => {
          setViderOuvert(false)
          void executer(() => viderCorbeille(), { titre: 'Corbeille vidée', detail: 'Les messages ont été effacés définitivement.' }, () => navigate('/email-interne'))
        }}
        title="Vider la corbeille ?"
        description={`${messages.filter((m) => m.dossier === 'corbeille').length} message(s) seront supprimés sans retour possible.`}
        confirmLabel="Vider définitivement"
      />
    </Page>
  )
}
