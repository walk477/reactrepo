ALTER TABLE `customers` 
ADD COLUMN `project_server_path` varchar(255) DEFAULT NULL COMMENT 'مسیر پروژه روی سرور',
ADD COLUMN `react_repo_url` varchar(255) DEFAULT NULL COMMENT 'آدرس مخزن React',
ADD COLUMN `php_repo_url` varchar(255) DEFAULT NULL COMMENT 'آدرس مخزن PHP',
ADD COLUMN `react_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه مورد استفاده React',
ADD COLUMN `php_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه مورد استفاده PHP',
ADD COLUMN `last_react_commit` varchar(40) DEFAULT NULL COMMENT 'آخرین کامیت React بررسی شده',
ADD COLUMN `last_php_commit` varchar(40) DEFAULT NULL COMMENT 'آخرین کامیت PHP بررسی شده',
ADD COLUMN `last_sync_date` datetime DEFAULT NULL COMMENT 'آخرین زمان همگام‌سازی';
