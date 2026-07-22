// Adapter que faz a Evolution-GO "parecer" uma sessão Baileys (wbot).
// Expõe o subconjunto de métodos que o WhaTicket chama em wbot.* e traduz
// para chamadas REST da Evolution. Assim os Send*Services e helpers seguem
// inalterados. Registrado no mesmo `sessions[]` via addWbotSession.
//
// Fase 2/3: conexão/QR + envio (texto/mídia/link/contato).
// Métodos de baixo nível da Baileys sem equivalente na Evolution
// (relayMessage/upsertMessage/waUploadToServer/updateMediaMessage) lançam erro
// claro — são usados só em editar/encaminhar (Fase 5).

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";
import logger from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";
import { evolutionClient, EvolutionMediaType } from "./EvolutionClient";
import { addWbotSession } from "../wbot";

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
const backendUrl = (process.env.BACKEND_URL || "").replace(/\/+$/, "");

// eventos que queremos receber no webhook (nomes do whatsmeow/Evolution)
const SUBSCRIBE_EVENTS = [
  "Message",
  "QRCode",
  "PairSuccess",
  "Connected",
  "LoggedOut",
  "ReadReceipt",
  "OfflineSyncCompleted"
];

// grava um buffer no /public e devolve a URL pública (Evolution baixa por URL)
const hostBuffer = (buffer: Buffer, mimetype?: string, fileName?: string): string => {
  const ext =
    (fileName && path.extname(fileName)) ||
    (mimetype ? `.${mime.extension(mimetype) || "bin"}` : ".bin");
  const name = `evo_${Date.now()}_${uuidv4().slice(0, 8)}${ext}`;
  // ponytail: sem limpeza automática destes arquivos enviados; adicionar um
  // cron de expurgo se o volume /public crescer demais.
  fs.writeFileSync(path.join(publicFolder, name), buffer);
  return `${backendUrl}/public/${name}`;
};

const mapMediaType = (content: any): { type: EvolutionMediaType; buffer: Buffer; mimetype?: string; fileName?: string; caption?: string; ptt?: boolean } | null => {
  if (content.image) return { type: "image", buffer: content.image, mimetype: content.mimetype, fileName: content.fileName, caption: content.caption };
  if (content.video) return { type: "video", buffer: content.video, mimetype: content.mimetype, fileName: content.fileName, caption: content.caption };
  if (content.audio) return { type: "audio", buffer: content.audio, mimetype: content.mimetype || "audio/mpeg", fileName: content.fileName, ptt: content.ptt };
  if (content.document) return { type: "document", buffer: content.document, mimetype: content.mimetype, fileName: content.fileName, caption: content.caption };
  return null;
};

export interface EvolutionSessionType {
  id: number;
  instanceId: string;
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
}

// Cria a sessão-adapter para um Whatsapp e a registra em sessions[].
export const initEvolutionSession = async (whatsapp: Whatsapp): Promise<EvolutionSessionType> => {
  const instanceId = `whaticket-${whatsapp.id}`;
  const webhookUrl = `${backendUrl}/evolution/webhook/${whatsapp.id}`;

  // cria a instância (idempotente do lado da Evolution — ignora se já existe)
  try {
    await evolutionClient.createInstance({
      instanceId,
      name: whatsapp.name || instanceId,
      token: instanceId
    });
  } catch (err: any) {
    logger.warn(`[evolution] createInstance ${instanceId}: ${err?.response?.status || err?.message}`);
  }

  // conecta e registra o webhook + eventos assinados
  await evolutionClient.connectInstance(instanceId, {
    webhookUrl,
    subscribe: SUBSCRIBE_EVENTS,
    immediate: true
  });

  const session: EvolutionSessionType = {
    id: whatsapp.id,
    instanceId,
    type: "md",
    user: { id: whatsapp.number ? `${whatsapp.number}@s.whatsapp.net` : "" },

    async sendMessage(jid: string, content: any, options: any = {}) {
      const quoted =
        options?.quoted?.key?.id
          ? { messageId: options.quoted.key.id, participant: options.quoted.key.participant }
          : undefined;

      // texto
      if (typeof content.text === "string") {
        const res = await evolutionClient.sendText(instanceId, {
          number: jid,
          text: content.text,
          quoted
        });
        return toWAMessage(res, jid, content.text);
      }

      // mídia
      const media = mapMediaType(content);
      if (media) {
        const url = hostBuffer(media.buffer, media.mimetype, media.fileName);
        const res = await evolutionClient.sendMedia(instanceId, {
          number: jid,
          url,
          type: media.type,
          caption: media.caption,
          filename: media.fileName,
          quoted
        });
        return toWAMessage(res, jid, media.caption || "");
      }

      // contato (vCard)
      if (content.contacts) {
        // ponytail: /send/contact existe mas o payload exato não está no swagger;
        // por ora manda o vCard como texto (não quebra o fluxo). Ajustar na Fase 5.
        const vcardText = content.contacts?.contacts?.[0]?.vcard || content.contacts?.displayName || "";
        const res = await evolutionClient.sendText(instanceId, { number: jid, text: vcardText });
        return toWAMessage(res, jid, vcardText);
      }

      throw new Error("[evolution] tipo de conteúdo não suportado no sendMessage");
    },

    async onWhatsApp(jid: string) {
      // ponytail: endpoint de verificação de número não confirmado no swagger;
      // assume existência para não bloquear o fluxo até validarmos.
      const number = jid.replace(/@.*$/, "");
      return [{ jid: `${number}@s.whatsapp.net`, exists: true }];
    },

    async profilePictureUrl() {
      return undefined as unknown as string;
    },

    async presenceSubscribe() {
      /* no-op — presença é opcional */
    },

    async sendPresenceUpdate() {
      /* no-op */
    },

    async readMessages(keys: any[]) {
      try {
        for (const k of keys || []) {
          await evolutionClient.markRead(instanceId, { messageId: k?.id, chat: k?.remoteJid });
        }
      } catch (err: any) {
        logger.warn(`[evolution] markRead: ${err?.message}`);
      }
    },

    async updateBlockStatus() {
      /* ponytail: mapear para endpoint de bloqueio quando confirmado (Fase 5) */
    },

    async logout() {
      try {
        await evolutionClient.logout(instanceId);
      } catch (err: any) {
        logger.warn(`[evolution] logout: ${err?.message}`);
      }
    },

    ws: { close: () => { /* no-op: conexão é gerida pela Evolution */ } },
    ev: { on: () => { /* eventos chegam via webhook */ }, removeAllListeners: () => {} }
  };

  addWbotSession(session);
  return session;
};

// monta um objeto no formato WAMessage que os callers esperam ler (key.id, message)
const toWAMessage = (res: any, jid: string, text: string) => {
  const id = res?.id || res?.key?.id || res?.data?.id || uuidv4();
  return {
    key: { id, remoteJid: jid, fromMe: true },
    message: { conversation: text },
    messageTimestamp: Math.floor(Date.now() / 1000),
    status: 1
  };
};
