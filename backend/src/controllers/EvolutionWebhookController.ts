// Recebe os webhooks da Evolution-GO e traduz para o comportamento que o
// WhaTicket já tem (atualiza o Whatsapp + emite no socket), espelhando o que a
// libs/wbot.ts faz no connection.update da Baileys.
//
// Eventos de status: QRCode, Connected/PairSuccess, LoggedOut.
// Evento "Message" (inbound): Fase 4 — por enquanto loga o payload REAL para
// fecharmos o parser com certeza (sem adivinhação) assim que chegar mensagem.

import { Request, Response } from "express";
import Whatsapp from "../models/Whatsapp";
import { getIO } from "../libs/socket";
import logger from "../utils/logger";

const emitSession = (companyId: number, session: Whatsapp) => {
  getIO()
    .of(String(companyId))
    .emit(`company-${companyId}-whatsappSession`, { action: "update", session });
};

export const handleEvolutionWebhook = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { event, data } = req.body || {};

  const whatsapp = await Whatsapp.findByPk(whatsappId);
  if (!whatsapp) {
    // responde 2xx mesmo assim para a Evolution não ficar retransmitindo
    return res.status(200).json({ ignored: true });
  }
  const companyId = whatsapp.companyId;

  try {
    switch (event) {
      case "QRCode": {
        // data.code = string do QR (o front renderiza igual ao Baileys)
        await whatsapp.update({ qrcode: data?.code || "", status: "qrcode", retries: 0, number: "" });
        emitSession(companyId, whatsapp);
        break;
      }

      case "Connected":
      case "PairSuccess": {
        const number = (data?.jid || "").split("@")[0] || whatsapp.number || "";
        await whatsapp.update({ status: "CONNECTED", qrcode: "", retries: 0, number });
        emitSession(companyId, whatsapp);
        break;
      }

      case "LoggedOut": {
        await whatsapp.update({ status: "PENDING", session: "", qrcode: "" });
        emitSession(companyId, whatsapp);
        break;
      }

      case "Message": {
        // Fase 4 (inbound): logar o payload real e encaminhar ao pipeline.
        logger.info(`[evolution][inbound][wpp:${whatsappId}] ${JSON.stringify(data).slice(0, 4000)}`);
        // TODO Fase 4: mapear data.Info -> key{id,remoteJid,fromMe,participant} +
        // data.Message e chamar handleMessage(adaptedMsg, getWbot(whatsappId), companyId).
        break;
      }

      default:
        logger.debug(`[evolution] evento não tratado: ${event}`);
    }
  } catch (err) {
    logger.error(`[evolution] erro tratando webhook ${event}: ${err}`);
  }

  return res.status(200).json({ ok: true });
};
