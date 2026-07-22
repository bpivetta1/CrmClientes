// Configuração da integração Evolution-GO (troca da engine Baileys).
// Aditivo: se EVOLUTION_ENABLED != "true", nada muda — o WhaTicket segue na Baileys.

export default {
  enabled: process.env.EVOLUTION_ENABLED === "true",
  baseUrl: (process.env.EVOLUTION_URL || "").replace(/\/+$/, ""),
  apiKey: process.env.EVOLUTION_API_KEY || "",
  // timeout das chamadas REST (ms)
  timeout: parseInt(process.env.EVOLUTION_TIMEOUT || "30000", 10)
};
