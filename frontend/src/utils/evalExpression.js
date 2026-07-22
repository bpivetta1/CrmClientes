/**
 * Substitui {{variáveis}} e avalia expressão de forma segura
 * Exemplo: "{{response.saldo}} > 0" ou "{{cpf_cnpj}}.length === 11"
 */
export default function evalExpression(expr: string, vars: Record<string, any>): boolean {
  try {
    let safeExpr = expr;

    Object.entries(vars || {}).forEach(([key, val]) => {
      const jsonVal = JSON.stringify(val);
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      safeExpr = safeExpr.replace(regex, jsonVal);
    });

    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${safeExpr});`)();
    return !!result;
  } catch (err) {
    console.error("Erro ao avaliar expressão:", expr, err);
    return false;
  }
}
