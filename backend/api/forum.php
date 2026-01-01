<?php
header('Content-Type: application/json');
include("../../config/db.php");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sql = "SELECT p.id, p.title, p.content, p.category, p.author_name AS author, 
                   p.author_avatar AS authorAvatar,
                   (SELECT COUNT(*) FROM forum_comments c WHERE c.post_id = p.id) AS replies,
                   DATE_FORMAT(p.created_at, '%b %e, %Y %H:%i') AS time
            FROM forum_posts p ORDER BY p.created_at DESC";
    
    $result = mysqli_query($conn, $sql);
    $posts = [];
    
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $posts[] = $row;
        }
    }
    
    echo json_encode($posts);
    mysqli_close($conn);
    exit;
}

if ($method === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    $title = mysqli_real_escape_string($conn, $data['title']);
    $content = mysqli_real_escape_string($conn, $data['content']);
    $category = mysqli_real_escape_string($conn, $data['category']);
    $author_name = mysqli_real_escape_string($conn, $data['author']);
    $author_avatar = mysqli_real_escape_string($conn, $data['authorAvatar']);
    
    $sql = "INSERT INTO forum_posts (title, content, category, author_name, author_avatar)
            VALUES ('$title', '$content', '$category', '$author_name', '$author_avatar')";
    
    mysqli_query($conn, $sql);
    $newId = mysqli_insert_id($conn);
    
    $post = [
        "id" => $newId,
        "title" => $title,
        "content" => $content,
        "category" => $category,
        "author" => $author_name,
        "authorAvatar" => $author_avatar,
        "replies" => 0,
        "time" => date('M j, Y H:i')
    ];
    
    echo json_encode([
        "message" => "Post created successfully",
        "post" => $post
    ]);
    
    mysqli_close($conn);
    exit;
}
?>
