<?php
// ============================================================
// HAB Barbershop POS — Transactions API
// POST   /api/transactions.php        → INSERT one transaction
// GET    /api/transactions.php?all=1  → all transactions (analytics)
// DELETE /api/transactions.php        → clear all transactions
// ============================================================
require '../config.php';

header('Content-Type: application/json; charset=utf-8');

// ── Auth ─────────────────────────────────────────────────────
$token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
if (!defined('API_TOKEN') || $token !== API_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── DELETE: clear all transactions ───────────────────────────
if ($method === 'DELETE') {
    $conn->query("SET FOREIGN_KEY_CHECKS = 0");
    $ok = $conn->query("DELETE FROM transaction_items") && $conn->query("DELETE FROM transactions");
    $conn->query("SET FOREIGN_KEY_CHECKS = 1");
    echo json_encode(['ok' => (bool)$ok]);
    exit;
}

// ── GET: return all transactions ──────────────────────────────
if ($method === 'GET') {
    $sql = "
        SELECT
            t.id, t.branch_id, t.customer, t.customer_phone, t.barber_id,
            t.discount, t.tax, t.total, t.method, t.tendered,
            DATE_FORMAT(t.date, '%Y-%m-%d') AS date,
            TIME_FORMAT(t.time, '%H:%i')    AS time,
            ti.item_type, ti.item_name, ti.qty, ti.price, ti.commission_rm
        FROM transactions t
        LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
        ORDER BY t.date DESC, t.time DESC, t.id, ti.id
    ";
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
    echo json_encode(['transactions' => array_values($trxMap)]);
    exit;
}

// ── POST: insert one transaction ──────────────────────────────
if ($method === 'POST') {
    $trx = json_decode(file_get_contents('php://input'), true) ?? [];

    $id            = $trx['id']            ?? '';
    $branchId      = (int)($trx['branchId']   ?? 1);
    $customer      = $trx['customer']         ?? 'Walk-in';
    $customerPhone = $trx['customerPhone']    ?? null;
    $barberId      = ($trx['barberId'] ?? 0) ?: null;
    $discount      = (int)($trx['discount']   ?? 0);
    $tax           = (int)($trx['tax']        ?? 6);
    $total         = (float)($trx['total']    ?? 0);
    $method_pay    = $trx['method']            ?? 'cash';
    $tendered      = (float)($trx['tendered'] ?? 0);
    $date          = $trx['date']             ?? date('Y-m-d');
    $time          = $trx['time']             ?? date('H:i');
    $services      = $trx['services']         ?? [];

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing transaction id']);
        exit;
    }

    // Disable FK checks — branches/barbers are in blob store, not SQL tables
    $conn->query("SET FOREIGN_KEY_CHECKS = 0");

    $stmt = $conn->prepare(
        "INSERT INTO transactions
             (id, branch_id, customer, customer_phone, barber_id,
              discount, tax, total, method, tendered, date, time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        'sisssiidsdss',
        $id, $branchId, $customer, $customerPhone, $barberId,
        $discount, $tax, $total, $method_pay, $tendered, $date, $time
    );
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) {
        $conn->query("SET FOREIGN_KEY_CHECKS = 1");
        echo json_encode(['ok' => false, 'error' => $conn->error]);
        exit;
    }

    // Insert items — two prepared statements: with and without commission_rm
    $stmtC = $conn->prepare(
        "INSERT INTO transaction_items (transaction_id, item_type, item_name, qty, price, commission_rm)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmtN = $conn->prepare(
        "INSERT INTO transaction_items (transaction_id, item_type, item_name, qty, price)
         VALUES (?, ?, ?, ?, ?)"
    );

    if (!$stmtC || !$stmtN) {
        if ($stmtC) $stmtC->close();
        if ($stmtN) $stmtN->close();
        $conn->query("SET FOREIGN_KEY_CHECKS = 1");
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Item prepare failed: ' . $conn->error]);
        exit;
    }

    foreach ($services as $svc) {
        $type  = $svc['type']  ?? 'service';
        $name  = $svc['name']  ?? '';
        $qty   = (int)($svc['qty']    ?? 1);
        $price = (float)($svc['price'] ?? 0);

        if (isset($svc['commissionRM'])) {
            $comm = (float)$svc['commissionRM'];
            $stmtC->bind_param('sssidd', $id, $type, $name, $qty, $price, $comm);
            $itemOk = $stmtC->execute();
        } else {
            $stmtN->bind_param('sssid', $id, $type, $name, $qty, $price);
            $itemOk = $stmtN->execute();
        }
        if (!$itemOk) {
            $stmtC->close();
            $stmtN->close();
            $conn->query("SET FOREIGN_KEY_CHECKS = 1");
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Item insert failed: ' . $conn->error]);
            exit;
        }
    }
    $stmtC->close();
    $stmtN->close();

    $conn->query("SET FOREIGN_KEY_CHECKS = 1");

    echo json_encode(['ok' => true, 'id' => $id]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
