<?php
/**
 * VendorFlow — HTTP Response & Auth Helpers
 * Standardises JSON responses and token extraction.
 */

declare(strict_types=1);

/**
 * Send a JSON response and terminate.
 *
 * @param mixed $data    Data to encode
 * @param int   $status  HTTP status code
 */
function json_response(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Send a JSON error response and terminate.
 */
function json_error(string $message, int $status = 400): never {
    json_response(['error' => $message], $status);
}

/**
 * Handle OPTIONS preflight (CORS) and terminate.
 */
function handle_preflight(): void {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Assert the HTTP method matches; otherwise 405.
 */
function require_method(string ...$methods): void {
    $current = strtoupper($_SERVER['REQUEST_METHOD']);
    $allowed = array_map('strtoupper', $methods);
    if (!in_array($current, $allowed, true)) {
        json_error('Method not allowed', 405);
    }
}

/**
 * Extract the Bearer token from the Authorization header.
 * Returns empty string if not present.
 */
function get_bearer_token(): string {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($auth, 'Bearer ')) {
        return substr($auth, 7);
    }
    return '';
}

/**
 * Require a valid Bearer token; returns it or sends 401.
 */
function require_auth(): string {
    $token = get_bearer_token();
    if ($token === '') {
        json_error('Unauthorized — provide a Bearer token', 401);
    }
    return $token;
}

/**
 * Parse and return the JSON body of the request.
 * Returns [] if body is empty or invalid JSON.
 */
function request_body(): array {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/**
 * Sanitise a string — trim and strip tags.
 */
function sanitize_string(string $value): string {
    return strip_tags(trim($value));
}

/**
 * Validate and sanitise a numeric value.
 * Returns null if invalid.
 */
function sanitize_number(mixed $value): ?float {
    if (!is_numeric($value)) return null;
    return (float) $value;
}
