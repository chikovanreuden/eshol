import { APITOKEN_SCHEMA_UPDATE } from "../lib/validatorLib";
import { ICiUserEntity } from "../types/db/CiUser.Entity";
import esholId from "../util/esholId";
import WLOGGER from "../wlogger";
import * as id from "../id";
import dbp from "../db";
import { IApiTokenEntity, IApiTokenEntityNew, IApiTokenEntityUpdate } from "../types/db/ApiTokensEntity";
import { User } from "./";

const privateApiTokenData = new WeakMap<any, IApiTokenEntity>();

export class ApiToken implements IApiTokenEntity{
	private internal = (): IApiTokenEntity => {
		const val = privateApiTokenData.get(this);
		if(val) return val;
		else throw new Error("Error in ApiToken.class.ts:internal() -> Key 'this' does not exist");
	};
	constructor(apiTokenEntity: IApiTokenEntity){
		privateApiTokenData.set(this, apiTokenEntity);
	}

	get apitokenUid(): IApiTokenEntity["apitokenUid"] { return this.internal().apitokenUid; }
	get ciUser_userUid(): IApiTokenEntity["ciUser_userUid"] { return this.internal().ciUser_userUid; }
	get token(): IApiTokenEntity["token"] { return this.internal().token; }
	get clientId(): IApiTokenEntity["clientId"] { return this.internal().clientId; }
	get active(): IApiTokenEntity["active"] { return this.internal().active; }
	get useragent(): IApiTokenEntity["useragent"] { return this.internal().useragent; }
	get customClientname(): IApiTokenEntity["customClientname"] { return this.internal().customClientname; }
	get createdAt(): IApiTokenEntity["createdAt"] { return this.internal().createdAt; }
	get updatedAt(): IApiTokenEntity["updatedAt"] { return this.internal().updatedAt; }

	async update(newData: IApiTokenEntityUpdate): Promise<void>{
		const newDataValidation = APITOKEN_SCHEMA_UPDATE.validate(newData);
		if(newDataValidation.error){
			throw new Error("ApiToken.class.ts::update(), newData validation Error");
		}
		/**
		 * @db:eshhol
		 * @table:apitoken
		 * @prop:apitoken:apitokenUid
		 */
		await dbp.query("UPDATE `eshol`.`apitoken` SET ? WHERE `apitokenUid` = ?;",[newData, this.apitokenUid]);
		const query = await dbp.query("SELECT * FROM `eshol`.`apitoken` WHERE `apitokenUid` = ?;", [this.apitokenUid]);
		const rows = query[0] as IApiTokenEntity[];
		if(rows.length !== 1) throw new Error("ApiToken.class.ts::update(), select query length !== 1.");
		privateApiTokenData.set(this, rows[0]);
	}

	async delete(): Promise<void> {
		await dbp.query("DELETE FROM `eshol`.`apitoken` WHERE `apitokenUid`=?;", this.apitokenUid);
	}

	toJson(vis: "private" | "internal"): Partial<ApiToken>{
		if(vis === "private"){
			return {
				ciUser_userUid: this.ciUser_userUid,
				clientId: this.clientId,
				token: this.token,
				active: this.active,
				useragent: this.useragent,
				customClientname: this.customClientname,
				createdAt: this.createdAt
			};
		}else if(vis === "internal"){
			return {
				apitokenUid: this.apitokenUid,
				ciUser_userUid: this.ciUser_userUid,
				clientId: this.clientId,
				token: this.token,
				active: this.active,
				useragent: this.useragent,
				customClientname: this.customClientname,
				createdAt: this.createdAt,
				updatedAt: this.updatedAt
			};
		}
		return {};
	}

	static async findOneByApiToken(token: IApiTokenEntity["token"]): Promise<ApiToken>{
		const query = await dbp.query("SELECT * FROM `eshol`.`apitoken` WHERE `token` = BINARY ?;", [token]);
		const rows = query[0] as IApiTokenEntity[];
		if(rows.length === 1) return new ApiToken(rows[0]);
		else throw new Error("Api");
	}

	static async findManyByUser(user: User | ICiUserEntity["userUid"]): Promise<ApiToken[]>{
		const userUid = user instanceof User ? user.userUid : user;
		const query = await dbp.query("SELECT * FROM `eshol`.`apitoken` WHERE `ciUser_userUid` = BINARY ?;", [userUid]);
		const rows = query[0] as IApiTokenEntity[];
		const tkns = rows.map(row => new ApiToken(row));
		return tkns;
	}

	static async create(user: User): Promise<ApiToken>{
		const apitokenUid = esholId("token");
		const token = id.generate(128, "ext");
		const clientId = id.generate(64, "ext");
		const newApiToken: IApiTokenEntityNew = {
			apitokenUid,
			token,
			ciUser_userUid: user.userUid,
			clientId,
			active: "Y"
		};
		try{
			await dbp.query("INSERT INTO `eshol`.`apitoken` SET ?;", newApiToken);
			const query = await dbp.query("SELECT * FROM `eshol`.`apitoken` WHERE `apitokenUid` = BINARY ? AND `token` = BINARY ? AND `ciUser_userUid` = BINARY ? AND `active` = 'Y';", [apitokenUid, token, user.userUid]);
			const rows = query[0] as IApiTokenEntity[];
			if(rows.length !== 1) throw new Error("ApiToken.class.ts::create(). rows.length !== 1.");
			const tkn = new ApiToken(rows[0]);
			return tkn;
		}catch(error){
			WLOGGER.error("Error User.createApiToken()", {
				newApiToken,
				user: user.toString()
			});
			throw error;
		}
	}

}