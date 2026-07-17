<?php
/**
 * GET /api/products          — list all active products for the vendor
 * POST /api/products         — create a new product
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();

$token     = require_auth();
$method    = strtoupper($_SERVER['REQUEST_METHOD']);
$CATS      = ['burgers','drinks','snacks','rice','sweets','chips','sausages'];

// ------------------------------------------------------------------ GET
if ($method === 'GET') {
    $query = [
        'select'   => '*',
        'order'    => 'created_at.desc',
    ];
    // Optional: filter by active only
    if (($_GET['active'] ?? '') === 'true') {
        $query['is_active'] = 'eq.true';
    }

    $res = supabase_rest('GET', '/products', [], $query, $token);
    if ($res['status'] !== 200) {
        json_error('Failed to load products', $res['status']);
    }
    json_response($res['body']);
}

// ------------------------------------------------------------------ POST
if ($method === 'POST') {
    $body = request_body();

    $name          = sanitize_string($body['name']          ?? '');
    $category      = sanitize_string($body['category']      ?? '');
    $buy_price     = sanitize_number($body['buy_price_usd']  ?? null);
    $sell_price    = sanitize_number($body['sell_price_usd'] ?? null);
    $stock_qty     = (int) ($body['stock_qty']     ?? 0);
    $low_stock     = (int) ($body['low_stock_alert'] ?? 5);

    if ($name === '')                          json_error('Product name is required');
    if (!in_array($category, $CATS, true))     json_error('Invalid category');
    if ($buy_price  === null || $buy_price  < 0) json_error('Invalid buy price');
    if ($sell_price === null || $sell_price < 0) json_error('Invalid sell price');
    if ($stock_qty  < 0)                       json_error('Stock quantity cannot be negative');

    // Fetch vendor_id from token
    $vendor_res = supabase_rest('GET', '/vendors', [], ['select'=>'id','limit'=>'1'], $token);
    if ($vendor_res['status'] !== 200 || empty($vendor_res['body'])) {
        json_error('Vendor not found', 404);
    }
    $vendor_id = $vendor_res['body'][0]['id'];

    $res = supabase_rest('POST', '/products', [
        'vendor_id'       => $vendor_id,
        'name'            => $name,
        'category'        => $category,
        'buy_price_usd'   => $buy_price,
        'sell_price_usd'  => $sell_price,
        'stock_qty'       => $stock_qty,
        'low_stock_alert' => $low_stock,
    ], [], $token);

    if ($res['status'] !== 201) {
        json_error('Failed to create product', 500);
    }

    $product = is_array($res['body']) ? ($res['body'][0] ?? $res['body']) : null;
    json_response($product, 201);
}

json_error('Method not allowed', 405);
