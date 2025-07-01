<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    if (empty($data['id'])) {
        sendResponse(['error' => 'Entry ID is required'], 400);
    }

    // Check if entry exists and get course_id
    $stmt = $pdo->prepare("SELECT course_id FROM timetable WHERE id = ?");
    $stmt->execute([$data['id']]);
    $entry = $stmt->fetch();
    
    if (!$entry) {
        sendResponse(['error' => 'Timetable entry not found'], 404);
    }

    // Delete timetable entry
    $stmt = $pdo->prepare("DELETE FROM timetable WHERE id = ?");
    $stmt->execute([$data['id']]);
    
    // Check if course is used in other timetable entries
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM timetable WHERE course_id = ?");
    $stmt->execute([$entry['course_id']]);
    $result = $stmt->fetch();
    
    // If course is not used elsewhere, delete it
    if ($result['count'] == 0) {
        $stmt = $pdo->prepare("DELETE FROM courses WHERE id = ?");
        $stmt->execute([$entry['course_id']]);
    }
    
    sendResponse([
        'success' => true,
        'message' => 'Timetable entry deleted successfully'
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to delete timetable entry: ' . $e->getMessage()], 500);
}
?>