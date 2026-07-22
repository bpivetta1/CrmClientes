import React, { memo } from "react";
import { Handle, Position } from "react-flow-renderer";
import { Box, Typography, Chip, useTheme, Tooltip } from "@mui/material";
import { Http } from "@mui/icons-material";

const HttpRequestNode = ({ data, id }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // 🔍 Tenta pegar os dados da integração em ambos os formatos possíveis
  const integration =
    data?.data?.typebotIntegration ||
    data?.typebotIntegration ||
    {};

  const method = integration.method || "Não definido";
  const url = integration.url || "Não definida";
  const label = integration.label || "HTTP Request";
  const responseData = integration.responseData || null;

  const modernStyles = {
    glassmorphism: {
      background: isDark
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(10px)",
      border: isDark
        ? "1px solid rgba(255, 255, 255, 0.1)"
        : "1px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "16px",
      boxShadow: isDark
        ? "0 8px 25px rgba(0,0,0,0.4)"
        : "0 8px 25px rgba(0,0,0,0.1)",
    },
    nodeColor: "#667eea",
  };

  return (
    <Box
      sx={{
        ...modernStyles.glassmorphism,
        padding: "16px",
        minWidth: "220px",
        maxWidth: "320px",
        position: "relative",
      }}
    >
      {/* Entrada */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          border: "3px solid white",
        }}
      />

      {/* Cabeçalho */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <Http sx={{ color: modernStyles.nodeColor, fontSize: 20 }} />
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            color: isDark ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.8)",
          }}
        >
          {label}
        </Typography>
      </Box>

      {/* Detalhes */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Typography
          variant="body2"
          sx={{
            color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
          }}
        >
          <strong>Método:</strong> {method}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)",
            wordBreak: "break-all",
          }}
        >
          <strong>URL:</strong> {url}
        </Typography>

        {/* Status visual */}
        {responseData ? (
          <Tooltip title="Resposta JSON armazenada">
            <Chip
              label="🟢 Testado com sucesso"
              size="small"
              color="success"
              sx={{ mt: 1, alignSelf: "flex-start" }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Ainda não testado">
            <Chip
              label="⚪ Aguardando teste"
              size="small"
              variant="outlined"
              sx={{
                mt: 1,
                alignSelf: "flex-start",
                borderColor: "#ccc",
              }}
            />
          </Tooltip>
        )}
      </Box>

      {/* Saída */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          border: "3px solid white",
        }}
      />
    </Box>
  );
};

export default memo(HttpRequestNode);
