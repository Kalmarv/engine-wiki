#!/usr/bin/env bash
# Build the committed HEAD in a clean worktree (.wt/head), so pages other writers have not committed can't hide a
# broken link or break the build, then push exactly that commit to origin/main. Usage: bash scripts/verify-and-push.sh
# [--no-push]. The worktree's dist/ is the last verified build (handy to serve locally).
set -euo pipefail
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
SHA=$(git rev-parse HEAD)
[ -d .wt/head ] || git worktree add -q --detach .wt/head "$SHA"
cd .wt/head
git checkout -q --detach "$SHA"
pnpm install --frozen-lockfile --prefer-offline >/dev/null
pnpm -s check
pnpm build > ../head-build.log 2>&1 || { grep -E "ERROR|Error" ../head-build.log | head -20; exit 1; }
grep -E "page\(s\) built" ../head-build.log
if [ "${1:-}" != "--no-push" ]; then
  cd "$ROOT"
  git push -q origin "$SHA:main"
  echo "pushed $SHA"
fi
