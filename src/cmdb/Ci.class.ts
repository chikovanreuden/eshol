import { PoolConnection } from "mysql2/promise";
import dbp from "../db/";
import { User } from "./index";
import { Item } from "./index";
import { Shoppinglist } from "./index";
import { IRowCount } from "../types/db/Count.Entity";
import { ICiEntity } from "../types/db/Ci.Entity";
import { CI_RULE_CIUID } from "../lib/validatorLib";
import Visibility from "../types/Vis";

export interface IBaseCi {
	sync(): Promise<void>
	toString(): string
	toJson(): any
}

const privateData = new WeakMap<any, ICiEntity>();

export class Ci implements ICiEntity{
	protected syncronized = false;
	protected ciInternal = (): ICiEntity =>{
		const val = privateData.get(this);
		if(val) return val;
		else throw new Error("Error in Ci.class.ts:ciInternal() -> Key 'this' does not exist");
	};
	constructor(ciEntity: ICiEntity){
		const {
			ciUid,
			type,
			ciName,
			ciCreatedAt,
			ciUpdatedAt,
			ciDeactivatedAt,
			ciDeactivatedBy,
			ciDeletedAt,
			ciDeletedBy,
			photoId
		}: ICiEntity = ciEntity;
		privateData.set(this, {
			ciUid,
			type,
			ciName,
			ciCreatedAt,
			ciUpdatedAt,
			ciDeactivatedAt,
			ciDeactivatedBy,
			ciDeletedAt,
			ciDeletedBy,
			photoId
		});
	}

	get ciUid(): ICiEntity["ciUid"] { return this.ciInternal().ciUid; }
	get ciName(): ICiEntity["ciName"] { return this.ciInternal().ciName; }
	get type(): ICiEntity["type"] { return this.ciInternal().type; }
	get ciCreatedAt(): ICiEntity["ciCreatedAt"] { return this.ciInternal().ciCreatedAt; }
	get ciUpdatedAt(): ICiEntity["ciUpdatedAt"] { return this.ciInternal().ciUpdatedAt; }
	get ciDeactivatedAt(): ICiEntity["ciDeactivatedAt"] { return this.ciInternal().ciDeactivatedAt; }
	get ciDeactivatedBy(): ICiEntity["ciDeactivatedBy"] { return this.ciInternal().ciDeactivatedBy; }
	get ciDeletedAt(): ICiEntity["ciDeletedAt"] { return this.ciInternal().ciDeletedAt; }
	get ciDeletedBy(): ICiEntity["ciDeletedBy"] { return this.ciInternal().ciDeletedBy; }
	get photoId(): ICiEntity["photoId"] { return this.ciInternal().photoId; }
	get isDeleted(): boolean { return this.ciInternal().ciDeletedAt instanceof Date ? true : false; }
	get isActive(): boolean {
		if(this.isDeleted) return false;
		return this.ciDeactivatedAt instanceof Date ? false : true;
	}
	get ciDescription(): string { return `${this.ciUid} ${this.ciName}`; }

	toString(): string{ return `${this.ciUid} ${this.ciName}`; }

	async deactivateCi(user?: User): Promise<void> {
		await dbp.query("UPDATE `eshol`.`ci` SET `ciDeactivatedAt` = CURRENT_TIMESTAMP(), `ciDeactivatedBy` = ? WHERE `ciUid`= BINARY ?;", [(user ? user.userUid : null), this.ciUid]);
		await this.syncCi();
	}

	async activateCi(): Promise<void>{
		await dbp.query("UPDATE `eshol`.`ci` SET `ciDeactivatedAt` = NULL, `ciDeactivatedBy` = NULL WHERE `ciUid`= BINARY ?;", [this.ciUid]);
		await this.syncCi();
	}

	async deleteCi(user?: User): Promise<void> {
		await dbp.query("UPDATE `eshol`.`ci` SET (`ciDeletedAt`, `ciDeletedBy`) VALUES(CURRENT_TIMESTAMP(), ?) WHERE `ciUid`= BINARY ?;", [(user ? user.userUid : null), this.ciUid]);
		await this.syncCi();
	}

	async undeleteCi(): Promise<void> {
		await dbp.query("UPDATE `eshol`.`ci` SET (`ciDeletedAt`, `ciDeletedBy`) VALUES (NULL, NULL) WHERE `ciUid`= BINARY ?;", [this.ciUid]);
		await this.syncCi();
	}
	async syncCi(): Promise<void>{
		const query = await dbp.query("SELECT * FROM `eshol`.`ci` WHERE `ciUid` = BINARY ?;", [this.ciUid]);
		const rows = query[0] as ICiEntity[];
		if(rows.length !== 1) throw new Error("Error Ci.class.ts::syncCi() -> No Enitity with ciUid '" + this.ciUid + "' found");
		const row = rows[0];
		if(row.type !== this.ciInternal().type) throw new Error("Error Ci.class.ts::syncCi() -> Ci Type Missmatch: '" + this.ciUid + "', Class Type: " + this.type + ", DB Ci Type: " + row.type);
		this.ciInternal().ciName = row.ciName;
		this.ciInternal().ciCreatedAt = row.ciCreatedAt;
		this.ciInternal().ciUpdatedAt = row.ciUpdatedAt;
		this.ciInternal().ciDeactivatedAt = row.ciDeactivatedAt;
		this.ciInternal().ciDeactivatedBy = row.ciDeactivatedBy;
		this.ciInternal().ciDeletedAt = row.ciDeletedAt;
		this.ciInternal().ciDeletedBy = row.ciDeletedBy;
		this.ciInternal().photoId = row.photoId;
	}

	async updateCi(newData: Partial<Pick<ICiEntity, "ciName">>, dbcon: PoolConnection): Promise<void> {
		await dbcon.query("UPDATE `eshol`.`ci` SET ? WHERE `ciUid` = BINARY ?;", [newData, this.ciUid]);
	}

	toJson(vis: Visibility = "public"): Partial<Ci>{
		if(vis === "private"){
			return {
				ciUid: this.ciUid,
				ciName: this.ciName,
				type: this.type,
				ciCreatedAt: this.ciCreatedAt,
				ciUpdatedAt: this.ciUpdatedAt,
				ciDeactivatedAt: this.ciDeactivatedAt,
				ciDeactivatedBy: this.ciDeactivatedBy,
				ciDeletedAt: this.ciDeletedAt,
				ciDeletedBy: this.ciDeletedBy,
				photoId: this.photoId,
				isDeleted: this.isDeleted,
				isActive: this.isActive
			};
		}else	if(vis === "internal"){
			return {
				ciUid: this.ciUid,
				ciName: this.ciName,
				type: this.type,
				ciCreatedAt: this.ciCreatedAt,
				ciUpdatedAt: this.ciUpdatedAt,
				ciDeactivatedAt: this.ciDeactivatedAt,
				ciDeactivatedBy: this.ciDeactivatedBy,
				ciDeletedAt: this.ciDeletedAt,
				ciDeletedBy: this.ciDeletedBy,
				photoId: this.photoId,
				isDeleted: this.isDeleted,
				isActive: this.isActive
			};
		}
		return {
			ciName: this.ciName,
			type: this.type,
			ciCreatedAt: this.ciCreatedAt,
			ciDeactivatedAt: this.ciDeactivatedAt,
			ciDeactivatedBy: this.ciDeactivatedBy,
			ciDeletedAt: this.ciDeletedAt,
			ciDeletedBy: this.ciDeletedBy,
			photoId: this.photoId,
			isDeleted: this.isDeleted,
			isActive: this.isActive
		};
	}

	static async ciUid_exists(ciUid: ICiEntity["ciUid"], type?: ICiEntity["type"]): Promise<boolean> {
		const dbcon = await dbp.getConnection();
		const typeClause = type ? "AND `type`=" + dbcon.escape(type) : "";
		const query = await dbcon.query('SELECT COUNT(`ciUid`) AS `count` FROM `eshol`.`ci` WHERE `ciUid` = BINARY ?' + typeClause + ';', [ciUid]);
		dbcon.release();
		const rows = query[0] as IRowCount[];
		const row = rows[0];
		return row.count > 0 ? true : false;
	}

	static async findOneByCiUid(ciUid: ICiEntity["ciUid"]): Promise<Ci | User | Item | Shoppinglist | null>{
		const ciUidValid = CI_RULE_CIUID.required().validate(ciUid);
		if(ciUidValid.error) throw new Error("ciuid_wrong_format");
		const ciQuery = await dbp.query("SELECT * FROM `eshol`.`ci` WHERE `ciUid` = BINARY ?;", ciUid);
		const ciRows = ciQuery[0] as ICiEntity[];
		if(ciRows.length !== 1) throw new Error("db_query_select_one_by_ciuid");
		const ci = new Ci(ciRows[0]);
		switch(ci.type){
			case "user":
				return User.findOneByCiUid(ciUid);
			case "item":
				return Item.findOneByItemUid(ciUid);
			case "shoppinglist":
				return Shoppinglist.findOneBySplUid(ciUid);
			default:
				return ci;
		}
	}
}