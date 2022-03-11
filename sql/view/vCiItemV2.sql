select
    `ci`.`ciUid` AS `ciUid`,
    `ci`.`type` AS `type`,
    `ci`.`ciName` AS `ciName`,
    `ci`.`ciCreatedAt` AS `ciCreatedAt`,
    `ci`.`ciUpdatedAt` AS `ciUpdatedAt`,
    `ci`.`ciDeletedAt` AS `ciDeletedAt`,
    `ci`.`ciDeletedBy` AS `ciDeletedBy`,
    `ci`.`photoId` AS `photoId`,
    `ciItem`.`itemIdx` AS `itemIdx`,
    `ciItem`.`ci_ciUid` AS `ci_ciUid`,
    `ciItem`.`itemUid` AS `itemUid`,
    `ciItem`.`name` AS `name`,
    `ciItem`.`description` AS `description`,
    `ciItem`.`shoppinglist` AS `shoppinglist`,
    `ciItem`.`product` AS `product`,
    `ciItem`.`addedBy` AS `addedBy`,
    `ciItem`.`amount` AS `amount`,
    `ciItem`.`amountType` AS `amountType`,
    `ciItem`.`status` AS `status`,
    `ciItem`.`buyDate` AS `buyDate`,
    `ciItem`.`buyer` AS `buyer`,
    `ciItem`.`buyAmount` AS `buyAmount`,
    `ciItem`.`totalPrice` AS `totalPrice`,
    `ciItem`.`createdAt` AS `createdAt`,
    `ciItem`.`updatedAt` AS `updatedAt`,
    `ciShoppinglist`.`privacy` as `privacy` 
from
    (
        `ci`
        join `ciItem` on(`ci`.`ciUid` = `ciItem`.`ci_ciUid`)
        join `ciShoppinglist` on(`ciShoppinglist`.`splUid` = `ciItem`.`shoppinglist`)
    )