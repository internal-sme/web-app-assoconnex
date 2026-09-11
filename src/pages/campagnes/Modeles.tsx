import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, FileText, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Menu } from '@/components/ui/Menu'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field } from '@/components/ui/Field'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { CampNav, CampOutils } from '@/components/campagnes/CampNav'
import { CorpsRendu } from '@/components/campagnes/CorpsRendu'
import { useCampagnes } from '@/context/CampagnesContext'
import { useToast } from '@/context/ToastContext'
import type { ModeleCampagne } from '@/lib/campagnes'

const categories = ['Adhésions', 'Vie associative', 'Événements', 'Bénévolat']

export function Modeles() {
  const navigate = useNavigate()
  const { modeles, chargement, ajouterModele, supprimerModele } = useCampagnes()
  const { toast } = useToast()

  const [creation, setCreation] = useState(false)
  const [apercu, setApercu] = useState<ModeleCampagne | null>(null)
  const [aSupprimer, setASupprimer] = useState<ModeleCampagne | null>(null)
  const [suppression, setSuppression] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [nouveau, setNouveau] = useState({ nom: '', categorie: categories[0], objet: '', previsualisation: '', corps: '' })

  const creer = async () => {
    const e = nouveau.nom.trim() ? null : 'Donnez un nom au modèle.'
    setErreur(e)
    if (e) return
    setEnCours(true)
    try {
      await ajouterModele(nouveau)
      toast({ titre: 'Modèle créé', detail: 'Il est disponible dès maintenant pour composer une campagne.', tone: 'success' })
      setCreation(false)
      setNouveau({ nom: '', categorie: categories[0], objet: '', previsualisation: '', corps: '' })
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement a échoué.")
    } finally {
      setEnCours(false)
    }
  }

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Campagne d’emailing"
          title="Modèles"
          description="Des trames prêtes à l'emploi pour composer rapidement un message cohérent."
          actions={
            <>
              <CampOutils />
              <Button variant="primary" onClick={() => setCreation(true)} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouveau modèle
              </Button>
            </>
          }
        />
      }
    >
      <CampNav />

      <ConfirmDialog
        open={!!aSupprimer}
        onClose={() => setASupprimer(null)}
        onConfirm={async () => {
          if (!aSupprimer) return
          setSuppression(true)
          await supprimerModele(aSupprimer.id)
          setSuppression(false)
          setASupprimer(null)
        }}
        loading={suppression}
        title="Supprimer ce modèle ?"
        description={`« ${aSupprimer?.nom ?? ''} » ne sera plus proposé à la composition. Les campagnes déjà créées conservent leur contenu.`}
        confirmLabel="Supprimer"
      />

      <Modal
        open={creation}
        onClose={() => setCreation(false)}
        title="Nouveau modèle"
        description="Une trame de contenu réutilisable pour vos envois."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreation(false)}>Annuler</Button>
            <Button variant="primary" loading={enCours} onClick={creer}>Créer le modèle</Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {erreur && <p className="rounded-lg border border-danger-100 bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700">{erreur}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom" required>
              {(props) => <Input {...props} value={nouveau.nom} onChange={(e) => setNouveau((n) => ({ ...n, nom: e.target.value }))} placeholder="Ex. Relance de cotisation" />}
            </Field>
            <Field label="Catégorie" hint="Sert à regrouper les modèles dans la liste.">
              {(props) => (
                <Select {...props} value={nouveau.categorie} onChange={(e) => setNouveau((n) => ({ ...n, categorie: e.target.value }))} options={categories.map((c) => ({ value: c, label: c }))} />
              )}
            </Field>
          </div>
          <Field label="Objet" hint="L'objet peut contenir des champs personnalisés, comme {{prenom}}.">
            {(props) => <Input {...props} value={nouveau.objet} onChange={(e) => setNouveau((n) => ({ ...n, objet: e.target.value }))} placeholder="Ex. Votre cotisation pour la saison" />}
          </Field>
          <Field label="Prévisualisation" hint="Le texte affiché sous l'objet dans la liste des messages.">
            {(props) => <Input {...props} value={nouveau.previsualisation} onChange={(e) => setNouveau((n) => ({ ...n, previsualisation: e.target.value }))} />}
          </Field>
          <Field label="Corps du message" hint="Markdown léger : **gras**, *italique*, __souligné__, puces « - » ou « 1. ».">
            {(props) => (
              <Textarea {...props} rows={6} value={nouveau.corps} onChange={(e) => setNouveau((n) => ({ ...n, corps: e.target.value }))} placeholder="Bonjour {{prenom}},&#10;&#10;…" />
            )}
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!apercu}
        onClose={() => setApercu(null)}
        title="Aperçu du modèle"
        description={apercu ? `${apercu.nom} — ${apercu.categorie}` : undefined}
        size="lg"
      >
        {apercu && (
          <div className="flex flex-col gap-4">
            <p className="rounded-xl border border-ink-200 bg-ink-25 px-3 py-2 text-sm font-medium text-ink-800">
              {apercu.objet || 'Sans objet'}
            </p>
            {apercu.previsualisation && <p className="text-[0.8125rem] text-ink-500">{apercu.previsualisation}</p>}
            <CorpsRendu texte={apercu.corps} />
          </div>
        )}
      </Modal>

      {chargement ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="mb-2 h-4 w-32" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-3/4" />
            </Card>
          ))}
        </div>
      ) : modeles.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Aucun modèle"
            description="Créez des trames de contenu pour composer vos campagnes plus vite."
            action={<Button variant="primary" onClick={() => setCreation(true)} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>Créer un modèle</Button>}
          />
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modeles.map((m) => (
            <li key={m.id}>
              <Card className="flex h-full flex-col">
                <CardBody className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0">
                      <Badge variant="outline">{m.categorie}</Badge>
                      <span className="mt-1.5 block truncate font-medium text-ink-900">{m.nom}</span>
                    </span>
                    <Menu
                      label={`Actions pour ${m.nom}`}
                      align="end"
                      items={[
                        { label: 'Aperçu', icon: <Eye aria-hidden className="text-ink-500" />, onSelect: () => setApercu(m) },
                        { type: 'separator' },
                        { label: 'Supprimer', icon: <Trash2 aria-hidden className="text-danger-600" />, danger: true, onSelect: () => setASupprimer(m) },
                      ]}
                      trigger={({ toggle, open, ref }) => (
                        <Button variant="icon" size="sm" ref={ref} label="Actions" onClick={toggle} aria-expanded={open} aria-haspopup="menu">
                          <MoreHorizontal aria-hidden className="h-4 w-4" />
                        </Button>
                      )}
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-relaxed text-ink-600">{m.objet || 'Sans objet'}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">{m.corps.replace(/[#*\n]/g, ' ').replace(/\s+/g, ' ').trim()}</p>
                  <div className="pt-3">
                    <Button size="sm" onClick={() => navigate(`/campagnes-emailing/nouvelle?modele=${m.id}`)} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                      Utiliser ce modèle
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}