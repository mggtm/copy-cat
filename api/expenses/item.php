<?php
/**
 * DELETE /api/expenses/item?id={uuid} — remove an expense record
 */

declare(strict_types=1);

require_once dirname(__DIR__) . '/_lib/supabase.php';
require_once dirname(__DIR__) . '/_lib/response.php';

load_env();
handle_preflight();
require_method('DELETE');

$token = require_auth();
$id    = sanitize_string($_GET['id'] ?? '');

if ($id === '') {
    json_error('Expense id is required');
}

$res = supabase_rest('DELETE', '/expenses', [], ['id' => 'eq.' . $id], $token);

if ($res['status'] !== 200 && $res['status'] !== 204) {
    json_error('Failed to delete expense', 500);
}

json_response(['message' => 'Expense deleted']);
