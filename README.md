# AssoConnex° — socle applicatif

Shell et design system d'un SaaS de gestion associative multi-associations.
Aucune base de données : toutes les données sont mockées en français et vivent en mémoire.

## Démarrer

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # build de production dans dist/
```

Un aperçu autonome (un seul fichier HTML, sans serveur) se génère avec :

```bash
npx vite build -c vite.preview.config.ts   # → dist-preview/index.html
```

## Ce que contient le socle

| Zone | Fichiers |
| --- | --- |
| Shell | `src/components/layout/` — `AppShell`, `Sidebar`, `Topbar`, `GlobalSearch`, `A11yCenter`, `PageLayout` |
| Composants | `src/components/ui/` — boutons, champs, statuts, surfaces, indicateurs |
| Data grid | `src/components/data/DataGrid.tsx` |
| Contextes | `src/context/` — organisation courante, accessibilité, notifications |
| Données mockées | `src/lib/mock.ts` |
| Pages | `src/pages/` — Tableau de bord, Contacts, Adhérents, Paramètres, Design system |

## Jetons de couleur

Le bleu primaire est celui du logo : `#2364AA` (`brand-500`, 6,05:1 sur blanc).
Le reste de l'interface est en blanc et en neutres froids (`ink-25` → `ink-950`).
Trois teintes de statut — vert `#127A4C`, orange `#9A5B00`, rouge `#B42318` — sont
réservées aux états et n'habillent jamais la structure.

## Règles d'accessibilité tenues par le socle

- Contraste AA minimum sur tous les textes, y compris le texte secondaire (`ink-500`, 4,58:1).
- Focus clavier visible partout, avec mode « focus renforcé » dans le centre d'accessibilité.
- Navigation clavier complète : lien d'évitement, `Ctrl/⌘ K` pour la recherche globale,
  flèches dans les onglets et les listes, `Échap` pour fermer, focus piégé et restitué
  dans les modales et tiroirs.
- Un statut n'est **jamais** porté par la couleur seule : texte + couleur + icône.
- Tableaux avec `caption`, `scope`, `aria-sort` et libellés de sélection explicites.
- Centre d'accessibilité : taille du texte, contraste renforcé, réduction des animations,
  focus renforcé. `prefers-reduced-motion` est également respecté par défaut.

## Module Contacts

Module CRUD de référence, construit uniquement avec les composants du socle.

| Écran | Route | Fichier |
| --- | --- | --- |
| Liste | `/contacts` | `pages/contacts/ContactsListe.tsx` |
| Création | `/contacts/nouveau` | `pages/contacts/ContactNouveau.tsx` |
| Fiche (5 onglets) | `/contacts/:id` | `pages/contacts/ContactFiche.tsx` |
| Modification | `/contacts/:id/modifier` | `pages/contacts/ContactModifier.tsx` |
| Groupes et tags | `/contacts/groupes` | `pages/contacts/GroupesTags.tsx` |

L'état vit dans `context/ContactsContext.tsx` : 40 contacts en mémoire, latence simulée
(650 ms au chargement, 900 ms à l'enregistrement) et journal d'historique alimenté à
chaque écriture.

### États

Le menu « États » de la liste force les cas limites : chargement, liste vide, erreur de
chargement, échec de sauvegarde. Les autres états — recherche sans résultat, filtre
actif, sélection multiple, enregistrement en cours, succès, échec — se produisent
naturellement en manipulant l'interface.

### Actions sensibles

Suppression et archivage passent par `ConfirmDialog`, avec un intitulé qui nomme
l'objet et énonce la conséquence. L'archivage précise qu'il est réversible ; la
suppression précise ce qui disparaît, documents et historique compris.

## Module Adhérents

Module distinct de Contacts : son objet est le **cycle de vie d'une adhésion**, pas la
personne. Modèle et règles métier dans `lib/adherents.ts`, état dans
`context/AdherentsContext.tsx`.

| Écran | Route | Fichier |
| --- | --- | --- |
| Tableau de bord | `/adherents` | `pages/adherents/AdherentsDashboard.tsx` |
| Liste | `/adherents/liste` | `pages/adherents/AdherentsListe.tsx` |
| Fiche (6 onglets) | `/adherents/:id` | `pages/adherents/AdherentFiche.tsx` |
| Nouvelle adhésion | `/adherents/nouveau` | `pages/adherents/NouvelleAdhesion.tsx` |
| Renouvellement | `/adherents/:id/renouveler` | `pages/adherents/Renouvellement.tsx` |
| Paiement | `/adherents/:id/paiement` | `pages/adherents/NouveauPaiement.tsx` |
| Types d'adhésion | `/adherents/types` | `pages/adherents/TypesAdhesion.tsx` |

### Cycle de vie

Le statut n'est pas stocké : il se **calcule** à partir de la date d'échéance et de la
date de désactivation (`statutAdhesion`). Active au-delà de 45 jours, expire bientôt en
deçà, expirée après l'échéance, résiliée si désactivée. Un seul point de vérité, donc
pas de statut qui dérive.

Les cotisations et les paiements sont deux objets distincts : une cotisation est une
créance, un paiement un encaissement. Le statut d'une cotisation se recalcule à chaque
paiement, ce qui rend le paiement partiel naturel.

### Parcours

Tableau de bord → Adhérents → Liste → Recherche → Fiche → Nouvelle adhésion →
Cotisation → Paiement → Confirmation. Le parcours d'adhésion est un assistant en quatre
étapes ; le renouvellement enchaîne automatiquement sur l'écran de paiement.

### Graphiques

Tracés en SVG, sans dépendance. Chacun porte un `role="img"` avec un libellé et
double son rendu d'un tableau de données en `sr-only` : le contenu reste accessible aux
lecteurs d'écran. Les deux séries du graphique comparatif se distinguent par la couleur
**et** par une trame diagonale.

## Module Comptabilité

Comptabilité en partie double, conforme au plan comptable associatif. Modèle et calculs
dans `lib/comptabilite.ts`, état dans `context/ComptaContext.tsx`.

| Écran | Route |
| --- | --- |
| Tableau de bord | `/comptabilite` |
| Journal et écritures | `/comptabilite/journal` |
| Écriture | `/comptabilite/ecritures/:id` |
| Nouvelle écriture / modification | `/comptabilite/ecritures/nouvelle`, `/:id/modifier` |
| Plan comptable | `/comptabilite/plan` |
| Compte | `/comptabilite/comptes/:numero` |
| Grand livre | `/comptabilite/grand-livre` |
| Balance | `/comptabilite/balance` |
| Rapprochement bancaire | `/comptabilite/rapprochement` |
| Pièces comptables | `/comptabilite/pieces` |
| Rapports | `/comptabilite/rapports` |
| Exercices et clôture | `/comptabilite/exercices` |

### Règles tenues par le module

- Une écriture naît en **brouillon**. Elle n'entre ni dans la balance, ni dans le grand
  livre, ni dans les rapports tant qu'elle n'est pas validée.
- La **validation** exige un équilibre parfait entre débits et crédits. Elle est
  irréversible : une écriture validée ne peut plus être modifiée ni supprimée, seulement
  contrepassée.
- La date d'une écriture doit tomber dans l'exercice sélectionné.
- Un **exercice clôturé** passe en lecture seule sur tous les écrans du module. La
  clôture refuse de s'exécuter s'il reste des brouillons ou des écritures déséquilibrées,
  et génère l'écriture d'affectation du résultat vers les comptes 120000 et 106000.
- Les comptes de bilan sont cumulatifs, les comptes de gestion arrêtés à l'exercice. Le
  tableau de bord respecte cette distinction.

### Données

Deux exercices : 2024-2025 clôturé, 2025-2026 ouvert. Environ 260 écritures générées à
partir de vingt modèles d'opération associative — cotisations, subventions, buvette,
loyer, salaires, notes de frais, frais bancaires. Une écriture est volontairement
déséquilibrée pour rendre l'état visible sans manipulation.

## Module Facturation

Facturation client complète : catalogue, grilles tarifaires, factures, avoirs, relances.
Modèle dans `lib/facturation.ts`, état dans `context/FacturationContext.tsx`.

| Écran | Route |
| --- | --- |
| Tableau de bord | `/facturation` |
| Factures | `/facturation/factures` |
| Fiche facture | `/facturation/factures/:id` |
| Nouvelle facture / édition | `/facturation/factures/nouvelle`, `/:id/modifier` |
| Aperçu du document | `/facturation/factures/:id/apercu` |
| Création d'avoir | `/facturation/factures/:id/avoir` |
| Avoirs | `/facturation/avoirs` |
| Relances | `/facturation/relances` |
| Clients | `/facturation/clients` |
| Produits et services | `/facturation/produits` |
| Tarifs | `/facturation/tarifs` |
| Modèles | `/facturation/modeles` |
| Numérotation | `/facturation/numerotation` |
| Historique | `/facturation/historique` |

### Règles

- Le statut **en retard** se calcule à partir de l'échéance : il n'est jamais stocké.
  Un avoir ne peut pas être en retard, faute d'échéance de règlement.
- Une facture **envoyée n'est plus modifiable** : elle se corrige par un avoir.
- Une facture **déjà réglée ne peut pas être annulée** : le module refuse et oriente
  vers l'avoir.
- Le numéro est attribué **à la création du brouillon**, et une facture annulée le
  conserve : la séquence ne comporte aucun trou.
- La grille tarifaire du client applique son coefficient au prix catalogue lors de
  l'ajout d'une ligne ; le prix reste modifiable ensuite.
- Les relances sont graduées en trois niveaux, à J+7, J+21 et J+45.

### Données

Cinquante documents : 47 factures et 3 avoirs, douze clients, douze prestations, quatre
grilles tarifaires, trois modèles. Une facture sans ligne (`F-2026-0062`) existe dans le
jeu de données pour rendre cet état visible sans manipulation.

## Module Trésorerie

Pilotage des liquidités : soldes réels, projection, rapprochement, catégorisation.
Modèle dans `lib/tresorerie.ts`, état dans `context/TresorerieContext.tsx`.

| Écran | Route |
| --- | --- |
| Tableau de bord | `/tresorerie` |
| Comptes bancaires | `/tresorerie/comptes` |
| Fiche de compte | `/tresorerie/comptes/:id` |
| Mouvements | `/tresorerie/mouvements` |
| Nouvelle transaction | `/tresorerie/mouvements/nouveau` |
| Rapprochement bancaire | `/tresorerie/rapprochement` |
| Prévisionnel | `/tresorerie/previsionnel` |
| Virements | `/tresorerie/virements` |
| Catégorisation | `/tresorerie/categorisation` |
| Rapport | `/tresorerie/rapport` |

### L'enchaînement

Le tableau de bord ouvre sur quatre cartes reliées par leurs opérateurs :
solde actuel **+** entrées prévues **−** sorties prévues **=** solde prévisionnel.
L'horizon bascule entre 30, 60 et 90 jours. Un encadré donne la lecture prudente, qui
ne retient que les entrées confirmées.

Autres règles : un virement exécuté crée deux mouvements symétriques et ne peut plus
être annulé ; les prévisions n'affectent que la projection, jamais le solde réel ;
la catégorisation propose mais n'applique jamais sans accord.

## Module Notes de frais

Circuit de validation en cinq étapes. Modèle dans `lib/notesFrais.ts`, état dans
`context/NotesFraisContext.tsx`.

| Écran | Route |
| --- | --- |
| Tableau de bord | `/notes-de-frais` |
| Mes notes de frais | `/notes-de-frais/mes-notes` |
| Nouvelle note / modification | `/notes-de-frais/nouvelle`, `/:id/modifier` |
| Scan de justificatif | `/notes-de-frais/scan`, `/:id/scan` |
| Détail | `/notes-de-frais/:id` |
| À valider | `/notes-de-frais/a-valider` |
| Validées | `/notes-de-frais/validees` |
| Rejetées | `/notes-de-frais/rejetees` |
| Remboursements | `/notes-de-frais/remboursements` |
| Historique | `/notes-de-frais/historique` |

### Le workflow

Rédaction → Soumission → Validation responsable → Validation trésorier → Remboursement.
Le composant `WorkflowStepper` matérialise ces cinq étapes et apparaît partout : en tête
de fiche, dans le formulaire de saisie, en version compacte dans les listes et dans les
modales de rejet. Un rejet marque en rouge l'étape concernée et interrompt la suite.

Règles tenues : le motif de rejet est obligatoire ; le trésorier ne peut pas valider une
note sans justificatif ; une note engagée dans le circuit n'est plus modifiable ; une note
rejetée redevient modifiable et repart de l'étape de soumission.

## Module Documents

Gestion documentaire : arborescence, versions, droits, corbeille.
Modèle dans `lib/documents.ts`, état dans `context/DocumentsContext.tsx`.

| Écran | Route |
| --- | --- |
| Accueil | `/documents` |
| Explorateur (arborescence, liste et grille) | `/documents/explorateur` |
| Fiche document | `/documents/:id` |
| Recherche | `/documents/recherche` |
| Récents / Partagés / Favoris / Corbeille | `/documents/recents`, `/partages`, `/favoris`, `/corbeille` |

Création de dossier et dépôt de fichiers se font depuis l'explorateur : modale pour le
dossier, zone de glisser-déposer pour l'upload simple ou multiple. Versions et droits
sont deux onglets de la fiche document.

### Règles

- La suppression passe par la corbeille : restaurable trente jours, puis effacement
  définitif avec une seconde confirmation.
- Restaurer une version antérieure **crée une nouvelle version** : rien n'est écrasé.
- Un document conserve toujours au moins un gestionnaire.
- Élargir la portée d'un partage demande une confirmation explicite et reste consigné.
- L'upload refuse les fichiers au-delà de 25 Mo, affiche la progression réelle et propose
  de réessayer en cas d'échec réseau.

## Module Signature électronique

Circuits de signature avec placement libre des champs.
Modèle dans `lib/signatures.ts`, état dans `context/SignaturesContext.tsx`.

| Écran | Route |
| --- | --- |
| Tableau de bord | `/signatures` |
| À signer | `/signatures/a-signer` |
| Envoyées | `/signatures/envoyees` |
| Terminées | `/signatures/terminees` |
| Nouvelle demande (5 étapes) | `/signatures/nouvelle` |
| Suivi et document signé | `/signatures/:id` |
| Historique | `/signatures/historique` |

### L'éditeur de placement

`components/signatures/EditeurChamps.tsx` gère six types de champ — signature,
initiales, nom, date, texte, case à cocher. Les champs se posent par glisser-déposer
depuis la palette ou par clic, se repositionnent à la souris, et se déplacent aussi aux
flèches du clavier (Maj pour un pas de cinq, Suppr pour retirer). Zoom de 60 à 160 %,
navigation page par page.

Les positions sont stockées en **pourcentage de la page**, jamais en pixels : elles
restent justes quels que soient le zoom et la taille d'écran.

### Règles

- Le statut se déduit des signataires et de l'échéance : il n'est pas stocké.
- Les signatures suivent un **ordre de passage** : on ne peut signer qu'à son tour.
- Un refus exige un motif et interrompt le circuit.
- Une demande sans zone de signature ne peut pas être envoyée.
- Une demande signée par tous ne peut plus être annulée : le document est scellé.

## Module Documents

Gestion documentaire : arborescence, versions, droits, partage. Modèle dans
`lib/documents.ts`, état dans `context/DocumentsContext.tsx`.

Écrans : accueil, explorateur (arborescence + vue liste et vue grille), création de
dossier, import par glisser-déposer, fiche document (aperçu, versions, droits,
historique), recherche, récents, partagés, favoris, corbeille.

Règles : l'import affiche une progression par fichier et refuse au-delà de 25 Mo ;
certains formats (ZIP, DWG, MP4) n'ont pas d'aperçu et le disent ; la suppression passe
par la corbeille avec restauration pendant trente jours ; restaurer une version la
recopie en tête sans rien effacer ; la modification des droits est confirmée
explicitement, avec l'avertissement qu'un lien de partage les contourne.

## Module Signature électronique

Modèle dans `lib/signatures.ts`, état dans `context/SignaturesContext.tsx`.

Écrans : tableau de bord, à signer, envoyées, terminées, nouvelle demande (assistant en
quatre étapes : document, signataires, placement des champs, prévisualisation), suivi,
document signé, historique.

L'éditeur de placement (`components/signatures/Editeur.tsx`) pose six types de champs —
signature, initiales, nom, date, texte, case à cocher — par clic puis glisser-déposer,
avec zoom de 60 à 160 % et navigation entre les pages. Les positions sont stockées en
pourcentage de page, donc justes à tout niveau de zoom. Chaque champ est aussi
déplaçable au clavier une fois sélectionné.

Règles : le statut « expirée » se calcule depuis l'échéance ; l'ordre de passage est
respecté, un signataire ne reçoit son lien qu'à son tour ; un refus exige un motif et
interrompt le circuit ; une demande signée par tous ne peut plus être annulée.

## Module Tâches

Modèle dans `lib/taches.ts`, état dans `context/TachesContext.tsx`.

Écrans : mes tâches, toutes, équipe, en retard, terminées, création, fiche.
Trois vues commutables sur chaque écran : Kanban à cinq colonnes avec glisser-déposer,
liste (data grid complet) et calendrier mensuel.

La fiche porte titre, description, responsable, participants, dates, priorité, statut,
projet, pièces jointes, commentaires, checklist et historique. Le statut « en retard »
se calcule depuis l'échéance ; une colonne vide affiche son propre message plutôt qu'un
vide muet.

## Parcours d'authentification

Modèle dans `lib/auth.ts`, état dans `context/AuthContext.tsx`, écrans dans
`pages/auth/`. Le composant `PorteAuth` s'intercale entre les fournisseurs de contexte et
`App` : tant que la session est vide, il affiche les écrans de connexion à la place de
l'application. La coque, les modules et la recherche globale n'apparaissent qu'une fois
la session ouverte, et aucun écran existant n'a été modifié pour cela.

Quatre étapes : connexion, vérification par code à usage unique, mot de passe oublié avec
son écran de confirmation, réinitialisation. La mise en page tient sur deux panneaux —
formulaire à gauche, panneau de marque à droite, masqué en dessous du format tablette.

### Le code de vérification

Il est demandé à chaque connexion, pour rendre l'étape visible en démonstration. Ni les
identifiants ni le code attendu ne sont affichés à l'écran : ils vivent dans
`lib/auth.ts` (`comptesDemo` et `CODE_DEMO`).

Les six champs passent automatiquement au suivant, reviennent en arrière au retour
arrière, se parcourent aux flèches, et acceptent le collage d'un code entier depuis le
presse-papiers. Le code périme au bout de dix minutes, et l'écran refuse alors la saisie
plutôt que de la laisser échouer : il faut en demander un nouveau.

### Règles refusantes

- Cinq tentatives de connexion, puis verrouillage de quinze minutes avec compte à rebours
  affiché.
- Trois essais sur le code, puis retour à l'écran de connexion.
- L'écran de mot de passe oublié n'indique jamais si l'adresse est connue, et le dit.
- Le nouveau mot de passe doit satisfaire cinq règles, affichées et cochées en direct, et
  ne peut pas reprendre l'ancien.

### Accessibilité

Les attributs `autocomplete` sont conformes — `email`, `current-password`,
`one-time-code`, `new-password` — pour que les gestionnaires de mots de passe
fonctionnent. Le focus se déplace sur le titre à chaque changement d'étape, les erreurs
sont annoncées en région `aria-live`, et chaque champ de code porte son étiquette
individuelle.

### Ce que ce parcours n'est pas

Il démontre une expérience, il ne protège pas l'accès : les identifiants sont lisibles
dans le code et la session vit en mémoire, donc un rechargement déconnecte. Pour
restreindre réellement l'accès d'un déploiement public, la protection doit venir de
l'hébergement.

## Où se saisissent les formulaires

Une règle unique décide de la surface de saisie.

**Page dédiée** dès que le formulaire dépasse quelques champs : les sections s'empilent,
la barre d'actions reste collée en bas, et la validation se fait à l'enregistrement.
Cinq écrans ont été convertis depuis des modales devenues trop denses — nouveau client
(12 champs), compte bancaire (9), prestation (8), type d'adhésion (7), modèle de facture
(7). Chacun sert aussi à la modification, pré-rempli.

Le composant `PageFormulaire` porte cette coquille et sera réutilisé pour les prochains
formulaires longs.

**Modale** pour les saisies courtes ouvertes depuis un écran qu'on ne veut pas quitter :
un jalon depuis la fiche projet, un dossier depuis l'explorateur, un compte comptable
depuis le plan. Trois modales gardent cinq champs — compte comptable, risque, ligne de
budget — parce que les fractionner en page ferait perdre le contexte de travail.

**Tiroir latéral** pour l'action associative seule, avec sa bascule en plein écran, comme
les maquettes le demandaient.

Trois modales dépassent délibérément le seuil et restent des modales : la composition
d'un message, parce que c'est la convention des clients de messagerie, la prévision et le
virement, parce qu'on les saisit en lisant les chiffres affichés derrière.

### Responsivité des surfaces

`Modal` plafonne à 85 % de la hauteur d'écran, en-tête et pied fixes, seul le corps
défile : le bouton de validation reste toujours atteignable. Sur téléphone, les modales
larges deviennent une feuille pleine hauteur ancrée en bas. `Drawer` passe en pleine
largeur sous le format tablette, son corps défilant déjà.

## Navigation

La barre latérale range les modules en deux dossiers dépliables, ouverts par défaut.

**Module commun** — ce qui vaut au-delà d'une seule association : tableau de bord,
actions associatives, contacts, chat collaboratif.

**Module spécifique** — ce qui appartient à l'association sélectionnée : adhérents,
comptabilité, facturation, trésorerie, notes de frais, documents, signature
électronique, tâches, projets, agenda, planning, email interne, campagne d'emailing,
notifications, formulaires, inventaire, achats, RH.

Paramètres et design system restent en pied de barre, hors des dossiers. En mode replié,
les dossiers s'effacent au profit d'un simple séparateur : les icônes seules suffisent.
Un dossier fermé qui contient la page courante porte une pastille, pour qu'on sache où
l'on est sans le rouvrir.

### Deux outils de discussion, deux registres

Le **chat collaboratif** est instantané et traverse les frontières de l'association : on y
discute entre membres comme entre associations partenaires. Il est rangé dans le commun
pour cette raison.

L'**email interne** est l'échange écrit entre membres d'une même association. Plus lent,
plus formel, il laisse une trace rattachable à une facture ou à un dossier. Il est rangé
dans le spécifique.

La **campagne d'emailing** est encore autre chose : l'envoi groupé aux adhérents, dans le
respect des consentements enregistrés par contact.

Six modules ne sont pas construits : campagne d'emailing, notifications, formulaires, inventaire, achats et RH. Plutôt que des liens morts, ils ouvrent
une page qui annonce leur périmètre et les modules déjà livrés sur lesquels ils
s'appuieront (`pages/ModuleAVenir.tsx`). La structure du produit est ainsi lisible dès
maintenant, et les écrans viendront s'y brancher sans rien déplacer.

## Module Projets

Modèle dans `lib/projets.ts`, état dans `context/ProjetsContext.tsx`.

Écrans : tableau de bord, liste, nouveau projet, fiche projet.
La fiche est organisée en dix onglets : vue générale, tâches, planning, budget, équipe,
documents, activité, indicateurs, risques, jalons.

Comme les autres modules, Projets porte sa propre barre d'onglets
(`components/projets/ProjetsNav.tsx`) : tableau de bord, liste des projets, nouveau
projet. Le menu « États » y est rattaché, à l'identique de Trésorerie, Documents ou
Tâches.

L'onglet Planning propose quatre représentations des mêmes tâches : Kanban avec
glisser-déposer, liste, calendrier et Gantt. Le diagramme (`components/projets/Gantt.tsx`)
positionne chaque tâche en pourcentage de la durée du projet, marque les jalons en
repères verticaux et le jour courant en trait plein. Un tableau `sr-only` en donne
l'équivalent textuel.

Règles tenues :

- Un projet clôturé passe en lecture seule. Toute tentative de modification est refusée
  avec un message qui nomme le projet, plutôt qu'échouer en silence.
- La clôture exige un bilan écrit et le traitement de tous les jalons encore à venir :
  un projet clos avec des jalons en suspens ne dit rien de ce qui a été fait.
- Le dépassement de budget se calcule, ne se stocke pas. Il remonte sur la carte du
  projet, dans un bandeau de la fiche et dans les points d'attention du tableau de bord.
- Le niveau de risque est le produit de la probabilité et de l'impact, tous deux notés
  de 1 à 3.
- Un projet sans tâche l'affiche explicitement dans un bandeau, avec le raccourci pour
  en créer une.

Les données mockées couvrent les cinq cas demandés : un projet clôturé, un en
préparation sans aucune tâche, un dont le budget est dépassé de 5 %, plus les états de
chargement, de liste vide et d'erreur accessibles par le menu « États ».

## Module Agenda

Modèle dans `lib/agenda.ts`, état dans `context/AgendaContext.tsx`.

Écrans : mon agenda, agenda de l'association, agendas partagés, disponibilités,
synchronisation externe, création et fiche d'événement. Chaque écran d'agenda propose
les trois vues jour, semaine et mois (`components/agenda/Vues.tsx`), avec une barre de
période commune et un panneau latéral pour superposer les calendriers.

Six calendriers cohabitent : le personnel, celui de l'association et quatre agendas de
section, chacun avec sa couleur. La vue « mon agenda » ne retient que les événements
dont l'utilisateur est organisateur ou participant.

### Les conflits

`detecterConflits` compare un événement aux autres sur deux critères : la même salle
réservée sur un créneau qui se chevauche, et un participant en présence requise attendu
ailleurs au même moment. Un participant facultatif n'entre pas dans le calcul, et un
événement annulé ne bloque plus rien.

La détection tourne en direct pendant la saisie : changer l'heure ou la salle recalcule
et affiche les collisions avant l'enregistrement. L'événement reste enregistrable — un
chevauchement est parfois voulu — mais il est signalé, dans le formulaire, sur la fiche
et par un triangle d'alerte dans les vues calendaires.

Les données mockées contiennent deux collisions volontaires : la grande salle réservée
deux fois le mercredi soir, et deux personnes attendues simultanément au montage du
festival et à l'atelier peinture.

### L'écran de disponibilités

Il croise les agendas de plusieurs personnes sur une journée et met en évidence les
plages où tout le monde est libre, à la durée demandée. Les salles sans réservation ce
jour-là sont listées à côté, avec une alerte quand leur capacité est inférieure au nombre
de participants.

### Synchronisation

Quatre comptes : Google Agenda en bidirectionnel, Outlook en import seul, un flux iCal
public en export, un compte Apple jamais connecté. Outlook est volontairement en erreur
de jeton expiré, ce qui rend visible l'état demandé. Le mode de démonstration « erreur de
synchronisation » bascule d'un coup tous les comptes connectés en échec.

Une carte énumère ce que la synchronisation ne fait pas — les réponses aux invitations ne
remontent pas, les réservations de salle ne sont jamais exportées. Mieux vaut le dire que
le laisser découvrir.

## Module Planning

Modèle dans `lib/planning.ts`, état dans `context/PlanningContext.tsx`. Distinct de
l'agenda : là où l'agenda répond à « qu'est-ce qui se passe quand », le planning répond à
« qui tient quel poste sur quel créneau, avec quelle ressource ».

Écrans : planning global, planning d'équipe, planning individuel, planning des
ressources, affectation, disponibilités, absences, conflits, remplacements. Les quatre
premiers proposent les vues jour, semaine et mois.

### La grille

`components/planning/Grille.tsx` croise des lignes et des jours. Ce que portent les
lignes change selon l'écran : les créneaux horaires en vue globale et individuelle, les
personnes en vue d'équipe, les salles et le matériel en vue ressources. Les cellules
contiennent les personnes affectées, avec leur poste et la ressource mobilisée.

L'affectation se fait par glisser-déposer, dans les deux sens : une personne tirée de la
réserve latérale vers une cellule ouvre le choix du poste, une affectation existante
tirée d'une cellule vers une autre se déplace. La réserve affiche pour chacun ses heures
de la semaine rapportées à son quota, la barre virant à l'ambre en cas de surcharge.

### Les conflits

`conflitsDe` contrôle cinq points : double affectation sur le même créneau, personne en
absence validée, créneau non déclaré dans ses disponibilités, compétence manquante pour
le poste, ressource déjà réservée. Les cellules concernées sont encadrées de rouge et
portent un triangle d'alerte ; l'écran « Conflits » les reprend avec le motif détaillé et
deux issues, retirer l'affectation ou demander un remplacement.

Rien n'est interdit : on peut affecter quelqu'un hors de ses disponibilités si la
situation l'exige. Le produit signale, l'humain tranche.

### Disponibilités, absences, remplacements

Chaque personne déclare sa semaine type dans une grille de cases cliquables. Les absences
distinguent le demandé du validé : seule une absence validée rend les affectations de la
période conflictuelles. Une demande de remplacement exige un motif et ne propose que des
personnes réellement libres, compétentes et non absentes sur le créneau — s'il n'y en a
aucune, l'écran le dit plutôt que d'afficher une liste vide.

## Module Action associative

Modèle dans `lib/actions.ts`, état dans `context/ActionsContext.tsx`. Le registre de ce
que l'association a mené, seule ou avec les associations de la ville, et ce qui est
publié sur l'application mobile destinée au public.

Écrans : tableau de bord, liste des actions, création et modification, fiche d'action,
import, confirmation de publication.

### Le chip d'action

Le type d'action n'est pas un simple classement : il détermine le bouton d'appel à
l'action affiché au public sur le mobile. « Collecte de dons » donne « Faire un don »,
« Appel à bénévoles » donne « Je me porte volontaire », « Atelier ou formation » donne
« M'inscrire à l'atelier ». Un aperçu de la carte mobile, bouton compris, s'affiche
pendant la saisie et sur la fiche : on voit ce que l'on publie avant de le publier.

La catégorie, second menu du chip, sert au classement et aux bilans d'activité.

### Deux statuts distincts dans le tableau

L'**avancement** — à venir, en cours, terminée — se déduit de la date et n'est jamais
stocké. La **publication** sur l'application mobile est un état stocké, indépendant : une
action peut être terminée sans avoir jamais été publiée, ou publiée avant d'avoir eu
lieu. Les deux colonnes cohabitent dans la liste.

L'annulation est le seul état d'avancement stocké, et exige un motif.

### Le formulaire en deux affichages

Panneau latéral par défaut, plein écran depuis le menu « … » de l'en-tête — les deux
maquettes fournies. L'éditeur de texte enrichi produit du Markdown : gras, italique,
souligné, listes à puces et numérotées, image, lien. La fiche le rend à la lecture.

### Cohérence avec l'existant

Le champ « action associative » des événements d'agenda pointe désormais vers les actions
réelles du registre. La fiche d'action liste en retour les événements qui s'y rattachent.

Deux composants rejoignent le design system : `AnneauProgression`, les anneaux
concentriques du tableau de bord, et `CourbesSuperposees`, les trois années superposées.
Tous deux avec leur tableau équivalent pour les lecteurs d'écran.

## Module Email interne

Modèle dans `lib/emailInterne.ts`, état dans `context/EmailInterneContext.tsx`. Échanges
écrits entre membres d'une même association, plus lents que le chat, rattachables à un
dossier.

Écrans : boîte de réception, message lu, composition, brouillons, envoyés, archivés,
corbeille, recherche, modèles.

### Trois colonnes

Dossiers à gauche avec leur compteur — les non-lus pour la réception, le nombre total
pour les autres. Liste des fils au centre, regroupés par échange, non-lus en gras avec
leur pastille. Message lu à droite, tous les messages du fil affichés à la suite.

### Ce qui est refusé plutôt que laissé passer

- Un message sans objet n'est pas envoyable : il a peu de chances d'être lu.
- Un message sans destinataire non plus.
- Une pièce jointe au-delà de dix mégaoctets est refusée, avec le renvoi vers l'espace
  documentaire pour partager un lien à la place.
- Au-delà de vingt destinataires, une confirmation rappelle que le module Campagne
  d'emailing gère les consentements et les désinscriptions, ce que l'email interne ne
  fait pas.
- Fermer une composition entamée propose d'enregistrer un brouillon plutôt que de perdre
  le contenu.

### Rattachement et accusés

Un message peut pointer vers un adhérent, une facture ou un document ; le lien apparaît
en tête du fil et mène à la fiche concernée. Un accusé de lecture demandé s'affiche comme
reçu ou en attente, sur le message envoyé.

## Module Chat collaboratif

Modèle dans `lib/chat.ts`, état dans `context/ChatContext.tsx`. Distinct de l'email
interne : instantané, organisé en salons, et ouvert aux associations partenaires.

Écrans : conversations (liste, fil, panneau contextuel), fil de réponses, nouveau chat,
mentions et non-lus, recherche dans les messages, paramètres du salon.

### Nouveau chat

Le même écran couvre les trois formes de conversation. On choisit d'abord : message
direct, salon de l'association, salon inter-associations. Le reste du formulaire s'adapte.

Pour un message direct, un annuaire remplace le formulaire : les contacts sont groupés
par association, la vôtre d'abord, chacun avec son point de présence et son rôle. Un
champ de recherche filtre l'ensemble. Cliquer sur une personne démarre la conversation.

Une conversation déjà ouverte avec quelqu'un est signalée avant le clic, avec le dernier
message échangé en aperçu : on rouvre le fil existant plutôt que d'en créer un doublon.

### Trois colonnes

À gauche, les conversations groupées en salons de l'association, salons
inter-associations et messages directs, avec les épinglés en tête et un compteur de
non-lus par salon. Au centre, le fil : séparateurs de jour, messages groupés par auteur,
réactions, réponses en fil, actions au survol. À droite, les membres avec leur point de
présence, les fichiers partagés du salon, et le réglage des notifications.

### Le cloisonnement inter-associations

`estExterne` et `PastilleAssociation` marquent l'origine de chaque intervenant : dans un
salon réunissant trois structures, savoir au nom de qui quelqu'un parle change la lecture
de son message. La pastille apparaît aussi dans la liste des conversations pour les
messages directs avec un contact externe.

L'invitation d'une association partenaire est explicite et rappelle ce qu'elle donne :
l'accès à ce salon, et à rien d'autre. Le retrait d'une association exclut ses membres du
salon en même temps, ce que la confirmation annonce en les comptant.

Les messages directs franchissent la frontière associative : on peut écrire à un membre
d'une structure partenaire comme à un collègue.

### Ce qui est refusé plutôt que laissé passer

- Un salon inter-associations sans partenaire convié n'est pas créable.
- Le créateur d'un salon ne peut pas en être exclu.
- Votre propre association ne peut pas être retirée de ses salons.
- Un salon archivé passe en lecture seule : plus d'envoi, plus de modification de ses
  paramètres. La réactivation reste possible d'un clic.
- Un message vidé n'est pas enregistré : on supprime, ou on garde.

### Suppression du message d'autrui

C'est une action de modération, et la confirmation le dit : le texte diffère selon qu'il
s'agit de son propre message ou de celui de quelqu'un d'autre. Dans les deux cas une
ligne « message supprimé » subsiste dans le fil, plutôt qu'un trou dans la conversation.

## Données de démonstration : état nominal par défaut

Les jeux de données représentent désormais une association qui fonctionne. À
l'ouverture, aucun module n'affiche d'anomalie : pas d'écriture déséquilibrée, pas de
facture sans ligne, pas de note de frais sans justificatif, pas de conflit d'agenda, pas
de budget dépassé ni de jalon manqué, pas de tâche en retard, pas de demande de
signature expirée, pas de compte de synchronisation en échec.

Ces cas restent démontrables : chaque module expose une variante par son menu « États »,
qui recharge un jeu de données dégradé sans quitter l'écran.

| Module | Mode | Ce qu'il produit |
| --- | --- | --- |
| Comptabilité | Écriture déséquilibrée | Une régularisation de caisse saisie à moitié, qui bloque validation et clôture |
| Facturation | Facture sans ligne | Un brouillon vidé de ses lignes, donc non envoyable |
| Notes de frais | Justificatif manquant | Quatre notes engagées dans le circuit sans pièce jointe |
| Tâches | Tâches en retard | Quatre échéances repassées derrière nous |
| Projets | Budget dépassé | Le festival au-delà de son enveloppe, avec un jalon manqué |
| Signature | Demande expirée | Une échéance dépassée sans réponse de tous les signataires |
| Agenda | Conflit d'horaire | La grande salle réservée deux fois, deux personnes attendues au même moment |
| Agenda | Erreur de synchronisation | Tous les comptes connectés basculent en échec |
| Planning | Conflit d'affectation | Une personne sur deux postes à la fois, une salle réservée deux fois |
| Planning | Personne indisponible | Une affectation hors disponibilités, une autre pendant une absence |
| Chat | Salon sans message | Les salons existent, aucun échange n'a encore eu lieu |
| Chat | Échec d'envoi | Un message resté non parti, avec bouton Réessayer |
| Chat | Salons archivés | Les salons inter-associations passent en lecture seule |
| Actions | Action annulée | Une action à venir annulée, avec son motif |
| Actions | Échec de publication | La diffusion vers l'application mobile est refusée |
| Actions | Import en échec | Le fichier CSV est rejeté, colonne manquante |
| Email interne | Boîte vide | Aucun message dans aucun dossier |
| Email interne | Échec d'envoi | Un message resté non parti, avec bouton Réessayer |

Les modes « chargement », « aucune donnée », « erreur de chargement » et « échec de
sauvegarde » restent disponibles partout.

### Alertes des tableaux de bord

Les bandeaux rouges ont disparu des tableaux de bord en fonctionnement normal. Un
dépassement de budget, un conflit d'agenda ou une demande expirée s'affichent en
avertissement ambre, jamais en alarme. Le rouge est réservé aux échecs techniques —
chargement impossible, sauvegarde refusée — qui n'apparaissent que dans les modes de
démonstration correspondants.

## Correctif — bande blanche sous l'application

La coque déclarait `h-screen`, soit 100 % de la hauteur de la fenêtre. Dans une iframe
dont l'hôte fixe lui-même la hauteur, les deux mesures divergent : l'application
s'arrêtait à 100 vh tandis que le cadre était plus haut, laissant défiler dans le vide
sous le contenu.

L'application se cale désormais sur son conteneur plutôt que sur la fenêtre :
`html`, `body` et `#root` sont à `height: 100%`, la coque passe en `h-full`, et le
`body` est en `overflow: hidden` puisque le défilement appartient à la zone de contenu.

Deux ajustements accompagnent le correctif. Les conteneurs flex intermédiaires reçoivent
`min-h-0`, sans quoi un enfant au contenu long refuse de rétrécir et repousse la hauteur
de son parent. Et `.ac-scroll` porte `overscroll-behavior: contain`, pour qu'un
défilement arrivé en bout de course ne se propage pas au parent.

## Correctif — graphiques à barres groupées

`GroupedBars` calculait la hauteur de chaque barre en pourcentage, à l'intérieur d'un
conteneur flex dont la hauteur restait automatique. Une hauteur en pourcentage ne se
résout pas contre un parent de hauteur indéterminée : les barres tombaient à zéro et le
graphique paraissait vide, alors que la légende et les libellés s'affichaient.

Les hauteurs sont désormais calculées en pixels contre une zone de tracé fixe. Le
composant accepte aussi `formatValeur`, pour afficher des euros plutôt que des nombres
bruts au-dessus des barres, et `colonneLabel`, qui nomme la première colonne du tableau
équivalent destiné aux lecteurs d'écran — il annonçait « Exercice » partout, y compris
sur des graphiques par poste ou par projet.

Le correctif touche les six écrans qui utilisent ce graphique : tableau de bord et
rapports de comptabilité, rapport de trésorerie, tableau de bord des adhérents, tableau
de bord des projets et onglet Budget de la fiche projet.

## Étape suivante

Le stockage réel des fichiers, la génération de PDF et l'export comptable (FEC, journaux)
sont les compléments naturels. La couche de persistance reste à brancher : les contextes exposent déjà des
fonctions asynchrones prêtes à devenir des appels réseau.
