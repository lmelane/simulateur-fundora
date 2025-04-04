import React, { useState, useContext, useEffect } from 'react';
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
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import { StrategyContext } from '../context/StrategyContext';
import { Investor, Strategy, SansoInterestHistory } from '../types/models';

interface InvestorSansoSummaryProps {
  year?: number;
}

interface InvestorSansoData {
  investor: Investor;
  strategies: Strategy[];
  totalSansoInterest: number;
  interestDetails: {
    strategyId: string;
    strategyName: string;
    amount: number;
    year: number;
    date: string;
    daysPeriod: number;
  }[];
}

const InvestorSansoSummary: React.FC<InvestorSansoSummaryProps> = ({ year }) => {
  const strategyContext = useContext(StrategyContext);
  
  if (!strategyContext) {
    throw new Error('InvestorSansoSummary must be used within a StrategyProvider');
  }
  
  const { investors, getInvestorStrategies, getTotalSansoInterest } = strategyContext;
  
  const [selectedYear, setSelectedYear] = useState<number | undefined>(year);
  const [summaryData, setSummaryData] = useState<InvestorSansoData[]>([]);
  const [expandedInvestor, setExpandedInvestor] = useState<string | false>(false);
  
  // Récupérer toutes les années disponibles pour les coupons SANSO
  const availableYears = React.useMemo(() => {
    const years = new Set<number>();
    
    investors.forEach((investor: Investor) => {
      investor.history.sansoInterests.forEach((interest: SansoInterestHistory) => {
        if (interest.year) {
          years.add(interest.year);
        } else {
          // Si l'année n'est pas définie, utiliser l'année de la date
          const interestYear = new Date(interest.distributionDate).getFullYear();
          years.add(interestYear);
        }
      });
    });
    
    return Array.from(years).sort((a, b) => a - b);
  }, [investors]);
  
  // Générer les données de résumé
  useEffect(() => {
    const data: InvestorSansoData[] = investors.map((investor: Investor) => {
      const strategies = getInvestorStrategies(investor.id);
      const interestDetails: InvestorSansoData['interestDetails'] = [];
      
      // Filtrer les intérêts par année si une année est sélectionnée
      strategies.forEach(strategy => {
        const investorInStrategy = strategy.investors.find(inv => inv.id === investor.id);
        if (!investorInStrategy) return;
        
        investorInStrategy.history.sansoInterests.forEach(interest => {
          const interestYear = interest.year || new Date(interest.distributionDate).getFullYear();
          
          if (!selectedYear || interestYear === selectedYear) {
            interestDetails.push({
              strategyId: strategy.id,
              strategyName: strategy.name,
              amount: interest.amount,
              year: interestYear,
              date: interest.distributionDate.toISOString(),
              daysPeriod: interest.daysPeriod || 0
            });
          }
        });
      });
      
      // Calculer le total des intérêts SANSO pour l'investisseur
      const totalSansoInterest = interestDetails.reduce((sum, interest) => sum + interest.amount, 0);
      
      return {
        investor,
        strategies,
        totalSansoInterest,
        interestDetails
      };
    }).filter((data: InvestorSansoData) => data.interestDetails.length > 0);
    
    // Trier par montant total d'intérêts SANSO (décroissant)
    data.sort((a, b) => b.totalSansoInterest - a.totalSansoInterest);
    
    setSummaryData(data);
  }, [investors, getInvestorStrategies, selectedYear]);
  
  // Exporter les données au format CSV
  const exportToCSV = () => {
    // En-tête du CSV
    let csvContent = "Investisseur;Nombre de stratégies;Total coupons SANSO;Détails\n";
    
    // Données
    summaryData.forEach(data => {
      const detailsStr = data.interestDetails
        .map(detail => `${detail.strategyName}: ${detail.amount.toLocaleString('fr-FR')} €`)
        .join(' | ');
      
      csvContent += `${data.investor.name};${data.strategies.length};${data.totalSansoInterest.toLocaleString('fr-FR')} €;${detailsStr}\n`;
    });
    
    // Créer un blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `coupons_sanso_${selectedYear || 'tous'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Gérer l'expansion/réduction des détails d'un investisseur
  const handleAccordionChange = (investorId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedInvestor(isExpanded ? investorId : false);
  };
  
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Résumé des coupons SANSO par investisseur
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="year-select-label">Année</InputLabel>
            <Select
              labelId="year-select-label"
              value={selectedYear || ''}
              label="Année"
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
            >
              <MenuItem value="">Toutes les années</MenuItem>
              {availableYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={exportToCSV}
            disabled={summaryData.length === 0}
          >
            Exporter CSV
          </Button>
        </Box>
      </Box>
      
      {summaryData.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            {selectedYear 
              ? `Aucun coupon SANSO trouvé pour l'année ${selectedYear}.` 
              : "Aucun coupon SANSO n'a été distribué."}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Investisseur</TableCell>
                <TableCell align="center">
                  Stratégies
                  <Tooltip title="Nombre de stratégies dans lesquelles l'investisseur participe">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="right">
                  Total coupons SANSO
                  <Tooltip title="Somme de tous les coupons SANSO reçus par l'investisseur">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">Détails</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {summaryData.map(data => (
                <React.Fragment key={data.investor.id}>
                  <TableRow>
                    <TableCell component="th" scope="row">
                      {data.investor.name}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={data.strategies.length} 
                        color={data.strategies.length > 1 ? "primary" : "default"} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="right">
                      {data.totalSansoInterest.toLocaleString('fr-FR')} €
                    </TableCell>
                    <TableCell align="center">
                      <Accordion 
                        expanded={expandedInvestor === data.investor.id}
                        onChange={handleAccordionChange(data.investor.id)}
                        sx={{ boxShadow: 'none', background: 'transparent' }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2">Voir détails</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Stratégie</TableCell>
                                <TableCell align="right">Montant</TableCell>
                                <TableCell align="center">Date</TableCell>
                                <TableCell align="center">Période (jours)</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {data.interestDetails.map((detail, index) => (
                                <TableRow key={index}>
                                  <TableCell>{detail.strategyName}</TableCell>
                                  <TableCell align="right">{detail.amount.toLocaleString('fr-FR')} €</TableCell>
                                  <TableCell align="center">{new Date(detail.date).toLocaleDateString('fr-FR')}</TableCell>
                                  <TableCell align="center">{detail.daysPeriod}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default InvestorSansoSummary;
