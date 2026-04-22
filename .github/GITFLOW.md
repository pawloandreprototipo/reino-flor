# Git Flow - Reino Flor

## Branches

| Branch        | Propósito                              | Protegida |
|---------------|----------------------------------------|-----------|
| `main`        | Código em produção                     | ✅        |
| `develop`     | Branch de integração / staging         | ✅        |
| `feature/*`   | Novas funcionalidades                  | ❌        |
| `bugfix/*`    | Correções não urgentes                 | ❌        |
| `hotfix/*`    | Correções urgentes em produção         | ❌        |
| `release/*`   | Preparação de release                  | ❌        |

## Fluxo de trabalho

### Feature
```
develop → feature/nome-da-feature → PR → develop
```

### Bugfix
```
develop → bugfix/descricao-do-bug → PR → develop
```

### Release
```
develop → release/v1.2.0 → PR → main + develop
```

### Hotfix
```
main → hotfix/descricao-urgente → PR → main + develop
```

## Regras

1. Nunca faça push direto em `main` ou `develop`
2. Toda mudança entra via Pull Request
3. PRs para `main` exigem pelo menos 1 aprovação
4. PRs devem passar no CI (build + testes) antes do merge
5. Use squash merge para features e bugfixes
6. Use merge commit para releases e hotfixes
7. Tags de versão são criadas automaticamente em releases

## Nomenclatura de branches

```
feature/adiciona-pagina-relatorios
bugfix/corrige-calculo-desconto
hotfix/fix-login-producao
release/v1.3.0
```
