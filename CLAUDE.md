# Arbejdsregler for dette repo

Gælder for alle AI-sessioner (Claude Code, claude.ai, andre agenter) og for mig selv.
Reglerne her vinder over generelle præferencer, hvis de er i konflikt.

## Før du rører noget
- Kør `git pull` først. `CHANGELOG.md` committes af en GitHub Action, så `main` kan være foran din klon.
- Læs `README.md` og de seneste punkter i `CHANGELOG.md` for kontekst.

## Fremgangsmåde – grundigt, ikke hurtigt
1. Forstå opgaven og konteksten.
2. Vurdér om ændringen kan ødelægge noget andetsteds, og om den kan bygges klogere/mere robust.
3. Byg.
4. Gennemgå din egen kode igen med friske øjne som erfaren kodetester – med hele konteksten in mente.
5. Ret og optimér.
6. Test, og **vis** at det virker (output, log, testkørsel). Sig aldrig "det burde virke".
7. Først derefter: commit, push, udrulning.

## Commits (det er herfra changeloggen kommer)
- Én commit pr. logisk ændring – ikke én kæmpe commit, ikke tyve bittesmå.
- Format: **Conventional Commits, på dansk**:
  - `feat(scope): hvad og hvorfor` – ny funktionalitet
  - `fix(scope): ...` – fejlrettelse
  - `refactor(scope): ...` – omstrukturering uden funktionel ændring
  - `perf(scope): ...` – ydelse
  - `docs: ...` – dokumentation
  - `test: ...` – tests
  - `chore: ...` / `ci: ...` / `build: ...` – drift, afhængigheder, pipeline
- Første linje: maks ca. 72 tegn, siger *hvad* **og** *hvorfor*. Kan "hvorfor" ikke stå på én linje, skriv en body (tom linje, derefter tekst).
- Breaking change: `!` efter typen, fx `feat(api)!: skift til ny prisstruktur`.
- Push straks efter hver commit (`git push`). Sandbox-miljøer forsvinder – upushet arbejde er tabt arbejde.
- **Rediger aldrig `CHANGELOG.md` manuelt.** Den genereres af git-cliff ud fra commit-beskederne. Vil du have noget i changeloggen, så skriv det i commit-beskeden.

## Udrulning (Cloud Run, Scheduler, Apps Script m.m.)
- Udrulning sker manuelt (typisk via Claude) – aldrig automatisk fra `main`.
- Efter en vellykket udrulning: `scripts/tag-deploy.sh "kort beskrivelse af hvad der er rullet ud"`.
  Det laver et tomt commit `chore(release): …` på `main` og pusher det. GitHub Actionen sætter så dato-tagget (`v2026.10.17`, evt. `v2026.10.17.2`) på det commit og laver en ny sektion i changeloggen. (Tags kan ikke pushes fra cloud-sessioner – derfor går det via et commit.)
- Sektionen **"Ikke udrullet"** øverst i `CHANGELOG.md` viser præcis, hvad der er committet, men endnu ikke i drift.

## Data og nøgler
- Kundedata, rå datadumps og nøgler kommer aldrig i repoet. Nøgler ligger i Google Secret Manager; lokalt i `.env` (gitignored).
- `.gitignore` udelukker `data/`, `*.csv` og `*.xlsx` som standard. Skal en datafil undtagelsesvist med, tilføjes den bevidst med `git add -f` og begrundes i README.
- Faste kørsler kører i skyen (Cloud Run/Scheduler eller planlagte Claude-opgaver). Kører noget lokalt, står begrundelsen i README.

## Dokumentation
- `README.md` beskriver formål, hvordan det køres, hvor det er deployet, og hvilke secrets det bruger (navne, aldrig værdier).
- Opdater README i samme commit som den ændring, der gør den forældet.
