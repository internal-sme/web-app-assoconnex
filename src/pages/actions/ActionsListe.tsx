import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Eye, Pencil, Plus, RefreshCw, RotateCw, Target, Trash2, Upload, X } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { AvatarGroup } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Status'
import { DataGrid, type Column, type FilterDef } from '@/components/data/DataGrid'
import { ActionsNav, ActionsOutils, cleAvancement } from '@/components/actions/ActionsNav'
import { FormulaireAction, valeursVides, type ValeursAction } from '@/components/actions/FormulaireAction'
import { ListeAssociations } from '@/components/chat/Pieces'
import { useActions } from '@/context/ActionsContext'
import { useProjets } from '@/context/ProjetsContext'
import { useToast } from '@/context/ToastContext'
import { membresChat } from '@/lib/chat'
import {
  avancementDe,
  avancementLabels,
  categoriesAction,
  porteeLabels,
  typesAction,
  villesAction,
  type ActionAssociative,
  type Avancement,
} from '@/lib/actions'
import { formatDate } from '@/lib/utils'

/* --------------------------- Import d'actions --------------------------- */

function ModalImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { televersements, importer, retirerTeleversement } = useActions()
  const [survol, setSurvol] = useState(false)

  const echantillons = [
    { nom: 'Actions-2024.csv', lignes: 38 },
    { nom: 'Actions-2025.csv', lignes: 41 },
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Importer des actions"
      description="Reprenez un historique tenu jusqu'ici sur tableur. Une ligne par action."
      footer={<Button variant="primary" onClick={onClose}>Terminé</Button>}
    >
      <div className="flex flex-col gap-3 py-2">
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setSurvol(true)
          }}
          onDragLeave={() => setSurvol(false)}
          onDrop={(e) => {
            e.preventDefault()
            setSurvol(false)
            const fichiers = Array.from(e.dataTransfer.files).map((f) => ({ nom: f.name, lignes: 20 }))
            importer(fichiers.length > 0 ? fichiers : echantillons)
          }}
          className={cn(
            'rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
            survol ? 'border-brand-500 bg-brand-50' : 'border-ink-300 bg-ink-25',
          )}
        >
          <Upload aria-hidden className={cn('mx-auto h-7 w-7', survol ? 'text-brand-600' : 'text-ink-500')} />
          <p className="mt-2 text-[0.8125rem] font-medium text-ink-900">
            {survol ? 'Relâchez pour importer' : 'Glissez un fichier CSV ici'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-ink-500">
            Colonnes attendues : titre, description, type, catégorie, ville, quartier, adresse, date de l'action.
          </p>
          <div className="mt-4">
            <Button size="sm" onClick={() => importer(echantillons)}>
              Importer un fichier de démonstration
            </Button>
          </div>
        </div>

        {televersements.length > 0 && (
          <ul className="flex flex-col gap-2" aria-live="polite">
            {televersements.map((t) => (
              <li key={t.id} className="flex items-center gap-3 rounded-lg border border-ink-200 bg-white p-3">
                <span
                  aria-hidden
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
                    t.statut === 'termine' && 'border-success-100 bg-success-50 text-success-600',
                    t.statut === 'echec' && 'border-danger-100 bg-danger-50 text-danger-600',
                    t.statut === 'en_cours' && 'border-ink-200 bg-ink-50 text-ink-600',
                  )}
                >
                  {t.statut === 'termine' ? <CheckCircle2 className="h-4 w-4" /> : t.statut === 'echec' ? <AlertTriangle className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.8125rem] font-medium text-ink-900">{t.nom}</p>
                  {t.statut === 'en_cours' && (
                    <>
                      <div
                        role="progressbar"
                        aria-valuenow={t.progression}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Import de ${t.nom}`}
                        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100"
                      >
                        <div className="h-full rounded-full bg-brand-500 transition-[width] duration-200" style={{ width: `${t.progression}%` }} />
                      </div>
                      <p className="ac-num mt-1 text-xs text-ink-500">{t.progression} % · {t.lignes} lignes</p>
                    </>
                  )}
                  {t.statut === 'termine' && <p className="ac-num text-xs text-success-600">{t.lignes} action(s) importées</p>}
                  {t.statut === 'echec' && <p className="text-xs text-danger-600">{t.erreur}</p>}
                </div>
                {t.statut === 'echec' && (
                  <Button size="sm" variant="ghost" onClick={() => importer([{ nom: t.nom, lignes: t.lignes }])} iconLeft={<RotateCw aria-hidden className="h-3.5 w-3.5" />}>
                    Réessayer
                  </Button>
                )}
                <Button variant="icon" size="sm" label={`Retirer ${t.nom}`} onClick={() => retirerTeleversement(t.id)}>
                  <X aria-hidden className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}

/* ------------------------------ La liste ------------------------------- */

export function ActionsListe() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const { actions, chargement, erreur, recharger, creer, supprimer } = useActions()
  const { projets } = useProjets()

  const [formOuvert, setFormOuvert] = useState(false)
  const [valeurs, setValeurs] = useState<ValeursAction>(valeursVides)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [enCours, setEnCours] = useState(false)
  const [importOuvert, setImportOuvert] = useState(false)
  const [aSupprimer, setASupprimer] = useState<ActionAssociative | null>(null)
  const [confirmation, setConfirmation] = useState<ActionAssociative | null>(null)

  // Le tableau de bord peut demander l'ouverture directe du formulaire
  useEffect(() => {
    if (params.get('nouvelle') === '1') {
      setValeurs(valeursVides)
      setFormOuvert(true)
      setParams({})
    }
  }, [params, setParams])

  const nomMembre = (id: string) => membresChat.find((m) => m.id === id)?.nom ?? id

  const columns: Column<ActionAssociative>[] = [
    {
      id: 'visuel',
      header: 'Visuel',
      width: '4rem',
      cell: (r) => (
        <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-ink-25 text-base">
          {r.visuel}
        </span>
      ),
    },
    {
      id: 'titre',
      header: 'Titre de l’action',
      sortValue: (r) => r.titre,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.titre}</p>
          <p className="ac-num truncate text-xs text-ink-500">
            {typesAction.find((t) => t.id === r.typeId)?.nom} · {categoriesAction.find((c) => c.id === r.categorieId)?.nom}
          </p>
        </div>
      ),
    },
    {
      id: 'avancement',
      header: 'Avancement',
      sortValue: (r) => avancementDe(r),
      cell: (r) => (
        <span className="flex flex-col items-start gap-1">
          <StatusBadge status={cleAvancement[avancementDe(r)]} />
          <span className="ac-num text-2xs text-ink-500">{formatDate(r.date)}</span>
        </span>
      ),
    },
    {
      id: 'publication',
      header: 'Publication',
      sortValue: (r) => (r.publiee ? 'a' : 'b'),
      cell: (r) => <StatusBadge status={r.publiee ? 'action_publiee' : 'action_brouillon'} />,
    },
    {
      id: 'participants',
      header: 'Participants',
      cell: (r) =>
        r.participantsIds.length === 0 ? (
          <span className="text-xs text-ink-500">—</span>
        ) : (
          <AvatarGroup names={r.participantsIds.map(nomMembre)} max={4} />
        ),
    },
    {
      id: 'portee',
      header: 'Portée',
      optional: true,
      sortValue: (r) => r.portee,
      cell: (r) => <StatusBadge status={r.portee === 'partenariat' ? 'action_partenariat' : 'action_seule'} />,
    },
    { id: 'ville', header: 'Ville', optional: true, defaultHidden: true, sortValue: (r) => r.ville, cell: (r) => `${r.ville}${r.quartier ? ` · ${r.quartier}` : ''}` },
  ]

  const filters: FilterDef<ActionAssociative>[] = [
    {
      id: 'avancement',
      label: 'Avancement',
      options: (Object.keys(avancementLabels) as Avancement[]).map((a) => ({ value: a, label: avancementLabels[a] })),
      match: (r, v) => avancementDe(r) === v,
    },
    {
      id: 'publication',
      label: 'Publication',
      options: [
        { value: 'oui', label: 'Publiée sur l’application' },
        { value: 'non', label: 'Non publiée' },
      ],
      match: (r, v) => (v === 'oui' ? r.publiee : !r.publiee),
    },
    { id: 'type', label: 'Type', options: typesAction.map((t) => ({ value: t.id, label: t.nom })), match: (r, v) => r.typeId === v },
    { id: 'categorie', label: 'Catégorie', options: categoriesAction.map((c) => ({ value: c.id, label: c.nom })), match: (r, v) => r.categorieId === v },
    { id: 'ville', label: 'Ville', options: villesAction.map((v) => ({ value: v, label: v })), match: (r, v) => r.ville === v },
    {
      id: 'portee',
      label: 'Portée',
      options: (['seule', 'partenariat'] as const).map((p) => ({ value: p, label: porteeLabels[p] })),
      match: (r, v) => r.portee === v,
    },
  ]

  const valider = () => {
    const e: Record<string, string> = {}
    if (!valeurs.titre.trim()) e.titre = 'Donnez un titre à l’action.'
    if (!valeurs.date) e.date = 'Indiquez la date de l’action.'
    if (valeurs.portee === 'partenariat' && valeurs.associationsIds.filter((x) => x !== 'org-1').length === 0) {
      e.associations = 'Désignez au moins une association de la ville.'
    }
    setErreurs(e)
    return Object.keys(e).length === 0
  }

  const enregistrer = async () => {
    if (!valider()) return
    setEnCours(true)
    try {
      const creee = await creer({
        ...valeurs,
        date: new Date(valeurs.date).toISOString(),
        projetId: valeurs.projetId || null,
      })
      setFormOuvert(false)
      setConfirmation(creee)
    } catch (err) {
      toast({ titre: 'Création impossible', detail: (err as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const enTete = (
    <PageHeader
      eyebrow="Actions associatives"
      title="Actions"
      description="Le registre de ce que l'association a mené, seule ou avec les associations de la ville."
      meta={<Badge variant="brand">{actions.length} actions</Badge>}
      actions={
        <>
          <ActionsOutils />
          <Button onClick={() => setImportOuvert(true)} iconLeft={<Upload aria-hidden className="h-4 w-4" />}>
            Importer
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setValeurs(valeursVides)
              setErreurs({})
              setFormOuvert(true)
            }}
            iconLeft={<Plus aria-hidden className="h-4 w-4" />}
          >
            Ajouter une action
          </Button>
        </>
      }
    />
  )

  if (erreur && !chargement) {
    return (
      <Page header={enTete}>
        <ActionsNav />
        <Alert tone="danger" titre="Les actions n'ont pas pu être chargées" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (!chargement && actions.length === 0) {
    return (
      <Page header={enTete}>
        <ActionsNav />
        <Card>
          <EmptyState
            icon={<Target />}
            title="Aucune action enregistrée"
            description="Ajoutez votre première action, ou importez un historique tenu jusqu'ici sur tableur."
            action={
              <Button variant="primary" onClick={() => { setValeurs(valeursVides); setFormOuvert(true) }} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Ajouter une action
              </Button>
            }
            secondaryAction={<Button onClick={() => setImportOuvert(true)}>Importer un fichier</Button>}
          />
        </Card>
        <ModalImport open={importOuvert} onClose={() => setImportOuvert(false)} />
      </Page>
    )
  }

  return (
    <Page header={enTete}>
      <ActionsNav />

      {actions.some((a) => a.annulee) && (
        <Alert tone="warning" titre={`${actions.filter((a) => a.annulee).length} action(s) annulée(s)`}>
          Une action annulée est retirée de l'application mobile et n'entre plus dans les bilans d'activité.
        </Alert>
      )}

      <DataGrid
        rows={actions}
        columns={columns}
        filters={filters}
        loading={chargement}
        caption="Actions associatives"
        searchKeys={(r) => `${r.titre} ${r.reference} ${r.ville} ${r.quartier} ${r.description}`}
        searchPlaceholder="Rechercher un titre, une ville, un quartier…"
        getRowLabel={(r) => r.titre}
        onRowClick={(r) => navigate(`/actions/${r.id}`)}
        emptyIcon={<Target />}
        emptyTitle="Aucune action ne correspond"
        emptyDescription="Élargissez la recherche ou retirez un filtre."
        rowActions={[
          { label: 'Ouvrir la fiche', icon: <Eye />, onSelect: (r) => navigate(`/actions/${r.id}`) },
          { label: 'Modifier', icon: <Pencil />, onSelect: (r) => navigate(`/actions/${r.id}?modifier=1`) },
          { label: 'Supprimer', icon: <Trash2 />, danger: true, onSelect: (r) => setASupprimer(r) },
        ]}
      />

      <FormulaireAction
        open={formOuvert}
        onClose={() => setFormOuvert(false)}
        titre="Création d'une action"
        valeurs={valeurs}
        onChange={(v) => setValeurs((s) => ({ ...s, ...v }))}
        erreurs={erreurs}
        projets={projets.map((p) => ({ id: p.id, code: p.code, nom: p.nom }))}
        onValider={() => void enregistrer()}
        libelleValider="Créer l'action"
        enCours={enCours}
      />

      <ModalImport open={importOuvert} onClose={() => setImportOuvert(false)} />

      {/* Confirmation de publication */}
      <Modal
        open={!!confirmation}
        onClose={() => setConfirmation(null)}
        size="sm"
        title=""
        footer={
          <>
            <Button
              onClick={() => {
                const a = confirmation!
                setConfirmation(null)
                navigate(`/actions/${a.id}`)
              }}
            >
              Voir l'action
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirmation(null)
                setValeurs(valeursVides)
                setErreurs({})
                setFormOuvert(true)
              }}
            >
              Créer une action
            </Button>
          </>
        }
      >
        {confirmation && (
          <div className="flex flex-col gap-3 py-2">
            <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-600">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink-950">Action créée avec succès</h2>
            <p className="text-[0.8125rem] leading-relaxed text-ink-600">
              {confirmation.publiee
                ? 'Cette action a été publiée sur l’application mobile. Les membres de l’équipe et le public peuvent la voir.'
                : 'Cette action est enregistrée sans être publiée. Elle reste invisible du public tant que vous ne l’avez pas publiée depuis sa fiche.'}
            </p>
            {confirmation.publiee && (
              <p className="rounded-lg border border-ink-200 bg-ink-25 p-2.5 text-xs text-ink-600">
                Bouton affiché au public :{' '}
                <span className="font-medium text-ink-900">{typesAction.find((t) => t.id === confirmation.typeId)?.callToAction}</span>
              </p>
            )}
            {confirmation.portee === 'partenariat' && <ListeAssociations ids={confirmation.associationsIds} />}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const a = aSupprimer!
          setASupprimer(null)
          setEnCours(true)
          void supprimer(a.id)
            .then(() => toast({ titre: 'Action supprimée', detail: `« ${a.titre} » a été retirée du registre.`, tone: 'success' }))
            .catch((e) => toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' }))
            .finally(() => setEnCours(false))
        }}
        title={`Supprimer « ${aSupprimer?.titre} » ?`}
        description="L'action disparaît du registre, de l'application mobile et des bilans d'activité. Si l'action a eu lieu, préférez la conserver : elle fait mémoire pour le rapport annuel."
        confirmLabel="Supprimer définitivement"
      />
    </Page>
  )
}
