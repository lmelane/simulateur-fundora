import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Strategy, Investor, SansoSimulation, PEDistribution } from '../types/models';

// Clés pour le stockage local
const STRATEGIES_STORAGE_KEY = 'fundora_strategies';
const CURRENT_STRATEGY_STORAGE_KEY = 'fundora_current_strategy';

interface StrategyContextType {
  strategies: Strategy[];
  currentStrategy: Strategy | null;
  setCurrentStrategy: (strategy: Strategy | null) => void;
  createStrategy: (strategyData: Omit<Strategy, 'id' | 'investors' | 'createdAt'>) => Strategy;
  addInvestorsToStrategy: (strategyId: string, investors: Omit<Investor, 'id' | 'ownershipPercentage' | 'wallets' | 'transactions' | 'history'>[]) => void;
  simulateSansoInterest: (strategyId: string, simulation: SansoSimulation) => void;
  simulatePEDistribution: (strategyId: string, distribution: PEDistribution) => void;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

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
  return {
    ...strategy,
    startDate: new Date(strategy.startDate),
    investmentHorizon: new Date(strategy.investmentHorizon),
    createdAt: new Date(strategy.createdAt),
    investors: strategy.investors.map((investor: any) => ({
      ...investor,
      history: {
        sansoInterests: investor.history.sansoInterests.map((interest: any) => ({
          ...interest,
          distributionDate: new Date(interest.distributionDate),
        })),
        targetFundDistributions: investor.history.targetFundDistributions.map((distribution: any) => ({
          ...distribution,
          distributionDate: new Date(distribution.distributionDate),
        })),
      },
    })),
  };
};

export const StrategyProvider: React.FC<StrategyProviderProps> = ({ children }) => {
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

  // Sauvegarder les stratégies dans le localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(strategies));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des stratégies dans le localStorage:', error);
    }
  }, [strategies]);

  // Sauvegarder la stratégie courante dans le localStorage à chaque changement
  useEffect(() => {
    try {
      if (currentStrategy) {
        localStorage.setItem(CURRENT_STRATEGY_STORAGE_KEY, JSON.stringify(currentStrategy));
      } else {
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
    setStrategies((prev) => [...prev, newStrategy]);
    setCurrentStrategy(newStrategy);
    return newStrategy;
  };

  const addInvestorsToStrategy = (
    strategyId: string,
    investors: Omit<Investor, 'id' | 'ownershipPercentage' | 'wallets' | 'transactions' | 'history'>[]
  ) => {
    console.log("StrategyContext - Investisseurs à ajouter:", investors);
    
    setStrategies((prevStrategies) => {
      const updatedStrategies = prevStrategies.map((strategy) => {
        if (strategy.id === strategyId) {
          console.log("StrategyContext - Stratégie trouvée:", strategy);
          
          // Calculer le montant total investi dans la stratégie (existant + nouveaux investisseurs)
          const existingInvestmentTotal = strategy.investors.reduce((sum, investor) => sum + investor.investedAmount, 0);
          const newInvestmentTotal = investors.reduce((sum, investor) => sum + investor.investedAmount, 0);
          const totalInvestment = existingInvestmentTotal + newInvestmentTotal;
          
          console.log("StrategyContext - Montant total investi:", totalInvestment);
          
          // Créer les nouveaux investisseurs avec leurs pourcentages de propriété
          const newInvestors = investors.map((investor) => {
            const ownershipPercentage = (investor.investedAmount / totalInvestment) * 100;
            
            // Calculer les montants initiaux pour les wallets
            const initialCallAmount = (investor.investedAmount * strategy.initialCallPercentage) / 100;
            const spvAmount = (initialCallAmount * strategy.targetFundPercentage) / 100;
            const sansoAmount = initialCallAmount - spvAmount;
            
            return {
              id: uuidv4(),
              name: investor.name,
              investedAmount: investor.investedAmount,
              ownershipPercentage,
              wallets: {
                investor: investor.investedAmount - initialCallAmount, // Montant restant à appeler
                spv: spvAmount, // Montant investi dans le fonds cible
                sanso: sansoAmount, // Montant placé chez SANSO
                fundora: 0, // Frais Fundora (à implémenter)
              },
              transactions: {
                sansoInterest: 0, // Pas encore de coupons reçus
                targetFundDistribution: 0, // Pas encore de distributions reçues
              },
              history: {
                sansoInterests: [],
                targetFundDistributions: [],
              },
              globalInvestorId: investor.globalInvestorId, // Référence à l'investisseur global
            };
          });
          
          console.log("StrategyContext - Nouveaux investisseurs créés:", newInvestors);
          
          // Recalculer les pourcentages de propriété pour tous les investisseurs existants
          const updatedExistingInvestors = strategy.investors.map((investor) => {
            const updatedOwnershipPercentage = (investor.investedAmount / totalInvestment) * 100;
            return {
              ...investor,
              ownershipPercentage: updatedOwnershipPercentage,
            };
          });
          
          const updatedStrategy = {
            ...strategy,
            investors: [...updatedExistingInvestors, ...newInvestors],
          };
          
          console.log("StrategyContext - Stratégie mise à jour:", updatedStrategy);
          
          // Mettre à jour la stratégie courante immédiatement
          setTimeout(() => {
            setCurrentStrategy(updatedStrategy);
            console.log("StrategyContext - currentStrategy mise à jour:", updatedStrategy);
          }, 0);
          
          return updatedStrategy;
        }
        return strategy;
      });
      
      return updatedStrategies;
    });
  };

  const simulateSansoInterest = (strategyId: string, simulation: SansoSimulation) => {
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
            year: simulation.year, // Utiliser l'année fournie dans la simulation
            daysPeriod: daysDifference, // Ajouter le nombre de jours pour référence
          };
          
          return {
            ...investor,
            transactions: {
              ...investor.transactions,
              sansoInterest: investor.transactions.sansoInterest + sansoInterest, // Ajouter au total
            },
            wallets: {
              ...investor.wallets,
              sanso: investor.wallets.sanso - sansoInterest, // Déduire du wallet SANSO
              investor: investor.wallets.investor + sansoInterest, // Ajouter au wallet Investisseur (cash-in)
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
              spv: investor.wallets.spv - distributionAmount, // Déduire du wallet SPV
              investor: investor.wallets.investor + distributionAmount, // Ajouter au wallet Investisseur (cash-in)
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

  const value = {
    strategies,
    currentStrategy,
    setCurrentStrategy,
    createStrategy,
    addInvestorsToStrategy,
    simulateSansoInterest,
    simulatePEDistribution,
  };

  return (
    <StrategyContext.Provider value={value}>
      {children}
    </StrategyContext.Provider>
  );
};
