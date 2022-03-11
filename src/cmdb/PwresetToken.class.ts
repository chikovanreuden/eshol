import { APITOKEN_SCHEMA_UPDATE } from "../lib/validatorLib";
import WLOGGER from "../wlogger";
import * as id from "../id";
import dbp from "../db";
import { User } from "./";
import { IPwresetTokenEntity, IPwresetTokenEntityNew, IPwresetTokenEntityUpdate } from "../types/db/PwresetToken.Entity";

const privateData = new WeakMap<any, IPwresetTokenEntity>();

export class PwresetToken implements IPwresetTokenEntity{
	private internal = (): IPwresetTokenEntity => {
		const val = privateData.get(this);
		if(val) return val;
		else throw new Error(`Error in ${__filename}:internal() -> Key 'this' does not exist`);
	};
	constructor(apiTokenEntity: IPwresetTokenEntity){
		privateData.set(this, apiTokenEntity);
	}

	get userUid(): IPwresetTokenEntity["userUid"] { return this.internal().userUid; }
	get token(): IPwresetTokenEntity["token"] { return this.internal().token; }
	get used(): IPwresetTokenEntity["used"] { return this.internal().used; }
	get createdAt(): IPwresetTokenEntity["createdAt"] { return this.internal().createdAt; }
	get updatedAt(): IPwresetTokenEntity["updatedAt"] { return this.internal().updatedAt; }

	async update(newData: IPwresetTokenEntityUpdate): Promise<void>{
		const newDataValidation = APITOKEN_SCHEMA_UPDATE.validate(newData);
		if(newDataValidation.error){
			throw new Error("PwresetToken.class.ts::update(), newData validation Error");
		}
		await dbp.query("UPDATE `eshol`.`pwresettoken` SET ? WHERE `token` = ?;",[newData, this.token]);
		const query = await dbp.query("SELECT * FROM `eshol`.`pwresettoken` WHERE `token` = ?;", [this.token]);
		const rows = query[0] as IPwresetTokenEntity[];
		if(rows.length !== 1) throw new Error("PwresetToken.class.ts::update(), select query length !== 1.");
		privateData.set(this, rows[0]);
	}

	async delete(): Promise<void> {
		await dbp.query("DELETE FROM `eshol`.`pwresettoken` WHERE `token`=?;", this.token);
	}

	toJson(): Partial<IPwresetTokenEntity>{
		return {
			userUid: this.userUid,
			token: this.token,
			used: this.used,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt
		};
	}

	static async findOneByToken(token: IPwresetTokenEntity["token"]): Promise<PwresetToken>{
		const query = await dbp.query("SELECT * FROM `eshol`.`pwresettoken` WHERE `token` = BINARY ?;", [token]);
		const rows = query[0] as IPwresetTokenEntity[];
		if(rows.length === 1) return new PwresetToken(rows[0]);
		else throw new Error("PwresetToken.class.ts::findOneByToken() -> row.length !== 1");
	}

	static async create(user: User): Promise<PwresetToken>{
		const token = id.generate(128, "ext");
		const newToken: IPwresetTokenEntityNew = {
			token,
			userUid: user.userUid
		};
		try{
			await dbp.query("INSERT INTO `eshol`.`pwresettoken` SET ?;", newToken);
			const query = await dbp.query("SELECT * FROM `eshol`.`pwresettoken` WHERE `token` = BINARY ? AND `userUid` = BINARY ?;", [token, user.userUid]);
			const rows = query[0] as IPwresetTokenEntity[];
			if(rows.length !== 1) throw new Error("PwresetToken.class.ts::create(). rows.length !== 1.");
			const tkn = new PwresetToken(rows[0]);
			return tkn;
		}catch(error){
			WLOGGER.error("Error PwresetToken.class.ts::create()", {
				newToken,
				user: user.toString()
			});
			throw error;
		}
	}

}