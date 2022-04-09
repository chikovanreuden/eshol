import { ICiShoppinglistEntity } from "./CiShoppinglist.Entity";
import { ICiUserEntity } from "./CiUser.Entity";

export interface ICiShoppinglistPermissionEntity {
	userUid: ICiUserEntity["userUid"]
	splUid: ICiShoppinglistEntity["splUid"]
	permission: "rw" | "r"
	createdAt: Date
	updatedAt: Date
}

export type ICiShoppinglistPermissionEntityNew = Pick<ICiShoppinglistPermissionEntity, "splUid" | "userUid" | "permission">;
export type ICiShoppinglistPermissionEntityCreate = Pick<ICiShoppinglistPermissionEntity, "splUid" | "userUid" | "permission">;
export type ICiShoppinglistPermissionEntityUpdate = Pick<ICiShoppinglistPermissionEntity, "permission">;