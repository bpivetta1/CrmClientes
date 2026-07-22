import evalExpression from "../../../utils/evalExpression";

/**
 * ConditionNodeService
 * Avalia uma lista de condições (if/else) e retorna o target correspondente.
 */
const ConditionNodeService = async (
  conditions: { expression: string; target: string }[],
  variables: Record<string, any>,
  defaultTarget: string
): Promise<string> => {
  try {
    for (const cond of conditions) {
      const result = evalExpression(cond.expression, variables);
      console.log(`🧠 [ConditionNode] ${cond.expression} => ${result}`);
      if (result === true) return cond.target;
    }
  } catch (err) {
    console.error("❌ Erro ao avaliar condição:", err);
  }
  return defaultTarget;
};

export default ConditionNodeService;
