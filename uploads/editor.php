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
    
    // For subdomain setup (uploads.sykeworld.com):
    // - The document root IS the uploads directory
    // - Files are saved to: {document_root}/{category}/{filename}
    // - URL should be: https://uploads.sykeworld.com/{category}/{filename} (NO /uploads/ prefix)
    // For main domain setup (sykeworld.com/uploads/):
    // - Files are saved to: public_html/uploads/{category}/{filename}
    // - URL should be: https://sykeworld.com/uploads/{category}/{filename}
    
    // Check if we're on a subdomain (uploads.*)
    $isSubdomain = strpos($host, 'uploads.') === 0;
    
    if ($isSubdomain) {
        // Subdomain: URL is just domain + category + filename (NO /uploads/ prefix)
        // The subdomain's document root IS the uploads directory
        $fileUrl = $baseUrl . '/' . $folderName . '/' . $uniqueFilename;
    } else {
        // Main domain: URL includes /uploads/ path
        $scriptPath = dirname($_SERVER['SCRIPT_NAME']); // e.g., /uploads or /
        // Normalize script path (remove leading/trailing slashes, then add one)
        $scriptPath = '/' . trim($scriptPath, '/');
        if ($scriptPath === '/') {
            $scriptPath = '/uploads'; // Default to /uploads if root
        }
        $fileUrl = $baseUrl . $scriptPath . '/' . $folderName . '/' . $uniqueFilename;
    }
    
    // CRITICAL: If on uploads subdomain, ensure /uploads/ is NOT in the URL
    // Remove /uploads/ from anywhere in the path for subdomain
    if ($isSubdomain) {
        // Remove /uploads/ from the URL path completely
        $fileUrl = preg_replace('#^https://uploads\.[^/]+/uploads/#', 'https://' . $host . '/', $fileUrl);
        $fileUrl = preg_replace('#/uploads/#', '/', $fileUrl);
        // Ensure we have the correct format: https://uploads.sykeworld.com/rooms/filename.jpg
        $fileUrl = preg_replace('#^https://' . preg_quote($host, '#') . '/(.+)$#', 'https://' . $host . '/$1', $fileUrl);
    }
    
    // Safety check: Remove any double /uploads/ in the URL (for main domain)
    $fileUrl = preg_replace('#/uploads/uploads/#', '/uploads/', $fileUrl);
    
    // Debug: Log the URL construction
    error_log("File URL: $fileUrl | Host: $host | IsSubdomain: " . ($isSubdomain ? 'yes' : 'no') . " | Folder: $folderName | File: $uniqueFilename | Script: " . $_SERVER['SCRIPT_NAME']);
    
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


