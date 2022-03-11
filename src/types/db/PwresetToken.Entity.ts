import { ICiUserEntity } from "./CiUser.Entity";

export interface IPwresetTokenEntity {
	token: string
	userUid: ICiUserEntity["userUid"]
	used: "Y" | "N"
	createdAt: Date
	updatedAt: Date
}

export type IPwresetTokenEntityCreate = Pick<IPwresetTokenEntity, "token" | "userUid">;

export type IPwresetTokenEntityNew = Pick<IPwresetTokenEntity, "token" | "userUid">;

export type IPwresetTokenEntityUpdate = Pick<IPwresetTokenEntity, "used">;