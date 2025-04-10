import React, { useState } from 'react';
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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { useStrategy } from '../context/StrategyContext';
import { CapTableEntry, FundCallHistory } from '../types/models';

const CapTable: React.FC = () => {
  const { currentStrategy } = useStrategy();
  const [openFundCallHistory, setOpenFundCallHistory] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<CapTableEntry | null>(null);

  // Ajouter du débogage
  console.log("CapTable - currentStrategy:", currentStrategy);
  if (currentStrategy) {
    console.log("CapTable - investors:", currentStrategy.investors);
    console.log("CapTable - investors length:", currentStrategy.investors.length);
    console.log("CapTable - investors type:", Array.isArray(currentStrategy.investors) ? "Array" : typeof currentStrategy.investors);
    
    // Vérifier si les investisseurs ont les propriétés attendues
    if (currentStrategy.investors.length > 0) {
      console.log("CapTable - Premier investisseur:", currentStrategy.investors[0]);
    }
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
  const capTableEntries: CapTableEntry[] = currentStrategy.investors.map(investor => {
    // Utiliser l'historique des appels de fonds pour calculer le montant de l'appel de fonds initial
    const initialFundCallAmount = investor.history.fundCalls.reduce((sum, fundCall) => sum + fundCall.amount, 0);

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
      fundCallsHistory: investor.history.fundCalls,
    };
  });

  // Calculate totals for the footer
  const totals = {
    paidAmount: capTableEntries.reduce((sum, entry) => sum + entry.paidAmount, 0),
    investedAmount: capTableEntries.reduce((sum, entry) => sum + entry.investedAmount, 0),
    nonInvestedAmount: capTableEntries.reduce((sum, entry) => sum + entry.nonInvestedAmount, 0),
    initialFundCallAmount: capTableEntries.reduce((sum, entry) => sum + entry.initialFundCallAmount, 0),
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

  // Format number as percentage with 2 decimal places
  const formatPercentage = (percentage: number) => {
    return percentage.toFixed(2);
  };

  const handleOpenFundCallHistory = (investor: CapTableEntry) => {
    setSelectedInvestor(investor);
    setOpenFundCallHistory(true);
  };

  const handleCloseFundCallHistory = () => {
    setOpenFundCallHistory(false);
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
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Montant payé</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Montant investi</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Montant non investi</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Pourcentage de détention</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Appel de fonds N°1</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Coupon SANSO</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Distribution Fonds Cible</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Historique des appels de fonds</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {capTableEntries.map((entry) => (
              <TableRow key={entry.investorId}>
                <TableCell component="th" scope="row">
                  {entry.investorName}
                </TableCell>
                <TableCell align="right">{formatCurrency(entry.paidAmount)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.investedAmount)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.nonInvestedAmount)}</TableCell>
                <TableCell align="right">{formatPercentage(entry.ownershipPercentage)}%</TableCell>
                <TableCell align="right">{formatCurrency(entry.initialFundCallAmount)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.sansoInterest)}</TableCell>
                <TableCell align="right">{formatCurrency(entry.targetFundDistribution)}</TableCell>
                <TableCell align="right">
                  <Button variant="contained" onClick={() => handleOpenFundCallHistory(entry)}>
                    Voir l'historique
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Totals row */}
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                TOTAL
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.paidAmount)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.investedAmount)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.nonInvestedAmount)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}></TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.initialFundCallAmount)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.sansoInterest)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatCurrency(totals.targetFundDistribution)}</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Résumé des flux financiers
        </Typography>
        
        <Box sx={{
          mt: 3,
          p: 2,
          border: 1,
          borderRadius: 1,
          borderColor: 'divider',
        }}>
          <Typography variant="body1" paragraph>
            <strong>Montant total payé:</strong> {formatCurrency(totals.paidAmount)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Montant total investi:</strong> {formatCurrency(totals.investedAmount)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Montant total non investi:</strong> {formatCurrency(totals.nonInvestedAmount)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Appel initial ({currentStrategy.initialCallPercentage}%):</strong> {formatCurrency(totals.initialFundCallAmount)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Total coupons SANSO:</strong> {formatCurrency(totals.sansoInterest)}
          </Typography>
          
          <Typography variant="body1" paragraph>
            <strong>Total distributions fonds cible:</strong> {formatCurrency(totals.targetFundDistribution)}
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
      
      <Dialog open={openFundCallHistory} onClose={handleCloseFundCallHistory}>
        <DialogTitle>Histoire des appels de fonds pour {selectedInvestor?.investorName}</DialogTitle>
        <DialogContent>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Appel de fonds</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Montant</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(selectedInvestor?.fundCallsHistory || []).map((fundCall: FundCallHistory, index: number) => (
                <TableRow key={`${selectedInvestor?.investorId}-fundCall-${index}`}>
                  <TableCell component="th" scope="row">
                    Appel de fonds {fundCall.callNumber}
                  </TableCell>
                  <TableCell align="right">{new Date(fundCall.date).toLocaleDateString()}</TableCell>
                  <TableCell align="right">{formatCurrency(fundCall.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFundCallHistory}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CapTable;
