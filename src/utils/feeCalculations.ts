/**
 * Utilitaires pour le calcul des frais Fundora selon la grille tarifaire dynamique
 */

/**
 * Calcule les frais de structuration en fonction du montant commit
 * @param commitAmount Montant commit (montant brut engagé hors frais)
 * @returns Pourcentage de frais de structuration (entre 0 et 1)
 */
export const calculateStructurationFeeRate = (commitAmount: number): number => {
  if (commitAmount <= 30000) {
    return 0.03; // 3% pour 0-30k
  } else if (commitAmount <= 100000) {
    return 0.025; // 2.5% pour 30k-100k
  } else {
    return 0.02; // 2% pour 100k+
  }
};

/**
 * Calcule les frais de gestion en fonction du montant commit
 * @param commitAmount Montant commit (montant brut engagé hors frais)
 * @returns Pourcentage de frais de gestion annuel (entre 0 et 1)
 */
export const calculateManagementFeeRate = (commitAmount: number): number => {
  if (commitAmount <= 30000) {
    return 0.017; // 1.7% pour 0-30k
  } else if (commitAmount <= 100000) {
    return 0.015; // 1.5% pour 30k-100k
  } else {
    return 0.012; // 1.2% pour 100k+
  }
};

/**
 * Calcule le montant des frais de structuration
 * @param commitAmount Montant commit (montant brut engagé hors frais)
 * @returns Montant des frais de structuration
 */
export const calculateStructurationFee = (commitAmount: number): number => {
  const rate = calculateStructurationFeeRate(commitAmount);
  return parseFloat((commitAmount * rate).toFixed(2));
};

/**
 * Calcule le montant des frais de gestion pour toute la durée de vie du fonds
 * @param commitAmount Montant commit (montant brut engagé hors frais)
 * @param durationInYears Durée de vie du fonds en années
 * @returns Montant total des frais de gestion pour toute la durée
 */
export const calculateManagementFee = (commitAmount: number, durationInYears: number): number => {
  const rate = calculateManagementFeeRate(commitAmount);
  return parseFloat((commitAmount * rate * durationInYears).toFixed(2));
};

/**
 * Calcule le montant total des frais (structuration + gestion)
 * @param commitAmount Montant commit (montant brut engagé hors frais)
 * @param durationInYears Durée de vie du fonds en années
 * @returns Montant total des frais
 */
export const calculateTotalFees = (commitAmount: number, durationInYears: number): number => {
  const structurationFee = calculateStructurationFee(commitAmount);
  const managementFee = calculateManagementFee(commitAmount, durationInYears);
  return parseFloat((structurationFee + managementFee).toFixed(2));
};

/**
 * Calcule le montant investi (montant commit - frais de gestion)
 * @param commitAmount Montant commit (montant brut engagé hors frais)
 * @param durationInYears Durée de vie du fonds en années
 * @returns Montant investi
 */
export const calculateInvestedAmount = (commitAmount: number, durationInYears: number): number => {
  const managementFee = calculateManagementFee(commitAmount, durationInYears);
  return parseFloat((commitAmount - managementFee).toFixed(2));
};

/**
 * Calcule le montant payé (montant commit + frais de structuration)
 * @param commitAmount Montant commit (montant brut engagé hors frais)
 * @returns Montant payé
 */
export const calculatePaidAmount = (commitAmount: number): number => {
  const structurationFee = calculateStructurationFee(commitAmount);
  return parseFloat((commitAmount + structurationFee).toFixed(2));
};

/**
 * Calcule la répartition des montants dans les différents wallets
 * @param commitAmount Montant engagé par l'investisseur
 * @param durationInYears Durée de vie de la stratégie en années
 * @param initialCallPercentage Pourcentage d'appel initial
 * @param initialBalance Solde initial de l'investisseur (par défaut 100 000 €)
 * @returns Objet contenant les montants pour chaque wallet
 */
export const calculateWalletAmounts = (
  commitAmount: number,
  durationInYears: number,
  initialCallPercentage: number,
  initialBalance: number = 100000
): {
  investedAmount: number;
  paidAmount: number;
  investorAmount: number;
  spvAmount: number;
  sansoAmount: number;
  fundoraAmount: number;
} => {
  // Calculer le taux de frais de structuration pour ce montant commit
  const structurationFeeRate = calculateStructurationFeeRate(commitAmount);
  
  // Calculer le taux de frais de gestion pour ce montant commit
  const managementFeeRate = calculateManagementFeeRate(commitAmount);
  
  // Vérifier si le montant payé dépasserait le solde initial
  const potentialPaidAmount = commitAmount * (1 + structurationFeeRate);
  
  // Si le montant payé dépasse le solde initial, recalculer le montant commit maximum possible
  let safeCommitAmount = commitAmount;
  if (potentialPaidAmount > initialBalance) {
    console.warn(`Le montant payé (${potentialPaidAmount.toFixed(2)}€) dépasse le solde initial (${initialBalance}€). Ajustement nécessaire.`);
    // Formule inversée pour trouver le montant commit maximum possible
    // commit + (commit * structurationFeeRate) = initialBalance
    // commit * (1 + structurationFeeRate) = initialBalance
    // commit = initialBalance / (1 + structurationFeeRate)
    safeCommitAmount = parseFloat((initialBalance / (1 + structurationFeeRate)).toFixed(2));
  }
  
  // Calculer les frais avec le montant commit sécurisé
  const structurationFee = parseFloat((safeCommitAmount * structurationFeeRate).toFixed(2));
  const managementFee = parseFloat((safeCommitAmount * managementFeeRate * durationInYears).toFixed(2));
  
  // Calculer le montant investi (commit - frais de gestion)
  const investedAmount = parseFloat((safeCommitAmount - managementFee).toFixed(2));
  
  // Calculer le montant payé (commit + frais de structuration)
  const paidAmount = parseFloat((safeCommitAmount + structurationFee).toFixed(2));
  
  // Calculer le montant dans le wallet SPV (montant investi × pourcentage d'appel initial)
  const spvAmount = parseFloat((investedAmount * (initialCallPercentage / 100)).toFixed(2));
  
  // Calculer le montant dans le wallet SANSO (montant investi × (1 - pourcentage d'appel initial))
  const sansoAmount = parseFloat((investedAmount * (1 - initialCallPercentage / 100)).toFixed(2));
  
  // Calculer le montant des frais Fundora (frais de structuration + frais de gestion)
  const fundoraAmount = parseFloat((structurationFee + managementFee).toFixed(2));
  
  // Calculer le montant restant dans le wallet de l'investisseur (solde initial - montant payé)
  const investorAmount = parseFloat((initialBalance - paidAmount).toFixed(2));
  
  return {
    investedAmount,
    paidAmount,
    investorAmount,
    spvAmount,
    sansoAmount,
    fundoraAmount
  };
};
