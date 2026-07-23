// Adapter que faz a Evolution-GO "parecer" uma sessão Baileys (wbot).
// Expõe o subconjunto de métodos que o WhaTicket chama em wbot.* e traduz para
// REST da Evolution, mantendo Send*Services e helpers inalterados.
//
// Auth por instância = header apikey com o TOKEN da instância (determinístico
// por Whatsapp). QR/conexão via POLLING (/instance/qr + /instance/status);
// inbound de mensagens via webhook (EvolutionWebhookController).

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";
import logger from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../socket";
import { evolutionClient, EvolutionMediaType } from "./EvolutionClient";
import evolutionConfig from "../../config/evolution";
import { addWbotSession, removeWbotSession } from "../wbot";

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
const backendUrl = (process.env.BACKEND_URL || "").replace(/\/+$/, "");

const SUBSCRIBE_EVENTS = ["MESSAGE", "READ_RECEIPT", "CONNECTION"];
const QR_POLL_MS = 4000;
const QR_MAX_TICKS = 30; // ~2 min tentando parear antes de desistir

// Token determinístico por instância (não precisa persistir). Deriva de id +
// segredo do ambiente; o servidor Evolution aceita o token que enviamos.
export const evolutionTokenFor = (whatsapp: Whatsapp): string => {
  const secret = process.env.JWT_SECRET || process.env.MASTER_KEY || "whaticket";
  const h = crypto
    .createHash("sha256")
    .update(`${whatsapp.id}:${whatsapp.companyId}:${secret}`)
    .digest("hex")
    .slice(0, 24);
  return `wt-${whatsapp.id}-${h}`;
};

const emitSession = (companyId: number, whatsapp: Whatsapp) => {
  getIO()
    .of(String(companyId))
    .emit(`company-${companyId}-whatsappSession`, { action: "update", session: whatsapp });
};

// grava um buffer no /public e devolve a URL pública (Evolution baixa por URL)
const hostBuffer = (buffer: Buffer, mimetype?: string, fileName?: string): string => {
  const ext =
    (fileName && path.extname(fileName)) ||
    (mimetype ? `.${mime.extension(mimetype) || "bin"}` : ".bin");
  const name = `evo_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`;
  // ponytail: sem expurgo automático destes arquivos enviados; adicionar cron se crescer.
  fs.writeFileSync(path.join(publicFolder, name), buffer);
  return `${backendUrl}/public/${name}`;
};

const mapMediaType = (content: any) => {
  if (content.image) return { type: "image" as EvolutionMediaType, buffer: content.image, mimetype: content.mimetype, fileName: content.fileName, caption: content.caption };
  if (content.video) return { type: "video" as EvolutionMediaType, buffer: content.video, mimetype: content.mimetype, fileName: content.fileName, caption: content.caption };
  if (content.audio) return { type: "audio" as EvolutionMediaType, buffer: content.audio, mimetype: content.mimetype || "audio/mpeg", fileName: content.fileName };
  if (content.document) return { type: "document" as EvolutionMediaType, buffer: content.document, mimetype: content.mimetype, fileName: content.fileName, caption: content.caption };
  return null;
};

// monta um objeto no formato WAMessage que os callers esperam ler
const toWAMessage = (res: any, jid: string, text: string) => {
  const id = res?.data?.id || res?.id || res?.key?.id || uuidv4();
  return {
    key: { id, remoteJid: jid, fromMe: true },
    message: { conversation: text },
    messageTimestamp: Math.floor(Date.now() / 1000),
    status: 1
  };
};

export interface EvolutionSessionType {
  id: number;
  token: string;
  type: string;
  user?: { id: string };
  sendMessage: (jid: string, content: any, options?: any) => Promise<any>;
  onWhatsApp: (jid: string) => Promise<Array<{ jid: string; exists: boolean }>>;
  profilePictureUrl: (jid: string, type?: string) => Promise<string>;
  presenceSubscribe: (jid: string) => Promise<void>;
  sendPresenceUpdate: (type: string, jid?: string) => Promise<void>;
  readMessages: (keys: any[]) => Promise<void>;
  updateBlockStatus: (jid: string, action: "block" | "unblock") => Promise<void>;
  logout: () => Promise<void>;
  ws: { close: () => void };
  ev: { on: () => void; removeAllListeners: () => void };
  _qrPoller?: NodeJS.Timeout;
}

export const initEvolutionSession = async (whatsapp: Whatsapp): Promise<EvolutionSessionType> => {
  if (!evolutionConfig.apiKey) {
    throw new Error("EVOLUTION_API_KEY não configurada no backend (defina no Coolify)");
  }
  if (!backendUrl) {
    throw new Error("BACKEND_URL não configurada (necessária para o webhook da Evolution)");
  }

  const token = evolutionTokenFor(whatsapp);
  const instanceName = `whaticket-${whatsapp.companyId}-${whatsapp.id}`;
  const webhookUrl = `${backendUrl}/evolution/webhook/${whatsapp.id}`;
  const companyId = whatsapp.companyId;

  // cria a instância (idempotente — ignora se já existe) e conecta com webhook
  try {
    await evolutionClient.createInstance({ name: instanceName, token });
  } catch (err: any) {
    logger.warn(
      `[evolution] createInstance ${instanceName}: ${err?.response?.status || err?.message} ${JSON.stringify(err?.response?.data || "")}`
    );
  }
  try {
    await evolutionClient.connectInstance(token, {
      webhookUrl,
      subscribe: SUBSCRIBE_EVENTS,
      immediate: true
    });
  } catch (err: any) {
    logger.error(
      `[evolution] connectInstance ${instanceName}: ${err?.response?.status || err?.message} ${JSON.stringify(err?.response?.data || "")}`
    );
    throw err;
  }

  const session: EvolutionSessionType = {
    id: whatsapp.id,
    token,
    type: "md",
    user: { id: whatsapp.number ? `${whatsapp.number}@s.whatsapp.net` : "" },

    async sendMessage(jid: string, content: any, options: any = {}) {
      const quoted =
        options?.quoted?.key?.id
          ? { messageId: options.quoted.key.id, participant: options.quoted.key.participant }
          : undefined;

      if (typeof content.text === "string") {
        const res = await evolutionClient.sendText(token, { number: jid, text: content.text, quoted });
        return toWAMessage(res, jid, content.text);
      }

      const media = mapMediaType(content);
      if (media) {
        const url = hostBuffer(media.buffer, media.mimetype, media.fileName);
        const res = await evolutionClient.sendMedia(token, {
          number: jid, url, type: media.type, caption: media.caption, filename: media.fileName, quoted
        });
        return toWAMessage(res, jid, media.caption || "");
      }

      if (content.contacts) {
        // ponytail: /send/contact existe mas payload não documentado; envia vCard
        // como texto por ora (não quebra o fluxo). Ajustar na Fase 5.
        const vcardText = content.contacts?.contacts?.[0]?.vcard || content.contacts?.displayName || "";
        const res = await evolutionClient.sendText(token, { number: jid, text: vcardText });
        return toWAMessage(res, jid, vcardText);
      }

      throw new Error("[evolution] tipo de conteúdo não suportado no sendMessage");
    },

    async onWhatsApp(jid: string) {
      // ponytail: verificação de número não confirmada no swagger; assume existência.
      const number = jid.replace(/@.*$/, "");
      return [{ jid: `${number}@s.whatsapp.net`, exists: true }];
    },

    async profilePictureUrl() {
      return undefined as unknown as string;
    },
    async presenceSubscribe() { /* opcional */ },
    async sendPresenceUpdate() { /* opcional */ },

    async readMessages(keys: any[]) {
      try {
        for (const k of keys || []) {
          await evolutionClient.markRead(token, { messageId: k?.id, chat: k?.remoteJid });
        }
      } catch (err: any) {
        logger.warn(`[evolution] markRead: ${err?.message}`);
      }
    },

    async updateBlockStatus() { /* Fase 5 */ },

    async logout() {
      if (session._qrPoller) clearInterval(session._qrPoller);
      try {
        await evolutionClient.logout(token);
      } catch (err: any) {
        logger.warn(`[evolution] logout: ${err?.message}`);
      }
    },

    ws: { close: () => { if (session._qrPoller) clearInterval(session._qrPoller); } },
    ev: { on: () => { /* eventos via webhook */ }, removeAllListeners: () => {} }
  };

  addWbotSession(session);
  startQrPolling(session, whatsapp);
  return session;
};

// Polling de QR + status: a Evolution entrega o QR por polling (não webhook).
// Atualiza whatsapp.qrcode (string crua, compatível com o front) até conectar.
const startQrPolling = (session: EvolutionSessionType, whatsapp: Whatsapp) => {
  const companyId = whatsapp.companyId;
  let ticks = 0;

  session._qrPoller = setInterval(async () => {
    ticks += 1;
    try {
      const status = await evolutionClient.getStatus(session.token);
      // IMPORTANTE: Connected=true significa apenas "websocket aberto aguardando
      // QR scan". Pareado de verdade é somente LoggedIn=true.
      const loggedIn = !!status?.data?.LoggedIn;
      if (loggedIn) {
        clearInterval(session._qrPoller);
        session._qrPoller = undefined;
        // o número real chega pelo webhook "Connected" (data.jid)
        await whatsapp.update({ status: "CONNECTED", qrcode: "", retries: 0 });
        session.user = { id: whatsapp.number ? `${whatsapp.number}@s.whatsapp.net` : "" };
        emitSession(companyId, whatsapp);
        return;
      }

      // ainda não conectado → busca/atualiza o QR
      const qr = await evolutionClient.getQr(session.token);
      const rawCode: string = qr?.data?.code || "";
      // "https://wa.me/settings/linked_devices#2@..." → usa a parte após '#'
      const code = rawCode.includes("#") ? rawCode.split("#").pop() : rawCode;
      if (code && code !== whatsapp.qrcode) {
        await whatsapp.update({ qrcode: code, status: "qrcode", retries: 0, number: "" });
        emitSession(companyId, whatsapp);
      }
    } catch (err: any) {
      logger.warn(`[evolution] qrPoll wpp:${whatsapp.id}: ${err?.response?.status || err?.message}`);
    }

    if (ticks >= QR_MAX_TICKS) {
      clearInterval(session._qrPoller);
      session._qrPoller = undefined;
      await whatsapp.update({ status: "DISCONNECTED", qrcode: "" });
      emitSession(companyId, whatsapp);
    }
  }, QR_POLL_MS);
};

export const stopEvolutionSession = (whatsappId: number, session?: EvolutionSessionType) => {
  if (session?._qrPoller) clearInterval(session._qrPoller);
  removeWbotSession(whatsappId);
};

// Exclui a instância correspondente no servidor Evolution (chamado quando a
// conexão é excluída no CRM — evita instâncias órfãs acumulando).
// Acha o UUID via /instance/all (nome determinístico), faz logout e delete.
export const deleteEvolutionInstance = async (whatsapp: { id: number; companyId: number }): Promise<void> => {
  const instanceName = `whaticket-${whatsapp.companyId}-${whatsapp.id}`;
  const token = evolutionTokenFor(whatsapp as Whatsapp);
  try {
    const all = await evolutionClient.listInstances();
    const found = (all?.data || []).find(
      (i: any) => i?.name === instanceName || i?.token === token
    );
    if (!found?.id) {
      logger.warn(`[evolution] deleteInstance: ${instanceName} não encontrada no servidor`);
      return;
    }
    try {
      await evolutionClient.logout(found.token || token);
    } catch (e: any) {
      logger.warn(`[evolution] logout pré-delete ${instanceName}: ${e?.response?.status || e?.message}`);
    }
    await evolutionClient.deleteInstance(found.id);
    logger.info(`[evolution] instância ${instanceName} (${found.id}) excluída`);
  } catch (err: any) {
    logger.error(
      `[evolution] deleteInstance ${instanceName}: ${err?.response?.status || err?.message} ${JSON.stringify(err?.response?.data || "")}`
    );
  }
};
