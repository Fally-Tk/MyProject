<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    // Validate required fields
    $required = ['id', 'day', 'timeSlot', 'course', 'field', 'level', 'room', 'lecturer'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendResponse(['error' => "Field '$field' is required"], 400);
        }
    }

    // Check if entry exists
    $stmt = $pdo->prepare("SELECT course_id FROM timetable WHERE id = ?");
    $stmt->execute([$data['id']]);
    $entry = $stmt->fetch();
    
    if (!$entry) {
        sendResponse(['error' => 'Timetable entry not found'], 404);
    }

    // Check for room conflicts (excluding current entry)
    $stmt = $pdo->prepare("
        SELECT t.id, c.title, t.field 
        FROM timetable t
        JOIN courses c ON t.course_id = c.id
        WHERE t.day = ? AND t.time_slot = ? AND t.room = ? AND t.id != ?
    ");
    $stmt->execute([$data['day'], $data['timeSlot'], $data['room'], $data['id']]);
    $roomConflict = $stmt->fetch();
    
    if ($roomConflict) {
        sendResponse(['error' => "Room conflict: {$data['room']} is already occupied by {$roomConflict['title']} ({$roomConflict['field']})"], 400);
    }

    // Update course information
    $stmt = $pdo->prepare("
        UPDATE courses 
        SET title = ?, field = ?, level = ?, lecturer = ?
        WHERE id = ?
    ");
    $stmt->execute([
        $data['course'],
        $data['field'],
        $data['level'],
        $data['lecturer'],
        $entry['course_id']
    ]);

    // Update timetable entry
    $stmt = $pdo->prepare("
        UPDATE timetable 
        SET day = ?, time_slot = ?, room = ?, field = ?, level = ?
        WHERE id = ?
    ");
    
    $stmt->execute([
        $data['day'],
        $data['timeSlot'],
        $data['room'],
        $data['field'],
        $data['level'],
        $data['id']
    ]);
    
    sendResponse([
        'success' => true,
        'message' => 'Timetable entry updated successfully'
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to update timetable entry: ' . $e->getMessage()], 500);
}
?>