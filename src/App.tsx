import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import { StrategyProvider } from './context/StrategyContext';
import { GlobalInvestorProvider } from './context/GlobalInvestorContext';
import CreateStrategy from './components/CreateStrategy';
import SimulateSansoInterest from './components/SimulateSansoInterest';
import SimulatePEDistribution from './components/SimulatePEDistribution';
import CapTable from './components/CapTable';
import InvestorFinancialHistory from './components/InvestorFinancialHistory';
import StrategyFinancialSummary from './components/StrategyFinancialSummary';
import StrategySelector from './components/StrategySelector';
import NewFundCall from './components/NewFundCall';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <StrategyProvider>
        <GlobalInvestorProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ flexGrow: 1 }}>
              <AppBar position="static">
                <Toolbar>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    Fundora - Simulation de Stratégie
                  </Typography>
                </Toolbar>
              </AppBar>
              
              <Container maxWidth="lg" sx={{ mt: 4 }}>
                <StrategySelector />
                
                <Paper sx={{ mb: 4 }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    indicatorColor="primary"
                    textColor="primary"
                  >
                    <Tab label="Créer une stratégie" />
                    <Tab label="Appel de fonds" />
                    <Tab label="Simuler coupon SANSO" />
                    <Tab label="Simuler distribution PE" />
                    <Tab label="Cap Table" />
                    <Tab label="Historique financier" />
                    <Tab label="Résumé financier stratégie" />
                  </Tabs>
                </Paper>
                
                <TabPanel value={tabValue} index={0}>
                  <CreateStrategy />
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                  <NewFundCall />
                </TabPanel>
                
                <TabPanel value={tabValue} index={2}>
                  <SimulateSansoInterest />
                </TabPanel>
                
                <TabPanel value={tabValue} index={3}>
                  <SimulatePEDistribution />
                </TabPanel>
                
                <TabPanel value={tabValue} index={4}>
                  <CapTable />
                </TabPanel>
                
                <TabPanel value={tabValue} index={5}>
                  <InvestorFinancialHistory />
                </TabPanel>
                
                <TabPanel value={tabValue} index={6}>
                  <StrategyFinancialSummary />
                </TabPanel>
              </Container>
            </Box>
          </ThemeProvider>
        </GlobalInvestorProvider>
      </StrategyProvider>
    </LocalizationProvider>
  );
}

export default App;
