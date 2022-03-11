export interface ICiUserEntity {
	userUid: string
	username: string
	displayname: string
	email: string
	emailVerificationToken: string | null
	pwresetToken: string | null
	role: "system" | "admin" | "moderator" | "user" | "guest"
	createdAt: Date
	updatedAt: Date
}
export type ICiUserEntityNew = Pick<ICiUserEntity, | "userUid" | "displayname" | "email" | "username" | "emailVerificationToken" | "role" >;

export type ICiUserEntityRegister = {
	username: ICiUserEntity["username"]
	email: ICiUserEntity["email"]
	displayname?: ICiUserEntity["displayname"]
	password: string
};

export type ICiUserEntityUpdate = Partial<Pick<ICiUserEntity, "username" | "displayname" | "email" | "role">>;

export type ICiUserEntityUpdateSelf = Partial<Pick<ICiUserEntity, "displayname">>;