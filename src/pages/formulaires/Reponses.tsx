import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, FileQuestion, Inbox, Paperclip, PenLine, RefreshCw, Send, XCircle } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonTable } from '@/components/ui/Skeleton'
import { DataGrid, type Column } from '@/components/data/DataGrid'
import { FormulairePage } from '@/components/formulaires/FormulairePage'
import { useFormulaires } from '@/context/FormulairesContext'
import {
  champVisible,
  typeEffectif,
  type Formulaire,
  type ReponseFormulaire,
} from '@/lib/formulaires'
import { formatDateTime } from '@/lib/utils'

function dureeLisible(s: number) {
  const min = Math.floor(s / 60)
  const sec = s % 60
  return min > 0 ? `${min} min ${sec}s` : `${sec}s`
}

function CorpsReponses({ formulaire }: { formulaire: Formulaire }) {
  const navigate = useNavigate()

  const colonnes: Column<ReponseFormulaire>[] = [
    {
      id: 'repondant',
      header: 'Répondant',
      sortValue: (r) => r.repondant.nom,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-ink-900">{r.repondant.nom}</p>
          <p className="truncate text-xs text-ink-500">{r.repondant.email}</p>
        </div>
      ),
    },
    { id: 'soumise', header: 'Soumise le', sortValue: (r) => r.soumiseLe, cell: (r) => <span className="ac-num">{formatDateTime(r.soumiseLe)}</span> },
    { id: 'duree', header: 'Durée', align: 'right', optional: true, sortValue: (r) => r.dureeSecondes, cell: (r) => <span className="ac-num">{dureeLisible(r.dureeSecondes)}</span> },
  ]

  if (formulaire.reponses.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Inbox />}
          title="Aucune réponse pour l’instant"
          description={
            formulaire.statut === 'brouillon'
              ? 'Publiez le formulaire pour commencer à recevoir des réponses.'
              : 'Partagez le lien public pour recevoir vos premières réponses.'
          }
          action={
            <Button variant="primary" onClick={() => navigate(`/formulaires/${formulaire.id}/publication`)} iconLeft={<Send aria-hidden className="h-4 w-4" />}>
              Ouvrir la publication
            </Button>
          }
        />
      </Card>
    )
  }

  return (
    <>
      <p className="text-xs text-ink-500">L’export des réponses sera proposé dans une prochaine version.</p>
      <DataGrid
        rows={formulaire.reponses}
        columns={colonnes}
        caption="Réponses au formulaire"
        searchKeys={(r) => `${r.repondant.nom} ${r.repondant.email}`}
        searchPlaceholder="Rechercher un répondant…"
        getRowLabel={(r) => r.repondant.nom}
        onRowClick={(r) => navigate(`/formulaires/${formulaire.id}/reponses/${r.id}`)}
        emptyIcon={<Inbox />}
        emptyTitle="Aucune réponse ne correspond"
        emptyDescription="Élargissez la recherche."
        rowActions={[{ label: 'Voir le détail', icon: <ArrowRight />, onSelect: (r) => navigate(`/formulaires/${formulaire.id}/reponses/${r.id}`) }]}
      />
    </>
  )
}

export function FormulaireReponses() {
  return <FormulairePage eyebrow="Formulaires">{(f) => <CorpsReponses formulaire={f} />}</FormulairePage>
}

/* ------------------------------ Réponse individuelle ------------------------------ */

function ValeurChamp({ type, valeur }: { type: string; valeur: string }) {
  if (type === 'consentement') {
    const accepte = valeur === 'oui'
    return (
      <span className={`inline-flex items-center gap-1.5 text-[0.8125rem] font-medium ${accepte ? 'text-success-600' : 'text-danger-600'}`}>
        {accepte ? <CheckCircle2 aria-hidden className="h-4 w-4" /> : <XCircle aria-hidden className="h-4 w-4" />}
        {accepte ? 'Accepté' : 'Refusé'}
      </span>
    )
  }
  if (type === 'signature') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-success-600">
        <PenLine aria-hidden className="h-4 w-4" />
        Signature apposée
      </span>
    )
  }
  if (type === 'fichier') {
    return (
      <Badge variant="outline">
        <Paperclip aria-hidden className="h-3 w-3" />
        {valeur}
      </Badge>
    )
  }
  return <span className="whitespace-pre-line text-[0.8125rem] text-ink-800">{valeur}</span>
}

/**
 * Écran autonome (pas de FormulairePage) : son en-tête porte le nom du
 * répondant, pas le titre du formulaire, et il n'affiche pas les onglets.
 */
export function FormulaireReponseDetail() {
  const { id = '', reponseId = '' } = useParams()
  const navigate = useNavigate()
  const { formulaireParId, chargement, erreur, recharger } = useFormulaires()
  const formulaire = formulaireParId(id)

  const retour = (
    <Button onClick={() => navigate(`/formulaires/${id}/reponses`)} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
      Retour aux réponses
    </Button>
  )

  if (erreur && !chargement) {
    return (
      <Page header={<PageHeader eyebrow="Formulaires" title="Réponse" actions={retour} />}>
        <Alert tone="danger" titre="Chargement impossible" action={<Button onClick={recharger} iconLeft={<RefreshCw aria-hidden className="h-4 w-4" />}>Réessayer</Button>}>
          {erreur}
        </Alert>
      </Page>
    )
  }

  if (chargement) {
    return (
      <Page header={<PageHeader eyebrow="Formulaires" title="Chargement…" actions={retour} />}>
        <Card>
          <SkeletonTable rows={4} />
        </Card>
      </Page>
    )
  }

  const reponse = formulaire?.reponses.find((r) => r.id === reponseId)
  const index = formulaire?.reponses.findIndex((r) => r.id === reponseId) ?? -1

  if (!formulaire || !reponse) {
    return (
      <Page header={<PageHeader eyebrow="Formulaires" title="Réponse introuvable" actions={retour} />}>
        <Card>
          <EmptyState
            icon={<FileQuestion />}
            title="Cette réponse est introuvable"
            description="Elle a peut-être été supprimée."
            action={retour}
          />
        </Card>
      </Page>
    )
  }

  const precedente = formulaire.reponses[index - 1]
  const suivante = formulaire.reponses[index + 1]

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Formulaires"
          title={reponse.repondant.nom}
          description={`${reponse.repondant.email} · soumise le ${formatDateTime(reponse.soumiseLe)} · ${dureeLisible(reponse.dureeSecondes)}`}
          meta={<Badge variant="brand">Réponse {index + 1} sur {formulaire.reponses.length}</Badge>}
          actions={retour}
        />
      }
    >
      <Card>
        <CardBody className="flex flex-col gap-4">
          {formulaire.champs
            .filter((c) => champVisible(c, reponse.valeurs))
            .map((champ) => {
              if (champ.type === 'section') {
                return (
                  <div key={champ.id} className="border-b border-ink-200 pb-2 pt-3 first:pt-0">
                    <h3 className="font-display text-[0.9375rem] font-semibold text-ink-900">{champ.label}</h3>
                  </div>
                )
              }
              const valeur = reponse.valeurs[champ.id]
              return (
                <div key={champ.id} className="border-b border-ink-100 pb-3 last:border-0">
                  <p className="text-xs font-medium text-ink-500">{champ.label}</p>
                  <div className="mt-1">
                    {valeur === undefined ? (
                      <span className="text-[0.8125rem] text-ink-400">—</span>
                    ) : Array.isArray(valeur) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {valeur.map((v) => (
                          <Badge key={v} variant="outline">{v}</Badge>
                        ))}
                      </div>
                    ) : (
                      <ValeurChamp type={typeEffectif(champ)} valeur={valeur} />
                    )}
                  </div>
                </div>
              )
            })}
        </CardBody>
      </Card>

      <div className="flex justify-between gap-2">
        <Button disabled={!precedente} onClick={() => precedente && navigate(`/formulaires/${id}/reponses/${precedente.id}`)} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
          Réponse précédente
        </Button>
        <Button disabled={!suivante} onClick={() => suivante && navigate(`/formulaires/${id}/reponses/${suivante.id}`)} iconRight={<ArrowRight aria-hidden className="h-4 w-4" />}>
          Réponse suivante
        </Button>
      </div>
    </Page>
  )
}
