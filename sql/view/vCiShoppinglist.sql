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
    `ciShoppinglist`.`splUid` AS `splUid`,
    `ciShoppinglist`.`owner` AS `owner`,
    `ciShoppinglist`.`name` AS `name`,
    `ciShoppinglist`.`privacy` AS `privacy`,
    `ciShoppinglist`.`createdAt` AS `createdAt`,
    `ciShoppinglist`.`updatedAt` AS `updatedAt`
from
    (
        `ci`
        join `ciShoppinglist` on(`ci`.`ciUid` = `ciShoppinglist`.`splUid`)
    )