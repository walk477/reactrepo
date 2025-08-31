-- ایجاد جدول تنظیمات سایت
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_react_repo` varchar(255) NOT NULL COMMENT 'مسیر مخزن React شرکت',
  `company_php_repo` varchar(255) NOT NULL COMMENT 'مسیر مخزن PHP شرکت',
  `company_react_branch` varchar(100) NOT NULL DEFAULT 'main' COMMENT 'شاخه اصلی پروژه React',
  `company_php_branch` varchar(100) NOT NULL DEFAULT 'main' COMMENT 'شاخه اصلی پروژه PHP',
  `github_access_token` varchar(255) DEFAULT NULL COMMENT 'توکن دسترسی به گیت‌هاب',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- درج مقادیر پیش‌فرض
INSERT INTO `site_settings` (`id`, `company_react_repo`, `company_php_repo`, `company_react_branch`, `company_php_branch`) 
VALUES (1, '/path/to/company/react/repo', '/path/to/company/php/repo', 'main', 'main')
ON DUPLICATE KEY UPDATE 
  company_react_repo = company_react_repo,
  company_php_repo = company_php_repo;
