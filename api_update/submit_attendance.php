<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(['error' => 'Method not allowed'], 405);
}

try {
    $data = getJsonInput();
    
    // Validate required fields
    $required = ['session_id', 'student_id', 'is_present', 'timestamp'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            sendResponse(['error' => "Field '$field' is required"], 400);
        }
    }

    // Check if attendance record already exists for this session and student
    $stmt = $pdo->prepare("
        SELECT id FROM attendance 
        WHERE session_id = ? AND student_id = ? AND DATE(timestamp) = DATE(?)
    ");
    $stmt->execute([$data['session_id'], $data['student_id'], $data['timestamp']]);
    
    if ($stmt->fetch()) {
        // Update existing record
        $stmt = $pdo->prepare("
            UPDATE attendance 
            SET is_present = ?, timestamp = ? 
            WHERE session_id = ? AND student_id = ? AND DATE(timestamp) = DATE(?)
        ");
        $stmt->execute([
            $data['is_present'],
            $data['timestamp'],
            $data['session_id'],
            $data['student_id'],
            $data['timestamp']
        ]);
    } else {
        // Insert new record
        $stmt = $pdo->prepare("
            INSERT INTO attendance (session_id, student_id, is_present, timestamp)
            VALUES (?, ?, ?, ?)
        ");
        $stmt->execute([
            $data['session_id'],
            $data['student_id'],
            $data['is_present'],
            $data['timestamp']
        ]);
    }

    sendResponse([
        'success' => true,
        'message' => 'Attendance recorded successfully'
    ]);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to submit attendance: ' . $e->getMessage()], 500);
}
?>