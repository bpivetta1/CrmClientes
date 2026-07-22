// Cliente REST da Evolution-GO API.
// Contrato confirmado via swagger (https://evolution-go.nefo.pro/swagger/doc.json)
// e docs.evolutionfoundation.com.br/evolution-go.
//
// Auth: header `apikey` (chave global) + `instanceId` para chamadas por instância.
// ponytail: a identificação exata da instância no envio/QR (header vs query) não
// aparece nos parâmetros do swagger — está centralizada aqui em `scoped()`; se a
// API live exigir query/path, muda-se só neste método.

import axios, { AxiosInstance } from "axios";
import evolutionConfig from "../../config/evolution";

export type EvolutionMediaType = "image" | "video" | "audio" | "document";

export interface EvoQuoted {
  messageId: string;
  participant?: string;
}

export interface SendTextParams {
  number: string;
  text: string;
  delay?: number;
  quoted?: EvoQuoted;
  mentionedJid?: string[];
}

export interface SendMediaParams {
  number: string;
  url: string;
  type: EvolutionMediaType;
  caption?: string;
  filename?: string;
  delay?: number;
  quoted?: EvoQuoted;
}

export interface SendLinkParams {
  number: string;
  url: string;
  text?: string;
  title?: string;
  description?: string;
  imgUrl?: string;
}

export interface CreateInstanceParams {
  instanceId: string;
  name: string;
  token?: string;
  advancedSettings?: Record<string, unknown>;
}

export interface ConnectInstanceParams {
  webhookUrl: string;
  subscribe?: string[];
  immediate?: boolean;
  phone?: string;
}

// Normaliza um destino para o formato que a Evolution espera (só dígitos, sem
// sufixo de JID). Grupos mantêm o JID completo (contêm "@g.us").
export const normalizeNumber = (raw: string): string => {
  if (!raw) return raw;
  if (raw.includes("@g.us")) return raw; // grupo: mantém o JID
  return raw.replace(/@.*$/, "").replace(/\D/g, "");
};

class EvolutionClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: evolutionConfig.baseUrl,
      timeout: evolutionConfig.timeout,
      headers: { apikey: evolutionConfig.apiKey }
    });
  }

  // headers para chamadas escopadas em uma instância
  private scoped(instanceId: string) {
    return { headers: { instanceId } };
  }

  // ---- Instância -------------------------------------------------------
  createInstance(params: CreateInstanceParams) {
    return this.http.post("/instance/create", params).then(r => r.data);
  }

  connectInstance(instanceId: string, params: ConnectInstanceParams) {
    return this.http
      .post("/instance/connect", params, this.scoped(instanceId))
      .then(r => r.data);
  }

  getQr(instanceId: string) {
    return this.http.get("/instance/qr", this.scoped(instanceId)).then(r => r.data);
  }

  getStatus(instanceId: string) {
    return this.http
      .get("/instance/status", this.scoped(instanceId))
      .then(r => r.data);
  }

  logout(instanceId: string) {
    return this.http
      .delete("/instance/logout", this.scoped(instanceId))
      .then(r => r.data);
  }

  deleteInstance(instanceId: string) {
    return this.http
      .delete(`/instance/delete/${instanceId}`, this.scoped(instanceId))
      .then(r => r.data);
  }

  // ---- Envio -----------------------------------------------------------
  sendText(instanceId: string, params: SendTextParams) {
    return this.http
      .post("/send/text", { ...params, number: normalizeNumber(params.number) }, this.scoped(instanceId))
      .then(r => r.data);
  }

  sendMedia(instanceId: string, params: SendMediaParams) {
    return this.http
      .post("/send/media", { ...params, number: normalizeNumber(params.number) }, this.scoped(instanceId))
      .then(r => r.data);
  }

  sendLink(instanceId: string, params: SendLinkParams) {
    return this.http
      .post("/send/link", { ...params, number: normalizeNumber(params.number) }, this.scoped(instanceId))
      .then(r => r.data);
  }

  // ---- Operações de mensagem ------------------------------------------
  markRead(instanceId: string, body: Record<string, unknown>) {
    return this.http.post("/message/markread", body, this.scoped(instanceId)).then(r => r.data);
  }

  deleteMessage(instanceId: string, body: Record<string, unknown>) {
    return this.http.post("/message/delete", body, this.scoped(instanceId)).then(r => r.data);
  }

  editMessage(instanceId: string, body: Record<string, unknown>) {
    return this.http.post("/message/edit", body, this.scoped(instanceId)).then(r => r.data);
  }

  react(instanceId: string, body: Record<string, unknown>) {
    return this.http.post("/message/react", body, this.scoped(instanceId)).then(r => r.data);
  }

  downloadMedia(instanceId: string, body: Record<string, unknown>) {
    return this.http.post("/message/downloadmedia", body, this.scoped(instanceId)).then(r => r.data);
  }
}

// singleton
export const evolutionClient = new EvolutionClient();
export default EvolutionClient;
