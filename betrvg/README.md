# BR-Rechtshelfer – BetrVG

Kostenlose, responsive statische Web-App für die eigenständige Suche im Betriebsverfassungsgesetz.

## Funktionen
- Suchanfragen in Alltagssprache, häufige Themen und einfache Rückfragen mit Kontext
- Volltextsuche in **allen** Paragraphen des BetrVG anhand der lokal eingebundenen XML-Daten
- Normzitat (bei kuratierten Thema-Treffern auch Absatz/Nummer), Originalwortlaut und direkten amtlichen Link
- Einfach erklärte Themenhinweise, klar von den offiziellen Originaltexten getrennt
- Paragraphenverzeichnis und lokal gespeicherte Merkliste
- Browserbasiert, kein Account, kein App-Download, keine Frage an Server übermittelt

## Datenquelle, Aktualität und Grenzen
Die Datei betrvg.xml beruht auf dem offiziellen XML des BMJ-Angebots [gesetze-im-internet.de/betrvg](https://www.gesetze-im-internet.de/betrvg/). Initiale Datei aus der öffentlichen Spiegelung jandinter/gesetze-im-internet. Als offizielle nachprüfbare Fundstelle wird ausnahmslos die amtliche URL des jeweiligen Paragraphen ausgegeben. Die Originalgesetzesfassung wies beim initialen Abgleich zuletzt die Änderung vom 19.07.2024 aus (verifiziert 12.11.2026).

Der GitHub-Workflow update-betrvg.yml überprüft täglich die XML-Datei direkt beim amtlichen Angebot und ändert den Datenbestand nur, wenn die Validierung erfolgreich ist. GitHub Actions müssen hierfür in den Repository-Einstellungen aktiv sein. Die Links zum Original sind auch dann verfügbar, wenn die Aktualisierung scheitert.

Die Anwendung ist keine KI-gestützte juristische Einzelfallberatung: Sie verwendet Volltextsuche und kuratierte Schlüsselwörter. Sie kann Fragen nicht in jeder Situation vollständig oder abschließend beantworten, weil Voraussetzungen, Rechtsprechung und weitere Gesetze/Tarifverträge relevant sein können. Keine Garantie vollständiger Fehlerfreiheit.

## Nutzung
GitHub Pages veröffentlicht diesen Ordner unter der Unteradresse /betrvg/, soweit GitHub Pages für die Seite aktiv ist.