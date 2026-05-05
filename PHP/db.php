<?php
$host     = getenv('PGHOST');
$port     = getenv('PGPORT') ?: '5432';
$dbname   = getenv('PGDATABASE');
$username = getenv('PGUSER');
$password = getenv('PGPASSWORD');

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Koneksi database gagal: ' . $e->getMessage()]);
    exit;
}
?>
