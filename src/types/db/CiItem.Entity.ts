import { ICiProductEntity } from "./CiProduct.Entity";
import { ICiShoppinglistEntity } from "./CiShoppinglist.Entity";
import { ICiUserEntity } from "./CiUser.Entity";

export interface ICiItemEntity{
	itemUid: string
	name: string
	description: string | null
	shoppinglist: ICiShoppinglistEntity["splUid"]
	product: ICiProductEntity["productUid"] | null
	addedBy: ICiUserEntity["userUid"]
	amount: number
	amountType: "x" | "kilo" | "g" | "ml" | "l"
	status: "new" | "reserved" | "done"
	buyDate: Date | null
	buyer: ICiUserEntity["userUid"] | null
	buyAmount: number | null
	totalPrice: number | null
	createdAt: Date
	updatedAt: Date
}

export interface ICiItemEntityNew {
	itemUid: ICiItemEntity["itemUid"]
	name: ICiItemEntity["name"]
	description?: ICiItemEntity["description"]
	shoppinglist: ICiItemEntity["shoppinglist"]
	product?: ICiItemEntity["product"]
	addedBy: ICiItemEntity["addedBy"]
	amount: ICiItemEntity["amount"]
	amountType: ICiItemEntity["amountType"]
}

export interface ICiItemEntityCreate {
	name: ICiItemEntity["name"]
	description?: ICiItemEntity["description"]
	shoppinglist: ICiItemEntity["shoppinglist"]
	product?: ICiItemEntity["product"]
	amount: ICiItemEntity["amount"]
	amountType: ICiItemEntity["amountType"]
};

export interface ICiItemEntityBuy {
	buyDate?: ICiItemEntity["buyDate"]
	buyAmount: ICiItemEntity["buyAmount"]
	totalPrice: ICiItemEntity["totalPrice"]
};

export type ICiItemEntityUpdate = Partial<Pick<ICiItemEntity, "name" | "description" | "product" | "amount" | "amountType">>;