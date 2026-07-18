<?php
/**
 * VendorFlow — Entry Point (Moved to api/index.php for Vercel Serverless compatibility)
 * This serves the Single Page Application (SPA) shell.
 */

// If running locally using PHP's built-in web server, route API requests manually
if (php_sapi_name() === 'cli-server') {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (str_starts_with($uri, '/api/')) {
        $file = dirname(__DIR__) . $uri;
        if (is_file($file)) {
            require $file;
        } elseif (is_file($file . '/index.php')) {
            require $file . '/index.php';
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'API Endpoint Not Found']);
        }
        exit;
    }
    if ($uri !== '/' && file_exists(dirname(__DIR__) . $uri)) {
        return false; // serve static file
    }
}
?>
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>VendorFlow | Street Vendor Management</title>
    <meta name="description" content="Digital operations and tracking for street vendors.">
    
    <!-- PWA Manifest & App Config -->
    <link rel="manifest" href="/public/manifest.json">
    <meta name="theme-color" content="#7c3aed">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <link rel="apple-touch-icon" href="https://xhrwxayvkqbgmxafwesv.supabase.co/storage/v1/object/public/assets/icon-192.png">

    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Design System -->
    <link rel="stylesheet" href="/public/css/style.css">
    
    <!-- Chart.js for Analytics -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js" defer></script>
    
    <!-- App Logic -->
    <script src="/public/js/currency.js" defer></script>
    <script src="/public/js/charts.js" defer></script>
    <script src="/public/js/app.js" defer></script>

    <!-- Theme & SW Initialization Script to prevent FOUC -->
    <script>
        (function() {
            try {
                var theme = localStorage.getItem('vf_theme');
                if (theme) {
                    document.documentElement.setAttribute('data-theme', theme);
                }
            } catch (e) {}

            // Register Service Worker for PWA
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/public/sw.js').catch(function(err) {});
                });
            }
        })();
    </script>
</head>
<body>
    <!-- Toast Notifications Container -->
    <div id="toast-container" class="toast-container"></div>

    <!-- Modal Overlay & Container -->
    <div id="modal-overlay" class="modal-overlay">
        <div id="modal-inner" style="width: 100%; display: flex; justify-content: center;"></div>
    </div>

    <!-- Main SPA Container -->
    <div id="app">
        <!-- The shell and views are rendered here by app.js -->
        <div class="page-loader">
            <div class="loader"></div>
            <span>Starting VendorFlow...</span>
        </div>
    </div>
</body>
</html>
