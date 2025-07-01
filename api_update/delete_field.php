<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    if (empty($data['id'])) {
        sendResponse(['error' => 'Field ID is required'], 400);
    }

    // Check if field exists
    $stmt = $pdo->prepare("SELECT id FROM fields WHERE id = ?");
    $stmt->execute([$data['id']]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Field not found'], 404);
    }

    // Check if field has associated students
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM students WHERE field = (SELECT name FROM fields WHERE id = ?)");
    $stmt->execute([$data['id']]);
    $result = $stmt->fetch();
    
    if ($result['count'] > 0) {
        sendResponse(['error' => 'Cannot delete field with associated students'], 400);
    }

    // Delete field
    $stmt = $pdo->prepare("DELETE FROM fields WHERE id = ?");
    $stmt->execute([$data['id']]);
    
    sendResponse([
        'success' => true,
        'message' => 'Field deleted successfully'
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to delete field: ' . $e->getMessage()], 500);
}
?>