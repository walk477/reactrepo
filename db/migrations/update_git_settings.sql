-- اضافه کردن همه فیلدهای مربوط به تنظیمات گیت در یک آپدیت

-- ابتدا ستون‌های موجود را حذف می‌کنیم تا از خطای تکرار جلوگیری شود
ALTER TABLE `site_settings` 
DROP COLUMN IF EXISTS `company_react_repo`,
DROP COLUMN IF EXISTS `company_php_repo`,
DROP COLUMN IF EXISTS `company_react_branch`,
DROP COLUMN IF EXISTS `company_php_branch`,
DROP COLUMN IF EXISTS `github_access_token`,
DROP COLUMN IF EXISTS `github_webhook_secret`;

-- حالا همه ستون‌های مورد نیاز را اضافه می‌کنیم
ALTER TABLE `site_settings`
ADD COLUMN `company_react_repo` varchar(255) DEFAULT NULL COMMENT 'آدرس مخزن گیت پروژه React شرکت',
ADD COLUMN `company_php_repo` varchar(255) DEFAULT NULL COMMENT 'آدرس مخزن گیت پروژه PHP شرکت',
ADD COLUMN `company_react_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه React شرکت',
ADD COLUMN `company_php_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه PHP شرکت',
ADD COLUMN `github_access_token` varchar(255) DEFAULT NULL COMMENT 'توکن دسترسی به GitHub',
ADD COLUMN `github_webhook_secret` varchar(255) DEFAULT NULL COMMENT 'کلید رمز برای Webhook های GitHub';
