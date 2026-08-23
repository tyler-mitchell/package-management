# Agent Workflow

## Shared branches

- Working branch: `develop`
- Integration branch: `main`
- Bumpy release branch: `bumpy/version-packages`

The human owns the checked-out branch. Agents never create, switch, rename, delete,
reset, or replace branches unless the human explicitly requests that exact
operation. If a session starts on another branch, continue there and report the
difference; never “correct” it by switching.

## Daily changes

- Work and commit on the currently checked-out branch.
- Stage only files owned by the current task; preserve parallel agents’ changes.
- A request to `commit` authorizes a local commit only.
- A request to `push` authorizes pushing the currently checked-out branch only.
- Consumer-visible package changes include one maintained Bumpy bump file.
- Follow `node_modules/@varlock/bumpy/skills/add-change/SKILL.md` for bump level
  and changelog text.
- Do not create task-specific branches or worktrees.

Pushes to `develop` update its ordinary pull request into `main`. They run
project CI and `bumpy ci check`; they do not run the release workflow.

## Release

Only an explicit `release` request authorizes release integration.

1. Push the checked-out working branch.
2. Create or update the one `develop → main` pull request.
3. Queue that pull request for auto-merge after required checks.
4. After it merges, Bumpy creates or updates `bumpy/version-packages`.
5. Run `pnpm run release:merge` to queue the Bumpy PR for auto-merge.
6. Return to useful work. GitHub owns publication and public verification.

Never version packages, edit generated changelogs, publish locally, dispatch
release workflows, poll CI, or read successful-job logs.

## Synchronization

Keep `develop` long-lived. Synchronize it forward from `main` only when the
worktree is clean and no parallel agent has uncommitted work. Never switch
branches to synchronize.
