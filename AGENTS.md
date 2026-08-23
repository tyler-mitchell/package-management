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
- Inspect the index before committing. When another agent already staged files,
  commit only task-owned paths and leave those staged entries untouched.
- If Git reports `index.lock`, wait for the other Git operation; never delete it.
- A request to `commit` authorizes a local commit only.
- A request to `push` authorizes pushing the currently checked-out branch and
  integrating its complete unpushed commit set through the shared PR.
- Consumer-visible package changes include one maintained Bumpy bump file.
- Follow `node_modules/@varlock/bumpy/skills/add-change/SKILL.md` for bump level
  and changelog text.
- Do not create task-specific branches or worktrees.

Before pushing, report every commit not yet on `origin/develop`. Pushes to
`develop` create or update its single ordinary pull request into `main` and
queue auto-merge after required checks. They run project CI and `bumpy ci check`;
merging integrates changes without publishing.

## Release

Only an explicit `release` request authorizes release integration.

1. If intended commits remain local, perform the normal push/integration flow.
2. After GitHub reports that integration complete, Bumpy creates or updates
   `bumpy/version-packages`.
3. Run `pnpm run release:merge` to queue the Bumpy PR for auto-merge.
4. Return to useful work. GitHub owns publication and public verification.

If either PR is behind `main`, update that PR branch once and let required
checks rerun. Never loop over status checks.

Never version packages, edit generated changelogs, publish locally, dispatch
release workflows, poll CI, or read successful-job logs.

## Synchronization

Keep `develop` long-lived. Synchronize it forward from `main` only when the
worktree is clean and no parallel agent has uncommitted work. Fast-forward when
possible; otherwise merge `origin/main` into `develop`. Never rebase or
force-push shared commits, and never switch branches to synchronize.
