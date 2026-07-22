import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";
import Avatar from "@material-ui/core/Avatar";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";

import IconButton from "@material-ui/core/IconButton";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import ConfirmationModal from "../../components/ConfirmationModal";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Can } from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";
import { SocketContext } from "../../context/Socket/SocketContext";
import WebhookModal from "../../components/WebhookModal";
import {
  AddCircle,
  Build,
  ContentCopy,
  DevicesFold,
  MoreVert,
  WebhookOutlined,
  FileDownload
} from "@mui/icons-material";

import {
  Button,
  CircularProgress,
  Grid,
  Menu,
  MenuItem,
  Stack,
  useTheme,
  Typography,
  Box
} from "@mui/material";

import FlowBuilderModal from "../../components/FlowBuilderModal";

import {
  colorBackgroundTable,
  colorLineTable,
  colorLineTableHover,
  colorPrimary,
  colorTitleTable,
  colorTopTable
} from "../../styles/styles";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach(contact => {
      const contactIndex = state.findIndex(c => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex(c => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;

    const contactIndex = state.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles(theme => ({
  mainPaper: {
    flex: 1,
    backgroundColor: theme.palette.background.paper,
    borderRadius: 12,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles
  },
  searchContainer: {
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
    borderRadius: 12,
    marginBottom: theme.spacing(1)
  },
  searchInput: {
    backgroundColor: theme.palette.background.default,
    '& .MuiOutlinedInput-root': {
      borderRadius: 12,
      '& fieldset': {
        borderColor: theme.palette.mode === 'light' ? '#e0e0e0' : '#424242',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.mode === 'light' ? '#8a8a8a' : '#d6d6d6',
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    }
  },
  actionButtons: {
    marginBottom: theme.spacing(1),
    '& > *': {
      margin: theme.spacing(0.5),
    }
  },
  customButton: {
    backgroundColor: "rgba(4, 197, 188, 0.2)",
    color: "#01a19a",
    '&:hover': {
      backgroundColor: "rgba(4, 197, 188, 0.3)",
      color: "#01a19a",
    }
  },
  tableContainer: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: 12,
    '& .MuiTableCell-root': {
      borderBottom: `1px solid ${theme.palette.mode === 'light' ? '#e0e0e0' : '#424242'}`,
    },
    '& .MuiTableRow-root:hover': {
      backgroundColor: theme.palette.action.hover,
    }
  }
}));

const FlowBuilder = () => {
  const classes = useStyles();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [contacts, dispatch] = useReducer(reducer, []);
  const [webhooks, setWebhooks] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedWebhookName, setSelectedWebhookName] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket, setContactTicket] = useState({});
  const [deletingContact, setDeletingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDuplicateOpen, setConfirmDuplicateOpen] = useState(false);

  const [hasMore, setHasMore] = useState(false);
  const [reloadData, setReloadData] = useState(false);
  const { user, socket } = useContext(AuthContext);
  const [importAnchorEl, setImportAnchorEl] = useState(null);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/flowbuilder");
          setWebhooks(data.flows);
          dispatch({ type: "LOAD_CONTACTS", payload: data.flows });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, reloadData]);

  useEffect(() => {
    const companyId = user.companyId
   

   const onContact = (data) => {
    if (data.action === "update" || data.action === "create") {
      dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
    }

    if (data.action === "delete") {
      dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
    }
  }
  
  socket.on(`company-${companyId}-contact`, onContact);

  return () => {
    socket.disconnect();
  };


  }, []);

  const handleSearch = event => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const handleCloseOrOpenTicket = ticket => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const hadleEditContact = () => {
    setSelectedContactId(deletingContact.id);
    setSelectedWebhookName(deletingContact.name);
    setContactModalOpen(true);
  };

  const handleDeleteWebhook = async webhookId => {
    try {
      await api.delete(`/flowbuilder/${webhookId}`).then(res => {
        setDeletingContact(null);
        setReloadData(old => !old);
      });
      toast.success("Fluxo excluído com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const handleDuplicateFlow = async flowId => {
    try {
      await api.post(`/flowbuilder/duplicate`, { flowId: flowId }).then(res => {
        setDeletingContact(null);
        setReloadData(old => !old);
      });
      toast.success("Fluxo duplicado com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const loadMore = () => {
    setPageNumber(prevState => prevState + 1);
  };

  const handleScroll = e => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportLink = () => {
    history.push(`/flowbuilder/${deletingContact.id}`)
  }

  const handleEdit = (webhook) => {
    setSelectedContactId(webhook.id);
    setSelectedWebhookName(webhook.name);
    setContactModalOpen(true);
  };

  const handleDuplicate = (webhook) => {
    setDeletingContact(webhook);
    setConfirmDuplicateOpen(true);
  };

  const handleDelete = (webhook) => {
    setDeletingContact(webhook);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    handleDeleteWebhook(deletingContact.id);
    setConfirmOpen(false);
  };

  const handleDuplicateConfirm = () => {
    handleDuplicateFlow(deletingContact.id);
    setConfirmDuplicateOpen(false);
  };

  return (
    <MainContainer className={classes.mainContainer}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={ticket => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <FlowBuilderModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        flowId={selectedContactId}
        nameWebhook={selectedWebhookName}
        onSave={() => setReloadData(old => !old)}
      ></FlowBuilderModal>
      <ConfirmationModal
        title={
          deletingContact
            ? `${i18n.t("contacts.confirmationModal.deleteTitle")} ${
                deletingContact.name
              }?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={e =>
          deletingContact ? handleDeleteWebhook(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Tem certeza que deseja deletar este fluxo? Todas as integrações relacionados serão perdidos.`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      <ConfirmationModal
        title={
          deletingContact
            ? `Deseja duplicar o fluxo ${deletingContact.name}?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmDuplicateOpen}
        onClose={setConfirmDuplicateOpen}
        onConfirm={e =>
          deletingContact ? handleDuplicateFlow(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Tem certeza que deseja duplicar este fluxo?`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      <MainHeader>
        <Title>Fluxos de conversa</Title>
        <MainHeaderButtonsWrapper>
          <TextField
            placeholder={i18n.t("contacts.searchPlaceholder")}
            type="search"
            value={searchParam}
            onChange={handleSearch}
            InputProps={{
              style: {
                color: colorTitleTable()
              },
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon style={{ color: "gray" }} />
                </InputAdornment>
              )
            }}
          />
          <Button
            variant="contained"
            onClick={handleOpenContactModal}
            style={{ textTransform: "none", backgroundColor: colorPrimary() }}
          >
            <Stack direction={"row"} gap={1}>
              <AddCircle />
              {"Adicionar Fluxo"}
            </Stack>
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Stack>
          <Grid container style={{ padding: "8px" }}>
            <Grid item xs={4} style={{ color: "#1C2E36", fontWeight: 500 }}>
              {i18n.t("contacts.table.name")}
            </Grid>
            <Grid item xs={4} style={{ color: "#1C2E36", fontWeight: 500 }} align="center">
              Status
            </Grid>
            <Grid item xs={4} align="end" style={{ color: "#1C2E36", fontWeight: 500 }}>
              {i18n.t("contacts.table.actions")}
            </Grid>
          </Grid>
          <>
            {webhooks.map(contact => (
              <Grid               
                container
                key={contact.id}
                sx={{
                  padding: "12px 16px",
                  backgroundColor: theme => theme.palette.background.paper,
                  borderRadius: 2,
                  marginTop: 0.5,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  border: '1px solid transparent',
                  "&:hover": {
                    backgroundColor: theme => theme.palette.action.hover,
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    borderColor: '#01a19a20'
                  }
                }}
              >
                <Grid item xs={4} onClick={() => history.push(`/flowbuilder/${contact.id}`)}>
                  <Stack
                    justifyContent={"center"}
                    height={"100%"}
                    sx={{ color: "#1C2E36" }}
                  >
                    <Stack direction={"row"} alignItems="center" spacing={2}>
                      <DevicesFold sx={{ 
                        color: "#01a19a",
                        backgroundColor: '#01a19a10',
                        padding: '8px',
                        borderRadius: '12px'
                      }} />
                      <Stack>
                        <Typography variant="subtitle1" fontWeight={500}>
                          {contact.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Criado em: {new Date(contact.createdAt).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={4} align="center" onClick={() => history.push(`/flowbuilder/${contact.id}`)}>
                  <Stack justifyContent={"center"} height={"100%"}>
                    <Stack 
                      direction="row" 
                      spacing={1} 
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: '16px',
                          backgroundColor: contact.active ? '#01a19a20' : '#ff000020',
                          color: contact.active ? '#01a19a' : '#ff0000',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: contact.active ? '#01a19a' : '#ff0000',
                          }}
                        />
                        {contact.active ? "Ativo" : "Desativado"}
                      </Box>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={4} align="end">
                  <Button
                    id="basic-button"
                    aria-controls={open ? "basic-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={(e) => {
                      handleClick(e);
                      setDeletingContact(contact);
                    }}
                    sx={{ 
                      borderRadius: "12px",
                      minWidth: "40px",
                      height: "40px",
                      backgroundColor: '#01a19a10',
                      "&:hover": {
                        backgroundColor: '#01a19a20'
                      }
                    }}
                  >
                    <MoreVert
                      sx={{ color: "#01a19a", width: "24px", height: "24px" }}
                    />
                  </Button>
                </Grid>
              </Grid>
            ))}
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: '12px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                  backgroundColor: theme => theme.palette.background.paper,
                },
                '& .MuiMenuItem-root': {
                  padding: '10px 20px',
                  gap: '8px',
                  borderRadius: '8px',
                  margin: '2px 4px',
                  '&:hover': {
                    backgroundColor: 'rgba(1, 161, 154, 0.1)',
                  }
                }
              }}
              onClose={handleClose}
              MenuListProps={{
                "aria-labelledby": "basic-button"
              }}
            >
              <MenuItem 
                onClick={() => {
                  handleClose()
                  hadleEditContact()
                }}>
                <EditIcon sx={{ fontSize: 20, color: '#1C2E36' }} />
                Editar nome
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose()
                  exportLink()
                }}>
                <Build sx={{ fontSize: 20, color: '#1C2E36' }} />
                Editar fluxo
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose()
                  setConfirmDuplicateOpen(true);
                }}>
                <ContentCopy sx={{ fontSize: 20, color: '#1C2E36' }} />
                Duplicar
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleClose()
                  setConfirmOpen(true);
                }}>
                <DeleteOutlineIcon sx={{ fontSize: 20, color: '#f44336' }} />
                Excluir
              </MenuItem>
            </Menu>
            {loading && (
              <Stack
                justifyContent={"center"}
                alignItems={"center"}
                minHeight={"50vh"}
              >
                <CircularProgress />
              </Stack>
            )}
          </>
        </Stack>
      </Paper>
    </MainContainer>
  );
};

export default FlowBuilder;
