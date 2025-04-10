import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import { useStrategy } from '../context/StrategyContext';
import { Strategy, Investor } from '../types/models';
import FundraisingStatus from './FundraisingStatus';

// Types pour les transactions consolidées
interface ConsolidatedTransaction {
  date: Date;
  type: 'cash_in' | 'cash_out';
  amount: number;
  description: string;
  balance: number;
}

// Type pour les données financières consolidées
interface WalletFinancialData {
  transactions: ConsolidatedTransaction[];
  currentBalance: number;
  totalIn: number;
  totalOut: number;
}

// Interface pour les propriétés de l'onglet
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant pour afficher le contenu de l'onglet
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const StrategyFinancialSummary: React.FC = () => {
  const { strategies, currentStrategy } = useStrategy();
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [tabValue, setTabValue] = useState<number>(0);
  const [spvData, setSpvData] = useState<WalletFinancialData | null>(null);
  const [sansoData, setSansoData] = useState<WalletFinancialData | null>(null);
  const [fundoraData, setFundoraData] = useState<WalletFinancialData | null>(null);

  // Mettre à jour la stratégie sélectionnée lorsque currentStrategy change
  useEffect(() => {
    if (currentStrategy) {
      setSelectedStrategyId(currentStrategy.id);
    }
  }, [currentStrategy]);

  // Gérer le changement de stratégie
  const handleStrategyChange = (event: SelectChangeEvent) => {
    setSelectedStrategyId(event.target.value);
  };

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Générer les données financières consolidées pour la stratégie sélectionnée
  useEffect(() => {
    if (!selectedStrategyId) {
      setSpvData(null);
      setSansoData(null);
      setFundoraData(null);
      return;
    }

    const strategy = strategies.find(s => s.id === selectedStrategyId);
    if (!strategy) {
      setSpvData(null);
      setSansoData(null);
      setFundoraData(null);
      return;
    }

    // Calculer les données pour le wallet SPV
    const spvTransactions: ConsolidatedTransaction[] = [];
    let spvTotalIn = 0;
    let spvTotalOut = 0;

    // Ajouter les entrées initiales dans le SPV (appels de fonds)
    strategy.investors.forEach(investor => {
      const spvAmount = investor.wallets.spv;
      if (spvAmount > 0) {
        spvTransactions.push({
          date: new Date(strategy.createdAt),
          type: 'cash_in',
          amount: spvAmount,
          description: `Appel de fonds initial (${strategy.initialCallPercentage}%) - ${investor.name}`,
          balance: 0, // Sera calculé plus tard
        });
        spvTotalIn += spvAmount;
      }
    });

    // Calculer les données pour le wallet SANSO
    const sansoTransactions: ConsolidatedTransaction[] = [];
    let sansoTotalIn = 0;
    let sansoTotalOut = 0;

    // Ajouter les entrées initiales dans SANSO (trésorerie non appelée)
    strategy.investors.forEach(investor => {
      const sansoAmount = investor.wallets.sanso;
      if (sansoAmount > 0) {
        sansoTransactions.push({
          date: new Date(strategy.createdAt),
          type: 'cash_in',
          amount: sansoAmount,
          description: `Trésorerie non appelée (${100 - strategy.initialCallPercentage}%) - ${investor.name}`,
          balance: 0, // Sera calculé plus tard
        });
        sansoTotalIn += sansoAmount;
      }

      // Ajouter les sorties pour les coupons SANSO
      if (investor.history && investor.history.sansoInterests && investor.history.sansoInterests.length > 0) {
        console.log(`Coupons SANSO pour ${investor.name} dans la stratégie ${strategy.name}:`, investor.history.sansoInterests);
        investor.history.sansoInterests.forEach(interest => {
          sansoTransactions.push({
            date: new Date(interest.distributionDate),
            type: 'cash_out',
            amount: -interest.amount,
            description: `Distribution coupon SANSO (${interest.year || 'N/A'}) - ${investor.name} - Période: ${interest.daysPeriod} jours`,
            balance: 0, // Sera calculé plus tard
          });
          sansoTotalOut += interest.amount;
        });
      }
    });

    // Calculer les données pour le wallet Fundora
    const fundoraTransactions: ConsolidatedTransaction[] = [];
    let fundoraTotalIn = 0;
    let fundoraTotalOut = 0;

    // Ajouter les entrées dans Fundora (frais)
    strategy.investors.forEach(investor => {
      const fundoraAmount = investor.wallets.fundora;
      if (fundoraAmount > 0) {
        // Calculer les frais de structuration (3%)
        const structurationFee = investor.investedAmount * 0.03;
        
        // Calculer la durée en années
        const startDate = new Date(strategy.startDate);
        const endDate = new Date(strategy.investmentHorizon);
        const durationInYears = (endDate.getFullYear() - startDate.getFullYear()) || 1;
        
        // Calculer les frais de gestion (1,7% par an)
        const managementFee = investor.investedAmount * 0.017 * durationInYears;
        
        // Frais de structuration
        fundoraTransactions.push({
          date: new Date(strategy.createdAt),
          type: 'cash_in',
          amount: structurationFee,
          description: `Frais de structuration (3%) - ${investor.name}`,
          balance: 0, // Sera calculé plus tard
        });
        
        // Frais de gestion
        fundoraTransactions.push({
          date: new Date(strategy.createdAt),
          type: 'cash_in',
          amount: managementFee,
          description: `Frais de gestion (1,7% × ${durationInYears} ans) - ${investor.name}`,
          balance: 0, // Sera calculé plus tard
        });
        
        fundoraTotalIn += fundoraAmount;
      }
    });

    // Trier les transactions par date
    spvTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    sansoTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    fundoraTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculer les soldes après chaque transaction
    let spvRunningBalance = 0;
    spvTransactions.forEach(transaction => {
      spvRunningBalance += transaction.amount;
      transaction.balance = spvRunningBalance;
    });

    let sansoRunningBalance = 0;
    sansoTransactions.forEach(transaction => {
      sansoRunningBalance += transaction.amount;
      transaction.balance = sansoRunningBalance;
    });

    let fundoraRunningBalance = 0;
    fundoraTransactions.forEach(transaction => {
      fundoraRunningBalance += transaction.amount;
      transaction.balance = fundoraRunningBalance;
    });

    // Mettre à jour les états avec les données calculées
    setSpvData({
      transactions: spvTransactions,
      currentBalance: spvRunningBalance,
      totalIn: spvTotalIn,
      totalOut: spvTotalOut,
    });

    setSansoData({
      transactions: sansoTransactions,
      currentBalance: sansoRunningBalance,
      totalIn: sansoTotalIn,
      totalOut: sansoTotalOut,
    });

    setFundoraData({
      transactions: fundoraTransactions,
      currentBalance: fundoraRunningBalance,
      totalIn: fundoraTotalIn,
      totalOut: fundoraTotalOut,
    });
  }, [selectedStrategyId, strategies]);

  // Obtenir la couleur pour le type de transaction
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'cash_in':
        return 'success';
      case 'cash_out':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtenir le libellé pour le type de transaction
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'cash_in':
        return 'Entrée';
      case 'cash_out':
        return 'Sortie';
      default:
        return type;
    }
  };

  // Fonction pour rendre le tableau des transactions
  const renderTransactionsTable = (data: WalletFinancialData | null) => {
    if (!data || data.transactions.length === 0) {
      return (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">
            Aucune transaction disponible.
          </Typography>
        </Paper>
      );
    }

    return (
      <>
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ width: '33%' }}>
                <Typography variant="subtitle1">Solde actuel</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {data.currentBalance.toLocaleString('fr-FR')} €
                </Typography>
              </Box>
              <Box sx={{ width: '33%' }}>
                <Typography variant="subtitle1">Total entrées</Typography>
                <Typography variant="h6" color="success.main">
                  +{data.totalIn.toLocaleString('fr-FR')} €
                </Typography>
              </Box>
              <Box sx={{ width: '33%' }}>
                <Typography variant="subtitle1">Total sorties</Typography>
                <Typography variant="h6" color="error.main">
                  -{data.totalOut.toLocaleString('fr-FR')} €
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell align="right">Solde après</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>
                    <Chip
                      label={getTransactionTypeLabel(transaction.type)}
                      color={getTransactionTypeColor(transaction.type) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell align="right" sx={{ 
                    color: transaction.amount < 0 ? 'error.main' : 'success.main',
                    fontWeight: 'bold'
                  }}>
                    {transaction.amount < 0 ? '-' : '+'}{Math.abs(transaction.amount).toLocaleString('fr-FR')} €
                  </TableCell>
                  <TableCell align="right">{transaction.balance.toLocaleString('fr-FR')} €</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Résumé Financier de la Stratégie
      </Typography>
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel id="strategy-select-label">Sélectionner une stratégie</InputLabel>
          <Select
            labelId="strategy-select-label"
            id="strategy-select"
            value={selectedStrategyId}
            onChange={handleStrategyChange}
            label="Sélectionner une stratégie"
          >
            {strategies.map((strategy: Strategy) => (
              <MenuItem key={strategy.id} value={strategy.id}>
                {strategy.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedStrategyId && (
        <>
          {/* Afficher le composant FundraisingStatus */}
          {strategies.find(s => s.id === selectedStrategyId) && (
            <FundraisingStatus strategy={strategies.find(s => s.id === selectedStrategyId)!} />
          )}

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="wallet tabs">
              <Tab label="SPV (Fonds Cible)" id="wallet-tab-0" aria-controls="wallet-tabpanel-0" />
              <Tab label="SANSO (Fonds Obligataire)" id="wallet-tab-1" aria-controls="wallet-tabpanel-1" />
              <Tab label="Fundora (Frais)" id="wallet-tab-2" aria-controls="wallet-tabpanel-2" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Historique des Transactions SPV (Fonds Cible)
            </Typography>
            {renderTransactionsTable(spvData)}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Historique des Transactions SANSO (Fonds Obligataire)
            </Typography>
            {renderTransactionsTable(sansoData)}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Historique des Transactions Fundora (Frais)
            </Typography>
            {renderTransactionsTable(fundoraData)}
          </TabPanel>
        </>
      )}

      {!selectedStrategyId && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">
            Veuillez sélectionner une stratégie pour afficher son résumé financier.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default StrategyFinancialSummary;
