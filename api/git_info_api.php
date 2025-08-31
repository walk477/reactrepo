<?php
/**
 * API دریافت اطلاعات از مخزن گیت‌هاب
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once './ApiBase.php';

class GitInfoAPI extends ApiBase {
    private string $githubApiUrl = 'https://api.github.com';
    
    /**
     * دریافت اطلاعات از یک مخزن گیت‌هاب
     */
    public function getRepositoryInfo(): void {
        $userData = $this->authenticateRequest();
        if (!$userData) {
            return;
        }

        $data = $this->getJsonInput();
        
        // بررسی پارامترهای ورودی
        if (empty($data['repositoryUrl'])) {
            $this->sendResponse(['error' => 'آدرس مخزن الزامی است'], 400);
            return;
        }

        try {
            // استخراج نام کاربری و نام مخزن از URL
            if (!preg_match('/github\.com\/([^\/]+)\/([^\/\.]+)/', $data['repositoryUrl'], $matches)) {
                throw new Exception('آدرس مخزن نامعتبر است');
            }

            $owner = $matches[1];
            $repo = $matches[2];

            // دریافت اطلاعات مخزن
            $repoInfo = $this->fetchRepositoryInfo($owner, $repo, $data['token']);
            
            // دریافت لیست شاخه‌ها
            $branches = $this->fetchBranches($owner, $repo, $data['token']);

            $this->sendResponse([
                'repository' => $repoInfo,
                'branches' => $branches
            ]);

        } catch (Exception $e) {
            $this->sendResponse(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * دریافت اطلاعات مخزن از گیت‌هاب
     */
    private function fetchRepositoryInfo(string $owner, string $repo, string $token): array {
        $ch = curl_init("{$this->githubApiUrl}/repos/{$owner}/{$repo}");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Accept: application/vnd.github.v3+json',
                "Authorization: token {$token}",
                'User-Agent: PHP'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception('خطا در دریافت اطلاعات مخزن: ' . $response);
        }

        $data = json_decode($response, true);
        if (!is_array($data)) {
            throw new Exception('خطا در پردازش اطلاعات مخزن');
        }

        return [
            'name' => $data['name'],
            'full_name' => $data['full_name'],
            'description' => $data['description'],
            'default_branch' => $data['default_branch'],
            'ssh_url' => $data['ssh_url'],
            'clone_url' => $data['clone_url'],
            'created_at' => $data['created_at'],
            'updated_at' => $data['updated_at']
        ];
    }

    /**
     * دریافت لیست شاخه‌های مخزن از گیت‌هاب
     */
    private function fetchBranches(string $owner, string $repo, string $token): array {
        $ch = curl_init("{$this->githubApiUrl}/repos/{$owner}/{$repo}/branches");
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Accept: application/vnd.github.v3+json',
                "Authorization: token {$token}",
                'User-Agent: PHP'
            ]
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            throw new Exception('خطا در دریافت لیست شاخه‌ها: ' . $response);
        }

        $branches = json_decode($response, true);
        if (!is_array($branches)) {
            throw new Exception('خطا در پردازش لیست شاخه‌ها');
        }

        return array_map(function($branch) {
            return [
                'name' => $branch['name'],
                'commit' => [
                    'sha' => $branch['commit']['sha']
                ]
            ];
        }, $branches);
    }
}

// اجرای API
$api = new GitInfoAPI();

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $api->getRepositoryInfo();
    } else {
        http_response_code(405);
        echo json_encode(['error' => 'متد درخواست نامعتبر است']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'خطای سیستمی: ' . $e->getMessage()]);
}
