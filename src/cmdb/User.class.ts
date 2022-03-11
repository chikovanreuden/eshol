import { OkPacket } from "mysql2";
import * as CMDB from "./index";
import WLOGGER from "../wlogger";
import dbp from "../db";
import * as pw from "../pw";
import * as id from "../id";

import { Ci, IBaseCi, ApiToken} from "./index";
import { Shoppinglist } from "./index";
import { ICiUserEntity, ICiUserEntityNew, ICiUserEntityRegister, ICiUserEntityUpdate, } from "../types/db/CiUser.Entity";
import { IUserpasswdEntity } from "../types/db/UserPwSafe.Entity";
import { VCiUserEntity } from "../types/db/VCiUser.Entity";
import { IRowCount } from "../types/db/Count.Entity";
import username_disallow from "../username_disallow";
import { VCiShoppinglistEntity } from "../types/db/VCiShoppinglist.Entity";
import { ICiShoppinglistMemberEntity } from "../types/db/CiShoppinglistMember.Entity";
import Visibility from "../types/Vis";
import { getLinkPublic } from "../lib/links";
import { sendEmailVerificationConfirmed, sendEmailVerificationToken } from "../mailer";

type UserShoppinglistPermission = {
	permission: ICiShoppinglistMemberEntity["permission"] | "owner"
	spl: Shoppinglist
};

const userPrivateData = new WeakMap<any, ICiUserEntity>();

export class User extends Ci implements IBaseCi, VCiUserEntity {
	private internal = (): ICiUserEntity => {
		const val = userPrivateData.get(this);
		if(val) return val;
		else throw new Error("Error in User.class.ts:internal() -> Key 'this' does not exist");
	};
	constructor(vciuser: VCiUserEntity){
		super(vciuser);
		const {
			userUid,
			username,
			displayname,
			email,
			emailVerificationToken,
			pwresetToken,
			role,
			createdAt,
			updatedAt
		}: ICiUserEntity = vciuser;
		userPrivateData.set(this, {
			userUid,
			username,
			displayname,
			email,
			emailVerificationToken,
			pwresetToken,
			role,
			createdAt,
			updatedAt
		});
		this.syncronized = true;
	}
	get username(): ICiUserEntity["username"]{ return this.internal().username; }
	get userUid(): ICiUserEntity["userUid"]{ return this.internal().userUid; }
	get email(): ICiUserEntity["email"]{ return this.internal().email; }
	get emailVerified(): boolean{
		return this.emailVerificationToken === null ? true : false;
	}
	get emailVerificationToken(): ICiUserEntity["emailVerificationToken"] { return this.internal().emailVerificationToken; }
	get pwresetToken(): ICiUserEntity["pwresetToken"] { return this.internal().pwresetToken; }
	get displayname(): ICiUserEntity["displayname"]{ return this.internal().displayname; }
	get role(): ICiUserEntity["role"] { return this.internal().role; }
	async setRole(role: ICiUserEntity["role"]): Promise<void>{
		const dbcon = await dbp.getConnection();
		await dbcon.beginTransaction();
		try{
			const query = await dbcon.query("UPDATE `eshol`.`ciUser` SET `role` = ? WHERE `userUid` = BINARY ?;", [role, this.userUid]);
			const rows = query[0] as OkPacket;
			if(rows.affectedRows === 1){
				await dbcon.commit();
				await this.sync();
				return;
			}else{
				throw new Error("User.setRole(), affectedRows !== 1");
			}
		}catch(err){
			await dbcon.rollback();
			WLOGGER.error("DB Query, Transaction Error", {
				filename: __filename,
				function: "User.setRole",
				err,
				params: {
					userUid: this.userUid,
					role
				}
			});
			throw err;
		}finally{
			dbcon.release();
		}
	}
	get isVerified(): boolean { return this.internal().emailVerificationToken === null ? true : false; }
	get createdAt(): ICiUserEntity["createdAt"]{ return this.internal().createdAt; }
	get updatedAt(): ICiUserEntity["updatedAt"]{ return this.internal().updatedAt; }

	async getShoppinglistsOwnedAsync(): Promise<Shoppinglist[]>{
		return Shoppinglist.findManyByOwner(this);
	};

	async getShoppinglistsAsync(): Promise<Shoppinglist[]>{
		const owned = await this.getShoppinglistsOwnedAsync();
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiShoppinglist` WHERE `splUid` IN (SELECT `splUid` FROM `eshol`.`ciShoppinglistMember` WHERE `userUid` = BINARY ?) OR `owner` = BINARY ?;", [this.userUid, this.userUid]);
		const rows = query[0] as VCiShoppinglistEntity[];
		const spls: Shoppinglist[] = [...owned, ...rows.map(spl => new Shoppinglist(spl))];
		return spls;
	}

	async getShoppinglistPermissions(): Promise<UserShoppinglistPermission[]>{
		const query = await dbp.query("SELECT * FROM `eshol`.`ciShoppinglistMember` WHERE `userUid` = BINARY ?;", this.userUid);
		const rows = query[0] as ICiShoppinglistMemberEntity[];
		const perms: UserShoppinglistPermission[] = [];
		for(const row of rows){
			const spl = await Shoppinglist.findOneBySplUid(row.splUid);
			if(spl){
				perms.push({
					permission: spl.owner === this.userUid ? "owner" : row.permission,
					spl
				});
			}
		}
		return perms;
	}

	async checkPassword(plainPassword: string): Promise<boolean>{
		const query = await dbp.query(
			"SELECT * FROM `eshol`.`userpasswd` WHERE `ciUser_userUid` = BINARY ? ORDER BY `createdAt` DESC LIMIT 1;",
			[this.userUid]
		);
		const rows = (query[0] as IUserpasswdEntity[]);
		if(!rows || rows.length !== 1)
			return false;
		const row = rows[0];
		if(
			row
			&& row.pwhash
			&& typeof row.pwhash === "string"
			&& row.pwhash.length > 64
		){
			return await pw.verify(plainPassword, row.pwhash);
		}
		return false;
	}

	async update(newData: ICiUserEntityUpdate): Promise<void>{
		const dbcon = await dbp.getConnection();
		await dbcon.beginTransaction();
		try{
			if(newData.username){
				await this.updateCi({
					ciName: newData.username
				}, dbcon);
			}
			await dbcon.query("UPDATE `eshol`.`ciUser` SET ? WHERE `userUid` = BINARY ?;", [newData, this.userUid]);
			await dbcon.commit();
		}catch(error){
			await dbcon.rollback();
			throw error;
		}finally{
			dbcon.release();
			await this.sync();
		}
	}

	async sync(): Promise<void>{
		await this.syncCi();
		const query = await dbp.query( "SELECT * FROM `eshol`.`ciUser` WHERE `userUid` = BINARY ?", [this.userUid] );
		const rows = query[0] as ICiUserEntity[];
		if(rows.length !== 1) throw new Error("User.sync(): row length !== 1");
		userPrivateData.set(this, rows[0]);
		this.syncronized = true;
	}

	toString(): string{
		return `${this.userUid} ${this.username}`;
	}

	print(vis: Visibility): unknown{
		return {
			links: this.links(),
			user: this.toJson(vis),
		};
	}

	private links() {
		return {
			_this: getLinkPublic("/user/" + this.userUid),
		};
	}

	toJson(vis?: "public" | "private" | "internal"): Partial<User>{
		if(vis === "private"){
			return {
				username: this.username,
				displayname: this.displayname,
				role: this.role,
				email: this.email,
				isActive: this.isActive,
				isVerified: this.isVerified,
				createdAt: this.createdAt
			};
		}else if(vis === "internal"){
			return {
				ciUid: this.ciUid,
				ciCreatedAt: this.ciCreatedAt,
				ciUpdatedAt: this.ciUpdatedAt,
				ciName: this.ciName,
				ciDeactivatedAt: this.ciDeactivatedAt,
				ciDeactivatedBy: this.ciDeactivatedBy,
				ciDeletedAt: this.ciDeletedAt,
				ciDeletedBy: this.ciDeletedBy,
				ciDescription: this.ciDescription,
				userUid: this.userUid,
				username: this.username,
				displayname: this.displayname,
				role: this.role,
				email: this.email,
				emailVerificationToken: this.emailVerificationToken,
				emailVerified: this.emailVerified,
				createdAt: this.createdAt,
				updatedAt: this.updatedAt,
				isActive: this.isActive,
				isDeleted: this.isDeleted,
				isVerified: this.isVerified
			};
		}else {
			return {
				username: this.username,
				displayname: this.displayname,
				role: this.role
			};
		}
	}

	// async createApiToken(): Promise<IApiTokenEntity | null>{
	// 	const apitokenUid = esholId("token");
	// 	const token = id.generate(128, "ext");
	// 	const clientId = id.generate(64, "ext");
	// 	const newApiToken: IApiTokenEntityNew = {
	// 		apitokenUid,
	// 		token,
	// 		ciUser_userUid: this.userUid,
	// 		clientId,
	// 		active: "Y"
	// 	};
	// 	try{
	// 		await dbp.query("INSERT INTO `eshol`.`apitoken` SET ?;", newApiToken);
	// 		const query = await dbp.query("SELECT * FROM `eshol`.`apitoken` WHERE `apitokenUid` = BINARY ? AND `token` = BINARY ? AND `ciUser_userUid` = BINARY ? AND `active` = 'Y';", [apitokenUid, token, this.userUid]);
	// 		const rows = query[0] as IApiTokenEntity[];
	// 		return rows.length === 1 ? rows[0] : null;
	// 	}catch(error){
	// 		WLOGGER.error("Error User.createApiToken()", {
	// 			newApiToken,
	// 			user: this.toString()
	// 		});
	// 		throw error;
	// 	}
	// }

	static async login(loginname: ICiUserEntity["username"] | ICiUserEntity["email"], password: string): Promise<{user: User; apitoken: ApiToken} | null> {
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiUser` WHERE `username` = ? OR `email` = ?;", [loginname, loginname]);
		const rows = query[0] as VCiUserEntity[];
		if(rows.length === 1) {
			const useracc = new User(rows[0]);
			if(useracc.isActive === true && useracc.isDeleted === false && useracc.isVerified === true){
				if(await useracc.checkPassword(password) === true){
					const apitoken = await ApiToken.create(useracc);
					if(apitoken){
						return {
							user: useracc,
							apitoken
						};
					}
				}
			}
		}
		return null;
	}

	static async usernameAvaliability(username: ICiUserEntity["username"]): Promise<boolean>{
		if(username_disallow.includes(username)) return false;
		const query = await dbp.query('SELECT COUNT(`username`) AS `count` FROM `eshol`.`ciUser` WHERE `username` = ?;', [username]);
		const rows = query[0] as IRowCount[];
		return rows[0].count < 1 ? true : false;
	}

	static async emailAvaliability(email: ICiUserEntity["email"]): Promise<boolean>{
		const query = await dbp.query('SELECT COUNT(`email`) AS `count` FROM `eshol`.`ciUser` WHERE `email` = ?;', [email]);
		const rows = query[0] as IRowCount[];
		return rows[0].count < 1 ? true : false;
	}

	static async verifyEmail(verificationtoken: string): Promise<User | null>{
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiUser` WHERE `emailVerificationToken` = BINARY ?;", [verificationtoken]);
		const rows = query[0] as VCiUserEntity[];
		if(rows.length === 1){
			const user = new User(rows[0]);
			await dbp.query("UPDATE `eshol`.`ciUser` SET `emailVerificationToken` = NULL WHERE `userUid` = BINARY ?;", [user.userUid]);
			await user.sync();
			await sendEmailVerificationConfirmed(user);
			return user;
		}else if(rows.length > 1){
			WLOGGER.error("User.verifyEmail() found more then 1 User", {
				verificationtoken,
				rows_length: rows.length,
				users: rows.map(user => user.userUid)
			});
			throw new Error("User.verifyEmail() found more then 1 User");
		}else{
			return null;
		}
	}

	static async findAll(searchModifier?: string): Promise<User[]> {
		const query = await dbp.query(`SELECT * FROM \`eshol\`.\`vCiUser\`${searchModifier ? " " + searchModifier : ""};`);
		const rows = query[0] as VCiUserEntity[];
		return rows.map(u => new User(u));
	}

	static async findAllFilter(filter?: {
		isActive?: boolean
		isDeleted?: boolean
	}): Promise<User[]> {
		let whereClause = "";
		const whereContitions: string[] = [];
		if(filter){
			if(filter.isActive === true){
				whereContitions.push("(`ciDeactivatedAt` = NULL AND `ciDeletedAt` = NULL)");
			}else if(filter.isActive === false){
				whereContitions.push("(`ciDeactivatedAt` IS NOT NULL AND `ciDeletedAt` = NULL)");
			}else if(filter.isDeleted === true){
				whereContitions.push("`ciDeletedAt` IS NOT NULL");
			}else if(filter.isDeleted === false){
				whereContitions.push("`ciDeletedAt` = NULL");
			}
		}
		if(whereContitions.length > 0){
			whereClause += ` WHERE ${whereContitions.join(" AND ")}`;
		}
		const query = await dbp.query(`SELECT * FROM \`eshol\`.\`vCiUser\`${whereClause};`);
		const rows = query[0] as VCiUserEntity[];
		return rows.map(u => new User(u));
	}

	static async findManyByUsername(search: VCiUserEntity["username"]): Promise<User[]> {
		const dbcon = await dbp.getConnection();
		const searchString = dbcon.escape("%" + search + "%");
		const vCiUserQuery = await dbcon.query("SELECT * FROM `eshol`.`vCiUser` WHERE `username` LIKE ?;", [searchString]);
		const userRows = vCiUserQuery[0] as VCiUserEntity[];
		dbcon.release();
		return userRows.map(u => new User(u));
	}

	static async findOneByUsername(username: VCiUserEntity["username"]): Promise<User | null> {
		const vCiUserQuery = await dbp.query("SELECT * FROM `eshol`.`vCiUser` WHERE `username` = ?;", [username]);
		const userRows = vCiUserQuery[0] as VCiUserEntity[];
		if(userRows.length === 1) return new User(userRows[0]);
		return null;
	}

	static async findOneByEmail(email: VCiUserEntity["email"]): Promise<User | null> {
		const vCiUserQuery = await dbp.query("SELECT * FROM `eshol`.`vCiUser` WHERE `email` = ?;", [email]);
		const userRows = vCiUserQuery[0] as VCiUserEntity[];
		if(userRows.length === 1) return new User(userRows[0]);
		return null;
	}

	static async findOneByUsernameOrEmail(login: VCiUserEntity["email"] | VCiUserEntity["username"]): Promise<User | null> {
		const vCiUserQuery = await dbp.query("SELECT * FROM `eshol`.`vCiUser` WHERE `username` = ? OR `email` = ?;", [login, login]);
		const userRows = vCiUserQuery[0] as VCiUserEntity[];
		if(userRows.length === 1) return new User(userRows[0]);
		return null;
	}

	static async findOneByUserUid(userUid: VCiUserEntity["userUid"]): Promise<User | null>{
		const ciUserQuery = await dbp.query("SELECT * FROM `eshol`.`vCiUser` WHERE `userUid` = BINARY ?;", [userUid]);
		const ciUserQueryRows = ciUserQuery[0] as VCiUserEntity[];
		if(ciUserQueryRows.length !== 1)
			return null;
		return new User(ciUserQueryRows[0]);
	}

	static async findOneByApitoken(apiToken: string, activeApiToken: boolean): Promise<User | null>{
		const userQuery = await dbp.query("SELECT * FROM `eshol`.`vCiUser` WHERE `userUid` = BINARY (SELECT `ciUser_userUid` FROM `eshol`.`apitoken` WHERE `token` = BINARY ? AND `active` = ?);", [apiToken, (activeApiToken === true ? "Y" : "N")]);
		const userQueryRows = userQuery[0] as VCiUserEntity[];
		if(userQueryRows.length === 1){
			return new User(userQueryRows[0]);
		}
		return null;
	}

	static async create(newUserInfo: ICiUserEntityRegister): Promise<User>{
		const dbcon = await dbp.getConnection();
		await dbcon.beginTransaction();
		try{
			const newCiUid = await CMDB.createCi("user", newUserInfo.username, dbcon);
			const emailVerificationToken = id.generate(64);
			// create UserCi
			const newUserDbData: ICiUserEntityNew = {
				userUid: newCiUid,
				role: "user",
				emailVerificationToken,
				email: newUserInfo.email,
				username: newUserInfo.username,
				displayname: (typeof newUserInfo.displayname === "string" && newUserInfo.displayname !== null) ? newUserInfo.displayname : newUserInfo.username
			};
			await dbcon.query(
				"INSERT INTO `eshol`.`ciUser` SET ?;",
				newUserDbData
			);

			// create Password
			const pwHash = await pw.hash(newUserInfo.password);
			await dbcon.query(
				"INSERT INTO `eshol`.`userpasswd` (`ciUser_userUid`, `pwhash`) VALUES (?, ?);",
				[newCiUid, pwHash]
			);
			await dbcon.commit();
			const ciDbQuery = await dbcon.query(
				"SELECT * FROM `eshol`.`vCiUser` WHERE `ciUid`= BINARY ?;",
				[newCiUid]
			);
			const ciDbRows = ciDbQuery[0] as VCiUserEntity[];
			if(ciDbRows.length === 1){
				const user = new User(ciDbRows[0]);
				await sendEmailVerificationToken(user);
				return user;
			}else{
				throw new Error("Error: User.create() - couldn't find created User by newCiUid");
			}
		}catch(e){
			await dbcon.rollback();
			WLOGGER.error("Error User.create()", {
				e,
				newUserInfo
			});
			throw e;
		}finally{
			dbcon.release();
		}
	}

}