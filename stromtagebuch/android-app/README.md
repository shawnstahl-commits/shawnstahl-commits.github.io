# Stromtagebuch Android

Native Android-Hülle für das Stromtagebuch.

## Prinzip

Die Android-App lädt ausschließlich:

`https://shawnstahl-commits.github.io/stromtagebuch/`

Dadurch bleiben normale Stromtagebuch-Updates Web-Updates und benötigen keine neue APK.

## Native Funktionen

- eigener App-Start ohne Browserleiste
- Kamera-/Dateiauswahl für Zählerfotos und Backups
- Speicherung von JSON/CSV-Downloads unter `Downloads/Stromtagebuch`
- Android-Druckdialog für Monats- und Jahresberichte/PDF
- WebView LocalStorage + IndexedDB + Service Worker/Offline-Cache
- externe Links werden im normalen Browser geöffnet

## Erster Wechsel von der bisherigen Web-App

1. In der bisherigen Web-App ein **Vollbackup inkl. Fotos** erstellen.
2. Android-App installieren und öffnen.
3. Unter Einstellungen → Backup laden das Vollbackup einlesen.
4. Danach nur noch die Android-App verwenden.

Normale Änderungen an `/stromtagebuch/` erscheinen weiterhin über die in der Web-App vorhandene Update-Funktion.

## Build

Der GitHub-Workflow `.github/workflows/stromtagebuch-android.yml` erzeugt eine installierbare Debug-APK als Workflow-Artefakt.
