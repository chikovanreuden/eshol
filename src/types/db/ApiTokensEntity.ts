import { ICiUserEntity } from "./CiUser.Entity";

export interface IApiTokenEntity {
	apitokenUid: string
	ciUser_userUid: ICiUserEntity["userUid"]
	token: string
	clientId: string
	active: "Y" | "N"
	useragent: string | null
	customClientname: string | null
	createdAt: Date
	updatedAt: Date
}

export type IApiTokenEntityNew = Pick<IApiTokenEntity, "apitokenUid" | "ciUser_userUid" | "token" | "clientId" | "active">;
export type IApiTokenEntityUpdate = Partial<Pick<IApiTokenEntity, "customClientname" | "active">>;