import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Strategy, Investor, SansoSimulation, PEDistribution, CapTableEntry, FundCallHistory, TargetFundDistribution } from '../types/models';
import {
  calculateStructurationFee,
  calculateManagementFee,
  calculateTotalFees,
  calculateInvestedAmount,
  calculatePaidAmount,
  calculateWalletAmounts
} from '../utils/feeCalculations';

// Clés pour le stockage local
const STRATEGIES_STORAGE_KEY = 'strategies';
const CURRENT_STRATEGY_STORAGE_KEY = 'currentStrategy';

interface StrategyContextType {
  strategies: Strategy[];
  currentStrategy: Strategy | null;
  setCurrentStrategy: (strategy: Strategy) => void;
  createStrategy: (strategyData: Omit<Strategy, 'id' | 'investors' | 'createdAt'>) => Strategy;
  addInvestorsToStrategy: (strategyId: string, investors: Omit<Investor, 'id' | 'ownershipPercentage' | 'wallets' | 'transactions' | 'history' | 'fees' | 'paidAmount' | 'investedAmount' | 'commitAmount'>[]) => Strategy | null;
  simulateSansoInterest: (strategyId: string, simulation: SansoSimulation) => void;
  simulatePEDistribution: (strategyId: string, distribution: PEDistribution) => void;
  simulateTargetFundDistribution: (strategyId: string, simulation: TargetFundDistribution) => void;
  simulateNewFundCall: (strategyId: string, callNumber: number, callPercentage: number) => void;
  getCapTable: (strategyId: string) => CapTableEntry[];
  getInvestorById: (investorId: string) => Investor | undefined;
  getInvestorStrategies: (investorId: string) => Strategy[];
  getTotalSansoInterest: (investorId: string) => number;
  investors: Investor[];
}

const StrategyContext = createContext<StrategyContextType>({
  strategies: [],
  currentStrategy: null,
  setCurrentStrategy: () => {},
  createStrategy: () => ({} as Strategy),
  addInvestorsToStrategy: () => null,
  simulateSansoInterest: () => {},
  simulatePEDistribution: () => {},
  simulateTargetFundDistribution: () => {},
  simulateNewFundCall: () => {},
  getCapTable: () => [],
  getInvestorById: () => undefined,
  getInvestorStrategies: () => [],
  getTotalSansoInterest: () => 0,
  investors: [],
});

export const useStrategy = () => {
  const context = useContext(StrategyContext);
  if (!context) {
    throw new Error('useStrategy must be used within a StrategyProvider');
  }
  return context;
};

interface StrategyProviderProps {
  children: ReactNode;
}

// Fonction pour convertir les chaînes de date en objets Date
const convertDatesToObjects = (strategy: any): Strategy => {
  console.log("convertDatesToObjects - stratégie avant conversion:", strategy);
  console.log("convertDatesToObjects - investisseurs avant conversion:", strategy.investors);
  
  const convertedStrategy = {
    ...strategy,
    startDate: new Date(strategy.startDate),
    investmentHorizon: new Date(strategy.investmentHorizon),
    createdAt: new Date(strategy.createdAt),
    investors: Array.isArray(strategy.investors) 
      ? strategy.investors.map((investor: any) => ({
          ...investor,
          history: {
            sansoInterests: Array.isArray(investor.history?.sansoInterests) 
              ? investor.history.sansoInterests.map((interest: any) => ({
                  ...interest,
                  distributionDate: new Date(interest.distributionDate),
                }))
              : [],
            targetFundDistributions: Array.isArray(investor.history?.targetFundDistributions)
              ? investor.history.targetFundDistributions.map((distribution: any) => ({
                  ...distribution,
                  distributionDate: new Date(distribution.distributionDate),
                }))
              : [],
            fundCalls: Array.isArray(investor.history?.fundCalls)
              ? investor.history.fundCalls.map((call: any) => ({
                  ...call,
                  date: new Date(call.date),
                }))
              : [],
            fundoraFees: Array.isArray(investor.history?.fundoraFees)
              ? investor.history.fundoraFees.map((fee: any) => ({
                  ...fee,
                  date: new Date(fee.date),
                }))
              : [],
          },
        }))
      : [],
  };
  
  console.log("convertDatesToObjects - stratégie après conversion:", convertedStrategy);
  console.log("convertDatesToObjects - investisseurs après conversion:", convertedStrategy.investors);
  
  return convertedStrategy;
};

const StrategyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialiser l'état avec les données du localStorage si elles existent
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    try {
      const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
      if (storedStrategies) {
        const parsedStrategies = JSON.parse(storedStrategies);
        return Array.isArray(parsedStrategies) 
          ? parsedStrategies.map(convertDatesToObjects)
          : [];
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des stratégies depuis le localStorage:', error);
      return [];
    }
  });

  const [currentStrategy, setCurrentStrategy] = useState<Strategy | null>(() => {
    try {
      const storedCurrentStrategy = localStorage.getItem(CURRENT_STRATEGY_STORAGE_KEY);
      if (storedCurrentStrategy) {
        return convertDatesToObjects(JSON.parse(storedCurrentStrategy));
      }
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la stratégie courante depuis le localStorage:', error);
      return null;
    }
  });

  const [investors, setInvestors] = useState<Investor[]>([]);

  // Sauvegarder les stratégies dans le localStorage à chaque changement
  useEffect(() => {
    try {
      console.log("StrategyContext - Sauvegarde des stratégies dans le localStorage:", strategies.map(s => ({ id: s.id, name: s.name })));
      localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(strategies));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des stratégies dans le localStorage:', error);
    }
  }, [strategies]);

  // Sauvegarder la stratégie courante dans le localStorage à chaque changement
  useEffect(() => {
    try {
      if (currentStrategy) {
        console.log("StrategyContext - Sauvegarde de la stratégie courante dans le localStorage:", { id: currentStrategy.id, name: currentStrategy.name });
        localStorage.setItem(CURRENT_STRATEGY_STORAGE_KEY, JSON.stringify(currentStrategy));
      } else {
        console.log("StrategyContext - Suppression de la stratégie courante du localStorage");
        localStorage.removeItem(CURRENT_STRATEGY_STORAGE_KEY);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la stratégie courante dans le localStorage:', error);
    }
  }, [currentStrategy]);

  const createStrategy = (strategyData: Omit<Strategy, 'id' | 'investors' | 'createdAt'>): Strategy => {
    const initialCallPercentage = strategyData.initialCallPercentage || strategyData.targetFundPercentage;
    const newStrategy: Strategy = {
      id: uuidv4(),
      ...strategyData,
      initialCallPercentage,
      investors: [],
      createdAt: new Date(),
    };
    console.log("StrategyContext - Nouvelle stratégie créée:", newStrategy);
  
    // Mettre à jour l'état React
    setStrategies(prev => {
      const updatedStrategies = [...prev, newStrategy];
      
      // Sauvegarder dans le localStorage
      localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(updatedStrategies));
      
      return updatedStrategies;
    });
  
    // Mettre à jour la stratégie courante
    setCurrentStrategy(newStrategy);
  
    return newStrategy;
  };

  const addInvestorsToStrategy = (strategyId: string, investors: any[]) => {
    console.log("StrategyContext - Investisseurs à ajouter:", investors);
    console.log("StrategyContext - ID de la stratégie cible:", strategyId);

    // Rechercher la stratégie cible
    const targetStrategy = findStrategyById(strategyId);
    console.log("StrategyContext - Stratégie trouvée:", targetStrategy);

    if (!targetStrategy) {
      console.error("StrategyContext - Stratégie non trouvée avec l'ID:", strategyId);
      return null;
    }

    // Calculer le montant total investi dans la stratégie (existant + nouveaux investisseurs)
    const existingTotalInvestment = targetStrategy.investors.reduce((sum, inv) => sum + inv.commitAmount, 0);
    
    // Pour les nouveaux investisseurs, nous devons estimer leur commitAmount
    // Nous utilisons 70% du solde initial comme dans la création des nouveaux investisseurs
    const estimatedNewInvestment = investors.reduce((sum, inv) => sum + (inv.initialBalance ? Math.floor(inv.initialBalance * 0.7) : 0), 0);
    
    const totalInvestment = existingTotalInvestment + estimatedNewInvestment;
    
    // Vérifier les contraintes de montant total levé par rapport au montant théorique à lever
    const indicativeAmount = targetStrategy.indicativeAmount || (targetStrategy.netTargetAllocation !== undefined ? targetStrategy.netTargetAllocation * 1.2 : 0);
    
    // Calculer le pourcentage du montant total levé par rapport au montant théorique
    const percentageOfTarget = (totalInvestment / indicativeAmount) * 100;
    
    // Vérifier si le montant total levé respecte les contraintes (entre 100% et 130%)
    if (percentageOfTarget > 130) {
      console.error(`StrategyContext - Le montant total levé (${totalInvestment.toLocaleString('fr-FR')} €) dépasse 130% du montant théorique à lever (${indicativeAmount.toLocaleString('fr-FR')} €)`);
      
      // Au lieu de retourner null, nous allons ajuster les montants des investisseurs
      // pour respecter la contrainte de 130%
      const maxAllowedInvestment = indicativeAmount * 1.3;
      const excessAmount = totalInvestment - maxAllowedInvestment;
      
      // Si nous avons des investisseurs existants, nous ne pouvons pas les modifier
      // Nous devons donc ajuster uniquement les nouveaux investisseurs
      if (existingTotalInvestment > 0 && existingTotalInvestment > maxAllowedInvestment) {
        console.error(`StrategyContext - Les investisseurs existants dépassent déjà le montant maximum autorisé`);
        return null;
      }
      
      // Calculer le facteur de réduction à appliquer aux nouveaux investisseurs
      const availableInvestment = maxAllowedInvestment - existingTotalInvestment;
      const reductionFactor = availableInvestment / estimatedNewInvestment;
      
      // Appliquer le facteur de réduction à chaque investisseur
      investors = investors.map(inv => ({
        ...inv,
        initialBalance: Math.max(30000, Math.floor((inv.initialBalance || 0) * reductionFactor))
      }));
      
      console.log(`StrategyContext - Montants des investisseurs ajustés pour respecter la contrainte de 130%`);
      console.log(`StrategyContext - Nouveau montant total estimé: ${(existingTotalInvestment + investors.reduce((sum, inv) => sum + (inv.initialBalance ? Math.floor(inv.initialBalance * 0.7) : 0), 0)).toLocaleString('fr-FR')} €`);
    }
    
    if (percentageOfTarget < 100) {
      console.error(`StrategyContext - Le montant total levé (${totalInvestment.toLocaleString('fr-FR')} €) est inférieur à 100% du montant théorique à lever (${indicativeAmount.toLocaleString('fr-FR')} €)`);
      
      // Au lieu de retourner null, nous allons ajuster les montants des investisseurs
      // pour respecter la contrainte de 100%
      const minRequiredInvestment = indicativeAmount;
      const shortfallAmount = minRequiredInvestment - totalInvestment;
      
      // Calculer le facteur d'augmentation à appliquer aux nouveaux investisseurs
      const increaseFactor = (estimatedNewInvestment + shortfallAmount) / estimatedNewInvestment;
      
      // Appliquer le facteur d'augmentation à chaque investisseur
      investors = investors.map(inv => ({
        ...inv,
        initialBalance: Math.floor((inv.initialBalance || 0) * increaseFactor)
      }));
      
      console.log(`StrategyContext - Montants des investisseurs ajustés pour respecter la contrainte de 100%`);
      console.log(`StrategyContext - Nouveau montant total estimé: ${(existingTotalInvestment + investors.reduce((sum, inv) => sum + (inv.initialBalance ? Math.floor(inv.initialBalance * 0.7) : 0), 0)).toLocaleString('fr-FR')} €`);
    }
    
    console.log(`StrategyContext - Le montant total levé représente ${percentageOfTarget.toFixed(2)}% du montant théorique à lever`);
    
    // Mettre à jour les pourcentages de détention pour les investisseurs existants
    const updatedExistingInvestors = targetStrategy.investors.map((investor) => {
      const newOwnershipPercentage = (investor.commitAmount / totalInvestment) * 100;
      return {
        ...investor,
        ownershipPercentage: newOwnershipPercentage,
      };
    });
    
    // Créer les nouveaux investisseurs avec leurs pourcentages de détention
    const newInvestors = investors.map((investor) => {
      // Définir un solde initial par défaut de 100 000 €
      const initialBalance = investor.initialBalance || 100000;
      
      // Utiliser 70% du solde initial pour s'assurer que le montant payé (incluant les frais de structuration)
      // ne dépassera pas le solde initial
      const commitAmount = Math.floor(initialBalance * 0.7);
      
      // Calculer la durée en années entre la date de début et l'horizon d'investissement
      const startDate = new Date(targetStrategy.startDate);
      const endDate = new Date(targetStrategy.investmentHorizon);
      const durationInYears = targetStrategy.durationInYears || Math.max((endDate.getFullYear() - startDate.getFullYear()), 1); // Minimum 1 an
      
      // Calculer les frais selon la grille tarifaire dynamique
      const structurationFee = calculateStructurationFee(commitAmount);
      const managementFee = calculateManagementFee(commitAmount, durationInYears);
      const totalFees = calculateTotalFees(commitAmount, durationInYears);
      
      // Calculer les montants clés selon les définitions du cas d'utilisation
      const investedAmount = calculateInvestedAmount(commitAmount, durationInYears);
      const paidAmount = calculatePaidAmount(commitAmount);
      
      // Calculer la répartition des fonds selon le pourcentage d'appel initial
      const walletAmounts = calculateWalletAmounts(commitAmount, durationInYears, targetStrategy.initialCallPercentage, initialBalance);
      
      // Date de l'investissement initial
      const investmentDate = new Date();
      
      // Générer un nouvel ID unique pour l'investisseur
      const investorId = uuidv4();
      
      // Créer l'objet investisseur
      const newInvestor: Investor = {
        id: investorId,
        name: investor.name,
        commitAmount: commitAmount,
        investedAmount: walletAmounts.investedAmount,
        paidAmount: walletAmounts.paidAmount,
        ownershipPercentage: (commitAmount / totalInvestment) * 100,
        initialBalance: initialBalance,
        wallets: {
          investor: walletAmounts.investorAmount,
          spv: walletAmounts.spvAmount,
          sanso: walletAmounts.sansoAmount,
          fundora: walletAmounts.fundoraAmount,
        },
        fees: {
          structuration: structurationFee,
          management: managementFee,
          total: totalFees,
        },
        transactions: {
          sansoInterest: 0,
          targetFundDistribution: 0,
        },
        history: {
          sansoInterests: [],
          targetFundDistributions: [],
          fundCalls: [
            {
              callNumber: 1,
              amount: walletAmounts.spvAmount,
              date: investmentDate,
            }
          ],
          fundoraFees: [
            {
              date: investmentDate,
              structurationFee: structurationFee,
              managementFee: managementFee,
              totalFee: totalFees,
              description: "Frais initiaux",
            }
          ],
        },
        globalInvestorId: undefined,
      };

      return newInvestor;
    });

    // Combiner les investisseurs existants et les nouveaux
    const allInvestors = [...updatedExistingInvestors, ...newInvestors];

    // Calculer les montants totaux pour la stratégie
    const totalRaisedAmount = allInvestors.reduce((sum, inv) => sum + inv.commitAmount, 0);
    const totalNetInvestedAmount = allInvestors.reduce((sum, inv) => sum + inv.investedAmount, 0);
    const remainingToInvest = (targetStrategy.netTargetAllocation !== undefined ? targetStrategy.netTargetAllocation : 0) - totalNetInvestedAmount;

    // Mettre à jour la stratégie
    const updatedStrategy = {
      ...targetStrategy,
      investors: allInvestors,
      totalRaisedAmount,
      totalNetInvestedAmount,
      remainingToInvest,
    };

    // Récupérer toutes les stratégies actuelles du localStorage
    let allStrategies: Strategy[] = [];
    try {
      const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
      if (storedStrategies) {
        const parsedStrategies = JSON.parse(storedStrategies);
        if (Array.isArray(parsedStrategies)) {
          allStrategies = parsedStrategies.map(convertDatesToObjects);
        }
      }
    } catch (error) {
      console.error("StrategyContext - Erreur lors de la récupération des stratégies depuis le localStorage:", error);
      allStrategies = [...strategies]; // Utiliser les stratégies de l'état comme fallback
    }
    
    // Mettre à jour la stratégie dans la liste complète
    const updatedStrategies = allStrategies.map(s => 
      s.id === strategyId ? updatedStrategy : s
    );
    
    // Mettre à jour l'état et le localStorage
    setStrategies(updatedStrategies);
    localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(updatedStrategies));
    
    // Si la stratégie mise à jour est la stratégie courante, mettre à jour également la stratégie courante
    if (currentStrategy && currentStrategy.id === strategyId) {
      setCurrentStrategy(updatedStrategy);
      localStorage.setItem(CURRENT_STRATEGY_STORAGE_KEY, JSON.stringify(updatedStrategy));
    }

    console.log("StrategyContext - Stratégie mise à jour avec succès:", updatedStrategy);
    return updatedStrategy;
  };

  const simulateSansoInterest = (strategyId: string, simulation: SansoSimulation): void => {
    console.log("StrategyContext - Simulation d'intérêts Sanso pour la stratégie:", strategyId);
    
    // Utiliser la fonction utilitaire pour trouver la stratégie de manière sécurisée
    const targetStrategy = findStrategyById(strategyId);
    
    if (!targetStrategy) {
      console.error("StrategyContext - Impossible de trouver une stratégie valide pour la simulation d'intérêts Sanso");
      return;
    }
    
    setStrategies((prevStrategies) => {
      return prevStrategies.map((strategy) => {
        if (strategy.id !== strategyId) return strategy;

        // Calculate interest rate based on NAV difference
        const interestRate = ((simulation.exitNav - simulation.entryNav) / simulation.entryNav) * 100;
        
        // Calculate number of days between entry and exit dates
        const entryDate = new Date(simulation.entryDate);
        const exitDate = new Date(simulation.exitDate);
        const daysDifference = Math.floor((exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        const timeFactorAdjustment = daysDifference / 365;
        
        // Update each investor's Sanso interest and wallets
        const updatedInvestors = strategy.investors.map((investor) => {
          // Calculate interest amount based on SANSO wallet amount, interest rate, and time factor
          const sansoInterest = (investor.wallets.sanso * interestRate / 100) * timeFactorAdjustment;
          
          // Create historical record
          const sansoInterestRecord = {
            amount: sansoInterest,
            distributionDate: simulation.distributionDate || new Date(),
            entryNav: simulation.entryNav,
            exitNav: simulation.exitNav,
            interestRate: interestRate,
            year: simulation.year,
            daysPeriod: daysDifference,
          };
          
          return {
            ...investor,
            transactions: {
              ...investor.transactions,
              sansoInterest: investor.transactions.sansoInterest + sansoInterest,
            },
            wallets: {
              ...investor.wallets,
              sanso: investor.wallets.sanso - sansoInterest,
              investor: investor.wallets.investor + sansoInterest,
            },
            history: {
              ...investor.history,
              sansoInterests: [...investor.history.sansoInterests, sansoInterestRecord],
            },
          };
        });

        const updatedStrategy = {
          ...strategy,
          investors: updatedInvestors,
        };

        // Update current strategy if it's the one being modified
        if (currentStrategy?.id === strategyId) {
          setCurrentStrategy(updatedStrategy);
        }

        return updatedStrategy;
      });
    });
  };

  const simulatePEDistribution = (strategyId: string, distribution: PEDistribution) => {
    setStrategies((prevStrategies) => {
      return prevStrategies.map((strategy) => {
        if (strategy.id !== strategyId) return strategy;

        // Update each investor's PE distribution and wallets
        const updatedInvestors = strategy.investors.map((investor) => {
          // Calculate distribution amount based on SPV wallet amount and multiple
          const distributionAmount = (investor.wallets.spv * distribution.multiple) / 100;
          
          // Create historical record
          const peDistributionRecord = {
            amount: distributionAmount,
            distributionDate: distribution.distributionDate,
            multiple: distribution.multiple,
            year: distribution.distributionDate.getFullYear(),
          };
          
          return {
            ...investor,
            transactions: {
              ...investor.transactions,
              targetFundDistribution: investor.transactions.targetFundDistribution + distributionAmount,
            },
            wallets: {
              ...investor.wallets,
              spv: investor.wallets.spv - distributionAmount,
              investor: investor.wallets.investor + distributionAmount,
            },
            history: {
              ...investor.history,
              targetFundDistributions: [...investor.history.targetFundDistributions, peDistributionRecord],
            },
          };
        });

        const updatedStrategy = {
          ...strategy,
          investors: updatedInvestors,
        };

        // Update current strategy if it's the one being modified
        if (currentStrategy?.id === strategyId) {
          setCurrentStrategy(updatedStrategy);
        }

        return updatedStrategy;
      });
    });
  };

  const simulateTargetFundDistribution = (strategyId: string, simulation: TargetFundDistribution): void => {
    console.log("StrategyContext - Simulation de distribution pour la stratégie:", strategyId);
    
    // Utiliser la fonction utilitaire pour trouver la stratégie de manière sécurisée
    const targetStrategy = findStrategyById(strategyId);
    
    if (!targetStrategy) {
      console.error("StrategyContext - Impossible de trouver une stratégie valide pour la simulation de distribution");
      return;
    }
    
    setStrategies(prevStrategies => {
      return prevStrategies.map(strategy => {
        if (strategy.id !== strategyId) return strategy;
        
        // Update each investor's target fund distribution and wallets
        const updatedInvestors = strategy.investors.map(investor => {
          // Calculate distribution amount based on SPV wallet amount and multiple
          const distributionAmount = (investor.wallets.spv * simulation.multiple) / 100;
          
          // Create historical record
          const targetFundDistributionRecord = {
            amount: distributionAmount,
            distributionDate: simulation.distributionDate,
            multiple: simulation.multiple,
            year: simulation.distributionDate.getFullYear(),
          };
          
          return {
            ...investor,
            transactions: {
              ...investor.transactions,
              targetFundDistribution: investor.transactions.targetFundDistribution + distributionAmount,
            },
            wallets: {
              ...investor.wallets,
              spv: investor.wallets.spv - distributionAmount,
              investor: investor.wallets.investor + distributionAmount,
            },
            history: {
              ...investor.history,
              targetFundDistributions: [...investor.history.targetFundDistributions, targetFundDistributionRecord],
            },
          };
        });

        const updatedStrategy = {
          ...strategy,
          investors: updatedInvestors,
        };

        // Update current strategy if it's the one being modified
        if (currentStrategy?.id === strategyId) {
          setCurrentStrategy(updatedStrategy);
        }

        return updatedStrategy;
      });
    });
  };

  const simulateNewFundCall = (strategyId: string, callNumber: number, callPercentage: number): void => {
    console.log("StrategyContext - Simulation d'un nouvel appel de fonds pour la stratégie:", strategyId);
    
    // Utiliser la fonction utilitaire pour trouver la stratégie de manière sécurisée
    const targetStrategy = findStrategyById(strategyId);
    
    if (!targetStrategy) {
      console.error("StrategyContext - Impossible de trouver une stratégie valide pour l'appel de fonds");
      return;
    }
    
    setStrategies(prevStrategies => {
      return prevStrategies.map(strategy => {
        if (strategy.id === strategyId) {
          // Date de l'appel de fonds
          const callDate = new Date();
          
          // Mettre à jour les wallets et l'historique pour chaque investisseur
          const updatedInvestors = strategy.investors.map(investor => {
            // Calculer le montant de l'appel de fonds pour cet investisseur
            // en fonction de son propre montant non investi (wallet SANSO)
            const nonInvestedAmount = investor.wallets.sanso;
            const callAmount = parseFloat(((nonInvestedAmount * callPercentage) / 100).toFixed(2));
            
            // Vérifier si le wallet SANSO a suffisamment de fonds
            if (investor.wallets.sanso < callAmount) {
              // Si le wallet SANSO n'a pas assez de fonds, limiter le montant de l'appel
              // au montant disponible dans le wallet SANSO
              const availableAmount = parseFloat(investor.wallets.sanso.toFixed(2));
              
              // Transférer du wallet SANSO vers le wallet SPV (limité au montant disponible)
              const updatedWallets = {
                ...investor.wallets,
                sanso: 0, // Le wallet SANSO est vidé
                spv: parseFloat((investor.wallets.spv + availableAmount).toFixed(2))
              };
              
              // Historiser l'appel de fonds
              const fundCallRecord = {
                callNumber,
                amount: availableAmount,
                date: callDate,
              };
              
              return {
                ...investor,
                wallets: updatedWallets,
                history: {
                  ...investor.history,
                  fundCalls: [...investor.history.fundCalls, fundCallRecord],
                },
              };
            } else {
              // Si le wallet SANSO a suffisamment de fonds, procéder normalement
              // Transférer du wallet SANSO vers le wallet SPV
              const updatedWallets = {
                ...investor.wallets,
                sanso: parseFloat((investor.wallets.sanso - callAmount).toFixed(2)),
                spv: parseFloat((investor.wallets.spv + callAmount).toFixed(2))
              };
              
              // Historiser l'appel de fonds
              const fundCallRecord = {
                callNumber,
                amount: callAmount,
                date: callDate,
              };
              
              return {
                ...investor,
                wallets: updatedWallets,
                history: {
                  ...investor.history,
                  fundCalls: [...investor.history.fundCalls, fundCallRecord],
                },
              };
            }
          });
          
          const updatedStrategy = {
            ...strategy,
            investors: updatedInvestors
          };
          
          // Mettre à jour la stratégie courante si c'est celle qui est modifiée
          if (currentStrategy?.id === strategyId) {
            setCurrentStrategy(updatedStrategy);
          }
          
          return updatedStrategy;
        }
        return strategy;
      });
    });
  };

  const getInvestorById = (investorId: string): Investor | undefined => {
    return investors.find(investor => investor.id === investorId);
  };

  const getInvestorStrategies = (investorId: string): Strategy[] => {
    return strategies.filter(strategy => 
      strategy.investors.some(investor => investor.id === investorId)
    );
  };

  const getTotalSansoInterest = (investorId: string): number => {
    let totalInterest = 0;
    
    // Parcourir toutes les stratégies où l'investisseur a participé
    const investorStrategies = getInvestorStrategies(investorId);
    
    investorStrategies.forEach(strategy => {
      const investor = strategy.investors.find(inv => inv.id === investorId);
      if (investor) {
        totalInterest += investor.transactions.sansoInterest;
      }
    });
    
    return totalInterest;
  };

  const getCapTable = (strategyId: string): CapTableEntry[] => {
    const strategy = strategies.find(strategy => strategy.id === strategyId);
    if (!strategy) return [];

    const capTable: CapTableEntry[] = strategy.investors.map(investor => {
      // Trouver l'appel de fonds N°1 dans l'historique
      const initialFundCall = investor.history.fundCalls.find(call => call.callNumber === 1);
      const initialFundCallAmount = initialFundCall ? initialFundCall.amount : 0;

      return {
        investorId: investor.id,
        investorName: investor.name,
        paidAmount: investor.paidAmount,
        investedAmount: investor.investedAmount,
        nonInvestedAmount: investor.wallets.sanso,
        ownershipPercentage: investor.ownershipPercentage,
        spvWallet: investor.wallets.spv,
        sansoWallet: investor.wallets.sanso,
        sansoInterest: investor.transactions.sansoInterest,
        targetFundDistribution: investor.transactions.targetFundDistribution,
        investorWallet: investor.wallets.investor,
        initialFundCallAmount,
        sansoInterestHistory: investor.history.sansoInterests,
        targetFundDistributionHistory: investor.history.targetFundDistributions,
        fundCallsHistory: investor.history.fundCalls
      };
    });

    return capTable;
  };

  // Fonction utilitaire pour trouver une stratégie de manière sécurisée
  const findStrategyById = (strategyId: string): Strategy | null => {
    console.log("StrategyContext - Recherche de la stratégie:", strategyId);
    
    // Récupérer les stratégies directement depuis le localStorage pour s'assurer d'avoir les données les plus récentes
    let currentStrategies = strategies;
    try {
      const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
      if (storedStrategies) {
        const parsedStrategies = JSON.parse(storedStrategies);
        if (Array.isArray(parsedStrategies) && parsedStrategies.length > 0) {
          currentStrategies = parsedStrategies.map(convertDatesToObjects);
        }
      }
    } catch (error) {
      console.error("StrategyContext - Erreur lors de la récupération des stratégies depuis le localStorage:", error);
    }
    
    console.log("StrategyContext - Stratégies disponibles:", currentStrategies.map(s => ({ id: s.id, name: s.name })));
    
    // Vérifier si l'ID est valide
    if (!strategyId) {
      console.error("StrategyContext - ID de stratégie invalide:", strategyId);
      return currentStrategy;
    }
    
    // Rechercher la stratégie par ID
    const strategy = currentStrategies.find(s => s.id === strategyId);
    
    if (!strategy) {
      console.error("StrategyContext - Stratégie non trouvée:", strategyId);
      
      // Si la stratégie n'est pas trouvée, utiliser la stratégie courante comme fallback
      if (currentStrategy) {
        console.log("StrategyContext - Utilisation de la stratégie courante comme fallback:", currentStrategy.id);
        return currentStrategy;
      }
      
      return null;
    }
    
    return strategy;
  };

  const value = {
    strategies,
    currentStrategy,
    setCurrentStrategy,
    createStrategy,
    addInvestorsToStrategy,
    simulateSansoInterest,
    simulatePEDistribution,
    simulateTargetFundDistribution,
    simulateNewFundCall,
    getCapTable,
    getInvestorById,
    getInvestorStrategies,
    getTotalSansoInterest,
    investors,
    findStrategyById,
  };

  return (
    <StrategyContext.Provider value={value}>
      {children}
    </StrategyContext.Provider>
  );
};

export { StrategyContext, StrategyProvider };
