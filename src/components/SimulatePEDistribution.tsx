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
import { PEDistribution } from '../types/models';

const validationSchema = Yup.object({
  multiple: Yup.number()
    .required('Le multiple est requis')
    .positive('Le multiple doit être positif'),
  distributionDate: Yup.date().required('La date de distribution est requise'),
});

const SimulatePEDistribution: React.FC = () => {
  const { currentStrategy, simulatePEDistribution } = useStrategy();

  if (!currentStrategy || currentStrategy.investors.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6">
          Veuillez d'abord créer une stratégie et ajouter des investisseurs
        </Typography>
      </Paper>
    );
  }

  const initialValues: PEDistribution = {
    multiple: 3.4, // Default value from the use case
    distributionDate: new Date(),
  };

  const handleSubmit = (values: PEDistribution) => {
    if (currentStrategy) {
      simulatePEDistribution(currentStrategy.id, values);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Simulation d'une distribution PE
        </Typography>
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <Field name="multiple">
                      {({ field, meta }: FieldProps) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          label="Multiple appliqué"
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                          error={!!(meta.touched && meta.error)}
                          helperText={meta.touched && meta.error ? meta.error : ''}
                        />
                      )}
                    </Field>
                  </Box>
                  
                  <Box sx={{ flex: '1 1 45%', minWidth: '250px' }}>
                    <DatePicker
                      label="Date de distribution"
                      value={values.distributionDate}
                      onChange={(newValue) => {
                        setFieldValue('distributionDate', newValue);
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!(touched.distributionDate && errors.distributionDate),
                          helperText: touched.distributionDate && errors.distributionDate ? String(errors.distributionDate) : undefined,
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
                      Impact sur les investisseurs
                    </Typography>
                    <Typography variant="body1">
                      Chaque investisseur recevra {values.multiple}% de son montant investi en distribution depuis le fonds cible.
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    size="large"
                  >
                    Simuler la distribution PE
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

export default SimulatePEDistribution;
