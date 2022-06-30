-- --------------------------------------------------------
-- Host:                         sql01z.fritz.box
-- Server version:               10.3.31-MariaDB-0+deb10u1 - Debian 10
-- Server OS:                    debian-linux-gnu
-- HeidiSQL Version:             11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for eshol
CREATE DATABASE IF NOT EXISTS `esholNew` /*!40100 DEFAULT CHARACTER SET utf8mb4 */;
USE `esholNew`;

-- Dumping structure for table eshol.apitoken
CREATE TABLE IF NOT EXISTS `apitoken` (
  `apitokenUid` char(32) NOT NULL,
  `ciUser_userUid` char(32) NOT NULL,
  `token` char(128) NOT NULL,
  `clientId` char(128) NOT NULL,
  `active` char(1) NOT NULL,
  `useragent` text DEFAULT NULL,
  `customClientname` varchar(128) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`apitokenUid`) USING BTREE,
  KEY `fk_apitoken_ciUser_userUid` (`ciUser_userUid`),
  CONSTRAINT `fk_apitoken_ciUser_userUid` FOREIGN KEY (`ciUser_userUid`) REFERENCES `ciUser` (`userUid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table eshol.ci
CREATE TABLE IF NOT EXISTS `ci` (
  `ciUid` char(32) NOT NULL,
  `type` varchar(16) NOT NULL,
  `ciName` varchar(64) NOT NULL,
  `ciCreatedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `ciUpdatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `ciDeactivatedAt` timestamp NULL DEFAULT NULL,
  `ciDeactivatedBy` char(32) DEFAULT NULL,
  `ciDeletedAt` timestamp NULL DEFAULT NULL,
  `ciDeletedBy` char(32) DEFAULT NULL,
  `photoId` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`ciUid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table eshol.ciItem
CREATE TABLE IF NOT EXISTS `ciItem` (
  `itemUid` char(32) NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(512) DEFAULT NULL,
  `shoppinglist` char(32) NOT NULL COMMENT 'ciShoppinglist_splUid',
  `product` char(32) DEFAULT NULL COMMENT 'ciProduct_productUid',
  `addedBy` char(32) NOT NULL,
  `amount` decimal(20,3) NOT NULL DEFAULT 0.000,
  `amountType` char(4) NOT NULL DEFAULT 'x' COMMENT '"x" | "kilo" ',
  `status` char(16) NOT NULL DEFAULT 'new',
  `buyDate` timestamp NULL DEFAULT NULL,
  `buyer` char(32) DEFAULT NULL,
  `buyAmount` decimal(20,3) DEFAULT NULL,
  `totalPrice` decimal(20,3) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `removedBy` char(32) DEFAULT NULL,
  `removedAt` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`itemUid`),
  KEY `fk_ciItem_shoppinglist_ciShoppinglist_splUid` (`shoppinglist`),
  KEY `fk_ciItem_addedBy_ciUser_userUid` (`addedBy`),
  KEY `fk_ciItem_removedBy_ciUser_userUid` (`removedBy`),
  CONSTRAINT `fk_ciItem_addedBy_ciUser_userUid` FOREIGN KEY (`addedBy`) REFERENCES `ciUser` (`userUid`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_ciItem_itemUid_ci_ciUid` FOREIGN KEY (`itemUid`) REFERENCES `ci` (`ciUid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ciItem_removedBy_ciUser_userUid` FOREIGN KEY (`removedBy`) REFERENCES `ciUser` (`userUid`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ciItem_shoppinglist_ciShoppinglist_splUid` FOREIGN KEY (`shoppinglist`) REFERENCES `ciShoppinglist` (`splUid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table eshol.ciProduct
CREATE TABLE IF NOT EXISTS `ciProduct` (
  `ci_ciUid` char(32) NOT NULL,
  `productUid` char(32) NOT NULL,
  `name` varchar(256) NOT NULL,
  `brand` varchar(128) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `description` text DEFAULT NULL,
  `amountType` char(4) DEFAULT NULL,
  `createdBy` char(32) NOT NULL,
  PRIMARY KEY (`productUid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table eshol.ciShoppinglist
CREATE TABLE IF NOT EXISTS `ciShoppinglist` (
  `splUid` char(32) NOT NULL,
  `name` varchar(64) NOT NULL,
  `owner` char(32) NOT NULL,
  `privacy` char(16) NOT NULL DEFAULT 'private',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`splUid`) USING BTREE,
  KEY `fk_ciShoppinglist_owner_ciUser_userUid` (`owner`),
  CONSTRAINT `fk_ciShoppinglist_owner_ciUser_userUid` FOREIGN KEY (`owner`) REFERENCES `ciUser` (`userUid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ciShoppinglist_splUid_ci_ciUid` FOREIGN KEY (`splUid`) REFERENCES `ci` (`ciUid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table eshol.ciShoppinglistPermission
CREATE TABLE IF NOT EXISTS `ciShoppinglistPermission` (
  `userUid` char(32) NOT NULL,
  `splUid` char(32) NOT NULL,
  `permission` char(32) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`userUid`,`splUid`),
  KEY `fk_ciShoppinglistMember_splUid_ciShoppinglist_splUid` (`splUid`),
  CONSTRAINT `fk_ciShoppinglistMember_splUid_ciShoppinglist_splUid` FOREIGN KEY (`splUid`) REFERENCES `ciShoppinglist` (`splUid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ciShoppinglistMember_userUid_ciUser_userUid` FOREIGN KEY (`userUid`) REFERENCES `ciUser` (`userUid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table eshol.ciUser
CREATE TABLE IF NOT EXISTS `ciUser` (
  `userUid` char(32) NOT NULL,
  `username` char(32) NOT NULL,
  `displayname` varchar(64) NOT NULL,
  `email` varchar(64) NOT NULL,
  `emailVerificationToken` varchar(64) DEFAULT NULL,
  `pwresetToken` varchar(128) DEFAULT NULL,
  `role` varchar(32) NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`userUid`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `fk_ciUser_userUid_ci_ciUid` FOREIGN KEY (`userUid`) REFERENCES `ci` (`ciUid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table eshol.pwresettoken
CREATE TABLE IF NOT EXISTS `pwresettoken` (
  `token` char(128) NOT NULL,
  `userUid` char(32) NOT NULL,
  `used` char(1) NOT NULL DEFAULT 'N' COMMENT 'Y | N',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`token`),
  KEY `fk_pwresetToken_ciUser_userUid` (`userUid`),
  CONSTRAINT `fk_pwresetToken_ciUser_userUid` FOREIGN KEY (`userUid`) REFERENCES `ciUser` (`userUid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table eshol.userpasswd
CREATE TABLE IF NOT EXISTS `userpasswd` (
  `passwdId` int(11) NOT NULL AUTO_INCREMENT,
  `ciUser_userUid` char(32) NOT NULL,
  `pwhash` varchar(256) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`passwdId`) USING BTREE,
  KEY `fk_userpassword_ciUser_userUid` (`ciUser_userUid`),
  CONSTRAINT `fk_userpassword_ciUser_userUid` FOREIGN KEY (`ciUser_userUid`) REFERENCES `ciUser` (`userUid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for view eshol.vCiItem
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vCiItem` (
	`ciUid` CHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`type` VARCHAR(16) NOT NULL COLLATE 'utf8mb4_general_ci',
	`ciName` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci',
	`ciCreatedAt` TIMESTAMP NOT NULL,
	`ciUpdatedAt` TIMESTAMP NOT NULL,
	`ciDeletedAt` TIMESTAMP NULL,
	`ciDeletedBy` CHAR(32) NULL COLLATE 'utf8mb4_general_ci',
	`photoId` VARCHAR(128) NULL COLLATE 'utf8mb4_general_ci',
	`itemUid` CHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`name` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci',
	`description` VARCHAR(512) NULL COLLATE 'utf8mb4_general_ci',
	`shoppinglist` CHAR(32) NOT NULL COMMENT 'ciShoppinglist_splUid' COLLATE 'utf8mb4_general_ci',
	`product` CHAR(32) NULL COMMENT 'ciProduct_productUid' COLLATE 'utf8mb4_general_ci',
	`addedBy` CHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`amount` DECIMAL(20,3) NOT NULL,
	`amountType` CHAR(4) NOT NULL COMMENT '"x" | "kilo" ' COLLATE 'utf8mb4_general_ci',
	`status` CHAR(16) NOT NULL COLLATE 'utf8mb4_general_ci',
	`buyDate` TIMESTAMP NULL,
	`buyer` CHAR(32) NULL COLLATE 'utf8mb4_general_ci',
	`buyAmount` DECIMAL(20,3) NULL,
	`totalPrice` DECIMAL(20,3) NULL,
	`createdAt` TIMESTAMP NOT NULL,
	`updatedAt` TIMESTAMP NOT NULL,
	`removedAt` TIMESTAMP NULL,
	`removedBy` CHAR(32) NULL COLLATE 'utf8mb4_general_ci',
	`privacy` VARCHAR(16) NULL COLLATE 'utf8mb4_general_ci'
) ENGINE=MyISAM;

-- Dumping structure for view eshol.vCiShoppinglist
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vCiShoppinglist` (
	`ciUid` CHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`type` VARCHAR(16) NOT NULL COLLATE 'utf8mb4_general_ci',
	`ciName` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci',
	`ciCreatedAt` TIMESTAMP NOT NULL,
	`ciUpdatedAt` TIMESTAMP NOT NULL,
	`ciDeactivatedAt` TIMESTAMP NULL,
	`ciDeactivatedBy` CHAR(32) NULL COLLATE 'utf8mb4_general_ci',
	`ciDeletedAt` TIMESTAMP NULL,
	`ciDeletedBy` CHAR(32) NULL COLLATE 'utf8mb4_general_ci',
	`photoId` VARCHAR(128) NULL COLLATE 'utf8mb4_general_ci',
	`splUid` CHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`owner` CHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`name` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci',
	`privacy` CHAR(16) NOT NULL COLLATE 'utf8mb4_general_ci',
	`createdAt` TIMESTAMP NOT NULL,
	`updatedAt` TIMESTAMP NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view eshol.vCiUser
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `vCiUser` (
	`ciUid` CHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`type` VARCHAR(16) NOT NULL COLLATE 'utf8mb4_general_ci',
	`ciName` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci',
	`ciCreatedAt` TIMESTAMP NOT NULL,
	`ciUpdatedAt` TIMESTAMP NOT NULL,
	`ciDeactivatedAt` TIMESTAMP NULL,
	`ciDeactivatedBy` CHAR(32) NULL COLLATE 'utf8mb4_general_ci',
	`ciDeletedAt` TIMESTAMP NULL,
	`ciDeletedBy` CHAR(32) NULL COLLATE 'utf8mb4_general_ci',
	`photoId` VARCHAR(128) NULL COLLATE 'utf8mb4_general_ci',
	`userUid` CHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`username` CHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`displayname` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci',
	`email` VARCHAR(64) NOT NULL COLLATE 'utf8mb4_general_ci',
	`emailVerificationToken` VARCHAR(64) NULL COLLATE 'utf8mb4_general_ci',
	`role` VARCHAR(32) NOT NULL COLLATE 'utf8mb4_general_ci',
	`createdAt` TIMESTAMP NOT NULL,
	`updatedAt` TIMESTAMP NOT NULL
) ENGINE=MyISAM;

-- Dumping structure for view eshol.vCiItem
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vCiItem`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vCiItem` AS select `ci`.`ciUid` AS `ciUid`,`ci`.`type` AS `type`,`ci`.`ciName` AS `ciName`,`ci`.`ciCreatedAt` AS `ciCreatedAt`,`ci`.`ciUpdatedAt` AS `ciUpdatedAt`,`ci`.`ciDeletedAt` AS `ciDeletedAt`,`ci`.`ciDeletedBy` AS `ciDeletedBy`,`ci`.`photoId` AS `photoId`,`ciItem`.`itemUid` AS `itemUid`,`ciItem`.`name` AS `name`,`ciItem`.`description` AS `description`,`ciItem`.`shoppinglist` AS `shoppinglist`,`ciItem`.`product` AS `product`,`ciItem`.`addedBy` AS `addedBy`,`ciItem`.`amount` AS `amount`,`ciItem`.`amountType` AS `amountType`,`ciItem`.`status` AS `status`,`ciItem`.`buyDate` AS `buyDate`,`ciItem`.`buyer` AS `buyer`,`ciItem`.`buyAmount` AS `buyAmount`,`ciItem`.`totalPrice` AS `totalPrice`,`ciItem`.`createdAt` AS `createdAt`,`ciItem`.`updatedAt` AS `updatedAt`,`ciItem`.`removedAt` AS `removedAt`,`ciItem`.`removedBy` AS `removedBy`,(select `ciShoppinglist`.`privacy` from `ciShoppinglist` where `ciShoppinglist`.`splUid` = `ciItem`.`shoppinglist`) AS `privacy` from (`ci` join `ciItem` on(`ci`.`ciUid` = `ciItem`.`itemUid`));

-- Dumping structure for view eshol.vCiShoppinglist
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vCiShoppinglist`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vCiShoppinglist` AS select `ci`.`ciUid` AS `ciUid`,`ci`.`type` AS `type`,`ci`.`ciName` AS `ciName`,`ci`.`ciCreatedAt` AS `ciCreatedAt`,`ci`.`ciUpdatedAt` AS `ciUpdatedAt`,`ci`.`ciDeactivatedAt` AS `ciDeactivatedAt`,`ci`.`ciDeactivatedBy` AS `ciDeactivatedBy`,`ci`.`ciDeletedAt` AS `ciDeletedAt`,`ci`.`ciDeletedBy` AS `ciDeletedBy`,`ci`.`photoId` AS `photoId`,`ciShoppinglist`.`splUid` AS `splUid`,`ciShoppinglist`.`owner` AS `owner`,`ciShoppinglist`.`name` AS `name`,`ciShoppinglist`.`privacy` AS `privacy`,`ciShoppinglist`.`createdAt` AS `createdAt`,`ciShoppinglist`.`updatedAt` AS `updatedAt` from (`ci` join `ciShoppinglist` on(`ci`.`ciUid` = `ciShoppinglist`.`splUid`));

-- Dumping structure for view eshol.vCiUser
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `vCiUser`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `vCiUser` AS select `ci`.`ciUid` AS `ciUid`,`ci`.`type` AS `type`,`ci`.`ciName` AS `ciName`,`ci`.`ciCreatedAt` AS `ciCreatedAt`,`ci`.`ciUpdatedAt` AS `ciUpdatedAt`,`ci`.`ciDeactivatedAt` AS `ciDeactivatedAt`,`ci`.`ciDeactivatedBy` AS `ciDeactivatedBy`,`ci`.`ciDeletedAt` AS `ciDeletedAt`,`ci`.`ciDeletedBy` AS `ciDeletedBy`,`ci`.`photoId` AS `photoId`,`ciUser`.`userUid` AS `userUid`,`ciUser`.`username` AS `username`,`ciUser`.`displayname` AS `displayname`,`ciUser`.`email` AS `email`,`ciUser`.`emailVerificationToken` AS `emailVerificationToken`,`ciUser`.`role` AS `role`,`ciUser`.`createdAt` AS `createdAt`,`ciUser`.`updatedAt` AS `updatedAt` from (`ci` join `ciUser` on(`ci`.`ciUid` = `ciUser`.`userUid`));

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
