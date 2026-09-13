# CONVENTIONS.md

# Helios Altas — Convenções de Desenvolvimento

## 1. Objetivo

Este documento define regras de código, organização, nomenclatura e comportamento do projeto.

Antes de criar ou alterar código:

1. consultar `ARCHITECTURE.md`;
2. consultar este documento;
3. manter as responsabilidades existentes;
4. evitar abstrações desnecessárias.

---

# 2. Idioma

Código:

- inglês.

Documentação:

- português.

Exemplos:

```text
CreateServiceRequest
ServiceRequestRepository
PartnerController
```

e não:

```text
CriarSolicitacao
RepositorioParceiro
```

---

# 3. Nomenclatura geral

## Classes

PascalCase:

```ts
ServiceRequestService
PartnerRepository
CreatePartner
```

## Funções e variáveis

camelCase:

```ts
createPartner
serviceRequestId
partnerLocation
```

## Constantes

camelCase ou UPPER_SNAKE_CASE dependendo do contexto.

Preferir:

```ts
const defaultPageSize = 20;
```

para constantes locais.

Utilizar:

```ts
MAX_PAGE_SIZE
```

quando for uma constante global de configuração.

## Interfaces e Types

PascalCase:

```ts
Partner
PartnerLocation
CreateServiceRequestInput
```

---

# 4. Arquivos

Usar nomes descritivos.

Preferir:

```text
create-partner.service.ts
partner.repository.ts
partner.controller.ts
partners.routes.ts
service-request.repository.ts
```

Evitar:

```text
service.ts
helper.ts
manager.ts
common.ts
misc.ts
```

quando o nome não revelar responsabilidade.

---

# 5. Backend — módulos

Organizar por domínio.

Exemplo:

```text
modules/partners/
├── controllers/
├── services/
├── repositories/
├── schemas/
├── types/
└── index.ts
```

Não misturar regras de parceiros com regras de categorias sem necessidade.

---

# 6. Controllers

Controller deve ser fino.

Exemplo:

```ts
async create(req, res) {
  const input = createPartnerSchema.parse(req.body);

  const result = await createPartner.execute(input);

  return res.status(201).json(result);
}
```

Controller não deve conter:

- SQL;
- regra complexa;
- cálculo de matching;
- transações complexas;
- lógica de domínio.

---

# 7. Services

Services representam casos de uso.

Preferir nomes orientados a ação:

```text
CreatePartner
UpdatePartner
FindNearbyPartners
CreateServiceRequest
MatchServiceRequest
AcceptServiceRequest
RejectServiceRequest
CancelServiceRequest
```

Evitar services genéricos demais:

```text
PartnerService
SystemService
ManagerService
```

quando houver casos de uso específicos.

---

# 8. Repositories

Repositories abstraem persistência.

Exemplo:

```ts
interface PartnerRepository {
  findById(id: string): Promise<Partner | null>;
  findNearby(...): Promise<Partner[]>;
  save(partner: Partner): Promise<void>;
}
```

Queries geográficas devem permanecer na camada de persistência.

---

# 9. Validação

Toda entrada externa deve ser validada.

Fontes de entrada:

- body;
- params;
- query;
- headers relevantes;
- webhooks.

Utilizar Zod ou equivalente.

Exemplo:

```ts
const createServiceRequestSchema = z.object({
  categoryId: z.string().uuid(),
  description: z.string().min(10).max(2000),
  latitude: z.number(),
  longitude: z.number(),
  isHomeService: z.boolean(),
});
```

---

# 10. Erros

Nunca utilizar:

```ts
throw new Error("Erro");
```

para representar indiscriminadamente erros de negócio.

Criar erros de domínio/aplicação claros.

Exemplos:

```text
PartnerNotFoundError
ServiceRequestNotFoundError
ServiceRequestAlreadyAcceptedError
UnauthorizedServiceRequestAccessError
InvalidServiceRequestStateError
```

O middleware global deve converter erros conhecidos em respostas HTTP consistentes.

---

# 11. Status HTTP

Usar códigos HTTP semanticamente adequados.

Exemplos:

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
429 Too Many Requests
500 Internal Server Error
```

---

# 12. Resposta da API

Manter formato consistente.

Exemplo:

```json
{
  "data": {
    "id": "..."
  }
}
```

Erro:

```json
{
  "error": {
    "code": "SERVICE_REQUEST_ALREADY_ACCEPTED",
    "message": "The service request has already been accepted."
  }
}
```

Não retornar stack trace ao cliente.

---

# 13. Autorização

Nunca confiar somente no frontend.

Exemplo incorreto:

```text
Frontend esconde botão
→ considera usuário autorizado
```

O correto:

```text
Frontend esconde botão
+
Backend valida ownership/role
```

---

# 14. Ownership

Toda consulta de recurso privado deve verificar quem é o proprietário ou se o usuário possui autorização adequada.

Exemplo:

```text
GET /service-requests/:id
```

não deve simplesmente buscar por ID.

Deve verificar:

```text
usuário
+
papel
+
permissão
+
ownership/contexto
```

---

# 15. Transações

Utilizar transação quando múltiplas alterações precisam ser atômicas.

Exemplo importante:

```text
aceitar solicitação
+
registrar parceiro
+
alterar status
```

deve ser tratado como uma operação consistente.

---

# 16. Matching

O módulo de matching não deve ficar dentro de:

```text
PartnerController
```

ou:

```text
ServiceRequestController
```

O matching pertence ao domínio:

```text
modules/matching
```

---

# 17. Geolocalização

Não fazer:

```ts
partners
  .map(...)
  .filter(...)
```

para calcular distância em grandes volumes.

Utilizar PostGIS.

O backend deve receber filtros como:

```text
latitude
longitude
radius
```

e delegar a busca geográfica ao banco.

---

# 18. Frontend Angular

Organizar por feature.

Exemplo:

```text
features/
├── auth/
├── client/
├── partner/
└── admin/
```

Cada feature pode possuir:

```text
components/
pages/
services/
models/
```

Não criar um diretório global gigantesco com centenas de componentes.

---

# 19. Componentes Angular

Componentes devem ser pequenos e focados.

Evitar componentes que façam simultaneamente:

- requisição HTTP;
- regras de negócio;
- controle de formulário;
- lógica de layout;
- tratamento de notificações;
- processamento de dados complexo.

Separar responsabilidades.

---

# 20. Design system

A aplicação deve utilizar tokens semânticos.

Paleta Helios:

```css
--color-1: #5cacc4;
--color-2: #8cd19d;
--color-3: #cee879;
--color-4: #fcb653;
--color-5: #ff5254;
```

Criar tokens derivados:

```text
--color-primary
--color-primary-foreground
--color-success
--color-warning
--color-danger
--color-background
--color-surface
--color-border
--color-text
--color-muted
```

Não espalhar hexadecimais diretamente pelos componentes.

Evitar:

```css
color: #5cacc4;
```

em dezenas de arquivos.

Preferir:

```css
color: var(--color-primary);
```

---

# 21. Mobile-first

Sempre implementar primeiro:

```text
mobile
↓
tablet
↓
desktop
```

Evitar construir desktop e depois tentar adaptar.

Elementos essenciais devem funcionar em telas pequenas sem depender de hover.

---

# 22. Acessibilidade

Implementar no mínimo:

- contraste adequado;
- foco visível;
- navegação por teclado;
- labels em formulários;
- aria quando necessário;
- mensagens de erro associadas aos campos;
- áreas clicáveis adequadas para mobile;
- não depender exclusivamente de cor para comunicar estado.

---

# 23. API Client no Angular

Centralizar acesso HTTP.

Evitar chamadas HTTP espalhadas diretamente pelos componentes.

Preferir serviços como:

```text
PartnerApiService
ServiceRequestApiService
AuthApiService
AdminApiService
```

---

# 24. Estado

Não criar um state management global para tudo sem necessidade.

Primeiro avaliar:

- estado local;
- services;
- signals;
- route state.

Adicionar uma solução global apenas quando a complexidade justificar.

---

# 25. Ambiente

Variáveis configuráveis devem ficar em ambiente.

Exemplos:

```text
NODE_ENV
DATABASE_URL
REDIS_URL
JWT_SECRET
API_PORT
WEB_URL
```

Nunca commitar secrets reais.

Manter:

```text
.env.example
```

com valores ilustrativos.

---

# 26. Docker

Os containers devem:

- possuir healthcheck quando apropriado;
- usar `restart: unless-stopped` quando aplicável;
- possuir `init: true` quando necessário;
- evitar rodar como root quando a imagem permitir;
- possuir volumes apenas para dados persistentes;
- evitar portas desnecessárias;
- não expor PostgreSQL publicamente;
- não expor Redis publicamente.

---

# 27. Git

Branches:

```text
main
develop
feature/<nome>
fix/<nome>
refactor/<nome>
chore/<nome>
docs/<nome>
```

Exemplo:

```text
feature/service-request-matching
fix/partner-location
docs/update-architecture
```

---

# 28. Commits

Preferir Conventional Commits.

Exemplos:

```text
feat: add partner registration
feat: implement nearby partner search
fix: prevent duplicate service request acceptance
refactor: extract notification service
docs: update architecture documentation
chore: update docker compose
test: add service request tests
```

---

# 29. Testes

Prioridade:

1. regras de negócio;
2. casos de uso;
3. autorização;
4. transações importantes;
5. matching;
6. geolocalização;
7. controllers críticos.

Testes devem validar comportamento, não implementação interna.

---

# 30. Logs

Logs devem ser úteis e estruturados.

Exemplo:

```json
{
  "level": "info",
  "event": "service_request_created",
  "serviceRequestId": "...",
  "userId": "..."
}
```

Não registrar:

- senhas;
- tokens;
- secrets;
- informações sensíveis desnecessárias.

---

# 31. Observabilidade

Endpoints obrigatórios:

```text
GET /health
GET /ready
```

`/health` deve responder se o processo está vivo.

`/ready` deve validar dependências essenciais quando apropriado.

---

# 32. Banco

Migrations devem ser versionadas.

Nunca alterar produção manualmente como procedimento normal.

Seeds devem ser idempotentes quando possível.

---

# 33. Documentação

Alterações arquiteturais relevantes devem atualizar:

```text
ARCHITECTURE.md
```

Alterações nas regras de desenvolvimento devem atualizar:

```text
CONVENTIONS.md
```

Alterações de instalação/execução devem atualizar:

```text
README.md
```

---

# 34. Regra de simplicidade

Evitar:

- abstrações genéricas sem uso real;
- design patterns por moda;
- microserviços prematuros;
- bibliotecas para problemas triviais;
- duplicação de frameworks;
- complexidade operacional desnecessária.

Preferir código explícito, pequeno e previsível.

---

# 35. Princípio final

O código deve ser escrito para que outro desenvolvedor consiga responder rapidamente:

> Onde está a regra que faz isso?

Se a resposta exigir percorrer controllers, helpers, hooks e abstrações genéricas sem uma fronteira clara, a implementação deve ser simplificada.
