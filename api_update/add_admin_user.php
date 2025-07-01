<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    // Validate required fields
    $required = ['name', 'email', 'password', 'department', 'employee_id'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendResponse(['error' => "Field '$field' is required"], 400);
        }
    }

    // Check if email or employee_id already exists
    $stmt = $pdo->prepare("SELECT id FROM admin_users WHERE email = ? OR employee_id = ?");
    $stmt->execute([$data['email'], $data['employee_id']]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'An admin with this email or employee ID already exists'], 400);
    }

    // Hash password
    $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);

    // Insert admin user
    $stmt = $pdo->prepare("
        INSERT INTO admin_users (name, email, phone, department, role, employee_id, password_hash) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['name'],
        $data['email'],
        $data['phone'] ?? null,
        $data['department'],
        $data['role'] ?? 'Discipline Master',
        $data['employee_id'],
        $passwordHash
    ]);

    $adminId = $pdo->lastInsertId();
    
    sendResponse([
        'success' => true,
        'message' => 'Admin user added successfully',
        'id' => $adminId
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to add admin user: ' . $e->getMessage()], 500);
}
?>