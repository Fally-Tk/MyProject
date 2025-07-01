<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $sql = "
        SELECT 
            a.id,
            s.name AS studentName,
            s.matricule,
            s.field AS fieldName,
            s.level,
            sess.id AS sessionId,
            c.title AS courseTitle,
            c.code AS courseCode,
            s.parent_name AS parentName,
            s.parent_phone AS parentPhone,
            s.parent_email AS parentEmail,
            a.timestamp AS date
        FROM attendance a
        INNER JOIN students s ON a.student_id = s.id
        INNER JOIN sessions sess ON a.session_id = sess.id
        INNER JOIN courses c ON sess.course_id = c.id
        WHERE a.is_present = 0
        ORDER BY a.timestamp DESC
    ";

    $stmt = $pdo->query($sql);
    $absentees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ✅ Return only the array, not wrapped in extra keys
    echo json_encode($absentees); // This ensures it's a plain array

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to fetch absentee report: ' . $e->getMessage()], 500);
}
?>