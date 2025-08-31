-- اضافه کردن فیلدهای جدید برای مدیریت تنظیمات گیت
ALTER TABLE `site_settings`
ADD COLUMN `github_access_token` varchar(255) DEFAULT NULL COMMENT 'توکن دسترسی به GitHub',
ADD COLUMN `github_webhook_secret` varchar(255) DEFAULT NULL COMMENT 'کلید رمز برای Webhook های GitHub',
ADD COLUMN `react_repo_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه React',
ADD COLUMN `php_repo_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه PHP';
