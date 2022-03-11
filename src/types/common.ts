import { ICiUserEntity } from "./db/CiUser.Entity";

export interface ILoginBody {
	loginname: ICiUserEntity["username"] | ICiUserEntity["email"]
	password: string
}