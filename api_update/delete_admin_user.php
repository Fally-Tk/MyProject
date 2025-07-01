<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    if (empty($data['id'])) {
        sendResponse(['error' => 'Admin ID is required'], 400);
    }

    // Check if admin exists
    $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE id = ?");
    $stmt->execute([$data['id']]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Admin user not found'], 404);
    }

    // Prevent deletion if it's the last admin
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM admin_users");
    $result = $stmt->fetch();
    
    if ($result['count'] <= 1) {
        sendResponse(['error' => 'Cannot delete the last admin user'], 400);
    }

    // Delete admin user
    $stmt = $pdo->prepare("DELETE FROM admin_users WHERE id = ?");
    $stmt->execute([$data['id']]);
    
    sendResponse([
        'success' => true,
        'message' => 'Admin user deleted successfully'
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to delete admin user: ' . $e->getMessage()], 500);
}
?>