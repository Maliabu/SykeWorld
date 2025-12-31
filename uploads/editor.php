<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Check if a file was uploaded
if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['file'];

// Check for upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Upload failed with error code ' . $file['error']]);
    exit;
}

// Get category from POST data (optional, defaults to 'general')
$category = isset($_POST['category']) ? $_POST['category'] : 'general';

// Define allowed categories and their folder names
$allowedCategories = [
    'rooms' => 'rooms',
    'gallery' => 'gallery',
    'profile' => 'profiles',
    'menu' => 'menu',
    'drinks' => 'drinks',
    'services' => 'services',
    'general' => 'general'
];

// Sanitize category
$category = strtolower(trim($category));
if (!isset($allowedCategories[$category])) {
    $category = 'general';
}

$folderName = $allowedCategories[$category];

// Base upload directory (adjust this path to match your cPanel structure)
$baseUploadDir = __DIR__ . '/';
$categoryDir = $baseUploadDir . $folderName . '/';

// Create category directory if it doesn't exist
if (!is_dir($categoryDir)) {
    mkdir($categoryDir, 0755, true);
}

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
$maxSize = 50 * 1024 * 1024; // 50MB (matches Next.js config)

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.']);
    exit;
}

// Validate file size
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large. Maximum size is 50MB.']);
    exit;
}

// Sanitize filename (prevent directory traversal)
$originalFilename = basename($file['name']);
$extension = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));

// Generate unique filename to avoid overwriting
$uniqueFilename = uniqid() . '_' . time() . '.' . $extension;
$targetFile = $categoryDir . $uniqueFilename;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $targetFile)) {
    // Get your domain
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $baseUrl = $protocol . '://' . $host;
    
    // Return the URL
    $fileUrl = $baseUrl . '/uploads/' . $folderName . '/' . $uniqueFilename;
    
    echo json_encode([
        'success' => true,
        'url' => $fileUrl,
        'fileUrl' => $fileUrl,
        'path' => $fileUrl,
        'location' => $fileUrl,
        'category' => $category,
        'folder' => $folderName
    ]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to move uploaded file']);
}
?>


