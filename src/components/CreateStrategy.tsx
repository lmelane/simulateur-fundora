import React from 'react';
import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { useStrategy } from '../context/StrategyContext';

const validationSchema = Yup.object({
  name: Yup.string().required('Le nom de la stratégie est requis'),
  totalAllocation: Yup.number()
    .required('L\'allocation totale est requise')
    .positive('L\'allocation doit être positive'),
  targetFundPercentage: Yup.number()
    .required('Le pourcentage de l\'appel de fonds initial est requis')
    .min(0, 'Le pourcentage doit être entre 0 et 100')
    .max(100, 'Le pourcentage doit être entre 0 et 100'),
  startDate: Yup.date().required('La date de début est requise'),
  investmentHorizon: Yup.date()
    .required('L\'horizon d\'investissement est requis')
    .min(
      Yup.ref('startDate'),
      'L\'horizon d\'investissement doit être après la date de début'
    ),
});

interface CreateStrategyFormValues {
  name: string;
  totalAllocation: number;
  targetFundPercentage: number;
  startDate: Date;
  investmentHorizon: Date;
}

const CreateStrategy: React.FC = () => {
  const { createStrategy, addInvestorsToStrategy } = useStrategy();

  const initialValues: CreateStrategyFormValues = {
    name: '',
    totalAllocation: 1000000,
    targetFundPercentage: 80,
    startDate: new Date(),
    investmentHorizon: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
  };

  const handleSubmit = (values: CreateStrategyFormValues) => {
    const bondFundPercentage = 100 - values.targetFundPercentage;

    // Créer la stratégie
    const strategy = createStrategy({
      ...values,
      bondFundPercentage,
      initialCallPercentage: values.targetFundPercentage, // Utiliser le même pourcentage
    }) as any; // Corriger la référence au type de retour de la fonction createStrategy

    console.log("CreateStrategy - Stratégie créée:", strategy);

    // Générer automatiquement des investisseurs pour la stratégie
    if (strategy) {
      // Générer entre 10 et 20 investisseurs aléatoires
      const numInvestors = 10 + Math.floor(Math.random() * 11);
      const investors = generateRandomInvestors(numInvestors);

      console.log("CreateStrategy - Investisseurs générés:", investors);

      // Ajouter les investisseurs à la stratégie
      addInvestorsToStrategy(strategy.id, investors);
      
      // Vérifier si l'onglet Cap Table doit être sélectionné automatiquement
      console.log("CreateStrategy - Stratégie avec investisseurs créée avec succès");
    }
  };

  // Fonction pour générer des investisseurs aléatoires
  const generateRandomInvestors = (count: number) => {
    const investors = [];
    
    const firstNames = [
      'Jean', 'Marie', 'Pierre', 'Sophie', 'Thomas', 'Isabelle', 'Paul', 
      'Camille', 'Nicolas', 'Julie', 'François', 'Anne', 'Michel', 'Claire',
      'Philippe', 'Nathalie', 'David', 'Céline', 'Éric', 'Sylvie'
    ];
    
    const lastNames = [
      'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit',
      'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel',
      'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'
    ];

    for (let i = 0; i < count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const fullName = `${firstName} ${lastName}`;

      // Montant d'investissement entre 100 et 30 000 euros
      const investedAmount = Math.round(100 + Math.random() * 29900);

      investors.push({
        name: fullName,
        investedAmount,
        // Ces propriétés seront calculées par addInvestorsToStrategy
        // mais nous devons les initialiser pour TypeScript
        wallets: {
          investor: 0,
          spv: 0,
          sanso: 0,
          fundora: 0
        },
        transactions: {
          sansoInterest: 0,
          targetFundDistribution: 0
        },
        history: {
          sansoInterests: [],
          targetFundDistributions: [],
        }
      });
    }

    return investors;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Créer une nouvelle stratégie
        </Typography>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Box>
                  <Field name="name">
                    {({ field, meta }: FieldProps) => (
                      <TextField
                        {...field}
                        label="Nom de la stratégie"
                        fullWidth
                        error={meta.touched && !!meta.error}
                        helperText={meta.touched && meta.error}
                      />
                    )}
                  </Field>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <Field name="totalAllocation">
                      {({ field, meta }: FieldProps) => (
                        <TextField
                          {...field}
                          label="Allocation totale (€)"
                          type="number"
                          fullWidth
                          InputProps={{
                            endAdornment: <InputAdornment position="end">€</InputAdornment>,
                          }}
                          error={meta.touched && !!meta.error}
                          helperText={meta.touched && meta.error}
                        />
                      )}
                    </Field>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Répartition des fonds
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Le pourcentage de l'appel de fonds initial détermine la répartition initiale des fonds.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <Field name="targetFundPercentage">
                      {({ field, meta }: FieldProps) => (
                        <TextField
                          {...field}
                          label="Appel de fonds initial (%)"
                          type="number"
                          fullWidth
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          error={meta.touched && !!meta.error}
                          helperText={meta.touched && meta.error}
                        />
                      )}
                    </Field>
                  </Box>

                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <TextField
                      fullWidth
                      label="Pourcentage du fonds obligataire (%)"
                      value={100 - values.targetFundPercentage}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                        readOnly: true,
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <DatePicker
                      label="Date de début"
                      value={values.startDate}
                      onChange={(date) => {
                        if (date) {
                          setFieldValue('startDate', date);
                        }
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: touched.startDate && !!errors.startDate,
                          helperText: touched.startDate && errors.startDate ? String(errors.startDate) : undefined,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <DatePicker
                      label="Horizon d'investissement"
                      value={values.investmentHorizon}
                      onChange={(date) => {
                        if (date) {
                          setFieldValue('investmentHorizon', date);
                        }
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: touched.investmentHorizon && !!errors.investmentHorizon,
                          helperText: touched.investmentHorizon && errors.investmentHorizon ? String(errors.investmentHorizon) : undefined,
                        },
                      }}
                    />
                  </Box>
                </Box>

                <Button type="submit" variant="contained" color="primary">
                  Créer la stratégie avec investisseurs
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Paper>
    </LocalizationProvider>
  );
};

export default CreateStrategy;
