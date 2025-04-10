import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  SelectChangeEvent,
  Alert,
  Divider,
} from '@mui/material';
import { useStrategy } from '../context/StrategyContext';

/**
 * Composant permettant de simuler un nouvel appel de fonds
 * Permet de spécifier le numéro d'appel et le pourcentage à appeler
 */
const NewFundCall: React.FC = () => {
  const { currentStrategy, simulateNewFundCall } = useStrategy();
  const [callNumber, setCallNumber] = useState<number>(2); // Par défaut, le 2ème appel (le 1er est fait à la création)
  const [callPercentage, setCallPercentage] = useState<number>(20); // Pourcentage par défaut
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si une stratégie est sélectionnée
  if (!currentStrategy) {
    return (
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6">
          Veuillez d'abord sélectionner une stratégie
        </Typography>
      </Paper>
    );
  }

  // Vérifier si la stratégie a des investisseurs
  if (currentStrategy.investors.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6">
          Cette stratégie n'a pas encore d'investisseurs
        </Typography>
      </Paper>
    );
  }

  // Gérer le changement du numéro d'appel
  const handleCallNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 2) { // Le premier appel est fait à la création
      setCallNumber(value);
      setError(null);
    } else {
      setError("Le numéro d'appel doit être supérieur ou égal à 2");
    }
  };

  // Gérer le changement du pourcentage d'appel
  const handleCallPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (value > 0 && value <= 100) {
      setCallPercentage(value);
      setError(null);
    } else {
      setError("Le pourcentage d'appel doit être compris entre 0 et 100");
    }
  };

  // Simuler l'appel de fonds
  const handleSimulateFundCall = () => {
    try {
      // Vérifier si les valeurs sont valides
      if (callNumber < 2) {
        setError("Le numéro d'appel doit être supérieur ou égal à 2");
        return;
      }

      if (callPercentage <= 0 || callPercentage > 100) {
        setError("Le pourcentage d'appel doit être compris entre 0 et 100");
        return;
      }

      // Vérifier que la stratégie courante existe toujours
      if (!currentStrategy || !currentStrategy.id) {
        setError("Stratégie non valide. Veuillez rafraîchir la page et réessayer.");
        return;
      }

      console.log("NewFundCall - Simulation d'un appel de fonds pour la stratégie:", currentStrategy.id);
      
      // Simuler l'appel de fonds
      simulateNewFundCall(currentStrategy.id, callNumber, callPercentage);
      
      // Afficher un message de succès
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Masquer le message après 3 secondes
    } catch (err) {
      console.error("NewFundCall - Erreur lors de la simulation d'un appel de fonds:", err);
      setError(`Une erreur est survenue: ${err}`);
    }
  };

  // Calculer le montant total non investi (somme des wallets SANSO)
  const totalNonInvestedAmount = currentStrategy.investors.reduce((sum, investor) => {
    return sum + investor.wallets.sanso;
  }, 0);
  
  // Calculer le montant total qui sera appelé (somme des montants individuels)
  const totalCallAmount = currentStrategy.investors.reduce((sum, investor) => {
    const individualCallAmount = parseFloat(((investor.wallets.sanso * callPercentage) / 100).toFixed(2));
    return sum + individualCallAmount;
  }, 0);

  // Vérifier si certains investisseurs n'ont pas assez de fonds dans leur wallet SANSO
  const investorsWithInsufficientFunds = currentStrategy.investors.filter(investor => {
    const individualCallAmount = parseFloat(((investor.wallets.sanso * callPercentage) / 100).toFixed(2));
    return investor.wallets.sanso < individualCallAmount;
  });

  const hasInsufficientFunds = investorsWithInsufficientFunds.length > 0;

  return (
    <Card elevation={3} sx={{ mb: 4 }}>
      <CardHeader 
        title="Simuler un nouvel appel de fonds" 
        subheader="Transférer des fonds du wallet SANSO vers le wallet SPV"
      />
      <Divider />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Appel de fonds n°{callNumber} simulé avec succès ({callPercentage}%)
          </Alert>
        )}
        {hasInsufficientFunds && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Attention : {investorsWithInsufficientFunds.length} investisseur(s) n'ont pas suffisamment de fonds dans leur wallet SANSO pour cet appel de fonds. Le montant appelé sera limité au solde disponible pour ces investisseurs.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
            <TextField
              fullWidth
              label="Numéro d'appel de fonds"
              type="number"
              value={callNumber}
              onChange={handleCallNumberChange}
              helperText="Le premier appel est fait à la création de la stratégie"
              inputProps={{ min: 2 }}
            />
          </Box>
          <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
            <TextField
              fullWidth
              label="Pourcentage à appeler (%)"
              type="number"
              value={callPercentage}
              onChange={handleCallPercentageChange}
              helperText="Pourcentage du montant non investi à transférer"
              inputProps={{ min: 0, max: 100, step: 0.1 }}
            />
          </Box>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            Résumé de l'appel de fonds
          </Typography>
          <Typography variant="body2">
            Stratégie: <strong>{currentStrategy.name}</strong>
          </Typography>
          <Typography variant="body2">
            Montant total non investi (wallet SANSO): <strong>{totalNonInvestedAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
          </Typography>
          <Typography variant="body2">
            Montant total appelé ({callPercentage}%): <strong>{totalCallAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Les fonds seront transférés du wallet SANSO vers le wallet SPV pour chaque investisseur en fonction de leur montant non investi individuel.
          </Typography>
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSimulateFundCall}
            disabled={!!error}
          >
            Simuler l'appel de fonds
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NewFundCall;
