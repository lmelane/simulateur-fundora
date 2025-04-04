import React, { useState } from 'react';
import { Formik, Form, FieldArray, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  IconButton,
  Divider,
  InputAdornment,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useStrategy } from '../context/StrategyContext';
import { useGlobalInvestor } from '../context/GlobalInvestorContext';
import { Investor } from '../types/models';
import InvestorSelector from './InvestorSelector';

const validationSchema = Yup.object({
  investors: Yup.array().of(
    Yup.object({
      name: Yup.string().required('Le nom est requis'),
      investedAmount: Yup.number()
        .required('Le montant investi est requis')
        .positive('Le montant doit être positif'),
      initialBalance: Yup.number()
        .required('Le solde initial est requis')
        .min(0, 'Le solde ne peut pas être négatif'),
    })
  ),
});

interface InvestorFormValues {
  name: string;
  investedAmount: number;
  initialBalance: number;
  globalInvestorId?: string;
  history: {
    sansoInterests: [];
    targetFundDistributions: [];
  };
}

interface AddInvestorsFormValues {
  investors: InvestorFormValues[];
}

const AddInvestors: React.FC = () => {
  const { currentStrategy, addInvestorsToStrategy } = useStrategy();
  const { investors: globalInvestors, addInvestor } = useGlobalInvestor();
  const [numInvestors, setNumInvestors] = useState(10);
  const [useExistingInvestors, setUseExistingInvestors] = useState(true);
  const [newInvestorsPercentage, setNewInvestorsPercentage] = useState(30); // 30% de nouveaux investisseurs par défaut
  const [tabValue, setTabValue] = useState(0);

  const initialValues: AddInvestorsFormValues = {
    investors: [{ name: '', investedAmount: 0, initialBalance: 0, history: { sansoInterests: [], targetFundDistributions: [] } }],
  };

  const handleSubmit = (values: AddInvestorsFormValues) => {
    if (currentStrategy) {
      addInvestorsToStrategy(currentStrategy.id, values.investors);
    }
  };

  const generateRandomInvestors = () => {
    if (!currentStrategy) return;

    const investors: InvestorFormValues[] = [];
    
    // Déterminer combien d'investisseurs existants et nouveaux à utiliser
    let numExistingToUse = 0;
    let numNewToCreate = numInvestors;
    
    if (useExistingInvestors && globalInvestors.length > 0) {
      // Calculer combien d'investisseurs existants utiliser (70% par défaut)
      numExistingToUse = Math.min(
        Math.floor(numInvestors * (1 - newInvestorsPercentage / 100)),
        globalInvestors.length
      );
      numNewToCreate = numInvestors - numExistingToUse;
    }
    
    // Utiliser des investisseurs existants
    if (numExistingToUse > 0) {
      // Mélanger la liste des investisseurs globaux et en prendre un sous-ensemble
      const shuffledInvestors = [...globalInvestors].sort(() => 0.5 - Math.random());
      const selectedInvestors = shuffledInvestors.slice(0, numExistingToUse);
      
      for (const investor of selectedInvestors) {
        // Montant d'investissement entre 100 et 30 000 euros
        const investedAmount = Math.round(100 + Math.random() * 29900);
        // Solde initial entre le montant investi et le montant investi + 50 000 euros
        const initialBalance = investedAmount + Math.round(Math.random() * 50000);
        
        investors.push({
          name: investor.name,
          investedAmount,
          initialBalance,
          globalInvestorId: investor.id, // Référence à l'investisseur global
          history: {
            sansoInterests: [],
            targetFundDistributions: [],
          },
        });
      }
    }
    
    // Créer de nouveaux investisseurs
    if (numNewToCreate > 0) {
      const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Thomas', 'Isabelle', 'Paul', 'Camille', 'Nicolas', 'Julie'];
      const lastNames = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau'];
      
      for (let i = 0; i < numNewToCreate; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const fullName = `${firstName} ${lastName}`;
        
        // Montant d'investissement entre 100 et 30 000 euros
        const investedAmount = Math.round(100 + Math.random() * 29900);
        // Solde initial entre le montant investi et le montant investi + 50 000 euros
        const initialBalance = investedAmount + Math.round(Math.random() * 50000);
        
        investors.push({
          name: fullName,
          investedAmount,
          initialBalance,
          history: {
            sansoInterests: [],
            targetFundDistributions: [],
          },
        });
      }
    }
    
    return investors;
  };

  const handleGenerateInvestors = () => {
    const generatedInvestors = generateRandomInvestors();
    if (generatedInvestors && currentStrategy) {
      addInvestorsToStrategy(currentStrategy.id, generatedInvestors);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!currentStrategy) {
    return (
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6">
          Veuillez d'abord créer une stratégie
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Ajouter des investisseurs à {currentStrategy.name}
      </Typography>
      
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Nouveaux investisseurs" />
        <Tab label="Investisseurs existants" />
      </Tabs>

      {tabValue === 0 ? (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <Typography variant="h6">Génération automatique d'investisseurs</Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField
                label="Nombre d'investisseurs"
                type="number"
                value={numInvestors}
                onChange={(e) => setNumInvestors(Math.min(500, Math.max(1, parseInt(e.target.value) || 1)))}
                inputProps={{ min: 1, max: 500 }}
                sx={{ width: 200 }}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={useExistingInvestors}
                    onChange={(e) => setUseExistingInvestors(e.target.checked)}
                  />
                }
                label="Utiliser des investisseurs existants"
              />
              
              {useExistingInvestors && (
                <TextField
                  label="% de nouveaux investisseurs"
                  type="number"
                  value={newInvestorsPercentage}
                  onChange={(e) => setNewInvestorsPercentage(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  inputProps={{ min: 0, max: 100 }}
                  sx={{ width: 200 }}
                />
              )}
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleGenerateInvestors}
                disabled={!currentStrategy}
              >
                Générer {numInvestors} investisseurs
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {useExistingInvestors 
                ? `Utilisation de ${100 - newInvestorsPercentage}% d'investisseurs existants et ${newInvestorsPercentage}% de nouveaux investisseurs.`
                : "Création uniquement de nouveaux investisseurs."}
            </Typography>
          </Box>
        </Box>
      ) : (
        <InvestorSelector 
          onInvestorsSelected={(selectedInvestors) => {
            if (currentStrategy && selectedInvestors.length > 0) {
              addInvestorsToStrategy(currentStrategy.id, selectedInvestors);
            }
          }} 
        />
      )}
      
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h6" gutterBottom>
        Ajouter des investisseurs manuellement
      </Typography>
      
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue }) => (
          <Form>
            <FieldArray name="investors">
              {({ remove, push }) => (
                <>
                  {values.investors.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ flex: '4 1 0' }}>
                        <Typography variant="subtitle2">Nom</Typography>
                      </Box>
                      <Box sx={{ flex: '3 1 0' }}>
                        <Typography variant="subtitle2">Solde initial (€)</Typography>
                      </Box>
                      <Box sx={{ flex: '3 1 0' }}>
                        <Typography variant="subtitle2">Montant investi (€)</Typography>
                      </Box>
                      <Box sx={{ flex: '1 1 0' }}></Box>
                    </Box>
                  )}
                  
                  {values.investors.map((_, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Box sx={{ flex: '4 1 0' }}>
                        <Field name={`investors.${index}.name`}>
                          {({ field, meta }: FieldProps) => (
                            <TextField
                              {...field}
                              fullWidth
                              label="Nom de l'investisseur"
                              error={!!(meta.touched && meta.error)}
                              helperText={meta.touched && meta.error ? meta.error : ''}
                            />
                          )}
                        </Field>
                      </Box>
                      
                      <Box sx={{ flex: '3 1 0' }}>
                        <Field name={`investors.${index}.initialBalance`}>
                          {({ field, meta }: FieldProps) => (
                            <TextField
                              {...field}
                              fullWidth
                              type="number"
                              label="Solde initial"
                              InputProps={{
                                endAdornment: <InputAdornment position="end">€</InputAdornment>,
                              }}
                              error={!!(meta.touched && meta.error)}
                              helperText={meta.touched && meta.error ? meta.error : ''}
                            />
                          )}
                        </Field>
                      </Box>
                      
                      <Box sx={{ flex: '3 1 0' }}>
                        <Field name={`investors.${index}.investedAmount`}>
                          {({ field, meta }: FieldProps) => (
                            <TextField
                              {...field}
                              fullWidth
                              type="number"
                              label="Montant investi"
                              InputProps={{
                                endAdornment: <InputAdornment position="end">€</InputAdornment>,
                              }}
                              error={!!(meta.touched && meta.error)}
                              helperText={meta.touched && meta.error ? meta.error : ''}
                            />
                          )}
                        </Field>
                      </Box>
                      
                      <Box sx={{ flex: '1 1 0', display: 'flex', alignItems: 'center' }}>
                        <IconButton
                          onClick={() => remove(index)}
                          disabled={values.investors.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  ))}
                  
                  <Box sx={{ mt: 2, mb: 4 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={() => push({ name: '', investedAmount: 0, initialBalance: 0, history: { sansoInterests: [], targetFundDistributions: [] } })}
                    >
                      Ajouter un investisseur
                    </Button>
                  </Box>
                </>
              )}
            </FieldArray>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                Enregistrer les investisseurs
              </Button>
            </Box>
          </Form>
        )}
      </Formik>
    </Paper>
  );
};

export default AddInvestors;
