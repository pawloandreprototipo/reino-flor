---
inclusion: auto
---

# Git Workflow Rules

## PR Merge Strategy

When merging PRs via the GitHub API, ALWAYS use:
- `merge_method: "squash"` — squash all commits into one
- `commit_title` — use the PR title (conventional commit format)
- `commit_message` — use the full PR description body

This ensures a clean linear history on develop/main with descriptive commit messages.

## Commit Convention

Follow conventional commits: `type(scope): description`

Types: feat, fix, chore, docs, refactor, test, ci, build
Scope: the app or package name (api, admin, storefront, workers, database, auth, ui)

## Branch Naming

Feature branches: `feature/{feature-name}`
Bugfix branches: `fix/{bug-name}`
Always branch from `develop`.

## Before Pushing

ALWAYS run the full build locally before pushing:
1. `npx tsc --noEmit` in apps/workers
2. `npx next build` in apps/admin
3. `npx next build` in apps/storefront
4. `npx next build` in apps/api
5. `npx jest --passWithNoTests --no-coverage` in apps/api

Only push after ALL builds and tests pass.
