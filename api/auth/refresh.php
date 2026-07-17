<?php
/**
 * POST /api/auth/refresh
 * Body: { refresh_token }
 * Returns: { access_token, refresh_token }
 * Used to silently renew an expired access token.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();
require_method('POST');

$body          = request_body();
$refresh_token = sanitize_string($body['refresh_token'] ?? '');

if ($refresh_token === '') {
    json_error('refresh_token is required');
}

$res = supabase_auth('/token?grant_type=refresh_token', [
    'refresh_token' => $refresh_token,
]);

if ($res['status'] !== 200) {
    json_error('Token refresh failed — please log in again', 401);
}

json_response([
    'access_token'  => $res['body']['access_token']  ?? '',
    'refresh_token' => $res['body']['refresh_token'] ?? '',
]);
