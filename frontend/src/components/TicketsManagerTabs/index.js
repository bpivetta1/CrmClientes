import React, { useContext, useEffect, useRef, useState } from "react";
import { useTheme, alpha } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
import {
  makeStyles,
  Paper,
  InputBase,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Typography,
  Grid,
  Tooltip,
  Switch,
  Box,
  Fade,
  Button,
  Chip,
  Snackbar,
  Zoom,
} from "@material-ui/core";
import {
  Group,
  MoveToInbox as MoveToInboxIcon,
  CheckBox as CheckBoxIcon,
  MessageSharp as MessageSharpIcon,
  AccessTime as ClockIcon,
  Search as SearchIcon,
  Add as AddIcon,
  TextRotateUp,
  TextRotationDown,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FilterList as FilterListIcon,
} from "@material-ui/icons";
import { PlaylistAddCheckOutlined } from "@mui/icons-material";
import ToggleButton from "@material-ui/lab/ToggleButton";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import { StatusFilter } from "../StatusFilter";
import { WhatsappsFilter } from "../WhatsappsFilter";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { QueueSelectedContext } from "../../context/QueuesSelected/QueuesSelectedContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import api from "../../services/api";
import { SmartToyOutlined as SmartToyOutlinedIcon } from "@mui/icons-material";


const useStyles = makeStyles((theme) => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    flexDirection: "column",
    overflow: "hidden",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: theme.palette.background.paper,
  },
  searchContainer: {
    padding: theme.spacing(1.5, 1),
    position: "relative",
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
  searchInputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: alpha(
      theme.palette.common.white,
      theme.palette.mode === "dark" ? 0.1 : 0.9
    ),
    borderRadius: 40,
    padding: theme.spacing(0.5, 1.5),
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 2px 6px rgba(0,0,0,0.15)"
        : "0 2px 6px rgba(0,0,0,0.08)",
    transition: "all 0.3s ease",
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    "&:hover, &:focus-within": {
      boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
      backgroundColor:
        theme.palette.mode === "dark"
          ? alpha(theme.palette.common.white, 0.15)
          : alpha(theme.palette.common.white, 0.95),
    },
  },
  searchIcon: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(1),
  },
  searchInput: {
    flex: 1,
    border: "none",
    borderRadius: 30,
    padding: theme.spacing(1, 0),
    fontSize: "0.9rem",
    color: theme.palette.text.primary,
    backgroundColor: "transparent",
  },
  searchSwitch: {
    marginLeft: theme.spacing(1),
  },
  filterButton: {
    marginLeft: theme.spacing(1),
    borderRadius: 20,
    padding: theme.spacing(0.5),
    color: theme.palette.primary.main,
    transition: "all 0.3s ease",
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
    },
  },
  filterActive: {
    backgroundColor: alpha(theme.palette.primary.main, 0.15),
    color: theme.palette.primary.main,
  },
  filtersContainer: {
    padding: theme.spacing(1.5, 1),
    backgroundColor: alpha(theme.palette.background.default, 0.4),
    borderRadius: theme.spacing(1),
    margin: theme.spacing(1),
    transition: "all 0.3s ease",
  },
  actionBar: {
    display: "flex",
    padding: theme.spacing(1),
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    backgroundColor:
      theme.palette.mode === "dark"
        ? alpha(theme.palette.background.default, 0.6)
        : alpha(theme.palette.background.default, 0.6),
  },
  actionButtons: {
    display: "flex",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    padding: 0,
    margin: theme.spacing(0, 0.5),
    borderRadius: 8,
    backgroundColor: "transparent",
    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      borderColor: alpha(theme.palette.primary.main, 0.5),
      "& .MuiSvgIcon-root": {
        color: theme.palette.primary.main,
      },
    },
    "& .MuiSvgIcon-root": {
      fontSize: 20,
      color: theme.palette.text.secondary,
      transition: "all 0.2s ease",
    },
  },
  actionButtonActive: {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    borderColor: alpha(theme.palette.primary.main, 0.8),
    "& .MuiSvgIcon-root": {
      color: theme.palette.primary.main,
    },
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.15),
    },
  },
  tabsContainer: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  tabs: {
    backgroundColor: theme.palette.background.paper,
    "& .MuiTabs-indicator": {
      height: 3,
      borderRadius: "3px 3px 0 0",
    },
  },
  tab: {
    minWidth: "auto",
    padding: theme.spacing(1, 2),
    textTransform: "none",
    fontSize: "0.85rem",
    fontWeight: 500,
    transition: "all 0.2s ease",
    opacity: 0.7,
    "&.Mui-selected": {
      opacity: 1,
      fontWeight: 600,
    },
  },
  tabContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tabIcon: {
    marginRight: theme.spacing(0.5),
    fontSize: 20,
  },
  tabBadge: {
    "& .MuiBadge-badge": {
      fontSize: "0.7rem",
      height: 18,
      minWidth: 18,
      padding: "0 5px",
      borderRadius: 9,
    },
  },
  popoverBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    fontSize: "0.65rem",
    padding: theme.spacing(0, 0.8),
    borderRadius: 10,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    whiteSpace: "nowrap",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    zIndex: 2,
    pointerEvents: "none",
  },
  snackbar: {
    "& .MuiSnackbarContent-root": {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      borderRadius: 16,
      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    },
  },
  confirmButton: {
    backgroundColor: theme.palette.success.main,
    color: theme.palette.common.white,
    fontWeight: 600,
    padding: theme.spacing(0.5, 2),
    borderRadius: 20,
    margin: theme.spacing(0, 0.5),
    "&:hover": {
      backgroundColor: theme.palette.success.dark,
    },
  },
  cancelButton: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.common.white,
    fontWeight: 600,
    padding: theme.spacing(0.5, 2),
    borderRadius: 20,
    "&:hover": {
      backgroundColor: theme.palette.error.dark,
    },
  },
  queueSelectContainer: {
    minWidth: 200,
  },
  ticketsContent: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    "&::-webkit-scrollbar": {
      width: 6,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: alpha(theme.palette.primary.main, 0.2),
      borderRadius: 3,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: alpha(theme.palette.divider, 0.1),
      borderRadius: 3,
    },
  },
}));

const TicketsManagerTabs = () => {
  const theme = useTheme();
  const classes = useStyles();
  const history = useHistory();
  const isDark = theme.palette.mode === "dark";

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [sortTickets, setSortTickets] = useState(false);
  const [searchOnMessages, setSearchOnMessages] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [filter, setFilter] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const searchInputRef = useRef();

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [groupingCount, setGroupingCount] = useState(0);
  const [noBotCount, setNoBotCount] = useState(0);

  const { user } = useContext(AuthContext);
  const { profile } = user;
  const { setSelectedQueuesMessage } = useContext(QueueSelectedContext);
  const { tabOpen, setTabOpen } = useContext(TicketsContext);

  const userQueueIds = user.queues.map((q) => q.id);
  const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState([]);
  const [forceSearch, setForceSearch] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState([]);

  useEffect(() => {
    setSelectedQueuesMessage(selectedQueueIds);
  }, [selectedQueueIds, setSelectedQueuesMessage]);

  useEffect(() => {
    if (
      user.profile.toUpperCase() === "ADMIN" ||
      user.allUserChat.toUpperCase() === "ENABLED"
    ) {
      setShowAllTickets(false);
    }
  }, [user]);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current.focus();
    }
    setForceSearch(!forceSearch);
  }, [tab]);

  let searchTimeout;

  const handleSearch = (e) => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    if (searchedTerm === "") {
      setSearchParam(searchedTerm);
      setForceSearch(!forceSearch);
      setTab("open");
      return;
    } else if (tab !== "search") {
      handleFilter();
      setTab("search");
    }

    searchTimeout = setTimeout(() => {
      setSearchParam(searchedTerm);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleBack = () => {
    history.push("/tickets");
  };

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  const handleChangeTabOpen = (e, newValue) => {
    handleBack();
    setTabOpen(newValue);
  };

  const applyPanelStyle = (status) => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  const handleSnackbarOpen = () => {
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const CloseAllTicket = async () => {
    try {
      setLoadingAction(true);
      await api.post("/tickets/closeAll", {
        status: tabOpen,
        selectedQueueIds,
      });
      handleSnackbarClose();
    } catch (err) {
      console.log("Error: ", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleSelectedTags = (selecteds) => {
    const tags = selecteds.map((t) => t.id);

    clearTimeout(searchTimeout);

    if (tags.length === 0) {
      setForceSearch(!forceSearch);
    } else if (tab !== "search") {
      setTab("search");
    }

    searchTimeout = setTimeout(() => {
      setSelectedTags(tags);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map((t) => t.id);

    clearTimeout(searchTimeout);

    if (users.length === 0) {
      setForceSearch(!forceSearch);
    } else if (tab !== "search") {
      setTab("search");
    }
    searchTimeout = setTimeout(() => {
      setSelectedUsers(users);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleSelectedWhatsapps = (selecteds) => {
    const whatsapp = selecteds.map((t) => t.id);

    clearTimeout(searchTimeout);

    if (whatsapp.length === 0) {
      setForceSearch(!forceSearch);
    } else if (tab !== "search") {
      setTab("search");
    }
    searchTimeout = setTimeout(() => {
      setSelectedWhatsapp(whatsapp);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleSelectedStatus = (selecteds) => {
    const statusFilter = selecteds.map((t) => t.status);

    clearTimeout(searchTimeout);

    if (statusFilter.length === 0) {
      setForceSearch(!forceSearch);
    } else if (tab !== "search") {
      setTab("search");
    }

    searchTimeout = setTimeout(() => {
      setSelectedStatus(statusFilter);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleFilter = () => {
    if (filter) {
      setFilter(false);
      setTab("open");
    } else {
      setFilter(true);
      setTab("search");
    }
  };

  const isButtonActive = (buttonTab) => {
    return tab === buttonTab;
  };

  const renderTooltipBadge = (buttonId, label) => {
    return (
      hoveredButton === buttonId && (
        <Zoom in={hoveredButton === buttonId}>
          <Box className={classes.popoverBadge}>{label}</Box>
        </Zoom>
      )
    );
  };

  return (
    <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />

      {/* Barra de pesquisa */}
      <Box className={classes.searchContainer}>
        <Box className={classes.searchInputWrapper}>
          <SearchIcon className={classes.searchIcon} />
          <InputBase
            className={classes.searchInput}
            inputRef={searchInputRef}
            placeholder={i18n.t("tickets.search.placeholder")}
            type="search"
            onChange={handleSearch}
            fullWidth
          />
          <Tooltip
            title={
              i18n.t("tickets.search.includeMessages") ||
              "Pesquisar também nas mensagens"
            }
            placement="top"
            arrow
          >
            <Box className={classes.searchSwitch}>
              <Switch
                size="small"
                checked={searchOnMessages}
                onChange={(e) => {
                  setSearchOnMessages(e.target.checked);
                }}
                color="primary"
              />
            </Box>
          </Tooltip>
          <Tooltip
            title={
              isFilterActive
                ? i18n.t("tickets.filters.disable") || "Desativar filtros"
                : i18n.t("tickets.filters.enable") || "Ativar filtros"
            }
            placement="top"
            arrow
          >
            <IconButton
              className={`${classes.filterButton} ${isFilterActive ? classes.filterActive : ""
                }`}
              onClick={() => {
                setIsFilterActive((prevState) => !prevState);
                handleFilter();
              }}
              size="small"
            >
              <FilterListIcon
                style={{
                  transform: isFilterActive ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Área de filtros */}
      {filter === true && (
        <Fade in={filter}>
          <Box className={classes.filtersContainer}>
            <TagsFilter onFiltered={handleSelectedTags} />
            <WhatsappsFilter onFiltered={handleSelectedWhatsapps} />
            <StatusFilter onFiltered={handleSelectedStatus} />
            {profile === "admin" && (
              <UsersFilter onFiltered={handleSelectedUsers} />
            )}
          </Box>
        </Fade>
      )}

      {/* Barra de ações */}
      <Box className={classes.actionBar}>
        <Box className={classes.actionButtons}>
          {/* Botão Ver Todos (para admins) */}
          <Can
            role={
              user.allUserChat === "enabled" && user.profile === "user"
                ? "admin"
                : user.profile
            }
            perform="tickets-manager:showall"
            yes={() => (
              <Box position="relative">
                <IconButton
                  className={`${classes.actionButton} ${showAllTickets ? classes.actionButtonActive : ""
                    }`}
                  onClick={() => setShowAllTickets((prevState) => !prevState)}
                  onMouseEnter={() => setHoveredButton("showAll")}
                  onMouseLeave={() => setHoveredButton(null)}
                >
                  {showAllTickets ? <VisibilityIcon /> : <VisibilityOffIcon />}
                </IconButton>
                {renderTooltipBadge(
                  "showAll",
                  i18n.t("tickets.buttons.showAll") || "Ver todos"
                )}
              </Box>
            )}
          />

          {/* Botão Novo Ticket */}
          <Box position="relative">
            <IconButton
              className={classes.actionButton}
              onClick={() => setNewTicketModalOpen(true)}
              onMouseEnter={() => setHoveredButton("newTicket")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <AddIcon />
            </IconButton>
            {renderTooltipBadge(
              "newTicket",
              i18n.t("tickets.buttons.newTicket") || "Novo ticket"
            )}
          </Box>

          {/* Botão Resolver Todos (apenas admin) */}
          {user.profile === "admin" && (
            <Box position="relative">
              <IconButton
                className={classes.actionButton}
                onClick={handleSnackbarOpen}
                onMouseEnter={() => setHoveredButton("resolveAll")}
                onMouseLeave={() => setHoveredButton(null)}
                disabled={loadingAction}
              >
                <PlaylistAddCheckOutlined
                  style={{ color: isDark ? "#FFF" : "#2e7d32" }}
                />
              </IconButton>
              {renderTooltipBadge(
                "resolveAll",
                i18n.t("tickets.buttons.resolveAll") || "Resolver todos"
              )}
            </Box>
          )}

          {/* Botão Abertos */}
          <Box position="relative">
            <IconButton
              className={`${classes.actionButton} ${isButtonActive("open") ? classes.actionButtonActive : ""
                }`}
              onClick={() => handleChangeTab(null, "open")}
              onMouseEnter={() => setHoveredButton("open")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <MoveToInboxIcon />
            </IconButton>
            {renderTooltipBadge(
              "open",
              i18n.t("tickets.buttons.open") || "Em aberto"
            )}
          </Box>

          {/* Botão Resolvidos */}
          <Box position="relative">
            <IconButton
              className={`${classes.actionButton} ${isButtonActive("closed") ? classes.actionButtonActive : ""
                }`}
              onClick={() => handleChangeTab(null, "closed")}
              onMouseEnter={() => setHoveredButton("closed")}
              onMouseLeave={() => setHoveredButton(null)}
            >
              <CheckBoxIcon />
            </IconButton>
            {renderTooltipBadge(
              "closed",
              i18n.t("tickets.buttons.resolved") || "Resolvidos"
            )}
          </Box>

          {/* Botão de Ordenação (exceto para fechados e busca) */}
          {tab !== "closed" && tab !== "search" && (
            <Box position="relative">
              <IconButton
                className={`${classes.actionButton} ${sortTickets ? classes.actionButtonActive : ""
                  }`}
                onClick={() => setSortTickets((prevState) => !prevState)}
                onMouseEnter={() => setHoveredButton("sort")}
                onMouseLeave={() => setHoveredButton(null)}
              >
                {!sortTickets ? <TextRotateUp /> : <TextRotationDown />}
              </IconButton>
              {renderTooltipBadge(
                "sort",
                sortTickets
                  ? i18n.t("tickets.buttons.descending") || "Decrescente"
                  : i18n.t("tickets.buttons.ascending") || "Crescente"
              )}
            </Box>
          )}
        </Box>

        {/* Seletor de Filas */}
        <Box className={classes.queueSelectContainer}>
          <TicketsQueueSelect
            selectedQueueIds={selectedQueueIds}
            userQueues={user?.queues}
            onChange={(values) => setSelectedQueueIds(values)}
          />
        </Box>
      </Box>

      {/* Snackbar de confirmação para fechar todos os tickets */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        className={classes.snackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        message={
          i18n.t("tickets.confirmation.resolveAll") ||
          "Deseja realmente resolver todos os tickets?"
        }
        action={
          <>
            <Button
              className={classes.confirmButton}
              size="small"
              onClick={CloseAllTicket}
              disabled={loadingAction}
            >
              {loadingAction
                ? i18n.t("tickets.buttons.loading") || "Processando..."
                : i18n.t("tickets.buttons.yes") || "Sim"}
            </Button>
            <Button
              className={classes.cancelButton}
              size="small"
              onClick={handleSnackbarClose}
            >
              {i18n.t("tickets.buttons.no") || "Não"}
            </Button>
          </>
        }
      />

      {/* Abas e Conteúdo de Tickets */}
      <Box className={classes.ticketsContent}>
        <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
          <Box className={classes.tabsContainer}>
            <Tabs
              value={tabOpen}
              onChange={handleChangeTabOpen}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              className={classes.tabs}
            >
              {/* ATENDENDO */}
              <Tab
                label={
                  <Box className={classes.tabContent}>
                    <Badge
                      badgeContent={openCount}
                      color="secondary"
                      className={classes.tabBadge}
                      max={99}
                    >
                      <MessageSharpIcon className={classes.tabIcon} />
                    </Badge>
                    <Typography variant="body2">
                      {i18n.t("ticketsList.assignedHeader")}
                    </Typography>
                  </Box>
                }
                value="open"
                className={classes.tab}
              />

              {/* AGUARDANDO */}
              <Tab
                label={
                  <Box className={classes.tabContent}>
                    <Badge
                      badgeContent={pendingCount}
                      color="secondary"
                      className={classes.tabBadge}
                      max={99}
                    >
                      <ClockIcon className={classes.tabIcon} /> {/* ⏰ ícone correto */}
                    </Badge>
                    <Typography variant="body2">
                      {i18n.t("ticketsList.pendingHeader")}
                    </Typography>
                  </Box>
                }
                value="pending"
                className={classes.tab}
              />

              {/* NO BOT */}
              <Tab
                label={
                  <Box className={classes.tabContent}>
                    <Badge
                      badgeContent={noBotCount}
                      color="secondary"
                      className={classes.tabBadge}
                      max={99}
                    >
                      <SmartToyOutlinedIcon className={classes.tabIcon} /> {/* 🤖 ícone correto */}
                    </Badge>
                    <Typography variant="body2">No Bot</Typography>
                  </Box>
                }
                value="nobot"
                className={classes.tab}
              />


              {/* GRUPOS */}
              {user.allowGroup && (
                <Tab
                  label={
                    <Box className={classes.tabContent}>
                      <Badge
                        badgeContent={groupingCount}
                        color="secondary"
                        className={classes.tabBadge}
                        max={99}
                      >
                        <Group className={classes.tabIcon} />
                      </Badge>
                      <Typography variant="body2">
                        {i18n.t("ticketsList.groupingHeader")}
                      </Typography>
                    </Box>
                  }
                  value="group"
                  className={classes.tab}
                />
              )}
            </Tabs>
          </Box>

          <Box flex={1} overflow="hidden">
            <TicketsList
              status="open"
              showAll={showAllTickets}
              sortTickets={sortTickets ? "ASC" : "DESC"}
              selectedQueueIds={selectedQueueIds}
              updateCount={(val) => setOpenCount(val)}
              style={applyPanelStyle("open")}
              setTabOpen={setTabOpen}
            />
            <TicketsList
              status="pending"
              selectedQueueIds={selectedQueueIds}
              sortTickets={sortTickets ? "ASC" : "DESC"}
              showAll={
                user.profile === "admin" || user.allUserChat === "enabled"
                  ? showAllTickets
                  : false
              }
              updateCount={(val) => setPendingCount(val)}
              style={applyPanelStyle("pending")}
              setTabOpen={setTabOpen}
            />


<TicketsList
  status="nobot"
  selectedQueueIds={selectedQueueIds}
  sortTickets={sortTickets ? "ASC" : "DESC"}
  showAll={
    user.profile === "admin" || user.allUserChat === "enabled"
      ? showAllTickets
      : false
  }
  updateCount={(val) => setNoBotCount(val)} // ✅ contador correto
  style={applyPanelStyle("nobot")}
  setTabOpen={setTabOpen}
/>



            {user.allowGroup && (
              <TicketsList
                status="group"
                showAll={showAllTickets}
                sortTickets={sortTickets ? "ASC" : "DESC"}
                selectedQueueIds={selectedQueueIds}
                updateCount={(val) => setGroupingCount(val)}
                style={applyPanelStyle("group")}
                setTabOpen={setTabOpen}
              />
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
          <TicketsList
            status="closed"
            showAll={showAllTickets}
            selectedQueueIds={selectedQueueIds}
            setTabOpen={setTabOpen}
          />
        </TabPanel>

        <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
          {profile === "admin" && (
            <TicketsList
              statusFilter={selectedStatus}
              searchParam={searchParam}
              showAll={showAllTickets}
              tags={selectedTags}
              users={selectedUsers}
              selectedQueueIds={selectedQueueIds}
              whatsappIds={selectedWhatsapp}
              forceSearch={forceSearch}
              searchOnMessages={searchOnMessages}
              status="search"
            />
          )}

          {profile === "user" && (
            <TicketsList
              statusFilter={selectedStatus}
              searchParam={searchParam}
              showAll={false}
              tags={selectedTags}
              selectedQueueIds={selectedQueueIds}
              whatsappIds={selectedWhatsapp}
              forceSearch={forceSearch}
              searchOnMessages={searchOnMessages}
              status="search"
            />
          )}
        </TabPanel>
      </Box>
    </Paper>
  );
};

export default TicketsManagerTabs;
