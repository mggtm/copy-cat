<?php
/**
 * POST /api/auth/register
 * Body: { email, password, name, phone?, school? }
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
$name     = sanitize_string($body['name']     ?? '');
$phone    = sanitize_string($body['phone']    ?? '');
$school   = sanitize_string($body['school']   ?? 'School Gate');

// --- Validate inputs ---
if ($email === '' || $password === '' || $name === '') {
    json_error('Email, password, and vendor name are required');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Invalid email address');
}
if (strlen($password) < 8) {
    json_error('Password must be at least 8 characters');
}

// --- Sign up with Supabase Auth ---
$signup = supabase_auth('/signup', [
    'email'    => $email,
    'password' => $password,
]);

if ($signup['status'] !== 200 && $signup['status'] !== 201) {
    $msg = $signup['body']['error_description'] ?? $signup['body']['msg'] ?? $signup['body']['error'] ?? 'Registration failed';
    json_error($msg, 400);
}

$access_token  = $signup['body']['access_token']  ?? '';
$refresh_token = $signup['body']['refresh_token'] ?? '';
$user          = $signup['body']['user']           ?? [];
$user_id       = $user['id'] ?? '';

if ($user_id === '' || $access_token === '') {
    json_error('Registration succeeded but no session returned — check email confirmation settings', 500);
}

// --- Create vendor profile ---
$vendor_res = supabase_rest('POST', '/vendors', [
    'user_id' => $user_id,
    'name'    => $name,
    'phone'   => $phone ?: null,
    'school'  => $school,
], [], $access_token);

if ($vendor_res['status'] !== 201) {
    json_error('Failed to create vendor profile', 500);
}

$vendor    = is_array($vendor_res['body']) ? $vendor_res['body'][0] ?? $vendor_res['body'] : null;
$vendor_id = $vendor['id'] ?? '';

// --- Create default settings ---
if ($vendor_id !== '') {
    supabase_rest('POST', '/settings', [
        'vendor_id'               => $vendor_id,
        'exchange_rate_usd_to_zar' => 18.5,
        'display_currency'         => 'USD',
    ], [], $access_token);
}

json_response([
    'access_token'  => $access_token,
    'refresh_token' => $refresh_token,
    'user'          => ['id' => $user_id, 'email' => $email],
    'vendor'        => $vendor,
], 201);
