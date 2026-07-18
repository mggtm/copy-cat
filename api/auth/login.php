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
$phone    = sanitize_string($body['phone']    ?? '');
$password = sanitize_string($body['password'] ?? '');

if ($email === '' && $phone === '') {
    json_error('Email or phone number is required');
}
if ($password === '') {
    json_error('Password is required');
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Invalid email address');
}

// --- Authenticate with Supabase Auth ---
$payload = ['password' => $password];
if ($phone !== '') {
    $payload['phone'] = $phone;
} else {
    $payload['email'] = $email;
}

$auth = supabase_auth('/token?grant_type=password', $payload);

if ($auth['status'] !== 200) {
    $msg = $auth['body']['error_description'] ?? $auth['body']['msg'] ?? $auth['body']['error'] ?? 'Invalid credentials';
    json_error($msg, 401);
}

$access_token  = $auth['body']['access_token']  ?? '';
$refresh_token = $auth['body']['refresh_token'] ?? '';
$user          = $auth['body']['user']           ?? [];

// --- Fetch vendor profile (auto-create if missing) ---
$vendor = require_vendor_profile($access_token);

json_response([
    'access_token'  => $access_token,
    'refresh_token' => $refresh_token,
    'user'          => ['id' => $user['id'] ?? '', 'email' => $user['email'] ?? ''],
    'vendor'        => $vendor,
]);
