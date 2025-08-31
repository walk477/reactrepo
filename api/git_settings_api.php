<?php
/**
 * API مدیریت تنظیمات Git شرکت
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') { exit(); }
header("Content-Type: application/json; charset=UTF-8");

require_once 'ApiBase.php';

class GitSettingsAPI extends ApiBase
{
    /**
     * دریافت تنظیمات فعلی
     */
    public function getSettings(): void
    {
        $userData = $this->authenticateRequest();
        if ($userData['role_id'] != 1) {
            $this->sendResponse(['error' => 'دسترسی غیرمجاز'], 403, true);
        }

        $stmt = $this->db->prepare("
            SELECT 
                company_react_repo,
                company_php_repo,
                company_react_branch,
                company_php_branch,
                github_access_token,
                github_webhook_secret
            FROM site_settings 
            WHERE id = 1
        ");
        $stmt->execute();
        $settings = $stmt->get_result()->fetch_assoc();

        // مخفی کردن توکن‌ها برای امنیت بیشتر
        if ($settings) {
            if ($settings['github_access_token']) {
                $settings['github_access_token'] = '••••' . substr($settings['github_access_token'], -4);
            }
            if ($settings['github_webhook_secret']) {
                $settings['github_webhook_secret'] = '••••' . substr($settings['github_webhook_secret'], -4);
            }
        }

        $this->sendResponse($settings ?: []);
    }

    /**
     * بروزرسانی تنظیمات
     */
    public function updateSettings(): void
    {
        $userData = $this->authenticateRequest();
        if ($userData['role_id'] != 1) {
            $this->sendResponse(['error' => 'دسترسی غیرمجاز'], 403, true);
        }

        $data = $this->getJsonInput();
        
        // اعتبارسنجی آدرس‌های ریپوزیتوری
        if (!empty($data['company_react_repo']) && !filter_var($data['company_react_repo'], FILTER_VALIDATE_URL)) {
            $this->sendResponse(['error' => 'آدرس ریپوزیتوری React معتبر نیست'], 400);
            return;
        }
        if (!empty($data['company_php_repo']) && !filter_var($data['company_php_repo'], FILTER_VALIDATE_URL)) {
            $this->sendResponse(['error' => 'آدرس ریپوزیتوری PHP معتبر نیست'], 400);
            return;
        }

        // ساخت کوئری آپدیت
        $allowedFields = [
            'company_react_repo',
            'company_php_repo',
            'company_react_branch',
            'company_php_branch',
            'github_access_token',
            'github_webhook_secret'
        ];

        $updates = [];
        $params = [];
        $types = '';

        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "`{$field}` = ?";
                $params[] = $data[$field];
                $types .= 's';
            }
        }

        if (empty($updates)) {
            $this->sendResponse(['error' => 'هیچ داده‌ای برای به‌روزرسانی ارسال نشده است'], 400);
            return;
        }

        // اجرای کوئری آپدیت
        $query = "UPDATE site_settings SET " . implode(', ', $updates) . " WHERE id = 1";
        $stmt = $this->db->prepare($query);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            // تست اتصال به GitHub با توکن جدید
            if (isset($data['github_access_token'])) {
                $testResult = $this->testGitHubConnection($data['github_access_token']);
                if (!$testResult['success']) {
                    $this->sendResponse([
                        'success' => true,
                        'warning' => 'تنظیمات ذخیره شد اما اتصال به GitHub ناموفق بود: ' . $testResult['error']
                    ]);
                    return;
                }
            }

            $this->sendResponse(['success' => true, 'message' => 'تنظیمات با موفقیت به‌روزرسانی شد']);
        } else {
            $this->sendResponse(['error' => 'خطا در به‌روزرسانی تنظیمات'], 500);
        }
    }

    /**
     * تست اتصال به GitHub با توکن
     */
    private function testGitHubConnection(string $token): array
    {
        $ch = curl_init('https://api.github.com/user');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: token ' . $token,
                'User-Agent: PHP'
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200) {
            return ['success' => true];
        } else {
            return [
                'success' => false,
                'error' => 'HTTP Status: ' . $httpCode . ($response ? ' - ' . $response : '')
            ];
        }
    }
}

// مسیریاب
$api = new GitSettingsAPI();

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        $api->getSettings();
        break;
    case 'POST':
        $api->updateSettings();
        break;
    default:
        header("HTTP/1.1 405 Method Not Allowed");
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
