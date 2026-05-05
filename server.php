<?php
// Custom router for PHP built-in server
$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

// Handle PHP files
if (preg_match('/\.php$/', $uri)) {
    $file = __DIR__ . $uri;
    if (file_exists($file)) {
        require $file;
        return true;
    }
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    return true;
}

// Serve static files
$file = __DIR__ . $uri;
if (is_file($file)) {
    return false; // Let PHP built-in server handle it
}

// Directory index
if (is_dir($file)) {
    $index = rtrim($file, '/') . '/index.html';
    if (file_exists($index)) {
        $content = file_get_contents($index);
        header('Content-Type: text/html');
        echo $content;
        return true;
    }
}

// Default to index.html
readfile(__DIR__ . '/index.html');
return true;
?>
