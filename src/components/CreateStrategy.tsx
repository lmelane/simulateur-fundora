import React, { useState } from 'react';
import { useStrategy } from '../context/StrategyContext';
import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  Paper,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';

// Interface pour les valeurs du formulaire
interface CreateStrategyFormValues {
  name: string;
  netTargetAllocation: number; // Allocation nette cible (montant réellement investi)
  targetFundPercentage: number;
  startDate: Date;
  investmentHorizon: Date;
}

// Schéma de validation
const validationSchema = Yup.object({
  name: Yup.string().required('Le nom est requis'),
  netTargetAllocation: Yup.number()
    .required('L\'allocation nette cible est requise')
    .min(1, 'L\'allocation doit être positive'),
  targetFundPercentage: Yup.number()
    .required('Le pourcentage est requis')
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

const CreateStrategy: React.FC = () => {
  const { createStrategy, addInvestorsToStrategy, setCurrentStrategy } = useStrategy();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const initialValues: CreateStrategyFormValues = {
    name: '',
    netTargetAllocation: 100000, // Valeur par défaut pour l'allocation nette cible
    targetFundPercentage: 20, // Modifié de 80% à 20%
    startDate: new Date(),
    investmentHorizon: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
  };

  const handleSubmit = (values: CreateStrategyFormValues) => {
    // Réinitialiser les messages d'erreur et de succès
    setError(null);
    setSuccess(false);
    
    const bondFundPercentage = 100 - values.targetFundPercentage;
    
    // Calculer la durée en années entre la date de début et l'horizon d'investissement
    const startDate = new Date(values.startDate);
    const endDate = new Date(values.investmentHorizon);
    const durationInYears = Math.max((endDate.getFullYear() - startDate.getFullYear()), 1); // Minimum 1 an
    
    // Calculer le montant indicatif à lever (allocation × 1,2)
    const indicativeAmount = parseFloat((values.netTargetAllocation * 1.2).toFixed(2));

    // Créer la stratégie avec les nouveaux champs
    const strategy = createStrategy({
      ...values,
      bondFundPercentage,
      initialCallPercentage: values.targetFundPercentage, // Utiliser le même pourcentage
      totalAllocation: values.netTargetAllocation, // Conserver la compatibilité avec l'interface existante
      netTargetAllocation: values.netTargetAllocation,
      durationInYears: durationInYears,
      indicativeAmount: indicativeAmount,
      totalRaisedAmount: 0, // Initialisé à 0
      totalNetInvestedAmount: 0, // Initialisé à 0
      remainingToInvest: values.netTargetAllocation, // Initialisé à l'allocation nette cible
      status: 'open', // Statut initial : ouvert
    });
    
    console.log("CreateStrategy - Stratégie créée:", strategy);

    // Générer automatiquement des investisseurs pour la stratégie
    if (strategy) {
      try {
        // Nous générons moins d'investisseurs pour mieux contrôler le montant total
        const numInvestors = 5 + Math.floor(Math.random() * 6); // Entre 5 et 10 investisseurs
        const investors = generateRandomInvestors(numInvestors, values.netTargetAllocation);

        console.log("CreateStrategy - Investisseurs générés:", investors);
        console.log("CreateStrategy - Nombre d'investisseurs générés:", investors.length);
        console.log("CreateStrategy - Premier investisseur généré:", investors[0]);

        // Attendre un court instant pour s'assurer que la stratégie est bien sauvegardée
        setTimeout(() => {
          // Ajouter les investisseurs à la stratégie
          const updatedStrategy = addInvestorsToStrategy(strategy.id, investors);
          
          if (updatedStrategy) {
            console.log("CreateStrategy - Stratégie mise à jour après ajout des investisseurs:", updatedStrategy);
            console.log("CreateStrategy - Nombre d'investisseurs dans la stratégie mise à jour:", updatedStrategy.investors.length);
            console.log("CreateStrategy - Stratégie avec investisseurs créée avec succès");
            
            // Mettre à jour explicitement la stratégie courante
            setCurrentStrategy(updatedStrategy);
            setSuccess(true);
          } else {
            // Vérifier si l'erreur est liée aux contraintes de montant
            const totalInvestment = investors.reduce((sum, inv) => sum + (inv.initialBalance || 0), 0);
            const percentageOfTarget = (totalInvestment / indicativeAmount) * 100;
            
            if (percentageOfTarget > 130) {
              setError(`Le montant total levé (${totalInvestment.toLocaleString('fr-FR')} €) dépasse 130% du montant théorique à lever (${indicativeAmount.toLocaleString('fr-FR')} €)`);
            } else if (percentageOfTarget < 100) {
              setError(`Le montant total levé (${totalInvestment.toLocaleString('fr-FR')} €) est inférieur à 100% du montant théorique à lever (${indicativeAmount.toLocaleString('fr-FR')} €)`);
            } else {
              setError("Échec de la mise à jour de la stratégie avec les investisseurs");
            }
          }
        }, 500); // Attendre 500ms
      } catch (error) {
        setError("Erreur lors de l'ajout des investisseurs");
      }
    }
  };

  // Fonction pour générer des investisseurs aléatoires
  const generateRandomInvestors = (count: number, netTargetAllocation: number) => {
    // Calculer le montant indicatif à lever pour la stratégie actuelle
    const indicativeAmount = parseFloat((netTargetAllocation * 1.2).toFixed(2));
    
    // Calculer le montant cible pour les investisseurs
    // Nous visons un pourcentage fixe de 110% pour garantir le respect des contraintes
    const targetPercentage = 110; // Exactement 110%
    const targetTotalAmount = (indicativeAmount * targetPercentage) / 100;
    
    // Comme nous utilisons 70% du solde initial comme montant d'engagement (commitAmount),
    // nous devons calculer le montant total initial nécessaire pour que le commitAmount
    // (70% du montant initial) respecte les contraintes
    const targetCommitAmount = targetTotalAmount; // C'est le montant d'engagement cible
    const targetInitialAmount = targetCommitAmount / 0.7; // Montant initial nécessaire
    
    // Calculer le montant moyen par investisseur pour atteindre le montant cible
    const averageAmount = targetInitialAmount / count;
    
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

    // Garder une trace des noms déjà utilisés pour éviter les doublons
    const usedNames = new Set();
    
    // Garder une trace du montant total déjà alloué
    let totalAllocated = 0;

    for (let i = 0; i < count; i++) {
      let firstName, lastName, fullName;
      
      // Générer un nom unique
      do {
        firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        fullName = `${firstName} ${lastName}`;
      } while (usedNames.has(fullName));
      
      // Ajouter le nom à la liste des noms utilisés
      usedNames.add(fullName);

      // Calculer le montant pour cet investisseur
      let initialBalance;
      
      if (i === count - 1) {
        // Pour le dernier investisseur, ajuster le montant pour atteindre exactement le montant cible
        initialBalance = Math.max(30000, Math.round(targetInitialAmount - totalAllocated));
      } else {
        // Variation aléatoire autour de la moyenne (±20%)
        const variation = 0.8 + Math.random() * 0.4; // Entre 80% et 120% de la moyenne
        initialBalance = Math.round(averageAmount * variation);
        
        // S'assurer que le montant est au moins de 30 000 € (minimum pour un investisseur)
        initialBalance = Math.max(30000, initialBalance);
      }
      
      // Mettre à jour le montant total alloué
      totalAllocated += initialBalance;
      
      // Nous ne définissons que les propriétés attendues par addInvestorsToStrategy
      // Les autres propriétés (wallets, transactions, history, etc.) seront générées par addInvestorsToStrategy
      investors.push({
        name: fullName,
        initialBalance
      });
    }
    
    console.log(`CreateStrategy - Montant total alloué: ${totalAllocated.toLocaleString('fr-FR')} € (${((totalAllocated / indicativeAmount) * 100).toFixed(2)}% du montant indicatif)`);
    console.log(`CreateStrategy - Montant d'engagement estimé (70%): ${(totalAllocated * 0.7).toLocaleString('fr-FR')} € (${(((totalAllocated * 0.7) / indicativeAmount) * 100).toFixed(2)}% du montant indicatif)`);
    
    return investors;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Créer une nouvelle stratégie
        </Typography>

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography variant="body2" color="success" sx={{ mb: 2 }}>
            Stratégie créée avec succès
          </Typography>
        )}

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
                    <Field name="netTargetAllocation">
                      {({ field, meta }: FieldProps) => (
                        <TextField
                          {...field}
                          label="Allocation nette cible (€)"
                          type="number"
                          fullWidth
                          error={meta.touched && !!meta.error}
                          helperText={meta.touched ? meta.error : "Montant réellement investi dans la stratégie"}
                          InputProps={{
                            endAdornment: <Typography variant="body2" color="text.secondary">€</Typography>
                          }}
                        />
                      )}
                    </Field>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <Field name="targetFundPercentage">
                      {({ field, meta }: FieldProps) => (
                        <TextField
                          {...field}
                          label="Pourcentage fonds cible (%)"
                          type="number"
                          fullWidth
                          error={meta.touched && !!meta.error}
                          helperText={meta.touched ? meta.error : "Pourcentage alloué au fonds cible (le reste va au fonds obligataire)"}
                          InputProps={{
                            endAdornment: <Typography variant="body2" color="text.secondary">%</Typography>
                          }}
                        />
                      )}
                    </Field>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <Field name="startDate">
                      {({ field, meta }: FieldProps) => (
                        <DatePicker
                          label="Date de début"
                          value={field.value}
                          onChange={(date) => setFieldValue('startDate', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: meta.touched && !!meta.error,
                              helperText: meta.touched && meta.error,
                            },
                          }}
                        />
                      )}
                    </Field>
                  </Box>
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <Field name="investmentHorizon">
                      {({ field, meta }: FieldProps) => (
                        <DatePicker
                          label="Horizon d'investissement"
                          value={field.value}
                          onChange={(date) => setFieldValue('investmentHorizon', date)}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              error: meta.touched && !!meta.error,
                              helperText: meta.touched && meta.error,
                            },
                          }}
                        />
                      )}
                    </Field>
                  </Box>
                </Box>

                {/* Afficher le montant indicatif à lever */}
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Résumé de la stratégie
                  </Typography>
                  <Typography variant="body2">
                    Allocation nette cible: <strong>{values.netTargetAllocation.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Montant indicatif à lever: <strong>{(values.netTargetAllocation * 1.2).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Durée de la stratégie: <strong>{Math.max(new Date(values.investmentHorizon).getFullYear() - new Date(values.startDate).getFullYear(), 1)} ans</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Le montant indicatif à lever est une estimation basée sur l'allocation nette cible. La sursouscription est autorisée.
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                >
                  Créer la stratégie
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
