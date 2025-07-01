<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(array('error' => 'Method not allowed'), 405);
}

try {
    $data = getJsonInput();

    // Validate required fields
    $required = array('id', 'name', 'code');
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            sendResponse(array('error' => "Field '$field' is required"), 400);
        }
    }

    // Check if field exists
    $stmt = $pdo->prepare("SELECT id FROM fields WHERE id = ?");
    $stmt->execute(array($data['id']));
    if (!$stmt->fetch()) {
        sendResponse(array('error' => 'Field not found'), 404);
    }

    // Check if name or code already exists for other fields
    $stmt = $pdo->prepare("SELECT id FROM fields WHERE (name = ? OR code = ?) AND id != ?");
    $stmt->execute(array($data['name'], $data['code'], $data['id']));
    if ($stmt->fetch()) {
        sendResponse(array('error' => 'A field with this name or code already exists'), 400);
    }

    // Update field
    $description = isset($data['description']) ? $data['description'] : null;

    $stmt = $pdo->prepare("
        UPDATE fields 
        SET name = ?, code = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");
    
    $stmt->execute(array(
        $data['name'],
        $data['code'],
        $description,
        $data['id']
    ));
    
    sendResponse(array(
        'success' => true,
        'message' => 'Field updated successfully'
    ));

} catch (Exception $e) {
    sendResponse(array('error' => 'Failed to update field: ' . $e->getMessage()), 500);
}
?>
