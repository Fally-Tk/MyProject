<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("
        SELECT 
            id,
            name,
            matricule,
            field,
            level,
            parent_phone as parentPhone,
            parent_name as parentName,
            parent_email as parentEmail,
            photo
        FROM students 
        ORDER BY name ASC
    ");
    
    $students = $stmt->fetchAll();
    sendResponse($students);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to fetch students: ' . $e->getMessage()], 500);
}
?>