<?php
// ============================================================
// HAB Barbershop POS — Shifts API
// GET   /api/shifts.php?branch_id=1&date=2026-07-05
// POST  /api/shifts.php   { branch_id, open_by, open_float }
// PATCH /api/shifts.php   { id, close_float, close_note }
// ============================================================
require '../config.php';

header('Content-Type: application/json; charset=utf-8');

$token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
if (!defined('API_TOKEN') || $token !== API_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: fetch today's shift ──────────────────────────────────
if ($method === 'GET') {
    $branchId = (int)($_GET['branch_id'] ?? 1);
    $date     = preg_replace('/[^0-9\-]/', '', $_GET['date'] ?? date('Y-m-d'));

    $stmt = $conn->prepare(
        "SELECT id, branch_id,
                DATE_FORMAT(date,'%Y-%m-%d')    AS date,
                TIME_FORMAT(open_time,'%H:%i')  AS open_time,
                open_by, open_float,
                TIME_FORMAT(close_time,'%H:%i') AS close_time,
                close_float, close_note, status
         FROM shifts WHERE branch_id = ? AND date = ?"
    );
    if (!$stmt) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db_error']); exit; }
    $stmt->bind_param('is', $branchId, $date);
    $stmt->execute();
    $shift = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Auto-close stale open shift from a past date
    if ($shift && $shift['date'] < date('Y-m-d') && $shift['status'] === 'open') {
        $staleId = (int)$shift['id'];
        $upd = $conn->prepare(
            "UPDATE shifts SET status='closed', close_time=NOW(), close_note='Auto-closed'
             WHERE id = ?"
        );
        if (!$upd) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db_error']); exit; }
        $upd->bind_param('i', $staleId);
        $upd->execute();
        $upd->close();
        $shift = null;
    }

    echo json_encode(['shift' => $shift]);
    exit;
}

// ── POST: open a new shift ────────────────────────────────────
if ($method === 'POST') {
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $branchId  = (int)($body['branch_id']  ?? 1);
    $openBy    = substr($body['open_by']   ?? 'staff', 0, 20);
    $openFloat = (float)($body['open_float'] ?? 0);

    $stmt = $conn->prepare(
        "INSERT INTO shifts (branch_id, date, open_time, open_by, open_float)
         VALUES (?, CURDATE(), NOW(), ?, ?)"
    );
    if (!$stmt) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db_error']); exit; }
    $stmt->bind_param('isd', $branchId, $openBy, $openFloat);
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) {
        if ($conn->errno === 1062) {
            // Shift already exists — return it so client can hydrate
            $sel = $conn->prepare(
                "SELECT id, branch_id,
                        DATE_FORMAT(date,'%Y-%m-%d')    AS date,
                        TIME_FORMAT(open_time,'%H:%i')  AS open_time,
                        open_by, open_float,
                        TIME_FORMAT(close_time,'%H:%i') AS close_time,
                        close_float, close_note, status
                 FROM shifts WHERE branch_id = ? AND date = CURDATE()"
            );
            if (!$sel) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db_error']); exit; }
            $sel->bind_param('i', $branchId);
            $sel->execute();
            $existing = $sel->get_result()->fetch_assoc();
            $sel->close();
            echo json_encode(['ok' => false, 'error' => 'shift_exists', 'shift' => $existing]);
        } else {
            echo json_encode(['ok' => false, 'error' => $conn->error]);
        }
        exit;
    }

    $newId = $conn->insert_id;
    $sel = $conn->prepare(
        "SELECT id, branch_id,
                DATE_FORMAT(date,'%Y-%m-%d')    AS date,
                TIME_FORMAT(open_time,'%H:%i')  AS open_time,
                open_by, open_float,
                TIME_FORMAT(close_time,'%H:%i') AS close_time,
                close_float, close_note, status
         FROM shifts WHERE id = ?"
    );
    if (!$sel) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db_error']); exit; }
    $sel->bind_param('i', $newId);
    $sel->execute();
    $newShift = $sel->get_result()->fetch_assoc();
    $sel->close();

    echo json_encode(['ok' => true, 'shift' => $newShift]);
    exit;
}

// ── PATCH: close a shift ──────────────────────────────────────
if ($method === 'PATCH') {
    $body       = json_decode(file_get_contents('php://input'), true) ?? [];
    $id         = (int)($body['id'] ?? 0);
    $closeFloat = isset($body['close_float']) ? (float)$body['close_float'] : null;
    $closeNote  = substr($body['close_note'] ?? '', 0, 255);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing id']);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE shifts SET status='closed', close_time=NOW(),
         close_float=?, close_note=? WHERE id=?"
    );
    if (!$stmt) { http_response_code(500); echo json_encode(['ok'=>false,'error'=>'db_error']); exit; }
    $stmt->bind_param('dsi', $closeFloat, $closeNote, $id);
    $ok       = $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    echo json_encode(['ok' => $ok && $affected > 0]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
