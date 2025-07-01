<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(array('error' => 'Method not allowed'), 405);
}

try {
    $data = getJsonInput();

    // Validate required fields
    $required = array('id', 'name', 'matricule', 'field', 'level', 'parentName', 'parentPhone');
    foreach ($required as $field) {
        if (!isset($data[$field]) || trim($data[$field]) === '') {
            sendResponse(array('error' => "Field '$field' is required"), 400);
        }
    }

    // Check if student exists
    $stmt = $pdo->prepare("SELECT id FROM students WHERE id = ?");
    $stmt->execute(array($data['id']));
    if (!$stmt->fetch()) {
        sendResponse(array('error' => 'Student not found'), 404);
    }

    // Check for duplicate matricule
    $stmt = $pdo->prepare("SELECT id FROM students WHERE matricule = ? AND id != ?");
    $stmt->execute(array($data['matricule'], $data['id']));
    if ($stmt->fetch()) {
        sendResponse(array('error' => 'Another student already uses this matricule'), 400);
    }

    // Update student
    $stmt = $pdo->prepare("
        UPDATE students SET
            name = ?,
            matricule = ?,
            field = ?,
            level = ?,
            parent_name = ?,
            parent_phone = ?,
            parent_email = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ");

    $stmt->execute(array(
        $data['name'],
        $data['matricule'],
        $data['field'],
        $data['level'],
        $data['parentName'],
        $data['parentPhone'],
        isset($data['parent_email']) ? $data['parent_email'] : null,
        $data['id']
    ));

    sendResponse(array('success' => true, 'message' => 'Student updated successfully'));

} catch (Exception $e) {
    sendResponse(array('error' => 'Failed to update student: ' . $e->getMessage()), 500);
}
?>
