<?php
/**
 * API دریافت Webhook های GitHub
 * این API رویدادهای دریافتی از GitHub را پردازش می‌کند
 */

header("Content-Type: application/json; charset=UTF-8");

require_once 'ApiBase.php';

class GitWebhookAPI extends ApiBase {
    private string $webhookSecret;

    public function __construct() {
        parent::__construct();
        // دریافت Webhook Secret از تنظیمات
        $stmt = $this->db->prepare("SELECT github_webhook_secret FROM site_settings WHERE id = 1");
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $this->webhookSecret = $result['github_webhook_secret'] ?? '';
    }

    /**
     * تأیید اعتبار درخواست دریافتی از GitHub
     */
    private function verifyGitHubSignature(string $payload): bool {
        if (empty($this->webhookSecret)) {
            $this->log_message("ERROR: Webhook secret is not configured");
            return false;
        }

        $signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
        if (empty($signature)) {
            $this->log_message("ERROR: No signature received from GitHub");
            return false;
        }

        $expectedSignature = 'sha256=' . hash_hmac('sha256', $payload, $this->webhookSecret);
        return hash_equals($expectedSignature, $signature);
    }

    /**
     * پردازش رویداد Push
     */
    private function handlePushEvent(array $data): void {
        $repository = $data['repository']['full_name'] ?? '';
        $branch = str_replace('refs/heads/', '', $data['ref'] ?? '');
        $commits = $data['commits'] ?? [];

        // دریافت اطلاعات ریپوزیتوری‌های شرکت
        $stmt = $this->db->prepare("
            SELECT 
                company_react_repo,
                company_php_repo,
                company_react_branch,
                company_php_branch
            FROM site_settings 
            WHERE id = 1
        ");
        $stmt->execute();
        $settings = $stmt->get_result()->fetch_assoc();

        // تشخیص نوع ریپوزیتوری (React یا PHP)
        $repoType = null;
        $defaultBranch = null;
        if (strpos($settings['company_react_repo'], $repository) !== false) {
            $repoType = 'react';
            $defaultBranch = $settings['company_react_branch'];
        } elseif (strpos($settings['company_php_repo'], $repository) !== false) {
            $repoType = 'php';
            $defaultBranch = $settings['company_php_branch'];
        }

        // اگر push به شاخه اصلی نباشد، نادیده بگیر
        if ($branch !== $defaultBranch) {
            $this->log_message("INFO: Ignoring push to non-default branch: {$branch}");
            return;
        }

        // ثبت تغییرات در دیتابیس
        $stmt = $this->db->prepare("
            INSERT INTO repository_updates 
            (repository_type, branch, commit_count, last_commit_hash, commit_message, author, update_time)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");

        $lastCommit = end($commits);
        $commitCount = count($commits);
        $lastCommitHash = $lastCommit['id'] ?? '';
        $commitMessage = $lastCommit['message'] ?? '';
        $author = $lastCommit['author']['name'] ?? '';

        $stmt->bind_param(
            "ssssss",
            $repoType,
            $branch,
            $commitCount,
            $lastCommitHash,
            $commitMessage,
            $author
        );
        $stmt->execute();

        $this->log_message("INFO: Processed {$commitCount} commits for {$repoType} repository on branch {$branch}");
    }

    /**
     * دریافت و پردازش Webhook
     */
    public function handleWebhook(): void {
        try {
            // دریافت payload
            $payload = file_get_contents('php://input');
            if (empty($payload)) {
                throw new Exception('No payload received');
            }

            // تأیید اعتبار درخواست
            if (!$this->verifyGitHubSignature($payload)) {
                throw new Exception('Invalid signature');
            }

            // تبدیل payload به آرایه
            $data = json_decode($payload, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON payload');
            }

            // بررسی نوع رویداد
            $event = $_SERVER['HTTP_X_GITHUB_EVENT'] ?? '';
            switch ($event) {
                case 'push':
                    $this->handlePushEvent($data);
                    $this->sendResponse(['status' => 'success', 'message' => 'Push event processed']);
                    break;

                default:
                    $this->log_message("INFO: Ignoring unsupported event: {$event}");
                    $this->sendResponse(['status' => 'ignored', 'message' => 'Event type not supported']);
                    break;
            }

        } catch (Exception $e) {
            $this->log_message("ERROR: " . $e->getMessage());
            $this->sendResponse(['error' => $e->getMessage()], 400);
        }
    }

    /**
     * ثبت پیام در لاگ
     */
    private function log_message(string $message): void {
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "[{$timestamp}] {$message}\n";
        error_log($logEntry, 3, __DIR__ . '/webhook.log');
    }
}

// مسیریاب
$api = new GitWebhookAPI();
$api->handleWebhook();
