# Helios Altas

Plataforma web para conectar clientes a prestadores de serviços locais.

O **Helios Altas** permite que um cliente encontre profissionais por tipo de serviço e localização ou crie uma solicitação de atendimento para que parceiros compatíveis sejam encontrados e notificados.

---

## Sumário

- [Objetivo](#objetivo)
- [Perfis](#perfis)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Estrutura](#estrutura)
- [Identidade visual](#identidade-visual)
- [Serviços Docker](#serviços-docker)
- [Rede](#rede)
- [Instalação](#instalação)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Execução](#execução)
- [Banco](#banco)
- [Documentação](#documentação)
- [Escopo do MVP](#escopo-do-mvp)

---

# Objetivo

O Helios Altas conecta:

```text
CLIENTE
   ↓
pesquisa / solicitação
   ↓
MATCHING
   ↓
PARCEIROS
   ↓
aceite / recusa
   ↓
ATENDIMENTO
```

A localização é uma parte central do produto.

O sistema utiliza PostgreSQL com PostGIS para busca geográfica e cálculo de distância.

---

# Perfis

## Cliente

Pode:

- pesquisar serviços;
- pesquisar parceiros;
- visualizar distância;
- criar solicitações;
- acompanhar solicitações;
- receber notificações;
- visualizar histórico.

## Parceiro

Pode:

- cadastrar seus serviços;
- informar localização;
- informar valor mínimo;
- definir raio de atendimento;
- definir disponibilidade;
- receber solicitações;
- aceitar ou recusar;
- acompanhar histórico.

## Administrador

Pode:

- gerenciar usuários;
- gerenciar categorias;
- visualizar solicitações;
- acompanhar parceiros;
- visualizar mapas;
- analisar concentração de solicitações.

---

# Stack

## Frontend

- Angular
- TypeScript
- Mobile-first
- Responsive Design
- WebSocket para comunicação em tempo real

## Backend

- Node.js
- TypeScript
- Express
- REST API

## Banco

- PostgreSQL 18
- PostGIS

## Infraestrutura

- Docker
- Docker Compose
- Redis
- BullMQ

O tráfego público chega pelo Nginx Proxy Manager já instalado no servidor. Esse proxy não faz parte do escopo deste projeto.

---

# Arquitetura

O sistema utiliza um **monólito modular**.

```text
helios-altas/
├── apps/
│   ├── web/
│   └── server/
│
├── docker-compose.yml
├── .env.example
├── README.md
├── ARCHITECTURE.md
└── CONVENTIONS.md
```

## Web

`apps/web`

Responsável por:

- interface;
- navegação;
- formulários;
- mapas;
- dashboards;
- comunicação com a API;
- notificações visuais.

## Server

`apps/server`

Responsável por:

- autenticação;
- autorização;
- regras de negócio;
- matching;
- solicitações;
- usuários;
- parceiros;
- notificações;
- persistência;
- API REST.

---

# Identidade visual

Paleta oficial:

```css
:root {
  --color-1: #5cacc4;
  --color-2: #8cd19d;
  --color-3: #cee879;
  --color-4: #fcb653;
  --color-5: #ff5254;
}
```

Uso recomendado:

| Cor | Uso |
|---|---|
| `#5cacc4` | Primária |
| `#8cd19d` | Sucesso |
| `#cee879` | Destaque suave |
| `#fcb653` | Atenção |
| `#ff5254` | Erro/perigo |

A interface deve utilizar tokens semânticos em vez de espalhar hexadecimal diretamente pelo código.

---

# Docker

Os serviços principais são:

```text
web
server
postgres
redis
```

Exemplo conceitual:

```text
Internet
   ↓
Nginx Proxy Manager (já no servidor, fora do escopo)
   ↓
proxy network
   ↓
web
   ↓
server
   ↓
internal network
   ├── postgres
   └── redis
```

O Compose da aplicação não inclui o container do Nginx Proxy Manager. `web` e `server` entram na rede `proxy` para serem alcançados por esse proxy.

---

# Rede `proxy`

A aplicação precisa participar de uma rede Docker externa chamada:

```text
proxy
```

Essa rede é o ponto de contato com o Nginx Proxy Manager já instalado no servidor. O NPM não é criado nem configurado por este projeto.

Se a rede ainda não existir no servidor, criar previamente:

```bash
docker network create proxy
```

Caso a rede já exista, não é necessário recriá-la.

Somente `web` e, caso necessário, `server` participam dessa rede, para que o proxy existente alcance a aplicação. PostgreSQL e Redis permanecem somente na rede interna.

---

# Banco

O banco utiliza:

```text
PostgreSQL 18
PostGIS
```

O PostgreSQL não deve ficar acessível publicamente.

A aplicação deve utilizar uma URL interna semelhante a:

```text
postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/helios_altas
```

O serviço de banco deve possuir volume persistente.

---

# Redis

Redis é utilizado para:

- jobs;
- filas;
- notificações;
- processamento assíncrono;
- expiração de solicitações.

Redis não deve ficar exposto à internet.

---

# Instalação

## Pré-requisitos

Instalar:

- Docker
- Docker Compose
- Git

Em ambiente Linux, verificar:

```bash
docker --version
docker compose version
git --version
```

---

# Configuração

Copiar:

```bash
cp .env.example .env
```

Nunca versionar `.env` com secrets reais.

---

# Execução

Subir a infraestrutura:

```bash
docker compose up -d
```

Visualizar serviços:

```bash
docker compose ps
```

Visualizar logs:

```bash
docker compose logs -f
```

Logs somente do backend:

```bash
docker compose logs -f server
```

Logs somente do frontend:

```bash
docker compose logs -f web
```

Parar:

```bash
docker compose down
```

---

# Healthchecks

Backend:

```text
GET /health
GET /ready
```

O Docker Compose deve utilizar healthchecks para evitar que aplicações dependentes iniciem antes das dependências essenciais.

---

# Desenvolvimento

Preferir executar:

- Angular em modo de desenvolvimento;
- Node em modo watch;
- PostgreSQL/PostGIS no Docker;
- Redis no Docker.

O ambiente local deve permitir desenvolvimento sem necessidade de instalar PostgreSQL diretamente na máquina.

---

# Estrutura do backend

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
├── modules/
├── schemas/
├── events/
└── index.ts
```

A organização detalhada está em:

[`ARCHITECTURE.md`](./ARCHITECTURE.md)

---

# Estrutura do frontend

```text
apps/web/
└── src/
    └── app/
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

# Fluxo principal

```text
Cliente
   ↓
Pesquisa ou cria solicitação
   ↓
ServiceRequest
   ↓
Matching
   ↓
Parceiros compatíveis
   ↓
Notificação
   ↓
Parceiro aceita/recusa
   ↓
Atendimento
```

---

# Estados da solicitação

```text
PENDING
SEARCHING
ACCEPTED
IN_PROGRESS
COMPLETED
CANCELLED
EXPIRED
```

---

# Geolocalização

A plataforma utiliza PostGIS para:

- encontrar parceiros próximos;
- calcular distância;
- filtrar por raio;
- realizar matching;
- gerar mapas administrativos;
- analisar concentração geográfica.

A localização exata de um parceiro não deve ser exposta ao cliente sem necessidade.

---

# API

A API é versionada:

```text
/api/v1
```

Exemplos:

```text
/api/v1/auth
/api/v1/users
/api/v1/partners
/api/v1/categories
/api/v1/service-requests
/api/v1/notifications
/api/v1/admin
```

---

# Segurança

O sistema deve implementar:

- autenticação;
- RBAC;
- validação;
- rate limiting;
- CORS;
- headers de segurança;
- tratamento de erros;
- logs;
- secrets via ambiente;
- banco não público;
- Redis não público;
- proteção de ownership.

---

# Documentação

Leia os documentos nesta ordem:

## 1. README.md

Orientação geral para executar e entender o projeto.

## 2. ARCHITECTURE.md

Decisões de arquitetura e dependências entre módulos.

## 3. CONVENTIONS.md

Regras para escrever e organizar código.

---

# Escopo do MVP

A primeira entrega prioriza:

- autenticação;
- cadastro de clientes;
- cadastro de parceiros;
- categorias;
- localização;
- busca;
- solicitação;
- matching;
- notificações web;
- aceite/recusa;
- acompanhamento;
- dashboard administrativo;
- mapas administrativos.

Fora do MVP:

- aplicativo mobile;
- pagamentos;
- marketplace financeiro;
- chat completo;
- avaliações avançadas;
- assinatura;
- cupons;
- machine learning.

---

# Princípio do projeto

O Helios Altas deve permanecer simples na primeira versão.

A arquitetura deve ser preparada para crescer, mas não deve introduzir complexidade que o produto ainda não precisa.
