import { usePageTitle } from '@/hooks/usePageTitle'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { ContactForm, valeursVides, valider, type ValeursContact } from '@/components/contacts/ContactForm'
import { useContacts } from '@/context/ContactsContext'
import { useToast } from '@/context/ToastContext'

export function ContactNouveau() {
  usePageTitle('Nouveau contact')

  const navigate = useNavigate()
  const { creer } = useContacts()
  const { toast } = useToast()

  const [valeurs, setValeurs] = useState<ValeursContact>(valeursVides)
  const [erreurs, setErreurs] = useState<ReturnType<typeof valider>>({})
  const [erreurGlobale, setErreurGlobale] = useState<string | null>(null)
  const [enregistrement, setEnregistrement] = useState(false)

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setErreurGlobale(null)
    const err = valider(valeurs)
    setErreurs(err)
    if (Object.keys(err).length > 0) return

    setEnregistrement(true)
    try {
      const contact = await creer({
        ...valeurs,
        dateEntree: new Date(valeurs.dateEntree).toISOString(),
      })
      toast({
        titre: 'Contact créé',
        detail: `${contact.prenom} ${contact.nom} a été ajouté à la base.`,
        tone: 'success',
      })
      navigate(`/contacts/${contact.id}`)
    } catch (error) {
      setErreurGlobale((error as Error).message)
      toast({ titre: 'Création impossible', detail: (error as Error).message, tone: 'danger' })
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
          title="Nouveau contact"
          description="Seuls le nom, le prénom, l'e-mail et la date d'entrée sont obligatoires. Tout le reste peut être complété plus tard depuis la fiche."
          actions={
            <Button onClick={() => navigate('/contacts')} iconLeft={<ArrowLeft aria-hidden className="h-4 w-4" />}>
              Retour à la liste
            </Button>
          }
        />
      }
    >
      <ContactForm
        titre="Nouveau contact"
        valeurs={valeurs}
        onChange={setValeurs}
        onSubmit={soumettre}
        onCancel={() => navigate('/contacts')}
        enregistrement={enregistrement}
        erreurGlobale={erreurGlobale}
        erreurs={erreurs}
        libelleValider="Créer le contact"
      />
    </Page>
  )
}
