<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

require_once 'db.php';

$data   = json_decode(file_get_contents('php://input'), true);
$id     = intval($data['id'] ?? 0);
$status = trim($data['status'] ?? '');

$validStatus = ['pending', 'confirmed', 'done'];
if (!$id || !in_array($status, $validStatus)) {
    echo json_encode(['success' => false, 'message' => 'Data tidak valid']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    echo json_encode(['success' => true, 'message' => 'Status berhasil diupdate']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal update: ' . $e->getMessage()]);
}
?>
