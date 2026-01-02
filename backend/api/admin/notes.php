<?php
// Admin API for managing notes
// GET: Fetch all notes with user information
// PUT: Approve/Reject note
// DELETE: Delete a note by ID

header('Content-Type: application/json');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database connection
include('../../../config/db.php');

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all notes
if ($method === 'GET') {
    try {
        // Check if status column exists, if not, add it
        $checkColumn = @mysqli_query($conn, "SHOW COLUMNS FROM notes LIKE 'status'");
        if (!$checkColumn || mysqli_num_rows($checkColumn) == 0) {
            @mysqli_query($conn, "ALTER TABLE notes ADD COLUMN status VARCHAR(20) DEFAULT 'approved'");
        }
    } catch (Exception $e) {
        // If column check fails, try to add it anyway
        @mysqli_query($conn, "ALTER TABLE notes ADD COLUMN status VARCHAR(20) DEFAULT 'approved'");
    }
    
    // Fetch all notes with user information
    // Get the actual user's fullname or username, not admin
    $sql = "SELECT n.*, 
                   u.fullname as author_name,
                   u.username as author_username,
                   u.email as author_email,
                   n.uploaded_by,
                   COALESCE(n.status, 'approved') as status
            FROM notes n 
            LEFT JOIN users u ON n.uploaded_by = u.id 
            ORDER BY n.created_at DESC";
    
    $result = @mysqli_query($conn, $sql);
    $notes = [];
    
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            // Ensure status is set
            if (!isset($row['status']) || $row['status'] === null || $row['status'] === '') {
                $row['status'] = 'approved';
            }
            $notes[] = $row;
        }
    } else {
        // If query failed, return error as JSON
        $error = mysqli_error($conn);
        echo json_encode(["error" => "Database query failed: " . $error]);
        mysqli_close($conn);
        exit;
    }
    
    echo json_encode($notes);
    mysqli_close($conn);
    exit;
}

// PUT - Approve/Reject note
if ($method === 'PUT') {
    // Check if admin
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(["error" => "Unauthorized"]);
        mysqli_close($conn);
        exit;
    }
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $note_id = intval($data['note_id'] ?? 0);
    $action = $data['action'] ?? '';
    
    if ($note_id <= 0 || !in_array($action, ['approve', 'reject'])) {
        echo json_encode(["error" => "Invalid request"]);
        mysqli_close($conn);
        exit;
    }
    
    // Check if status column exists, if not, add it
    $checkColumn = mysqli_query($conn, "SHOW COLUMNS FROM notes LIKE 'status'");
    if (mysqli_num_rows($checkColumn) == 0) {
        mysqli_query($conn, "ALTER TABLE notes ADD COLUMN status VARCHAR(20) DEFAULT 'approved'");
    }
    
    $status = $action === 'approve' ? 'approved' : 'rejected';
    $statusEscaped = mysqli_real_escape_string($conn, $status);
    $updateSql = "UPDATE notes SET status = '$statusEscaped' WHERE note_id = $note_id";
    
    if (mysqli_query($conn, $updateSql)) {
        echo json_encode([
            "success" => true,
            "message" => "Note " . $action . "d successfully"
        ]);
    } else {
        echo json_encode([
            "error" => "Failed to update note: " . mysqli_error($conn)
        ]);
    }
    
    mysqli_close($conn);
    exit;
}

// DELETE - Delete a note
if ($method === 'DELETE') {
    // Get note ID from query string or request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $note_id = isset($data['note_id']) ? intval($data['note_id']) : (isset($_GET['note_id']) ? intval($_GET['note_id']) : 0);
    
    if ($note_id <= 0) {
        echo json_encode(["error" => "Invalid note ID"]);
        mysqli_close($conn);
        exit;
    }
    
    // First, get the file path to delete the physical file
    $getNote = mysqli_query($conn, "SELECT file_path FROM notes WHERE note_id = $note_id");
    
    if (mysqli_num_rows($getNote) > 0) {
        $note = mysqli_fetch_assoc($getNote);
        $file_path = $note['file_path'];
        
        // Delete the note from database
        $deleteSql = "DELETE FROM notes WHERE note_id = $note_id";
        
        if (mysqli_query($conn, $deleteSql)) {
            // Delete the physical file if it exists
            $full_path = "../../../" . $file_path;
            if (file_exists($full_path)) {
                unlink($full_path);
            }
            
            echo json_encode([
                "success" => true,
                "message" => "Note deleted successfully"
            ]);
        } else {
            echo json_encode([
                "error" => "Failed to delete note: " . mysqli_error($conn)
            ]);
        }
    } else {
        echo json_encode(["error" => "Note not found"]);
    }
    
    mysqli_close($conn);
    exit;
}

// Method not allowed
echo json_encode(["error" => "Method not allowed"]);
mysqli_close($conn);
?>

