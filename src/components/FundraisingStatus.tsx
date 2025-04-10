import React from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  LinearProgress, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  IconButton
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { Strategy } from '../types/models';

interface FundraisingStatusProps {
  strategy: Strategy;
}

const FundraisingStatus: React.FC<FundraisingStatusProps> = ({ strategy }) => {
  // Calculer le pourcentage de progression de la levée de fonds
  const progressPercentage = strategy.netTargetAllocation && strategy.netTargetAllocation > 0 
    ? Math.min((strategy.totalNetInvestedAmount || 0) / strategy.netTargetAllocation * 100, 100)
    : 0;
  
  // Déterminer si la sursouscription est active
  const isOversubscribed = strategy.netTargetAllocation && 
    (strategy.totalNetInvestedAmount || 0) > strategy.netTargetAllocation;
  
  // Calculer le montant de la sursouscription
  const oversubscriptionAmount = isOversubscribed && strategy.netTargetAllocation
    ? (strategy.totalNetInvestedAmount || 0) - strategy.netTargetAllocation
    : 0;
  
  // Formater les montants en euros
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Statut de la levée de fonds
        <Tooltip title="La sursouscription est autorisée. Le montant indicatif à lever est calculé comme l'allocation nette cible × 1,2.">
          <IconButton size="small" sx={{ ml: 1 }}>
            <InfoIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Allocation nette cible
            </Typography>
            <Typography variant="h6">
              {formatCurrency(strategy.netTargetAllocation || 0)}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Montant indicatif à lever
            </Typography>
            <Typography variant="h6">
              {formatCurrency(strategy.indicativeAmount || 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Allocation nette cible × 1,2
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Montant levé brut (engagements)
            </Typography>
            <Typography variant="h6">
              {formatCurrency(strategy.totalRaisedAmount || 0)}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Montant réellement investi (net)
            </Typography>
            <Typography variant="h6">
              {formatCurrency(strategy.totalNetInvestedAmount || 0)}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1">
            Progression de la levée de fonds
          </Typography>
          <Typography variant="subtitle1">
            {progressPercentage.toFixed(1)}%
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={progressPercentage} 
          sx={{ 
            height: 10, 
            borderRadius: 5,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: isOversubscribed ? 'warning.main' : 'success.main',
            }
          }} 
        />
        
        {isOversubscribed && (
          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
            Sursouscription: {formatCurrency(oversubscriptionAmount)}
          </Typography>
        )}
        
        <Typography variant="body2" sx={{ mt: 1 }}>
          {isOversubscribed 
            ? `Dépassement de l'allocation cible: ${formatCurrency(oversubscriptionAmount)}`
            : `Reste à investir: ${formatCurrency(strategy.remainingToInvest || 0)}`
          }
        </Typography>
      </Box>
      
      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Détails par tranche de frais
        </Typography>
        
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tranche</TableCell>
                <TableCell align="right">Frais de structuration</TableCell>
                <TableCell align="right">Frais de gestion annuels</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>0€ à 30 000€</TableCell>
                <TableCell align="right">3,0%</TableCell>
                <TableCell align="right">1,7%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>30 000€ à 100 000€</TableCell>
                <TableCell align="right">2,5%</TableCell>
                <TableCell align="right">1,5%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>≥ 100 000€</TableCell>
                <TableCell align="right">2,0%</TableCell>
                <TableCell align="right">1,2%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Typography variant="body2" color="text.secondary">
          Les frais sont calculés dynamiquement en fonction du montant investi par chaque investisseur.
          La durée de la stratégie est de {strategy.durationInYears || 0} ans.
        </Typography>
      </Box>
    </Paper>
  );
};

export default FundraisingStatus;
