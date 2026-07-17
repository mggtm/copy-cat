<?php
/**
 * GET    /api/expenses          — list expenses
 * POST   /api/expenses          — add an expense
 *
 * Restocking shortcut:
 *   POST with { product_id, qty_added, ...expense fields }
 *   → logs expense AND increases stock in one call
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();

$token  = require_auth();
$method = strtoupper($_SERVER['REQUEST_METHOD']);
$EXPENSE_CATS = ['restocking', 'transport', 'other'];

// ------------------------------------------------------------------ GET
if ($method === 'GET') {
    $query = [
        'select' => '*',
        'order'  => 'expense_date.desc,created_at.desc',
    ];
    if (!empty($_GET['from'])) $query['expense_date'] = 'gte.' . sanitize_string($_GET['from']);
    if (!empty($_GET['to']))   $query['expense_date']  = 'lte.' . sanitize_string($_GET['to']);

    $res = supabase_rest('GET', '/expenses', [], $query, $token);
    if ($res['status'] !== 200) {
        json_error('Failed to load expenses', $res['status']);
    }
    json_response($res['body']);
}

// ------------------------------------------------------------------ POST
if ($method === 'POST') {
    $body         = request_body();
    $description  = sanitize_string($body['description']   ?? '');
    $amount_usd   = sanitize_number($body['amount_usd']    ?? null);
    $category     = sanitize_string($body['category']      ?? 'other');
    $expense_date = sanitize_string($body['expense_date']  ?? date('Y-m-d'));
    $product_id   = sanitize_string($body['product_id']    ?? ''); // restocking shortcut
    $qty_added    = (int) ($body['qty_added']              ?? 0);

    if ($description === '')                               json_error('Description is required');
    if ($amount_usd === null || $amount_usd <= 0)          json_error('Amount must be a positive number');
    if (!in_array($category, $EXPENSE_CATS, true))         json_error('Invalid expense category');

    // Get vendor_id
    $vendor_res = supabase_rest('GET', '/vendors', [], ['select'=>'id','limit'=>'1'], $token);
    if ($vendor_res['status'] !== 200 || empty($vendor_res['body'])) {
        json_error('Vendor not found', 404);
    }
    $vendor_id = $vendor_res['body'][0]['id'];

    // Insert expense
    $exp_res = supabase_rest('POST', '/expenses', [
        'vendor_id'    => $vendor_id,
        'description'  => $description,
        'amount_usd'   => $amount_usd,
        'category'     => $category,
        'expense_date' => $expense_date,
    ], [], $token);

    if ($exp_res['status'] !== 201) {
        json_error('Failed to log expense', 500);
    }

    // Restocking shortcut: also increase stock
    if ($product_id !== '' && $qty_added > 0) {
        $prod_res = supabase_rest('GET', '/products', [], [
            'select' => 'stock_qty',
            'id'     => 'eq.' . $product_id,
            'limit'  => '1',
        ], $token);

        if ($prod_res['status'] === 200 && !empty($prod_res['body'])) {
            $current = (int) $prod_res['body'][0]['stock_qty'];
            supabase_rest('PATCH', '/products', [
                'stock_qty' => $current + $qty_added,
            ], ['id' => 'eq.' . $product_id], $token);
        }
    }

    $expense = is_array($exp_res['body']) ? ($exp_res['body'][0] ?? $exp_res['body']) : null;
    json_response($expense, 201);
}

json_error('Method not allowed', 405);
