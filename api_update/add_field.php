<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    // Validate required fields
    $required = ['name', 'code'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendResponse(['error' => "Field '$field' is required"], 400);
        }
    }

    // Check if field name or code already exists
    $stmt = $pdo->prepare("SELECT id FROM fields WHERE name = ? OR code = ?");
    $stmt->execute([$data['name'], $data['code']]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'A field with this name or code already exists'], 400);
    }

    // Insert field
    $stmt = $pdo->prepare("
        INSERT INTO fields (name, code, description) 
        VALUES (?, ?, ?)
    ");
    
    $stmt->execute([
        $data['name'],
        $data['code'],
        $data['description'] ?? null
    ]);

    $fieldId = $pdo->lastInsertId();
    
    sendResponse([
        'success' => true,
        'message' => 'Field added successfully',
        'id' => $fieldId
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to add field: ' . $e->getMessage()], 500);
}
?>