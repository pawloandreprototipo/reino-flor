# Contribuindo para o Reino Flor

## Pré-requisitos

- Node.js >= 20
- pnpm >= 9
- Docker e Docker Compose

## Setup local

```bash
# Clone o repositório
git clone <repo-url>

# Instale as dependências
pnpm install

# Suba os serviços (Postgres + Redis)
pnpm docker:up

# Gere o Prisma client e rode as migrations
pnpm db:generate
pnpm db:migrate

# Rode o seed (opcional)
pnpm db:seed

# Inicie o dev server
pnpm dev
```

## Git Flow

Seguimos o modelo Git Flow. Veja [GITFLOW.md](./GITFLOW.md) para detalhes.

### Criando uma feature

```bash
git checkout develop
git pull origin develop
git checkout -b feature/minha-feature
# ... faça suas alterações ...
git add .
git commit -m "feat(admin): adiciona nova funcionalidade"
git push origin feature/minha-feature
# Abra uma PR para develop
```

### Criando um bugfix

```bash
git checkout develop
git pull origin develop
git checkout -b bugfix/descricao-do-bug
# ... faça a correção ...
git commit -m "fix(api): corrige problema X"
git push origin bugfix/descricao-do-bug
# Abra uma PR para develop
```

## Convenção de commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/).
Veja [COMMIT_CONVENTION.md](./COMMIT_CONVENTION.md) para detalhes.

## Pull Requests

1. Preencha o template da PR completamente
2. Garanta que o CI está passando (lint, testes, build)
3. Solicite review de pelo menos 1 membro do time
4. Use squash merge para features e bugfixes

## Testes

```bash
# Rodar todos os testes
pnpm test

# Rodar testes de um pacote específico
pnpm --filter @reino-flor/admin test
pnpm --filter @reino-flor/api test
```

## Estrutura do projeto

```
reino-flor/
├── apps/
│   ├── admin/     → Painel administrativo (Next.js)
│   └── api/       → API REST (Next.js API Routes)
├── packages/
│   ├── auth/      → Autenticação (JWT)
│   ├── database/  → Prisma + migrations
│   └── ui/        → Componentes compartilhados
└── .github/       → Workflows, templates, docs
```
