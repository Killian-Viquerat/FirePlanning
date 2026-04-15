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
- Alertes de contraintes avec 2 niveaux :
  - **Alerte critique** si contraintes non respectées
  - **Warning** si contraintes respectées au minimum
- Détail des alertes :
  - présence par rôle (`Rôle (disponibles/requis)`)
  - conflits d'absence avec jour + horaires exacts
  - absents pouvant couvrir les rôles manquants
- Import/Export JSON (groupe, pompiers, membres du groupe, semaine, absences)
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
- Suppression d'absence par clic sur un bloc rouge
- Affichage présence (vert) + absence (rouge)

## Affichage métier

- Badges de fonctions avec libellé complet + acronyme (`Nom complet (ACR)`)
- Badges de grade avant le prénom :
  - rouge : officier et au-dessus
  - vert : adjudant
  - bleu : sergent
  - orange : caporal
  - gris : en dessous de caporal / autres

## Technologie

- **Svelte + Vite + Tailwind CSS**
- Pas de base de données (données en mémoire côté client)
- Stockage local uniquement pour le thème (localStorage)
- **Calendrier implémenté en interne** (grille horaire custom), sans librairie externe de calendrier

## Description de l'implémentation

- Modèle de données principal :
  - `group`, `firefighters`, `groupMemberIds`, `dutyWeek`, `absences`
- Calcul des créneaux de service :
  - génération des créneaux weekend/semaine à partir de la semaine définie
- Calcul présence/absence :
  - soustraction des absences dans chaque créneau pour générer les segments de présence
- Vérification des contraintes :
  - couverture par rôle + test d'assignation possible (backtracking) pour éviter les faux positifs
- Moteur de rendu calendrier custom :
  - grille 30 minutes (48 lignes/jour)
  - positionnement absolu des blocs par `top/height`
  - colonnage dynamique (par pompier, selon la vue)
- UX :
  - pages dédiées (dashboard, groupe, pompiers, semaine, absences, alertes, données, calendriers)
  - design responsive, thème dark/light, badges métier


