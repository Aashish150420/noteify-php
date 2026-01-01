<?php
header('Content-Type: application/json');

$file = $_FILES['file'];
$uploadDir = "../uploads/profilepics/";

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$fileName = time() . "_" . basename($file['name']);
$target = $uploadDir . $fileName;
$relativePath = "uploads/avatars/" . $fileName;

move_uploaded_file($file['tmp_name'], $target);

echo json_encode([
    "message" => "Avatar uploaded successfully",
    "url" => $relativePath
]);
?>


