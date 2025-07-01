<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    if (empty($data['email']) || empty($data['password'])) {
        sendResponse(['error' => 'Email and password are required'], 400);
    }

    // Get admin user by email
    $stmt = $pdo->prepare("
        SELECT id, name, email, phone, department, role, employee_id, password_hash
        FROM admin_users 
        WHERE email = ?
    ");
    $stmt->execute([$data['email']]);
    $admin = $stmt->fetch();

    if (!$admin || !password_verify($data['password'], $admin['password_hash'])) {
        sendResponse(['error' => 'Invalid email or password'], 401);
    }

    // Remove password hash from response
    unset($admin['password_hash']);

    // Generate a simple token (in production, use JWT or similar)
    $token = bin2hex(random_bytes(32));
    
    sendResponse([
        'success' => true,
        'message' => 'Authentication successful',
        'user' => $admin,
        'token' => $token
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Authentication failed: ' . $e->getMessage()], 500);
}
?>