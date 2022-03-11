export interface IUserpasswdEntity {
	passwdId: number
	ciUser_userUid: string
	pwhash: string
	created: Date
	updated: Date
}

export type IUserpasswdEntityNew = Pick<IUserpasswdEntity, "ciUser_userUid" | "pwhash">;