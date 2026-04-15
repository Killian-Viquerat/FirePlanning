# Introduction

Cette application sert à planifier l'horaire de piquet d'une semaine pour un groupe de sapeurs-pompiers.  
Elle fournit une vue complète des présences/absences, des contraintes de couverture, et un tableau de bord opérationnel.

## Groupe

L'outil gère un groupe de piquet, numéroté sous la forme **N0X** :
- **X** = numéro du groupe
- **N** = groupe de nuit

## Pompier

Un pompier est défini par :
- Nom
- Prénom
- Grade
- Liste de fonctions

## Grade 

Composition: nom complet - acronyme
Gris
- Sapeur - Sap
- Appointé - App
Orange
- Caporal - Cpl
Bleu
- Sergent - Sgt
- Sergent Chef - Sgtc
Vert
- Sergent Major - Sgtm
- Fourrier - Four
- Sergent Major Chef - Sgtmc
- Adjudant - Adj
Rouge
- Lieutenant - Lt
- Premier Lieutenant - Plt
- Capitaine - Cap
- Major - Maj

## Fonctions

Fonctions disponibles :
- **APR** - Porteur appareil respiratoire
- **CPL** - Chauffeur point lourd
- **MEA** - Machiniste échelle
- **EQ** - Équipier
- **CE** - Chef extinction

## Semaine de piquet

La semaine de piquet est définie par une date de début et de fin.  
Le découpage opérationnel utilisé par l'application est :
- 1 créneau **weekend** (du début de la semaine de piquet jusqu'au lundi 06:00, borné par la date de fin)
- puis des créneaux **journaliers** de 18:00 à 06:00 (bornés par la date de fin)

À la définition d'une semaine de piquet, tous les membres du groupe sont en permanence par défaut (sauf absences déclarées).

## Contraintes

### Weekend (minimum 5 personnes)
- APR
- APR
- CPL
- EQ
- CE

### Semaine (minimum 6 personnes)
- CE
- CPL
- MEA
- APR
- APR
- EQ

## Fonctionnalités implémentées

- Création, modification et suppression du groupe de piquet
- Ajout, modification et suppression des sapeurs-pompiers
- Affectation des pompiers au groupe
- Définition, modification et suppression de la semaine de piquet
- Gestion des absences (formulaire + calendrier individuel)
- Initialisation automatique de données de démonstration si aucune donnée n'est chargée
- Navigation automatique vers le calendrier individuel en mode démo
- Alertes de contraintes avec 2 niveaux :
  - **Alerte critique** si contraintes non respectées
  - **Warning** si contraintes respectées au minimum
- Détail des alertes :
  - présence par rôle (`Rôle (disponibles/requis)`)
  - conflits d'absence avec jour + horaires exacts
  - absents pouvant couvrir les rôles manquants
- Import/Export JSON (groupe, pompiers, membres du groupe, semaine, absences)
- Compatibilité import avec ancien format (`group.memberIds`) et format actuel (`groupMemberIds`)
- Navigation multi-pages avec barre de navigation haute
- Thème clair/sombre (toggle "Black theme / White theme")
- Dashboard synthétique :
  - tuiles KPI (groupe, effectif, absences, alertes, etc.)
  - couverture par rôle
  - absences par pompier

## Calendriers (version actuelle)

### Calendrier global (lecture seule)
- Navigation : Précédent / Aujourd'hui / Suivant
- Modes **Jour** et **Semaine**
- En mode **Jour** : colonnes par pompier (nom + grade), horaires côte à côte
- En mode **Semaine** : 1 colonne par jour avec sous-colonnes internes par pompier (évite la superposition)
- Affichage des présences (vert) et absences (rouge)

### Calendrier individuel (édition)
- Navigation : Précédent / Aujourd'hui / Suivant
- Sélection du pompier à éditer
- Ajout d'absence :
  - clic sur un créneau (30 min)
  - ou clic-glisser (drag) sur plusieurs créneaux pour ajouter rapidement une absence
  - extension de sélection pendant le drag (suivi `pointermove` + `pointerenter`)
- Suppression d'absence par clic sur un bloc rouge
- Affichage présence (vert) + absence (rouge)
- Affichage des segments d'absence hors permanence (parties "orphelines") pour ne rien perdre visuellement

## Affichage métier

- Badges de fonctions avec libellé complet + acronyme (`Nom complet (ACR)`)
- Liste de grades proposée dans les formulaires :
  - Sapeur (Sap), Appointé (App)
  - Caporal (Cpl)
  - Sergent (Sgt), Sergent Chef (Sgtc)
  - Sergent Major (Sgtm), Fourrier (Four), Sergent Major Chef (Sgtmc), Adjudant (Adj)
  - Lieutenant (Lt), Premier Lieutenant (Plt), Capitaine (Cap), Major (Maj)
- Badges de grade avant le prénom :
  - texte du badge : **acronyme du grade**
  - rouge : Lieutenant, Premier Lieutenant, Capitaine, Major
  - vert : Sergent Major, Fourrier, Sergent Major Chef, Adjudant
  - bleu : Sergent, Sergent Chef
  - orange : Caporal
  - gris : Sapeur, Appointé

## Technologie

- **Svelte + Vite + Tailwind CSS**
- Pas de base de données (données en mémoire côté client)
- Stockage local uniquement pour le thème (localStorage)
- **Calendrier implémenté en interne** (grille horaire custom), sans librairie externe de calendrier

## Description de l'implémentation

### 1) Gestion du groupe
- Données : `group` (code, nom, membres), `groupMemberIds`
- Édition : formulaires dédiés + normalisation du code (`N0X`)
- Synchronisation : les affectations sont pilotées par `groupMemberIds` et réutilisées partout (dashboard, alertes, calendriers)

### 2) Gestion des pompiers
- Données : `firefighters` (identité, grade, fonctions)
- CRUD complet : ajout, modification, suppression
- Impact métier : les rôles d'un pompier alimentent la couverture des contraintes et les badges d'affichage

### 3) Semaine de piquet et créneaux opérationnels
- Données : `dutyWeek.start`, `dutyWeek.end`
- Génération des créneaux (`shiftSlots`) :
  - un créneau "weekend" depuis le début jusqu'au lundi 06:00 (borné)
  - puis des créneaux journaliers 18:00 → 06:00 (bornés)
- Ces créneaux servent de base à l'affichage global et au moteur d'alertes

### 4) Gestion des absences (formulaire + calendrier)
- Données : `absences` (id, firefighterId, start, end)
- Création par formulaire et par interactions directes sur le calendrier
- Suppression rapide par clic sur un bloc d'absence

### 5) Calendrier global (lecture seule)
- Vue jour/semaine avec navigation temporelle
- Calcul des segments calendrier :
  - conversion des événements en positions visuelles (`top/height`)
  - colonnage par pompier en vue jour
  - sous-colonnes par pompier en vue semaine pour éviter les recouvrements

### 6) Calendrier individuel (édition avancée)
- Grille custom de 48 créneaux (30 min)
- Interaction d'édition :
  - `pointerdown` : début de sélection
  - `pointermove` + `pointerenter` : extension de la plage
  - `pointerup` : validation et création de l'absence
  - clic simple : création immédiate d'un créneau de 30 min
- Sécurité UX : suppression du double déclenchement clic/drag via un flag de suppression du clic suivant
- Robustesse : la logique de drag s'appuie sur une référence directe de la colonne du calendrier individuel (pas une recherche DOM globale)

### 7) Rendu présence/absence et segments "orphelins"
- Pour chaque créneau de service :
  - calcul des segments d'absence en intersection
  - soustraction pour produire les segments de présence
- En complément :
  - calcul des portions d'absence hors créneaux de service
  - rendu de ces portions "orphelines" pour afficher l'absence complète

### 8) Alertes de contraintes
- Vérification des minima weekend/semaine par rôle
- Détails d'alerte :
  - présence disponible vs requise par fonction
  - absences en conflit sur la plage horaire
  - candidats absents pouvant couvrir les rôles manquants
- Mécanisme d'assignation avec backtracking pour limiter les faux positifs

### 9) Import / Export JSON
- Export complet de l'état : `group`, `firefighters`, `groupMemberIds`, `dutyWeek`, `absences`
- Import avec validation minimale et filtrage des identifiants inconnus
- Compatibilité ascendante :
  - priorité à `groupMemberIds`
  - fallback automatique vers `group.memberIds` pour les anciens exports

### 10) UX globale et thème
- Navigation par pages (hash routing interne)
- Tableau de bord opérationnel (KPI + couverture + absences)
- Thème clair/sombre persistant via `localStorage`
- Composants visuels métier : badges de rôle, badges de grade, cartes de synthèse
