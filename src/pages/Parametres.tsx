import { useState } from 'react'
import { Building2, CreditCard, Plug, ShieldCheck, Users } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Input, Select } from '@/components/ui/Input'
import { AvatarUpload } from '@/components/ui/Avatar'
import { useOrg } from '@/context/OrgContext'
import { useToast } from '@/context/ToastContext'

const tabs = [
  { id: 'organisation', label: 'Organisation' },
  { id: 'equipe', label: 'Équipe' },
  { id: 'facturation', label: 'Facturation' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'integrations', label: 'Intégrations' },
]

export function Parametres() {
  const [tab, setTab] = useState('organisation')
  const { org } = useOrg()
  const { toast } = useToast()

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Configuration"
          title="Paramètres"
          description="Réglages de l'organisation sélectionnée. Chaque association conserve ses propres paramètres."
        />
      }
    >
      <Tabs items={tabs} value={tab} onChange={setTab} ariaLabel="Sections des paramètres" />

      <div role="tabpanel" aria-label={tabs.find((t) => t.id === tab)?.label}>
        {tab === 'organisation' && (
          <Card>
            <CardHeader
              title="Identité de l'association"
              description="Ces informations apparaissent sur les reçus et les e-mails envoyés aux adhérents."
            />
            <CardBody className="flex flex-col gap-5">
              <AvatarUpload name={org.nom} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom de l'association" required>
                  {(p) => <Input {...p} defaultValue={org.nom} />}
                </Field>
                <Field label="Ville" required>
                  {(p) => <Input {...p} defaultValue={org.ville} />}
                </Field>
                <Field label="Type" hint="Détermine les modèles de documents proposés.">
                  {(p) => (
                    <Select
                      {...p}
                      defaultValue={org.type}
                      options={[
                        { value: 'Association culturelle', label: 'Association culturelle' },
                        { value: 'Club sportif', label: 'Club sportif' },
                        { value: 'Fédération', label: 'Fédération' },
                      ]}
                    />
                  )}
                </Field>
                <Field label="Numéro RNA" hint="Format W suivi de 9 chiffres.">
                  {(p) => <Input {...p} placeholder="W123456789" />}
                </Field>
              </div>
              <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
                <Button variant="ghost">Annuler</Button>
                <Button
                  variant="primary"
                  onClick={() => toast({ titre: 'Modifications enregistrées', detail: `« ${org.nom} » a été mis à jour.`, tone: 'success' })}
                >
                  Enregistrer
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {tab === 'equipe' && (
          <Card>
            <EmptyState
              icon={<Users />}
              title="Un seul membre pour l'instant"
              description="Invitez les membres du bureau et attribuez-leur un rôle une fois le module Équipe activé."
              action={<Button variant="primary">Inviter un membre</Button>}
            />
          </Card>
        )}

        {tab === 'facturation' && (
          <Card>
            <EmptyState
              icon={<CreditCard />}
              title="Aucun moyen de paiement"
              description="Reliez un compte pour encaisser les cotisations et émettre les reçus fiscaux."
              action={<Button variant="primary">Ajouter un moyen de paiement</Button>}
            />
          </Card>
        )}

        {tab === 'securite' && (
          <Card>
            <EmptyState
              icon={<ShieldCheck />}
              title="Sécurité par défaut"
              description="La double authentification et le journal d'activité seront configurables ici."
              action={<Button variant="primary">Activer la double authentification</Button>}
            />
          </Card>
        )}

        {tab === 'integrations' && (
          <Card>
            <EmptyState
              icon={<Plug />}
              title="Aucune intégration connectée"
              description="Comptabilité, e-mailing et billetterie pourront être reliés à AssoConnex."
              action={<Button variant="primary" iconLeft={<Building2 aria-hidden className="h-4 w-4" />}>Parcourir le catalogue</Button>}
            />
          </Card>
        )}
      </div>
    </Page>
  )
}
