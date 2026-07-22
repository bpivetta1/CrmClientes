import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";

/**
 * Avalia expressões JS substituindo variáveis {{chave.aninhada}}
 * Ex: {{response.saldo}} > 0
 */
function safeEval(expr, vars = {}) {
  try {
    let parsed = expr;
    // Substitui variáveis {{response.saldo}} por valores reais
    parsed = parsed.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
      const path = key.trim().split(".");
      let val = vars;
      for (const p of path) {
        if (val && typeof val === "object" && p in val) val = val[p];
        else return "undefined";
      }
      return JSON.stringify(val);
    });

    // eslint-disable-next-line no-new-func
    return new Function(`return (${parsed});`)();
  } catch (err) {
    console.error("Erro em safeEval:", err);
    return undefined;
  }
}

const FlowBuilderConditionModal = ({ open, onSave, onUpdate, data, close }) => {
  const isMounted = useRef(true);
  const [conditions, setConditions] = useState([{ label: "", expression: "" }]);
  const [testVars, setTestVars] = useState({
    cpf_cnpj: "12345678900",
    response: { saldo: 150, bloqueado: "Ativo" },
  });
  const [testResult, setTestResult] = useState(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (open === "edit" && data?.data?.typebotIntegration) {
      const d = data.data.typebotIntegration;
      setConditions(d.conditions || [{ label: "", expression: "" }]);
      setEditing(true);
    } else if (open === "create") {
      setConditions([{ label: "", expression: "" }]);
      setEditing(false);
    }
    return () => {
      isMounted.current = false;
    };
  }, [open, data]);

  const handleClose = () => {
    close(null);
    setTestResult(null);
  };

  const handleSave = () => {
    if (!conditions.some((c) => c.expression.trim() !== "")) {
      toast.error("Adicione pelo menos uma condição válida!");
      return;
    }

    const payload = {
      ...data,
      data: {
        typebotIntegration: {
          label: "Condição (If / Else)",
          conditions,
        },
      },
    };

    if (editing) onUpdate(payload);
    else onSave(payload);

    toast.success("Nó de condição salvo com sucesso!");
    handleClose();
  };

  const handleAddCondition = () => {
    setConditions([...conditions, { label: "", expression: "" }]);
  };

  const handleDeleteCondition = (index) => {
    const updated = [...conditions];
    updated.splice(index, 1);
    setConditions(updated);
  };

  const handleConditionChange = (index, field, value) => {
    const updated = [...conditions];
    updated[index][field] = value;
    setConditions(updated);
  };

  const handleTestExpression = (expr) => {
    if (!expr.trim()) {
      toast.info("Informe uma expressão para testar!");
      return;
    }

    const result = safeEval(expr, testVars);
    setTestResult({ expr, result });

    if (typeof result === "boolean") {
      toast.success(`Expressão avaliada: ${result ? "✅ Verdadeira" : "❌ Falsa"}`);
    } else if (result === undefined) {
      toast.error("Erro ao avaliar a expressão. Verifique a sintaxe ou variáveis.");
    } else {
      toast.info(`Resultado: ${String(result)}`);
    }
  };

  const copyExample = async (v) => {
    if (!v) return toast.info("Nada para copiar.");
    await navigator.clipboard.writeText(v);
    toast.success(`Copiado: ${v}`);
  };

  return (
    <Dialog open={!!open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>
        {editing ? "Editar Condição (If / Else)" : "Adicionar Condição (If / Else)"}
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
          Este nó avalia expressões JavaScript simples.
          Use variáveis entre <b>{"{{chaves}}"}</b>.
          <br />
          <b>Exemplos:</b> {"{{response.saldo}} > 0"}, {"{{cpf_cnpj}}.length === 11"},
          {"{{response.bloqueado}} === 'Ativo'"}
          <br />
          O resultado da condição define o caminho:
          <b style={{ color: "#22c55e" }}> Verde = Verdadeiro</b>,
          <b style={{ color: "#ef4444" }}> Vermelho = Falso</b>.
        </Typography>

        <Divider sx={{ mb: 2 }} />

        {conditions.map((cond, index) => (
          <Card key={index} sx={{ mb: 2, background: "rgba(249,250,251,0.7)" }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Condição {index + 1}</Typography>
                <IconButton color="error" onClick={() => handleDeleteCondition(index)}>
                  <DeleteIcon />
                </IconButton>
              </Stack>

              <TextField
                label="Rótulo (opcional)"
                fullWidth
                margin="dense"
                value={cond.label}
                onChange={(e) => handleConditionChange(index, "label", e.target.value)}
              />

              <TextField
                label="Expressão (ex: {{response.cpf_cnpj}} === {{cpf_cnpj}})"
                fullWidth
                margin="dense"
                value={cond.expression}
                onChange={(e) => handleConditionChange(index, "expression", e.target.value)}
              />

              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleTestExpression(cond.expression)}
                >
                  Testar
                </Button>
                <Button
                  size="small"
                  variant="text"
                  startIcon={<ContentCopyIcon />}
                  onClick={() => copyExample(cond.expression)}
                >
                  Copiar
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}

        <Button
          startIcon={<AddCircleOutlineIcon />}
          variant="outlined"
          onClick={handleAddCondition}
          sx={{ mb: 2 }}
        >
          Adicionar Condição
        </Button>

        {testResult && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Resultado do Teste:
              </Typography>
              <Typography
                component="pre"
                sx={{
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                  whiteSpace: "pre-wrap",
                  mt: 1,
                }}
              >
                Expressão: {testResult.expr}
                {"\n"}
                Resultado: {String(testResult.result)}
              </Typography>
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          {editing ? "Salvar Alterações" : "Adicionar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlowBuilderConditionModal;
