# E-Check Kids Android Preview

Interner Android-Testbuild auf Basis der Produktions-Staging-Weboberfläche.

- Paket-ID: `de.echeckkids.preview`
- Runtime: Capacitor 8.5.2
- Web-Inhalt: wird beim Build aus `/staging` nach `android-preview/www` kopiert.
- Kamera: Android CAMERA permission wird für `navigator.mediaDevices.getUserMedia()` gesetzt.
- Dies ist noch **kein** Play-Store-Release und verwendet eine Debug-Signatur.

Der GitHub-Workflow `.github/workflows/android-preview.yml` erzeugt eine installierbare Debug-APK als Workflow-Artefakt.
