import { ICiShoppinglistEntity } from "./CiShoppinglist.Entity";
import { ICiUserEntity } from "./CiUser.Entity";

export interface ICiShoppinglistMemberEntity {
	userUid: ICiUserEntity["userUid"]
	splUid: ICiShoppinglistEntity["splUid"]
	permission: "rw" | "r"
	createdAt: Date
	updatedAt: Date
}

export type ICiShoppinglistMemberEntityNew = Pick<ICiShoppinglistMemberEntity, "splUid" | "userUid" | "permission">;
export type ICiShoppinglistMemberEntityCreate = Pick<ICiShoppinglistMemberEntity, "splUid" | "userUid" | "permission">;
export type ICiShoppinglistMemberEntityUpdate = Pick<ICiShoppinglistMemberEntity, "permission">;