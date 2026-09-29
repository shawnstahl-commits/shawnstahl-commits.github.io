# E-Check Kids – Projekt-Checkpoint

Stand: 29.09.2026

## Aktuelle Version
- Version: **5.6 Preview**
- Öffentliche Test-URL: https://shawnstahl-commits.github.io/?v=37
- Aktueller Frontend-Checkpoint: `8aa7dc13bb59daa69c3b702f77e5ed06be9d2761`
- Aktueller Cache-Checkpoint: `6254de159bcea128e3fd2c001070265fc7a5a4b7`

## Was bereits funktioniert
- Barcode-Scan per Kamera
- Barcode-Foto als Fallback
- Manuelle Barcode-Eingabe im Vollbild-Scanner
- Produktdaten über Open Food Facts
- Mehrere Produktbild-Quellen mit automatischem Fallback
- Erkennung und Erklärung von E-Nummern
- Besondere EU-Kinderhinweise für E102, E104, E110, E122, E124 und E129
- Vorsichtiger ADS/ADHS-Kontext ohne medizinische Diagnoseversprechen
- Zutaten-Foto mit OCR
- Manuelle Zutaten-/E-Nummern-Suche
- Login / Gastmodus über Supabase
- Verlauf und Favoriten
- Produktvergleich A/B als Beta
- Plus-Bereich als Vorbereitung, noch ohne echte Zahlung
- PWA / Service Worker / Installierbarkeit
- Allergen-Funktionen wurden begonnen und sind bereits teilweise integriert

## Stabilitätsverbesserungen
- Scanner-Start/Stop-Rennen reduziert
- Schutz vor doppelten Barcode-Scans
- Open-Food-Facts-Abfragen mit Timeout und Wiederholungsversuch
- Bessere Fehlermeldungen bei Offline/Timeout
- Verlauf/Favoriten robuster gespeichert
- Produktvergleich mit Kamera und manueller Barcode-Eingabe
- Service-Worker-Versionierung gegen veralteten Cache
- JavaScript nach Änderungen auf Syntaxfehler geprüft

## Wichtige Rücksprungpunkte
- Version 5.6 – manuelle Barcode-Eingabe wieder sichtbar: `8aa7dc13bb59daa69c3b702f77e5ed06be9d2761`
- Version 5.5 – Stabilitäts-Sprint: `71b7d72e752a813631eff9cd9fd1c7c5ea59d449`
- Version 5.3 – bessere Produktbilder: `1703e99d987690a2644afd5b6f17f5fdf413d7d0`
- Version 5.2 – Produktvergleich Preview: `36a1d140967c4bd621c99d23cef3e9b951afb0b5`
- Version 5.1 – Plus-Mehrwert: `99b9cb07d4eaefae54a02c4afa4d30aa2776dadb`
- Version 4.3 – E-Nummern-Datenbank erweitert: `af10171c4edf57fe4077574ab9b650a31c969eab`
- Version 4.0 – großes Redesign: `3bcd3e3a991f953c6aa25be1c0687a31c7e70179`

## Als Nächstes
1. Produktvergleich weiter testen und stabilisieren
2. Scanner mit vielen echten Produkten testen
3. API-/Offline-Fälle weiter absichern
4. Verlauf/Favoriten auf mehreren Geräten testen
5. Allergene und Unverträglichkeiten fertigstellen
6. Zutaten-OCR direkt automatisch auswerten
7. E-Nummern-Datenbank und Quellen weiter ausbauen
8. Plus-Funktionen erst danach weiter ausbauen
9. Zahlung erst ganz zum Schluss aktivieren
10. Vor öffentlichem Start Impressum, Datenschutz und weitere Rechtstexte fertigstellen

## Produktidee
E-Check Kids soll keine pauschale "gut/schlecht"-Ampel sein, sondern Eltern schnell zeigen:
- Was steckt im Produkt?
- Welche E-Nummern wurden erkannt?
- Gibt es offizielle EU-Kinderhinweise?
- Gibt es relevante Allergene?
- Was bedeuten die gefundenen Stoffe?
- Wie unterscheiden sich zwei Produkte?

## Grundsatz
Neue Funktionen erst dann weiter ausbauen, wenn Scanner, Produktdaten, Vergleich, Verlauf/Favoriten und Allergene stabil genug sind.
