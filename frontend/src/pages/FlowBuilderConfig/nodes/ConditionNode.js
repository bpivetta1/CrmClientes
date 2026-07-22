import React from "react";
import { Handle } from "react-flow-renderer";
import { Box, Typography, Divider, Chip } from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";

/**
 * Nó de Condição (If / Else)
 * Mostra as expressões configuradas e expõe dois conectores:
 *  - Verde (id="true")  → Verdadeiro
 *  - Vermelho (id="false") → Falso
 */
const ConditionNode = ({ data }) => {
  const conditions = data?.conditions || [];

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #fde68a 0%, #facc15 100%)",
        borderRadius: "12px",
        padding: "12px 16px",
        color: "#1f2937",
        fontWeight: 600,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        minWidth: 240,
        border: "2px solid rgba(234,179,8,0.7)",
        position: "relative",
      }}
    >
      {/* Cabeçalho */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <GavelIcon sx={{ fontSize: 22, color: "#78350f" }} />
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          Condição (If / Else)
        </Typography>
      </Box>

      <Divider sx={{ mb: 1 }} />

      {/* Lista de condições */}
      {conditions.length > 0 ? (
        conditions.map((c, i) => (
          <Box key={i} sx={{ mb: 0.5 }}>
            <Typography
              variant="body2"
              sx={{
                color: "#1e293b",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              <Chip
                size="small"
                label={`IF ${i + 1}`}
                sx={{ backgroundColor: "#fef08a", color: "#78350f" }}
              />
              <span style={{ fontFamily: "monospace" }}>{c.expression}</span>
            </Typography>
          </Box>
        ))
      ) : (
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          Nenhuma condição configurada
        </Typography>
      )}

      <Divider sx={{ mt: 1, mb: 0.5 }} />

      <Typography variant="body2" sx={{ color: "#334155", fontSize: "0.85rem" }}>
        ELSE → fluxo alternativo
      </Typography>

      {/* Handle superior (entrada) */}
      <Handle
        type="target"
        position="top"
        style={{
          background: "#1f2937",
          width: 10,
          height: 10,
          borderRadius: "50%",
        }}
      />

      {/* Handle inferior (verdadeiro) */}
      <Handle
        type="source"
        id="true"
        position="bottom"
        style={{
          background: "#22c55e",
          width: 14,
          height: 14,
          left: "30%",
          borderRadius: "50%",
          border: "2px solid white",
          boxShadow: "0 0 6px rgba(34,197,94,0.7)",
        }}
      />
      <Typography
        sx={{
          position: "absolute",
          bottom: "-14px",
          left: "25%",
          fontSize: "0.7rem",
          color: "#166534",
        }}
      >
        Verdadeiro
      </Typography>

      {/* Handle inferior (falso) */}
      <Handle
        type="source"
        id="false"
        position="bottom"
        style={{
          background: "#ef4444",
          width: 14,
          height: 14,
          left: "70%",
          borderRadius: "50%",
          border: "2px solid white",
          boxShadow: "0 0 6px rgba(239,68,68,0.7)",
        }}
      />
      <Typography
        sx={{
          position: "absolute",
          bottom: "-14px",
          left: "66%",
          fontSize: "0.7rem",
          color: "#7f1d1d",
        }}
      >
        Falso
      </Typography>
    </Box>
  );
};

export default ConditionNode;
