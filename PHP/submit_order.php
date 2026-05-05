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

$data = json_decode(file_get_contents('php://input'), true);

if (!$data) {
    $data = $_POST;
}

$nama    = trim($data['nama'] ?? '');
$wa      = trim($data['whatsapp'] ?? '');
$tanggal = trim($data['tanggal'] ?? '');
$lokasi  = trim($data['lokasi'] ?? '');
$paket   = trim($data['paket'] ?? '');
$catatan = trim($data['catatan'] ?? '');

if (!$nama || !$wa || !$tanggal || !$lokasi || !$paket) {
    echo json_encode(['success' => false, 'message' => 'Semua field wajib diisi']);
    exit;
}

$validPaket = ['silver', 'gold', 'premium'];
if (!in_array(strtolower($paket), $validPaket)) {
    echo json_encode(['success' => false, 'message' => 'Paket tidak valid']);
    exit;
}

try {
    $stmt = $pdo->prepare("INSERT INTO orders (nama, whatsapp, tanggal, lokasi, paket, catatan) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nama, $wa, $tanggal, $lokasi, strtolower($paket), $catatan]);
    $orderId = $pdo->lastInsertId();

    echo json_encode([
        'success'  => true,
        'message'  => 'Pesanan berhasil disimpan!',
        'order_id' => $orderId
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Gagal menyimpan: ' . $e->getMessage()]);
}
?>