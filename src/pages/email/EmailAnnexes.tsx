import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Paperclip, Plus, Search, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/Toggle'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/ui/Avatar'
import { EmailNav, EmailOutils } from '@/components/email/EmailNav'
import { useEmailInterne } from '@/context/EmailInterneContext'
import { useToast } from '@/context/ToastContext'
import { correspondant, correspondants, dossierLabels, horodatageMail, type Dossier } from '@/lib/emailInterne'

/* ------------------------------- Recherche ------------------------------ */

export function RechercheEmail() {
  usePageTitle('Messagerie interne')

  const navigate = useNavigate()
  const { messages } = useEmailInterne()

  const [terme, setTerme] = useState('')
  const [expediteurId, setExpediteurId] = useState('')
  const [dossier, setDossier] = useState('')
  const [avecPieces, setAvecPieces] = useState(false)

  const resultats = messages
    .filter((m) => (expediteurId ? m.expediteurId === expediteurId : true))
    .filter((m) => (dossier ? m.dossier === dossier : true))
    .filter((m) => (avecPieces ? m.piecesJointes.length > 0 : true))
    .filter((m) => {
      const q = terme.trim().toLowerCase()
      if (!q) return false
      return `${m.objet} ${m.corps} ${m.piecesJointes.map((p) => p.nom).join(' ')}`.toLowerCase().includes(q)
    })
    .sort((a, b) => (a.quand < b.quand ? 1 : -1))
    .slice(0, 40)

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Email interne"
          title="Recherche dans les messages"
          description="Cherchez dans tous les dossiers à la fois, y compris la corbeille."
          meta={terme.trim() ? <Badge variant="brand">{resultats.length} résultat(s)</Badge> : undefined}
          actions={<EmailOutils />}
        />
      }
    >
      <EmailNav />

      <Card>
        <CardHeader title="Critères" />
        <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Terme recherché" className="sm:col-span-2">
            {(p) => <Input {...p} type="search" value={terme} onChange={(e) => setTerme(e.target.value)} placeholder="budget, convention, cotisation…" iconLeft={<Search />} />}
          </Field>
          <Field label="Expéditeur">
            {(p) => (
              <Select {...p} value={expediteurId} onChange={(e) => setExpediteurId(e.target.value)} placeholder="Tout le monde" options={correspondants.map((c) => ({ value: c.id, label: c.nom }))} />
            )}
          </Field>
          <Field label="Dossier">
            {(p) => (
              <Select
                {...p}
                value={dossier}
                onChange={(e) => setDossier(e.target.value)}
                placeholder="Tous les dossiers"
                options={(Object.keys(dossierLabels) as Dossier[]).map((d) => ({ value: d, label: dossierLabels[d] }))}
              />
            )}
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <Checkbox checked={avecPieces} onChange={(e) => setAvecPieces(e.target.checked)} label="Seulement les messages avec pièce jointe" />
          </div>
        </CardBody>
      </Card>

      {!terme.trim() ? (
        <Card>
          <EmptyState icon={<Search />} title="Saisissez un terme" description="La recherche porte sur l'objet, le corps du message et le nom des pièces jointes." />
        </Card>
      ) : resultats.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search />}
            title="Aucun message ne correspond"
            description="Élargissez le terme ou retirez un filtre."
            action={<Button variant="primary" onClick={() => { setExpediteurId(''); setDossier(''); setAvecPieces(false) }}>Retirer les filtres</Button>}
          />
        </Card>
      ) : (
        <Card>
          <CardHeader title="Résultats" description="Du plus récent au plus ancien." />
          <ul className="divide-y divide-ink-100">
            {resultats.map((m) => {
              const de = correspondant(m.expediteurId)
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/email-interne/${m.filId}`)}
                    className="flex w-full items-start gap-3 px-5 py-3 text-left transition-colors hover:bg-ink-25"
                  >
                    <Avatar name={de?.nom ?? ''} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.8125rem] font-medium text-ink-900">{de?.nom}</span>
                        <Badge variant="outline">{dossierLabels[m.dossier]}</Badge>
                        <span className="ac-num text-2xs text-ink-500">{horodatageMail(m.quand)}</span>
                      </span>
                      <span className="mt-0.5 block truncate text-[0.8125rem] font-medium text-ink-800">{m.objet || '(sans objet)'}</span>
                      <span className="mt-0.5 block truncate text-xs text-ink-500">{m.corps.split('\n')[0]}</span>
                      {m.piecesJointes.length > 0 && (
                        <span className="mt-1 flex items-center gap-1.5 text-2xs text-ink-500">
                          <Paperclip aria-hidden className="h-3 w-3" />
                          {m.piecesJointes.map((p) => p.nom).join(', ')}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </Page>
  )
}

/* -------------------------------- Modèles ------------------------------- */

export function ModelesEmail() {
  const { toast } = useToast()
  const { modeles, ajouterModele, supprimerModele } = useEmailInterne()
  const [ouvert, setOuvert] = useState(false)
  const [aSupprimer, setASupprimer] = useState<string | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [saisie, setSaisie] = useState({ nom: '', categorie: '', objet: '', corps: '' })

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
          eyebrow="Email interne"
          title="Modèles de message"
          description="Les courriers qui reviennent : relances, convocations, remerciements. Un modèle s'insère depuis la fenêtre de composition."
          meta={<Badge variant="brand">{modeles.length} modèles</Badge>}
          actions={
            <>
              <EmailOutils />
              <Button variant="primary" onClick={() => { setSaisie({ nom: '', categorie: '', objet: '', corps: '' }); setOuvert(true) }} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouveau modèle
              </Button>
            </>
          }
        />
      }
    >
      <EmailNav />

      {modeles.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Aucun modèle"
            description="Enregistrez vos courriers récurrents pour ne plus les réécrire à chaque fois."
            action={<Button variant="primary" onClick={() => setOuvert(true)}>Créer un modèle</Button>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {modeles.map((m) => (
            <Card key={m.id}>
              <CardHeader
                title={m.nom}
                description={m.categorie}
                action={
                  <Button variant="icon" size="sm" label={`Supprimer ${m.nom}`} className="text-ink-500 hover:text-danger-600" onClick={() => setASupprimer(m.id)}>
                    <Trash2 aria-hidden className="h-3.5 w-3.5" />
                  </Button>
                }
              />
              <CardBody className="flex flex-col gap-2">
                <p className="text-[0.8125rem] font-medium text-ink-900">{m.objet}</p>
                <p className="line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-ink-500">{m.corps}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={ouvert}
        onClose={() => setOuvert(false)}
        size="lg"
        title="Nouveau modèle"
        description="Il apparaîtra dans la liste déroulante de la fenêtre de composition."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOuvert(false)} disabled={enCours}>Annuler</Button>
            <Button
              variant="primary"
              loading={enCours}
              disabled={!saisie.nom.trim() || !saisie.objet.trim()}
              onClick={() =>
                void executer(
                  () => ajouterModele({ nom: saisie.nom.trim(), categorie: saisie.categorie.trim() || 'Divers', objet: saisie.objet.trim(), corps: saisie.corps }),
                  { titre: 'Modèle créé', detail: saisie.nom.trim() },
                  () => setOuvert(false),
                )
              }
            >
              Créer le modèle
            </Button>
          </>
        }
      >
        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <Field label="Nom du modèle" required>
            {(p) => <Input {...p} value={saisie.nom} onChange={(e) => setSaisie((s) => ({ ...s, nom: e.target.value }))} placeholder="Relance de cotisation" />}
          </Field>
          <Field label="Catégorie">
            {(p) => <Input {...p} value={saisie.categorie} onChange={(e) => setSaisie((s) => ({ ...s, categorie: e.target.value }))} placeholder="Adhésions" />}
          </Field>
          <Field label="Objet du message" required className="sm:col-span-2">
            {(p) => <Input {...p} value={saisie.objet} onChange={(e) => setSaisie((s) => ({ ...s, objet: e.target.value }))} />}
          </Field>
          <Field label="Corps du message" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={8} value={saisie.corps} onChange={(e) => setSaisie((s) => ({ ...s, corps: e.target.value }))} />}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!aSupprimer}
        loading={enCours}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const id = aSupprimer!
          setASupprimer(null)
          void executer(() => supprimerModele(id), { titre: 'Modèle supprimé', detail: 'Il ne sera plus proposé à la composition.' })
        }}
        title="Supprimer ce modèle ?"
        description="Les messages déjà envoyés à partir de ce modèle ne sont pas affectés."
        confirmLabel="Supprimer"
      />
    </Page>
  )
}
