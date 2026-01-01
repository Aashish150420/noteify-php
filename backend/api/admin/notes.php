<?php
// Admin API for managing notes
// GET: Fetch all notes with user information
// DELETE: Delete a note by ID

header('Content-Type: application/json');
// Database connection
include('../../../config/db.php');

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all notes
if ($method === 'GET') {
    // Fetch all notes with user information
    // Get the actual user's fullname or username, not admin
    $sql = "SELECT n.*, 
                   u.fullname as author_name,
                   u.username as author_username,
                   u.email as author_email,
                   n.uploaded_by
            FROM notes n 
            LEFT JOIN users u ON n.uploaded_by = u.id 
            ORDER BY n.created_at DESC";
    
    $result = mysqli_query($conn, $sql);
    $notes = [];
    
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $notes[] = $row;
        }
    }
    
    echo json_encode($notes);
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

