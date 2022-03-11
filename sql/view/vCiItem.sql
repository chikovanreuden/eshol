select
    `ci`.`ciUid` AS `ciUid`,
    `ci`.`type` AS `type`,
    `ci`.`ciName` AS `ciName`,
    `ci`.`ciCreatedAt` AS `ciCreatedAt`,
    `ci`.`ciUpdatedAt` AS `ciUpdatedAt`,
    `ci`.`ciDeletedAt` AS `ciDeletedAt`,
    `ci`.`ciDeletedBy` AS `ciDeletedBy`,
    `ci`.`photoId` AS `photoId`,
    `eshol`.`ciItem`.`itemUid` AS `itemUid`,
    `eshol`.`ciItem`.`name` AS `name`,
    `eshol`.`ciItem`.`description` AS `description`,
    `eshol`.`ciItem`.`shoppinglist` AS `shoppinglist`,
    `eshol`.`ciItem`.`product` AS `product`,
    `eshol`.`ciItem`.`addedBy` AS `addedBy`,
    `eshol`.`ciItem`.`amount` AS `amount`,
    `eshol`.`ciItem`.`amountType` AS `amountType`,
    `eshol`.`ciItem`.`status` AS `status`,
    `eshol`.`ciItem`.`buyDate` AS `buyDate`,
    `eshol`.`ciItem`.`buyer` AS `buyer`,
    `eshol`.`ciItem`.`buyAmount` AS `buyAmount`,
    `eshol`.`ciItem`.`totalPrice` AS `totalPrice`,
    `eshol`.`ciItem`.`createdAt` AS `createdAt`,
    `eshol`.`ciItem`.`updatedAt` AS `updatedAt`,
    (
        select
            `ciShoppinglist`.`privacy`
        from
            `ciShoppinglist`
        where
            `ciShoppinglist`.`splUid` = `ciItem`.`shoppinglist`
    ) AS `privacy`
from
    (
        `ci`
        join `ciItem` on(`ci`.`ciUid` = `ciItem`.`itemUid`)
    )