import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Dashboard } from '@/pages/Dashboard'
import { ContactsListe } from '@/pages/contacts/ContactsListe'
import { ContactNouveau } from '@/pages/contacts/ContactNouveau'
import { ContactFiche } from '@/pages/contacts/ContactFiche'
import { ContactModifier } from '@/pages/contacts/ContactModifier'
import { GroupesTags } from '@/pages/contacts/GroupesTags'
import { AdherentsDashboard } from '@/pages/adherents/AdherentsDashboard'
import { AdherentsListe } from '@/pages/adherents/AdherentsListe'
import { AdherentFiche } from '@/pages/adherents/AdherentFiche'
import { NouvelleAdhesion } from '@/pages/adherents/NouvelleAdhesion'
import { Renouvellement } from '@/pages/adherents/Renouvellement'
import { NouveauPaiement } from '@/pages/adherents/NouveauPaiement'
import { TypesAdhesion } from '@/pages/adherents/TypesAdhesion'
import { ComptaDashboard } from '@/pages/comptabilite/ComptaDashboard'
import { Journal } from '@/pages/comptabilite/Journal'
import { EcritureFiche } from '@/pages/comptabilite/EcritureFiche'
import { EcritureForm } from '@/pages/comptabilite/EcritureForm'
import { PlanComptable, CompteFiche } from '@/pages/comptabilite/PlanComptable'
import { GrandLivre, Balance } from '@/pages/comptabilite/GrandLivreBalance'
import { Exercices } from '@/pages/comptabilite/Exercices'
import { Rapprochement } from '@/pages/comptabilite/Rapprochement'
import { Pieces } from '@/pages/comptabilite/Pieces'
import { Rapports } from '@/pages/comptabilite/Rapports'
import { FactDashboard } from '@/pages/facturation/FactDashboard'
import { FacturesListe, AvoirsListe } from '@/pages/facturation/FacturesListe'
import { FactureFiche } from '@/pages/facturation/FactureFiche'
import { FactureForm } from '@/pages/facturation/FactureForm'
import { FactureApercu } from '@/pages/facturation/FactureApercu'
import { Clients, Produits, Tarifs, Modeles, NumerotationPage } from '@/pages/facturation/Referentiels'
import { ClientForm, ModeleFactureForm, PrestationForm } from '@/pages/facturation/FormsReferentiels'
import { CompteForm } from '@/pages/tresorerie/CompteForm'
import { TypeAdhesionForm } from '@/pages/adherents/TypeAdhesionForm'
import { Relances, HistoriqueFacturation } from '@/pages/facturation/RelancesHistorique'
import { TresoDashboard } from '@/pages/tresorerie/TresoDashboard'
import { Comptes, CompteFicheTreso } from '@/pages/tresorerie/Comptes'
import { Mouvements, NouvelleTransaction } from '@/pages/tresorerie/Mouvements'
import { RapprochementTreso, Previsionnel, Virements, Categorisation, RapportTreso } from '@/pages/tresorerie/Outils'
import { NdfDashboard } from '@/pages/notesfrais/NdfDashboard'
import { NdfListe } from '@/pages/notesfrais/NdfListe'
import { NdfDetail } from '@/pages/notesfrais/NdfDetail'
import { NdfForm, NdfScan } from '@/pages/notesfrais/NdfForm'
import { NdfHistorique } from '@/pages/notesfrais/NdfHistorique'
import { DocsAccueil } from '@/pages/documents/DocsAccueil'
import { Explorateur } from '@/pages/documents/Explorateur'
import { DocumentFiche } from '@/pages/documents/DocumentFiche'
import { VueDocuments, RechercheDocuments } from '@/pages/documents/Vues'
import { SignDashboard } from '@/pages/signatures/SignDashboard'
import { SignListe, SignHistorique } from '@/pages/signatures/SignListes'
import { SignNouvelle } from '@/pages/signatures/SignNouvelle'
import { SignSuivi } from '@/pages/signatures/SignSuivi'
import { TachesListe } from '@/pages/taches/TachesListe'
import { TacheFiche } from '@/pages/taches/TacheFiche'
import { TacheForm } from '@/pages/taches/TacheForm'
import { ProjetsDashboard } from '@/pages/projets/ProjetsDashboard'
import { ProjetsListe } from '@/pages/projets/ProjetsListe'
import { ProjetNouveau } from '@/pages/projets/ProjetForm'
import { ProjetFiche } from '@/pages/projets/ProjetFiche'
import { AgendaVues } from '@/pages/agenda/AgendaVues'
import { EvenementForm } from '@/pages/agenda/EvenementForm'
import { EvenementFiche } from '@/pages/agenda/EvenementFiche'
import { Disponibilites } from '@/pages/agenda/Disponibilites'
import { Synchronisation } from '@/pages/agenda/Synchronisation'
import { PlanningGrilles } from '@/pages/planning/PlanningGrilles'
import { Affectation } from '@/pages/planning/Affectation'
import { AbsencesPlanning, ConflitsPlanning, DisponibilitesPlanning, RemplacementsPlanning } from '@/pages/planning/Ressources'
import { EmailPage } from '@/pages/email/EmailPage'
import { ModelesEmail, RechercheEmail } from '@/pages/email/EmailAnnexes'
import { ActionsDashboard } from '@/pages/actions/ActionsDashboard'
import { ActionsListe } from '@/pages/actions/ActionsListe'
import { ActionFiche } from '@/pages/actions/ActionFiche'
import { ChatPage } from '@/pages/chat/ChatPage'
import { MentionsChat, NouveauChat, ParametresSalon, RechercheChat } from '@/pages/chat/ChatAnnexes'
import { ListeFormulaires, FormulairesArchives } from '@/pages/formulaires/ListeFormulaires'
import { NouveauFormulaire } from '@/pages/formulaires/NouveauFormulaire'
import { Editeur as FormulaireEditeur } from '@/pages/formulaires/Editeur'
import { Previsualisation as FormulairePrevisualisation } from '@/pages/formulaires/Previsualisation'
import { FormulaireParametres } from '@/pages/formulaires/Parametres'
import { FormulairePublication } from '@/pages/formulaires/Publication'
import { FormulaireReponses, FormulaireReponseDetail } from '@/pages/formulaires/Reponses'
import { FormulaireStatistiques } from '@/pages/formulaires/Statistiques'
import { ModuleAVenir, fichesModules } from '@/pages/ModuleAVenir'
import { Parametres } from '@/pages/Parametres'
import { DesignSystem } from '@/pages/DesignSystem'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />

        <Route path="/contacts" element={<ContactsListe />} />
        <Route path="/contacts/nouveau" element={<ContactNouveau />} />
        <Route path="/contacts/groupes" element={<GroupesTags />} />
        <Route path="/contacts/:id" element={<ContactFiche />} />
        <Route path="/contacts/:id/modifier" element={<ContactModifier />} />

        <Route path="/adherents" element={<AdherentsDashboard />} />
        <Route path="/adherents/liste" element={<AdherentsListe />} />
        <Route path="/adherents/nouveau" element={<NouvelleAdhesion />} />
        <Route path="/adherents/types" element={<TypesAdhesion />} />
        <Route path="/adherents/types/nouveau" element={<TypeAdhesionForm />} />
        <Route path="/adherents/types/:id/modifier" element={<TypeAdhesionForm />} />
        <Route path="/adherents/:id" element={<AdherentFiche />} />
        <Route path="/adherents/:id/renouveler" element={<Renouvellement />} />
        <Route path="/adherents/:id/paiement" element={<NouveauPaiement />} />

        <Route path="/comptabilite" element={<ComptaDashboard />} />
        <Route path="/comptabilite/journal" element={<Journal />} />
        <Route path="/comptabilite/ecritures/nouvelle" element={<EcritureForm mode="creation" />} />
        <Route path="/comptabilite/ecritures/:id" element={<EcritureFiche />} />
        <Route path="/comptabilite/ecritures/:id/modifier" element={<EcritureForm mode="modification" />} />
        <Route path="/comptabilite/plan" element={<PlanComptable />} />
        <Route path="/comptabilite/comptes/:numero" element={<CompteFiche />} />
        <Route path="/comptabilite/grand-livre" element={<GrandLivre />} />
        <Route path="/comptabilite/balance" element={<Balance />} />
        <Route path="/comptabilite/rapprochement" element={<Rapprochement />} />
        <Route path="/comptabilite/pieces" element={<Pieces />} />
        <Route path="/comptabilite/rapports" element={<Rapports />} />
        <Route path="/comptabilite/exercices" element={<Exercices />} />

        <Route path="/facturation" element={<FactDashboard />} />
        <Route path="/facturation/factures" element={<FacturesListe />} />
        <Route path="/facturation/factures/nouvelle" element={<FactureForm mode="creation" />} />
        <Route path="/facturation/factures/:id" element={<FactureFiche />} />
        <Route path="/facturation/factures/:id/modifier" element={<FactureForm mode="modification" />} />
        <Route path="/facturation/factures/:id/apercu" element={<FactureApercu />} />
        <Route path="/facturation/factures/:id/avoir" element={<FactureForm mode="avoir" />} />
        <Route path="/facturation/avoirs" element={<AvoirsListe />} />
        <Route path="/facturation/relances" element={<Relances />} />
        <Route path="/facturation/clients" element={<Clients />} />
        <Route path="/facturation/clients/nouveau" element={<ClientForm />} />
        <Route path="/facturation/clients/:id/modifier" element={<ClientForm />} />
        <Route path="/facturation/produits" element={<Produits />} />
        <Route path="/facturation/produits/nouveau" element={<PrestationForm />} />
        <Route path="/facturation/produits/:id/modifier" element={<PrestationForm />} />
        <Route path="/facturation/tarifs" element={<Tarifs />} />
        <Route path="/facturation/modeles" element={<Modeles />} />
        <Route path="/facturation/modeles/nouveau" element={<ModeleFactureForm />} />
        <Route path="/facturation/modeles/:id/modifier" element={<ModeleFactureForm />} />
        <Route path="/facturation/numerotation" element={<NumerotationPage />} />
        <Route path="/facturation/historique" element={<HistoriqueFacturation />} />

        <Route path="/tresorerie" element={<TresoDashboard />} />
        <Route path="/tresorerie/comptes" element={<Comptes />} />
        <Route path="/tresorerie/comptes/nouveau" element={<CompteForm />} />
        <Route path="/tresorerie/comptes/:id/modifier" element={<CompteForm />} />
        <Route path="/tresorerie/comptes/:id" element={<CompteFicheTreso />} />
        <Route path="/tresorerie/mouvements" element={<Mouvements />} />
        <Route path="/tresorerie/mouvements/nouveau" element={<NouvelleTransaction />} />
        <Route path="/tresorerie/rapprochement" element={<RapprochementTreso />} />
        <Route path="/tresorerie/previsionnel" element={<Previsionnel />} />
        <Route path="/tresorerie/virements" element={<Virements />} />
        <Route path="/tresorerie/categorisation" element={<Categorisation />} />
        <Route path="/tresorerie/rapport" element={<RapportTreso />} />

        <Route path="/notes-de-frais" element={<NdfDashboard />} />
        <Route path="/notes-de-frais/mes-notes" element={<NdfListe vue="mes-notes" />} />
        <Route path="/notes-de-frais/a-valider" element={<NdfListe vue="a-valider" />} />
        <Route path="/notes-de-frais/validees" element={<NdfListe vue="validees" />} />
        <Route path="/notes-de-frais/rejetees" element={<NdfListe vue="rejetees" />} />
        <Route path="/notes-de-frais/remboursements" element={<NdfListe vue="remboursements" />} />
        <Route path="/notes-de-frais/historique" element={<NdfHistorique />} />
        <Route path="/notes-de-frais/nouvelle" element={<NdfForm mode="creation" />} />
        <Route path="/notes-de-frais/scan" element={<NdfScan />} />
        <Route path="/notes-de-frais/:id" element={<NdfDetail />} />
        <Route path="/notes-de-frais/:id/modifier" element={<NdfForm mode="modification" />} />
        <Route path="/notes-de-frais/:id/scan" element={<NdfScan />} />

        <Route path="/documents" element={<DocsAccueil />} />
        <Route path="/documents/explorateur" element={<Explorateur />} />
        <Route path="/documents/recherche" element={<RechercheDocuments />} />
        <Route path="/documents/recents" element={<VueDocuments vue="recents" />} />
        <Route path="/documents/partages" element={<VueDocuments vue="partages" />} />
        <Route path="/documents/favoris" element={<VueDocuments vue="favoris" />} />
        <Route path="/documents/corbeille" element={<VueDocuments vue="corbeille" />} />
        <Route path="/documents/:id" element={<DocumentFiche />} />

        <Route path="/signatures" element={<SignDashboard />} />
        <Route path="/signatures/nouvelle" element={<SignNouvelle />} />
        <Route path="/signatures/a-signer" element={<SignListe vue="a-signer" />} />
        <Route path="/signatures/envoyees" element={<SignListe vue="envoyees" />} />
        <Route path="/signatures/terminees" element={<SignListe vue="terminees" />} />
        <Route path="/signatures/historique" element={<SignHistorique />} />
        <Route path="/signatures/:id" element={<SignSuivi />} />

        <Route path="/taches" element={<TachesListe vue="mes-taches" />} />
        <Route path="/taches/toutes" element={<TachesListe vue="toutes" />} />
        <Route path="/taches/equipe" element={<TachesListe vue="equipe" />} />
        <Route path="/taches/retard" element={<TachesListe vue="retard" />} />
        <Route path="/taches/terminees" element={<TachesListe vue="terminees" />} />
        <Route path="/taches/nouvelle" element={<TacheForm mode="creation" />} />
        <Route path="/taches/:id" element={<TacheFiche />} />
        <Route path="/taches/:id/modifier" element={<TacheForm mode="modification" />} />

        <Route path="/projets" element={<ProjetsDashboard />} />
        <Route path="/projets/liste" element={<ProjetsListe />} />
        <Route path="/projets/nouveau" element={<ProjetNouveau />} />
        <Route path="/projets/:id" element={<ProjetFiche />} />

        <Route path="/agenda" element={<AgendaVues portefeuille="personnel" />} />
        <Route path="/agenda/association" element={<AgendaVues portefeuille="association" />} />
        <Route path="/agenda/partages" element={<AgendaVues portefeuille="partages" />} />
        <Route path="/agenda/disponibilites" element={<Disponibilites />} />
        <Route path="/agenda/synchronisation" element={<Synchronisation />} />
        <Route path="/agenda/nouveau" element={<EvenementForm mode="creation" />} />
        <Route path="/agenda/:id" element={<EvenementFiche />} />
        <Route path="/agenda/:id/modifier" element={<EvenementForm mode="modification" />} />

        <Route path="/planning" element={<PlanningGrilles portee="global" />} />
        <Route path="/planning/equipe" element={<PlanningGrilles portee="equipe" />} />
        <Route path="/planning/individuel" element={<PlanningGrilles portee="individuel" />} />
        <Route path="/planning/ressources" element={<PlanningGrilles portee="ressources" />} />
        <Route path="/planning/affectation" element={<Affectation />} />
        <Route path="/planning/disponibilites" element={<DisponibilitesPlanning />} />
        <Route path="/planning/absences" element={<AbsencesPlanning />} />
        <Route path="/planning/conflits" element={<ConflitsPlanning />} />
        <Route path="/planning/remplacements" element={<RemplacementsPlanning />} />

        <Route path="/email-interne" element={<EmailPage />} />
        <Route path="/email-interne/recherche" element={<RechercheEmail />} />
        <Route path="/email-interne/modeles" element={<ModelesEmail />} />
        <Route path="/email-interne/:filId" element={<EmailPage />} />

        <Route path="/actions" element={<ActionsDashboard />} />
        <Route path="/actions/liste" element={<ActionsListe />} />
        <Route path="/actions/:id" element={<ActionFiche />} />

        <Route path="/chat-collaboratif" element={<ChatPage />} />
        <Route path="/chat-collaboratif/nouveau" element={<NouveauChat />} />
        <Route path="/chat-collaboratif/mentions" element={<MentionsChat />} />
        <Route path="/chat-collaboratif/recherche" element={<RechercheChat />} />
        <Route path="/chat-collaboratif/:id" element={<ChatPage />} />
        <Route path="/chat-collaboratif/:id/parametres" element={<ParametresSalon />} />

        <Route path="/formulaires" element={<ListeFormulaires />} />
        <Route path="/formulaires/archives" element={<FormulairesArchives />} />
        <Route path="/formulaires/nouveau" element={<NouveauFormulaire />} />
        <Route path="/formulaires/:id/editeur" element={<FormulaireEditeur />} />
        <Route path="/formulaires/:id/apercu" element={<FormulairePrevisualisation />} />
        <Route path="/formulaires/:id/parametres" element={<FormulaireParametres />} />
        <Route path="/formulaires/:id/publication" element={<FormulairePublication />} />
        <Route path="/formulaires/:id/reponses" element={<FormulaireReponses />} />
        <Route path="/formulaires/:id/reponses/:reponseId" element={<FormulaireReponseDetail />} />
        <Route path="/formulaires/:id/statistiques" element={<FormulaireStatistiques />} />

        {Object.entries(fichesModules).map(([cle, fiche]) => (
          <Route key={cle} path={`/${cle}`} element={<ModuleAVenir fiche={fiche} />} />
        ))}

        <Route path="/parametres" element={<Parametres />} />
        <Route path="/design-system" element={<DesignSystem />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
