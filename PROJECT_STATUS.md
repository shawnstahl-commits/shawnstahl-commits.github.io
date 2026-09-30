## Version 7.4 – Production Readiness (Staging)

Branch: `staging-v7.4-production-readiness`

- Produktions- und Entwicklungsoberfläche getrennt: Testplan, Tester-Diagnose, Feedback-Testbutton und Beta-Vergleich sind im normalen Modus verborgen.
- Entwicklerwerkzeuge bleiben mit `?dev=1` verfügbar; `?dev=0` deaktiviert den lokalen Entwicklermodus wieder.
- Lokaler PLUS-TEST kann außerhalb des Entwicklermodus keine Premiumfunktionen mehr freischalten.
- Supabase-Audit: alle App-Tabellen haben RLS aktiviert; nutzerbezogene Policies sind an `auth.uid()` gebunden.
- Data-API-Grants auf Minimalrechte reduziert; anon hat keinen Zugriff mehr auf Verlauf, Favoriten oder Profile.
- Feedback bleibt absichtlich INSERT-only für anon/authenticated.
- Moderne Supabase-Publishable-Key-Nutzung im Frontend bestätigt; kein service_role/secret key im Browsercode gefunden.
- `delete-account` verlangt ein gültiges JWT.
- Index `feedback_reports_user_id_idx` ergänzt.
- Default-Privileges für neue public-Tabellen/Funktionen restriktiver gesetzt.

### Offene Produktionsblocker

- Supabase Leaked Password Protection ist noch deaktiviert und muss vor Release aktiviert werden.
- Impressum und Datenschutzerklärung benötigen finale Betreiber-/Kontaktangaben und rechtliche Prüfung.
- Externe Browser-Abhängigkeiten und PWA/Icons werden im nächsten Production-Readiness-Schritt geprüft.
- Vor Merge nach `main`: vollständiger Smoke-Test (Scanner, OCR, Auth, Verlauf, Favoriten, Familienprofile, Vergleich, Offline/Fehlerfälle).


# E-Check Kids – Projekt-Checkpoint

Stand: 29.09.2026

## Aktuelle Version
- Version: **7.3.1 Preview**
- Öffentliche Test-URL: https://shawnstahl-commits.github.io/?v=55
- Aktueller Frontend-Checkpoint: `aa6dea188602348d84c5f77e47a61d57b3e52068`
- Aktueller Cache-Checkpoint: `7fe209d7b9785ba24e278211d79c6d2968647967`

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
- Wenn ein gescannter Barcode nicht gefunden wird, startet automatisch eine zweite Erkennung in derselben Scan-Sitzung
- Erst nach der zweiten erfolglosen Erkennung erscheint „nicht gefunden“
- Der endgültig erkannte Barcode wird auf der Fehlerseite sichtbar angezeigt, um Fehlablesungen diagnostizieren zu können
- Lokaler Tarif-Testschalter FREE ↔ PLUS TEST ohne Zahlungsanbieter oder Abbuchung
- FREE enthält Scanner, Zutatenfoto/OCR, E-Nummern, EU-Kinderhinweise, Allergie-/Laktose-Grundcheck und Basis-Verlauf/Favoriten
- PLUS TEST schaltet echte Alternativensuche und Produktvergleich frei
- Geplante Plus-Funktionen bleiben als Vorschau sichtbar, ohne vorzutäuschen dass sie schon fertig sind
- Vertiefte E-Nummern-Hintergründe mit offiziellen EU-/EFSA-Quellen im Plus-Test
- Familienprofile in Supabase mit eigenen Allergie-/Laktose-Einstellungen und RLS
- Familienprofil kann für Scans aktiviert werden, ohne die persönlichen Einstellungen zu überschreiben
- Erweiterter Verlauf mit Produktsuche im Plus-Test
- A/B-Produktvergleiche können im Konto gespeichert, geöffnet und gelöscht werden
- Neue Tabellen `family_members` und `saved_comparisons` sind per RLS auf den jeweiligen Nutzer begrenzt
- Schutz vor doppelten Barcode-Scans
- Open-Food-Facts-Abfragen mit Timeout und Wiederholungsversuch
- Bessere Fehlermeldungen bei Offline/Timeout
- Verlauf/Favoriten robuster gespeichert
- Produktvergleich mit Kamera und manueller Barcode-Eingabe
- Service-Worker-Versionierung gegen veralteten Cache
- JavaScript nach Änderungen auf Syntaxfehler geprüft

## Wichtige Rücksprungpunkte
- Version 7.3.1 – E-Nummern-Erklärung sichtbarer: `aa6dea188602348d84c5f77e47a61d57b3e52068`
- Version 7.3 – Quellen, Alternativen & Scan-Hierarchie: `f49f0c96a0373de31d1600f63106b5ed32b56b47`
- Version 7.2 – Scan-Sicherheit & Datenqualität: `6c5ea592cee68a694f86174574a7edd9aad444f3`
- Version 7.1 – Stabilität & Feinschliff: `1ab68d00ebf59212f44fdba2ff8f6214ce4ce664`
- Version 7.0 – Tester-/Feedbackmodus, Diagnose und Rechtstransparenz: `48028dd3b1a986b6a6f5ac4de16b592c9d4e441d`
- Version 6.9 – Plus-Ausbau abgeschlossen: Quellen, Familienprofile, erweiterter Verlauf & gespeicherte Vergleiche: `98fb31ad2feb8348fdc3f483cca25710955dcc37`
- Version 6.8 – Plus-Ausbau: Quellen, Familienprofile, erweiterter Verlauf: `4cfbdfb5117c338f441a93f1025e8b948e671dca`
- Version 6.7 – FREE/PLUS-Testmodus ohne Zahlung: `c4dfa6a48a36d8c957654603c12e160b24e65fc9`
- Version 6.6 – automatische Barcode-Bestätigung bei „nicht gefunden“: `ad994b883a953e4d57236cba246eb623e9e8fb1f`
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

- Vertiefte Plus-Einordnung mit offiziellen EU-/EFSA-Quellen
- Familienprofile in Supabase mit eigenem Allergie-/Laktose-Filter, aktivierbar für Scans und bearbeitbar
- Erweiterter Plus-Verlauf mit Suche
- A/B-Produktvergleiche können im Konto gespeichert, wieder geöffnet und gelöscht werden
- Beim Wechsel zurück auf FREE wird ein aktives Familienprofil deaktiviert und das persönliche Profil verwendet

- Tester können Fehler und Ideen direkt in der App melden
- Optionaler Diagnoseanhang enthält nur technische App-/Geräteinfos, keine Fotos oder OCR-Zutaten-Texte
- Lokaler Tester-Modus zeigt Version, aktuellen Bereich, Netzstatus, Tarif und letzte technische Ereignisse
- Rechtliches/Datenquellen als transparente Testfassung: Datenschutz, Impressum-Platzhalter, Open-Food-Facts-Lizenzen, Monetarisierung noch deaktiviert
- Open-Food-Facts-Attribution im Footer um ODbL/CC-BY-SA ergänzt
- Kein externes Analytics-, Werbe- oder Affiliate-Tracking aktiviert; Diagnose-Ereignisse bleiben lokal bis freiwilliges Feedback gesendet wird

- 7.1: Doppelabfragen bei Produkt-Lookups werden blockiert
- 7.1: Offline-Banner und verständliche Offline-Zustände für Produkt- und Vergleichsabfragen
- 7.1: Manuelle Barcodes werden auf 8–14 Ziffern geprüft
- 7.1: Allergen-/Spuren-Tags werden beim Start eines Vergleichs korrekt in Produkt A übernommen
- 7.1: OCR prüft Bildtyp/Dateigröße und meldet Fehler verständlicher
- 7.1: Familienprofile zeigen bei Ladefehlern einen Wiederholen-Button statt fälschlich „keine Profile“
- 7.1: Gast-/Logout-Zustand leert lokale Verlauf-, Vergleichs- und Familienzustände sauber
- 7.1: Mobile Umbrüche, Touch-Verhalten und Safe-Area-Abstände verbessert

- 7.2: Kamera-Barcodes werden erst nach zweiter identischer Erkennung innerhalb eines kurzen Zeitfensters übernommen
- 7.2: Native Android-Barcodedetektion läuft nach dem ersten Kandidaten weiter, bis die Bestätigung erfolgt
- 7.2: Scan-Ergebnis zeigt Datenqualität für Zutatenliste, Allergen-/Spurentags, Nährwerte und Produktbild
- 7.2: Datenqualität bewertet nur Datenverfügbarkeit, nicht die gesundheitliche Qualität eines Produkts

- 7.3: Wichtige E-Nummern bekommen direkte offizielle Quellenlinks zu EU/EFSA
- 7.3: Scan-Ergebnis hat einen neuen Bereich „Was bei diesem Scan wichtig ist“ für Kinderhinweis, ausgewählte Allergene, Laktose und Datenlücken
- 7.3: Alternativensuche lädt mehr Kandidaten, dedupliziert Barcodes und wertet unvollständige Zutaten-/Allergendaten ab
- 7.3: E-Nummern werden bei Alternativen nur dann als Vorteil verglichen, wenn Zutatenangaben vorhanden sind
- 7.3: Allergie-Filter prüft zusätzlich den verfügbaren Zutaten-Text, nicht nur Open-Food-Facts-Allergen-Tags
- 7.3: Bis zu vier nachvollziehbar sortierte Alternativen statt drei

- 7.3.1: Der aufklappbare E-Nummern-Bereich ist als eigener hervorgehobener Block gestaltet
- 7.3.1: Überschrift „E-NUMMERN ERKLÄRT“ und klare Aufforderung zum Tippen
- 7.3.1: Erkannte E-Nummern werden schon im geschlossenen Zustand als kleine Chips angezeigt
- 7.3.1: Der Pfeil ist größer und der geöffnete Zustand visuell deutlicher

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

## Vollbackup vor Version 7.1
- Sicherungs-Branch: `backup-v7.0-before-7.1-2026-09-29`
- Gesicherter Git-Stand: `8a92a9e1259bf11ac1094edd7278d04793f6b540`
- Stand beim Erstellen: Version 7.0 Preview, identisch zu `main` (0 Commits Unterschied)
- Zweck: vollständiger Rücksprungpunkt vor dem Stabilitäts-/Feinschliff-Block 7.1
- Supabase bleibt das aktive Backend; Datenbanktabellen/RLS wurden zuletzt für Familienprofile, gespeicherte Vergleiche und Tester-Feedback geprüft.
