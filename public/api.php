<?php
// api.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key, x-mandala-key");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Set Timeout agar PHP process tidak menumpuk jika backend pusat lambat
define('CURL_TIMEOUT', 30);
define('CURL_CONNECT_TIMEOUT', 10);
define('KEYS_FILE', __DIR__ . '/keys.php');
define('SECURE_ACCESS', true);

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Fallback jika getallheaders() tidak didefinisikan (misal di server Nginx/PHP-FPM)
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            } elseif ($name == 'CONTENT_TYPE') {
                $headers['Content-Type'] = $value;
            } elseif ($name == 'CONTENT_LENGTH') {
                $headers['Content-Length'] = $value;
            }
        }
        return $headers;
    }
}

// Fungsi pembaca file .env untuk mengambil VITE_API_URL
function getBackendUrlFromEnv() {
    $envPath = __DIR__ . '/.env';
    $defaultUrl = 'https://centralsimak.smakniscjr.sch.id/api'; // Fallback default jika .env tidak ada
    
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            // Abaikan komentar
            if (strpos(trim($line), '#') === 0) continue;
            
            // Cari baris VITE_API_URL
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                if (trim($name) === 'VITE_API_URL') {
                    // Bersihkan tanda kutip jika ada
                    return trim($value, " \t\n\r\0\x0B\"'");
                }
            }
        }
    }
    return $defaultUrl;
}

// Set URL Backend Pusat secara dinamis dari .env
define('BACKEND_URL', getBackendUrlFromEnv());

// Ambil domain/subdomain yang sedang diakses
$currentHost = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : 'default';

// Load keys mapping
$keys = [];
if (file_exists(KEYS_FILE)) {
    $keys = include KEYS_FILE;
    if (!is_array($keys)) {
        $keys = [];
    }
}

// 1. Alur Setup Key (Menyimpan Key via POST JSON atau GET URL)
if (isset($_GET['action']) && $_GET['action'] === 'setup') {
    $apiKey = '';
    
    // Coba baca dari POST JSON
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['apiKey'])) {
        $apiKey = $input['apiKey'];
    } 
    // Coba baca dari GET parameter '?key=...'
    elseif (isset($_GET['key'])) {
        $apiKey = $_GET['key'];
    }

    if (!empty($apiKey)) {
        // Probe check: Verifikasi apakah API Key valid ke Backend Pusat sebelum disimpan
        $probeCh = curl_init(BACKEND_URL);
        curl_setopt($probeCh, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($probeCh, CURLOPT_TIMEOUT, 10);
        curl_setopt($probeCh, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($probeCh, CURLOPT_HTTPHEADER, [
            "x-api-key: " . $apiKey
        ]);
        curl_exec($probeCh);
        $probeHttpCode = curl_getinfo($probeCh, CURLINFO_HTTP_CODE);
        curl_close($probeCh);

        // Jika backend pusat menolak dengan status 401 atau 403, key tidak valid
        if ($probeHttpCode === 401 || $probeHttpCode === 403) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "API Key tidak valid atau ditolak oleh Backend Pusat."]);
            exit;
        }

        // MENCEGAH 1 SEKOLAH MEMILIKI 2 DOMAIN:
        // Cari dan putuskan kaitan key ini jika sebelumnya pernah didaftarkan di host lain
        foreach ($keys as $host => $key) {
            if ($key === $apiKey && $host !== $currentHost) {
                unset($keys[$host]); // Hapus kaitan dengan domain lama
            }
        }

        // Tambah/Update key untuk host saat ini
        $keys[$currentHost] = $apiKey;
        $keysContent = "<?php\n// Terproteksi\ndefined('SECURE_ACCESS') or die('No direct script access allowed');\nreturn " . var_export($keys, true) . ";\n";
        file_put_contents(KEYS_FILE, $keysContent);
        
        echo json_encode(["status" => "success", "message" => "API Key untuk domain " . htmlspecialchars($currentHost) . " berhasil dihubungkan! Silakan refresh halaman login sekolah Anda."]);
        exit;
    }
}

// 2. Cek apakah Key sudah di-setup untuk domain ini
if (!isset($keys[$currentHost])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sistem untuk domain " . htmlspecialchars($currentHost) . " belum terhubung. Silakan hubungkan API Key terlebih dahulu."]);
    exit;
}

$activeApiKey = $keys[$currentHost];

// 3. Meneruskan Request (Proxy) ke Backend Pusat
$requestUri = $_SERVER['REQUEST_URI'];
// Cari path setelah api.php
$path = strpos($requestUri, 'api.php') !== false ? substr($requestUri, strpos($requestUri, 'api.php') + 7) : '';
$targetUrl = BACKEND_URL . $path;

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_TIMEOUT, CURL_TIMEOUT);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, CURL_CONNECT_TIMEOUT);

// Forward Headers & Sisipkan API Key otomatis
$headers = [];
$isMultipart = false;
foreach (getallheaders() as $name => $value) {
    $lowerName = strtolower($name);
    if ($lowerName === 'host' || $lowerName === 'content-length') {
        continue;
    }
    
    // Deteksi jika request adalah multipart (untuk upload file)
    if ($lowerName === 'content-type' && strpos($value, 'multipart/form-data') !== false) {
        $isMultipart = true;
        // JANGAN teruskan header Content-Type multipart karena cURL akan membuat boundary baru yang valid
        continue;
    }
    
    $headers[] = "$name: $value";
}
$headers[] = "x-api-key: " . $activeApiKey; // Sisipkan API Key dinamis sesuai domain

// 4. Penanganan Body Request
if ($isMultipart) {
    // Untuk multipart, kita harus membangun array dari $_POST dan $_FILES
    $postData = $_POST;
    foreach ($_FILES as $key => $file) {
        if (is_array($file['tmp_name'])) {
            // Jika input file adalah array (misal name="files[]")
            foreach ($file['tmp_name'] as $index => $tmpName) {
                if (!empty($tmpName)) {
                    $postData[$key . '[' . $index . ']'] = new CURLFile(
                        $tmpName, 
                        $file['type'][$index], 
                        $file['name'][$index]
                    );
                }
            }
        } else {
            if (!empty($file['tmp_name'])) {
                $postData[$key] = new CURLFile(
                    $file['tmp_name'], 
                    $file['type'], 
                    $file['name']
                );
            }
        }
    }
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
} else {
    // Untuk request non-multipart (JSON, dsb), gunakan php://input
    $body = file_get_contents('php://input');
    if (!empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_HEADER, true); // Dapatkan response header dari backend pusat

$response = curl_exec($ch);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

curl_close($ch);

// Auto-cleanup jika API Key ditolak/diganti oleh backend pusat
if ($httpCode === 401 || $httpCode === 403) {
    if (isset($keys[$currentHost])) {
        unset($keys[$currentHost]);
        $keysContent = "<?php\n// Terproteksi\ndefined('SECURE_ACCESS') or die('No direct script access allowed');\nreturn " . var_export($keys, true) . ";\n";
        file_put_contents(KEYS_FILE, $keysContent);
    }
    // Ganti response body agar user tahu sistem harus menghubungkan ulang key
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "API Key tidak valid atau telah diganti di backend pusat. Silakan hubungkan ulang API Key."]);
    exit;
}

// Kirim header kembali ke browser
http_response_code($httpCode);
foreach (explode("\r\n", $responseHeaders) as $header) {
    if (!empty($header) && strpos($header, 'HTTP/') === false && strpos(strtolower($header), 'transfer-encoding') === false) {
        header($header);
    }
}

echo $responseBody;
