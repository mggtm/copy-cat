<?php
/**
 * GET /api/analytics?range={today|7d|30d|custom}&from={date}&to={date}
 * Returns data for charts: revenue over time, top products, profit margin.
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();
require_method('GET');

$token = require_auth();
$range = sanitize_string($_GET['range'] ?? '7d');
$today = date('Y-m-d');

// Calculate date range
switch ($range) {
    case 'today':
        $from = $today;
        $to   = $today;
        break;
    case '7d':
        $from = date('Y-m-d', strtotime('-6 days'));
        $to   = $today;
        break;
    case '30d':
        $from = date('Y-m-d', strtotime('-29 days'));
        $to   = $today;
        break;
    case 'custom':
        $from = sanitize_string($_GET['from'] ?? date('Y-m-d', strtotime('-6 days')));
        $to   = sanitize_string($_GET['to']   ?? $today);
        break;
    default:
        $from = date('Y-m-d', strtotime('-6 days'));
        $to   = $today;
}

// Fetch all sales in range with product info
$sales_res = supabase_rest('GET', '/sales', [], [
    'select'    => 'total_usd,qty,sale_date,product_id,products(name,category,buy_price_usd)',
    'sale_date' => 'gte.' . $from,
    'order'     => 'sale_date.asc',
], $token);
// Apply to filter
$all_sales = array_filter($sales_res['body'] ?? [], function($s) use ($to) {
    return $s['sale_date'] <= $to;
});
$all_sales = array_values($all_sales);

// Fetch all expenses in range
$expenses_res = supabase_rest('GET', '/expenses', [], [
    'select'       => 'amount_usd,expense_date',
    'expense_date' => 'gte.' . $from,
    'order'        => 'expense_date.asc',
], $token);
$all_expenses = array_filter($expenses_res['body'] ?? [], function($e) use ($to) {
    return $e['expense_date'] <= $to;
});
$all_expenses = array_values($all_expenses);

// --- Revenue & Profit by day ---
$days = [];
$cur = strtotime($from);
$end = strtotime($to);
while ($cur <= $end) {
    $d = date('Y-m-d', $cur);
    $days[$d] = ['date' => $d, 'revenue' => 0, 'cogs' => 0, 'expenses' => 0, 'profit' => 0];
    $cur = strtotime('+1 day', $cur);
}
foreach ($all_sales as $s) {
    $d = $s['sale_date'];
    if (!isset($days[$d])) continue;
    $days[$d]['revenue'] += (float)$s['total_usd'];
    $days[$d]['cogs']    += (float)($s['products']['buy_price_usd'] ?? 0) * (int)$s['qty'];
}
foreach ($all_expenses as $e) {
    $d = $e['expense_date'];
    if (!isset($days[$d])) continue;
    $days[$d]['expenses'] += (float)$e['amount_usd'];
}
foreach ($days as &$d) {
    $d['profit'] = round($d['revenue'] - $d['cogs'] - $d['expenses'], 2);
    $d['revenue'] = round($d['revenue'], 2);
    $d['expenses'] = round($d['expenses'], 2);
}
unset($d);

// --- Top products by revenue ---
$product_stats = [];
foreach ($all_sales as $s) {
    $name = $s['products']['name'] ?? 'Unknown';
    $cat  = $s['products']['category'] ?? 'other';
    if (!isset($product_stats[$name])) {
        $product_stats[$name] = ['name' => $name, 'category' => $cat, 'revenue' => 0, 'qty' => 0];
    }
    $product_stats[$name]['revenue'] += (float)$s['total_usd'];
    $product_stats[$name]['qty']     += (int)$s['qty'];
}
usort($product_stats, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
$product_stats = array_slice(array_values($product_stats), 0, 8);
foreach ($product_stats as &$p) {
    $p['revenue'] = round($p['revenue'], 2);
}
unset($p);

// --- Category breakdown ---
$category_stats = [];
foreach ($all_sales as $s) {
    $cat = $s['products']['category'] ?? 'other';
    $category_stats[$cat] = ($category_stats[$cat] ?? 0) + (float)$s['total_usd'];
}
arsort($category_stats);

// --- Summary totals ---
$total_revenue  = round(array_sum(array_column(array_values($days), 'revenue')), 2);
$total_expenses = round(array_sum(array_column(array_values($days), 'expenses')), 2);
$total_profit   = round(array_sum(array_column(array_values($days), 'profit')), 2);
$margin_pct     = $total_revenue > 0 ? round(($total_profit / $total_revenue) * 100, 1) : 0;

json_response([
    'range'          => $range,
    'from'           => $from,
    'to'             => $to,
    'daily'          => array_values($days),
    'top_products'   => $product_stats,
    'categories'     => $category_stats,
    'total_revenue'  => $total_revenue,
    'total_expenses' => $total_expenses,
    'total_profit'   => $total_profit,
    'margin_pct'     => $margin_pct,
]);
