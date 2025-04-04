import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from '@mui/material';
import { useStrategy } from '../context/StrategyContext';
import { CapTableEntry } from '../types/models';

const CapTable: React.FC = () => {
  const { currentStrategy } = useStrategy();

  // Ajouter du débogage
  console.log("CapTable - currentStrategy:", currentStrategy);
  if (currentStrategy) {
    console.log("CapTable - investors:", currentStrategy.investors);
    console.log("CapTable - investors length:", currentStrategy.investors.length);
  }

  if (!currentStrategy || currentStrategy.investors.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6">
          Veuillez d'abord créer une stratégie et ajouter des investisseurs
        </Typography>
      </Paper>
    );
  }

  // Generate cap table entries from current strategy
  const capTableEntries: CapTableEntry[] = currentStrategy.investors.map(investor => ({
    investorId: investor.id,
    investorName: investor.name,
    investedAmount: investor.investedAmount,
    spvWallet: investor.wallets.spv,
    sansoWallet: investor.wallets.sanso,
    sansoInterest: investor.transactions.sansoInterest,
    targetFundDistribution: investor.transactions.targetFundDistribution,
    investorWallet: investor.wallets.investor,
    sansoInterestHistory: investor.history.sansoInterests,
    targetFundDistributionHistory: investor.history.targetFundDistributions,
  }));

  // Calculate totals for the footer
  const totals = {
    investedAmount: capTableEntries.reduce((sum, entry) => sum + entry.investedAmount, 0),
    spvWallet: capTableEntries.reduce((sum, entry) => sum + entry.spvWallet, 0),
    sansoWallet: capTableEntries.reduce((sum, entry) => sum + entry.sansoWallet, 0),
    sansoInterest: capTableEntries.reduce((sum, entry) => sum + entry.sansoInterest, 0),
    targetFundDistribution: capTableEntries.reduce((sum, entry) => sum + entry.targetFundDistribution, 0),
    investorWallet: capTableEntries.reduce((sum, entry) => sum + entry.investorWallet, 0),
  };

  // Format number as currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Cap Table - {currentStrategy.name}
      </Typography>
      
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table sx={{ minWidth: 650 }} aria-label="cap table">
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nom</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Montant Investi</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Wallet SPV</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Wallet SANSO</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Coupon SANSO</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Distribution Fonds Cible</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Wallet Investisseur</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {capTableEntries.map((entry) => (
              <TableRow key={entry.investorId}>
                <TableCell component="th" scope="row">
                  {entry.investorName}
                </TableCell>
                <TableCell align="right">{formatCurrency(entry.investedAmount)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.spvWallet)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.sansoWallet)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.sansoInterest)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.targetFundDistribution)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.investorWallet)}</TableCell>
              </TableRow>
            ))}
            
            {/* Totals row */}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                TOTAL
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.investedAmount)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.spvWallet)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.sansoWallet)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.sansoInterest)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.targetFundDistribution)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.investorWallet)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Résumé des flux financiers
        </Typography>
        
        <Box sx={{ 
          p: 2, 
          bgcolor: 'background.paper', 
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
        }}>
          <Typography variant="body1" paragraph>
            <strong>Montant total investi:</strong> {formatCurrency(totals.investedAmount)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Appel initial ({currentStrategy.initialCallPercentage}%):</strong> {formatCurrency(totals.spvWallet)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Trésorerie non investie:</strong> {formatCurrency(totals.sansoWallet)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Revenus générés:</strong>
          </Typography>
          
          <Typography variant="body1" sx={{ pl: 2 }} paragraph>
            • Coupon SANSO: {formatCurrency(totals.sansoInterest)}
          </Typography>
          
          <Typography variant="body1" sx={{ pl: 2 }} paragraph>
            • Distribution Fonds Cible: {formatCurrency(totals.targetFundDistribution)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Solde disponible dans les wallets investisseurs:</strong> {formatCurrency(totals.investorWallet)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Performance globale:</strong> {((totals.investorWallet / totals.investedAmount) * 100).toFixed(2)}%
          </Typography>
        </Box>
      </Box>
      
      {/* Historique des coupons SANSO */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Historique des coupons SANSO
        </Typography>
        
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Investisseur</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Année</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Date de distribution</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>VL Entrée</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>VL Sortie</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Taux d'intérêt</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Montant</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {capTableEntries.flatMap((entry) => 
              (entry.sansoInterestHistory || []).map((interest, index) => (
                <TableRow key={`${entry.investorId}-sanso-${index}`}>
                  <TableCell component="th" scope="row">
                    {entry.investorName}
                  </TableCell>
                  <TableCell align="right">{interest.year}</TableCell>
                  <TableCell align="right">{interest.distributionDate.toLocaleDateString()}</TableCell>
                  <TableCell align="right">{interest.entryNav.toFixed(2)}</TableCell>
                  <TableCell align="right">{interest.exitNav.toFixed(2)}</TableCell>
                  <TableCell align="right">{interest.interestRate.toFixed(2)}%</TableCell>
                  <TableCell align="right">{formatCurrency(interest.amount)}</TableCell>
                </TableRow>
              ))
            )}
            
            {/* Si aucun historique n'est disponible */}
            {capTableEntries.every(entry => !entry.sansoInterestHistory || entry.sansoInterestHistory.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Aucun coupon SANSO n'a encore été distribué
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
      
      {/* Historique des distributions PE */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Historique des distributions du fonds cible
        </Typography>
        
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Investisseur</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Année</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Date de distribution</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Multiple</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Montant</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {capTableEntries.flatMap((entry) => 
              (entry.targetFundDistributionHistory || []).map((distribution, index) => (
                <TableRow key={`${entry.investorId}-pe-${index}`}>
                  <TableCell component="th" scope="row">
                    {entry.investorName}
                  </TableCell>
                  <TableCell align="right">{distribution.year}</TableCell>
                  <TableCell align="right">{distribution.distributionDate.toLocaleDateString()}</TableCell>
                  <TableCell align="right">{distribution.multiple.toFixed(2)}%</TableCell>
                  <TableCell align="right">{formatCurrency(distribution.amount)}</TableCell>
                </TableRow>
              ))
            )}
            
            {/* Si aucun historique n'est disponible */}
            {capTableEntries.every(entry => !entry.targetFundDistributionHistory || entry.targetFundDistributionHistory.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucune distribution du fonds cible n'a encore été effectuée
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
};

export default CapTable;
