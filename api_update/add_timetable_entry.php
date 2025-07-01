<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    // Validate required fields
    $required = ['day', 'timeSlot', 'course', 'field', 'level', 'room', 'lecturer'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            sendResponse(['error' => "Field '$field' is required"], 400);
        }
    }

    // Check for room conflicts
    $stmt = $pdo->prepare("
        SELECT t.id, c.title, t.field 
        FROM timetable t
        JOIN courses c ON t.course_id = c.id
        WHERE t.day = ? AND t.time_slot = ? AND t.room = ?
    ");
    $stmt->execute([$data['day'], $data['timeSlot'], $data['room']]);
    $roomConflict = $stmt->fetch();
    
    if ($roomConflict) {
        sendResponse(['error' => "Room conflict: {$data['room']} is already occupied by {$roomConflict['title']} ({$roomConflict['field']})"], 400);
    }

    // Check for field conflicts (unless it's the same course)
    $stmt = $pdo->prepare("
        SELECT t.id, c.title 
        FROM timetable t
        JOIN courses c ON t.course_id = c.id
        WHERE t.day = ? AND t.time_slot = ? AND t.field = ? AND c.title != ?
    ");
    $stmt->execute([$data['day'], $data['timeSlot'], $data['field'], $data['course']]);
    $fieldConflict = $stmt->fetch();
    
    if ($fieldConflict) {
        sendResponse(['error' => "Field conflict: {$data['field']} already has a different class ({$fieldConflict['title']}) at this time"], 400);
    }

    // First, create or get the course
    $stmt = $pdo->prepare("SELECT id FROM courses WHERE title = ? AND field = ? AND level = ?");
    $stmt->execute([$data['course'], $data['field'], $data['level']]);
    $course = $stmt->fetch();
    
    if (!$course) {
        // Create new course
        $stmt = $pdo->prepare("
            INSERT INTO courses (title, code, field, level, lecturer) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $courseCode = strtoupper(substr($data['field'], 0, 3)) . substr($data['level'], -3);
        $stmt->execute([
            $data['course'],
            $courseCode,
            $data['field'],
            $data['level'],
            $data['lecturer']
        ]);
        $courseId = $pdo->lastInsertId();
    } else {
        $courseId = $course['id'];
    }

    // Insert timetable entry
    $stmt = $pdo->prepare("
        INSERT INTO timetable (day, time_slot, course_id, room, field, level)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['day'],
        $data['timeSlot'],
        $courseId,
        $data['room'],
        $data['field'],
        $data['level']
    ]);

    $entryId = $pdo->lastInsertId();
    
    sendResponse([
        'success' => true,
        'message' => 'Timetable entry added successfully',
        'id' => $entryId
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to add timetable entry: ' . $e->getMessage()], 500);
}
?>