import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Typography,
  SelectChangeEvent
} from '@mui/material';
import { useStrategy } from '../context/StrategyContext';

const StrategySelector: React.FC = () => {
  const { strategies, currentStrategy, setCurrentStrategy } = useStrategy();

  const handleStrategyChange = (event: SelectChangeEvent) => {
    const strategyId = event.target.value;
    const selectedStrategy = strategies.find(s => s.id === strategyId);
    if (selectedStrategy) {
      setCurrentStrategy(selectedStrategy);
    }
  };

  if (strategies.length <= 1) {
    return null; // Ne rien afficher s'il n'y a qu'une seule stratégie
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" gutterBottom>
        Stratégie active
      </Typography>
      <FormControl fullWidth>
        <InputLabel>Sélectionner une stratégie</InputLabel>
        <Select
          value={currentStrategy?.id || ''}
          onChange={handleStrategyChange}
          label="Sélectionner une stratégie"
        >
          {strategies.map((strategy) => (
            <MenuItem key={strategy.id} value={strategy.id}>
              {strategy.name} - Créée le {new Date(strategy.createdAt).toLocaleDateString('fr-FR')}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default StrategySelector;
