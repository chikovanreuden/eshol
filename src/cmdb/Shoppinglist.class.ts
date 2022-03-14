import * as CMDB from "./index";
import WLOGGER from "../wlogger";
import dbp from "../db";
import { Ci, IBaseCi, Item, User} from "./index";
import { ICiShoppinglistEntity, ICiShoppinglistEntityCreate, ICiShoppinglistEntityUpdate } from "../types/db/CiShoppinglist.Entity";
import { VCiShoppinglistEntity } from "../types/db/VCiShoppinglist.Entity";
import { ICiShoppinglistMemberEntity } from "../types/db/CiShoppinglistMember.Entity";
import { ShoppinglistUserPermission } from "./ShoppinglistMember";

const privateShoppinglistData = new WeakMap<any, ICiShoppinglistEntity>();

export class Shoppinglist extends Ci implements IBaseCi, VCiShoppinglistEntity {
	private internal = (): ICiShoppinglistEntity => {
		const val = privateShoppinglistData.get(this);
		if(val) return val;
		else throw new Error("Error in Shoppinglist.class.ts:internal() -> Key 'this' does not exist");
	};
	public items: Item[] | null = null;
	constructor(vcishoppinglist: VCiShoppinglistEntity){
		super(vcishoppinglist);
		const {
			splUid,
			owner,
			name,
			privacy,
			createdAt,
			updatedAt
		}: ICiShoppinglistEntity = vcishoppinglist;
		privateShoppinglistData.set(this, {
			splUid,
			owner,
			name,
			privacy,
			createdAt,
			updatedAt
		});
	}
	get splUid(): ICiShoppinglistEntity["splUid"]{ return this.internal().splUid; }
	get name(): ICiShoppinglistEntity["name"]{ return this.internal().name; }
	get privacy(): ICiShoppinglistEntity["privacy"]{ return this.internal().privacy; }
	get createdAt(): ICiShoppinglistEntity["createdAt"]{ return this.internal().createdAt; }
	get updatedAt(): ICiShoppinglistEntity["updatedAt"]{ return this.internal().updatedAt; }
	get owner(): ICiShoppinglistEntity["owner"]{ return this.internal().owner; }

	async getOwnerAsync(): Promise<User | null>{ return User.findOneByUserUid(this.owner); }
	async setOwnerAsync(newOwner: User, oldOwnerKeppPermissions = true): Promise<void>{
		if(newOwner.isActive){
			const dbcon = await dbp.getConnection();
			try{
				await dbcon.beginTransaction();
				// Delete the Permissions of new Owner from the SplMemberlist
				await dbcon.query("DELETE FROM ciShoppinglistMemeber cisplmbr WHERE `splUid`=? AND `userUid`=?;", [this.splUid, newOwner.userUid]);
				if(oldOwnerKeppPermissions){
					// Insert new Permissions for the old Owner into the SplMemberlist
					await dbcon.query("INSERT INTO ciShoppinglistMemeber cisplmbr SET ?;", [{
						splUid: this.splUid,
						userUid: this.owner,
						permission: "rw"
					}]);
				}
				// Change Owner (userUid) of the Spl
				await dbp.query("UPDATE `eshol`.`ciShoppinglist` SET `owner` = ? WHERE `splUid` = ?;", [newOwner.userUid, this.splUid]);
				await this.sync();
			}catch(err){
				const errStr = "db_error_transation_getOwnerAsync";
				WLOGGER.error( errStr, {
					err,
					newOwner: newOwner.toJson("internal")
				});
				await dbcon.rollback();
				throw new Error("db_error_transation_getOwnerAsync");
			}finally{
				dbcon.release();
			}
		}else{
			throw new Error("user_not_active");
		}
	}
	async getItemsAsync(): Promise<Item[]> {
		this.items = await Item.findAllByShoppinglist(this.splUid);
		return this.items;
	}

	async getUserPermissions(): Promise<ShoppinglistUserPermission[]>{
		const perms: ShoppinglistUserPermission[] = [];
		const owner = await this.getOwnerAsync();
		if(owner) perms.push({ user: owner, permission: "owner" });
		const query = await dbp.query("SELECT * FROM `eshol`.`ciShoppinglistMember` WHERE `splUid` = BINARY ?;", this.splUid);
		const rows = query[0] as ICiShoppinglistMemberEntity[];

		for(const row of rows){
			const user = await User.findOneByUserUid(row.userUid);
			if(user){
				perms.push({
					user,
					permission: this.owner === user.userUid ? "owner" : row.permission
				});
			}
		}
		return perms;
	}

	// async grantUserPermission(user: User){
	// }

	toString(): string {
		return `${this.splUid} ${this.name}`;
	}

	toJson(vis?: "public" | "private" | "internal"): Partial<Shoppinglist> {
		if(vis === "private"){
			return {
				name: this.name,
				owner: this.owner,
				privacy: this.privacy,
				createdAt: this.createdAt,
				isActive: this.isActive
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
				splUid: this.splUid,
				name: this.name,
				owner: this.owner,
				privacy: this.privacy,
				createdAt: this.createdAt,
				updatedAt: this.updatedAt
			};
		}else{
			return {
				name: this.name,
				privacy: this.privacy,
			};
		}
	}

	async update(newData: ICiShoppinglistEntityUpdate): Promise<void>{
		const dbcon = await dbp.getConnection();
		await dbcon.beginTransaction();
		try {
			if(newData.name){
				await this.updateCi({
					ciName: newData.name
				}, dbcon);
			}
			await dbp.query("UPDATE `eshol`.`ciShoppinglist` SET ? WHERE `splUid` = BINARY ?;", [newData, this.splUid]);
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
		const query = await dbp.query( "SELECT * FROM `eshol`.`ciShoppinglist` WHERE `splUid` = BINARY ?", [this.splUid] );
		const rows = query[0] as ICiShoppinglistEntity[];
		if(rows.length !== 1) throw new Error("Shoppinglist.class.ts::sync(): row length !== 1");
		privateShoppinglistData.set(this, rows[0]);
		this.syncronized = true;
	}

	static async create(newData: ICiShoppinglistEntityCreate): Promise<Shoppinglist>{
		const dbCon = await dbp.getConnection();
		await dbCon.beginTransaction();
		try{
			const newCiUid = await CMDB.createCi("shoppinglist", newData.name, dbCon);
			await dbCon.query("INSERT INTO `eshol`.`ciShoppinglist` SET `splUid` = ?, `name` = ?, `owner` = ?, privacy = ?;", [newCiUid, newData.name, newData.owner, newData.privacy]);
			await dbCon.commit();
			const splQuery = await dbCon.query("SELECT * FROM `eshol`.`vCiShoppinglist` WHERE `splUid` = BINARY ?;", [newCiUid]);
			const splRows = splQuery[0] as VCiShoppinglistEntity[];
			dbCon.release();
			if(splRows.length === 1)
				return new Shoppinglist(splRows[0]);
			else
				throw new Error("Error: Shoppinglist.create - more/less than 1 Shoppinglist found after creation");
		}catch(e){
			await dbCon.rollback();
			dbCon.release();
			WLOGGER.error("Error Shoppinglist.create()", e);
			throw e;
		}
	}

	static async findAll(): Promise<Shoppinglist[]>{
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiShoppinglist`;");
		const rows = query[0] as VCiShoppinglistEntity[];
		return rows.map(spl => new Shoppinglist(spl));
	}

	static async findMany(filter?: {
		privacy: ICiShoppinglistEntity["privacy"]
	}): Promise<Shoppinglist[]>{
		const dbcon = await dbp.getConnection();
		let whereClause = "";
		const whereContitions: string[] = [];
		if(filter){
			if(filter.privacy){
				whereContitions.push(`\`privacy\` = ${dbcon.escape(filter.privacy)}`);
			}
		}
		if(whereContitions.length > 0){
			whereClause += ` WHERE ${whereContitions.join(" AND ")}`;
		}
		const query = await dbcon.query(`SELECT * FROM \`eshol\`.\`vCiShoppinglist\`${whereClause};`);
		dbcon.release();
		const rows = query[0] as VCiShoppinglistEntity[];
		return rows.map(spl => new Shoppinglist(spl));
	}

	static async findOneBySplUid(splUid: ICiShoppinglistEntity["splUid"]): Promise<Shoppinglist>{
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiShoppinglist` WHERE `splUid` = ?;", [splUid]);
		const rows = query[0] as VCiShoppinglistEntity[];
		if(rows.length === 1) return new Shoppinglist(rows[0]);
		else throw new Error("Shoppinlist.class.ts::findOneBySplUid(), rows.length !== 1");
	}

	static async findOneByName(name: ICiShoppinglistEntity["name"]): Promise<Shoppinglist>{
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiShoppinglist` WHERE `name` = ?;", [name]);
		const rows = query[0] as VCiShoppinglistEntity[];
		if(rows.length === 1) return new Shoppinglist(rows[0]);
		else throw new Error("Shoppinlist.class.ts::findOneByName(), rows.length !== 1");
	}
	static async findManyByOwner(user: User): Promise<Shoppinglist[]>{
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiShoppinglist` WHERE `owner` = BINARY ?;", [user.userUid]);
		const rows = query[0] as VCiShoppinglistEntity[];
		return rows.map(spl => new Shoppinglist(spl));
	}

	static async findManyByUser(user: User): Promise<Shoppinglist[]>{
		const query = await dbp.query("SELECT * FROM vCiShoppinglist vcs WHERE `owner`=? OR `splUid` IN (SELECT `splUid` FROM ciShoppinglistMember csm WHERE userUid=?);", [user.userUid, user.userUid]);
		const rows = query[0] as VCiShoppinglistEntity[];
		return rows.map(spl => new Shoppinglist(spl));
	}
}