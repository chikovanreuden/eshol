import { ICiUserEntity } from "./CiUser.Entity";

export interface ICiShoppinglistEntity {
	splUid: string
	owner: ICiUserEntity["userUid"]
	name: string
	privacy: "public" | "private"
	createdAt: Date
	updatedAt: Date
}

export type ICiShoppinglistEntityUpdate = Partial<Pick<ICiShoppinglistEntity, "name" | "privacy" >>;
export type ICiShoppinglistEntityCreate = Pick<ICiShoppinglistEntity, "name" | "privacy" | "owner">;