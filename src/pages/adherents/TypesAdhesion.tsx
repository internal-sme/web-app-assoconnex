import { usePageTitle } from '@/hooks/usePageTitle'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Plus, Settings2, Trash2 } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Field } from '@/components/ui/Field'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Toggle'
import { Menu } from '@/components/ui/Menu'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatusBadge } from '@/components/ui/Status'
import { useAdherents } from '@/context/AdherentsContext'
import { useToast } from '@/context/ToastContext'
import type { TypeAdhesion } from '@/lib/adherents'
import { formatMoney } from '@/lib/utils'

const vide: Omit<TypeAdhesion, 'id'> = {
  nom: '',
  description: '',
  montant: 0,
  dureeMois: 12,
  publicVise: 'Adulte',
  actif: true,
  reconduction: true,
}

export function TypesAdhesion() {
  usePageTitle("Types d'adhésion")

  const navigate = useNavigate()
  const { toast } = useToast()
  const { types, compterType, creerType, modifierType, supprimerType } = useAdherents()

  const [form, setForm] = useState<{ mode: 'creer' | 'modifier'; id?: string } | null>(null)
  const [valeurs, setValeurs] = useState<Omit<TypeAdhesion, 'id'>>(vide)
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [aSupprimer, setASupprimer] = useState<TypeAdhesion | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)

  const ouvrir = (mode: 'creer' | 'modifier', t?: TypeAdhesion) => {
    setErreurs({})
    setErreurGlobale(null)
    setValeurs(t ? { ...t } : vide)
    setForm({ mode, id: t?.id })
  }

  const executer = async (fn: () => Promise<void>, succes: { titre: string; detail: string }, fermer?: () => void) => {
    setEnCours(true)
    setErreurGlobale(null)
    try {
      await fn()
      toast({ ...succes, tone: 'success' })
      fermer?.()
    } catch (e) {
      setErreurGlobale((e as Error).message)
      toast({ titre: 'Action impossible', detail: (e as Error).message, tone: 'danger' })
    } finally {
      setEnCours(false)
    }
  }

  const enregistrer = () => {
    const e: Record<string, string> = {}
    if (!valeurs.nom.trim()) e.nom = 'Indiquez le nom de la formule.'
    if (valeurs.montant <= 0) e.montant = 'Le montant doit être supérieur à zéro.'
    if (valeurs.dureeMois <= 0) e.dureeMois = 'La durée doit être d’au moins un mois.'
    setErreurs(e)
    if (Object.keys(e).length > 0) return

    const f = form!
    void executer(
      () => (f.mode === 'creer' ? creerType(valeurs) : modifierType(f.id!, valeurs)),
      {
        titre: f.mode === 'creer' ? 'Type d’adhésion créé' : 'Type d’adhésion mis à jour',
        detail: `« ${valeurs.nom} » est disponible dans les formulaires d’adhésion.`,
      },
      () => setForm(null),
    )
  }

  const set = <K extends keyof Omit<TypeAdhesion, 'id'>>(k: K, v: Omit<TypeAdhesion, 'id'>[K]) =>
    setValeurs((s) => ({ ...s, [k]: v }))

  return (
    <Page
      header={
        <PageHeader
          eyebrow="Adhésions"
          title="Types d'adhésion"
          description="Les formules proposées lors d'une adhésion ou d'un renouvellement. Une formule suspendue reste visible sur les adhésions existantes mais n'est plus proposée."
          actions={
            <>
              <Button onClick={() => navigate('/adherents')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
                Tableau de bord
              </Button>
              <Button variant="primary" onClick={() => navigate('/adherents/types/nouveau')} iconLeft={<Plus aria-hidden className="h-4 w-4" />}>
                Nouveau type
              </Button>
            </>
          }
        />
      }
    >
      <Card>
        <CardHeader title="Formules" description={`${types.length} formule(s), dont ${types.filter((t) => t.actif).length} active(s).`} />
        {types.length === 0 ? (
          <EmptyState
            icon={<Settings2 />}
            title="Aucun type d'adhésion"
            description="Créez au moins une formule pour pouvoir enregistrer des adhésions."
            compact
            action={<Button variant="primary" onClick={() => navigate('/adherents/types/nouveau')}>Créer une formule</Button>}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {types.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-900">
                    {t.nom}
                    <StatusBadge status={t.actif ? 'actif' : 'archive'} />
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-500">{t.description}</p>
                </div>
                <Badge variant="outline">{t.publicVise}</Badge>
                <Badge variant="outline">{t.reconduction ? 'Reconduction tacite' : 'Sans reconduction'}</Badge>
                <span className="ac-num w-24 text-right text-[0.8125rem] font-semibold text-ink-900">
                  {formatMoney(t.montant)}
                </span>
                <span className="ac-num w-20 text-right text-[0.8125rem] text-ink-500">{t.dureeMois} mois</span>
                <Badge>{compterType(t.id)} adhérents</Badge>
                <Menu
                  label={`Actions sur la formule ${t.nom}`}
                  items={[
                    { label: 'Modifier', icon: <Pencil />, onSelect: () => navigate(`/adherents/types/${t.id}/modifier`) },
                    {
                      label: t.actif ? 'Suspendre la formule' : 'Réactiver la formule',
                      icon: <Settings2 />,
                      onSelect: () =>
                        void executer(() => modifierType(t.id, { actif: !t.actif }), {
                          titre: t.actif ? 'Formule suspendue' : 'Formule réactivée',
                          detail: t.actif
                            ? `« ${t.nom} » n’est plus proposée dans les nouveaux formulaires.`
                            : `« ${t.nom} » est de nouveau proposée.`,
                        }),
                    },
                    { type: 'separator' },
                    { label: 'Supprimer', icon: <Trash2 />, danger: true, onSelect: () => setASupprimer(t) },
                  ]}
                  trigger={({ toggle, open, ref }) => (
                    <Button ref={ref} variant="icon" size="sm" label={`Actions sur ${t.nom}`} aria-expanded={open} aria-haspopup="menu" onClick={toggle}>
                      <span aria-hidden className="text-base leading-none">⋯</span>
                    </Button>
                  )}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>


      <ConfirmDialog
        open={!!aSupprimer}
        onClose={() => setASupprimer(null)}
        onConfirm={() => {
          const t = aSupprimer!
          setASupprimer(null)
          void executer(() => supprimerType(t.id), {
            titre: 'Type d’adhésion supprimé',
            detail: `« ${t.nom} » n’est plus proposé.`,
          })
        }}
        title={`Supprimer la formule « ${aSupprimer?.nom} » ?`}
        description={`${compterType(aSupprimer?.id ?? '')} adhérent(s) utilisent cette formule. Leurs adhésions en cours sont conservées mais la formule ne sera plus proposée ni modifiable.`}
        confirmLabel="Supprimer la formule"
      >
        <div className="rounded-lg border border-warning-100 bg-warning-50 p-3 text-[0.8125rem] text-warning-700">
          Pour retirer une formule sans perdre l’information, préférez la suspendre : elle reste lisible sur les
          adhésions passées.
        </div>
      </ConfirmDialog>
    </Page>
  )
}
