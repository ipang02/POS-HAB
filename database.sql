-- ============================================================
-- HAB Barbershop POS System — MySQL Schema v2 (Multi-Branch)
-- Import: Hostinger Panel → phpMyAdmin → Select DB → Import
-- Database: u929568672_hab  |  Region: Kelantan, Malaysia
-- Currency: MYR (RM)  |  Tax: SST 6%  |  Branches: 2
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Table: branches ──────────────────────────────────────────
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

-- ── Table: services ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `services` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100) NOT NULL,
  `price`       DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
  `duration`    SMALLINT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'minutes',
  `cat`         ENUM('hair','beard','treatment','package') NOT NULL DEFAULT 'hair',
  `icon`        VARCHAR(60) NOT NULL DEFAULT 'fa-scissors',
  `description` VARCHAR(255) DEFAULT NULL,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Table: barbers ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `barbers` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `name`        VARCHAR(100) NOT NULL,
  `initials`    CHAR(3)  NOT NULL,
  `color`       CHAR(7)  NOT NULL DEFAULT '#374151',
  `status`      ENUM('available','busy','off') NOT NULL DEFAULT 'available',
  `skills`      JSON DEFAULT NULL,
  `commission`  TINYINT UNSIGNED NOT NULL DEFAULT 30 COMMENT 'percent',
  `phone`       VARCHAR(20) DEFAULT NULL,
  `is_active`   TINYINT(1) NOT NULL DEFAULT 1,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_barber_branch` (`branch_id`),
  CONSTRAINT `fk_barber_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Table: appointments ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `appointments` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `customer`    VARCHAR(100) NOT NULL,
  `phone`       VARCHAR(20)  DEFAULT NULL,
  `barber_id`   INT UNSIGNED DEFAULT NULL,
  `service_id`  INT UNSIGNED DEFAULT NULL,
  `date`        DATE NOT NULL,
  `time`        TIME NOT NULL,
  `status`      ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  `notes`       TEXT DEFAULT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_appt_branch` (`branch_id`),
  KEY `idx_appt_date`   (`date`),
  KEY `idx_appt_status` (`status`),
  CONSTRAINT `fk_appt_branch`  FOREIGN KEY (`branch_id`)  REFERENCES `branches`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_appt_barber`  FOREIGN KEY (`barber_id`)  REFERENCES `barbers`   (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appt_service` FOREIGN KEY (`service_id`) REFERENCES `services`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Table: transactions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS `transactions` (
  `id`          VARCHAR(30) NOT NULL,
  `branch_id`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `customer`    VARCHAR(100) NOT NULL DEFAULT 'Walk-in',
  `barber_id`   INT UNSIGNED DEFAULT NULL,
  `discount`    TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'percent',
  `tax`         TINYINT UNSIGNED NOT NULL DEFAULT 6  COMMENT 'percent',
  `total`       DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
  `method`      ENUM('cash','card','qr') NOT NULL DEFAULT 'cash',
  `tendered`    DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
  `date`        DATE NOT NULL,
  `time`        TIME NOT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_trx_branch` (`branch_id`),
  KEY `idx_trx_date`   (`date`),
  CONSTRAINT `fk_trx_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_trx_barber` FOREIGN KEY (`barber_id`) REFERENCES `barbers`  (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Table: transaction_items ─────────────────────────────────
CREATE TABLE IF NOT EXISTS `transaction_items` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `transaction_id` VARCHAR(30) NOT NULL,
  `item_type`      ENUM('service','product') NOT NULL DEFAULT 'service',
  `item_name`      VARCHAR(100) NOT NULL,
  `qty`            TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `price`          DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_item_trx` (`transaction_id`),
  CONSTRAINT `fk_item_trx` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Table: inventory ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `inventory` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `name`        VARCHAR(150) NOT NULL,
  `cat`         ENUM('styling','haircare','shaving','tools','beard') NOT NULL DEFAULT 'styling',
  `stock`       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `min_stock`   SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  `price`       DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
  `unit`        VARCHAR(20) NOT NULL DEFAULT 'pcs',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inv_branch` (`branch_id`),
  CONSTRAINT `fk_inv_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Table: queue ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `queue` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `name`        VARCHAR(100) NOT NULL,
  `service`     VARCHAR(100) DEFAULT NULL,
  `time`        TIME NOT NULL,
  `date`        DATE NOT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_queue_branch_date` (`branch_id`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Table: branch_hours ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `branch_hours` (
  `branch_id`  TINYINT UNSIGNED NOT NULL,
  `day_name`   ENUM('Mon','Tue','Wed','Thu','Fri','Sat','Sun') NOT NULL,
  `open_time`  TIME NOT NULL DEFAULT '09:00:00',
  `close_time` TIME NOT NULL DEFAULT '21:00:00',
  `is_active`  TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`branch_id`, `day_name`),
  CONSTRAINT `fk_hours_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Table: settings ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key`   VARCHAR(80)  NOT NULL,
  `setting_value` TEXT         DEFAULT NULL,
  `updated_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Branches
INSERT INTO `branches` (`id`,`name`,`short_name`,`address`,`phone`,`email`,`instagram`) VALUES
(1, 'Kota Bharu', 'KB', 'No. 12, Jalan Sultan Yahya Petra, 15000 Kota Bharu, Kelantan', '09-748 1234', 'kotabharu@habbarbershop.com.my',  '@habbarbershop.kb'),
(2, 'Kedai Lalat', 'KL', 'No. 3, Pekan Kedai Lalat, Kelantan',                          '09-912 3456', 'kedailalat@habbarbershop.com.my', '@habbarbershop.kl')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Services (global — shared across all branches)
INSERT INTO `services` (`id`,`name`,`price`,`duration`,`cat`,`icon`,`description`) VALUES
(1,  'Haircut',         20.00, 45,  'hair',      'fa-scissors',          'Classic & modern cuts'),
(2,  'Beard Trim',      12.00, 30,  'beard',     'fa-face-grin-beam',    'Shape & clean your beard'),
(3,  'Hair Wash',        8.00, 20,  'hair',      'fa-shower',            'Shampoo & conditioning'),
(4,  'Hair Coloring',   80.00, 90,  'treatment', 'fa-palette',           'Full color treatment'),
(5,  'Kids Haircut',    15.00, 30,  'hair',      'fa-child',             'For kids under 12 yrs'),
(6,  'Hot Towel Shave', 18.00, 40,  'beard',     'fa-fire-flame-curved', 'Traditional wet shave'),
(7,  'Hair Treatment',  45.00, 60,  'treatment', 'fa-spa',               'Keratin & deep repair'),
(8,  'Full Package',    88.00, 120, 'package',   'fa-crown',             'Haircut + Beard + Wash'),
(9,  'Eyebrow Trim',     8.00, 15,  'beard',     'fa-eye',               'Define & shape brows'),
(10, 'Hair Styling',    15.00, 30,  'hair',      'fa-wind',              'Pomade finish & styling')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `price`=VALUES(`price`);

-- Barbers — Branch 1: Kota Bharu
INSERT INTO `barbers` (`id`,`branch_id`,`name`,`initials`,`color`,`status`,`skills`,`commission`,`phone`) VALUES
(1, 1, 'Razif Hakim',      'RH', '#6366f1', 'available', '["Fade","Pompadour","Beard Styling"]',     30, '019-3456789'),
(2, 1, 'Hafizuddin Azmi',  'HA', '#f59e0b', 'busy',      '["Classic Cut","Hair Coloring","Keratin"]', 30, '011-23456789')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `branch_id`=VALUES(`branch_id`);

-- Barbers — Branch 2: Gua Musang
INSERT INTO `barbers` (`id`,`branch_id`,`name`,`initials`,`color`,`status`,`skills`,`commission`,`phone`) VALUES
(3, 2, 'Amran bin Yusof',  'AY', '#22c55e', 'available', '["Modern Style","Undercut","Kids Cut"]',   25, '017-8901234'),
(4, 2, 'Shahrul Nizam',    'SN', '#ec4899', 'off',       '["Traditional Shave","Eyebrow Trim"]',     25, '013-4567890')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `branch_id`=VALUES(`branch_id`);

-- Inventory — Branch 1: Kota Bharu
INSERT INTO `inventory` (`id`,`branch_id`,`name`,`cat`,`stock`,`min_stock`,`price`,`unit`) VALUES
(1,  1, 'Pomade Strong Hold',   'styling',  12, 5,  25.00, 'pcs'),
(2,  1, 'Barber Scissors Pro',  'tools',    3,  5,  85.00, 'pcs'),
(3,  1, 'Shaving Foam',         'shaving',  8,  3,  15.00, 'pcs'),
(4,  1, 'Hair Clipper Wahl',    'tools',    2,  3, 150.00, 'unit'),
(5,  1, 'Conditioner L\'Oreal', 'haircare', 15, 5,  22.00, 'btl'),
(6,  1, 'Shampoo Kerastase',    'haircare', 10, 5,  28.00, 'btl')
ON DUPLICATE KEY UPDATE `branch_id`=VALUES(`branch_id`), `stock`=VALUES(`stock`);

-- Inventory — Branch 2: Gua Musang
INSERT INTO `inventory` (`id`,`branch_id`,`name`,`cat`,`stock`,`min_stock`,`price`,`unit`) VALUES
(7,  2, 'Hair Wax Matt',        'styling',  20, 8,  18.00, 'pcs'),
(8,  2, 'Razor Blades 100pcs',  'shaving',  4,  10, 12.00, 'box'),
(9,  2, 'Barber Cape',          'tools',    6,  3,  40.00, 'pcs'),
(10, 2, 'Hair Spray',           'styling',  7,  5,  16.00, 'pcs'),
(11, 2, 'Neck Strip Roll',      'tools',    2,  5,   8.00, 'roll'),
(12, 2, 'Beard Oil Premium',    'beard',    9,  4,  35.00, 'btl')
ON DUPLICATE KEY UPDATE `branch_id`=VALUES(`branch_id`), `stock`=VALUES(`stock`);

-- Branch Hours — Kota Bharu
INSERT INTO `branch_hours` (`branch_id`,`day_name`,`open_time`,`close_time`,`is_active`) VALUES
(1,'Mon','09:00','21:00',1),(1,'Tue','09:00','21:00',1),(1,'Wed','09:00','21:00',1),
(1,'Thu','09:00','21:00',1),(1,'Fri','09:00','22:00',1),(1,'Sat','08:00','22:00',1),(1,'Sun','10:00','20:00',1)
ON DUPLICATE KEY UPDATE `open_time`=VALUES(`open_time`), `close_time`=VALUES(`close_time`);

-- Branch Hours — Gua Musang
INSERT INTO `branch_hours` (`branch_id`,`day_name`,`open_time`,`close_time`,`is_active`) VALUES
(2,'Mon','09:00','21:00',1),(2,'Tue','09:00','21:00',1),(2,'Wed','09:00','21:00',1),
(2,'Thu','09:00','21:00',1),(2,'Fri','09:00','22:00',1),(2,'Sat','08:00','22:00',1),(2,'Sun','10:00','20:00',1)
ON DUPLICATE KEY UPDATE `open_time`=VALUES(`open_time`), `close_time`=VALUES(`close_time`);

-- Global Settings
INSERT INTO `settings` (`setting_key`, `setting_value`) VALUES
('tax_rate',            '6'),
('currency',            'RM'),
('low_stock_threshold', '5'),
('receipt_footer',      'Terima kasih kerana memilih HAB Barbershop! Jumpa lagi.'),
('receipt_show_qr',     '1'),
('receipt_show_tax',    '1'),
('theme',               'dark')
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Tables created:
--   branches, services, barbers, appointments, transactions,
--   transaction_items, inventory, queue, branch_hours, settings
-- ============================================================

-- ── Table: app_data (blob store for POS config data) ─────────
CREATE TABLE IF NOT EXISTS `app_data` (
  `data_key`   VARCHAR(80)  NOT NULL,
  `data_value` LONGTEXT     NOT NULL,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`data_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Schema patches (MySQL 8.0.3+ required for IF NOT EXISTS on ALTER) ───
ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `customer_phone` VARCHAR(20) DEFAULT NULL AFTER `customer`;

ALTER TABLE `transaction_items`
  ADD COLUMN IF NOT EXISTS `commission_rm` DECIMAL(8,2) UNSIGNED DEFAULT NULL;
