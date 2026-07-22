import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Button,
  Typography,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack,
  Tooltip,
  useTheme,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { toast } from "react-toastify";

const httpMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

function safeJsonParse(txt) {
  try {
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

function replaceTemplates(str, vars) {
  if (!str) return str;
  if (!vars || typeof vars !== "object") return str;
  return str.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, key) => {
    const k = key.trim();
    return Object.prototype.hasOwnProperty.call(vars, k)
      ? String(vars[k])
      : `{{${k}}}`;
  });
}

function getJsonPaths(value, prefix = "response", acc = []) {
  if (Array.isArray(value)) {
    acc.push(prefix + "[0]");
    if (value.length > 0) getJsonPaths(value[0], prefix + "[0]", acc);
  } else if (value && typeof value === "object") {
    for (const k of Object.keys(value)) {
      const next = `${prefix}.${k}`;
      acc.push(next);
      getJsonPaths(value[k], next, acc);
    }
  }
  return acc;
}

const FlowBuilderHttpRequestModal = ({ open, onSave, onUpdate, data, close }) => {
  const theme = useTheme();
  const isMounted = useRef(true);

  const [formData, setFormData] = useState({
    url: "",
    method: "GET",
    label: "",
    body: "",
    answerKey: "response",
  });

  const [testResponse, setTestResponse] = useState(null);
  const [suggestedVars, setSuggestedVars] = useState([]);
  const [exampleMsg, setExampleMsg] = useState("");

  useEffect(() => {
    if (open === "edit" && data?.data?.typebotIntegration) {
      const d = data.data.typebotIntegration;
      setFormData({
        url: d.url || "",
        method: d.method || "GET",
        label: d.label || "",
        body: d.body || "",
        answerKey: d.answerKey || "response",
      });
      setTestResponse(d.responseData || null);
    } else if (open === "create") {
      setFormData({
        url: "",
        method: "GET",
        label: "",
        body: "",
        answerKey: "response",
      });
      setTestResponse(null);
    }
    return () => {
      isMounted.current = false;
    };
  }, [open, data]);

  const handleClose = () => {
    close(null);
    setTestResponse(null);
    setSuggestedVars([]);
    setExampleMsg("");
  };

  const handleSave = () => {
    if (!formData.url) {
      toast.error("Informe uma URL!");
      return;
    }

    const payload = {
      ...data,
      data: {
        typebotIntegration: {
          ...formData,
          responseData: testResponse || {},
        },
      },
    };

    if (open === "edit") onUpdate(payload);
    else onSave(payload);

    toast.success("HTTP Request salvo com sucesso!");
    handleClose();
  };

  const handleTest = async () => {
    if (!formData.url) {
      toast.error("Informe a URL antes de testar!");
      return;
    }

    setTestResponse(null);
    setSuggestedVars([]);
    setExampleMsg("");

    try {
      const baseUrl = process.env.REACT_APP_BACKEND_URL;
      const proxyUrl = `${baseUrl}/http-proxy?url=${encodeURIComponent(formData.url)}`;

      const opts = {
        method: formData.method,
        headers: { "Content-Type": "application/json" },
      };
      if (["POST", "PUT", "PATCH"].includes(formData.method)) {
        const parsedBody = safeJsonParse(formData.body || "{}");
        opts.body = JSON.stringify(parsedBody);
      }

      const res = await fetch(proxyUrl, opts);
      const txt = await res.text();

      if (txt.includes("<html")) {
        toast.error("A resposta parece ser HTML (não JSON).");
        setTestResponse({ erro: "Resposta HTML detectada." });
        return;
      }

      const json = safeJsonParse(txt);
      if (!json) {
        toast.info("Resposta não é JSON, exibindo como texto.");
        setTestResponse({ resultado: txt });
        return;
      }

      setTestResponse(json);

      const paths = getJsonPaths(json, formData.answerKey);
      setSuggestedVars(paths);

      const msg = paths.map((p) => `{{${p}}}`).join("\n");
      setExampleMsg(msg);

      toast.success("Requisição executada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao testar a requisição.");
    }
  };

  const copyVar = async (v) => {
    await navigator.clipboard.writeText(`{{${v}}}`);
    toast.success(`Copiado: {{${v}}}`);
  };

  return (
    <Dialog open={!!open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{open === "edit" ? "Editar HTTP Request" : "Adicionar HTTP Request"}</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="URL (aceita {{variáveis}} — ex: {{cpf_cnpj}} do question anterior)"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          fullWidth
          required
          margin="dense"
        />

        <FormControl fullWidth margin="dense">
          <InputLabel>Método HTTP</InputLabel>
          <Select
            value={formData.method}
            onChange={(e) => setFormData({ ...formData, method: e.target.value })}
            label="Método HTTP"
          >
            {httpMethods.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {["POST", "PUT", "PATCH"].includes(formData.method) && (
          <TextField
            label="Corpo JSON (aceita {{variáveis}} — ex: {{cpf_cnpj}})"
            multiline
            rows={6}
            value={formData.body}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            fullWidth
            margin="dense"
          />
        )}

        <TextField
          label="Salvar resposta como (prefixo)"
          value={formData.answerKey}
          onChange={(e) => setFormData({ ...formData, answerKey: e.target.value })}
          margin="dense"
          fullWidth
          helperText="Nome base das variáveis criadas (ex: response.id, response.nome)"
        />

        <Divider sx={{ my: 2 }} />

        <Button
          onClick={handleTest}
          variant="contained"
          sx={{
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            color: "#fff",
            fontWeight: 600,
            mb: 2,
          }}
        >
          Testar Requisição
        </Button>

        {testResponse && (
          <>
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Resultado da API:
                </Typography>
                <Typography component="pre" sx={{ fontFamily: "monospace", fontSize: "0.9rem" }}>
                  {JSON.stringify(testResponse, null, 2)}
                </Typography>
              </CardContent>
            </Card>

            {suggestedVars.length > 0 && (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Variáveis criadas (clique para copiar):
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
                  {suggestedVars.map((v) => (
                    <Tooltip key={v} title="Copiar variável">
                      <Chip
                        label={v}
                        onClick={() => copyVar(v)}
                        onDelete={() => copyVar(v)}
                        deleteIcon={<ContentCopyIcon />}
                        sx={{ cursor: "pointer" }}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              </>
            )}

            {exampleMsg && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Exemplo de mensagem:
                  </Typography>
                  <Typography
                    component="pre"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.9rem",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {exampleMsg}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="secondary" variant="outlined">
          Cancelar
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained">
          {open === "edit" ? "Salvar Alterações" : "Adicionar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FlowBuilderHttpRequestModal;
