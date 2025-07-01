<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $stmt = $pdo->query("
        SELECT 
            id,
            name,
            email,
            phone,
            department,
            role,
            employee_id,
            created_at
        FROM admin_users 
        ORDER BY name ASC
    ");
    
    $admins = $stmt->fetchAll();
    sendResponse($admins);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to fetch admin users: ' . $e->getMessage()], 500);
}
?>