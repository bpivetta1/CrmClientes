import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";

import clsx from "clsx";
import { makeStyles, Paper } from "@material-ui/core";

import ContactDrawer from "../ContactDrawer";
import MessageInput from "../MessageInput";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import TicketActionButtons from "../TicketActionButtonsCustom";
import MessagesList from "../MessagesList";

import api from "../../services/api";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { ForwardMessageProvider } from "../../context/ForwarMessage/ForwardMessageContext";
import { EditMessageProvider } from "../../context/EditingMessage/EditingMessageContext";

import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TagsContainer } from "../TagsContainer";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { isNil } from "lodash";

const drawerWidth = 320;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },

  mainWrapper: {
    flex: 1,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeft: "0",
    marginRight: -drawerWidth,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  mainWrapperShift: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const classes = useStyles();

  const { user, socket } = useContext(AuthContext);
  const { setTabOpen } = useContext(TicketsContext);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});
  const [dragDropFiles, setDragDropFiles] = useState([]);
  const { companyId } = user;

  // Apenas para debug
  useEffect(() => {
    console.log("======== Ticket ===========");
    console.log(ticket);
    console.log("===========================");
  }, [ticket]);

  // ✅ Mapeia automaticamente tickets sem fila para status "nobot"
  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        try {
          if (!isNil(ticketId) && ticketId !== "undefined") {
            const { data } = await api.get("/tickets/u/" + ticketId);

            // 🔹 Se o ticket não tiver fila, marcamos como "nobot"
            if (!data.queueId && data.status === "pending") {
              data.status = "nobot";
            }

            setContact(data.contact);
            setTicket(data);

            // 🔹 Incluímos "nobot" no controle de abas
            if (["pending", "open", "group", "nobot"].includes(data.status)) {
              setTabOpen(data.status);
            }

            setLoading(false);
          }
        } catch (err) {
          history.push("/tickets"); // Evita tela branca caso o ID seja inválido
          setLoading(false);
          toastError(err);
        }
      };
      fetchTicket();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, user, history, setTabOpen]);

  // ✅ Socket listeners e sincronização
  useEffect(() => {
    if (!ticket || !ticket.id || ticket.uuid !== ticketId || ticketId === "undefined") {
      return;
    }

    if (user.companyId) {
      const onConnectTicket = () => {
        socket.emit("joinChatBox", `${ticket.id}`);
      };

      const onCompanyTicket = (data) => {
        if (data.action === "update" && data.ticket.id === ticket?.id) {
          setTicket(data.ticket);
        }

        if (data.action === "delete" && data.ticketId === ticket?.id) {
          history.push("/tickets");
        }
      };

      const onCompanyContactTicket = (data) => {
        if (data.action === "update") {
          setContact((prevState) => {
            if (prevState.id === data.contact?.id) {
              return { ...prevState, ...data.contact };
            }
            return prevState;
          });
        }
      };

      socket.on("connect", onConnectTicket);
      socket.on(`company-${companyId}-ticket`, onCompanyTicket);
      socket.on(`company-${companyId}-contact`, onCompanyContactTicket);

      return () => {
        socket.emit("joinChatBoxLeave", `${ticket.id}`);
        socket.off("connect", onConnectTicket);
        socket.off(`company-${companyId}-ticket`, onCompanyTicket);
        socket.off(`company-${companyId}-contact`, onCompanyContactTicket);
      };
    }
  }, [ticketId, ticket, history, user, socket, companyId]);

  const handleDrawerOpen = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const renderMessagesList = () => (
    <>
      <MessagesList
        isGroup={ticket.isGroup}
        onDrop={setDragDropFiles}
        whatsappId={ticket.whatsappId}
        queueId={ticket.queueId}
        channel={ticket.channel}
      />
      <MessageInput
        ticketId={ticket.id}
        ticketStatus={ticket.status}
        ticketChannel={ticket.channel}
        droppedFiles={dragDropFiles}
        contactId={contact.id}
      />
    </>
  );

  return (
    <div className={classes.root} id="drawer-container">
      <Paper
        variant="outlined"
        elevation={0}
        className={clsx(classes.mainWrapper, {
          [classes.mainWrapperShift]: drawerOpen,
        })}
      >
        <TicketHeader loading={loading}>
          {ticket.contact !== undefined && (
            <div id="TicketHeader">
              <TicketInfo
                contact={contact}
                ticket={ticket}
                onClick={handleDrawerOpen}
              />
            </div>
          )}
          <TicketActionButtons ticket={ticket} />
        </TicketHeader>

        <Paper>
          <TagsContainer contact={contact} />
        </Paper>

        <ReplyMessageProvider>
          <ForwardMessageProvider>
            <EditMessageProvider>
              {renderMessagesList()}
            </EditMessageProvider>
          </ForwardMessageProvider>
        </ReplyMessageProvider>
      </Paper>

      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
        ticket={ticket}
      />
    </div>
  );
};

export default Ticket;
