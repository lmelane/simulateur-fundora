import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Strategy, Investor, SansoSimulation, PEDistribution, CapTableEntry } from '../types/models';

// Clés pour le stockage local
const STRATEGIES_STORAGE_KEY = 'fundora_strategies';
const CURRENT_STRATEGY_STORAGE_KEY = 'fundora_current_strategy';

interface StrategyContextType {
  strategies: Strategy[];
  currentStrategy: Strategy | null;
  setCurrentStrategy: (strategy: Strategy) => void;
  createStrategy: (strategyData: Omit<Strategy, 'id' | 'investors' | 'createdAt'>) => Strategy;
  addInvestorsToStrategy: (strategyId: string, investors: Omit<Investor, 'id' | 'ownershipPercentage' | 'wallets' | 'transactions' | 'history'>[]) => void;
  simulateSansoInterest: (strategyId: string, simulation: SansoSimulation) => void;
  simulatePEDistribution: (strategyId: string, distribution: PEDistribution) => void;
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
  addInvestorsToStrategy: () => {},
  simulateSansoInterest: () => {},
  simulatePEDistribution: () => {},
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
          const existingTotalInvestment = strategy.investors.reduce((sum, inv) => sum + inv.investedAmount, 0);
          const newTotalInvestment = investors.reduce((sum, inv) => sum + inv.investedAmount, 0);
          const totalInvestment = existingTotalInvestment + newTotalInvestment;
          
          // Mettre à jour les pourcentages de détention pour les investisseurs existants
          const updatedExistingInvestors = strategy.investors.map((investor) => {
            const newOwnershipPercentage = (investor.investedAmount / totalInvestment) * 100;
            return {
              ...investor,
              ownershipPercentage: newOwnershipPercentage,
            };
          });
          
          // Créer les nouveaux investisseurs avec leurs pourcentages de détention
          const newInvestors = investors.map((investor) => {
            const ownershipPercentage = (investor.investedAmount / totalInvestment) * 100;
            
            // Calculer la répartition des fonds selon le pourcentage d'appel initial
            const spvAmount = (investor.investedAmount * strategy.initialCallPercentage) / 100;
            const sansoAmount = investor.investedAmount - spvAmount;
            
            // Calculer les frais de structuration et de gestion
            const structurationFee = investor.investedAmount * 0.03; // 3% de frais de structuration
            
            // Calculer la durée en années entre la date de début et l'horizon d'investissement
            const startDate = new Date(strategy.startDate);
            const endDate = new Date(strategy.investmentHorizon);
            const durationInYears = (endDate.getFullYear() - startDate.getFullYear()) || 1; // Minimum 1 an
            
            const managementFee = investor.investedAmount * 0.017 * durationInYears; // 1,7% par an
            const totalFundoraFees = structurationFee + managementFee;
            
            // Déterminer le solde initial du wallet investisseur
            const initialBalance = investor.initialBalance || (investor.investedAmount + totalFundoraFees);
            
            // Le wallet investisseur commence avec le solde initial moins le montant investi et les frais
            const investorWalletBalance = initialBalance - investor.investedAmount - totalFundoraFees;
            
            // Vérifier si l'investisseur existe déjà dans le système global
            // Nous utilisons le nom comme identifiant temporaire puisque l'objet investor n'a pas d'ID à ce stade
            const existingInvestor = investors.find(inv => inv.name === investor.name);
            
            // Générer un nouvel ID uniquement si l'investisseur n'existe pas déjà
            const investorId = existingInvestor ? existingInvestor.name : uuidv4();
            
            // Créer l'objet investisseur
            const newInvestor: Investor = {
              id: investorId,
              name: investor.name,
              investedAmount: investor.investedAmount,
              ownershipPercentage,
              initialBalance,
              wallets: {
                investor: investorWalletBalance,
                spv: spvAmount,
                sanso: sansoAmount,
                fundora: totalFundoraFees,
              },
              transactions: {
                sansoInterest: 0,
                targetFundDistribution: 0,
              },
              history: {
                sansoInterests: [],
                targetFundDistributions: [],
              },
              globalInvestorId: investor.globalInvestorId,
            };
            
            // Ajouter ou mettre à jour l'investisseur dans la liste globale des investisseurs
            if (!existingInvestor) {
              setInvestors(prevInvestors => [...prevInvestors, newInvestor]);
            }
            
            return newInvestor;
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

    const capTable: CapTableEntry[] = strategy.investors.map(investor => ({
      investorId: investor.id,
      investorName: investor.name,
      investedAmount: investor.investedAmount,
      spvWallet: investor.wallets.spv,
      sansoWallet: investor.wallets.sanso,
      sansoInterest: investor.transactions.sansoInterest,
      targetFundDistribution: investor.transactions.targetFundDistribution,
      investorWallet: investor.wallets.investor,
      sansoInterestHistory: investor.history.sansoInterests,
      targetFundDistributionHistory: investor.history.targetFundDistributions
    }));

    return capTable;
  };

  const value = {
    strategies,
    currentStrategy,
    setCurrentStrategy,
    createStrategy,
    addInvestorsToStrategy,
    simulateSansoInterest,
    simulatePEDistribution,
    getCapTable,
    getInvestorById,
    getInvestorStrategies,
    getTotalSansoInterest,
    investors,
  };

  return (
    <StrategyContext.Provider value={value}>
      {children}
    </StrategyContext.Provider>
  );
};

export { StrategyContext, StrategyProvider };
