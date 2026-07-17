<?php
/**
 * GET  /api/sales          — list sales (filterable by date range)
 * POST /api/sales          — record a new sale (decrements stock)
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
    $query = [
        'select' => '*,products(name,category,sell_price_usd)',
        'order'  => 'sale_date.desc,created_at.desc',
    ];
    // Date filters
    if (!empty($_GET['from'])) $query['sale_date'] = 'gte.' . sanitize_string($_GET['from']);
    if (!empty($_GET['to']))   $query['sale_date']  = 'lte.' . sanitize_string($_GET['to']);
    // Single-date shortcut (overrides above)
    if (!empty($_GET['date'])) $query['sale_date'] = 'eq.' . sanitize_string($_GET['date']);

    $res = supabase_rest('GET', '/sales', [], $query, $token);
    if ($res['status'] !== 200) {
        json_error('Failed to load sales', $res['status']);
    }
    json_response($res['body']);
}

// ------------------------------------------------------------------ POST
if ($method === 'POST') {
    $body       = request_body();
    $product_id = sanitize_string($body['product_id']        ?? '');
    $qty        = (int) ($body['qty']                        ?? 0);
    $currency   = strtoupper(sanitize_string($body['currency_received'] ?? 'USD'));
    $sale_date  = sanitize_string($body['sale_date']         ?? date('Y-m-d'));

    if ($product_id === '')              json_error('product_id is required');
    if ($qty < 1)                        json_error('Quantity must be at least 1');
    if (!in_array($currency, ['USD','ZAR'], true)) json_error('Currency must be USD or ZAR');

    // Get vendor_id
    $vendor_res = supabase_rest('GET', '/vendors', [], ['select'=>'id','limit'=>'1'], $token);
    if ($vendor_res['status'] !== 200 || empty($vendor_res['body'])) {
        json_error('Vendor not found', 404);
    }
    $vendor_id = $vendor_res['body'][0]['id'];

    // Fetch product (validate stock and get price)
    $prod_res = supabase_rest('GET', '/products', [], [
        'select' => 'id,sell_price_usd,stock_qty,is_active',
        'id'     => 'eq.' . $product_id,
        'limit'  => '1',
    ], $token);

    if ($prod_res['status'] !== 200 || empty($prod_res['body'])) {
        json_error('Product not found', 404);
    }
    $product = $prod_res['body'][0];

    if (!$product['is_active']) json_error('Product is no longer active');
    if ($product['stock_qty'] < $qty) {
        json_error('Insufficient stock — only ' . $product['stock_qty'] . ' available');
    }

    $unit_price = (float) $product['sell_price_usd'];
    $total_usd  = round($unit_price * $qty, 2);

    // Fetch exchange rate for amount_received calculation
    $settings_res = supabase_rest('GET', '/settings', [], [
        'select'    => 'exchange_rate_usd_to_zar',
        'vendor_id' => 'eq.' . $vendor_id,
        'limit'     => '1',
    ], $token);
    $rate = (float) ($settings_res['body'][0]['exchange_rate_usd_to_zar'] ?? 18.5);

    $amount_received = $currency === 'ZAR'
        ? round($total_usd * $rate, 2)
        : $total_usd;

    // Insert sale
    $sale_res = supabase_rest('POST', '/sales', [
        'vendor_id'        => $vendor_id,
        'product_id'       => $product_id,
        'qty'              => $qty,
        'unit_price_usd'   => $unit_price,
        'currency_received' => $currency,
        'amount_received'  => $amount_received,
        'total_usd'        => $total_usd,
        'sale_date'        => $sale_date,
    ], [], $token);

    if ($sale_res['status'] !== 201) {
        json_error('Failed to record sale', 500);
    }

    // Decrement stock
    supabase_rest('PATCH', '/products', [
        'stock_qty' => $product['stock_qty'] - $qty,
    ], ['id' => 'eq.' . $product_id], $token);

    $sale = is_array($sale_res['body']) ? ($sale_res['body'][0] ?? $sale_res['body']) : null;
    json_response($sale, 201);
}

json_error('Method not allowed', 405);
