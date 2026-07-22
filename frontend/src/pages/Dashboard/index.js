import React, { useContext, useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useTheme } from "@material-ui/core/styles";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
  Tab,
  Tabs,
  Tooltip,
  Divider
} from "@mui/material";
import {
  Message as MessageIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Timeline as TimelineIcon,
  FilterList as FilterListIcon,
  SaveAlt as SaveAltIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon
} from "@mui/icons-material";
import { grey, blue, green, orange, red } from "@material-ui/core/colors";
import * as XLSX from 'xlsx';
import moment from "moment";
import { toast } from "react-toastify";

import { AuthContext } from "../../context/Auth/AuthContext";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import useDashboard from "../../hooks/useDashboard";
import { ChatsUser } from "./ChartsUser";
import ChartDonut from "./ChartDonut";
import { ChartsDate } from "./ChartsDate";
import Filters from "./Filters";
import { i18n } from "../../translate/i18n";
import ForbiddenPage from "../../components/ForbiddenPage";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.mode === 'dark' ? '#151718' : theme.palette.background.default,
    minHeight: '100vh'
  },
  container: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3)
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 16,
    backgroundColor: theme.palette.mode === 'dark' ? '#1E2021' : theme.palette.background.paper,
    border: theme.palette.mode === 'dark' ? '1px solid #2D3133' : 'none',
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: theme.palette.mode === 'dark' ? '0 8px 16px rgba(0,0,0,0.4)' : theme.shadows[4]
    }
  },
  cardMetric: {
    padding: theme.spacing(3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.palette.text.primary
  },
  metricLabel: {
    fontSize: '0.875rem',
    color: theme.palette.mode === 'dark' ? '#B0B3B8' : theme.palette.text.secondary,
    marginTop: theme.spacing(1)
  },
  iconWrapperInAttendance: {
    padding: theme.spacing(2),
    borderRadius: '50%',
    backgroundColor: '#01a19a20'
  },
  iconWrapperWaiting: {
    padding: theme.spacing(2),
    borderRadius: '50%',
    backgroundColor: '#ff980020'
  },
  iconWrapperFinished: {
    padding: theme.spacing(2),
    borderRadius: '50%',
    backgroundColor: '#4caf5020'
  },
  iconWrapperGroups: {
    padding: theme.spacing(2),
    borderRadius: '50%',
    backgroundColor: '#9c27b020'
  },
  iconWrapperAttendants: {
    padding: theme.spacing(2),
    borderRadius: '50%',
    backgroundColor: '#2196f320'
  },
  iconWrapperContacts: {
    padding: theme.spacing(2),
    borderRadius: '50%',
    backgroundColor: '#e91e6320'
  },
  iconWrapperMessages: {
    padding: theme.spacing(2),
    borderRadius: '50%',
    backgroundColor: '#00968820'
  },
  iconWrapperTime: {
    padding: theme.spacing(2),
    borderRadius: '50%',
    backgroundColor: '#f4433620'
  },
  iconInAttendance: {
    color: '#01a19a !important'
  },
  iconWaiting: {
    color: '#ff9800 !important'
  },
  iconFinished: {
    color: '#4caf50 !important'
  },
  iconGroups: {
    color: '#9c27b0 !important'
  },
  iconAttendants: {
    color: '#2196f3 !important'
  },
  iconContacts: {
    color: '#e91e63 !important'
  },
  iconMessages: {
    color: '#009688 !important'
  },
  iconTime: {
    color: '#f44336 !important'
  },
  chartCard: {
    height: 400,
    marginTop: theme.spacing(3),
    borderRadius: 16,
    backgroundColor: theme.palette.mode === 'dark' ? '#1E2021' : theme.palette.background.paper,
    border: theme.palette.mode === 'dark' ? '1px solid #2D3133' : 'none',
    '& .MuiTypography-root': {
      color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.palette.text.primary
    }
  },
  tableCard: {
    marginTop: theme.spacing(3),
    borderRadius: 16,
    backgroundColor: theme.palette.mode === 'dark' ? '#1E2021' : theme.palette.background.paper,
    border: theme.palette.mode === 'dark' ? '1px solid #2D3133' : 'none',
    '& .MuiTypography-root': {
      color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.palette.text.primary
    }
  },
  filterBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(3),
    '& .MuiTypography-root': {
      color: theme.palette.mode === 'dark' ? '#FFFFFF' : theme.palette.text.primary
    }
  },
  tabs: {
    marginBottom: theme.spacing(3),
    '& .MuiTab-root': {
      minWidth: 'auto',
      padding: theme.spacing(1, 2),
      borderRadius: 8,
      marginRight: theme.spacing(1),
      color: theme.palette.mode === 'dark' ? '#B0B3B8' : theme.palette.text.primary,
      '&.Mui-selected': {
        backgroundColor: '#01a19a',
        color: '#fff'
      }
    }
  },
  filterButton: {
    backgroundColor: '#01a19a',
    color: '#fff',
    borderRadius: '50%',
    padding: theme.spacing(1),
    '&:hover': {
      backgroundColor: '#018c86'
    }
  }
}));

const Dashboard = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const [tab, setTab] = useState("metricas");
  const [counters, setCounters] = useState({});
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filterType, setFilterType] = useState(1);
  const [period, setPeriod] = useState(0);
  const [dateFrom, setDateFrom] = useState(moment().startOf('month').format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
  const { find } = useDashboard();

  useEffect(() => {
    async function firstLoad() {
      await fetchData();
    }
      firstLoad();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { counters: dashCounters } = await find({
        filterType,
        period,
        dateFrom,
        dateTo
      });
      setCounters(dashCounters);
    } catch (err) {
      toast.error("Erro ao carregar dados do dashboard");
    }
      setLoading(false);
  }

  const handleChangeTab = (event, newValue) => {
    setTab(newValue);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.table_to_sheet(document.getElementById('grid-attendants'));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'RelatorioDeAtendentes');
    XLSX.writeFile(wb, 'relatorio-de-atendentes.xlsx');
  };

  if (user.profile !== "admin") {
    return <ForbiddenPage />;
  }

  return (
    <div className={classes.root}>
      <Container maxWidth="xl" className={classes.container}>
        <Box className={classes.filterBar}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h4" fontWeight="bold">
              Dashboard
            </Typography>
            <IconButton 
              onClick={() => setShowFilter(!showFilter)}
              className={classes.filterButton}
            >
              <FilterListIcon />
            </IconButton>
          </Stack>
          <Tooltip title="Exportar relatório">
            <IconButton className={classes.filterButton}>
              <SaveAltIcon />
            </IconButton>
          </Tooltip>
        </Box>

                  {showFilter && (
          <Paper sx={{ p: 2, mb: 3 }}>
                    <Filters
              filterType={filterType}
              setFilterType={setFilterType}
              period={period}
              setPeriod={setPeriod}
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              onApply={fetchData}
            />
          </Paper>
        )}

                    <Tabs
                      value={tab}
                      onChange={handleChangeTab}
          className={classes.tabs}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab value="metricas" label="Métricas" />
          <Tab value="graficos" label="Gráficos" />
          <Tab value="atendentes" label="Atendentes" />
                    </Tabs>

        {tab === "metricas" && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.inAttendanceCount || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      EM ATENDIMENTO
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperInAttendance}>
                    <MessageIcon className={classes.iconInAttendance} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.waitingTickets || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      AGUARDANDO
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperWaiting}>
                    <AccessTimeIcon className={classes.iconWaiting} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.finishedTicketsCount || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      FINALIZADOS
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperFinished}>
                    <CheckCircleIcon className={classes.iconFinished} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.groupsCount || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      GRUPOS
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperGroups}>
                    <GroupIcon className={classes.iconGroups} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.attendantsOnline || 0}/{counters.attendantsTotal || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      ATENDENTES ATIVOS
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperAttendants}>
                    <GroupIcon className={classes.iconAttendants} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.newContactsCount || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      NOVOS CONTATOS
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperContacts}>
                    <GroupIcon className={classes.iconContacts} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.receivedMessages || 0}/{counters.totalMessages || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      MENSAGENS RECEBIDAS
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperMessages}>
                    <MessageIcon className={classes.iconMessages} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.sentMessages || 0}/{counters.totalMessages || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      MENSAGENS ENVIADAS
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperMessages}>
                    <MessageIcon className={classes.iconMessages} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.avgAttendanceTime || "00h 00m"}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      T.M. DE ATENDIMENTO
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperTime}>
                    <AccessTimeIcon className={classes.iconTime} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.avgWaitTime || "00h 00m"}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      T.M. DE ESPERA
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperTime}>
                    <AccessTimeIcon className={classes.iconTime} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.activeTickets || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      TICKETS ATIVOS
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperInAttendance}>
                    <MessageIcon className={classes.iconInAttendance} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card className={classes.card}>
                <CardContent className={classes.cardMetric}>
                  <div>
                    <Typography className={classes.metricValue}>
                      {counters.inactiveTickets || 0}
                    </Typography>
                    <Typography className={classes.metricLabel}>
                      TICKETS PASSIVOS
                    </Typography>
                  </div>
                  <div className={classes.iconWrapperWaiting}>
                    <MessageIcon className={classes.iconWaiting} />
                  </div>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={8}>
              <Card className={classes.chartCard}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Atendimentos por Período
                  </Typography>
                  <ChartsDate />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card className={classes.chartCard}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distribuição de Status
                  </Typography>
                  <ChartDonut 
                    data={[{ name: 'Status', value: counters.supportHappyCount || 0 }]}
                    title="Atendimentos"
                    value={counters.supportHappyCount || 0}
                    color="#01a19a"
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tab === "graficos" && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card className={classes.chartCard}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Desempenho por Atendente
                            </Typography>
                  <ChatsUser />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {tab === "atendentes" && (
          <Card className={classes.tableCard}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status dos Atendentes
              </Typography>
                            <TableAttendantsStatus
                              loading={loading}
                attendants={counters.attendants || []}
              />
            </CardContent>
          </Card>
        )}
                    </Container>
    </div>
  );
};

export default Dashboard;
