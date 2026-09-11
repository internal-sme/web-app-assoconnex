import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, MemoryRouter } from 'react-router-dom'
import App from './App'
import { A11yProvider } from '@/context/A11yContext'
import { OrgProvider } from '@/context/OrgContext'
import { ToastProvider } from '@/context/ToastContext'
import { ContactsProvider } from '@/context/ContactsContext'
import { AdherentsProvider } from '@/context/AdherentsContext'
import { ComptaProvider } from '@/context/ComptaContext'
import { FacturationProvider } from '@/context/FacturationContext'
import { TresorerieProvider } from '@/context/TresorerieContext'
import { NotesFraisProvider } from '@/context/NotesFraisContext'
import { DocumentsProvider } from '@/context/DocumentsContext'
import { SignaturesProvider } from '@/context/SignaturesContext'
import { TachesProvider } from '@/context/TachesContext'
import { ProjetsProvider } from '@/context/ProjetsContext'
import { AgendaProvider } from '@/context/AgendaContext'
import { PlanningProvider } from '@/context/PlanningContext'
import { ChatProvider } from '@/context/ChatContext'
import { ActionsProvider } from '@/context/ActionsContext'
import { EmailInterneProvider } from '@/context/EmailInterneContext'
import { FormulairesProvider } from '@/context/FormulairesContext'
import { AuthProvider } from '@/context/AuthContext'
import { PorteAuth } from '@/pages/auth/Ecrans'
import './index.css'

/**
 * Certains contextes d'exécution (iframe en bac à sable, srcdoc, file://) exposent
 * une origine « null » : l'historique du navigateur y échoue à construire une URL.
 * On bascule alors sur un routeur en mémoire, au comportement identique.
 */
function pickRouter() {
  try {
    new URL('/', window.location.origin)
    return HashRouter
  } catch {
    return MemoryRouter
  }
}

const Router = pickRouter()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <A11yProvider>
       <AuthProvider>
        <OrgProvider>
          <ToastProvider>
            <ContactsProvider>
              <AdherentsProvider>
                <ComptaProvider>
                  <FacturationProvider>
                    <TresorerieProvider>
                      <NotesFraisProvider>
                        <DocumentsProvider>
                          <SignaturesProvider>
                            <TachesProvider>
                              <ProjetsProvider>
                                <AgendaProvider>
                                  <PlanningProvider>
                                    <ChatProvider>
                                      <ActionsProvider>
                                       <EmailInterneProvider>
                                        <FormulairesProvider>
                                          <PorteAuth>
                                            <App />
                                          </PorteAuth>
                                        </FormulairesProvider>
                                       </EmailInterneProvider>
                                      </ActionsProvider>
                                    </ChatProvider>
                                  </PlanningProvider>
                                </AgendaProvider>
                              </ProjetsProvider>
                            </TachesProvider>
                          </SignaturesProvider>
                        </DocumentsProvider>
                      </NotesFraisProvider>
                    </TresorerieProvider>
                  </FacturationProvider>
                </ComptaProvider>
              </AdherentsProvider>
            </ContactsProvider>
          </ToastProvider>
        </OrgProvider>
       </AuthProvider>
      </A11yProvider>
    </Router>
  </React.StrictMode>,
)
