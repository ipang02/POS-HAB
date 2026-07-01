-- ============================================================
-- HAB Barbershop POS — UPGRADE SCRIPT (v1 → v2 Multi-Branch)
-- Run this ONLY if you already imported the old database.sql
-- Hostinger: phpMyAdmin → Select DB → SQL tab → paste & run
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Step 1: Create branches table ────────────────────────────
CREATE TABLE IF NOT EXISTS `branches` (
  `id`           TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(100) NOT NULL,
  `short_name`   CHAR(5)  NOT NULL DEFAULT '',
  `address`      VARCHAR(255) DEFAULT NULL,
  `phone`        VARCHAR(20)  DEFAULT NULL,
  `email`        VARCHAR(100) DEFAULT NULL,
  `instagram`    VARCHAR(60)  DEFAULT NULL,
  `is_active`    TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `branches` (`id`,`name`,`short_name`,`address`,`phone`,`email`,`instagram`) VALUES
(1, 'Kota Bharu', 'KB', 'No. 12, Jalan Sultan Yahya Petra, 15000 Kota Bharu, Kelantan', '09-748 1234', 'kotabharu@habbarbershop.com.my',  '@habbarbershop.kb'),
(2, 'Kedai Lalat', 'KL', 'No. 3, Pekan Kedai Lalat, Kelantan',                          '09-912 3456', 'kedailalat@habbarbershop.com.my', '@habbarbershop.kl')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- ── Step 2: Add branch_id to existing tables ─────────────────

-- barbers
ALTER TABLE `barbers`
  ADD COLUMN IF NOT EXISTS `branch_id` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`,
  ADD KEY IF NOT EXISTS `idx_barber_branch` (`branch_id`);

-- appointments
ALTER TABLE `appointments`
  ADD COLUMN IF NOT EXISTS `branch_id` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`,
  ADD KEY IF NOT EXISTS `idx_appt_branch` (`branch_id`);

-- transactions
ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `branch_id` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`,
  ADD KEY IF NOT EXISTS `idx_trx_branch` (`branch_id`);

-- transaction_items: add item_type column
ALTER TABLE `transaction_items`
  ADD COLUMN IF NOT EXISTS `item_type` ENUM('service','product') NOT NULL DEFAULT 'service' AFTER `transaction_id`,
  CHANGE COLUMN `service_name` `item_name` VARCHAR(100) NOT NULL;

-- inventory
ALTER TABLE `inventory`
  ADD COLUMN IF NOT EXISTS `branch_id` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`,
  ADD KEY IF NOT EXISTS `idx_inv_branch` (`branch_id`);

-- queue
ALTER TABLE `queue`
  ADD COLUMN IF NOT EXISTS `branch_id` TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER `id`,
  ADD KEY IF NOT EXISTS `idx_queue_branch_date` (`branch_id`, `date`);

-- ── Step 3: Create branch_hours table ───────────────────────
CREATE TABLE IF NOT EXISTS `branch_hours` (
  `branch_id`  TINYINT UNSIGNED NOT NULL,
  `day_name`   ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  `open_time`  TIME NOT NULL DEFAULT '09:00:00',
  `close_time` TIME NOT NULL DEFAULT '21:00:00',
  `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`branch_id`, `day_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `branch_hours` (`branch_id`,`day_name`,`open_time`,`close_time`,`is_active`) VALUES
(1,'Mon','09:00','21:00',1),(1,'Tue','09:00','21:00',1),(1,'Wed','09:00','21:00',1),
(1,'Thu','09:00','21:00',1),(1,'Fri','09:00','22:00',1),(1,'Sat','08:00','22:00',1),(1,'Sun','10:00','20:00',1),
(2,'Mon','09:00','21:00',1),(2,'Tue','09:00','21:00',1),(2,'Wed','09:00','21:00',1),
(2,'Thu','09:00','21:00',1),(2,'Fri','09:00','22:00',1),(2,'Sat','08:00','22:00',1),(2,'Sun','10:00','20:00',1)
ON DUPLICATE KEY UPDATE `open_time`=VALUES(`open_time`);

-- ── Step 4: Assign branch_id to existing barbers ─────────────
-- Barbers 1 & 2 → Branch 1 (Kota Bharu)
UPDATE `barbers` SET `branch_id` = 1 WHERE `id` IN (1, 2);
-- Barbers 3 & 4 → Branch 2 (Gua Musang)
UPDATE `barbers` SET `branch_id` = 2 WHERE `id` IN (3, 4);

-- ── Step 5: Assign branch_id to existing inventory ───────────
UPDATE `inventory` SET `branch_id` = 1 WHERE `id` IN (1, 2, 3, 4, 5, 6);
UPDATE `inventory` SET `branch_id` = 2 WHERE `id` IN (7, 8, 9, 10, 11, 12);

-- ── Step 6: All existing appts/transactions → Branch 1 ───────
-- (default — reassign manually if needed)
UPDATE `appointments`  SET `branch_id` = 1 WHERE `branch_id` = 1;
UPDATE `transactions`  SET `branch_id` = 1 WHERE `branch_id` = 1;

-- ── Step 7: Add foreign keys (safe — skip if already exist) ──
ALTER TABLE `barbers`
  ADD CONSTRAINT `fk_barber_branch`  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;
ALTER TABLE `appointments`
  ADD CONSTRAINT `fk_appt_branch`    FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;
ALTER TABLE `transactions`
  ADD CONSTRAINT `fk_trx_branch`     FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;
ALTER TABLE `inventory`
  ADD CONSTRAINT `fk_inv_branch`     FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;
ALTER TABLE `branch_hours`
  ADD CONSTRAINT `fk_hours_branch`   FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

-- ── Step 8: Update settings ───────────────────────────────────
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('tax_rate',            '6'),
('currency',            'RM'),
('low_stock_threshold', '5'),
('receipt_footer',      'Terima kasih kerana memilih HAB Barbershop! Jumpa lagi.'),
('receipt_show_qr',     '1'),
('receipt_show_tax',    '1'),
('theme',               'dark')
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);

-- Remove old single-branch settings that are now per-branch
DELETE FROM `settings` WHERE `setting_key` IN ('shop_name','address','phone','email','instagram');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Upgrade complete. Summary of changes:
--   + New table: branches (2 rows)
--   + New table: branch_hours (14 rows)
--   + Added column: branch_id to barbers, appointments,
--     transactions, transaction_items, inventory, queue
--   + Existing barbers 1-2 → Kota Bharu (branch 1)
--   + Existing barbers 3-4 → Gua Musang (branch 2)
--   + Existing inventory 1-6 → Kota Bharu
--   + Existing inventory 7-12 → Gua Musang
-- ============================================================

-- ── v3: Customer Management ───────────────────────────────────
ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `customer_phone` VARCHAR(20) DEFAULT NULL AFTER `customer`,
  ADD KEY IF NOT EXISTS `idx_trx_customer_phone` (`customer_phone`);

CREATE TABLE IF NOT EXISTS `customers` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `phone`      VARCHAR(20)  NOT NULL,
  `notes`      TEXT DEFAULT NULL,
  `points`     INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
