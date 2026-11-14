# Opsætning – gør dette én gang

## 1. Opret skabelon-repoet på GitHub
```bash
gh repo create benisnebisben/repo-skabelon --private --description "Skabelon til nye HM-projekter"
cd repo-skabelon            # efter clone / eller i denne mappe
git init -b main && git add -A && git commit -m "chore: opret repo-skabelon"
git remote add origin git@github.com:benisnebisben/repo-skabelon.git
git push -u origin main
```
Gå derefter til repoets Settings på GitHub og sæt flueben i **Template repository**.

## 2. Tillad at Actions må skrive til repoet
Settings → Actions → General → Workflow permissions → **Read and write permissions**.
(Det er standard for nye private repos, men tjek det – ellers kan Actionen ikke committe CHANGELOG.md.)

## 3. Nyt projekt fremover
```bash
gh repo create benisnebisben/NYT-PROJEKT --private --template benisnebisben/repo-skabelon --clone
```
Udfyld README.md, slet OPSAETNING.md, og du er i gang.

## 4. Eksisterende repos
Kopiér disse filer ind i repoet og commit dem:
- `CLAUDE.md` (tilpas afsnittet "Udrulning" til repoets faktiske deploy-metode)
- `cliff.toml`
- `.github/workflows/changelog.yml`
- `scripts/tag-deploy.sh` (husk `chmod +x`)
- `.gitignore` (flet med den eksisterende – tjek først `git ls-files`, så du ikke ignorerer sporet konfiguration)

Har repoet en håndskrevet `CHANGELOG.md`, så omdøb den til `ARBEJDSLOG.md` og før den videre som dagbog
(verifikationer, udeståender, læringer) – den værdi kan commit-beskeder ikke erstatte.

Lad changeloggen starte ved indførelsen, så gammel, uformateret historik ikke drukner den: sæt i workflowet
`args: --verbose <sha>..`, hvor `<sha>` er den seneste commit før opsætningen (den udelades selv). Så viser
"Ikke udrullet" kun det, der er committet efter indførelsen. Gjort for zendesk-synk, adyen-dandomain-zendesk,
butikskopi og pricescraper 17-10-2026.

Har repoet en `.gcloudignore`/`.dockerignore`: tilføj `.github/`, `scripts/` og `cliff.toml`, så værktøjsfilerne
aldrig kommer i build-konteksten.

## 5. Lokal forhåndsvisning (valgfrit)
`pip install git-cliff` (eller `brew install git-cliff`) og kør `git-cliff` i repoet for at se changeloggen uden at pushe.
