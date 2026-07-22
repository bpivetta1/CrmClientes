import AppError from "../../errors/AppError";
import { WebhookModel } from "../../models/Webhook";
import { sendMessageFlow } from "../../controllers/MessageController";
import { IConnections, INodes } from "./DispatchWebHookService";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import CreateContactService from "../ContactServices/CreateContactService";
import Contact from "../../models/Contact";
import CreateTicketService from "../TicketServices/CreateTicketService";
import CreateTicketServiceWebhook from "../TicketServices/CreateTicketServiceWebhook";
import { SendMessage } from "../../helpers/SendMessage";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import fs from "fs";
import GetWhatsappWbot from "../../helpers/GetWhatsappWbot";
import path from "path";
import SendWhatsAppMedia from "../WbotServices/SendWhatsAppMedia";
import SendWhatsAppMediaFlow, {
  typeSimulation
} from "../WbotServices/SendWhatsAppMediaFlow";
import { randomizarCaminho } from "../../utils/randomizador";
import { SendMessageFlow } from "../../helpers/SendMessageFlow";
import formatBody from "../../helpers/Mustache";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import CreateMessageService, {
  MessageData
} from "../MessageServices/CreateMessageService";
import { randomString } from "../../utils/randomCode";
import ShowQueueService from "../QueueService/ShowQueueService";
import { getIO } from "../../libs/socket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import ShowTicketUUIDService from "../TicketServices/ShowTicketFromUUIDService";
import logger from "../../utils/logger";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import CompaniesSettings from "../../models/CompaniesSettings";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { delay } from "bluebird";
import typebotListener from "../TypebotServices/typebotListener";
import { getWbot } from "../../libs/wbot";
import { proto } from "@whiskeysockets/baileys";
import { handleOpenAi } from "../IntegrationsServices/OpenAiService";
import { IOpenAi } from "../../@types/openai";
import axios from "axios";

import { executeConditionNode } from "./ConditionNodeService";


interface IAddContact {
  companyId: number;
  name: string;
  phoneNumber: string;
  email?: string;
  dataMore?: any;
}

export const ActionsWebhookService = async (
  whatsappId: number,
  idFlowDb: number,
  companyId: number,
  nodes: INodes[],
  connects: IConnections[],
  nextStage: string,
  dataWebhook: any,
  details: any,
  hashWebhookId: string,
  pressKey?: string,
  idTicket?: number,
  numberPhrase: "" | { number: string; name: string; email: string } = "",
  msg?: proto.IWebMessageInfo
): Promise<string> => {
  try {
    const io = getIO();
    let next = nextStage;
    console.log(
      "ActionWebhookService | 53",
      idFlowDb,
      companyId,
      nodes,
      connects,
      nextStage,
      dataWebhook,
      details,
      hashWebhookId,
      pressKey,
      idTicket,
      numberPhrase
    );
    let createFieldJsonName = "";

    const connectStatic = connects;
    if (numberPhrase === "") {
      const nameInput = details.inputs.find(item => item.keyValue === "nome");
      nameInput.data.split(",").map(dataN => {
        const lineToData = details.keysFull.find(item => item === dataN);
        let sumRes = "";
        if (!lineToData) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToData, dataWebhook);
        }
        createFieldJsonName = createFieldJsonName + sumRes;
      });
    } else {
      createFieldJsonName = numberPhrase.name;
    }

    let numberClient = "";

    if (numberPhrase === "") {
      const numberInput = details.inputs.find(
        item => item.keyValue === "celular"
      );

      numberInput.data.split(",").map(dataN => {
        const lineToDataNumber = details.keysFull.find(item => item === dataN);
        let createFieldJsonNumber = "";
        if (!lineToDataNumber) {
          createFieldJsonNumber = dataN;
        } else {
          createFieldJsonNumber = constructJsonLine(
            lineToDataNumber,
            dataWebhook
          );
        }

        numberClient = numberClient + createFieldJsonNumber;
      });
    } else {
      numberClient = numberPhrase.number;
    }

    numberClient = removerNaoLetrasNumeros(numberClient);

    if (numberClient.substring(0, 2) === "55") {
      if (parseInt(numberClient.substring(2, 4)) >= 31) {
        if (numberClient.length === 13) {
          numberClient =
            numberClient.substring(0, 4) + numberClient.substring(5, 13);
        }
      }
    }

    let createFieldJsonEmail = "";

    if (numberPhrase === "") {
      const emailInput = details.inputs.find(item => item.keyValue === "email");
      emailInput.data.split(",").map(dataN => {
        const lineToDataEmail = details.keysFull.find(item =>
          item.endsWith("email")
        );

        let sumRes = "";
        if (!lineToDataEmail) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToDataEmail, dataWebhook);
        }

        createFieldJsonEmail = createFieldJsonEmail + sumRes;
      });
    } else {
      createFieldJsonEmail = numberPhrase.email;
    }

    const lengthLoop = nodes.length;
    const whatsapp = await GetDefaultWhatsApp(whatsappId, companyId);

    if (whatsapp.status !== "CONNECTED") {
      return;
    }

    let execCount = 0;

    let execFn = "";

    let ticket = null;

    let noAlterNext = false;

    for (var i = 0; i < lengthLoop; i++) {

      let nodeSelected: any;
      let ticketInit: Ticket;

      if (pressKey) {
        console.log("UPDATE2...");
        if (pressKey === "parar") {
          console.log("UPDATE3...");
          if (idTicket) {
            console.log("UPDATE4...");
            ticketInit = await Ticket.findOne({
              where: { id: idTicket, whatsappId }
            });
            await ticket.update({
              status: "closed"
            });
          }
          break;
        }

        if (execFn === "") {
          console.log("UPDATE5...");
          nodeSelected = {
            type: "menu"
          };
        } else {
          console.log("UPDATE6...");
          nodeSelected = nodes.filter(node => node.id === execFn)[0];
        }
      } else {
        console.log("UPDATE7...");
        const otherNode = nodes.filter(node => node.id === next)[0];
        if (otherNode) {
          nodeSelected = otherNode;
        }
      }

      if (nodeSelected.type === "message") {

        let msg;

        const webhook = ticket.dataWebhook

        if (webhook && webhook.hasOwnProperty("variables")) {
          msg = {
            body: replaceMessages(webhook, nodeSelected.data.label)
          };
        } else {
          msg = {
            body: nodeSelected.data.label
          };
        }

        await SendMessage(whatsapp, {
          number: numberClient,
          body: msg.body
        });


        //TESTE BOTÃO
        //await SendMessageFlow(whatsapp, {
        //  number: numberClient,
        //  body: msg.body
        //} )
        await intervalWhats("1");
      }
      console.log("273");
      if (nodeSelected.type === "typebot") {
        console.log("275");
        const wbot = getWbot(whatsapp.id);
        await typebotListener({
          wbot: wbot,
          msg,
          ticket,
          typebot: nodeSelected.data.typebotIntegration
        });
      }

      if (nodeSelected.type === "openai") {
        let {
          name,
          prompt,
          voice,
          voiceKey,
          voiceRegion,
          maxTokens,
          temperature,
          apiKey,
          queueId,
          maxMessages
        } = nodeSelected.data.typebotIntegration as IOpenAi;

        let openAiSettings = {
          name,
          prompt,
          voice,
          voiceKey,
          voiceRegion,
          maxTokens: parseInt(maxTokens),
          temperature: parseInt(temperature),
          apiKey,
          queueId: parseInt(queueId),
          maxMessages: parseInt(maxMessages)
        };

        const contact = await Contact.findOne({
          where: { number: numberClient, companyId }
        });

        const wbot = getWbot(whatsapp.id);

        const ticketTraking = await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          userId: null,
          whatsappId: whatsapp?.id
        });

        await handleOpenAi(
          openAiSettings,
          msg,
          wbot,
          ticket,
          contact,
          null,
          ticketTraking
        );
      }

      // ==========================================
      // NÓ DE PERGUNTA (question)
      // ==========================================
      if (nodeSelected.type === "question") {
        const { message, answerKey } = nodeSelected.data.typebotIntegration;
        const ticketDetails = await ShowTicketService(ticket.id, companyId);

        // ✅ Garante que existe dataWebhook
        if (!ticket.dataWebhook || typeof ticket.dataWebhook !== "object") {
          ticket.dataWebhook = { variables: {} };
        }

        // ✅ Zera a variável anterior (evita reuso indevido)
        const oldVars = ticket.dataWebhook.variables || {};
        oldVars[answerKey] = "";

        // ✅ Atualiza o ticket antes de enviar a mensagem
        await ticket.update({
          userId: null,
          companyId,
          lastFlowId: nodeSelected.id,
          hashFlowId: hashWebhookId,
          flowStopped: idFlowDb.toString(),
          dataWebhook: { variables: oldVars }
        });

        // ✅ Envia a pergunta para o usuário
        const bodyFila = formatBody(`${message}`, ticket.contact);
        await delay(3000);
        await typeSimulation(ticket, "composing");

        await SendWhatsAppMessage({
          body: bodyFila,
          ticket: ticketDetails,
          quotedMsg: null
        });

        SetTicketMessagesAsRead(ticketDetails);
        await ticketDetails.update({ lastMessage: bodyFila });

        // ✅ Para a execução até o usuário responder
        break;
      }



      // ==========================================
      // NOVO: Suporte ao nó httpRequest
      // ==========================================
      if (nodeSelected.type === "httpRequest") {
        try {
// ✅ Garante ticket antes de usar
if (!ticket && idTicket) {
  ticket = await Ticket.findOne({
    where: { id: idTicket, companyId }
  });
}

// Se ainda assim não encontrou, cria um contexto temporário
if (!ticket) {
  logger.warn("⚠️ Ticket não encontrado, criando contexto temporário para httpRequest");
  ticket = { dataWebhook: { variables: {} } } as any;
}

          const ti = nodeSelected?.data?.typebotIntegration || {};
          const method = (ti.method || "GET").toUpperCase();
          const answerKey = ti.answerKey || "response";

          // ✅ Prioriza variáveis do parâmetro dataWebhook
          const vars =
            (dataWebhook && dataWebhook.variables)
              ? dataWebhook.variables
              : (ticket?.dataWebhook?.variables || {});

          console.log("🔍 Variáveis ativas disponíveis:", vars);

          // ✅ Substitui variáveis na URL e body
          let endpoint = ti.url || "";
          Object.entries(vars).forEach(([k, v]) => {
            endpoint = endpoint.replace(
              new RegExp(`{{\\s*${k}\\s*}}`, "g"),
              encodeURIComponent(String(v))
            );
          });

          let reqBodyText = ti.body || "";
          Object.entries(vars).forEach(([k, v]) => {
            reqBodyText = reqBodyText.replace(
              new RegExp(`{{\\s*${k}\\s*}}`, "g"),
              String(v)
            );
          });

          let reqBody: any = undefined;
          if (["POST", "PUT", "PATCH"].includes(method)) {
            try {
              reqBody = reqBodyText ? JSON.parse(reqBodyText) : {};
            } catch {
              reqBody = reqBodyText;
            }
          }

          // ✅ Mensagem temporária ao usuário
          const ticketDetails = await ShowTicketService(ticket.id, companyId);
          await typeSimulation(ticket, "composing");
          await SendWhatsAppMessage({
            body: "🔎 Consultando informações...",
            ticket: ticketDetails,
            quotedMsg: null
          });

          // ✅ Executa a requisição HTTP
          const config = {
            timeout: 20000,
            headers: { "Content-Type": "application/json" }
          };
          let responseData: any;

          if (method === "GET") {
            const { data } = await axios.get(endpoint, config);
            responseData = data;
          } else {
            const { data } = await axios({
              url: endpoint,
              method,
              data: reqBody,
              ...config
            });
            responseData = data;
          }

          // ✅ Atualiza ticket e variáveis
          const oldVars = ticket?.dataWebhook?.variables || {};
          const newVars = { ...oldVars, [answerKey]: responseData };
          await ticket.update({ dataWebhook: { variables: newVars } });

          // ✅ Atualiza também no contexto do fluxo
          dataWebhook = { variables: newVars };

          console.log("✅ Consulta HTTP concluída com sucesso:", responseData);
          console.log("🔁 Variáveis propagadas:", newVars);

          await intervalWhats("1");
        } catch (err) {
          logger.error("HTTP Request node error:", err);

          if (ticket) {
            const oldVars = ticket?.dataWebhook?.variables || {};
            await ticket.update({
              dataWebhook: { variables: { ...oldVars, response_error: true } }
            });

            const ticketDetails = await ShowTicketService(ticket.id, companyId);
            await SendWhatsAppMessage({
              body: "❌ Erro ao consultar dados da API.",
              ticket: ticketDetails,
              quotedMsg: null
            });
          } else {
            logger.warn("⚠️ Falha no httpRequest: ticket inexistente ao tentar registrar erro");
          }
        }
      }

      // ✅ COLE AQUI o bloco do "if (nodeSelected.type === 'condition')" que te enviei
      if (nodeSelected.type === "condition") {
        try {
          console.log("➡️ Entrou no nó condition");

          if (!ticket && idTicket) {
            ticket = await Ticket.findOne({ where: { id: idTicket, companyId } });
          }
          if (!ticket) {
            ticket = { dataWebhook: { variables: {} } } as any;
          }

          const vars =
            (dataWebhook && dataWebhook.variables)
              ? dataWebhook.variables
              : (ticket?.dataWebhook?.variables || {});

          const conditions = nodeSelected.data?.conditions || [];
          const outgoing = connects.filter(c => c.source === nodeSelected.id);

          const safeEval = (expr: string, scope: any) => {
            try {
              let parsed = expr;
              parsed = parsed.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
                const path = key.trim().split(".");
                let val: any = scope;
                for (const p of path) {
                  if (val && typeof val === "object" && p in val) val = val[p];
                  else return "undefined";
                }
                return JSON.stringify(val);
              });
              return new Function(`return (${parsed});`)();
            } catch (e) {
              console.log("❌ Erro em safeEval:", e);
              return false;
            }
          };

          let matched = false;
          let nextTarget = "";

          for (let i = 0; i < conditions.length; i++) {
            const cond = conditions[i];
            if (!cond?.expression) continue;

            const result = !!safeEval(cond.expression, vars);
            console.log(`🧠 Condição[${i}] = ${cond.expression} → ${result}`);

            if (result) {
              const byIndex = outgoing.find(e => e.sourceHandle === `cond-${i}`);
              const byTrue = outgoing.find(e => e.sourceHandle === "true");
              const chosen = byIndex || byTrue;

              nextTarget = chosen?.target || nodeSelected.data?.defaultTarget || "";
              matched = true;
              console.log(`✅ Verdadeiro → próximo: ${nextTarget || "(vazio)"}`);
              break;
            }
          }

          if (!matched) {
            const byDefault = outgoing.find(e => e.sourceHandle === "default");
            const byFalse = outgoing.find(e => e.sourceHandle === "false");
            nextTarget = byDefault?.target || byFalse?.target || nodeSelected.data?.defaultTarget || "";
            console.log(`⚙️ Nenhuma condição satisfeita → else: ${nextTarget || "(vazio)"}`);
          }

          next = nextTarget;
          await intervalWhats("1");
        } catch (err) {
          console.error("❌ Erro ao processar nó condition:", err);
        }
        continue;
      }

      if (nodeSelected.type === "ticket") {
        const queueId = nodeSelected.data?.data?.id || nodeSelected.data?.id;
        const queue = await ShowQueueService(queueId, companyId);

        await ticket.update({
          status: "pending",
          queueId: queue.id,
          userId: ticket.userId,
          companyId: companyId,
          flowWebhook: true,
          lastFlowId: nodeSelected.id,
          hashFlowId: hashWebhookId,
          flowStopped: idFlowDb.toString()
        });

        await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          whatsappId: ticket.whatsappId,
          userId: ticket.userId
        });

        await UpdateTicketService({
          ticketData: {
            status: "pending",
            queueId: queue.id
          },
          ticketId: ticket.id,
          companyId
        });

        await CreateLogTicketService({
          ticketId: ticket.id,
          type: "queue",
          queueId: queue.id
        });

        let settings = await CompaniesSettings.findOne({
          where: {
            companyId: companyId
          }
        });

        const enableQueuePosition = settings.sendQueuePosition === "enabled";

        if (enableQueuePosition) {
          const count = await Ticket.findAndCountAll({
            where: {
              userId: null,
              status: "pending",
              companyId,
              queueId: queue.id,
              whatsappId: whatsapp.id,
              isGroup: false
            }
          });

          // Lógica para enviar posição da fila de atendimento
          const qtd = count.count === 0 ? 1 : count.count;

          const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;

          const ticketDetails = await ShowTicketService(ticket.id, companyId);

          const bodyFila = formatBody(`${msgFila}`, ticket.contact);

          await delay(3000);
          await typeSimulation(ticket, "composing");

          await SendWhatsAppMessage({
            body: bodyFila,
            ticket: ticketDetails,
            quotedMsg: null
          });

          SetTicketMessagesAsRead(ticketDetails);

          await ticketDetails.update({
            lastMessage: bodyFila
          });
        }
      }

      if (nodeSelected.type === "singleBlock") {
        for (var iLoc = 0; iLoc < nodeSelected.data.seq.length; iLoc++) {
          const elementNowSelected = nodeSelected.data.seq[iLoc];

          ticket = await Ticket.findOne({
            where: { id: idTicket, companyId }
          });

          if (elementNowSelected.includes("message")) {
            const bodyFor = nodeSelected.data.elements.filter(
              item => item.number === elementNowSelected
            )[0].value;

            const ticketDetails = await ShowTicketService(idTicket, companyId);

            // ✅ Pega as variáveis mais recentes (do contexto atualizado)
            const currentVars =
              (dataWebhook && dataWebhook.variables)
                ? dataWebhook.variables
                : (ticket.dataWebhook?.variables || {});

            let msg = replaceMessages(currentVars, bodyFor);

            await delay(3000);
            await typeSimulation(ticket, "composing");

            await SendWhatsAppMessage({
              body: msg,
              ticket: ticketDetails,
              quotedMsg: null
            });

            SetTicketMessagesAsRead(ticketDetails);

            await ticketDetails.update({
              lastMessage: formatBody(bodyFor, ticket.contact)
            });

            await intervalWhats("1");
          }

          if (elementNowSelected.includes("interval")) {
            await intervalWhats(
              nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].value
            );
          }

          if (elementNowSelected.includes("img")) {
            await typeSimulation(ticket, "composing");
            await SendMessage(whatsapp, {
              number: numberClient,
              body: "",
              mediaPath:
                process.env.BACKEND_URL === "https://localhost:8090"
                  ? `${__dirname.split("src")[0].split("\\").join("/")}public/${nodeSelected.data.elements.filter(
                    item => item.number === elementNowSelected
                  )[0].value
                  }`
                  : `${__dirname
                    .split("dist")[0]
                    .split("\\")
                    .join("/")}public/${nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`
            });
            await intervalWhats("1");
          }

          if (elementNowSelected.includes("audio")) {
            const mediaDirectory =
              process.env.BACKEND_URL === "https://localhost:8090"
                ? `${__dirname.split("src")[0].split("\\").join("/")}public/${nodeSelected.data.elements.filter(
                  item => item.number === elementNowSelected
                )[0].value
                }`
                : `${__dirname
                  .split("dist")[0]
                  .split("\\")
                  .join("/")}public/${nodeSelected.data.elements.filter(
                    item => item.number === elementNowSelected
                  )[0].value
                }`;

            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            await typeSimulation(ticket, "recording");

            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt,
              isRecord: nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].record
            });

            await intervalWhats("1");
          }

          if (elementNowSelected.includes("video")) {
            const mediaDirectory =
              process.env.BACKEND_URL === "https://localhost:8090"
                ? `${__dirname.split("src")[0].split("\\").join("/")}public/${nodeSelected.data.elements.filter(
                  item => item.number === elementNowSelected
                )[0].value
                }`
                : `${__dirname
                  .split("dist")[0]
                  .split("\\")
                  .join("/")}public/${nodeSelected.data.elements.filter(
                    item => item.number === elementNowSelected
                  )[0].value
                }`;

            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            await typeSimulation(ticket, "recording");

            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt
            });

            await intervalWhats("1");
          }
        }
      }


      let isRandomizer: boolean;
      if (nodeSelected.type === "randomizer") {
        const selectedRandom = randomizarCaminho(
          nodeSelected.data.percent / 100
        );

        const resultConnect = connects.filter(
          connect => connect.source === nodeSelected.id
        );
        if (selectedRandom === "A") {
          next = resultConnect.filter(item => item.sourceHandle === "a")[0]
            .target;
          noAlterNext = true;
        } else {
          next = resultConnect.filter(item => item.sourceHandle === "b")[0]
            .target;
          noAlterNext = true;
        }
        isRandomizer = true;
      }

      let isMenu: boolean;

      if (nodeSelected.type === "menu") {
        console.log(650, "menu");
        if (pressKey) {
          const filterOne = connectStatic.filter(
            confil => confil.source === next
          );
          const filterTwo = filterOne.filter(
            filt2 => filt2.sourceHandle === "a" + pressKey
          );
          if (filterTwo.length > 0) {
            execFn = filterTwo[0].target;
          } else {
            execFn = undefined;
          }
          // execFn =
          //   connectStatic
          //     .filter(confil => confil.source === next)
          //     .filter(filt2 => filt2.sourceHandle === "a" + pressKey)[0]?.target ??
          //   undefined;
          if (execFn === undefined) {
            break;
          }
          pressKey = "999";

          const isNodeExist = nodes.filter(item => item.id === execFn);
          console.log(674, "menu");
          if (isNodeExist.length > 0) {
            isMenu = isNodeExist[0].type === "menu" ? true : false;
          } else {
            isMenu = false;
          }
        } else {
          console.log(681, "menu");
          let optionsMenu = "";
          nodeSelected.data.arrayOption.map(item => {
            optionsMenu += `[${item.number}] ${item.value}\n`;
          });

          const menuCreate = `${nodeSelected.data.message}\n\n${optionsMenu}`;

          const webhook = ticket.dataWebhook;

          let msg;
          if (webhook && webhook.hasOwnProperty("variables")) {
            msg = {
              body: replaceMessages(webhook, menuCreate),
              number: numberClient,
              companyId: companyId
            };
          } else {
            msg = {
              body: menuCreate,
              number: numberClient,
              companyId: companyId
            };
          }

          const ticketDetails = await ShowTicketService(ticket.id, companyId);

          const messageData: MessageData = {
            wid: randomString(50),
            ticketId: ticket.id,
            body: msg.body,
            fromMe: true,
            read: true
          };

          //await CreateMessageService({ messageData: messageData, companyId });

          //await SendWhatsAppMessage({ body: bodyFor, ticket: ticketDetails, quotedMsg: null })

          // await SendMessage(whatsapp, {
          //   number: numberClient,
          //   body: msg.body
          // });

          await typeSimulation(ticket, "composing");

          await SendWhatsAppMessage({
            body: msg.body,
            ticket: ticketDetails,
            quotedMsg: null
          });

          SetTicketMessagesAsRead(ticketDetails);

          await ticketDetails.update({
            lastMessage: formatBody(msg.body, ticket.contact)
          });
          await intervalWhats("1");

          if (ticket) {
            ticket = await Ticket.findOne({
              where: {
                id: ticket.id,
                whatsappId: whatsappId,
                companyId: companyId
              }
            });
          } else {
            ticket = await Ticket.findOne({
              where: {
                id: idTicket,
                whatsappId: whatsappId,
                companyId: companyId
              }
            });
          }

          if (ticket) {
            await ticket.update({
              queueId: ticket.queueId ? ticket.queueId : null,
              userId: null,
              companyId: companyId,
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              dataWebhook: dataWebhook,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });
          }

          break;
        }
      }

      let isContinue = false;

      if (pressKey === "999" && execCount > 0) {
        console.log(587, "ActionsWebhookService | 587");

        pressKey = undefined;
        let result = connects.filter(connect => connect.source === execFn)[0];
        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
      } else {
        let result;

        if (isMenu) {
          result = { target: execFn };
          isContinue = true;
          pressKey = undefined;
        } else if (isRandomizer) {
          isRandomizer = false;
          result = next;
        } else {
          result = connects.filter(connect => connect.source === next)[0];
        }

        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
        console.log(619, "ActionsWebhookService");
      }

      if (!pressKey && !isContinue) {
        const nextNode = connects.filter(
          connect => connect.source === nodeSelected.id
        ).length;

        console.log(626, "ActionsWebhookService");

        if (nextNode === 0) {
          console.log(654, "ActionsWebhookService");

          await Ticket.findOne({
            where: { id: idTicket, whatsappId, companyId: companyId }
          });
          await ticket.update({
            lastFlowId: nodeSelected.id,
            hashFlowId: null,
            flowWebhook: false,
            flowStopped: idFlowDb.toString()
          });
          break;
        }
      }

      isContinue = false;

      if (next === "") {
        break;
      }

      console.log(678, "ActionsWebhookService");

      console.log("UPDATE10...");
      ticket = await Ticket.findOne({
        where: { id: idTicket, whatsappId, companyId: companyId }
      });

      if (ticket.status === "closed") {
        io.of(String(companyId))
          // .to(oldStatus)
          // .to(ticketId.toString())
          .emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticketId: ticket.id
          });
      }

      console.log("UPDATE12...");
      await ticket.update({
        whatsappId: whatsappId,
        queueId: ticket?.queueId,
        userId: null,
        companyId: companyId,
        flowWebhook: true,
        lastFlowId: nodeSelected.id,
        hashFlowId: hashWebhookId,
        flowStopped: idFlowDb.toString()
      });

      noAlterNext = false;
      execCount++;
    }

    return "ds";
  } catch (error) {
    logger.error(error);
  }
};

const constructJsonLine = (line: string, json: any) => {
  let valor = json;
  const chaves = line.split(".");

  if (chaves.length === 1) {
    return valor[chaves[0]];
  }

  for (const chave of chaves) {
    valor = valor[chave];
  }
  return valor;
};

function removerNaoLetrasNumeros(texto: string) {
  // Substitui todos os caracteres que não são letras ou números por vazio
  return texto.replace(/[^a-zA-Z0-9]/g, "");
}

const sendMessageWhats = async (
  whatsId: number,
  msg: any,
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
) => {
  sendMessageFlow(whatsId, msg, req);
  return Promise.resolve();
};

const intervalWhats = (time: string) => {
  const seconds = parseInt(time) * 1000;
  return new Promise(resolve => setTimeout(resolve, seconds));
};

const replaceMessages = (variables: any, message: string): string => {
  if (!variables || typeof variables !== "object" || !message) return message;

  // 🔹 Cria um mapa plano de todas as variáveis aninhadas
  const flatten = (obj: any, prefix = "", res: any = {}) => {
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(value)) {
        value.forEach((v, i) => {
          if (typeof v === "object" && v !== null) {
            flatten(v, `${newKey}[${i}]`, res);
          } else {
            res[`${newKey}[${i}]`] = v;
          }
        });
      } else if (typeof value === "object" && value !== null) {
        flatten(value, newKey, res);
      } else {
        res[newKey] = value;
      }
    }
    return res;
  };

  const flatVars = flatten(variables);

  // 🔹 Substitui {{variavel}} e {{variavel|valorPadrao}} no texto
  message = message.replace(/{{\s*([^{}\s|]+)(?:\|([^{}\s]+))?\s*}}/g, (match, key, fallback) => {
    const val = flatVars[key];
    return val !== undefined && val !== null && val !== ""
      ? String(val)
      : fallback !== undefined
      ? fallback
      : match;
  });

  // 🔹 Suporte para blocos {{#each array}} ... {{/each}}
  message = message.replace(
    /{{#each\s+([\w.\[\]]+)}}([\s\S]*?){{\/each}}/g,
    (match, arrayKey, innerTemplate) => {
      const arr = getNestedValue(variables, arrayKey);
      if (!Array.isArray(arr)) return "";
      return arr
        .map(item => {
          const localVars = { ...variables, this: item };
          return replaceMessages(localVars, innerTemplate);
        })
        .join("");
    }
  );

  return message;
};

// 🔹 Função auxiliar para buscar valores com notação ponto ou colchetes
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || typeof obj !== "object") return undefined;
  const parts = path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  return parts.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};


const replaceMessagesOld = (
  message: string,
  details: any,
  dataWebhook: any,
  dataNoWebhook?: any
) => {
  const matches = message.match(/\{([^}]+)\}/g);

  if (dataWebhook) {
    let newTxt = message.replace(/{+nome}+/, dataNoWebhook.nome);
    newTxt = newTxt.replace(/{+numero}+/, dataNoWebhook.numero);
    newTxt = newTxt.replace(/{+email}+/, dataNoWebhook.email);
    return newTxt;
  }

  if (matches && matches.includes("inputs")) {
    const placeholders = matches.map(match => match.replace(/\{|\}/g, ""));
    let newText = message;
    placeholders.map(item => {
      const value = details["inputs"].find(
        itemLocal => itemLocal.keyValue === item
      );
      const lineToData = details["keysFull"].find(itemLocal =>
        itemLocal.endsWith(`.${value.data}`)
      );
      const createFieldJson = constructJsonLine(lineToData, dataWebhook);
      newText = newText.replace(`{${item}}`, createFieldJson);
    });
    return newText;
  } else {
    return message;
  }
};
