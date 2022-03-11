import { ICiUserEntity } from "./CiUser.Entity";

export interface ICiEntity {
	ciUid: string
	type: "user" | "shoppinglist" | "product" | "item"
	ciName: string
	ciCreatedAt: Date
	ciUpdatedAt: Date
	ciDeactivatedAt: Date | null
	ciDeactivatedBy: ICiUserEntity["userUid"] | null
	ciDeletedAt: Date | null
	ciDeletedBy: ICiUserEntity["userUid"] | null
	photoId: string | null
}

export type ICiEntityUpdate = Partial<Pick<ICiEntity, "ciName" | "ciDeactivatedAt" | "ciDeactivatedBy" | "ciDeletedAt" | "ciDeletedBy" | "photoId">>;