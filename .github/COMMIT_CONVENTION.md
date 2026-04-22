# Convenção de Commits

Este projeto segue o padrão [Conventional Commits](https://www.conventionalcommits.org/).

## Formato

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

## Tipos permitidos

| Tipo       | Descrição                                          |
|------------|---------------------------------------------------|
| `feat`     | Nova funcionalidade                                |
| `fix`      | Correção de bug                                    |
| `docs`     | Alteração em documentação                          |
| `style`    | Formatação, ponto e vírgula, etc (sem mudança de código) |
| `refactor` | Refatoração de código (sem fix ou feature)         |
| `perf`     | Melhoria de performance                            |
| `test`     | Adição ou correção de testes                       |
| `build`    | Mudanças no build ou dependências                  |
| `ci`       | Mudanças em configuração de CI                     |
| `chore`    | Outras mudanças que não afetam src ou test         |
| `revert`   | Reverte um commit anterior                         |

## Escopos

| Escopo     | Descrição                    |
|------------|------------------------------|
| `admin`    | App admin (Next.js)          |
| `api`      | App API (Next.js)            |
| `auth`     | Package de autenticação      |
| `database` | Package de banco de dados    |
| `ui`       | Package de componentes UI    |
| `deps`     | Dependências                 |
| `ci`       | Configuração de CI/CD        |

## Exemplos

```
feat(admin): adiciona página de relatórios
fix(api): corrige validação de cupons expirados
docs: atualiza README com instruções de setup
test(auth): adiciona testes para refresh token
ci: adiciona workflow de deploy para staging
refactor(database): simplifica queries de analytics
```

## Breaking Changes

Adicione `!` após o tipo/escopo ou `BREAKING CHANGE:` no rodapé:

```
feat(api)!: altera formato de resposta da API de produtos

BREAKING CHANGE: o campo `price` agora retorna centavos ao invés de reais
```
