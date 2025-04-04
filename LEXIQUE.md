# 📋 Bible Flux Financier Fundora – Lexique Global 2025

## 🔹 Concepts Généraux

### Stratégie (Strategy)
Orientation d'investissement définie par Fundora pour placer des fonds dans un ou plusieurs véhicules cibles.

### Fonds
Véhicule d'investissement cible (ex : fonds de Private Equity).

### Allocation
Montant total recherché pour une stratégie donnée. Sert de base au calcul des pourcentages de détention des investisseurs.

### Investisseur
Utilisateur retail de Fundora qui engage un montant dans une stratégie.

### Durée d'investissement
Horizon temporel défini par la stratégie (ex : 10 ans). Sert de base pour calculer certains frais et échéances.

### Détention (%)
Part détenue par un investisseur dans une stratégie cible.
- **Formule** : Montant investi / Allocation totale de la stratégie
- **Exemple** : 7 500 € sur une allocation de 100 000 € = 7,5 % de détention

## 📄 Processus Financiers

### Répartition automatique à l'investissement (Appel de fonds n°1)

#### Description
Répartition automatique du montant investi d'un utilisateur dans une stratégie entre les différents wallets.

#### Calculs effectués
- **Montant commit** : Somme engagée par l'investisseur
- **Frais de structuration** : 3 % du montant commit
- **Frais de gestion** : 1,7 % × durée × montant commit
- **Montant payé** : Montant commit + frais de structuration + frais de gestion

#### Répartition des fonds
- **Trésorerie investie** = Montant Commit × % appel de fonds → Wallet SPV Stratégie
- **Trésorerie non investie** = Montant Commit × (1 - % appel) → Wallet SANSO
- **Frais Fundora** = gestion + structuration → Wallet Fundora

#### Exemple (appel de fonds à 60%)
| Nom | Montant Commit | Trésorerie Investie | Trésorerie Non Investie | Frais Gestion | Frais Structuration | Montant Payé | % Détention |
|-----|----------------|---------------------|-------------------------|---------------|---------------------|--------------|-------------|
| Claire Dumas | 7 500 € | 4 500 € | 3 000 € | 127,50 € | 225,00 € | 7 725 € | 7,5 % |
| Romain Grimaldi | 6 500 € | 3 900 € | 2 600 € | 110,50 € | 195,00 € | 6 795 € | 6,5 % |
| Léa Boulanger | 2 500 € | 1 500 € | 1 000 € | 42,50 € | 75,00 € | 2 617,50 € | 2,5 % |

### Distribution du Coupon Obligataire SANSO

#### Description
Distribution des plus-values générées par le placement obligataire de la trésorerie non investie.

#### Calcul du coupon
**Coupon** = Trésorerie non investie × ((VL sortie - VL entrée) / VL entrée) × (Nb jours / 365)

#### Historisation des Coupons
- **Date de valorisation** : Le 15 décembre de chaque année, SANSO effectue une valorisation des placements pour déterminer la valeur liquidative (VL) de sortie.
- **Date de distribution** : Le 20 décembre de chaque année, les coupons sont distribués aux investisseurs.
- **Historisation** : Chaque coupon distribué est enregistré avec ses caractéristiques complètes (année, date de distribution, VL d'entrée, VL de sortie, taux d'intérêt, montant) pour permettre un suivi détaillé des performances année par année.

#### Exemple
| Nom | Trésorerie Non Investie | VL Entrée | VL Sortie | Nb jours | Coupon Reçu (SANSO) |
|-----|-------------------------|-----------|-----------|----------|---------------------|
| Claire Dumas | 4 500 € | 100 € | 103,50 € | 214 | 92,34 € |
| Romain Grimaldi | 3 900 € | 100 € | 103,50 € | 214 | 79,99 € |
| Léa Boulanger | 1 500 € | 100 € | 103,50 € | 214 | 30,78 € |

### Distribution du Fonds Cible (Private Equity)

#### Description
Distribution des plus-values générées par le fonds de Private Equity via une stratégie Fundora.

#### Calcul de la distribution
**Distribution** = Montant investi × % de distribution

#### Historisation des Distributions
- **Historisation** : Chaque distribution est enregistrée avec ses caractéristiques complètes (année, date de distribution, multiple appliqué, montant) pour permettre un suivi détaillé des performances.

#### Exemple (distribution à 3,4%)
| Nom | Montant Investi | % Distribution | Montant Reçu (Fonds Cible) | Date Distribution |
|-----|----------------|----------------|----------------------------|-------------------|
| Claire Dumas | 7 500 € | 3,4 % | 255,00 € | 15/12/2030 |
| Romain Grimaldi | 6 500 € | 3,4 % | 221,00 € | 15/12/2030 |
| Léa Boulanger | 2 500 € | 3,4 % | 85,00 € | 15/12/2030 |

## 📊 Simulation de Stratégie

### Description
Création d'une stratégie test, ajout d'investisseurs et simulation automatique de tous les flux (wallets, appels de fonds, coupons).

### Paramètres de simulation
- Montant de l'allocation (ex : 100 000 €)
- Pourcentage de répartition (fonds cible / fonds obligataire)
- Pourcentage d'appel initial (ex : 40 %)
- Date de début / horizon d'investissement

### Exemple de cap table simulée
| Nom | Montant Investi | Trésorerie Investie | Trésorerie Non Investie | Coupon SANSO | Distribution Fonds Cible | Wallet Final |
|-----|----------------|---------------------|-------------------------|-------------|--------------------------|-------------|
| Claire Dumas | 7 500 € | 3 000 € | 4 500 € | 92,34 € | 255,00 € | 7 847,34 € |
| Romain Grimaldi | 6 500 € | 2 600 € | 3 900 € | 79,99 € | 221,00 € | 7 000,99 € |
| Léa Boulanger | 2 500 € | 1 000 € | 1 500 € | 30,78 € | 85,00 € | 2 615,78 € |

## 💰 Types de Wallets

### Wallet Investisseur
Portefeuille électronique principal de l'investisseur sur la plateforme Fundora. C'est le point d'entrée et de sortie des fonds entre le compte bancaire de l'investisseur et l'écosystème Fundora. Lors d'un investissement, les fonds sont débités de ce wallet pour être répartis dans les autres wallets.

### Wallet SPV Stratégie
Contient les fonds effectivement investis dans le véhicule d'investissement cible (ex: fonds de Private Equity). Ces fonds sont appelés selon le pourcentage d'appel initial et les appels complémentaires.

### Wallet SANSO
Contient la trésorerie non investie placée dans des produits obligataires gérés par SANSO. Cette trésorerie génère des coupons qui sont ensuite reversés au Wallet Investisseur.

### Wallet Fundora
Contient les frais de gestion et de structuration perçus par Fundora. Ces frais sont prélevés lors de l'investissement initial.

### Wallet Final
Représente le solde actuel disponible dans le portefeuille électronique de l'investisseur après toutes les opérations de cash-in et cash-out. Ce n'est pas une mesure de performance mais le montant réellement disponible pour l'investisseur dans son wallet sur la plateforme.

## 💸 Flux de Trésorerie

### Cash-Out
Opération de débit du Wallet Investisseur vers les autres wallets (SPV, SANSO, Fundora) lors de l'investissement initial ou des appels complémentaires.

### Cash-In
Opération de crédit du Wallet Investisseur depuis les autres wallets lors des distributions (coupon SANSO, distribution du fonds cible). Augmente le solde disponible pour l'investisseur.

### Cycle Opérationnel
1. L'investisseur dépose des fonds dans son Wallet Investisseur (depuis son compte bancaire)
2. Cash-Out : Les fonds sont répartis vers les Wallets SPV, SANSO et Fundora
3. Cash-In : Les revenus générés (coupons, distributions) sont reversés au Wallet Investisseur
4. L'investisseur peut retirer les fonds disponibles dans son Wallet Investisseur vers son compte bancaire

### Cycle Opérationnel des Flux Financiers
Le cycle opérationnel des flux financiers dans l'application suit les étapes suivantes :

1. **Création de la stratégie** : Définition des paramètres de la stratégie, y compris la répartition entre le fonds cible et les placements SANSO.
2. **Ajout des investisseurs** : Enregistrement des investisseurs avec leurs montants d'investissement.
3. **Répartition initiale** : Distribution automatique des fonds entre le wallet SPV (fonds cible) et le wallet SANSO selon les pourcentages définis dans la stratégie.
4. **Simulation des coupons SANSO** : Calcul et distribution des coupons SANSO aux dates prévues (valorisation le 15 décembre, distribution le 20 décembre).
5. **Simulation des distributions PE** : Calcul et distribution des retours du fonds cible selon les multiples définis.
6. **Mise à jour des wallets** : À chaque opération, les montants sont transférés entre les différents wallets conformément aux flux de trésorerie définis.
7. **Historisation** : Toutes les transactions sont enregistrées dans l'historique pour permettre un suivi détaillé et une analyse des performances.
