#!/usr/bin/env bash
# Markerer en vellykket udrulning.
# Brug: scripts/tag-deploy.sh "kort beskrivelse af hvad der er rullet ud"
#
# Laver et tomt commit "chore(release): <beskrivelse>" på default-branchen (main/master) og pusher det. GitHub Actionen
# (.github/workflows/changelog.yml) sætter derefter dato-tagget (v2026.10.17, v2026.10.17.2 ...)
# på det commit og opdaterer CHANGELOG.md. Tags kan ikke pushes fra cloud-sessioner, derfor
# går det via et commit – og det virker ens fra Claude Code, claude.ai og din egen maskine.
set -euo pipefail

msg="${1:-}"
if [ -z "$msg" ]; then
  echo "Brug: $0 \"kort beskrivelse af udrulningen\"" >&2
  exit 1
fi

# Repoets default-branch (main eller master) – læses fra origin/HEAD, ellers fra GitHub.
default=$(git symbolic-ref -q --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||' || true)
if [ -z "$default" ]; then
  default=$(git remote show origin 2>/dev/null | sed -n 's/.*HEAD branch: //p')
fi
default=${default:-main}

branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$branch" != "$default" ]; then
  echo "Du står på '$branch'. Udrulninger markeres kun på $default." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Der er ucommittede ændringer. Commit og push først, så markeringen peger på det, der faktisk er rullet ud." >&2
  exit 1
fi

git fetch --quiet origin "$default"
if ! git merge-base --is-ancestor HEAD "origin/$default"; then
  echo "Din seneste commit er ikke pushet til origin/$default. Kør 'git push' først." >&2
  exit 1
fi

git commit --quiet --allow-empty -m "chore(release): $msg"
# Actionen kan have committet CHANGELOG.md siden fetch – rebase (tomt commit flyttes problemfrit) og push.
git pull --quiet --rebase origin "$default"
git push --quiet origin "$default"
echo "Udrulning markeret: $(git rev-parse --short HEAD) – GitHub Actionen sætter dato-tag og opdaterer CHANGELOG.md om ca. et minut."
