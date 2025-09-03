<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'GitHubAccess.php';
require_once 'GitConnection.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $gitConnection = new GitConnection();
        $settings = $gitConnection->getGitSettings();
        
        $githubToken = $settings['github_access_token'];

        $repos = [
            'react' => [
                'url' => $settings['company_react_repo'],
                'branch' => $settings['company_react_branch']
            ],
            'php' => [
                'url' => $settings['company_php_repo'],
                'branch' => $settings['company_php_branch']
            ]
        ];

        $result = [];

        foreach ($repos as $type => $repoInfo) {
            if (!empty($repoInfo['url'])) {
                $github = new GitHubAccess($githubToken, $repoInfo['url']);
                $access = $github->checkAccess();
                $result[$type] = $access;
            }
        }

        echo json_encode([
            'success' => true,
            'data' => $result
        ]);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
