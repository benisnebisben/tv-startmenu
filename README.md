# PROJEKTNAVN

> Udskift denne fil, men behold afsnittene. Arbejdsregler står i `CLAUDE.md`; ændringshistorik i `CHANGELOG.md` (genereres automatisk).

## Formål
Hvad løser projektet, og for hvem? To-tre sætninger.

## Sådan køres det
- Lokalt: `...`
- I drift: Hvor er det deployet (Cloud Run-service/region, Scheduler-job, Apps Script-projekt)? Hvordan rulles det ud?

## Secrets og konfiguration
Navne på secrets i Google Secret Manager (aldrig værdier):
- `EKSEMPEL_API_KEY` – bruges til ...

Lokalt: kopiér `.env.example` til `.env` og udfyld.

## Datakilder
Hvor kommer data fra, og hvor skriver projektet til? (Supabase-tabel, Google Drev-mappe, DanDomain-API ...)

## Undtagelser fra standardreglerne
Kører noget lokalt i stedet for i skyen, eller ligger der en datafil i repoet? Skriv hvorfor her.

## Udrulningshistorik
Se `CHANGELOG.md`. Hvert dato-tag (`v2026.10.17`) svarer til en udrulning; "Ikke udrullet" er commits, der endnu ikke er i drift.
