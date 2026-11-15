# Changelog

Denne fil genereres automatisk af [git-cliff](https://git-cliff.org) ud fra commit-historikken.
Ret den ikke manuelt – skriv i stedet gode commit-beskeder (Conventional Commits, på dansk).
Sektionen **Ikke udrullet** indeholder commits, der endnu ikke er sat i drift (ikke tagget).

## [Ikke udrullet]

### Nyt
- **(app)** Launcher-UI med TizenTube, DR, OpenIPTV og kildeliste (c38d4ca)
- **(service)** Service-bro der lister og starter TV'ets apps og henter ikoner (b53eb7e)

### Rettelser
- **(app)** Laes service- og kanal-port fra TizenBrew-URL; laengere opstart; modulliste uafhaengig af service (1559764)
- **(app)** Lyt efter fjernbetjening i capture-fasen saa TizenBrew ikke sluger tasterne (8d3603f)
- **(app)** OpenIPTV som app-felt, diagnostik paa pil ned, synlig debug-HUD (f094252)
- **(pkg)** Fjern ugyldige registerKey-navne (pil/Enter) fra keys (b986c1d)

### Dokumentation
- README med installation, AutoLaunch og hvorfor repoet er offentligt (c485bea)

### Drift
- **(app)** V0.1.1 og synligt build-nr i debug-linje (tvinger frisk hentning i TizenBrew) (d88d5fc)

### Andet
- Merge branch 'main' of https://github.com/benisnebisben/tv-startmenu (a6a5bed)
- Initial commit (a07a6ab)

