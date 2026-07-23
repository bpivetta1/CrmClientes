// Recebe os webhooks da Evolution-GO e injeta as mensagens no pipeline existente
// do WhaTicket (handleMessage), traduzindo o formato whatsmeow (data.Info +
// data.Message) para o proto.IWebMessageInfo que a Baileys/handleMessage usa.
//
// Eventos (categorias reais): MESSAGE, READ_RECEIPT, CONNECTION.
// QR/conexão são geridos por polling em EvolutionSession; aqui tratamos MESSAGE
// (inbound) e, como reforço, mudanças de conexão que cheguem via webhook.

import { Request, Response } from "express";
import Whatsapp from "../models/Whatsapp";
import { getIO } from "../libs/socket";
import { getWbot } from "../libs/wbot";
import { handleMessage, handleMsgAck } from "../services/WbotServices/wbotMessageListener";
import logger from "../utils/logger";

const emitSession = (companyId: number, session: Whatsapp) => {
  getIO()
    .of(String(companyId))
    .emit(`company-${companyId}-whatsappSession`, { action: "update", session });
};

// whatsmeow data.Info + data.Message -> proto.IWebMessageInfo (formato Baileys).
// Os nomes dos campos em Message (conversation, extendedTextMessage, imageMessage
// ...) são iguais nos dois (ambos são o proto waE2E do WhatsApp).
const toIWebMessageInfo = (data: any): any => {
  const info = data?.Info || {};
  const ts = info.Timestamp
    ? Math.floor(new Date(info.Timestamp).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  return {
    key: {
      id: info.ID,
      remoteJid: info.Chat,
      fromMe: !!info.IsFromMe,
      participant: info.IsGroup ? info.Sender : undefined
    },
    message: data?.Message || {},
    pushName: info.PushName || "",
    messageTimestamp: ts
  };
};

export const handleEvolutionWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { event, data } = req.body || {};
  const ev = String(event || "").toUpperCase();

  const whatsapp = await Whatsapp.findByPk(whatsappId);
  if (!whatsapp) return res.status(200).json({ ignored: true });
  const companyId = whatsapp.companyId;

  try {
    if (ev.startsWith("MESSAGE")) {
      // log do payload real (ajuda a validar mídia/edge cases)
      logger.info(`[evolution][inbound][wpp:${whatsappId}] ${JSON.stringify(data).slice(0, 3000)}`);
      try {
        const wbot = getWbot(Number(whatsappId));
        const mapped = toIWebMessageInfo(data);
        if (mapped.key?.id) {
          await handleMessage(mapped, wbot as any, companyId);
        }
      } catch (err) {
        logger.error(`[evolution] handleMessage falhou wpp:${whatsappId}: ${err}`);
      }
    } else if (ev.includes("CONNECT") || ev.includes("QR") || ev.includes("LOGGED") || ev.includes("PAIR")) {
      // reforço à detecção por polling
      const connected = data?.Connected || data?.status === "connected" || ev.includes("CONNECTED");
      if (ev.includes("LOGGED")) {
        // DISCONNECTED (não PENDING): o frontend renderiza o botão
        // "Tentar novamente" para DISCONNECTED; PENDING não renderiza nada.
        await whatsapp.update({ status: "DISCONNECTED", session: "", qrcode: "" });
        emitSession(companyId, whatsapp);
      } else if (connected) {
        // jid "5527999999999:2@s.whatsapp.net" → número sem sufixo de device
        const number =
          (data?.jid || "").split("@")[0].split(":")[0] || whatsapp.number || "";
        await whatsapp.update({ status: "CONNECTED", qrcode: "", retries: 0, number });
        emitSession(companyId, whatsapp);
      }
    } else if (ev.includes("READ") || ev.includes("RECEIPT") || ev.includes("ACK")) {
      // Recibos de entrega/leitura → atualiza o ACK (checkmarks) no chat.
      // whatsmeow: Type ""/"delivery"=entregue(2), "read"/"read-self"=lido(3),
      // "played"=áudio ouvido(5). IDs em MessageIDs (ou MessageID/Ids).
      logger.info(`[evolution][receipt][wpp:${whatsappId}] ${JSON.stringify(data).slice(0, 800)}`);
      const type = String(data?.Type || data?.type || "").toLowerCase();
      let ack = 2;
      if (type.includes("read")) ack = 3;
      else if (type.includes("play")) ack = 5;
      const ids: string[] =
        data?.MessageIDs || data?.MessageIds || data?.Ids ||
        (data?.MessageID ? [data.MessageID] : []) || [];
      for (const id of ids) {
        try {
          await handleMsgAck({ key: { id } } as any, ack);
        } catch (e) {
          logger.warn(`[evolution] handleMsgAck ${id}: ${e}`);
        }
      }
    } else {
      logger.debug(`[evolution] evento não tratado: ${event}`);
    }
  } catch (err) {
    logger.error(`[evolution] erro no webhook ${event}: ${err}`);
  }

  return res.status(200).json({ ok: true });
};
