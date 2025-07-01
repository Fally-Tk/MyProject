<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    // Validate required fields
    $required = ['name', 'matricule', 'field', 'level', 'parentName', 'parentPhone'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendResponse(['error' => "Field '$field' is required"], 400);
        }
    }

    // Check if matricule already exists
    $stmt = $pdo->prepare("SELECT id FROM students WHERE matricule = ?");
    $stmt->execute([$data['matricule']]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'A student with this matricule already exists'], 400);
    }

    // Insert student
    $stmt = $pdo->prepare("
        INSERT INTO students (
            name, matricule, field, level, parent_name, parent_phone, parent_email, photo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['name'],
        $data['matricule'],
        $data['field'],
        $data['level'],
        $data['parentName'],
        $data['parentPhone'],
        $data['parentEmail'] ?? null,
        $data['photo'] ?? null
    ]);

    $studentId = $pdo->lastInsertId();
    
    sendResponse([
        'success' => true,
        'message' => 'Student added successfully',
        'id' => $studentId
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to add student: ' . $e->getMessage()], 500);
}
?>