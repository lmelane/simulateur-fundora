// Modèle actuel (pour la compatibilité avec le code existant)
export interface Investor {
  id: string;
  name: string;
  investedAmount: number; // Montant total investi (commit)
  ownershipPercentage: number; // Pourcentage de détention dans la stratégie
  initialBalance?: number; // Solde initial de l'investisseur avant tout investissement
  wallets: {
    investor: number; // Solde disponible dans le wallet de l'investisseur (anciennement "final")
    spv: number; // Fonds investis dans le fonds cible (anciennement "invested")
    sanso: number; // Trésorerie non investie placée chez SANSO (anciennement "nonInvested")
    fundora: number; // Frais perçus par Fundora
  };
  transactions: {
    sansoInterest: number; // Total des coupons reçus du placement SANSO
    targetFundDistribution: number; // Total des distributions reçues du fonds cible
  };
  // Historique des transactions
  history: {
    sansoInterests: SansoInterestHistory[];
    targetFundDistributions: PEDistributionHistory[];
  };
  // Référence à l'investisseur global
  globalInvestorId?: string;
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

export interface CapTableEntry {
  investorId: string;
  investorName: string;
  investedAmount: number; // Montant total investi (commit)
  spvWallet: number; // Fonds dans le wallet SPV Stratégie
  sansoWallet: number; // Fonds dans le wallet SANSO
  sansoInterest: number; // Total des coupons reçus
  targetFundDistribution: number; // Total des distributions reçues
  investorWallet: number; // Solde disponible dans le wallet de l'investisseur
  // Historique des transactions
  sansoInterestHistory?: SansoInterestHistory[];
  targetFundDistributionHistory?: PEDistributionHistory[];
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
