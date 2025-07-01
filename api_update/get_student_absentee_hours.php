<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    // Get all absentee records with detailed information
    $sql = "
        SELECT 
            a.id,
            s.id as studentId,
            s.name AS studentName,
            s.matricule,
            s.field AS fieldName,
            s.level,
            sess.id AS sessionId,
            c.title AS courseTitle,
            c.code AS courseCode,
            t.time_slot AS timeSlot,
            a.timestamp AS date
        FROM attendance a
        INNER JOIN students s ON a.student_id = s.id
        INNER JOIN sessions sess ON a.session_id = sess.id
        INNER JOIN courses c ON sess.course_id = c.id
        LEFT JOIN timetable t ON c.id = t.course_id AND t.day = DAYNAME(sess.date)
        WHERE a.is_present = 0
        ORDER BY a.timestamp DESC, s.name ASC
    ";

    $stmt = $pdo->query($sql);
    $absenteeData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Return the raw data - processing will be done on the frontend
    echo json_encode($absenteeData);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to fetch student absentee hours: ' . $e->getMessage()], 500);
}
?>