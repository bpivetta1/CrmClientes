import { Router } from "express";
import { handleEvolutionWebhook } from "../controllers/EvolutionWebhookController";

// Endpoint publico que recebe os webhooks da Evolution-GO.
const evolutionWebhookRoutes = Router();

evolutionWebhookRoutes.post("/evolution/webhook/:whatsappId", handleEvolutionWebhook);

export default evolutionWebhookRoutes;
