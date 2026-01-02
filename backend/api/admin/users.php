<?php
// Admin API for managing users
// GET: Fetch all users
// PUT: Activate/Deactivate user
// DELETE: Delete user

header('Content-Type: application/json');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database connection
include('../../../config/db.php');

$method = $_SERVER['REQUEST_METHOD'];

// Check if admin - temporarily allow GET without admin check for debugging
// TODO: Re-enable admin check for GET requests
if ($method !== 'GET') {
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(["error" => "Unauthorized"]);
        if (isset($conn)) {
            mysqli_close($conn);
        }
        exit;
    }
}

// GET - Fetch all users
if ($method === 'GET') {
    try {
        // Check if status column exists, if not, add it
        $checkColumn = @mysqli_query($conn, "SHOW COLUMNS FROM users LIKE 'status'");
        $hasStatusColumn = $checkColumn && mysqli_num_rows($checkColumn) > 0;
        
        if (!$hasStatusColumn) {
            // Add status column if it doesn't exist
            @mysqli_query($conn, "ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
            $hasStatusColumn = true; // Assume it was added successfully
        }
    } catch (Exception $e) {
        // If column check fails, assume it doesn't exist and try to add it
        $hasStatusColumn = false;
        @mysqli_query($conn, "ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
    }
    
    // Build query based on whether status column exists
    // Note: users table doesn't have created_at, so we order by id DESC (newest first)
    if ($hasStatusColumn) {
        $sql = "SELECT id, fullname, email, username, role, profile_pic, 
                       COALESCE(status, 'active') as status,
                       (SELECT COUNT(*) FROM notes WHERE uploaded_by = users.id) as notes_count
                FROM users 
                ORDER BY id DESC";
    } else {
        $sql = "SELECT id, fullname, email, username, role, profile_pic, 
                       (SELECT COUNT(*) FROM notes WHERE uploaded_by = users.id) as notes_count
                FROM users 
                ORDER BY id DESC";
    }
    
    $result = @mysqli_query($conn, $sql);
    $users = [];
    
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            // Ensure status is set (default to active if not present)
            if (!isset($row['status']) || $row['status'] === null || $row['status'] === '') {
                $row['status'] = 'active';
            }
            $users[] = $row;
        }
    } else {
        // If query failed, return error as JSON
        $error = mysqli_error($conn);
        echo json_encode(["error" => "Database query failed: " . $error]);
        mysqli_close($conn);
        exit;
    }
    
    echo json_encode($users);
    mysqli_close($conn);
    exit;
}

// PUT - Activate/Deactivate user
if ($method === 'PUT') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $user_id = intval($data['user_id'] ?? 0);
    $action = $data['action'] ?? '';
    
    if ($user_id <= 0 || !in_array($action, ['activate', 'deactivate'])) {
        echo json_encode(["error" => "Invalid request"]);
        mysqli_close($conn);
        exit;
    }
    
    // Prevent deactivating yourself
    if ($user_id == $_SESSION['user_id']) {
        echo json_encode(["error" => "Cannot deactivate your own account"]);
        mysqli_close($conn);
        exit;
    }
    
    $status = $action === 'activate' ? 'active' : 'inactive';
    
    // Check if status column exists, if not, we'll use a workaround
    // For now, we'll add status column if it doesn't exist
    $checkColumn = mysqli_query($conn, "SHOW COLUMNS FROM users LIKE 'status'");
    if (mysqli_num_rows($checkColumn) == 0) {
        // Add status column if it doesn't exist
        mysqli_query($conn, "ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'");
    }
    
    $statusEscaped = mysqli_real_escape_string($conn, $status);
    $updateSql = "UPDATE users SET status = '$statusEscaped' WHERE id = $user_id";
    
    if (mysqli_query($conn, $updateSql)) {
        echo json_encode([
            "success" => true,
            "message" => "User " . $action . "d successfully"
        ]);
    } else {
        echo json_encode([
            "error" => "Failed to update user: " . mysqli_error($conn)
        ]);
    }
    
    mysqli_close($conn);
    exit;
}

// DELETE - Delete user
if ($method === 'DELETE') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $user_id = intval($data['user_id'] ?? 0);
    
    if ($user_id <= 0) {
        echo json_encode(["error" => "Invalid user ID"]);
        mysqli_close($conn);
        exit;
    }
    
    // Prevent deleting yourself
    if ($user_id == $_SESSION['user_id']) {
        echo json_encode(["error" => "Cannot delete your own account"]);
        mysqli_close($conn);
        exit;
    }
    
    // Delete user (notes will be kept with uploaded_by set to NULL due to ON DELETE SET NULL)
    $deleteSql = "DELETE FROM users WHERE id = $user_id";
    
    if (mysqli_query($conn, $deleteSql)) {
        echo json_encode([
            "success" => true,
            "message" => "User deleted successfully"
        ]);
    } else {
        echo json_encode([
            "error" => "Failed to delete user: " . mysqli_error($conn)
        ]);
    }
    
    mysqli_close($conn);
    exit;
}

echo json_encode(["error" => "Method not allowed"]);
mysqli_close($conn);
?>

