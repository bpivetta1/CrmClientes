import React, { useContext, useState, useEffect } from "react";
import { useTheme, alpha } from "@mui/material/styles";
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  Tab,
  Tabs,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
} from "@mui/material";
import {
  Message as MessageIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
  SaveAlt as SaveAltIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import moment from "moment";
import { toast } from "react-toastify";

import { AuthContext } from "../../context/Auth/AuthContext";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import useDashboard from "../../hooks/useDashboard";
import { ChatsUser } from "./ChartsUser";
import ChartDonut from "./ChartDonut";
import { ChartsDate } from "./ChartsDate";
import ForbiddenPage from "../../components/ForbiddenPage";

// CARD DE MÉTRICA BONITO COM ÍCONES
const MetricCard = ({ icon, title, value, color }) => {
  const theme = useTheme();

  const displayValue =
    value !== null && value !== undefined ? String(value) : "0";

  return (
    <Card
      sx={{
        height: "100%",
        p: 2.5,
        borderRadius: 4,
        boxShadow: "none",
        border: "1px solid",
        borderColor: theme.palette.divider,
        backgroundColor: "background.paper",
        transition: "border-color 0.2s ease-in-out",
        "&:hover": {
          borderColor: color,
        },
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>
          <Typography
            variant="h5"
            component="div"
            fontWeight="bold"
            sx={{ color: "text.primary" }}
          >
            {displayValue}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "uppercase", fontWeight: "bold" }}
          >
            {title}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            minWidth: 48,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(color, 0.1),
          }}
        >
          {React.cloneElement(icon, {
            sx: { color: color, fontSize: "1.5rem" },
          })}
        </Box>
      </Stack>
    </Card>
  );
};

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);

  const [tab, setTab] = useState("metricas");
  const [counters, setCounters] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const [filterType, setFilterType] = useState(1);
  const [period, setPeriod] = useState(0);
  const [dateFrom, setDateFrom] = useState(
    moment().startOf("month").format("YYYY-MM-DD")
  );
  const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));

  const { find } = useDashboard();

  // Função para buscar dados - versão estável
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { filterType, period, dateFrom, dateTo };
      const response = await find(params);
      const dataCounters = response?.counters || response || {};
      setCounters(dataCounters);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
      toast.error("Erro ao carregar dados do dashboard");
      setCounters({});
    } finally {
      setLoading(false);
    }
  };

  // Carregamento inicial
  useEffect(() => {
    fetchData();
  }, []);

  const handleChangeTab = (event, newValue) => setTab(newValue);

  const exportToExcel = () => {
    try {
      const table = document.getElementById("grid-attendants");
      if (table) {
        const ws = XLSX.utils.table_to_sheet(table);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "RelatorioDeAtendentes");
        XLSX.writeFile(wb, "relatorio-de-atendentes.xlsx");
        toast.success("Relatório exportado com sucesso!");
      } else {
        toast.error("Tabela de atendentes não encontrada para exportação.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao exportar o relatório.");
      console.error("Erro na exportação:", error);
    }
  };

  // Função para formatar tempo em segundos
  const formatTimeFromSeconds = (seconds) => {
    if (!seconds || seconds === 0) return "0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (user?.profile !== "admin") return <ForbiddenPage />;

  const colors = {
    teal: "#01a19a",
    orange: "#ff9800",
    green: "#4caf50",
    purple: "#9c27b0",
    blue: "#2196f3",
    pink: "#e91e63",
    red: "#f44336",
  };

  const baseCardStyle = {
    height: "100%",
    borderRadius: 4,
    boxShadow: "none",
    border: "1px solid",
    borderColor: theme.palette.divider,
    backgroundColor: "background.paper",
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      );
    }

    if (tab === "metricas") {
      return (
        <Grid container spacing={3}>
          {/* CARDS DE MÉTRICAS PRINCIPAIS */}
          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Em Atendimento"
              value={counters.supportHappening}
              icon={<MessageIcon />}
              color={colors.teal}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Aguardando"
              value={counters.supportPending}
              icon={<AccessTimeIcon />}
              color={colors.orange}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Finalizados"
              value={counters.supportFinished}
              icon={<CheckCircleIcon />}
              color={colors.green}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Total Tickets"
              value={counters.tickets}
              icon={<MessageIcon />}
              color={colors.purple}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Leads"
              value={counters.leads}
              icon={<GroupIcon />}
              color={colors.blue}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Com Avaliação"
              value={counters.withRating}
              icon={<CheckCircleIcon />}
              color={colors.pink}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Sem Avaliação"
              value={counters.withoutRating}
              icon={<AccessTimeIcon />}
              color={colors.orange}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Aguardando Avaliação"
              value={counters.waitRating}
              icon={<AccessTimeIcon />}
              color={colors.teal}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Tempo Médio Atendimento"
              value={formatTimeFromSeconds(counters.avgSupportTime)}
              icon={<AccessTimeIcon />}
              color={colors.red}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="Tempo Médio Espera"
              value={formatTimeFromSeconds(counters.avgWaitTime)}
              icon={<AccessTimeIcon />}
              color={colors.blue}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="NPS Score"
              value={`${counters.npsScore || 0}%`}
              icon={<CheckCircleIcon />}
              color={colors.green}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <MetricCard
              title="% Satisfação"
              value={`${counters.percRating || 0}%`}
              icon={<CheckCircleIcon />}
              color={colors.purple}
            />
          </Grid>

          {/* GRÁFICOS DE ATENDIMENTOS */}
          <Grid item xs={12} md={8}>
            <Card sx={baseCardStyle}>
              <CardContent sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  📊 Atendimentos por Período
                </Typography>
                <ChartsDate
                  dateFrom={dateFrom}
                  dateTo={dateTo}
                  filterType={filterType}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={baseCardStyle}>
              <CardContent sx={{ p: 3, height: 400 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  🍩 Distribuição de Avaliações
                </Typography>
                <ChartDonut
                  data={[
                    {
                      name: "Com Avaliação",
                      value: parseInt(counters.withRating) || 0,
                    },
                    {
                      name: "Sem Avaliação",
                      value: parseInt(counters.withoutRating) || 0,
                    },
                    {
                      name: "Aguardando",
                      value: parseInt(counters.waitRating) || 0,
                    },
                  ]}
                  title="Avaliações"
                  value={parseInt(counters.withRating) || 0}
                  color={colors.teal}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* BOTÃO PARA RECARREGAR DADOS */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                variant="contained"
                onClick={fetchData}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                sx={{ borderRadius: 99, px: 4 }}
              >
                {loading ? "Carregando..." : "🔄 Recarregar Dados"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      );
    }

    if (tab === "graficos") {
      return (
        <Card sx={baseCardStyle}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              📈 Desempenho por Atendente
            </Typography>
            <ChatsUser
              dateFrom={dateFrom}
              dateTo={dateTo}
              filterType={filterType}
            />
          </CardContent>
        </Card>
      );
    }

    if (tab === "atendentes") {
      return (
        <Card sx={baseCardStyle}>
          <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              👥 Status dos Atendentes
            </Typography>
            <TableAttendantsStatus
              loading={loading}
              attendants={counters.attendants || []}
            />
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <Box
      sx={{
        bgcolor: "background.default",
        minHeight: "100vh",
        py: { xs: 3, md: 5 },
      }}
    >
      <Container maxWidth="xl">
        <Stack spacing={4}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              📊 Dashboard
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title="Filtros">
                <IconButton
                  onClick={() => setShowFilter(!showFilter)}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Exportar Métricas do Dashboard">
                <IconButton
                  onClick={exportToExcel}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: "primary.main",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    },
                  }}
                >
                  <SaveAltIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {showFilter && (
            <Paper sx={{ p: { xs: 2, md: 3 }, ...baseCardStyle }}>
              <Typography variant="h6" gutterBottom>
                🔍 Filtros do Dashboard
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Tipo de Filtro"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value={1}>Todos os Dados</MenuItem>
                    <MenuItem value={2}>Somente Ativos</MenuItem>
                    <MenuItem value={3}>Somente Inativos</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    select
                    label="Período"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <MenuItem value={0}>Personalizado</MenuItem>
                    <MenuItem value={1}>Hoje</MenuItem>
                    <MenuItem value={7}>Últimos 7 dias</MenuItem>
                    <MenuItem value={30}>Últimos 30 dias</MenuItem>
                    <MenuItem value={90}>Últimos 90 dias</MenuItem>
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Data Início"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Data Fim"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box
                    sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setFilterType(1);
                        setPeriod(0);
                        setDateFrom(
                          moment().startOf("month").format("YYYY-MM-DD")
                        );
                        setDateTo(moment().format("YYYY-MM-DD"));
                      }}
                    >
                      Limpar Filtros
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={fetchData}
                      startIcon={<FilterListIcon />}
                    >
                      Aplicar Filtros
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}

          <Tabs
            value={tab}
            onChange={handleChangeTab}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              "& .MuiTabs-flexContainer": { gap: 1 },
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                borderRadius: 99,
                minHeight: 40,
                px: 3,
                color: "text.secondary",
                "&.Mui-selected": {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontWeight: "bold",
                },
              },
            }}
          >
            <Tab value="metricas" label="📊 Métricas" />
            <Tab value="graXficos" label="📈 Gráficos" />
            <Tab value="atendentes" label="👥 Atendentes" />
          </Tabs>

          <Box>{renderContent()}</Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default Dashboard;
