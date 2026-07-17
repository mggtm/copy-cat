<?php
/**
 * PUT  /api/products/item?id={uuid}  — update a product
 * DELETE /api/products/item?id={uuid} — soft-delete (set is_active=false)
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();

$token  = require_auth();
$method = strtoupper($_SERVER['REQUEST_METHOD']);
$id     = sanitize_string($_GET['id'] ?? '');
$CATS   = ['burgers','drinks','snacks','rice','sweets','chips','sausages'];

if ($id === '') {
    json_error('Product id is required');
}

// ------------------------------------------------------------------ PUT
if ($method === 'PUT') {
    $body = request_body();
    $patch = [];

    if (isset($body['name']))            $patch['name']            = sanitize_string($body['name']);
    if (isset($body['category'])) {
        $cat = sanitize_string($body['category']);
        if (!in_array($cat, $CATS, true)) json_error('Invalid category');
        $patch['category'] = $cat;
    }
    if (isset($body['buy_price_usd'])) {
        $v = sanitize_number($body['buy_price_usd']);
        if ($v === null || $v < 0) json_error('Invalid buy price');
        $patch['buy_price_usd'] = $v;
    }
    if (isset($body['sell_price_usd'])) {
        $v = sanitize_number($body['sell_price_usd']);
        if ($v === null || $v < 0) json_error('Invalid sell price');
        $patch['sell_price_usd'] = $v;
    }
    if (isset($body['stock_qty'])) {
        $v = (int) $body['stock_qty'];
        if ($v < 0) json_error('Stock cannot be negative');
        $patch['stock_qty'] = $v;
    }
    if (isset($body['low_stock_alert'])) {
        $patch['low_stock_alert'] = max(0, (int) $body['low_stock_alert']);
    }
    if (isset($body['is_active'])) {
        $patch['is_active'] = (bool) $body['is_active'];
    }

    if (empty($patch)) {
        json_error('No fields to update');
    }

    $res = supabase_rest('PATCH', '/products', $patch, [
        'id' => 'eq.' . $id,
    ], $token);

    if ($res['status'] !== 200) {
        json_error('Failed to update product', 500);
    }

    $product = is_array($res['body']) ? ($res['body'][0] ?? $res['body']) : null;
    json_response($product);
}

// ------------------------------------------------------------------ DELETE (soft)
if ($method === 'DELETE') {
    $res = supabase_rest('PATCH', '/products', ['is_active' => false], [
        'id' => 'eq.' . $id,
    ], $token);

    if ($res['status'] !== 200) {
        json_error('Failed to archive product', 500);
    }
    json_response(['message' => 'Product archived']);
}

json_error('Method not allowed', 405);
