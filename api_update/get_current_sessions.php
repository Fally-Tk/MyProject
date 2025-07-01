<?php
require_once 'config.php';

try {
    $currentDay = date('l'); // Get current day name (Monday, Tuesday, etc.)
    $currentTime = date('H:i');
    
    // Get current sessions based on timetable
    $stmt = $pdo->prepare("
        SELECT 
            CONCAT(t.id, '-', DATE_FORMAT(NOW(), '%Y%m%d')) as id,
            c.title as courseTitle,
            c.code as courseCode,
            t.field as fieldName,
            t.level,
            t.room,
            t.time_slot as timeSlot,
            SUBSTRING_INDEX(t.time_slot, ' - ', 1) as startTime,
            SUBSTRING_INDEX(t.time_slot, ' - ', -1) as endTime,
            t.day,
            c.lecturer
        FROM timetable t
        JOIN courses c ON t.course_id = c.id
        WHERE t.day = ? 
        AND TIME(?) BETWEEN 
            TIME(SUBSTRING_INDEX(t.time_slot, ' - ', 1)) 
            AND TIME(SUBSTRING_INDEX(t.time_slot, ' - ', -1))
        ORDER BY t.time_slot, t.field
    ");
    
    $stmt->execute([$currentDay, $currentTime]);
    $sessions = $stmt->fetchAll();
    
    // For each session, get the students
    foreach ($sessions as &$session) {
        // Handle multiple fields for common courses
        $fields = explode(',', $session['fieldName']);
        $allStudents = [];
        
        foreach ($fields as $field) {
            $field = trim($field);
            $studentStmt = $pdo->prepare("
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
                WHERE field = ? AND level = ?
                ORDER BY name ASC
            ");
            
            $studentStmt->execute([$field, $session['level']]);
            $fieldStudents = $studentStmt->fetchAll();
            
            $allStudents = array_merge($allStudents, $fieldStudents);
        }
        
        $session['students'] = $allStudents;
    }
    
    sendResponse($sessions);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to fetch current sessions: ' . $e->getMessage()], 500);
}
?>