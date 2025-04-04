import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { GlobalInvestor, StrategyInvestment } from '../types/models';

// Clé pour le stockage local des investisseurs globaux
const GLOBAL_INVESTORS_STORAGE_KEY = 'fundora_global_investors';

interface GlobalInvestorContextType {
  investors: GlobalInvestor[];
  addInvestor: (investorData: Omit<GlobalInvestor, 'id' | 'investments'>) => GlobalInvestor;
  getInvestor: (investorId: string) => GlobalInvestor | undefined;
  addInvestmentToInvestor: (investorId: string, investment: Omit<StrategyInvestment, 'id' | 'investorId'>) => StrategyInvestment | null;
  getInvestorInvestments: (investorId: string) => StrategyInvestment[];
  getInvestorsByStrategy: (strategyId: string) => GlobalInvestor[];
}

const GlobalInvestorContext = createContext<GlobalInvestorContextType | undefined>(undefined);

export const useGlobalInvestor = () => {
  const context = useContext(GlobalInvestorContext);
  if (!context) {
    throw new Error('useGlobalInvestor must be used within a GlobalInvestorProvider');
  }
  return context;
};

interface GlobalInvestorProviderProps {
  children: ReactNode;
}

export const GlobalInvestorProvider: React.FC<GlobalInvestorProviderProps> = ({ children }) => {
  // Initialiser l'état avec les données du localStorage si elles existent
  const [investors, setInvestors] = useState<GlobalInvestor[]>(() => {
    try {
      const storedInvestors = localStorage.getItem(GLOBAL_INVESTORS_STORAGE_KEY);
      if (storedInvestors) {
        return JSON.parse(storedInvestors) as GlobalInvestor[];
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des investisseurs globaux depuis le localStorage:', error);
      return [];
    }
  });

  // Sauvegarder les investisseurs globaux dans le localStorage à chaque changement
  useEffect(() => {
    try {
      localStorage.setItem(GLOBAL_INVESTORS_STORAGE_KEY, JSON.stringify(investors));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des investisseurs globaux dans le localStorage:', error);
    }
  }, [investors]);

  const addInvestor = (investorData: Omit<GlobalInvestor, 'id' | 'investments'>) => {
    const newInvestor: GlobalInvestor = {
      id: uuidv4(),
      ...investorData,
      investments: [],
    };

    setInvestors((prevInvestors) => [...prevInvestors, newInvestor]);
    return newInvestor;
  };

  const getInvestor = (investorId: string) => {
    return investors.find((investor) => investor.id === investorId);
  };

  const addInvestmentToInvestor = (
    investorId: string,
    investment: Omit<StrategyInvestment, 'id' | 'investorId'>
  ) => {
    const investor = getInvestor(investorId);
    if (!investor) return null;

    const newInvestment: StrategyInvestment = {
      id: uuidv4(),
      investorId,
      ...investment,
    };

    setInvestors((prevInvestors) =>
      prevInvestors.map((investor) => {
        if (investor.id === investorId) {
          return {
            ...investor,
            investments: [...investor.investments, newInvestment],
          };
        }
        return investor;
      })
    );

    return newInvestment;
  };

  const getInvestorInvestments = (investorId: string) => {
    const investor = getInvestor(investorId);
    return investor ? investor.investments : [];
  };

  const getInvestorsByStrategy = (strategyId: string) => {
    return investors.filter((investor) =>
      investor.investments.some((investment) => investment.strategyId === strategyId)
    );
  };

  const value = {
    investors,
    addInvestor,
    getInvestor,
    addInvestmentToInvestor,
    getInvestorInvestments,
    getInvestorsByStrategy,
  };

  return (
    <GlobalInvestorContext.Provider value={value}>
      {children}
    </GlobalInvestorContext.Provider>
  );
};
