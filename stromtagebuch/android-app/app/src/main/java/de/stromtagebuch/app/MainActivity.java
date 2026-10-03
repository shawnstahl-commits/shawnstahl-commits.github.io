package de.stromtagebuch.app;

import android.Manifest;
import android.app.Activity;
import android.app.DownloadManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.print.PrintManager;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.MimeTypeMap;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public class MainActivity extends Activity {

    private static final String APP_URL = "https://shawnstahl-commits.github.io/stromtagebuch/";
    private static final String APP_HOST = "shawnstahl-commits.github.io";
    private static final int FILE_CHOOSER_REQUEST = 1101;
    private static final int NOTIFICATION_PERMISSION_REQUEST = 1102;
    private static final String NOTIFICATION_CHANNEL = "stromtagebuch_reminders";

    private WebView webView;
    private ValueCallback<Uri[]> fileCallback;
    private Uri cameraUri;
    private final Map<String, OutputStream> textTransfers = new ConcurrentHashMap<>();
    private final Map<String, Uri> textTransferUris = new ConcurrentHashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));
        setContentView(root);

        createNotificationChannel();
        configureWebView();

        if (savedInstanceState == null) {
            webView.loadUrl(APP_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private void createNotificationChannel() {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
                NOTIFICATION_CHANNEL,
                "Stromtagebuch Erinnerungen",
                NotificationManager.IMPORTANCE_DEFAULT
        );
        channel.setDescription("Monatsablesung, Backup und Stromtagebuch-Hinweise");
        manager.createNotificationChannel(channel);
    }

    private boolean hasNotificationPermission() {
        return Build.VERSION.SDK_INT < 33 ||
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED;
    }

    private String notificationPermissionState() {
        if (hasNotificationPermission()) return "granted";
        boolean requested = getSharedPreferences("stromtagebuch_native", MODE_PRIVATE)
                .getBoolean("notifications_requested", false);
        if (!requested || shouldShowRequestPermissionRationale(Manifest.permission.POST_NOTIFICATIONS)) {
            return "prompt";
        }
        return "denied";
    }

    private void requestNativeNotificationPermission() {
        if (Build.VERSION.SDK_INT < 33) {
            Toast.makeText(this, "Benachrichtigungen sind aktiviert.", Toast.LENGTH_SHORT).show();
            return;
        }
        if (hasNotificationPermission()) {
            Toast.makeText(this, "Benachrichtigungen sind bereits aktiviert.", Toast.LENGTH_SHORT).show();
            return;
        }
        getSharedPreferences("stromtagebuch_native", MODE_PRIVATE)
                .edit()
                .putBoolean("notifications_requested", true)
                .apply();
        requestPermissions(
                new String[]{Manifest.permission.POST_NOTIFICATIONS},
                NOTIFICATION_PERMISSION_REQUEST
        );
    }

    private void showNativeNotification(String title, String body, String tag) {
        if (!hasNotificationPermission()) return;
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        if (manager == null) return;

        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentIntent = PendingIntent.getActivity(
                this,
                0,
                openIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new Notification.Builder(this, NOTIFICATION_CHANNEL)
                .setSmallIcon(R.drawable.ic_launcher_foreground)
                .setContentTitle(title == null || title.isEmpty() ? "Stromtagebuch" : title)
                .setContentText(body == null ? "" : body)
                .setStyle(new Notification.BigTextStyle().bigText(body == null ? "" : body))
                .setContentIntent(contentIntent)
                .setAutoCancel(true)
                .setCategory(Notification.CATEGORY_REMINDER)
                .build();

        manager.notify(tag == null ? "stromtagebuch" : tag, 1001, notification);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new AndroidBridge(), "AndroidApp");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNavigation(Uri.parse(url));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectNativeHelpers();
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView webView,
                    ValueCallback<Uri[]> newCallback,
                    FileChooserParams fileChooserParams
            ) {
                if (fileCallback != null) {
                    fileCallback.onReceiveValue(null);
                }
                fileCallback = newCallback;

                String[] accepts = normalizeAcceptTypes(fileChooserParams.getAcceptTypes());
                boolean wantsImage = acceptsImage(accepts);
                boolean capture = fileChooserParams.isCaptureEnabled() && wantsImage;

                Intent fileIntent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                fileIntent.addCategory(Intent.CATEGORY_OPENABLE);
                fileIntent.setType(resolveMimeType(accepts));
                if (accepts.length > 1) {
                    fileIntent.putExtra(Intent.EXTRA_MIME_TYPES, accepts);
                }

                Intent cameraIntent = null;
                if (wantsImage) {
                    cameraUri = createCameraUri();
                    if (cameraUri != null) {
                        cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                        cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
                        cameraIntent.addFlags(
                                Intent.FLAG_GRANT_READ_URI_PERMISSION |
                                Intent.FLAG_GRANT_WRITE_URI_PERMISSION
                        );
                    }
                }

                try {
                    if (capture && cameraIntent != null) {
                        startActivityForResult(cameraIntent, FILE_CHOOSER_REQUEST);
                    } else {
                        Intent chooser = Intent.createChooser(fileIntent, "Datei auswählen");
                        if (cameraIntent != null) {
                            chooser.putExtra(Intent.EXTRA_INITIAL_INTENTS, new Intent[]{cameraIntent});
                        }
                        startActivityForResult(chooser, FILE_CHOOSER_REQUEST);
                    }
                    return true;
                } catch (Exception ex) {
                    if (fileCallback != null) {
                        fileCallback.onReceiveValue(null);
                        fileCallback = null;
                    }
                    cleanupUnusedCameraUri();
                    Toast.makeText(MainActivity.this, "Dateiauswahl konnte nicht geöffnet werden.", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            String filename = URLUtil.guessFileName(url, contentDisposition, mimeType);
            if (filename == null || filename.trim().isEmpty() || filename.startsWith("blob")) {
                filename = guessStromtagebuchFilename(mimeType);
            }

            if (url != null && url.startsWith("blob:")) {
                downloadBlob(url, filename, mimeType);
            } else {
                downloadNormalUrl(url, userAgent, mimeType, filename);
            }
        });
    }

    private boolean handleNavigation(Uri uri) {
        if (uri == null) return false;

        String scheme = uri.getScheme();
        if ("blob".equalsIgnoreCase(scheme) || "data".equalsIgnoreCase(scheme)) {
            return false;
        }

        boolean allowed =
                "https".equalsIgnoreCase(scheme) &&
                APP_HOST.equalsIgnoreCase(uri.getHost()) &&
                uri.getPath() != null &&
                uri.getPath().startsWith("/stromtagebuch");

        if (allowed) {
            return false;
        }

        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (Exception ex) {
            Toast.makeText(this, "Link konnte nicht geöffnet werden.", Toast.LENGTH_SHORT).show();
        }
        return true;
    }

    private void injectNativeHelpers() {
        String js =
                "(function(){" +
                "try{" +
                "window.__STROM_ANDROID_APP__=true;" +
                "window.print=function(){AndroidApp.printPage(document.title||'Stromtagebuch');};" +
                "try{notificationState();}catch(_e){}" +
                "try{updateReminder();}catch(_e2){}" +
                "}catch(e){}" +
                "})();";
        webView.evaluateJavascript(js, null);
    }

    private String[] normalizeAcceptTypes(String[] accepts) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        if (accepts != null) {
            for (String raw : accepts) {
                if (raw == null) continue;
                String[] parts = raw.split(",");
                for (String part : parts) {
                    String type = normalizeAcceptType(part);
                    if (type != null && !type.isEmpty()) normalized.add(type);
                }
            }
        }
        if (normalized.isEmpty()) normalized.add("*/*");
        return new ArrayList<>(normalized).toArray(new String[0]);
    }

    private String normalizeAcceptType(String raw) {
        if (raw == null) return null;
        String type = raw.trim().toLowerCase(Locale.ROOT);
        if (type.isEmpty()) return null;
        if (type.equals(".json")) return "application/json";
        if (type.equals(".csv")) return "text/csv";
        if (type.equals(".pdf")) return "application/pdf";
        if (type.startsWith(".")) {
            String ext = type.substring(1);
            String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(ext);
            return mime == null ? "*/*" : mime;
        }
        if (type.contains("/")) return type;
        return "*/*";
    }

    private boolean acceptsImage(String[] accepts) {
        if (accepts == null || accepts.length == 0) return false;
        for (String type : accepts) {
            if (type != null && (type.startsWith("image/") || type.equals("*/*"))) {
                return true;
            }
        }
        return false;
    }

    private String resolveMimeType(String[] accepts) {
        if (accepts == null || accepts.length == 0) return "*/*";
        for (String type : accepts) {
            if (type != null && !type.trim().isEmpty()) {
                return type;
            }
        }
        return "*/*";
    }

    private Uri createCameraUri() {
        try {
            String stamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.GERMANY).format(new Date());
            ContentValues values = new ContentValues();
            values.put(MediaStore.Images.Media.DISPLAY_NAME, "Stromtagebuch_" + stamp + ".jpg");
            values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Stromtagebuch");
            return getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        } catch (Exception ex) {
            return null;
        }
    }

    private void cleanupUnusedCameraUri() {
        if (cameraUri != null) {
            try {
                getContentResolver().delete(cameraUri, null, null);
            } catch (Exception ignored) {
            }
            cameraUri = null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_REQUEST) {
            Uri[] result = null;

            if (resultCode == RESULT_OK) {
                if (data == null || data.getData() == null) {
                    if (cameraUri != null) {
                        result = new Uri[]{cameraUri};
                    }
                } else {
                    result = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
                    if (cameraUri != null) {
                        boolean usedCamera = result != null && result.length == 1 && cameraUri.equals(result[0]);
                        if (!usedCamera) {
                            cleanupUnusedCameraUri();
                        }
                    }
                }
            } else {
                cleanupUnusedCameraUri();
            }

            if (fileCallback != null) {
                fileCallback.onReceiveValue(result);
                fileCallback = null;
            }
            cameraUri = null;
            return;
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    private void downloadBlob(String blobUrl, String filename, String mimeType) {
        try {
            String js =
                    "(async function(){" +
                    "try{" +
                    "const r=await fetch(" + JSONObject.quote(blobUrl) + ");" +
                    "const b=await r.blob();" +
                    "const rd=new FileReader();" +
                    "rd.onloadend=function(){AndroidApp.saveBase64(rd.result," +
                    JSONObject.quote(filename) + "," +
                    JSONObject.quote(mimeType == null ? "" : mimeType) + ");};" +
                    "rd.readAsDataURL(b);" +
                    "}catch(e){AndroidApp.showToast('Download konnte nicht vorbereitet werden.');}" +
                    "})();";
            webView.evaluateJavascript(js, null);
        } catch (Exception ex) {
            Toast.makeText(this, "Download konnte nicht vorbereitet werden.", Toast.LENGTH_SHORT).show();
        }
    }

    private void downloadNormalUrl(String url, String userAgent, String mimeType, String filename) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle(filename);
            request.setDescription("Stromtagebuch Download");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, filename);
            request.setMimeType(mimeType);
            String cookie = CookieManager.getInstance().getCookie(url);
            if (cookie != null) request.addRequestHeader("Cookie", cookie);
            if (userAgent != null) request.addRequestHeader("User-Agent", userAgent);
            DownloadManager manager = (DownloadManager) getSystemService(DOWNLOAD_SERVICE);
            manager.enqueue(request);
            Toast.makeText(this, "Download gestartet.", Toast.LENGTH_SHORT).show();
        } catch (Exception ex) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
            } catch (Exception ignored) {
                Toast.makeText(this, "Download konnte nicht gestartet werden.", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private String guessStromtagebuchFilename(String mimeType) {
        String stamp = new SimpleDateFormat("yyyy-MM-dd", Locale.GERMANY).format(new Date());
        if (mimeType != null && mimeType.contains("json")) {
            return "Stromtagebuch_Vollbackup_" + stamp + ".json";
        }
        if (mimeType != null && mimeType.contains("csv")) {
            return "stromtagebuch_" + stamp + ".csv";
        }
        String ext = mimeType == null ? null : URLConnection.guessContentTypeFromName("file." + mimeType);
        return ext == null ? "Stromtagebuch_" + stamp + ".bin" : "Stromtagebuch_" + stamp;
    }

    private class AndroidBridge {
        @JavascriptInterface
        public String notificationPermission() {
            return notificationPermissionState();
        }

        @JavascriptInterface
        public void requestNotificationPermission() {
            runOnUiThread(() -> requestNativeNotificationPermission());
        }

        @JavascriptInterface
        public void showNotification(String title, String body, String tag) {
            runOnUiThread(() -> showNativeNotification(title, body, tag));
        }

        @JavascriptInterface
        public String beginTextFile(String fileName, String hintedMime) {
            try {
                String token = UUID.randomUUID().toString();
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, sanitizeFilename(fileName));
                values.put(MediaStore.MediaColumns.MIME_TYPE, normalizeMime(hintedMime));
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Stromtagebuch");

                Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) return "";

                OutputStream out = getContentResolver().openOutputStream(uri);
                if (out == null) {
                    getContentResolver().delete(uri, null, null);
                    return "";
                }

                textTransfers.put(token, out);
                textTransferUris.put(token, uri);
                return token;
            } catch (Exception ex) {
                return "";
            }
        }

        @JavascriptInterface
        public boolean appendTextFile(String token, String chunk) {
            OutputStream out = textTransfers.get(token);
            if (out == null) return false;
            try {
                out.write((chunk == null ? "" : chunk).getBytes(StandardCharsets.UTF_8));
                return true;
            } catch (Exception ex) {
                return false;
            }
        }

        @JavascriptInterface
        public void finishTextFile(String token) {
            OutputStream out = textTransfers.remove(token);
            textTransferUris.remove(token);
            if (out == null) return;
            try {
                out.flush();
                out.close();
                runOnUiThread(() ->
                        Toast.makeText(MainActivity.this, "Gespeichert unter Downloads/Stromtagebuch.", Toast.LENGTH_LONG).show()
                );
            } catch (Exception ex) {
                runOnUiThread(() ->
                        Toast.makeText(MainActivity.this, "Datei konnte nicht abgeschlossen werden.", Toast.LENGTH_SHORT).show()
                );
            }
        }

        @JavascriptInterface
        public void abortTextFile(String token) {
            OutputStream out = textTransfers.remove(token);
            Uri uri = textTransferUris.remove(token);
            if (out != null) {
                try {
                    out.close();
                } catch (Exception ignored) {
                }
            }
            if (uri != null) {
                try {
                    getContentResolver().delete(uri, null, null);
                } catch (Exception ignored) {
                }
            }
        }

        @JavascriptInterface
        public void saveTextFile(String fileName, String content, String hintedMime) {
            new Thread(() -> {
                try {
                    String mime = normalizeMime(hintedMime);
                    byte[] bytes = (content == null ? "" : content).getBytes(StandardCharsets.UTF_8);
                    saveBytesToDownloads(fileName, mime, bytes);
                    runOnUiThread(() ->
                            Toast.makeText(MainActivity.this, "Gespeichert unter Downloads/Stromtagebuch.", Toast.LENGTH_LONG).show()
                    );
                } catch (Exception ex) {
                    runOnUiThread(() ->
                            Toast.makeText(MainActivity.this, "Datei konnte nicht gespeichert werden.", Toast.LENGTH_SHORT).show()
                    );
                }
            }).start();
        }

        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() ->
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show()
            );
        }

        @JavascriptInterface
        public void saveBase64(String dataUrl, String fileName, String hintedMime) {
            new Thread(() -> {
                try {
                    int comma = dataUrl.indexOf(',');
                    if (comma < 0) throw new IllegalArgumentException("Ungültige Daten");

                    String header = dataUrl.substring(0, comma);
                    String base64 = dataUrl.substring(comma + 1);
                    String mime = hintedMime;

                    if (mime == null || mime.isEmpty()) {
                        int start = header.indexOf(':');
                        int end = header.indexOf(';');
                        if (start >= 0 && end > start) {
                            mime = header.substring(start + 1, end);
                        }
                    }
                    if (mime == null || mime.isEmpty()) mime = "application/octet-stream";

                    byte[] bytes = Base64.decode(base64, Base64.DEFAULT);

                    saveBytesToDownloads(fileName, mime, bytes);

                    runOnUiThread(() ->
                            Toast.makeText(MainActivity.this, "Gespeichert unter Downloads/Stromtagebuch.", Toast.LENGTH_LONG).show()
                    );
                } catch (Exception ex) {
                    runOnUiThread(() ->
                            Toast.makeText(MainActivity.this, "Datei konnte nicht gespeichert werden.", Toast.LENGTH_SHORT).show()
                    );
                }
            }).start();
        }

        @JavascriptInterface
        public void printPage(String title) {
            runOnUiThread(() -> {
                try {
                    PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                    String safeTitle = title == null || title.trim().isEmpty() ? "Stromtagebuch" : title;
                    printManager.print(
                            safeTitle,
                            webView.createPrintDocumentAdapter(safeTitle),
                            null
                    );
                } catch (Exception ex) {
                    Toast.makeText(MainActivity.this, "PDF/Druck konnte nicht geöffnet werden.", Toast.LENGTH_SHORT).show();
                }
            });
        }
    }

    private String normalizeMime(String mime) {
        if (mime == null || mime.trim().isEmpty()) return "application/octet-stream";
        int semicolon = mime.indexOf(';');
        return semicolon >= 0 ? mime.substring(0, semicolon).trim() : mime.trim();
    }

    private void saveBytesToDownloads(String fileName, String mime, byte[] bytes) throws Exception {
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, sanitizeFilename(fileName));
        values.put(MediaStore.MediaColumns.MIME_TYPE, normalizeMime(mime));
        values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Stromtagebuch");

        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new IllegalStateException("Download konnte nicht angelegt werden");

        try (OutputStream out = getContentResolver().openOutputStream(uri)) {
            if (out == null) throw new IllegalStateException("Download konnte nicht geöffnet werden");
            out.write(bytes);
            out.flush();
        } catch (Exception ex) {
            try {
                getContentResolver().delete(uri, null, null);
            } catch (Exception ignored) {
            }
            throw ex;
        }
    }

    private String sanitizeFilename(String name) {
        if (name == null || name.trim().isEmpty()) {
            return "Stromtagebuch_" + System.currentTimeMillis() + ".bin";
        }
        return name.replaceAll("[\\/:*?\"<>|]", "_");
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == NOTIFICATION_PERMISSION_REQUEST) {
            boolean granted = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            Toast.makeText(
                    this,
                    granted ? "Benachrichtigungen aktiviert." : "Benachrichtigungen nicht aktiviert.",
                    Toast.LENGTH_SHORT
            ).show();
            if (webView != null) {
                webView.evaluateJavascript("try{notificationState();updateReminder();}catch(e){}", null);
            }
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        for (String token : textTransfers.keySet()) {
            OutputStream out = textTransfers.remove(token);
            if (out != null) {
                try {
                    out.close();
                } catch (Exception ignored) {
                }
            }
        }
        textTransferUris.clear();
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidApp");
            webView.destroy();
        }
        super.onDestroy();
    }
}
