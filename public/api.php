<?php
// api.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, x-api-key, x-mandala-key");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");

// Set Timeout agar PHP process tidak menumpuk jika backend pusat lambat
define('CURL_TIMEOUT', 30);
define('CURL_CONNECT_TIMEOUT', 10);
define('KEY_FILE', __DIR__ . '/key.php');

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

// 1. Alur Setup Key (Menyimpan Key dari UI Frontend)
if (isset($_GET['action']) && $_GET['action'] === 'setup') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['apiKey'])) {
        $keyContent = "<?php\n// Terproteksi\ndefine('API_KEY', '" . addslashes($input['apiKey']) . "');\n";
        file_put_contents(KEY_FILE, $keyContent);
        echo json_encode(["status" => "success", "message" => "Key berhasil disimpan"]);
        exit;
    }
}

// 2. Cek apakah Key sudah di-setup
if (!file_exists(KEY_FILE)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Sistem belum terhubung. Silakan hubungkan API Key terlebih dahulu."]);
    exit;
}

require_once KEY_FILE;

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

// Ambil body request jika ada
$body = file_get_contents('php://input');
if (!empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Forward Headers & Sisipkan API Key otomatis
$headers = [];
foreach (getallheaders() as $name => $value) {
    if (strtolower($name) !== 'host' && strtolower($name) !== 'content-length') {
        $headers[] = "$name: $value";
    }
}
$headers[] = "x-api-key: " . API_KEY; // Sisipkan API Key rahasia

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_HEADER, true); // Dapatkan response header dari backend pusat

$response = curl_exec($ch);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

curl_close($ch);

// Kirim header kembali ke browser
http_response_code($httpCode);
foreach (explode("\r\n", $responseHeaders) as $header) {
    if (!empty($header) && strpos($header, 'HTTP/') === false && strpos(strtolower($header), 'transfer-encoding') === false) {
        header($header);
    }
}

echo $responseBody;
