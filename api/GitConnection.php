<?php

require_once 'git_api.php';

class GitConnection {
    private static function log($level, $message, $context = []) {
        if (class_exists('Logger')) {
            Logger::getInstance()->log($level, $message, $context);
        } else {
            error_log("[$level] $message " . json_encode($context));
        }
    }
    private static array $githubIPs = ['140.82.121.3', '140.82.121.4', '140.82.114.4'];
    private static string $currentIP;
    
    private static function resolveGitHubIP(): ?string {
        if (isset(self::$currentIP)) {
            return self::$currentIP;
        }
        
        // First try nslookup
        $output = shell_exec('nslookup github.com 2>&1');
        if (preg_match('/Address:\s+(\d+\.\d+\.\d+\.\d+)/', $output, $matches)) {
            return $matches[1];
        }
        
        // Fallback IPs if DNS lookup fails
        foreach (self::$githubIPs as $ip) {
            $ch = curl_init("https://{$ip}");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_NOBODY => true,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_CONNECTTIMEOUT => 3,
                CURLOPT_TIMEOUT => 5,
                CURLOPT_HTTPHEADER => ['Host: github.com']
            ]);
            $result = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            if ($result !== false && $httpCode >= 200 && $httpCode < 400) {
                self::$currentIP = $ip;
                return $ip;
            }
        }
        
        return null;
    }

    public static function executeGitCommand(string $command, bool $ignoreErrors = false): string {
        self::log('INFO', 'Starting Git command execution', ['command' => $command, 'ignore_errors' => $ignoreErrors]);
        
        // Replace github.com with IP in git commands
        if (strpos($command, 'github.com') !== false) {
            self::log('DEBUG', 'GitHub URL detected, attempting IP resolution');
            $ip = self::resolveGitHubIP();
            if ($ip) {
                $command = str_replace('github.com', $ip, $command);
                // Add Host header for proper SSL verification
                $command = "git -c http.extraHeader='Host: github.com' " . $command;
                self::log('DEBUG', 'Command modified with GitHub IP', [
                    'ip' => $ip,
                    'modified_command' => $command
                ]);
            } else {
                self::log('WARNING', 'Failed to resolve GitHub IP, using original URL');
            }
        }

        // Environment setup for Git commands
        $env = [
            'GIT_TERMINAL_PROMPT' => '0',
            'GIT_SSL_NO_VERIFY' => '1',
            'NO_PROXY' => '*',
            'GIT_SSL_VERSION' => 'tlsv1.2',
            'GIT_TRACE' => '1',
            'GIT_CURL_VERBOSE' => '1',
            'GIT_HTTP_USER_AGENT' => 'git/2.0.0',
            'LANG' => 'en_US.UTF-8'
        ];

        // Configure Git
        shell_exec('git config --global http.sslVerify false');
        shell_exec('git config --global http.version HTTP/1.1');
        shell_exec('git config --global http.minSessions 1');
        shell_exec('git config --global http.postBuffer 524288000');
        
        // Execute command with proper pipes
        $descriptorspec = [
            0 => ["pipe", "r"],
            1 => ["pipe", "w"],
            2 => ["pipe", "w"]
        ];
        
        self::log('DEBUG', 'Executing Git command', [
            'command' => $command,
            'environment' => $env
        ]);

        $process = proc_open($command, $descriptorspec, $pipes, null, $env);
        
        if (!is_resource($process)) {
            $errorMsg = 'Failed to start command: ' . $command;
            self::log('ERROR', $errorMsg);
            throw new Exception($errorMsg);
        }
        
        $output = stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        
        foreach ($pipes as $pipe) {
            fclose($pipe);
        }
        
        $exitCode = proc_close($process);
        
        self::log('DEBUG', 'Command execution completed', [
            'command' => $command,
            'output' => $output,
            'error' => $error,
            'exit_code' => $exitCode
        ]);
        
        if ($error) {
            self::log('WARNING', 'Command generated error output', [
                'command' => $command,
                'error' => $error
            ]);
        }
        
        if ($exitCode !== 0 && !$ignoreErrors) {
            $errorMsg = $error ?: 'Command failed with exit code: ' . $exitCode;
            self::log('ERROR', 'Command failed', [
                'command' => $command,
                'error' => $errorMsg,
                'exit_code' => $exitCode
            ]);
            throw new Exception($errorMsg);
        }
        
        return trim($output);
    }

    public function getLastCommit($repoUrl, $branch = 'main'): array {
        try {
            $command = "git ls-remote $repoUrl $branch";
            $output = self::executeGitCommand($command);
            
            if (empty($output)) {
                throw new Exception("Failed to get last commit: No output from git ls-remote");
            }
            
            $sha = substr($output, 0, 40);
            
            return [
                'sha' => $sha,
                'date' => date('Y-m-d H:i:s'),
                'message' => 'Latest commit'
            ];
        } catch (Exception $e) {
            self::log('ERROR', 'Failed to get last commit', [
                'repo' => $repoUrl,
                'branch' => $branch,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    public function compareCommits($baseRepo, $compareRepo, $branch = 'main'): array {
        try {
            // Get the list of files in both repositories
            $baseFiles = $this->getRepoFiles($baseRepo, $branch);
            $compareFiles = $this->getRepoFiles($compareRepo, $branch);
            
            $added = array_diff(array_keys($compareFiles), array_keys($baseFiles));
            $deleted = array_diff(array_keys($baseFiles), array_keys($compareFiles));
            $modified = [];
            
            // Check for modifications
            foreach ($baseFiles as $file => $hash) {
                if (isset($compareFiles[$file]) && $compareFiles[$file] !== $hash) {
                    $modified[] = $file;
                }
            }
            
            // Get commit count difference
            $behindBy = $this->getCommitDifference($baseRepo, $compareRepo, $branch);
            
            return [
                'behindBy' => $behindBy,
                'added' => array_values($added),
                'modified' => $modified,
                'deleted' => array_values($deleted)
            ];
        } catch (Exception $e) {
            self::log('ERROR', 'Failed to compare repositories', [
                'base_repo' => $baseRepo,
                'compare_repo' => $compareRepo,
                'branch' => $branch,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    private function getRepoFiles($repoUrl, $branch): array {
        $command = "git ls-tree -r $branch --format='%(objectname) %(path)'";
        $output = self::executeGitCommand($command);
        
        $files = [];
        foreach (explode("\n", $output) as $line) {
            if (preg_match('/^(\w+)\s+(.+)$/', $line, $matches)) {
                $files[$matches[2]] = $matches[1];
            }
        }
        
        return $files;
    }

    private function getCommitDifference($baseRepo, $compareRepo, $branch): int {
        $command = "git rev-list --count $branch..$compareRepo/$branch";
        try {
            $output = self::executeGitCommand($command);
            return (int)$output;
        } catch (Exception $e) {
            return 0;
        }
    }

    public function updateRepository($repoUrl, $branch, $projectPath): array {
        try {
            // First fetch the latest changes
            $command = "cd $projectPath && git fetch origin $branch";
            self::executeGitCommand($command);
            
            // Then try to merge
            $command = "cd $projectPath && git merge origin/$branch";
            $output = self::executeGitCommand($command);
            
            if (strpos($output, 'Already up to date') !== false) {
                return [
                    'status' => 'up-to-date',
                    'message' => 'Repository is already up to date'
                ];
            }
            
            return [
                'status' => 'updated',
                'message' => 'Repository updated successfully',
                'details' => $output
            ];
            
        } catch (Exception $e) {
            self::log('ERROR', 'Failed to update repository', [
                'repo' => $repoUrl,
                'branch' => $branch,
                'path' => $projectPath,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
            ]);
        }
        
        return $output ?: '';
    }
}
