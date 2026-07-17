<?php
/**
 * GET  /api/settings          — get vendor settings + profile
 * PUT  /api/settings          — update settings
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();

$token  = require_auth();
$method = strtoupper($_SERVER['REQUEST_METHOD']);

// Get vendor_id (needed for both GET and PUT)
$vendor_res = supabase_rest('GET', '/vendors', [], ['select'=>'*','limit'=>'1'], $token);
if ($vendor_res['status'] !== 200 || empty($vendor_res['body'])) {
    json_error('Vendor not found', 404);
}
$vendor    = $vendor_res['body'][0];
$vendor_id = $vendor['id'];

// ------------------------------------------------------------------ GET
if ($method === 'GET') {
    $settings_res = supabase_rest('GET', '/settings', [], [
        'select'    => '*',
        'vendor_id' => 'eq.' . $vendor_id,
        'limit'     => '1',
    ], $token);

    $settings = ($settings_res['status'] === 200 && !empty($settings_res['body']))
        ? $settings_res['body'][0]
        : ['exchange_rate_usd_to_zar' => 18.5, 'display_currency' => 'USD'];

    json_response([
        'vendor'   => $vendor,
        'settings' => $settings,
    ]);
}

// ------------------------------------------------------------------ PUT
if ($method === 'PUT') {
    $body = request_body();

    // Update vendor profile if provided
    $vendor_patch = [];
    if (isset($body['name']))   $vendor_patch['name']  = sanitize_string($body['name']);
    if (isset($body['phone']))  $vendor_patch['phone'] = sanitize_string($body['phone']);
    if (isset($body['school'])) $vendor_patch['school'] = sanitize_string($body['school']);

    if (!empty($vendor_patch)) {
        supabase_rest('PATCH', '/vendors', $vendor_patch, ['id' => 'eq.' . $vendor_id], $token);
    }

    // Update settings
    $settings_patch = [];
    if (isset($body['exchange_rate_usd_to_zar'])) {
        $rate = sanitize_number($body['exchange_rate_usd_to_zar']);
        if ($rate === null || $rate <= 0) json_error('Exchange rate must be positive');
        $settings_patch['exchange_rate_usd_to_zar'] = $rate;
    }
    if (isset($body['display_currency'])) {
        $cur = strtoupper(sanitize_string($body['display_currency']));
        if (!in_array($cur, ['USD', 'ZAR'], true)) json_error('Currency must be USD or ZAR');
        $settings_patch['display_currency'] = $cur;
    }

    if (!empty($settings_patch)) {
        // Check if settings row exists
        $check = supabase_rest('GET', '/settings', [], [
            'select'    => 'id',
            'vendor_id' => 'eq.' . $vendor_id,
            'limit'     => '1',
        ], $token);

        if (!empty($check['body'])) {
            supabase_rest('PATCH', '/settings', $settings_patch, [
                'vendor_id' => 'eq.' . $vendor_id,
            ], $token);
        } else {
            // Create settings row
            $settings_patch['vendor_id'] = $vendor_id;
            supabase_rest('POST', '/settings', $settings_patch, [], $token);
        }
    }

    json_response(['message' => 'Settings updated']);
}

json_error('Method not allowed', 405);
