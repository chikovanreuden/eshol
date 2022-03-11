select
    `ci`.`ciUid` AS `ciUid`,
    `ci`.`type` AS `type`,
    `ci`.`ciName` AS `ciName`,
    `ci`.`ciCreatedAt` AS `ciCreatedAt`,
    `ci`.`ciUpdatedAt` AS `ciUpdatedAt`,
    `ci`.`ciDeactivatedAt` AS `ciDeactivatedAt`,
    `ci`.`ciDeactivatedBy` AS `ciDeactivatedBy`,
    `ci`.`ciDeletedAt` AS `ciDeletedAt`,
    `ci`.`ciDeletedBy` AS `ciDeletedBy`,
    `ci`.`photoId` AS `photoId`,
    `ciUser`.`userUid` AS `userUid`,
    `ciUser`.`username` AS `username`,
    `ciUser`.`displayname` AS `displayname`,
    `ciUser`.`email` AS `email`,
    `ciUser`.`emailVerificationToken` AS `emailVerificationToken`,
    `ciUser`.`role` AS `role`,
    `ciUser`.`createdAt` AS `createdAt`,
    `ciUser`.`updatedAt` AS `updatedAt`
from
    (
        `ci`
        join `ciUser` on(`ci`.`ciUid` = `ciUser`.`userUid`)
    )