<?php
// storage.php
// Proxy redirector untuk file storage agar mengarah ke backend pusat secara dinamis

function getBackendUrlFromEnv() {
    $envPath = __DIR__ . '/.env';
    $defaultUrl = 'https://centralsimak.smakniscjr.sch.id/api'; // Fallback default jika .env tidak ada
    
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                if (trim($name) === 'VITE_API_URL') {
                    return trim($value, " \t\n\r\0\x0B\"'");
                }
            }
        }
    }
    return $defaultUrl;
}

$backendUrl = getBackendUrlFromEnv();
// Hapus /api di akhir untuk mendapatkan URL dasar backend
$baseBackendUrl = preg_replace('/\/api\/?$/', '', $backendUrl);

$path = isset($_GET['path']) ? $_GET['path'] : '';

if (!empty($path)) {
    $targetUrl = $baseBackendUrl . '/storage/' . $path;
    header("Location: " . $targetUrl, true, 302);
    exit;
} else {
    http_response_code(404);
    echo "File not found";
    exit;
}
