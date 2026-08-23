# Agent Workflow

## Shared branches

- Daily branch: `main`
- Bumpy base branch: `release`
- Generated version PR: `bumpy/version-packages`

The human owns the checked-out branch. Agents never create, switch, rename, delete,
reset, or replace branches unless the human explicitly requests that exact
operation. If a session starts on another branch, continue there and report the
difference; never “correct” it by switching.

## Daily changes

- Work and commit on the currently checked-out branch.
- Stage only files owned by the current task; preserve parallel agents’ changes.
- Inspect the index before committing. When another agent already staged files,
  use `git commit --only -- <task-owned paths>` and leave those staged entries
  untouched.
- If Git reports `index.lock`, wait for the other Git operation; never delete it.
- A request to `commit` authorizes a local commit only.
- A request to `push` authorizes pushing the currently checked-out branch and
  its complete unpushed commit set.
- Consumer-visible package changes include one maintained Bumpy bump file.
- Follow `node_modules/@varlock/bumpy/skills/add-change/SKILL.md` for bump level
  and changelog text.
- Do not create task-specific branches or worktrees.

Before pushing `main`, report every commit not yet on `origin/main`. Bump files
accumulate on `main`; pushing it does not invoke Bumpy's release workflow.

If the push is rejected because the remote advanced, never force-push or rebase.
When the worktree is clean and no parallel agent has uncommitted work, merge
`origin/main` into the checked-out `main`, then push once.

## Release

Only an explicit `release` request authorizes integrating `main` into `release`
and merging the generated version PR.

1. If intended commits remain local, perform the normal push flow.
2. Create or update the ordinary `main → release` pull request. Required project
   checks and `bumpy ci check` gate its merge.
3. Merge that ordinary pull request. The push to `release` makes Bumpy create or
   update `bumpy/version-packages`.
4. Run `pnpm run release:pr` once. If the PR is absent, return to useful work;
   GitHub owns the pending workflow.
5. When the PR exists, run
   `pnpm run release:merge` to queue it for auto-merge.
6. Return to useful work. GitHub owns publication and public verification.

If the version PR is behind `release`, run `pnpm run release:update` once and let
required checks rerun. Never loop over status checks.

Never version packages, edit generated changelogs, publish locally, dispatch
release workflows, poll CI, or read successful-job logs.

## Synchronization

After publication, synchronize `main` forward from `release` only when the
worktree is clean and no parallel agent has uncommitted work. Never rebase or
force-push shared commits, and never switch branches to synchronize.
