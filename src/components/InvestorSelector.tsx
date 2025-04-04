import React, { useState, useContext } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Checkbox, 
  TextField, 
  Button, 
  Paper,
  Divider,
  InputAdornment
} from '@mui/material';
import { StrategyContext } from '../context/StrategyContext';
import { Investor } from '../types/models';

interface InvestorSelectorProps {
  onInvestorsSelected: (investors: { name: string; investedAmount: number; initialBalance: number }[]) => void;
}

const InvestorSelector: React.FC<InvestorSelectorProps> = ({ onInvestorsSelected }) => {
  const strategyContext = useContext(StrategyContext);
  
  if (!strategyContext) {
    throw new Error('InvestorSelector must be used within a StrategyProvider');
  }
  
  const { investors } = strategyContext;
  
  const [selectedInvestors, setSelectedInvestors] = useState<string[]>([]);
  const [investmentAmounts, setInvestmentAmounts] = useState<Record<string, number>>({});
  const [initialBalances, setInitialBalances] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtrer les investisseurs par terme de recherche
  const filteredInvestors = investors.filter((investor: Investor) => 
    investor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Gérer la sélection/désélection d'un investisseur
  const handleToggleInvestor = (investorId: string) => {
    setSelectedInvestors(prev => {
      if (prev.includes(investorId)) {
        return prev.filter(id => id !== investorId);
      } else {
        // Initialiser les montants par défaut lors de la sélection
        const investor = investors.find((inv: Investor) => inv.id === investorId);
        if (investor) {
          setInvestmentAmounts(prev => ({
            ...prev,
            [investorId]: investor.investedAmount
          }));
          // Utiliser une valeur par défaut de 0 si initialBalance est undefined
          const initialBalance = investor.initialBalance || investor.investedAmount;
          setInitialBalances(prev => ({
            ...prev,
            [investorId]: initialBalance
          }));
        }
        return [...prev, investorId];
      }
    });
  };
  
  // Mettre à jour le montant d'investissement
  const handleAmountChange = (investorId: string, amount: number) => {
    setInvestmentAmounts(prev => ({
      ...prev,
      [investorId]: amount
    }));
  };
  
  // Mettre à jour le solde initial
  const handleBalanceChange = (investorId: string, balance: number) => {
    setInitialBalances(prev => ({
      ...prev,
      [investorId]: balance
    }));
  };
  
  // Confirmer la sélection des investisseurs
  const handleConfirm = () => {
    const selectedInvestorData = selectedInvestors.map(investorId => {
      const investor = investors.find((inv: Investor) => inv.id === investorId);
      if (!investor) return { name: '', investedAmount: 0, initialBalance: 0 };
      
      return {
        name: investor.name,
        investedAmount: investmentAmounts[investorId] || 0,
        initialBalance: initialBalances[investorId] || investmentAmounts[investorId] || 0
      };
    });
    
    onInvestorsSelected(selectedInvestorData);
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Sélectionner des investisseurs existants
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Rechercher un investisseur..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        margin="normal"
      />
      
      <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto', mt: 2 }}>
        <List>
          {filteredInvestors.map((investor: Investor) => {
            // Utiliser une valeur par défaut de 0 si initialBalance est undefined
            const initialBalance = investor.initialBalance || 0;
            
            return (
              <React.Fragment key={investor.id}>
                <ListItem>
                  <Checkbox
                    edge="start"
                    checked={selectedInvestors.includes(investor.id)}
                    onChange={() => handleToggleInvestor(investor.id)}
                  />
                  <ListItemText 
                    primary={investor.name} 
                    secondary={`Solde initial: ${initialBalance.toLocaleString('fr-FR')} € | Montant investi précédemment: ${investor.investedAmount.toLocaleString('fr-FR')} €`} 
                  />
                  
                  {selectedInvestors.includes(investor.id) && (
                    <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
                      <TextField
                        label="Montant à investir"
                        type="number"
                        size="small"
                        value={investmentAmounts[investor.id] || ''}
                        onChange={(e) => handleAmountChange(investor.id, Number(e.target.value))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        }}
                      />
                      <TextField
                        label="Solde initial"
                        type="number"
                        size="small"
                        value={initialBalances[investor.id] || ''}
                        onChange={(e) => handleBalanceChange(investor.id, Number(e.target.value))}
                        InputProps={{
                          endAdornment: <InputAdornment position="end">€</InputAdornment>,
                        }}
                      />
                    </Box>
                  )}
                </ListItem>
                <Divider />
              </React.Fragment>
            );
          })}
        </List>
      </Paper>
      
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleConfirm}
          disabled={selectedInvestors.length === 0}
        >
          Ajouter les investisseurs sélectionnés
        </Button>
      </Box>
    </Box>
  );
};

export default InvestorSelector;
