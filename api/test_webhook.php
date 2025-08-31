<?php
// این فایل برای تست webhook در محیط local است
require_once 'git_webhook.php';

// دریافت webhook secret از دیتابیس
$db = new mysqli("localhost", "root", "", "webhesab");
$stmt = $db->prepare("SELECT github_webhook_secret FROM site_settings WHERE id = 1");
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
$webhook_secret = $result['github_webhook_secret'] ?? '';

if (empty($webhook_secret)) {
    die("Error: Webhook secret not found in database. Please configure it first.\n");
}

// شبیه‌سازی یک push event از GitHub
$payload = [
    'ref' => 'refs/heads/main',
    'repository' => [
        'full_name' => 'your-username/your-repo',
        'name' => 'your-repo'
    ],
    'commits' => [
        [
            'id' => sha1(time()),
            'message' => 'Test commit',
            'timestamp' => date('c'),
            'url' => 'http://example.com'
        ]
    ]
];

// ساخت signature مشابه GitHub
$signature = 'sha256=' . hash_hmac('sha256', json_encode($payload), $webhook_secret);

// تنظیم هدرهای لازم
$_SERVER['HTTP_X_HUB_SIGNATURE_256'] = $signature;
$_SERVER['HTTP_X_GITHUB_EVENT'] = 'push';
$_SERVER['CONTENT_TYPE'] = 'application/json';

// فراخوانی webhook handler
$api = new GitWebhookAPI();
$api->handleRequest(json_encode($payload));

echo "Test completed!\n";
