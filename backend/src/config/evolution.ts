// Configuração da integração Evolution-GO (engine WhatsApp única).
// EVOLUTION_API_KEY é obrigatória para o WhatsApp funcionar.

export default {
  baseUrl: (process.env.EVOLUTION_URL || "").replace(/\/+$/, ""),
  apiKey: process.env.EVOLUTION_API_KEY || "",
  // timeout das chamadas REST (ms)
  timeout: parseInt(process.env.EVOLUTION_TIMEOUT || "30000", 10)
};
