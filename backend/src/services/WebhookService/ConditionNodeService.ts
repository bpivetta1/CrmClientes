/**
 * ==========================================
 * 🧠 ConditionNodeService
 * Avalia nós de condição (If / Else)
 * ==========================================
 */

/**
 * 🔍 Avalia expressões JS seguras substituindo variáveis {{variavel.aninhada}}
 * Exemplo: {{response.saldo}} > 0
 */
function safeEval(expr, vars = {}) {
  try {
    let parsed = expr;

    // Substitui placeholders {{variavel.aninhada}}
    parsed = parsed.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
      const path = key.trim().split(".");
      let val = vars;
      for (const p of path) {
        if (val && typeof val === "object" && p in val) {
          val = val[p];
        } else {
          return "undefined";
        }
      }
      return JSON.stringify(val);
    });

    // eslint-disable-next-line no-new-func
    return new Function(`return (${parsed});`)();
  } catch (err) {
    console.error("❌ Erro ao avaliar condição:", err);
    return undefined;
  }
}

/**
 * 🧠 Executa um nó de condição e retorna o ID do próximo destino
 * @param {object} nodeSelected - Nó do tipo "condition"
 * @param {object} ticket - Ticket atual
 * @param {object} dataWebhook - Variáveis do fluxo (ticket.dataWebhook)
 * @returns {Promise<string|null>} ID do próximo nó ou defaultTarget
 */
export const executeConditionNode = async (nodeSelected, ticket, dataWebhook) => {
  try {
    const conditions = nodeSelected?.data?.conditions || [];
    const defaultTarget = nodeSelected?.data?.defaultTarget || null;

    if (!Array.isArray(conditions) || conditions.length === 0) {
      console.warn("⚠️ Nenhuma condição configurada, usando defaultTarget");
      return defaultTarget;
    }

    // 🔄 Obtém variáveis disponíveis
    const vars =
      (dataWebhook && dataWebhook.variables)
        ? dataWebhook.variables
        : ticket?.dataWebhook?.variables || {};

    console.log("🔍 Variáveis disponíveis para avaliação:", vars);

    // 🔁 Loop pelas condições configuradas
    for (const cond of conditions) {
      if (!cond.expression) continue;

      const result = safeEval(cond.expression, vars);
      console.log(`➡️ Testando expressão: ${cond.expression} → ${result}`);

      if (result === true) {
        console.log(`✅ Condição verdadeira → seguindo para: ${cond.target}`);
        return cond.target;
      }
    }

    // ⚙️ Se nenhuma for verdadeira, vai para o destino padrão
    console.log(`⚙️ Nenhuma condição atendida → indo para defaultTarget: ${defaultTarget}`);
    return defaultTarget;
  } catch (err) {
    console.error("❌ Erro em executeConditionNode:", err);
    return null;
  }
};
