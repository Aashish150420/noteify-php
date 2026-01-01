<?php
// Admin API for managing forum content
// GET: Fetch all forum posts and comments
// DELETE: Delete a forum post or comment

header('Content-Type: application/json');
// Database connection
include('../../../config/db.php');

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all forum posts with comment counts
if ($method === 'GET') {
    $type = $_GET['type'] ?? 'posts'; // 'posts' or 'comments'
    
    if ($type === 'posts') {
        // Fetch all forum posts
        $sql = "SELECT p.*, 
                       (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) as comment_count
                FROM forum_posts p 
                ORDER BY p.created_at DESC";
        
        $result = mysqli_query($conn, $sql);
        $posts = [];
        
        if ($result) {
            while ($row = mysqli_fetch_assoc($result)) {
                $posts[] = $row;
            }
        }
        
        echo json_encode($posts);
    } else if ($type === 'comments') {
        // Fetch all forum comments with post information
        $sql = "SELECT c.*, p.title as post_title 
                FROM forum_comments c 
                LEFT JOIN forum_posts p ON c.post_id = p.id 
                ORDER BY c.created_at DESC";
        
        $result = mysqli_query($conn, $sql);
        $comments = [];
        
        if ($result) {
            while ($row = mysqli_fetch_assoc($result)) {
                $comments[] = $row;
            }
        }
        
        echo json_encode($comments);
    }
    
    mysqli_close($conn);
    exit;
}

// DELETE - Delete a forum post or comment
if ($method === 'DELETE') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $type = isset($data['type']) ? $data['type'] : (isset($_GET['type']) ? $_GET['type'] : '');
    $id = isset($data['id']) ? intval($data['id']) : (isset($_GET['id']) ? intval($_GET['id']) : 0);
    
    if ($id <= 0 || !in_array($type, ['post', 'comment'])) {
        echo json_encode(["error" => "Invalid request"]);
        mysqli_close($conn);
        exit;
    }
    
    if ($type === 'post') {
        // Delete forum post (comments will be deleted automatically due to CASCADE)
        $deleteSql = "DELETE FROM forum_posts WHERE id = $id";
    } else if ($type === 'comment') {
        // Delete forum comment
        $deleteSql = "DELETE FROM forum_comments WHERE id = $id";
    }
    
    if (mysqli_query($conn, $deleteSql)) {
        echo json_encode([
            "success" => true,
            "message" => ucfirst($type) . " deleted successfully"
        ]);
    } else {
        echo json_encode([
            "error" => "Failed to delete: " . mysqli_error($conn)
        ]);
    }
    
    mysqli_close($conn);
    exit;
}

echo json_encode(["error" => "Method not allowed"]);
mysqli_close($conn);
?>

