import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/**
 * Proxy HTTP livre para o Flowbuilder
 * ----------------------------------------------------
 * - Permite chamadas externas sem CORS
 * - Não exige autenticação
 * - Simula um navegador real
 * - Força o header "Host" correto (resolve respostas HTML)
 * - Retorna JSON parseado automaticamente
 * ----------------------------------------------------
 * Exemplo de uso:
 *   GET /http-proxy?url=http://100.64.0.126/ura/cliente.php?cpf_cnpj=82813558591
 */
router.get("/http-proxy", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL inválida ou não informada." });
    }

    // Extrai o hostname da URL (ex: skynetfibra.net.br)
    const targetHost = new URL(url).hostname;

    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        Host: targetHost, // ✅ fundamental para APIs hospedadas com proxy reverso
      },
    });

    const contentType = response.headers.get("content-type");
    const text = await response.text();

    // 🔎 Detecta resposta HTML inesperada
    if (text.startsWith("<!doctype html>") || text.includes("<html")) {
      return res.status(200).json({
        erro:
          "A resposta retornou HTML — verifique se a API exige autenticação ou se a URL está correta.",
        conteudoHtml: text.substring(0, 500) + "...",
      });
    }

    // ✅ Retorna JSON parseado
    try {
      const json = JSON.parse(text);
      return res.json(json);
    } catch {
      // Caso não seja JSON, retorna texto puro
      return res.status(200).json({ resultado: text });
    }
  } catch (error) {
    console.error("Erro no proxy HTTP do Flowbuilder:", error);
    return res.status(500).json({
      error: "Erro interno ao processar a requisição no proxy.",
    });
  }
});

export default router;
