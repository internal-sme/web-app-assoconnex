import { usePageTitle } from '@/hooks/usePageTitle'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { UserRound } from 'lucide-react'
import { ContactForm, valider, type ValeursContact } from '@/components/contacts/ContactForm'
import { useContacts } from '@/context/ContactsContext'
import { useToast } from '@/context/ToastContext'
import { toInputDate } from '@/lib/utils'

export function ContactModifier() {
  usePageTitle('Modifier un contact')

  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { parId, modifier, chargement } = useContacts()
  const { toast } = useToast()
  const contact = parId(id)

  const [valeurs, setValeurs] = useState<ValeursContact | null>(null)
  const [erreurs, setErreurs] = useState<ReturnType<typeof valider>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enregistrement, setEnregistrement] = useState(false)

  if (chargement) {
    return (
      <Page header={<PageHeader title="Modifier le contact" />}>
        <Card className="p-5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </Card>
      </Page>
    )
  }

  if (!contact) {
    return (
      <Page header={<PageHeader title="Contact introuvable" />}>
        <Card>
          <EmptyState
            icon={<UserRound />}
            title="Cette fiche n'existe plus"
            description="Elle a peut-être été supprimée depuis un autre onglet."
            action={<Button variant="primary" onClick={() => navigate('/contacts')}>Retour à la liste</Button>}
          />
        </Card>
      </Page>
    )
  }

  const courantes: ValeursContact =
    valeurs ?? {
      civilite: contact.civilite,
      prenom: contact.prenom,
      nom: contact.nom,
      dateNaissance: toInputDate(contact.dateNaissance),
      email: contact.email,
      telephones: contact.telephones,
      adresse: contact.adresse,
      fonction: contact.fonction,
      statut: contact.statut,
      dateEntree: toInputDate(contact.dateEntree),
      qualites: contact.qualites,
      groupes: contact.groupes,
      tags: contact.tags,
      communication: contact.communication,
      notes: contact.notes,
    }

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setErreurGlobale(null)
    const err = valider(courantes)
    setErreurs(err)
    if (Object.keys(err).length > 0) return

    setEnregistrement(true)
    try {
      await modifier(contact.id, { ...courantes, dateEntree: new Date(courantes.dateEntree).toISOString() })
      toast({ titre: 'Modifications enregistrées', detail: `La fiche de ${courantes.prenom} ${courantes.nom} est à jour.`, tone: 'success' })
      navigate(`/contacts/${contact.id}`)
    } catch (error) {
      setErreurGlobale((error as Error).message)
      toast({ titre: 'Enregistrement impossible', detail: (error as Error).message, tone: 'danger' })
    } finally {
      setEnregistrement(false)
    }
  }

  return (
    <Page
      width="narrow"
      header={
        <PageHeader
          eyebrow="Contacts"
          title={`Modifier ${contact.prenom} ${contact.nom}`}
          description="Les changements sont visibles immédiatement sur la fiche et consignés dans l'historique."
          actions={
            <Button onClick={() => navigate(`/contacts/${contact.id}`)} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Retour à la fiche
            </Button>
          }
        />
      }
    >
      <ContactForm
        titre={`${contact.prenom} ${contact.nom}`}
        valeurs={courantes}
        onChange={setValeurs}
        onSubmit={soumettre}
        onCancel={() => navigate(`/contacts/${contact.id}`)}
        enregistrement={enregistrement}
        erreurGlobale={erreurGlobale}
        erreurs={erreurs}
        libelleValider="Enregistrer les modifications"
      />
    </Page>
  )
}
