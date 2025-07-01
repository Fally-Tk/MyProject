<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

$data = getJsonInput();

if (empty($data['id'])) {
    sendResponse(['error' => 'Student ID is required'], 400);
}

try {
    $stmt = $pdo->prepare("DELETE FROM students WHERE id = :id");
    $stmt->execute([':id' => $data['id']]);

    sendResponse(['success' => true, 'message' => 'Student deleted successfully']);
} catch (PDOException $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
?>
