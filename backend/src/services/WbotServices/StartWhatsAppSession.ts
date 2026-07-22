import { initWASocket } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import logger from "../../utils/logger";
import * as Sentry from "@sentry/node";
import evolutionConfig from "../../config/evolution";
import { initEvolutionSession } from "../../libs/evolution/EvolutionSession";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp,
  companyId: number
): Promise<void> => {
  await whatsapp.update({ status: "OPENING" });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-whatsappSession`, {
      action: "update",
      session: whatsapp
    });

  // Engine Evolution-GO (quando habilitada): a conexao/QR e o inbound sao
  // geridos pela Evolution via webhook — nao usa wbotMessageListener/wbotMonitor.
  if (evolutionConfig.enabled) {
    try {
      await initEvolutionSession(whatsapp);
    } catch (err) {
      Sentry.captureException(err);
      logger.error(`[evolution] StartWhatsAppSession: ${err}`);
    }
    return;
  }

  try {
    const wbot = await initWASocket(whatsapp);

    if (wbot.id) {
      wbotMessageListener(wbot, companyId);
      wbotMonitor(wbot, whatsapp, companyId);
    }
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
  }
};
