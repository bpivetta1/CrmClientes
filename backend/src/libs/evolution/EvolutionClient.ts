// Cliente REST da Evolution-GO API.
// Contrato confirmado ao vivo (sondagem 2026-07-22):
//  - Gerenciamento (create / all): header `apikey` = CHAVE GLOBAL.
//  - Chamadas por instância (connect/qr/status/send/message/logout/delete):
//    header `apikey` = TOKEN DA INSTÂNCIA (o token identifica a instância;
//    NÃO se usa a chave global + instanceId — isso dá 401).
//  - /instance/create aceita um `token` fornecido por mim (determinístico).

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

export interface CreateInstanceParams {
  name: string;
  token: string;
  instanceId?: string;
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
  if (raw.includes("@g.us")) return raw;
  return raw.replace(/@.*$/, "").replace(/\D/g, "");
};

class EvolutionClient {
  private http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: evolutionConfig.baseUrl,
      timeout: evolutionConfig.timeout
    });
  }

  // header com a chave global (gerenciamento)
  private global() {
    return { headers: { apikey: evolutionConfig.apiKey } };
  }

  // header com o token da instância (chamadas escopadas)
  private scoped(token: string) {
    return { headers: { apikey: token } };
  }

  // ---- Instância (gerenciamento — chave global) -----------------------
  createInstance(params: CreateInstanceParams) {
    return this.http.post("/instance/create", params, this.global()).then(r => r.data);
  }

  listInstances() {
    return this.http.get("/instance/all", this.global()).then(r => r.data);
  }

  // ---- Instância (escopadas — token) ----------------------------------
  connectInstance(token: string, params: ConnectInstanceParams) {
    return this.http.post("/instance/connect", params, this.scoped(token)).then(r => r.data);
  }

  getQr(token: string) {
    return this.http.get("/instance/qr", this.scoped(token)).then(r => r.data);
  }

  getStatus(token: string) {
    return this.http.get("/instance/status", this.scoped(token)).then(r => r.data);
  }

  logout(token: string) {
    return this.http.delete("/instance/logout", this.scoped(token)).then(r => r.data);
  }

  // delete usa a CHAVE GLOBAL (confirmado ao vivo — com token dá 401)
  deleteInstance(instanceId: string) {
    return this.http.delete(`/instance/delete/${instanceId}`, this.global()).then(r => r.data);
  }

  // ---- Envio (token) --------------------------------------------------
  sendText(token: string, params: SendTextParams) {
    return this.http
      .post("/send/text", { ...params, number: normalizeNumber(params.number) }, this.scoped(token))
      .then(r => r.data);
  }

  sendMedia(token: string, params: SendMediaParams) {
    return this.http
      .post("/send/media", { ...params, number: normalizeNumber(params.number) }, this.scoped(token))
      .then(r => r.data);
  }

  // ---- Operações de mensagem (token) ----------------------------------
  markRead(token: string, body: Record<string, unknown>) {
    return this.http.post("/message/markread", body, this.scoped(token)).then(r => r.data);
  }

  deleteMessage(token: string, body: Record<string, unknown>) {
    return this.http.post("/message/delete", body, this.scoped(token)).then(r => r.data);
  }

  editMessage(token: string, body: Record<string, unknown>) {
    return this.http.post("/message/edit", body, this.scoped(token)).then(r => r.data);
  }

  react(token: string, body: Record<string, unknown>) {
    return this.http.post("/message/react", body, this.scoped(token)).then(r => r.data);
  }

  downloadMedia(token: string, body: Record<string, unknown>) {
    return this.http.post("/message/downloadmedia", body, this.scoped(token)).then(r => r.data);
  }
}

export const evolutionClient = new EvolutionClient();
export default EvolutionClient;
