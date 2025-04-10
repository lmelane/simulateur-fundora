// Modèle actuel (pour la compatibilité avec le code existant)
export interface Investor {
  id: string;
  name: string;
  commitAmount: number; // Montant brut engagé (hors frais)
  investedAmount: number; // Montant commit - frais de gestion
  paidAmount: number; // Montant commit + frais de structuration
  ownershipPercentage: number; // Pourcentage de détention dans la stratégie
  initialBalance?: number; // Solde initial de l'investisseur avant tout investissement
  wallets: {
    investor: number; // Solde disponible dans le wallet de l'investisseur (anciennement "final")
    spv: number; // Fonds investis dans le fonds cible (anciennement "invested")
    sanso: number; // Trésorerie non investie placée chez SANSO (anciennement "nonInvested")
    fundora: number; // Frais perçus par Fundora
  };
  fees: {
    structuration: number; // Frais de structuration (one-shot)
    management: number; // Frais de gestion (annuels × durée de vie)
    total: number; // Total des frais
  };
  transactions: {
    sansoInterest: number; // Total des coupons reçus du placement SANSO
    targetFundDistribution: number; // Total des distributions reçues du fonds cible
  };
  // Historique des transactions
  history: {
    sansoInterests: SansoInterestHistory[];
    targetFundDistributions: PEDistributionHistory[];
    fundCalls: FundCallHistory[]; // Historique des appels de fonds
    fundoraFees?: FundoraFeesHistory[]; // Historique des frais Fundora
  };
  // Référence à l'investisseur global
  globalInvestorId?: string;
  actualInvestedAmount?: number; // Montant réellement investi après ajustements (pour éviter la sur-souscription)
}

export interface Strategy {
  id: string;
  name: string;
  totalAllocation: number;
  targetFundPercentage: number;
  bondFundPercentage: number;
  initialCallPercentage: number;
  startDate: Date;
  investmentHorizon: Date;
  investors: Investor[];
  createdAt: Date;
  // Nouveaux champs pour le calcul dynamique de la levée Fundora
  netTargetAllocation?: number; // Allocation nette cible (montant réellement investi)
  durationInYears?: number; // Durée de la stratégie en années
  indicativeAmount?: number; // Montant indicatif à lever (allocation × 1,2)
  totalRaisedAmount?: number; // Montant total levé brut (somme des engagements)
  totalNetInvestedAmount?: number; // Montant total réellement investi (somme des nets)
  remainingToInvest?: number; // Reste à investir (allocation - net total)
  status?: 'open' | 'closed'; // Statut de la stratégie (ouvert ou fermé)
}

export interface SansoSimulation {
  entryNav: number;
  exitNav: number;
  entryDate: Date;
  exitDate: Date;
  interestRate: number; // Calculated based on NAV difference
  distributionDate: Date; // Date de distribution du coupon
  year: number; // Année du coupon
}

export interface PEDistribution {
  multiple: number; // e.g., 3.4%
  distributionDate: Date;
}

// Interface pour la simulation de distribution du fonds cible
export interface TargetFundDistribution {
  multiple: number; // Pourcentage du multiple à distribuer
  distributionDate: Date; // Date de la distribution
}

// Historique des coupons SANSO
export interface SansoInterestHistory {
  amount: number; // Montant du coupon
  distributionDate: Date; // Date de distribution
  entryNav: number; // VL d'entrée
  exitNav: number; // VL de sortie
  interestRate: number; // Taux d'intérêt appliqué
  year: number; // Année de distribution
  daysPeriod?: number; // Nombre de jours entre la date d'entrée et la date de sortie
}

// Historique des distributions PE
export interface PEDistributionHistory {
  amount: number; // Montant de la distribution
  distributionDate: Date; // Date de distribution
  multiple: number; // Multiple appliqué
  year: number; // Année de distribution
}

// Historique des appels de fonds
export interface FundCallHistory {
  date: Date; // Date de l'appel de fonds
  type?: 'fund_call'; // Type de transaction
  callNumber: number; // Numéro de l'appel de fonds
  percentage?: number; // Pourcentage appelé
  amount: number; // Montant de l'appel de fonds
  comment?: string; // Commentaire optionnel
  description?: string; // Nouveau champ pour la description
}

// Historique des frais Fundora
export interface FundoraFeesHistory {
  date: Date; // Date de l'enregistrement des frais
  type?: 'fundora_fees'; // Type de transaction
  structurationFee: number; // Frais de structuration
  managementFee: number; // Frais de gestion
  totalFee: number; // Total des frais
  comment?: string; // Commentaire optionnel
  description?: string; // Nouveau champ pour la description
}

export interface CapTableEntry {
  investorId: string;
  investorName: string;
  paidAmount: number; // Montant payé (commit + frais de structuration)
  investedAmount: number; // Montant investi (commit - frais de gestion)
  nonInvestedAmount: number; // Montant non investi restant (wallet SANSO)
  ownershipPercentage: number; // Pourcentage de détention dans la stratégie
  spvWallet: number; // Fonds dans le wallet SPV Stratégie
  sansoWallet: number; // Fonds dans le wallet SANSO
  sansoInterest: number; // Total des coupons reçus
  targetFundDistribution: number; // Total des distributions reçues
  investorWallet: number; // Solde disponible dans le wallet de l'investisseur
  initialFundCallAmount: number; // Montant de l'appel de fonds N°1
  // Historique des transactions
  sansoInterestHistory?: SansoInterestHistory[];
  targetFundDistributionHistory?: PEDistributionHistory[];
  fundCallsHistory?: FundCallHistory[]; // Historique de tous les appels de fonds
}

// Nouveau modèle (pour la future implémentation)
// Investisseur global (indépendant des stratégies)
export interface GlobalInvestor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  // Autres informations personnelles de l'investisseur
  investments: StrategyInvestment[]; // Liste des investissements de cet investisseur
}

// Investissement spécifique à une stratégie
export interface StrategyInvestment {
  id: string;
  investorId: string; // Référence à l'investisseur global
  strategyId: string; // Référence à la stratégie
  investedAmount: number; // Montant total investi (commit) dans cette stratégie
}
