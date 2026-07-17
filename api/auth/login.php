<?php
/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: { access_token, refresh_token, user, vendor }
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();
require_method('POST');

$body     = request_body();
$email    = sanitize_string($body['email']    ?? '');
$password = sanitize_string($body['password'] ?? '');

if ($email === '' || $password === '') {
    json_error('Email and password are required');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Invalid email address');
}

// --- Authenticate with Supabase Auth ---
$auth = supabase_auth('/token?grant_type=password', [
    'email'    => $email,
    'password' => $password,
]);

if ($auth['status'] !== 200) {
    $msg = $auth['body']['error_description'] ?? $auth['body']['msg'] ?? 'Invalid credentials';
    json_error($msg, 401);
}

$access_token  = $auth['body']['access_token']  ?? '';
$refresh_token = $auth['body']['refresh_token'] ?? '';
$user          = $auth['body']['user']           ?? [];

// --- Fetch vendor profile ---
$vendor_res = supabase_rest('GET', '/vendors', [], [
    'select' => '*',
    'limit'  => '1',
], $access_token);

$vendor = ($vendor_res['status'] === 200 && !empty($vendor_res['body']))
    ? $vendor_res['body'][0]
    : null;

json_response([
    'access_token'  => $access_token,
    'refresh_token' => $refresh_token,
    'user'          => ['id' => $user['id'] ?? '', 'email' => $user['email'] ?? ''],
    'vendor'        => $vendor,
]);
