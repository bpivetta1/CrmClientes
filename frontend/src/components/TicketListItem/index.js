import React, { useState, useEffect, useRef, useContext } from "react";
import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";
import emojiRegex from "emoji-regex";
import { v4 as uuidv4 } from "uuid";

import { makeStyles, withStyles, alpha } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
  ListItem,
  ListItemText,
  ListItemAvatar,
  Typography,
  Avatar,
  Divider,
  Badge,
  IconButton,
  Box,
  Tooltip,
  Chip,
  Fade,
} from "@material-ui/core";
import {
  CheckCircle as CheckIcon,
  Replay as ReplayIcon,
  ClearOutlined as ClearOutlinedIcon,
  Star as StarIcon,
  People as GroupIcon,
} from "@material-ui/icons";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";

import MarkdownWrapper from "../MarkdownWrapper";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";

// Importação de ícones de canal
import facebookIcon from "../../assets/facebook.png";
import insatagramIcon from "../../assets/instagram.png";
import whatsappIcon from "../../assets/whatsapp.png";

const useStyles = makeStyles((theme) => ({
  ticketItem: {
    position: "relative",
    padding: theme.spacing(1.5, 1.5, 1.5, 2),
    borderLeft: "5px solid transparent",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
  },
  ticketSelected: {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderLeft: `5px solid ${theme.palette.primary.main}`,
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
    },
  },
  pendingTicket: {
    cursor: "pointer",
  },
  ticketInfo: {
    display: "flex",
    flexDirection: "column",
    padding: theme.spacing(0, 1),
  },
  contactHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(0.5),
  },
  contactName: {
    fontWeight: 500,
    flexGrow: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  ticketTime: {
    fontSize: "0.75rem",
    color: theme.palette.text.secondary,
    whiteSpace: "nowrap",
    marginLeft: theme.spacing(1),
  },
  lastMessage: {
    color: theme.palette.text.secondary,
    marginRight: theme.spacing(5),
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  newMessages: {
    position: "absolute",
    right: theme.spacing(6),
    top: "50%",
    transform: "translateY(-50%)",
  },
  badgeStyle: {
    backgroundColor: green[500],
    color: "white",
    boxShadow: "0 2px 5px 0 rgba(0,0,0,0.16)",
  },
  connectionBadge: {
    position: "absolute",
    right: theme.spacing(12),
    top: theme.spacing(1.5),
    padding: theme.spacing(0.3, 1),
    borderRadius: 12,
    fontSize: "0.7rem",
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    fontWeight: 500,
    maxWidth: 100,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  ticketActionArea: {
    position: "absolute",
    right: theme.spacing(1),
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    gap: theme.spacing(0.5),
  },
  actionButton: {
    padding: theme.spacing(1),
    color: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    borderRadius: 8,
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.15),
    },
  },
  acceptButton: {
    color: theme.palette.success.main,
    backgroundColor: alpha(theme.palette.success.main, 0.08),
    "&:hover": {
      backgroundColor: alpha(theme.palette.success.main, 0.15),
    },
  },
  closeButton: {
    color: theme.palette.error.main,
    backgroundColor: alpha(theme.palette.error.main, 0.08),
    "&:hover": {
      backgroundColor: alpha(theme.palette.error.main, 0.15),
    },
  },
  avatar: {
    width: 48,
    height: 48,
    boxShadow: "0 2px 5px 0 rgba(0,0,0,0.16)",
  },
  avatarChannel: {
    width: 20,
    height: 20,
    border: `2px solid ${theme.palette.background.paper}`,
  },
  tagsContainer: {
    position: "absolute",
    bottom: theme.spacing(0.5),
    left: theme.spacing(7),
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.5),
  },
  tagChip: {
    height: 20,
    fontSize: "0.65rem",
    fontWeight: 500,
    borderRadius: 4,
    padding: 0,
    "& .MuiChip-label": {
      padding: "0 6px",
    },
  },
  groupTag: {
    backgroundColor: "#7C7C7C",
    color: "#fff",
  },
  userTag: {
    color: "#fff",
  },
  ratingIndicator: {
    marginRight: theme.spacing(1),
    fontSize: "1rem",
  },
  colorBand: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 5,
    height: "100%",
    backgroundColor: "#7C7C7C",
    zIndex: 1,
  },
  onlineIndicator: {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "$pulse 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes pulse": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const TicketListItem = ({ ticket }) => {
  const classes = useStyles();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const { ticketId } = useParams();
  const isMounted = useRef(true);
  const { user } = useContext(AuthContext);
  const { setCurrentTicket, setTabOpen } = useContext(TicketsContext);

  const isSelected = ticketId && +ticketId === ticket.id;

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Função para pegar o ícone do canal
  const getAvatarChannel = (channel) => {
    if (channel === "facebook") return facebookIcon;
    if (channel === "whatsapp" || channel === "whatsappapi")
      return whatsappIcon;
    if (channel === "instagram") return insatagramIcon;
    return null;
  };

  // Função para obter emoji de avaliação
  const getRatingIcon = (rate) => {
    const ratings = {
      1: "😡",
      2: "😠",
      3: "😐",
      4: "😃",
      5: "😍",
    };
    return ratings[rate] || "";
  };

  // Manipuladores de ações do ticket
  const handleAcepptTicket = async () => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "open",
        userId: user?.id,
      });
      history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleAcepptTicketBot = async () => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "open",
        userId: user?.id,
      });
      history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleReopenTicket = async () => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "open",
        userId: user?.id,
      });
      history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleViewTicket = async () => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "pending",
      });
      history.push(`/tickets/${ticket.uuid}`);
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleSelectTicket = () => {
    const code = uuidv4();
    const { id, uuid } = ticket;
    setTabOpen(ticket.status);
    setCurrentTicket({ id, uuid, code });
  };

  const handleClosedTicket = async () => {
    setLoading(true);
    try {
      await api.put(`/tickets/${ticket.id}`, {
        status: "closed",
      });
    } catch (err) {
      toastError(err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // Função para obter o primeiro nome
  const getFirstName = (name) => {
    const cleanName = name.replace(emojiRegex(), "").trim();
    return cleanName.split(" ")[0];
  };

  // Renderiza o tempo formatado
  const renderTime = (updatedAt) => {
    if (!updatedAt) return null;

    return isSameDay(parseISO(updatedAt), new Date())
      ? format(parseISO(updatedAt), "HH:mm")
      : format(parseISO(updatedAt), "dd/MM/yyyy");
  };

  return (
    <React.Fragment key={ticket.id}>
      <ListItem
        button
        onClick={handleSelectTicket}
        selected={isSelected}
        className={clsx(classes.ticketItem, {
          [classes.ticketSelected]: isSelected,
          [classes.pendingTicket]: ticket.status === "pending",
        })}
      >
        {/* Faixa de cor da fila */}
        <Tooltip
          arrow
          placement="right"
          title={ticket.queue?.name || i18n.t("ticketsList.noQueue")}
        >
          <Box
            className={classes.colorBand}
            style={{
              backgroundColor: ticket.queue?.color || "#7C7C7C",
            }}
          />
        </Tooltip>

        {/* Avatar do contato com badge de canal */}
        <ListItemAvatar>
          <Badge
            overlap="circular"
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            badgeContent={
              <Avatar
                className={classes.avatarChannel}
                src={getAvatarChannel(ticket?.channel)}
                alt={ticket?.channel}
              />
            }
          >
            <Avatar
              className={classes.avatar}
              src={ticket?.contact?.urlPicture}
              alt={ticket?.contact?.name}
            />
          </Badge>
        </ListItemAvatar>

        {/* Informações do ticket */}
        <ListItemText
          disableTypography
          primary={
            <Box className={classes.contactHeader}>
              <Typography variant="body1" className={classes.contactName}>
                {ticket.contact.name}
              </Typography>

              {ticket.lastMessage && (
                <Typography component="span" className={classes.ticketTime}>
                  {renderTime(ticket.updatedAt)}
                </Typography>
              )}
            </Box>
          }
          secondary={
            <Box position="relative">
              {/* Ícone de avaliação para tickets fechados */}
              {ticket.status === "closed" && ticket?.userRating && (
                <Box component="span" className={classes.ratingIndicator}>
                  {getRatingIcon(ticket?.userRating?.rate)}
                </Box>
              )}

              {/* Última mensagem */}
              <Typography
                component="span"
                variant="body2"
                className={classes.lastMessage}
              >
                {ticket.lastMessage ? (
                  <MarkdownWrapper>{ticket.lastMessage}</MarkdownWrapper>
                ) : (
                  ""
                )}
              </Typography>

              {/* Badge de mensagens não lidas */}
              {ticket.unreadMessages > 0 && (
                <Badge
                  className={classes.newMessages}
                  badgeContent={ticket.unreadMessages}
                  classes={{ badge: classes.badgeStyle }}
                />
              )}

              {/* Badge de conexão/whatsapp */}
              {ticket.whatsappId && (
                <Tooltip title={i18n.t("ticketsList.connectionTitle")}>
                  <Box className={classes.connectionBadge}>
                    {ticket.whatsapp?.name}
                  </Box>
                </Tooltip>
              )}
            </Box>
          }
        />

        {/* Área de tags */}
        <Box className={classes.tagsContainer}>
          {/* Tag de grupo */}
          {ticket.isGroup && (
            <Chip
              icon={<GroupIcon style={{ fontSize: 12 }} />}
              label="Grupo"
              size="small"
              className={`${classes.tagChip} ${classes.groupTag}`}
            />
          )}

          {/* Tag de usuário (para admins) */}
          {ticket.user?.id && user.profile.toUpperCase() === "ADMIN" && (
            <Chip
              size="small"
              label={getFirstName(ticket.user.name)}
              className={`${classes.tagChip} ${classes.userTag}`}
              style={{
                backgroundColor: ticket.user.color || "#7C7C7C",
              }}
            />
          )}

          {/* Tags do ticket */}
          {ticket.tags?.length > 0 && (
            <>
              <Chip
                size="small"
                label={ticket.tags[0].name}
                className={classes.tagChip}
                style={{
                  backgroundColor: ticket.tags[0].color,
                  color: "#fff",
                }}
              />
              {ticket.tags.length > 1 && (
                <Chip
                  size="small"
                  label={`+${ticket.tags.length - 1}`}
                  className={classes.tagChip}
                  style={{
                    backgroundColor: "#7C7C7C",
                    color: "#fff",
                  }}
                />
              )}
            </>
          )}
        </Box>

        {/* Botões de ação */}
        <Box className={classes.ticketActionArea}>
          {/* Botões para tickets pendentes */}
          {ticket.status === "pending" && (
            <>
              <Tooltip title={i18n.t("ticketsList.accept") || "Aceitar"}>
                <IconButton
                  size="small"
                  className={`${classes.actionButton} ${classes.acceptButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    ticket.isBot
                      ? handleAcepptTicketBot()
                      : handleAcepptTicket();
                  }}
                  disabled={loading}
                >
                  <CheckIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              {(user.showDashboard === "enabled" ||
                user.profile === "admin") && (
                <Tooltip title={i18n.t("ticketsList.close") || "Fechar"}>
                  <IconButton
                    size="small"
                    className={`${classes.actionButton} ${classes.closeButton}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClosedTicket();
                    }}
                    disabled={loading}
                  >
                    <ClearOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}

          {/* Botões para tickets abertos */}
          {ticket.status === "open" && (
            <>
              <Tooltip title={i18n.t("ticketsList.return") || "Retornar"}>
                <IconButton
                  size="small"
                  className={classes.actionButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTicket();
                  }}
                  disabled={loading}
                >
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title={i18n.t("ticketsList.close") || "Fechar"}>
                <IconButton
                  size="small"
                  className={`${classes.actionButton} ${classes.closeButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClosedTicket();
                  }}
                  disabled={loading}
                >
                  <ClearOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}

          {/* Botão para tickets fechados */}
          {ticket.status === "closed" && (
            <Tooltip title={i18n.t("ticketsList.reopen") || "Reabrir"}>
              <IconButton
                size="small"
                className={classes.actionButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReopenTicket();
                }}
                disabled={loading}
              >
                <ReplayIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </ListItem>
      <Divider variant="inset" component="li" />
    </React.Fragment>
  );
};

export default TicketListItem;
