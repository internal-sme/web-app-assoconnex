import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ArrowRight, Hammer } from 'lucide-react'
import { Page, PageHeader } from '@/components/layout/PageLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

export type FicheModule = {
  titre: string
  eyebrow: string
  description: string
  /** Ce que le module fera une fois construit. */
  perimetre: string[]
  /** Modules déjà livrés sur lesquels il s'appuiera. */
  appuis: { label: string; to: string }[]
}

/**
 * Page d'attente pour les modules déclarés dans la navigation mais pas encore
 * construits. Elle annonce le périmètre plutôt que de renvoyer vers une page morte.
 */
export function ModuleAVenir({ fiche }: { fiche: FicheModule }) {
  const navigate = useNavigate()

  return (
    <Page
      header={
        <PageHeader
          eyebrow={fiche.eyebrow}
          title={fiche.titre}
          description={fiche.description}
          meta={<Badge variant="outline">Module non construit</Badge>}
        />
      }
    >
      <Card>
        <EmptyState
          icon={<Hammer />}
          title="Ce module n'est pas encore construit"
          description="Il figure dans la navigation pour que la structure du produit soit lisible dès maintenant. Les écrans viendront s'y brancher sans rien déplacer."
          action={<Button variant="primary" onClick={() => navigate('/')}>Retour au tableau de bord</Button>}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Périmètre prévu" description="Ce que le module couvrira." />
          <CardBody>
            <ul className="flex flex-col gap-2 text-[0.8125rem] leading-relaxed text-ink-700">
              {fiche.perimetre.map((p) => (
                <li key={p} className="flex gap-2.5">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {p}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Sur quoi il s'appuiera" description="Modules déjà livrés dont il réutilisera les données." />
          <CardBody className="flex flex-col gap-2">
            {fiche.appuis.length === 0 ? (
              <p className="text-[0.8125rem] text-ink-500">Ce module sera autonome.</p>
            ) : (
              fiche.appuis.map((a) => (
                <button
                  key={a.to}
                  type="button"
                  onClick={() => navigate(a.to)}
                  className="flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-left text-[0.8125rem] text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-25"
                >
                  <span className="flex-1">{a.label}</span>
                  <ArrowRight aria-hidden className="h-3.5 w-3.5 text-ink-500" />
                </button>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </Page>
  )
}

export const fichesModules: Record<string, FicheModule> = {
  'campagnes-emailing': {
    eyebrow: 'Campagne d’emailing',
    titre: 'Campagne d’emailing',
    description:
      "Les envois groupés aux adhérents et aux contacts, dans le respect des consentements déjà enregistrés. À distinguer de l'email interne, qui traite l'échange individuel.",
    perimetre: [
      'Composition à partir de modèles réutilisables.',
      'Segments construits sur les groupes, tags et statuts d’adhésion.',
      'Respect strict des préférences de communication par contact.',
      'Suivi des ouvertures, des clics et des désinscriptions.',
      'Programmation et envoi de test.',
    ],
    appuis: [
      { label: 'Contacts — segments, groupes et consentements', to: '/contacts' },
      { label: 'Adhérents — relances de cotisation', to: '/adherents' },
    ],
  },
  notifications: {
    eyebrow: 'Notifications',
    titre: 'Notifications',
    description: "Le centre de notifications et le réglage de ce que chacun souhaite recevoir, et par quel canal.",
    perimetre: [
      'Fil des notifications, lues et non lues, avec filtres par module.',
      'Réglage par type d’événement et par canal : application, e-mail, résumé quotidien.',
      'Règles d’équipe : qui est prévenu de quoi.',
      'Rappels programmés sur les échéances.',
    ],
    appuis: [
      { label: 'Tâches — échéances et changements de statut', to: '/taches' },
      { label: 'Signature électronique — relances de signature', to: '/signatures' },
    ],
  },
  inventaire: {
    eyebrow: 'Inventaire',
    titre: 'Inventaire',
    description: "Le matériel de l'association : ce qui existe, où il est, dans quel état et qui l'a emprunté.",
    perimetre: [
      'Fiches matériel avec état, valeur et localisation.',
      'Prêts et retours, avec relance des emprunteurs.',
      'Maintenance et contrôles périodiques.',
      'Rattachement à l’amortissement comptable.',
      'Inventaire annuel avec écarts constatés.',
    ],
    appuis: [
      { label: 'Comptabilité — immobilisations et amortissements', to: '/comptabilite' },
      { label: 'Contacts — les emprunteurs', to: '/contacts' },
    ],
  },
  achats: {
    eyebrow: 'Achats',
    titre: 'Achats',
    description: "Le circuit de la dépense avant qu'elle n'atteigne la comptabilité : demande, validation, commande, réception.",
    perimetre: [
      'Demandes d’achat avec circuit de validation.',
      'Comparaison de devis et choix du fournisseur.',
      'Bons de commande et suivi des réceptions.',
      'Rapprochement de la facture fournisseur avec la commande.',
      'Base fournisseurs partagée avec la facturation.',
    ],
    appuis: [
      { label: 'Comptabilité — écritures d’achat et compte 401', to: '/comptabilite' },
      { label: 'Trésorerie — décaissements prévus', to: '/tresorerie' },
    ],
  },
  rh: {
    eyebrow: 'Ressources humaines',
    titre: 'Ressources humaines',
    description: "Le suivi des salariés et des services civiques : contrats, temps de travail, absences et entretiens.",
    perimetre: [
      'Dossiers du personnel et contrats, avec accès restreint.',
      'Suivi du temps de travail et des heures des bénévoles.',
      'Absences, congés et arrêts, avec validation.',
      'Éléments variables de paie transmis au prestataire.',
      'Entretiens annuels et suivi de formation.',
    ],
    appuis: [
      { label: 'Documents — contrats et bulletins, accès restreint', to: '/documents' },
      { label: 'Notes de frais — remboursements du personnel', to: '/notes-de-frais' },
    ],
  },
}
