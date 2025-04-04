import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid
} from '@mui/material';
import { Formik, Form, Field, FieldProps } from 'formik';
import * as Yup from 'yup';
import { useGlobalInvestor } from '../context/GlobalInvestorContext';
import { useStrategy } from '../context/StrategyContext';
import { GlobalInvestor, Strategy } from '../types/models';

interface GlobalInvestorFormValues {
  name: string;
  email: string;
  phone: string;
}

interface InvestmentFormValues {
  strategyId: string;
  investedAmount: number;
}

const validationSchema = Yup.object({
  name: Yup.string().required('Le nom est requis'),
  email: Yup.string().email('Email invalide').required('L\'email est requis'),
  phone: Yup.string(),
});

const investmentValidationSchema = Yup.object({
  strategyId: Yup.string().required('La stratégie est requise'),
  investedAmount: Yup.number()
    .required('Le montant est requis')
    .positive('Le montant doit être positif'),
});

const GlobalInvestors: React.FC = () => {
  const { investors, addInvestor, getInvestorInvestments } = useGlobalInvestor();
  const { strategies } = useStrategy();
  const [selectedInvestor, setSelectedInvestor] = useState<GlobalInvestor | null>(null);
  const [investmentDialogOpen, setInvestmentDialogOpen] = useState(false);

  const initialValues: GlobalInvestorFormValues = {
    name: '',
    email: '',
    phone: '',
  };

  const initialInvestmentValues: InvestmentFormValues = {
    strategyId: '',
    investedAmount: 0,
  };

  const handleSubmit = (values: GlobalInvestorFormValues, { resetForm }: any) => {
    addInvestor(values);
    resetForm();
  };

  const handleAddInvestment = (investorId: string) => {
    const investor = investors.find(inv => inv.id === investorId);
    if (investor) {
      setSelectedInvestor(investor);
      setInvestmentDialogOpen(true);
    }
  };

  const handleInvestmentSubmit = (values: InvestmentFormValues, { resetForm }: any) => {
    if (selectedInvestor) {
      const strategy = strategies.find(s => s.id === values.strategyId);
      if (strategy) {
        // Ici, nous devrions appeler une fonction pour ajouter l'investissement
        // à l'investisseur et à la stratégie, mais pour l'instant nous fermons juste le dialogue
        setInvestmentDialogOpen(false);
        resetForm();
      }
    }
  };

  // Fonction pour formater les montants en euros
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Gestion des Investisseurs Globaux
        </Typography>
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Field name="name">
                  {({ field }: FieldProps) => (
                    <TextField
                      {...field}
                      label="Nom de l'investisseur"
                      fullWidth
                      error={touched.name && !!errors.name}
                      helperText={touched.name && errors.name}
                    />
                  )}
                </Field>
                
                <Field name="email">
                  {({ field }: FieldProps) => (
                    <TextField
                      {...field}
                      label="Email"
                      fullWidth
                      error={touched.email && !!errors.email}
                      helperText={touched.email && errors.email}
                    />
                  )}
                </Field>
                
                <Field name="phone">
                  {({ field }: FieldProps) => (
                    <TextField
                      {...field}
                      label="Téléphone"
                      fullWidth
                      error={touched.phone && !!errors.phone}
                      helperText={touched.phone && errors.phone}
                    />
                  )}
                </Field>
              </Box>
              
              <Button type="submit" variant="contained" color="primary">
                Ajouter l'investisseur
              </Button>
            </Form>
          )}
        </Formik>
      </Paper>
      
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Liste des Investisseurs
        </Typography>
        
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nom</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Téléphone</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre de Stratégies</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {investors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucun investisseur enregistré
                </TableCell>
              </TableRow>
            ) : (
              investors.map((investor) => (
                <TableRow key={investor.id}>
                  <TableCell>{investor.name}</TableCell>
                  <TableCell>{investor.email}</TableCell>
                  <TableCell>{investor.phone || '-'}</TableCell>
                  <TableCell>{investor.investments.length}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      size="small"
                      onClick={() => handleAddInvestment(investor.id)}
                    >
                      Ajouter Investissement
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
      
      {/* Dialogue pour ajouter un investissement */}
      <Dialog open={investmentDialogOpen} onClose={() => setInvestmentDialogOpen(false)}>
        <DialogTitle>
          Ajouter un investissement pour {selectedInvestor?.name}
        </DialogTitle>
        <Formik
          initialValues={initialInvestmentValues}
          validationSchema={investmentValidationSchema}
          onSubmit={handleInvestmentSubmit}
        >
          {({ errors, touched }) => (
            <Form>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: '400px' }}>
                  <Field name="strategyId">
                    {({ field }: FieldProps) => (
                      <FormControl fullWidth error={touched.strategyId && !!errors.strategyId}>
                        <InputLabel>Stratégie</InputLabel>
                        <Select {...field} label="Stratégie">
                          {strategies.map((strategy) => (
                            <MenuItem key={strategy.id} value={strategy.id}>
                              {strategy.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {touched.strategyId && errors.strategyId && (
                          <Typography color="error" variant="caption">
                            {errors.strategyId}
                          </Typography>
                        )}
                      </FormControl>
                    )}
                  </Field>
                  
                  <Field name="investedAmount">
                    {({ field }: FieldProps) => (
                      <TextField
                        {...field}
                        label="Montant à investir"
                        type="number"
                        fullWidth
                        error={touched.investedAmount && !!errors.investedAmount}
                        helperText={touched.investedAmount && errors.investedAmount}
                      />
                    )}
                  </Field>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setInvestmentDialogOpen(false)}>Annuler</Button>
                <Button type="submit" variant="contained" color="primary">
                  Ajouter
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </Box>
  );
};

export default GlobalInvestors;
