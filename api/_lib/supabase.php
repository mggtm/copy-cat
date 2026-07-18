<?php
/**
 * VendorFlow — Supabase REST API Helper
 * Handles all HTTP communication with Supabase.
 * Never exposes secrets; reads from environment variables only.
 */

declare(strict_types=1);

/**
 * Load .env file if it exists (for local development).
 * On Vercel, environment variables are set in the dashboard.
 */
function load_env(): void {
    $env_file = dirname(__DIR__, 2) . '/.env';
    if (!file_exists($env_file)) return;

    foreach (file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (str_contains($line, '=')) {
            [$key, $value] = explode('=', $line, 2);
            $key   = trim($key);
            $value = trim($value, " \t\n\r\0\x0B\"'");
            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $value;
                putenv("$key=$value");
            }
        }
    }
}

/**
 * Get required env var or die with a clear error.
 */
function env(string $key, string $default = ''): string {
    return $_ENV[$key] ?? getenv($key) ?: $default;
}

/**
 * Return the Supabase project base URL.
 */
function supabase_url(): string {
    $url = env('SUPABASE_URL');
    if (!$url) {
        http_response_code(500);
        die(json_encode(['error' => 'SUPABASE_URL not configured']));
    }
    return rtrim($url, '/');
}

/**
 * Return the Supabase anon key (safe for server-side use with RLS).
 */
function supabase_anon_key(): string {
    $key = env('SUPABASE_ANON_KEY');
    if (!$key) {
        http_response_code(500);
        die(json_encode(['error' => 'SUPABASE_ANON_KEY not configured']));
    }
    return $key;
}

/**
 * Make an authenticated request to Supabase REST API.
 *
 * @param string $method   HTTP method: GET | POST | PUT | PATCH | DELETE
 * @param string $path     Path under /rest/v1 (e.g. "/products")
 * @param array  $data     Request body (POST/PATCH/PUT only)
 * @param array  $query    Query string params (e.g. ['select'=>'*','order'=>'created_at.desc'])
 * @param string $token    User JWT (access_token from Supabase Auth)
 * @param array  $extra_headers Additional headers
 * @return array ['status' => int, 'body' => mixed]
 */
function supabase_rest(
    string $method,
    string $path,
    array  $data          = [],
    array  $query         = [],
    string $token         = '',
    array  $extra_headers = []
): array {
    $url = supabase_url() . '/rest/v1' . $path;

    if (!empty($query)) {
        $url .= '?' . http_build_query($query);
    }

    $headers = [
        'Content-Type: application/json',
        'Accept: application/json',
        'apikey: ' . supabase_anon_key(),
        'Prefer: return=representation',
    ];

    if ($token !== '') {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    foreach ($extra_headers as $h) {
        $headers[] = $h;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => strtoupper($method),
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => !(php_sapi_name() === 'cli-server' || php_sapi_name() === 'cli'),
    ]);

    if (!empty($data) && in_array(strtoupper($method), ['POST', 'PUT', 'PATCH'], true)) {
        $body = json_encode($data);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    $response  = curl_exec($ch);
    $http_code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_err  = curl_error($ch);
    curl_close($ch);

    if ($curl_err) {
        return ['status' => 503, 'body' => ['error' => 'Network error: ' . $curl_err]];
    }

    $decoded = json_decode($response, true);
    return ['status' => $http_code, 'body' => $decoded ?? $response];
}

/**
 * Make a request to Supabase Auth API.
 *
 * @param string $endpoint  e.g. "/token?grant_type=password"
 * @param array  $data      Request body
 * @return array ['status' => int, 'body' => mixed]
 */
function supabase_auth(string $endpoint, array $data = []): array {
    $url     = supabase_url() . '/auth/v1' . $endpoint;
    $headers = [
        'Content-Type: application/json',
        'apikey: ' . supabase_anon_key(),
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($data),
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_SSL_VERIFYPEER => !(php_sapi_name() === 'cli-server' || php_sapi_name() === 'cli'),
    ]);

    $response  = curl_exec($ch);
    $http_code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_err  = curl_error($ch);
    curl_close($ch);

    if ($curl_err) {
        return ['status' => 503, 'body' => ['error' => 'Network error: ' . $curl_err]];
    }

    $decoded = json_decode($response, true);
    return ['status' => $http_code, 'body' => $decoded ?? []];
}

/**
 * Decode JWT token payload without external libraries.
 */
function decode_jwt_payload(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    $payload = str_replace(['-', '_'], ['+', '/'], $parts[1]);
    $decoded = base64_decode($payload);
    if (!$decoded) return null;
    return json_decode($decoded, true);
}

/**
 * Fetch a vendor profile by token, auto-creating it on the fly if it is missing.
 */
function require_vendor_profile(string $token): array {
    $res = supabase_rest('GET', '/vendors', [], ['select' => '*', 'limit' => '1'], $token);
    if ($res['status'] === 200 && !empty($res['body'])) {
        return $res['body'][0];
    }
    
    // Vendor not found -> Decode JWT to get user_id & email for auto-creation
    $payload = decode_jwt_payload($token);
    if (!$payload || !isset($payload['sub'])) {
        http_response_code(401);
        die(json_encode(['error' => 'Invalid authentication token payload']));
    }
    
    $user_id = $payload['sub'];
    // Fallback to phone number or default if email is not present (e.g. phone signups)
    $email = $payload['email'] ?? $payload['phone'] ?? 'vendor';
    $email_username = explode('@', $email)[0];
    $name = ucwords(str_replace(['.', '_', '-'], ' ', $email_username));
    
    $create_res = supabase_rest('POST', '/vendors', [
        'user_id' => $user_id,
        'name'    => $name,
        'school'  => 'School Gate',
    ], [], $token);
    
    if ($create_res['status'] !== 201) {
        http_response_code(500);
        die(json_encode(['error' => 'Failed to auto-create vendor profile']));
    }
    
    $vendor = is_array($create_res['body']) ? $create_res['body'][0] ?? $create_res['body'] : $create_res['body'];
    $vendor_id = $vendor['id'] ?? '';
    
    if ($vendor_id !== '') {
        // Create default settings
        supabase_rest('POST', '/settings', [
            'vendor_id'               => $vendor_id,
            'exchange_rate_usd_to_zar' => 18.5,
            'display_currency'         => 'USD',
        ], [], $token);
    }
    
    return $vendor;
}
