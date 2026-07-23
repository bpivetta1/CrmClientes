# Deploy no EasyPanel

Guia para instalar este WhaTicket no [EasyPanel](https://easypanel.io).
(A instalação via Coolify continua suportada pelo `docker-compose.yml` — este
guia não a altera em nada.)

No EasyPanel são **4 serviços** dentro de um projeto (ex.: projeto `crm`):

| Serviço    | Tipo               | Porta | Domínio |
|------------|--------------------|-------|---------|
| `postgres` | Postgres (template)| 5432  | interno |
| `redis`    | Redis (template)   | 6379  | interno |
| `backend`  | App (GitHub)       | 8081  | `crmclienteback.nefo.pro` |
| `frontend` | App (GitHub)       | 3000  | `crmcliente.nefo.pro` |

> Hostname interno no EasyPanel = `<projeto>_<serviço>` (ex.: `crm_postgres`).
> Se usar outro nome de projeto, ajuste os hosts nas envs abaixo.

## 1. Postgres
Add Service → **Postgres**:
- Nome: `postgres` · Database: `whaticket` · User: `whaticket`
- Password: gere uma senha forte (anote — vai no backend em `DB_PASS`)

## 2. Redis
Add Service → **Redis**:
- Nome: `redis` · Password: gere uma senha forte (anote — vai em `REDIS_URI`)

## 3. Backend
Add Service → **App**:
- **Source**: GitHub → `https://github.com/bpivetta1/CrmClientes` · branch `main`
- **Build**: Dockerfile · **Build Path**: `/backend`
- **Port (proxy)**: `8081` · **Domain**: `crmclienteback.nefo.pro` (HTTPS)
- **Mounts**: Volume → mount path `/usr/src/app/public` (uploads de mídia)
- **Environment** (cole e preencha os `<...>`):

```env
NODE_ENV=production
BACKEND_URL=https://crmclienteback.nefo.pro
FRONTEND_URL=https://crmcliente.nefo.pro
PORT=8081
PROXY_PORT=443
CERTIFICADOS=false

DB_DIALECT=postgres
DB_HOST=crm_postgres
DB_PORT=5432
DB_NAME=whaticket
DB_USER=whaticket
DB_PASS=<senha do postgres>

REDIS_URI=redis://:<senha do redis>@crm_redis:6379
REDIS_OPT_LIMITER_MAX=1
REDIS_OPT_LIMITER_DURATION=3000

# gere cada um com: openssl rand -base64 32
JWT_SECRET=<segredo>
JWT_REFRESH_SECRET=<outro segredo>

# Evolution-GO (engine WhatsApp — obrigatorio)
EVOLUTION_URL=https://evolution-go.nefo.pro
EVOLUTION_API_KEY=<chave global da Evolution>
EVOLUTION_TIMEOUT=30000

USER_LIMIT=10000
CONNECTIONS_LIMIT=100000
CLOSED_SEND_BY_ME=true
```

Deploy. Na primeira subida o backend roda migrations + seeds sozinho
(`backend/docker-entrypoint.sh`).

## 4. Frontend
Add Service → **App**:
- **Source**: mesmo repositório · branch `main`
- **Build**: Dockerfile · **Build Path**: `/frontend`
- **Port (proxy)**: `3000` · **Domain**: `crmcliente.nefo.pro` (HTTPS)
- **Environment**:

```env
REACT_APP_BACKEND_URL=https://crmclienteback.nefo.pro
REACT_APP_HOURS_CLOSE_TICKETS_AUTO=24
```

> O `REACT_APP_BACKEND_URL` é embutido no build (o Dockerfile já tem esse
> domínio como default). Se mudar o domínio da API, altere a env e **rebuild**.

## 5. Primeiro acesso
- Login inicial: `admin@admin.com` / `adminpro` — **troque a senha**.
- Conexões → Nova Conexão → botão **QR CODE** (aparece em ~5-15s) → escanear.

## Dicas
- Logs do backend: aba Logs do serviço `backend` (linhas `[evolution]` mostram
  a integração WhatsApp).
- Alternativa: EasyPanel também aceita o `docker-compose.yml` (serviço tipo
  "Compose"), mas aí as senhas `SERVICE_PASSWORD_*` (magia do Coolify) precisam
  ser definidas manualmente nas envs — os serviços nativos acima são o caminho
  recomendado.
