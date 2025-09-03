<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'GitConnection.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $gitConnection = new GitConnection();
        $repoType = isset($_GET['type']) ? $_GET['type'] : 'react'; // react یا php
        
        // دریافت تنظیمات مربوط به مخزن
        $settings = $gitConnection->getGitSettings();
        
        $repoUrl = $repoType === 'react' ? $settings['company_react_repo'] : $settings['company_php_repo'];
        $branch = $repoType === 'react' ? $settings['company_react_branch'] : $settings['company_php_branch'];
        
        if (empty($repoUrl)) {
            throw new Exception("Repository URL is not configured");
        }

        // استخراج owner/repo از URL گیت‌هاب
        preg_match('/github\.com\/([^\/]+)\/([^\/\.]+)/', $repoUrl, $matches);
        if (count($matches) !== 3) {
            throw new Exception("Invalid repository URL format");
        }
        
        $owner = $matches[1];
        $repo = $matches[2];
        
        $githubToken = $settings['github_access_token'];
        
        // درخواست به API گیت‌هاب
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, "https://api.github.com/repos/{$owner}/{$repo}/commits/{$branch}");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/vnd.github.v3+json',
            'Authorization: token ' . $githubToken,
            'User-Agent: PHP'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            throw new Exception("Failed to fetch commit information");
        }
        
        $commitData = json_decode($response, true);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'sha' => $commitData['sha'],
                'message' => $commitData['commit']['message'],
                'author' => $commitData['commit']['author']['name'],
                'date' => $commitData['commit']['author']['date'],
                'url' => $commitData['html_url']
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
