<?php
require_once 'config.php';

try {
    $stmt = $pdo->query("
        SELECT 
            id,
            name,
            code,
            (SELECT COUNT(*) FROM students WHERE field = fields.name) as totalStudents
        FROM fields 
        ORDER BY name ASC
    ");
    
    $fields = $stmt->fetchAll();
    
    // Add levels for each field
    foreach ($fields as &$field) {
        $field['levels'] = ['Level 100', 'Level 200'];
        $field['totalStudents'] = (int)$field['totalStudents'];
    }
    
    sendResponse($fields);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to fetch fields: ' . $e->getMessage()], 500);
}
?>