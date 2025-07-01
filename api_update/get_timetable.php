<?php
require_once 'config.php';

try {
    $stmt = $pdo->prepare("
        SELECT 
            t.id,
            t.day,
            t.time_slot as timeSlot,
            c.title as course,
            t.field,
            t.level,
            t.room,
            c.lecturer
        FROM timetable t
        JOIN courses c ON t.course_id = c.id
        ORDER BY 
            FIELD(t.day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'),
            t.time_slot,
            t.field
    ");
    
    $stmt->execute();
    $timetable = $stmt->fetchAll();
    
    sendResponse($timetable);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to fetch timetable: ' . $e->getMessage()], 500);
}
?>