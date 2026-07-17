<?php
/**
 * GET   /api/stock          — list all products with stock info
 * PATCH /api/stock          — adjust stock for a product
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();

$token  = require_auth();
$method = strtoupper($_SERVER['REQUEST_METHOD']);

// ------------------------------------------------------------------ GET
if ($method === 'GET') {
    $res = supabase_rest('GET', '/products', [], [
        'select' => 'id,name,category,stock_qty,low_stock_alert,buy_price_usd,sell_price_usd,is_active',
        'order'  => 'category.asc,name.asc',
    ], $token);

    if ($res['status'] !== 200) {
        json_error('Failed to load stock', $res['status']);
    }

    // Enrich with low-stock flags
    $items = array_map(function($p) {
        $p['is_low_stock'] = (int)$p['stock_qty'] <= (int)$p['low_stock_alert'];
        return $p;
    }, $res['body'] ?? []);

    json_response($items);
}

// ------------------------------------------------------------------ PATCH (manual adjustment)
if ($method === 'PATCH') {
    $body       = request_body();
    $product_id = sanitize_string($body['product_id'] ?? '');
    $new_qty    = $body['stock_qty'] ?? null;

    if ($product_id === '')  json_error('product_id is required');
    if ($new_qty === null)   json_error('stock_qty is required');
    if ((int)$new_qty < 0)  json_error('Stock cannot be negative');

    $res = supabase_rest('PATCH', '/products', [
        'stock_qty' => (int)$new_qty,
    ], ['id' => 'eq.' . $product_id], $token);

    if ($res['status'] !== 200) {
        json_error('Failed to update stock', 500);
    }

    json_response(['message' => 'Stock updated', 'stock_qty' => (int)$new_qty]);
}

json_error('Method not allowed', 405);
