<?php
require_once 'ApiBase.php';

class GitUpdateChecker extends ApiBase {
    /**
     * بررسی تغییرات در ریپوزیتوری‌ها
     */
    public function checkUpdates() {
        // دریافت تنظیمات از دیتابیس
        $stmt = $this->db->prepare("SELECT github_access_token, company_react_repo, company_php_repo FROM site_settings WHERE id = 1");
        $stmt->execute();
        $settings = $stmt->get_result()->fetch_assoc();
        
        $token = $settings['github_access_token'];
        
        $updates = [];
        
        // بررسی ریپوزیتوری React
        if (!empty($settings['company_react_repo'])) {
            $updates['react'] = $this->checkRepoUpdates($settings['company_react_repo'], $token);
        }
        
        // بررسی ریپوزیتوری PHP
        if (!empty($settings['company_php_repo'])) {
            $updates['php'] = $this->checkRepoUpdates($settings['company_php_repo'], $token);
        }
        
        echo json_encode(['status' => 'success', 'updates' => $updates]);
    }
    
    /**
     * بررسی تغییرات یک ریپوزیتوری
     */
    private function checkRepoUpdates($repo, $token) {
        $url = "https://api.github.com/repos/{$repo}/commits";
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'User-Agent: PHP Script',
                "Authorization: token {$token}",
                'Accept: application/vnd.github.v3+json'
            ]
        ]);
        
        $response = curl_exec($ch);
        $commits = json_decode($response, true);
        
        if (!is_array($commits)) {
            return ['error' => 'Failed to fetch commits'];
        }
        
        // دریافت آخرین کامیت ذخیره شده
        $stmt = $this->db->prepare("SELECT last_commit FROM repository_updates WHERE repository = ? ORDER BY update_date DESC LIMIT 1");
        $stmt->bind_param('s', $repo);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        $lastStoredCommit = $result['last_commit'] ?? null;
        
        $newCommits = [];
        foreach ($commits as $commit) {
            if ($commit['sha'] === $lastStoredCommit) {
                break;
            }
            $newCommits[] = [
                'sha' => $commit['sha'],
                'message' => $commit['commit']['message'],
                'date' => $commit['commit']['author']['date']
            ];
        }
        
        // اگر کامیت جدیدی وجود داشت، آن را ذخیره می‌کنیم
        if (!empty($newCommits)) {
            $stmt = $this->db->prepare("INSERT INTO repository_updates (repository, last_commit, commit_message, update_date) VALUES (?, ?, ?, NOW())");
            $stmt->bind_param('sss', $repo, $newCommits[0]['sha'], $newCommits[0]['message']);
            $stmt->execute();
        }
        
        return [
            'has_updates' => !empty($newCommits),
            'new_commits' => $newCommits
        ];
    }
}

// اجرای API
$api = new GitUpdateChecker();
$api->checkUpdates();
