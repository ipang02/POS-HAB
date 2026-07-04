<?php
// ============================================================
// HAB Barbershop POS — Blob Data API
// GET  /api/data.php           → all blobs + ALL transactions (boot)
// GET  /api/data.php?mode=poll → all blobs + today's transactions (poll)
// POST /api/data.php           → upsert one blob key
// ============================================================
require '../config.php';

// ── Auth ─────────────────────────────────────────────────────
$token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
if (!defined('API_TOKEN') || $token !== API_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
$method = $_SERVER['REQUEST_METHOD'];

// ── POST: upsert one blob key ─────────────────────────────────
if ($method === 'POST') {
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $key   = $body['key']   ?? '';
    $value = $body['value'] ?? '';

    $allowed = ['services','barbers','appointments','inventory','queue','customers','settings','branches'];
    if (!in_array($key, $allowed, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid key: ' . $key]);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO app_data (data_key, data_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE data_value = VALUES(data_value),
                                 updated_at = CURRENT_TIMESTAMP"
    );
    $stmt->bind_param('ss', $key, $value);
    $ok = $stmt->execute();
    $stmt->close();

    echo json_encode(['ok' => $ok]);
    exit;
}

// ── GET: return all data ──────────────────────────────────────
// Check if app_data is seeded
$res  = $conn->query("SELECT COUNT(*) AS cnt FROM app_data");
$row  = $res->fetch_assoc();
$seeded = (int)$row['cnt'] > 0;

if (!$seeded) {
    echo json_encode(['seeded' => false]);
    exit;
}

// Load all blob rows
$blobKeys = ['services','barbers','appointments','inventory','queue','customers','settings','branches'];
$data = ['seeded' => true, 'updated_at' => []];

$res = $conn->query("SELECT data_key, data_value, updated_at FROM app_data");
while ($row = $res->fetch_assoc()) {
    $parsed = json_decode($row['data_value'], true);
    $data[$row['data_key']] = $parsed;
    $data['updated_at'][$row['data_key']] = $row['updated_at'];
}

// Fill missing keys with empty defaults
foreach ($blobKeys as $k) {
    if (!array_key_exists($k, $data)) {
        $data[$k] = ($k === 'settings') ? new stdClass() : [];
    }
}

// ── Load transactions ─────────────────────────────────────────
$pollMode = (($_GET['mode'] ?? '') === 'poll');

$sql = "
    SELECT
        t.id, t.branch_id, t.customer, t.customer_phone, t.barber_id,
        t.discount, t.tax, t.total, t.method, t.tendered,
        DATE_FORMAT(t.date, '%Y-%m-%d') AS date,
        TIME_FORMAT(t.time, '%H:%i')    AS time,
        ti.item_type, ti.item_name, ti.qty, ti.price, ti.commission_rm
    FROM transactions t
    LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
";
if ($pollMode) {
    $sql .= " WHERE t.date = CURDATE()";
}
$sql .= " ORDER BY t.date DESC, t.time DESC, t.id, ti.id";

$result = $conn->query($sql);
$trxMap = [];
while ($row = $result->fetch_assoc()) {
    $id = $row['id'];
    if (!isset($trxMap[$id])) {
        $trxMap[$id] = [
            'id'            => $id,
            'branchId'      => (int)$row['branch_id'],
            'customer'      => $row['customer'],
            'customerPhone' => $row['customer_phone'] ?? '',
            'barberId'      => $row['barber_id'] !== null ? (int)$row['barber_id'] : 0,
            'discount'      => (int)$row['discount'],
            'tax'           => (int)$row['tax'],
            'total'         => (float)$row['total'],
            'method'        => $row['method'],
            'tendered'      => (float)$row['tendered'],
            'date'          => $row['date'],
            'time'          => $row['time'],
            'services'      => [],
        ];
    }
    if ($row['item_name'] !== null) {
        $item = [
            'name'  => $row['item_name'],
            'qty'   => (int)$row['qty'],
            'price' => (float)$row['price'],
            'type'  => $row['item_type'] ?? 'service',
        ];
        if ($row['commission_rm'] !== null) {
            $item['commissionRM'] = (float)$row['commission_rm'];
        }
        $trxMap[$id]['services'][] = $item;
    }
}
$data['transactions'] = array_values($trxMap);

echo json_encode($data);
