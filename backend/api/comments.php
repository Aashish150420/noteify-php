<?php
header('Content-Type: application/json');
include("../../config/db.php");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $postId = $_GET['post_id'];
    
    $sql = "SELECT id, post_id, author_name AS author, author_avatar AS authorAvatar, 
                   text, DATE_FORMAT(created_at, '%b %e, %Y %H:%i') AS time
            FROM forum_comments WHERE post_id = $postId ORDER BY created_at ASC";
    
    $result = mysqli_query($conn, $sql);
    $comments = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $comments[] = $row;
    }
    
    echo json_encode($comments);
    mysqli_close($conn);
    exit;
}

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $postId = intval($data['post_id']);
    $text = mysqli_real_escape_string($conn, $data['text']);
    $author_name = mysqli_real_escape_string($conn, $data['author']);
    $author_avatar = mysqli_real_escape_string($conn, $data['authorAvatar']);
    
    $sql = "INSERT INTO forum_comments (post_id, author_name, author_avatar, text)
            VALUES ($postId, '$author_name', '$author_avatar', '$text')";
    
    mysqli_query($conn, $sql);
    $newId = mysqli_insert_id($conn);
    
    $comment = [
        "id" => $newId,
        "post_id" => $postId,
        "author" => $author_name,
        "authorAvatar" => $author_avatar,
        "text" => $text,
        "time" => date('M j, Y H:i')
    ];
    
    echo json_encode([
        "message" => "Comment added successfully",
        "comment" => $comment
    ]);
    
    mysqli_close($conn);
    exit;
}
?>
