<?php
header('Content-Type: application/json');
include("../config/db.php");

$title = $_POST['title'];
$description = $_POST['description'];
$course = $_POST['course'];
$type = $_POST['type'];
$year = $_POST['year'];
$uploaded_by = $_POST['uploaded_by'];

$uploadDir = "../uploads/";
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$file = $_FILES['file'];
$fileName = time() . "_" . basename($file['name']);
$target = $uploadDir . $fileName;
$relativePath = "uploads/" . $fileName;

move_uploaded_file($file['tmp_name'], $target);

$sql = "INSERT INTO notes (title, description, course, type, year, file_path, uploaded_by)
        VALUES ('$title', '$description', '$course', '$type', $year, '$relativePath', $uploaded_by)";

mysqli_query($conn, $sql);

echo json_encode([
    "message" => "File uploaded successfully",
    "note_id" => mysqli_insert_id($conn)
]);

mysqli_close($conn);
?>
