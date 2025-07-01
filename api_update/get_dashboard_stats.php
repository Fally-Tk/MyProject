<?php
require_once 'config.php';
header('Content-Type: application/json');
try {
    // Get total students
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM students");
    $totalStudents = $stmt->fetch()['total'];

    // Get total fields
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM fields");
    $totalFields = $stmt->fetch()['total'];

    // Get today's absentees
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM attendance a 
        WHERE DATE(a.timestamp) = ? AND a.is_present = 0
    ");
    $stmt->execute([$today]);
    $todayAbsentees = $stmt->fetch()['total'];

    // Get weekly absentees (last 7 days)
    $weekAgo = date('Y-m-d', strtotime('-7 days'));
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM attendance a 
        WHERE DATE(a.timestamp) >= ? AND a.is_present = 0
    ");
    $stmt->execute([$weekAgo]);
    $weeklyAbsentees = $stmt->fetch()['total'];

    // Get monthly absentees (last 30 days)
    $monthAgo = date('Y-m-d', strtotime('-30 days'));
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as total 
        FROM attendance a 
        WHERE DATE(a.timestamp) >= ? AND a.is_present = 0
    ");
    $stmt->execute([$monthAgo]);
    $monthlyAbsentees = $stmt->fetch()['total'];

    // Get field statistics
    $stmt = $pdo->prepare("
        SELECT 
            f.id as fieldId,
            f.name as fieldName,
            COUNT(s.id) as totalStudents,
            COALESCE(present.count, 0) as presentToday,
            COALESCE(absent.count, 0) as absentToday,
            CASE 
                WHEN COUNT(s.id) > 0 
                THEN ROUND((COALESCE(present.count, 0) / COUNT(s.id)) * 100, 1)
                ELSE 0 
            END as attendanceRate
        FROM fields f
        LEFT JOIN students s ON f.name = s.field
        LEFT JOIN (
            SELECT s.field, COUNT(*) as count
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE DATE(a.timestamp) = ? AND a.is_present = 1
            GROUP BY s.field
        ) present ON f.name = present.field
        LEFT JOIN (
            SELECT s.field, COUNT(*) as count
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE DATE(a.timestamp) = ? AND a.is_present = 0
            GROUP BY s.field
        ) absent ON f.name = absent.field
        GROUP BY f.id, f.name
        ORDER BY attendanceRate DESC
    ");
    $stmt->execute([$today, $today]);
    $fieldStats = $stmt->fetchAll();

    // Get top absentee fields
    $stmt = $pdo->prepare("
        SELECT 
            s.field as fieldName,
            COUNT(*) as absenteeCount,
            (SELECT COUNT(*) FROM students WHERE field = s.field) as totalStudents,
            ROUND((COUNT(*) / (SELECT COUNT(*) FROM students WHERE field = s.field)) * 100, 1) as absenteeRate
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE DATE(a.timestamp) = ? AND a.is_present = 0
        GROUP BY s.field
        ORDER BY absenteeRate DESC
        LIMIT 3
    ");
    $stmt->execute([$today]);
    $topAbsenteeFields = $stmt->fetchAll();

    $response = [
        'totalStudents' => (int)$totalStudents,
        'totalFields' => (int)$totalFields,
        'todayAbsentees' => (int)$todayAbsentees,
        'weeklyAbsentees' => (int)$weeklyAbsentees,
        'monthlyAbsentees' => (int)$monthlyAbsentees,
        'fieldStats' => array_map(function($field) {
            return [
                'fieldId' => $field['fieldId'],
                'fieldName' => $field['fieldName'],
                'totalStudents' => (int)$field['totalStudents'],
                'presentToday' => (int)$field['presentToday'],
                'absentToday' => (int)$field['absentToday'],
                'attendanceRate' => (float)$field['attendanceRate']
            ];
        }, $fieldStats),
        'topAbsenteeFields' => array_map(function($field) {
            return [
                'fieldName' => $field['fieldName'],
                'absenteeCount' => (int)$field['absenteeCount'],
                'totalStudents' => (int)$field['totalStudents'],
                'absenteeRate' => (float)$field['absenteeRate']
            ];
        }, $topAbsenteeFields)
    ];

    sendResponse($response);

} catch (Exception $e) {
    sendResponse(['error' => 'Failed to fetch dashboard stats: ' . $e->getMessage()], 500);
}
?>