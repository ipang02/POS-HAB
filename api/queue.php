<?php
require '../config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: public queue fetch ──────────────────────────────────
if ($method === 'GET') {
    $branchId = intval($_GET['branch_id'] ?? 1);
    $date     = $_GET['date'] ?? date('Y-m-d');

    $stmt = $conn->prepare(
        "SELECT id, name, phone, party_size, status, joined_at
         FROM `queue`
         WHERE branch_id = ? AND session_date = ? AND status != 'done'
         ORDER BY joined_at ASC"
    );
    if (!$stmt) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'db_error']); exit; }
    $stmt->bind_param('is', $branchId, $date);
    $stmt->execute();
    $result  = $stmt->get_result();
    $entries = [];
    while ($row = $result->fetch_assoc()) {
        $entries[] = $row;
    }
    echo json_encode(['ok' => true, 'entries' => $entries]);
    exit;
}

// ── POST: public join queue ──────────────────────────────────
if ($method === 'POST') {
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $branchId  = intval($body['branch_id'] ?? 1);
    $name      = trim($body['name'] ?? '');
    $phone     = trim($body['phone'] ?? '');
    $partySize = max(1, intval($body['party_size'] ?? 1));
    $date      = date('Y-m-d');

    if (!$name || !$phone) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'missing_fields']);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO `queue` (branch_id, session_date, name, phone, party_size) VALUES (?, ?, ?, ?, ?)"
    );
    if (!$stmt) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'db_error']); exit; }
    $stmt->bind_param('isssi', $branchId, $date, $name, $phone, $partySize);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'insert_failed']);
        exit;
    }
    $newId = $stmt->insert_id;

    $stmt2 = $conn->prepare(
        "SELECT id, name, phone, party_size, status, joined_at FROM `queue` WHERE id = ?"
    );
    if (!$stmt2) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'db_error']); exit; }
    $stmt2->bind_param('i', $newId);
    $stmt2->execute();
    $entry = $stmt2->get_result()->fetch_assoc();

    echo json_encode(['ok' => true, 'entry' => $entry]);
    exit;
}

// ── PATCH: authenticated status update ──────────────────────
if ($method === 'PATCH') {
    $token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
    if ($token !== API_TOKEN) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'unauthorized']);
        exit;
    }

    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $id     = intval($body['id'] ?? 0);
    $status = $body['status'] ?? '';

    if (!$id || !in_array($status, ['serving', 'done'], true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'invalid']);
        exit;
    }

    $tsField = $status === 'serving' ? 'served_at' : 'done_at';
    $stmt = $conn->prepare("UPDATE `queue` SET status = ?, `{$tsField}` = NOW() WHERE id = ?");
    if (!$stmt) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'db_error']); exit; }
    $stmt->bind_param('si', $status, $id);
    $stmt->execute();

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
