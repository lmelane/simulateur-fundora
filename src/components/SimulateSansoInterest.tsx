import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { useStrategy } from '../context/StrategyContext';
import { Strategy } from '../types/models';

interface SansoSimulationFormValues {
  strategyId: string;
  entryNav: number;
  exitNav: number;
  entryDate: Date;
  exitDate: Date;
  year: number;
}

const validationSchema = Yup.object({
  strategyId: Yup.string()
    .required('La stratégie est requise'),
  entryNav: Yup.number()
    .required('La VL d\'entrée est requise')
    .positive('La VL d\'entrée doit être positive'),
  exitNav: Yup.number()
    .required('La VL de sortie est requise')
    .positive('La VL de sortie doit être positive'),
  entryDate: Yup.date()
    .required('La date d\'entrée est requise'),
  exitDate: Yup.date()
    .required('La date de sortie est requise')
    .min(
      Yup.ref('entryDate'),
      'La date de sortie doit être après la date d\'entrée'
    ),
  year: Yup.number()
    .required('L\'année est requise'),
});

const SimulateSansoInterest: React.FC = () => {
  const { strategies, currentStrategy, setCurrentStrategy, simulateSansoInterest } = useStrategy();
  const [simulatedYears, setSimulatedYears] = useState<Map<string, number[]>>(new Map());
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(currentStrategy);
  
  // Mettre à jour la stratégie sélectionnée lorsque currentStrategy change
  useEffect(() => {
    if (currentStrategy) {
      setSelectedStrategy(currentStrategy);
    }
  }, [currentStrategy]);
  
  // Initialiser la carte des années simulées pour chaque stratégie
  useEffect(() => {
    const yearsMap = new Map<string, number[]>();
    
    strategies.forEach(strategy => {
      const simulatedYearsForStrategy = new Set<number>();
      
      strategy.investors.forEach(investor => {
        investor.history.sansoInterests.forEach(interest => {
          simulatedYearsForStrategy.add(interest.year);
        });
      });
      
      yearsMap.set(strategy.id, Array.from(simulatedYearsForStrategy));
    });
    
    setSimulatedYears(yearsMap);
  }, [strategies]);

  if (strategies.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6">
          Veuillez d'abord créer une stratégie
        </Typography>
      </Paper>
    );
  }

  // Obtenir l'année de départ de la stratégie sélectionnée
  const getStartYear = (strategy: Strategy | null) => {
    return strategy 
      ? new Date(strategy.startDate).getFullYear() 
      : new Date().getFullYear();
  };
  
  // Générer les années disponibles pour la stratégie sélectionnée
  const getAvailableYears = (strategy: Strategy | null) => {
    if (!strategy) return [];
    
    const startYear = getStartYear(strategy);
    const currentYear = new Date().getFullYear();
    
    return Array.from(
      { length: currentYear + 5 - startYear + 1 }, 
      (_, i) => startYear + i
    );
  };

  // Vérifier si une année a déjà été simulée pour une stratégie donnée
  const isYearSimulated = (strategyId: string, year: number) => {
    const yearsForStrategy = simulatedYears.get(strategyId);
    return yearsForStrategy ? yearsForStrategy.includes(year) : false;
  };

  // Générer les dates initiales en fonction de l'année et de la stratégie sélectionnées
  const getInitialDatesForYear = (strategy: Strategy | null, year: number) => {
    if (!strategy) {
      return { entryDate: new Date(), exitDate: new Date() };
    }
    
    const startYear = getStartYear(strategy);
    
    // Date d'entrée : 1er janvier de l'année sélectionnée ou date de départ de la stratégie si c'est la première année
    const entryDate = year === startYear 
      ? new Date(strategy.startDate) 
      : new Date(year, 0, 1);
    
    // Date de sortie : 15 décembre de l'année sélectionnée (date de valorisation SANSO)
    const exitDate = new Date(year, 11, 15);
    
    return { entryDate, exitDate };
  };

  // Trouver la première stratégie avec des investisseurs
  const findFirstValidStrategy = () => {
    const validStrategy = strategies.find(s => s.investors.length > 0);
    return validStrategy || strategies[0];
  };

  // Valeurs initiales du formulaire
  const initialStrategy = selectedStrategy || findFirstValidStrategy();
  const initialYear = initialStrategy 
    ? getAvailableYears(initialStrategy).find(year => !isYearSimulated(initialStrategy.id, year)) || new Date().getFullYear()
    : new Date().getFullYear();
  const initialDates = getInitialDatesForYear(initialStrategy, initialYear);

  const initialValues: SansoSimulationFormValues = {
    strategyId: initialStrategy ? initialStrategy.id : '',
    entryNav: 100,
    exitNav: 103.5,
    entryDate: initialDates.entryDate,
    exitDate: initialDates.exitDate,
    year: initialYear,
  };

  const handleSubmit = (values: SansoSimulationFormValues) => {
    // Calculate interest rate based on NAV difference
    const interestRate = ((values.exitNav - values.entryNav) / values.entryNav) * 100;
    
    simulateSansoInterest(values.strategyId, {
      entryNav: values.entryNav,
      exitNav: values.exitNav,
      entryDate: values.entryDate,
      exitDate: values.exitDate,
      interestRate,
      distributionDate: new Date(), // Utiliser la date actuelle comme date de distribution
      year: values.year,
    });
    
    // Mettre à jour la liste des années simulées pour cette stratégie
    setSimulatedYears(prev => {
      const newMap = new Map(prev);
      const yearsForStrategy = newMap.get(values.strategyId) || [];
      if (!yearsForStrategy.includes(values.year)) {
        newMap.set(values.strategyId, [...yearsForStrategy, values.year]);
      }
      return newMap;
    });
    
    // Mettre à jour la stratégie courante
    const selectedStrategy = strategies.find(s => s.id === values.strategyId);
    if (selectedStrategy) {
      setCurrentStrategy(selectedStrategy);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Simulation du coupon SANSO
        </Typography>
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={true}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Sélecteur de stratégie */}
                <Box sx={{ flex: '1 1 100%', minWidth: '250px' }}>
                  <FormControl fullWidth error={!!(touched.strategyId && errors.strategyId)}>
                    <InputLabel id="strategy-select-label">Stratégie</InputLabel>
                    <Field name="strategyId">
                      {({ field }: FieldProps) => (
                        <Select
                          {...field}
                          labelId="strategy-select-label"
                          label="Stratégie"
                          onChange={(e) => {
                            const selectedStrategyId = e.target.value as string;
                            setFieldValue('strategyId', selectedStrategyId);
                            
                            // Mettre à jour la stratégie sélectionnée
                            const strategy = strategies.find(s => s.id === selectedStrategyId);
                            setSelectedStrategy(strategy || null);
                            
                            // Réinitialiser l'année et les dates
                            if (strategy) {
                              const availableYears = getAvailableYears(strategy);
                              const nextYear = availableYears.find(year => !isYearSimulated(selectedStrategyId, year)) || availableYears[0];
                              setFieldValue('year', nextYear);
                              
                              const { entryDate, exitDate } = getInitialDatesForYear(strategy, nextYear);
                              setFieldValue('entryDate', entryDate);
                              setFieldValue('exitDate', exitDate);
                            }
                          }}
                        >
                          {strategies.map((strategy) => (
                            <MenuItem 
                              key={strategy.id} 
                              value={strategy.id}
                              disabled={strategy.investors.length === 0}
                            >
                              {strategy.name} {strategy.investors.length === 0 ? '(aucun investisseur)' : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    </Field>
                    {touched.strategyId && errors.strategyId && (
                      <FormHelperText>{errors.strategyId}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
                
                {/* Sélecteur d'année */}
                <Box sx={{ flex: '1 1 100%', minWidth: '250px' }}>
                  <FormControl fullWidth error={!!(touched.year && errors.year)}>
                    <InputLabel id="year-select-label">Année du coupon</InputLabel>
                    <Field name="year">
                      {({ field }: FieldProps) => (
                        <Select
                          {...field}
                          labelId="year-select-label"
                          label="Année du coupon"
                          onChange={(e) => {
                            const selectedYear = e.target.value as number;
                            setFieldValue('year', selectedYear);
                            
                            // Mettre à jour les dates en fonction de l'année sélectionnée
                            const strategy = strategies.find(s => s.id === values.strategyId);
                            const { entryDate, exitDate } = getInitialDatesForYear(strategy || null, selectedYear);
                            setFieldValue('entryDate', entryDate);
                            setFieldValue('exitDate', exitDate);
                          }}
                        >
                          {getAvailableYears(selectedStrategy).map((year) => {
                            const isDisabled = values.strategyId ? isYearSimulated(values.strategyId, year) : false;
                            return (
                              <MenuItem 
                                key={year} 
                                value={year}
                                disabled={isDisabled}
                              >
                                {year} {isDisabled ? '(déjà simulé)' : ''}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      )}
                    </Field>
                    {touched.year && errors.year && (
                      <FormHelperText>{errors.year}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <Field name="entryNav">
                      {({ field, meta }: FieldProps) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="VL d'entrée"
                          error={!!(meta.touched && meta.error)}
                          helperText={meta.touched && meta.error ? meta.error : ''}
                        />
                      )}
                    </Field>
                  </Box>
                  
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <Field name="exitNav">
                      {({ field, meta }: FieldProps) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="VL de sortie"
                          error={!!(meta.touched && meta.error)}
                          helperText={meta.touched && meta.error ? meta.error : ''}
                        />
                      )}
                    </Field>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <DatePicker
                      label="Date d'entrée"
                      value={values.entryDate}
                      onChange={(newValue) => {
                        setFieldValue('entryDate', newValue);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!(touched.entryDate && errors.entryDate),
                          helperText: touched.entryDate && errors.entryDate ? String(errors.entryDate) : undefined,
                        },
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <DatePicker
                      label="Date de sortie"
                      value={values.exitDate}
                      onChange={(newValue) => {
                        setFieldValue('exitDate', newValue);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!(touched.exitDate && errors.exitDate),
                          helperText: touched.exitDate && errors.exitDate ? String(errors.exitDate) : undefined,
                        },
                      }}
                    />
                  </Box>
                </Box>
                
                <Box>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Taux d'intérêt calculé
                    </Typography>
                    <Typography variant="h6">
                      {((values.exitNav - values.entryNav) / values.entryNav * 100).toFixed(2)}%
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                    disabled={
                      !values.strategyId || 
                      (values.strategyId && isYearSimulated(values.strategyId, values.year)) ||
                      !selectedStrategy ||
                      (selectedStrategy && selectedStrategy.investors.length === 0)
                    }
                  >
                    Simuler le coupon SANSO {values.year} pour {selectedStrategy?.name}
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </LocalizationProvider>
  );
};

export default SimulateSansoInterest;
