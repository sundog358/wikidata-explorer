---
name: ship
description: "Safely ship this repository to origin/main. Use when the user says ship, ship now, ship it, push main, stage commit push, or asks to publish the current Wikidata Explorer work. Runs a locked workflow including preflight, staging, npm verify, commit, safe worktree cleanup, rebase sync, push, and report."
---

# Ship

Use this skill to publish this project to `origin/main` safely and repeatably.

## Hard Rules

- Operate only from the repository root.
- Ship only from branch `main`. If not on `main`, stop and report the current branch.
- Never force-push.
- Never skip verification.
- Never commit if `npm run verify` fails.
- Never remove dirty, unmerged, locked, or current worktrees.
- Never revert user changes to make shipping easier.
- Do not use interactive git commands.
- Keep the final report concise and include what was committed, whether remote moved, verification result, and push result.

## Locked Workflow

Run the steps in this exact order.

### 1. Preflight

1. Confirm repo root:
   - `git rev-parse --show-toplevel`
   - `git status --short --branch`
2. Confirm current branch is exactly `main`:
   - `git branch --show-current`
   - If not `main`, stop.
3. Fetch remote state:
   - `git fetch origin main`
4. Classify state:
   - Local changes: `git status --porcelain` has output.
   - Unpushed commits: `git rev-list --count origin/main..HEAD` is greater than `0`.
   - Behind remote: `git rev-list --count HEAD..origin/main` is greater than `0`.
   - Nothing to do: no local changes and no unpushed commits.

If nothing to do after fetch, report clean/no-op and stop before staging.

### 2. Stage

Run:

```bash
git add -A
```

Then inspect staged changes:

```bash
git diff --cached --stat
git diff --cached --name-status
```

If there are no staged changes but there are unpushed commits, continue to worktree cleanup and sync.

### 3. Verify Gate

Run this repo's verification command:

```bash
npm run verify
```

If it fails, abort the whole ship immediately:

- Do not commit.
- Do not pull/rebase.
- Do not push.
- Report the failed command and the highest-signal error lines.

### 4. Commit

Commit only if there are staged changes.

Draft a conventional commit message from the staged diff:

- Prefer `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, or `refactor: ...`.
- Keep the subject under 72 characters when reasonable.
- Include a short body if multiple areas changed.
- Include this trailer exactly:

```text
Co-Authored-By: Codex <codex@openai.com>
```

Use a non-interactive commit command, for example:

```bash
git commit -m "feat: improve wikidata explorer" -m "Co-Authored-By: Codex <codex@openai.com>"
```

If there are no staged changes and the branch is ahead of `origin/main`, skip commit and continue.

### 5. Worktree Cleanup

Run:

```bash
git worktree prune
git worktree list --porcelain
```

Only remove an auxiliary worktree when all are true:

- It is not the current repository path.
- Its branch is already fully merged into `main`.
- Its working tree is clean.
- It is not locked.

Before removing a worktree, check it directly:

```bash
git -C <worktree-path> status --porcelain
git branch --merged main --format "%(refname:short)"
```

Remove safe worktrees with:

```bash
git worktree remove <worktree-path>
```

If uncertain, leave the worktree in place and mention it in the report.

### 6. Sync

Capture the remote commit before pulling:

```bash
git rev-parse origin/main
```

Then run:

```bash
git pull --rebase origin main
```

After the pull, capture `origin/main` again. If the remote moved, re-run:

```bash
npm run verify
```

If re-verification fails, stop before pushing and report the failure.

### 7. Push

Run:

```bash
git push origin main
```

Do not use `--force` or `--force-with-lease`.

### 8. Report

Report briefly:

- Preflight state: local changes, unpushed commits, or no-op.
- Commit hash and subject, if a commit was created.
- Worktrees removed or skipped.
- Whether remote moved during sync.
- Verification result.
- Push result.

## Current-State Case: Clean Tree, Ahead 1

If preflight finds a clean worktree and `origin/main..HEAD` is `1`:

1. Skip staging and commit.
2. Run worktree cleanup.
3. Pull with rebase from `origin/main`.
4. Re-run `npm run verify` only if the remote moved.
5. Push `HEAD` to `origin/main`.
6. Report that the existing unpushed commit was shipped.