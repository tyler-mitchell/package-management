---
name: release-package
description: Record and release package changes through the repository's local Bumpy workflow.
---

# Release packages

For a consumer-visible package change, follow
`node_modules/@varlock/bumpy/skills/add-change/SKILL.md` and commit its bump file
with the implementation on a feature branch. Open an ordinary pull request;
never push release-bearing work directly to `main`.

An explicit release request authorizes one command after Bumpy creates
`bumpy/version-packages`:

```sh
pnpm run release:merge
```

The command enables auto-merge; required checks gate the merge. Return to useful
work. GitHub owns publication and public verification. Inspect the workflow only
when GitHub reports failure. Never version, publish, dispatch, or poll locally.
