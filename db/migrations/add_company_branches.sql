-- اضافه کردن فیلدهای برنچ برای پروژه‌های شرکت
ALTER TABLE `site_settings`
ADD COLUMN `company_react_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه React شرکت',
ADD COLUMN `company_php_branch` varchar(100) DEFAULT 'main' COMMENT 'شاخه اصلی پروژه PHP شرکت';
