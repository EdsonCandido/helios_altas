# ARCHITECTURE.md

# Helios Altas — Arquitetura

## 1. Objetivo

O Helios Altas utiliza uma arquitetura de **monólito modular**, separando frontend e backend em aplicações independentes e mantendo PostgreSQL/PostGIS e Redis como infraestrutura.

A arquitetura foi escolhida para:

- reduzir complexidade inicial;
- facilitar desenvolvimento;
- manter fronteiras claras entre domínios;
- permitir evolução futura;
- evitar microserviços prematuros;
- preservar uma implantação simples em Docker.

---

# 2. Visão geral

```text
                        INTERNET
                           │
                           ▼
              NGINX PROXY MANAGER
         (já no servidor, fora do escopo)
                           │
                     Docker network
                         "proxy"
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
        Angular Web                 Backend API
        apps/web                    apps/server
             │                           │
             │                           ├──────────────┐
             │                           │              │
             │                           ▼              ▼
             │                       PostgreSQL      Redis
             │                       + PostGIS       + BullMQ
             │
             └──── WebSocket / HTTP ──────┘
```

O Nginx Proxy Manager já existe no servidor e não faz parte deste repositório. A aplicação não o instala, não o configura e não o inclui no Docker Compose.

`web` e `server` participam da rede externa `proxy` para que esse proxy encaminhe o tráfego até a aplicação.

O PostgreSQL e o Redis permanecem em rede interna e não participam da rede `proxy`.

---

# 3. Estrutura do repositório

```text
helios-altas/
├── apps/
│   ├── web/
│   └── server/
│
├── docs/
├── docker-compose.yml
├── .env.example
├── README.md
├── ARCHITECTURE.md
└── CONVENTIONS.md
```

---

# 4. Frontend

O frontend é uma aplicação Angular independente.

Responsabilidades:

- apresentação;
- navegação;
- gerenciamento de estado de interface;
- formulários;
- consumo da API;
- comunicação em tempo real;
- feedback visual;
- mapas;
- dashboards.

O frontend não é responsável por aplicar autorização de negócio. Ele pode controlar a experiência visual, porém toda autorização deve ser validada pelo backend.

Estrutura recomendada:

```text
apps/web/src/app/
├── core/
├── shared/
├── layouts/
└── features/
    ├── auth/
    ├── client/
    ├── partner/
    └── admin/
```

---

# 5. Backend

O backend é um monólito modular em Node.js + TypeScript + Express + Drizzle ORM.

Estrutura:

```text
apps/server/src/
├── config/
├── controllers/
├── routes/
├── services/
├── repositories/
├── middlewares/
├── types/
├── utils/
├── schemas/
├── events/
├── db/
├── modules/
└── index.ts
```

A regra de negócio pertence principalmente aos módulos e services.

O schema Drizzle vive apenas em `apps/server/src/db/schema`. Controllers e services não importam tabelas. Queries geográficas (`ST_DWithin`, `ST_Distance`, `ST_SnapToGrid`) ficam nos repositories via `sql` do Drizzle. A primeira migration habilita `postgis` e `citext` em SQL, porque o Drizzle não cria extensões sozinho.

---

# 6. Módulos de domínio

Módulos iniciais:

```text
modules/
├── auth/
├── users/
├── clients/
├── partners/
├── categories/
├── service-requests/
├── matching/
├── notifications/
└── admin/
```

## Auth

Responsável por:

- autenticação;
- sessão/token;
- recuperação de acesso;
- contexto do usuário.

## Users

Responsável pelo cadastro base e identidade da conta.

## Clients

Responsável por informações e regras específicas do cliente.

## Partners

Responsável por:

- perfil do parceiro;
- localização;
- disponibilidade;
- serviços;
- raio de atendimento.

## Categories

Responsável pelas categorias de serviços.

## Service Requests

Responsável pelo ciclo de vida da solicitação.

## Matching

Responsável por encontrar parceiros compatíveis.

## Notifications

Responsável pela entrega de notificações.

## Admin

Responsável por operações administrativas.

---

# 7. Fluxo principal

```text
Cliente
  │
  ▼
Cria ServiceRequest
  │
  ▼
Service Request Service
  │
  ├── persiste solicitação
  │
  └── publica ServiceRequestCreated
                       │
                       ▼
                  Matching
                       │
                       ▼
             encontra parceiros
                       │
                       ▼
            ServiceRequestMatched
                       │
                       ▼
                Notifications
                       │
                       ▼
              Parceiro recebe aviso
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          Aceita              Recusa
             │                   │
             ▼                   ▼
         ACCEPTED             REJECTED
```

---

# 8. Estado da solicitação

Estados principais:

```text
PENDING
SEARCHING
ACCEPTED
IN_PROGRESS
COMPLETED
CANCELLED
EXPIRED
```

As transições devem ser controladas pelo domínio.

Exemplo:

```text
PENDING
  └──> SEARCHING

SEARCHING
  ├──> ACCEPTED
  ├──> CANCELLED
  └──> EXPIRED

ACCEPTED
  ├──> IN_PROGRESS
  └──> CANCELLED

IN_PROGRESS
  └──> COMPLETED
```

Não permitir transições arbitrárias diretamente pelo controller.

---

# 9. Concorrência no aceite

Uma solicitação pode ser apresentada a vários parceiros.

O MVP usa atendimento exclusivo (`exclusiveAssignment = true`). O aceite deve ser atômico.

O backend deve utilizar transação, locking ou mecanismo equivalente para impedir:

```text
Partner A → ACCEPT
Partner B → ACCEPT
```

simultaneamente.

Apenas um parceiro deve se tornar responsável pela solicitação.

---

# 10. Geolocalização

A localização é uma capacidade central do sistema.

Usar:

```text
PostgreSQL + PostGIS
```

O domínio deve representar localização de forma apropriada.

Exemplo conceitual:

```sql
location geography(Point, 4326)
```

Casos de uso:

- busca de parceiros próximos;
- filtro por raio;
- cálculo de distância;
- matching;
- mapas administrativos;
- agrupamento geográfico.

Consultas geográficas devem ser executadas pelo banco.

Evitar carregar milhares de registros para o Node apenas para calcular distância.

---

# 11. Privacidade da localização

A localização interna do parceiro pode ser mais precisa do que a localização apresentada ao cliente.

Exemplo:

```text
Banco:
latitude/longitude exatas

Cliente:
"3,8 km de distância"
```

O backend deve controlar quais campos geográficos são públicos.

---

# 12. Eventos

Eventos representam mudanças relevantes no domínio.

Eventos iniciais:

```text
ServiceRequestCreated
ServiceRequestMatched
PartnerNotified
PartnerAcceptedRequest
PartnerRejectedRequest
ServiceRequestCancelled
ServiceRequestStarted
ServiceRequestCompleted
```

Eventos não devem substituir todas as chamadas de serviço.

Eles devem ser utilizados quando uma mudança precisa disparar outras ações desacopladas.

---

# 13. Filas

Redis + BullMQ pode ser usado para:

- notificações;
- matching assíncrono;
- expiração;
- jobs agendados;
- processamento de eventos.

A regra de negócio não deve depender da implementação concreta da fila.

---

# 14. Notificações

A arquitetura deve separar:

```text
regra de negócio
        ↓
evento
        ↓
NotificationService
        ↓
provider
```

Isso permite implementar:

```text
WebSocket
Web Push
Mobile Push
E-mail
SMS
```

em momentos diferentes.

O mobile não faz parte do MVP. A entrega web usa Socket.io no mesmo processo HTTP, sala `user:{userId}`.

---

# 15. Banco de dados

Entidades principais:

```text
users
clients
partners
service_categories
partner_services
service_requests
service_request_partners
notifications
```

O banco deve utilizar migrations versionadas do Drizzle (`drizzle-kit generate` e `npm run db:migrate`).

O PostgreSQL não deve ser acessado pelo frontend.

Toda alteração de dados deve passar pela camada apropriada do backend.

Nunca hard-delete. Proibido DELETE SQL / db.delete() / remoção física em Repositories e Services da aplicação.

“Excluir” = soft-delete: ativo = false e atualizar updated_at (e updated_by quando o campo existir).

---

# 16. API

A API é REST e versionada:

```text
/api/v1
```

Exemplos:

```text
GET    /api/v1/categories
GET    /api/v1/partners
GET    /api/v1/partners/nearby
POST   /api/v1/service-requests
GET    /api/v1/service-requests/:id
POST   /api/v1/service-requests/:id/cancel
POST   /api/v1/service-requests/:id/accept
POST   /api/v1/service-requests/:id/reject
```

Os endpoints reais devem seguir o domínio e as convenções descritas em `CONVENTIONS.md`.

---

# 17. Docker

Serviços:

```text
web
server
postgres
redis
```

Rede externa:

```text
proxy
```

Rede interna:

```text
default
```

Somente `web` e, caso necessário, `server` participam da rede `proxy`, para que o Nginx Proxy Manager já existente no servidor alcance a aplicação.

O Nginx Proxy Manager não é serviço deste Compose. A aplicação apenas se conecta à rede `proxy`.

PostgreSQL e Redis permanecem somente na rede interna.

---

# 18. Segurança arquitetural

Regras:

- autenticação no backend;
- autorização no backend;
- validação em todas as entradas;
- rate limiting;
- logs;
- secrets via ambiente;
- banco não público;
- Redis não público;
- não confiar em dados enviados pelo frontend;
- impedir acesso de um usuário aos recursos de outro;
- proteger ações administrativas.

---

# 19. Escalabilidade

A primeira versão não utiliza microserviços.

Quando necessário, alguns módulos poderão futuramente ser extraídos.

Possíveis candidatos:

```text
notifications
matching
```

Essa extração só deve acontecer quando houver necessidade operacional comprovada.

A modularidade atual deve facilitar essa evolução, mas não antecipá-la.

---

# 20. Decisões arquiteturais

### Monólito modular

Escolhido para reduzir complexidade.

### Drizzle ORM

Escolhido para tipar persistência sem esconder PostGIS. O aceite exclusivo usa `db.transaction` e `.for("update")`.

### PostgreSQL + PostGIS

Escolhido porque geolocalização é parte fundamental do domínio. A imagem oficial `postgis/postgis` só publica `linux/amd64`. O Compose usa `imresamu/postgis:18-3.6-bookworm`: PostgreSQL 18, PostGIS 3.6, manifesto `amd64` e `arm64`. Volume em `/var/lib/postgresql` (mudança do PostgreSQL 18).

### Redis + BullMQ

Escolhido para processamento assíncrono simples.

### Docker Compose

Escolhido pela facilidade de desenvolvimento, homologação e implantação inicial.

### Nginx Proxy Manager

Proxy reverso externo, já instalado no servidor e fora do escopo deste repositório. A aplicação não inclui o container do NPM. Ela apenas se conecta à rede Docker `proxy` para ser alcançada por esse proxy.

---

# 21. Princípio principal

A arquitetura deve ser julgada pela seguinte regra:

> A solução mais simples que preserve as fronteiras de domínio, segurança e capacidade de evolução deve ser preferida.
