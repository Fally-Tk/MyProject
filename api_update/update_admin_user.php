<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    // Validate required fields
    $required = ['id', 'name', 'email', 'department', 'employee_id'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendResponse(['error' => "Field '$field' is required"], 400);
        }
    }

    // Check if admin exists
    $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE id = ?");
    $stmt->execute([$data['id']]);
    if (!$stmt->fetch()) {
        sendResponse(['error' => 'Admin user not found'], 404);
    }

    // Check if email or employee_id already exists for other admins
    $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE (email = ? OR employee_id = ?) AND id != ?");
    $stmt->execute([$data['email'], $data['employee_id'], $data['id']]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'Another admin already uses this email or employee ID'], 400);
    }

    // Update admin user
    $updateFields = [
        'name = ?',
        'email = ?',
        'phone = ?',
        'department = ?',
        'role = ?',
        'employee_id = ?',
        'updated_at = CURRENT_TIMESTAMP'
    ];

    $params = [
        $data['name'],
        $data['email'],
        $data['phone'] ?? null,
        $data['department'],
        $data['role'] ?? 'Discipline Master',
        $data['employee_id']
    ];

    // Update password if provided
    if (!empty($data['password'])) {
        $updateFields[] = 'password_hash = ?';
        $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }

    $params[] = $data['id'];

    $stmt = $pdo->prepare("
        UPDATE admin_users 
        SET " . implode(', ', $updateFields) . "
        WHERE id = ?
    ");
    
    $stmt->execute($params);
    
    sendResponse([
        'success' => true,
        'message' => 'Admin user updated successfully'
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to update admin user: ' . $e->getMessage()], 500);
}
?>