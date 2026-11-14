# tv-startmenu

Lækker TizenBrew-startmenu til stue-TV'et (Samsung UE65TU8005, Tizen 5.5). TV'et
booter via TizenBrew ind i denne menu, så man lander på en ren forside med de ting,
vi rent faktisk bruger — i stedet for Samsungs egen fyldte startskærm.

## Felter
- **YouTube** — TizenBrew-modulet TizenTube (`npm/@foxreis/tizentube`), uden reklamer.
- **DR** — TV'ets rigtige DR-app. Menuen henter appens eget ikon fra TV'et.
- **OpenIPTV** — TizenBrew-modulet `gh/shayanline/OpenIPTV` (M3U/Xtream).
- **Kilder** — åbner TV'ets kildeliste (HDMI 1/2).

Launcheren **åbner** moduler, den **installerer** dem ikke. TizenTube og OpenIPTV skal
være tilføjet i TizenBrews Module Manager først. Står et felt som "ikke installeret"
eller "ikke fundet på TV", mangler modulet/appen på TV'et.

## Hvordan det virker
Et TizenBrew-**app-modul**: en side (`app/`) og et service (`service/`). Siden må ikke
røre `tizen`-API'et; den går gennem service'et (`127.0.0.1:8097`) for at liste og
starte TV'ets apps og hente ikoner. Moduler (TizenTube, OpenIPTV) åbnes over TizenBrews
interne kanal (`ws://127.0.0.1:8081`). Service-broens sikkerheds- og app-logik er
modelleret på den gennemprøvede launcher `SenEyes/tizenbrew-ecran-accueil`.

## Installation på TV'et
Kræver TizenBrew installeret og Developer Mode slået til (begge er på plads).

1. TizenBrew → **Module Manager** → tilføj GitHub-modul: `benisnebisben/tv-startmenu`.
2. Åbn modulet én gang. Tryk **gul tast** for diagnostik og aflæs app-ID'erne for
   DR og kildelisten — sæt dem evt. fast i `app/config.js` (`id`), ellers finder
   menuen dem selv ud fra `match`-ordene.
3. TizenBrew → **Indstillinger → AutoLaunch** → vælg dette modul.
4. Samsung: **Indstillinger → Generelt → Smart-funktioner** → slå *Autorun Smart Hub*
   fra og *Autorun last app* til. Lad TV'et stå i menuen, før du slukker.

Nødudgang: hold **↑** nede mens TizenBrew starter → man lander i TizenBrews egen
modulliste i stedet for menuen.

## Hvorfor repoet er offentligt
TizenBrew henter GitHub-moduler via jsDelivr-CDN'en, som kun serverer **offentlige**
repos. Der er intet følsomt i launcheren: den indeholder kun menuens udseende og de
fire felter. Xtream-logins bor inde i OpenIPTV, ikke her. Ingen nøgler, ingen kundedata.

## Udrulning
"Udrulning" = TV'et henter den nyeste version fra GitHub (via jsDelivr). Efter en
ændring er pushet, genindlæser man modulet på TV'et. jsDelivr kan være nogle timer om
at opdatere `@main`; brug en konkret commit/tag for straks-opdatering.

## Lokalt
Ingen faste kørsler. Alt kører på TV'et i TizenBrews eget Node; intet skrives på TV'et,
og alt nulstilles ved genstart.
