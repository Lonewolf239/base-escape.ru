<?php

$requestPath = $_GET['path'] ?? '';
if (empty($requestPath)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing path parameter']);
    exit;
}

$parsedUrl = parse_url($requestPath);
if ($parsedUrl === false || empty($parsedUrl['host'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

$allowedHosts = ['api.github.com', 'raw.githubusercontent.com'];
if (!in_array($parsedUrl['host'], $allowedHosts)) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden host']);
    exit;
}

if ($parsedUrl['scheme'] !== 'https') {
    http_response_code(403);
    echo json_encode(['error' => 'Only HTTPS allowed']);
    exit;
}

if (isset($parsedUrl['port']) && $parsedUrl['port'] != 443) {
    http_response_code(403);
    echo json_encode(['error' => 'Non-standard port not allowed']);
    exit;
}

$path = ltrim($parsedUrl['path'] ?? '', '/');

if (strpos($path, '/../') !== false || strpos($path, '\\') !== false || preg_match('/(^|\/)\.\.(\/|$)/', $path)) {
    http_response_code(403);
    echo json_encode(['error' => 'Path traversal not allowed']);
    exit;
}

if ($parsedUrl['host'] === 'api.github.com') {
    if (!preg_match('#^repos/Lonewolf239/[^/]+(?:/.*)?$#', $path)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied: only repos of Lonewolf239 are allowed']);
        exit;
    }
} elseif ($parsedUrl['host'] === 'raw.githubusercontent.com') {
    if (!preg_match('#^Lonewolf239/[^/]+(?:/.*)?$#', $path)) {
        http_response_code(403);
        echo json_encode(['error' => 'Access denied: only raw content from Lonewolf239 repos is allowed']);
        exit;
    }
}

$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            if (preg_match('/^["\'].*["\']$/', $value)) {
                $value = substr($value, 1, -1);
            }
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

$token = getenv('GITHUB_TOKEN');
if (!$token) {
    http_response_code(500);
    echo json_encode(['error' => 'GitHub token not configured']);
    exit;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $requestPath);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_USERAGENT, 'MySiteProxy/1.0');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: token ' . $token,
    'Accept: application/vnd.github.v3+json'
]);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    error_log("cURL error: $curlError");
    http_response_code(500);
    echo json_encode(['error' => 'Internal proxy error']);
    exit;
}

if ($contentType) {
    header('Content-Type: ' . $contentType);
} else {
    header('Content-Type: application/json');
}

http_response_code($httpCode);
echo $response;
