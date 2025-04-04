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
  TextField,
  Button,
  Chip,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useStrategy } from '../context/StrategyContext';
import { Investor, Strategy, SansoInterestHistory, PEDistributionHistory } from '../types/models';

// Types pour les transactions financières
interface FinancialTransaction {
  date: Date;
  type: 'subscription' | 'fundora_fee' | 'sanso_interest' | 'pe_distribution';
  amount: number;
  description: string;
  strategyName: string;
  strategyId: string;
  balance: number; // Solde après transaction
}

// Type pour les données d'historique financier d'un investisseur
interface InvestorFinancialData {
  investor: Investor;
  transactions: FinancialTransaction[];
  currentBalance: number;
  totalIn: number;
  totalOut: number;
}

const InvestorFinancialHistory: React.FC = () => {
  const strategyContext = useStrategy();
  const { investors, getInvestorStrategies, strategies } = strategyContext;

  // Obtenir la liste de tous les investisseurs uniques
  const allInvestors = useMemo(() => {
    const uniqueInvestors = new Map<string, Investor>();
    
    // Parcourir toutes les stratégies pour collecter les investisseurs
    strategies.forEach(strategy => {
      strategy.investors.forEach(investor => {
        if (!uniqueInvestors.has(investor.id)) {
          uniqueInvestors.set(investor.id, investor);
        }
      });
    });
    
    return Array.from(uniqueInvestors.values());
  }, [strategies]);

  const [selectedInvestorId, setSelectedInvestorId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [transactionType, setTransactionType] = useState<string>('all');
  const [financialData, setFinancialData] = useState<InvestorFinancialData | null>(null);
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([]);

  // Gérer le changement d'investisseur
  const handleInvestorChange = (event: SelectChangeEvent) => {
    setSelectedInvestorId(event.target.value);
  };

  // Gérer le changement de type de transaction
  const handleTransactionTypeChange = (event: SelectChangeEvent) => {
    setTransactionType(event.target.value);
  };

  // Générer l'historique financier complet pour l'investisseur sélectionné
  useEffect(() => {
    if (!selectedInvestorId) {
      setFinancialData(null);
      return;
    }

    const investor = allInvestors.find((inv: Investor) => inv.id === selectedInvestorId);
    if (!investor) {
      setFinancialData(null);
      return;
    }

    const strategies = getInvestorStrategies(selectedInvestorId);
    const transactions: FinancialTransaction[] = [];
    let totalIn = 0;
    let totalOut = 0;

    // Ajouter les souscriptions initiales
    strategies.forEach((strategy: Strategy) => {
      const investorInStrategy = strategy.investors.find(inv => inv.id === selectedInvestorId);
      if (!investorInStrategy) return;

      // Souscription initiale (entrée de fonds)
      const subscriptionDate = new Date(strategy.createdAt);
      transactions.push({
        date: subscriptionDate,
        type: 'subscription',
        amount: -investorInStrategy.investedAmount, // Négatif car c'est une sortie du wallet investisseur
        description: `Souscription initiale à la stratégie ${strategy.name}`,
        strategyName: strategy.name,
        strategyId: strategy.id,
        balance: 0, // Sera calculé plus tard
      });
      totalOut += investorInStrategy.investedAmount;

      // Frais Fundora (sortie de fonds)
      const fundoraFee = investorInStrategy.wallets.fundora;
      if (fundoraFee > 0) {
        // Calculer les frais de structuration (3%)
        const structurationFee = investorInStrategy.investedAmount * 0.03;
        
        // Calculer la durée en années entre la date de début et l'horizon d'investissement
        const startDate = new Date(strategy.startDate);
        const endDate = new Date(strategy.investmentHorizon);
        const durationInYears = (endDate.getFullYear() - startDate.getFullYear()) || 1;
        
        // Calculer les frais de gestion (1,7% par an)
        const managementFee = investorInStrategy.investedAmount * 0.017 * durationInYears;
        
        // Frais de structuration
        transactions.push({
          date: new Date(subscriptionDate.getTime() + 1000), // 1 seconde après la souscription
          type: 'fundora_fee',
          amount: -structurationFee, // Négatif car c'est une sortie
          description: `Frais de structuration (3%) pour la stratégie ${strategy.name}`,
          strategyName: strategy.name,
          strategyId: strategy.id,
          balance: 0, // Sera calculé plus tard
        });
        
        // Frais de gestion
        transactions.push({
          date: new Date(subscriptionDate.getTime() + 2000), // 2 secondes après la souscription
          type: 'fundora_fee',
          amount: -managementFee, // Négatif car c'est une sortie
          description: `Frais de gestion (1,7% × ${durationInYears} ans) pour la stratégie ${strategy.name}`,
          strategyName: strategy.name,
          strategyId: strategy.id,
          balance: 0, // Sera calculé plus tard
        });
        
        totalOut += fundoraFee;
      }

      // Ajouter les coupons SANSO
      if (investorInStrategy.history && investorInStrategy.history.sansoInterests) {
        console.log(`Coupons SANSO pour ${investor.name} dans ${strategy.name}:`, investorInStrategy.history.sansoInterests);
        investorInStrategy.history.sansoInterests.forEach((interest: SansoInterestHistory) => {
          transactions.push({
            date: new Date(interest.distributionDate),
            type: 'sanso_interest',
            amount: interest.amount, // Positif car c'est une entrée
            description: `Coupon SANSO (${interest.year || 'N/A'}) - Taux: ${interest.interestRate.toFixed(2)}% - Période: ${interest.daysPeriod} jours`,
            strategyName: strategy.name,
            strategyId: strategy.id,
            balance: 0, // Sera calculé plus tard
          });
          totalIn += interest.amount;
        });
      }

      // Ajouter les distributions PE
      investorInStrategy.history.targetFundDistributions.forEach((distribution: PEDistributionHistory) => {
        transactions.push({
          date: new Date(distribution.distributionDate),
          type: 'pe_distribution',
          amount: distribution.amount, // Positif car c'est une entrée
          description: `Distribution PE - Multiple: ${distribution.multiple.toFixed(2)}x`,
          strategyName: strategy.name,
          strategyId: strategy.id,
          balance: 0, // Sera calculé plus tard
        });
        totalIn += distribution.amount;
      });
    });

    // Trier les transactions par date
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculer le solde après chaque transaction
    let runningBalance = investor.initialBalance || 0;
    transactions.forEach(transaction => {
      runningBalance += transaction.amount;
      transaction.balance = runningBalance;
    });

    setFinancialData({
      investor,
      transactions,
      currentBalance: runningBalance,
      totalIn,
      totalOut
    });
  }, [selectedInvestorId, allInvestors, getInvestorStrategies]);

  // Filtrer les transactions selon les critères
  useEffect(() => {
    if (!financialData) {
      setFilteredTransactions([]);
      return;
    }

    let filtered = [...financialData.transactions];

    // Filtrer par type de transaction
    if (transactionType !== 'all') {
      filtered = filtered.filter(t => t.type === transactionType);
    }

    // Filtrer par date de début
    if (startDate) {
      filtered = filtered.filter(t => t.date >= startDate);
    }

    // Filtrer par date de fin
    if (endDate) {
      filtered = filtered.filter(t => t.date <= endDate);
    }

    setFilteredTransactions(filtered);
  }, [financialData, transactionType, startDate, endDate]);

  // Exporter les données en CSV
  const exportToCSV = () => {
    if (!filteredTransactions.length) return;

    const headers = ['Date', 'Type', 'Montant', 'Description', 'Stratégie', 'Solde après'];
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        new Date(t.date).toLocaleDateString('fr-FR'),
        t.type,
        t.amount.toLocaleString('fr-FR'),
        `"${t.description}"`,
        `"${t.strategyName}"`,
        t.balance.toLocaleString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historique_financier_${selectedInvestorId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtenir la couleur pour le type de transaction
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'subscription':
        return 'error'; // Rouge pour les sorties
      case 'fundora_fee':
        return 'error'; // Rouge pour les sorties
      case 'sanso_interest':
        return 'success'; // Vert pour les entrées
      case 'pe_distribution':
        return 'success'; // Vert pour les entrées
      default:
        return 'default';
    }
  };

  // Obtenir le libellé pour le type de transaction
  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'subscription':
        return 'Souscription';
      case 'fundora_fee':
        return 'Frais Fundora';
      case 'sanso_interest':
        return 'Coupon SANSO';
      case 'pe_distribution':
        return 'Distribution PE';
      default:
        return type;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Historique financier des investisseurs
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          <Box sx={{ width: { xs: '100%', md: '33%' } }}>
            <FormControl fullWidth>
              <InputLabel>Sélectionner un investisseur</InputLabel>
              <Select
                value={selectedInvestorId}
                onChange={handleInvestorChange}
                label="Sélectionner un investisseur"
              >
                {allInvestors.map((investor: Investor) => (
                  <MenuItem key={investor.id} value={investor.id}>
                    {investor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ width: { xs: '100%', md: '67%' } }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <FormControl fullWidth>
                  <InputLabel>Type de transaction</InputLabel>
                  <Select
                    value={transactionType}
                    onChange={handleTransactionTypeChange}
                    label="Type de transaction"
                  >
                    <MenuItem value="all">Tous les types</MenuItem>
                    <MenuItem value="subscription">Souscriptions</MenuItem>
                    <MenuItem value="fundora_fee">Frais Fundora</MenuItem>
                    <MenuItem value="sanso_interest">Coupons SANSO</MenuItem>
                    <MenuItem value="pe_distribution">Distributions PE</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <DatePicker
                  label="Date de début"
                  value={startDate}
                  onChange={setStartDate}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <DatePicker
                  label="Date de fin"
                  value={endDate}
                  onChange={setEndDate}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {financialData && (
        <>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ width: { xs: '100%', sm: '33%' } }}>
                <Typography variant="subtitle1">Investisseur</Typography>
                <Typography variant="h6">{financialData.investor.name}</Typography>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '67%' } }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
                  <Box sx={{ width: '33%' }}>
                    <Typography variant="subtitle1">Solde initial</Typography>
                    <Typography variant="h6">
                      {(financialData.investor.initialBalance || 0).toLocaleString('fr-FR')} €
                    </Typography>
                  </Box>
                  <Box sx={{ width: '33%' }}>
                    <Typography variant="subtitle1">Total entrées</Typography>
                    <Typography variant="h6" color="success.main">
                      +{financialData.totalIn.toLocaleString('fr-FR')} €
                    </Typography>
                  </Box>
                  <Box sx={{ width: '33%' }}>
                    <Typography variant="subtitle1">Total sorties</Typography>
                    <Typography variant="h6" color="error.main">
                      -{financialData.totalOut.toLocaleString('fr-FR')} €
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Box sx={{ width: '50%' }}>
                <Typography variant="subtitle1">Solde actuel</Typography>
                <Typography variant="h5" fontWeight="bold">
                  {financialData.currentBalance.toLocaleString('fr-FR')} €
                </Typography>
              </Box>
              <Box sx={{ width: '50%', textAlign: 'right' }}>
                <Button
                  variant="contained"
                  startIcon={<FileDownloadIcon />}
                  onClick={exportToCSV}
                  disabled={filteredTransactions.length === 0}
                >
                  Exporter en CSV
                </Button>
              </Box>
            </Box>
          </Paper>

          {filteredTransactions.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Stratégie</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Montant</TableCell>
                    <TableCell align="right">Solde après</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        <Chip
                          label={getTransactionTypeLabel(transaction.type)}
                          color={getTransactionTypeColor(transaction.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{transaction.strategyName}</TableCell>
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
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="subtitle1">
                Aucune transaction ne correspond aux critères sélectionnés.
              </Typography>
            </Paper>
          )}
        </>
      )}

      {!selectedInvestorId && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="subtitle1">
            Veuillez sélectionner un investisseur pour afficher son historique financier.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default InvestorFinancialHistory;
