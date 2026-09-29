# E-Check Kids – Projekt-Checkpoint

Stand: 29.09.2026

## Aktuelle Version
- Version: **6.5 Preview**
- Öffentliche Test-URL: https://shawnstahl-commits.github.io/?v=46
- Aktueller Frontend-Checkpoint: `09c0c19fede3b722b3e4f8ab75718fb72bd640e6`
- Aktueller Cache-Checkpoint: `a55974c621b687a5f30aacf379932d068dcba22f`

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
- Laktoseintoleranz im Profil auswählbar
- Laktose-Check bei Barcode-Scan, Zutaten-Text/OCR und Produktvergleich
- Zutatenfoto wird nach OCR automatisch ausgewertet: E-Nummern, ausgewählte Allergene, Laktose und ADS/ADHS-Hinweise
- Scan-Ergebnis zeigt vier Schnellkarten für E-Nummern, Kinderhinweise, Allergene und Laktose
- Ausführliche E-Nummern-/ADS-ADHS-Erklärungen sind einklappbar
- Gescanntes Produkt kann direkt als Produkt A in den Vergleich übernommen werden
- Erste Nutzung zeigt eine kurze 5-Schritte-Einführung
- Dauerhafter Hilfe-Button im Kopfbereich erklärt Scanner, Zutatenfoto, Profil, Ergebnis, Vergleich, Verlauf und Favoriten
- Scan-Ergebnis kann ähnliche reale Produkte derselben Open-Food-Facts-Kategorie suchen
- Alternativen werden nach transparenten Kriterien wie Kinderhinweisen, erkannten E-Nummern und hinterlegtem Zucker sortiert
- Vorschläge mit erkannten ausgewählten Allergenen werden nicht als Alternative angezeigt; fehlende Daten bleiben ausdrücklich keine Garantie
- Gefundene Alternative kann direkt als Produkt B in den bestehenden Produktvergleich übernommen werden
- OCR-Allergenprüfung unterscheidet erkannte Zutaten von einfachen Spurenhinweisen

## Stabilitätsverbesserungen
- Scanner-Start/Stop-Rennen reduziert
- Taschenlampen-Schalter bei unterstützten Handys
- Automatischer Wechsel auf zweiten Barcode-Erkennungsmodus bei ausbleibendem Treffer
- Schnellere Barcode-Erkennungsintervalle und bessere Scan-Hinweise
- Scanner wechselt nach kurzer Zeit automatisch früher zum zweiten Erkennungsweg
- Zweiter Scanner führt bei Bedarf selbst einen erweiterten zweiten Durchlauf mit größerem Scanbereich durch
- Unterstützte Kameras erhalten kontinuierlichen Fokus/Belichtung und einen sehr leichten Zoom
- Produktabfrage nutzt automatischen Retry und einen zweiten Open-Food-Facts-Endpunkt
- Gängige GTIN/EAN-Barcodes werden nach dem Kamera-Scan über die Prüfziffer plausibilisiert
- Bei Datenbankfehlern kann dasselbe Produkt erneut geladen werden, ohne den Barcode neu zu scannen
- Produktvergleich zeigt ausgewählte Allergene getrennt nach „enthält“ und „Spurenhinweis“
- Laktose-Hinweise werden im Vergleich farblich unterschieden
- Vergleich übernimmt Allergie-Daten auch aus normalem Scan und Alternativensuche
- Sicherheits-Hinweis im Vergleich: fehlende Produktdaten sind keine Garantie auf Allergen- oder Laktosefreiheit
- Schutz vor doppelten Barcode-Scans
- Open-Food-Facts-Abfragen mit Timeout und Wiederholungsversuch
- Bessere Fehlermeldungen bei Offline/Timeout
- Verlauf/Favoriten robuster gespeichert
- Produktvergleich mit Kamera und manueller Barcode-Eingabe
- Service-Worker-Versionierung gegen veralteten Cache
- JavaScript nach Änderungen auf Syntaxfehler geprüft

## Wichtige Rücksprungpunkte
- Version 6.5 – vollständiger Produktvergleich mit Allergenen und Spuren: `09c0c19fede3b722b3e4f8ab75718fb72bd640e6`
- Version 6.4 – robuste Produktabfrage nach Barcode-Scan: `cdc117157ef8a90ceeff71afb515144f313908cf`
- Version 6.3 – adaptiver Scanner mit automatischen Erkennungsdurchläufen: `7aa8e8e7ad5f7a78e8cbacedac82480a0b6f73f3`
- Version 6.2 – echte Alternativensuche nach Produktkategorie: `80a2eb173c71be291c5f044ee208fbac6455f09d`
- Version 6.1 – Hilfe & Einführung für neue Nutzer: `b0d2f271650b865eb2d648f2fa624a20aa2126bb`
- Version 6.0 – neues Scan-Ergebnis mit Schnellübersicht: `27dcbafd8f194d2456e1f4a83a5faf50dbf9b94f`
- Version 5.9 – automatische Zutatenfoto-Auswertung: `875e6153b291af573cce04affef31b4e3a0f522c`
- Version 5.8 – Scanner-Licht + automatischer Erkennungswechsel: `038b94500361c008dea841ecc93a27481b54a314`
- Version 5.7 – Laktoseintoleranz-Check: `40979eb247cb8399b9a6fe2747333159a9ff7501`
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
5. Allergene und weitere Unverträglichkeiten fertigstellen
6. Zutaten-OCR mit echten Verpackungen testen und weiter verbessern
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
