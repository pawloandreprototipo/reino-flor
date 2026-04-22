# Configuração de Branch Protection (Manual)

Configure as regras abaixo no GitHub em:
**Settings → Branches → Branch protection rules**

## Branch: `main`

- [x] Require a pull request before merging
  - [x] Require approvals: 1
  - [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - Required checks:
    - `Build`
    - `Tests`
    - `Validate PR to main`
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings
- [x] Restrict who can push: only `release/*` and `hotfix/*` branches via PR

## Branch: `develop`

- [x] Require a pull request before merging
  - [x] Require approvals: 1
- [x] Require status checks to pass before merging
  - Required checks:
    - `Build`
    - `Tests`
    - `Lint`
- [x] Require branches to be up to date before merging
- [ ] Do not allow bypassing (permitir para maintainers em emergências)
