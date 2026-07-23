import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";
import logger from "../../utils/logger";
import * as Sentry from "@sentry/node";
import { initEvolutionSession } from "../../libs/evolution/EvolutionSession";

// Engine WhatsApp = Evolution-GO (Baileys removido como engine).
// A conexão/QR e o inbound são geridos pela Evolution (polling + webhook);
// não há mais socket Baileys nem wbotMessageListener/wbotMonitor.
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

  try {
    await initEvolutionSession(whatsapp);
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(
      `[evolution] StartWhatsAppSession wpp:${whatsapp.id}: ${err?.message} ${JSON.stringify(err?.response?.data || "")}`
    );
    // não deixa a UI presa em "Conectando" — marca desconectado e avisa o front
    await whatsapp.update({ status: "DISCONNECTED", qrcode: "" });
    io.of(String(companyId))
      .emit(`company-${companyId}-whatsappSession`, {
        action: "update",
        session: whatsapp
      });
  }
};
