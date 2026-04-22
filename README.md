# Reino Flor 🌸

Plataforma SaaS de e-commerce multi-tenant — estilo Shopify, feita com Next.js, Prisma, PostgreSQL e Redis.

---

## Pré-requisitos

- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Docker + docker-compose

---

## Instalação

```bash
# 1. Clonar e entrar no projeto
cd reino-flor

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env se necessário (padrão já funciona com Docker local)

# 4. Subir banco de dados e Redis
docker-compose up -d

# 5. Rodar migrations
pnpm db:migrate

# 6. Popular banco com dados iniciais
pnpm db:seed
```

---

## Rodando o projeto

```bash
# Todos os apps em paralelo
pnpm dev

# Apenas a API
pnpm --filter @reino-flor/api dev

# Apenas o Admin
pnpm --filter @reino-flor/admin dev

# Apenas o Storefront
pnpm --filter @reino-flor/storefront dev
```

| App        | URL                   |
|------------|-----------------------|
| Storefront | http://localhost:3000 |
| API        | http://localhost:3001 |
| Admin      | http://localhost:3002 |

---

## Testes

```bash
# Todos os pacotes
pnpm test

# Apenas auth
pnpm --filter @reino-flor/auth test

# Apenas database
pnpm --filter @reino-flor/database test

# Com coverage
pnpm --filter @reino-flor/auth test -- --coverage
```

---

## Banco de dados

```bash
# Abrir Prisma Studio (GUI do banco)
pnpm db:studio

# Criar nova migration
pnpm db:migrate

# Resetar banco (apaga tudo e re-seed)
pnpm --filter @reino-flor/database db:reset
```

---

## Credenciais padrão (após seed)

| Perfil  | Email                    | Senha       |
|---------|--------------------------|-------------|
| Admin   | admin@reinoflor.com      | admin123    |
| Cliente | cliente@teste.com        | cliente123  |

Cupom de desconto: `BEMVINDO10` (10% off em pedidos acima de R$50)

---

## Estrutura do projeto

```
reino-flor/
├── apps/
│   ├── api/          ← API REST (Next.js API routes)
│   ├── admin/        ← Painel administrativo (Next.js)
│   └── storefront/   ← Loja pública (Next.js)
├── packages/
│   ├── database/     ← Prisma schema + client + seed
│   ├── auth/         ← JWT + bcrypt + RBAC
│   └── ui/           ← Componentes compartilhados
├── docker-compose.yml
├── .env.example
└── pnpm-workspace.yaml
```

---

## Fases de desenvolvimento

- [x] **Fase 1** — Monorepo + Prisma schema + Auth + Docker + Testes
- [ ] **Fase 2** — API REST (autenticação, produtos, pedidos)
- [ ] **Fase 3** — Admin dashboard (Next.js)
- [ ] **Fase 4** — Storefront (loja pública + carrinho + checkout)
- [ ] **Fase 5** — Builder drag-and-drop
- [ ] **Fase 6** — Pagamentos (Stripe + Mercado Pago + PIX)
- [ ] **Fase 7** — Workers (BullMQ + carrinho abandonado + email)
- [ ] **Fase 8** — IA (gerador de loja, descrições, imagens)
- [ ] **Fase 9** — Marketplace + afiliados
- [ ] **Fase 10** — App mobile (React Native/Expo)

---

## Deploy (futuro)

| Serviço    | Plataforma recomendada |
|------------|------------------------|
| Frontend   | Vercel                 |
| API        | Railway / Render       |
| PostgreSQL | Railway / Supabase     |
| Redis      | Upstash                |
| Storage    | AWS S3 / Cloudflare R2 |
