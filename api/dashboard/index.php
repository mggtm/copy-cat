<?php
/**
 * GET /api/dashboard
 * Returns KPI cards data: today's revenue, profit, sales count,
 * top product, recent sales, week-over-week comparison.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();
require_method('GET');

$token = require_auth();
$today = date('Y-m-d');
$yesterday = date('Y-m-d', strtotime('-1 day'));

// Get vendor_id
$vendor = require_vendor_profile($token);
$vendor_id = $vendor['id'];

// Settings (for exchange rate)
$settings_res = supabase_rest('GET', '/settings', [], [
    'select'    => 'exchange_rate_usd_to_zar,display_currency',
    'vendor_id' => 'eq.' . $vendor_id,
    'limit'     => '1',
], $token);
$rate     = (float) ($settings_res['body'][0]['exchange_rate_usd_to_zar'] ?? 18.5);
$currency = $settings_res['body'][0]['display_currency'] ?? 'USD';

// Today's sales
$today_sales_res = supabase_rest('GET', '/sales', [], [
    'select'    => 'total_usd,qty,product_id,products(name,buy_price_usd)',
    'sale_date' => 'eq.' . $today,
], $token);
$today_sales = $today_sales_res['body'] ?? [];

// Yesterday's sales for comparison
$yest_sales_res = supabase_rest('GET', '/sales', [], [
    'select'    => 'total_usd',
    'sale_date' => 'eq.' . $yesterday,
], $token);
$yest_sales = $yest_sales_res['body'] ?? [];

// Today's expenses
$today_expenses_res = supabase_rest('GET', '/expenses', [], [
    'select'       => 'amount_usd',
    'expense_date' => 'eq.' . $today,
], $token);
$today_expenses = $today_expenses_res['body'] ?? [];

// Recent 10 sales (any date)
$recent_res = supabase_rest('GET', '/sales', [], [
    'select' => 'id,qty,total_usd,currency_received,sale_date,created_at,products(name,category)',
    'order'  => 'created_at.desc',
    'limit'  => '10',
], $token);
$recent_sales = $recent_res['body'] ?? [];

// Compute KPIs
$today_revenue  = array_sum(array_column($today_sales, 'total_usd'));
$today_expense  = array_sum(array_column($today_expenses, 'amount_usd'));
$yest_revenue   = array_sum(array_column($yest_sales, 'total_usd'));

// Gross profit: revenue - cost of goods sold
$today_cogs = 0;
foreach ($today_sales as $s) {
    $buy = (float) ($s['products']['buy_price_usd'] ?? 0);
    $today_cogs += $buy * (int) $s['qty'];
}
$today_profit = $today_revenue - $today_cogs - $today_expense;

// Revenue change %
$revenue_change = $yest_revenue > 0
    ? round((($today_revenue - $yest_revenue) / $yest_revenue) * 100, 1)
    : ($today_revenue > 0 ? 100.0 : 0.0);

// Top product today
$product_totals = [];
foreach ($today_sales as $s) {
    $pid = $s['product_id'] ?? 'unknown';
    $product_totals[$pid] = ($product_totals[$pid] ?? 0) + (float) $s['total_usd'];
}
$top_product_id  = !empty($product_totals) ? array_keys($product_totals, max($product_totals))[0] : null;
$top_product_name = 'None';
if ($top_product_id) {
    foreach ($today_sales as $s) {
        if ($s['product_id'] === $top_product_id) {
            $top_product_name = $s['products']['name'] ?? 'Unknown';
            break;
        }
    }
}

// Low stock count
$low_stock_res = supabase_rest('GET', '/products', [], [
    'select'    => 'id,name,stock_qty,low_stock_alert',
    'is_active' => 'eq.true',
], $token);
$low_stock_items = array_filter($low_stock_res['body'] ?? [], function($p) {
    return (int)$p['stock_qty'] <= (int)$p['low_stock_alert'];
});

json_response([
    'today_revenue_usd'  => round($today_revenue, 2),
    'today_profit_usd'   => round($today_profit, 2),
    'today_sales_count'  => count($today_sales),
    'today_expense_usd'  => round($today_expense, 2),
    'revenue_change_pct' => $revenue_change,
    'top_product'        => $top_product_name,
    'low_stock_count'    => count($low_stock_items),
    'recent_sales'       => array_values($recent_sales),
    'exchange_rate'      => $rate,
    'display_currency'   => $currency,
]);
