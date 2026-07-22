# WhaTicket — CRM Clientes (deploy Coolify)

Sistema de atendimento/CRM via WhatsApp. Este repositório está preparado para
deploy no [Coolify](https://coolify.io) via **Docker Compose**, com 4 serviços:

| Serviço    | Stack                          | Porta | Domínio |
|------------|--------------------------------|-------|---------|
| `backend`  | Node.js + TypeScript (Express) | 8081  | ex. `api.seudominio.com` |
| `frontend` | React (CRA) servido por Express| 3000  | ex. `app.seudominio.com` |
| `postgres` | PostgreSQL 16                  | 5432  | interno |
| `redis`    | Redis 7                        | 6379  | interno |

O backend roda em **HTTP** internamente (`CERTIFICADOS=false`); o SSL é
terminado pelo proxy do Coolify (Traefik).

## Deploy no Coolify

1. **New Resource → Docker Compose** e aponte para este repositório
   (`github.com/bpivetta1/CrmClientes`). O Coolify usa o `docker-compose.yml`.
2. Em **Environment Variables**, cadastre as variáveis do `.env.example`
   (principalmente `BACKEND_URL`, `FRONTEND_URL`, `DB_PASS`, `REDIS_PASS`,
   `JWT_SECRET`, `JWT_REFRESH_SECRET`). Gere os segredos com
   `openssl rand -base64 32`.
3. Configure os **domínios**:
   - serviço `frontend` → porta `3000` → domínio do app (`FRONTEND_URL`)
   - serviço `backend`  → porta `8081` → domínio da API (`BACKEND_URL`)
4. **Deploy**. Na primeira subida o backend roda migrations + seeds
   automaticamente (ver `backend/docker-entrypoint.sh`).

> ⚠️ O `REACT_APP_BACKEND_URL` é embutido no build do frontend a partir de
> `BACKEND_URL`. Se mudar o domínio da API, **rebuild o frontend**.

### Login inicial
Após o seed, o usuário master padrão do WhaTicket é criado
(`admin@whaticket.com` / `123456`). **Troque a senha** no primeiro acesso.

## Rodar localmente

```bash
cp .env.example .env      # ajuste os valores (BACKEND_URL=http://localhost:8081, FRONTEND_URL=http://localhost:3000)
docker compose up --build
```

Frontend em `http://localhost:3000`, API em `http://localhost:8081`.

## Estrutura

```
backend/    API Node/TS (Sequelize + Evolution-GO + Redis/Bull)
frontend/   SPA React (Material UI)
docker-compose.yml
.env.example
```

> Engine WhatsApp: **Evolution-GO** (REST + webhook). Defina `EVOLUTION_API_KEY`
> no Coolify. A conexão gera o QR (polling) na tela de Conexões do WhaTicket.

## Persistência
- `pg_data` — banco Postgres
- `redis_data` — filas/cache Redis
- `backend_public` — uploads de mídia (`/usr/src/app/public`)
