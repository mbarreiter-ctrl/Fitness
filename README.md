# Formkurve

Fitness-Tracker als Web-App (PWA) für das iPhone, ohne App Store und ohne Apple-Developer-Abo.

## Lokal ansehen

```bash
cd ~/Documents/Claude/Apps/Fitness && python3 -m http.server 5178
```

Dann im Browser http://localhost:5178 öffnen.

## Aufs iPhone bringen

Damit „Zum Home-Bildschirm“ und Offline-Betrieb funktionieren, muss die App über **HTTPS** erreichbar sein. Zwei kostenlose Wege:

1. **Netlify Drop**: auf app.netlify.com/drop den Ordner `Fitness` ins Browserfenster ziehen. Du bekommst sofort eine https-Adresse.
2. **GitHub Pages**: den Ordner in ein Repository pushen und unter *Settings → Pages* aktivieren.

Auf dem iPhone die Adresse in **Safari** öffnen und dann *Teilen → Zum Home-Bildschirm* wählen.

Die Daten liegen nur im Speicher der App auf dem Gerät. Unter *Profil → Backup exportieren* kannst du sie sichern.

## Aufbau

| Datei | Inhalt |
|---|---|
| `js/exercises.js` | ca. 135 Übungen auf Deutsch mit Muskelgruppen, Kraft-Richtwerte, Workout-Arten |
| `js/model.js` | Fortschrittsmodell, Stagnations-Erkennung, Gewichtsvorschläge, XP/Abzeichen |
| `js/charts.js`, `js/body.js` | SVG-Charts und Muskelkarte |
| `js/app.js` | Oberfläche |

## Das Fortschrittsmodell

- Pro Training wird das **geschätzte 1RM** berechnet (Epley-Formel, bester Satz).
- Der Trend ist eine **robuste lineare Regression** über die letzten 4, 6 oder 10 Wochen, je nach Einstufung. Einzelne Ausreißer werden heruntergewichtet. Deload-Einheiten und Wiedereinstiege nach einer Pause zählen nicht mit.
- Die **erwartete Steigerung** pro Woche hängt ab von:
  - **Erfahrung**: Anfänger ca. 2 %, Fortgeschrittene ca. 0,5 %, Erfahrene ca. 0,15 %
  - **Trainingshäufigkeit** dieser Übung in jeder Woche: 1× zählt 60 %, 2× zählt 90 %, ab 3× 100 %, eine Woche ohne Training 0
  - **Pausen**: Ab 14 Tagen ohne die Übung wird ein leichter Kraftverlust einkalkuliert.
  - **Ziel fürs Körpergewicht**: Im Defizit ist für Trainierte Kraft halten schon ein Erfolg.
- Liegt der Trend unter 30 % der Erwartung (mindestens 4 Einheiten über 3 Wochen), meldet die App eine **Stagnation**. Dann schlägt sie eine leichtere Woche (−10 %) oder einen anderen Wiederholungsbereich vor.
- **Gewichtsvorschläge** folgen der doppelten Progression: Erst wenn alle Sätze das obere Ende des Wiederholungsbereichs erreichen, kommt mehr Gewicht dazu.
- **Muskelvolumen**: 10–20 Sätze pro Muskel und Woche gelten als optimaler Bereich. Mitbeteiligte Muskeln zählen halb.
- **Kraft-Richtwerte** gibt es nur für die fünf großen Langhantelübungen. Es sind grobe Werte relativ zum Körpergewicht.

## Daten aus anderen Apps importieren

Unter *Profil → Aus anderer App importieren* lässt sich ein CSV-Export einlesen, z. B. von FitnessOnline (Spalten: Datum, Übung, Satz, Gewicht (kg), Wdh., Uhrzeit, Notiz). Vor dem Übernehmen zeigt die App eine Vorschau.

- Bekannte Übungsnamen werden dem Katalog zugeordnet (`js/import.js`, `IMPORT_MAP`). Unbekannte Namen werden als eigene Übung angelegt, die Muskelgruppe schätzt die App anhand von Stichworten.
- Notizen wie „liegend“, „Kurzhantel“ oder „Smith“ machen aus einer Einheit eine eigene Variante. So sieht ein Gerätewechsel nicht wie Kraftverlust aus.
- Zeitübungen (Planke 30 s) und Cardio landen als Notiz am Training.
- Ein erneuter Import ersetzt die zuvor importierten Trainings, statt sie doppelt anzulegen.

CSV-Dateien sind per `.gitignore` vom Repository ausgeschlossen, damit persönliche Trainingsdaten nicht öffentlich werden.
