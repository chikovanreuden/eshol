import dbp from "../db";
import WLOGGER from "../wlogger";
import { ICiShoppinglistPermissionEntity, ICiShoppinglistPermissionEntityCreate } from "../types/db/CiShoppinglistPermission.Entity";
import { OkPacket, PoolConnection } from "mysql2/promise";
import { IBaseCi, User, Shoppinglist } from "./index";

export interface ShoppinglistUserPermission {
	permission: ICiShoppinglistPermissionEntity["permission"] | "owner"
	user: User
	spl: Shoppinglist
};

const privateSplMbrData = new WeakMap<any, ICiShoppinglistPermissionEntity>();

export class ShoppinglistPermission implements IBaseCi{
	private internal = (): ICiShoppinglistPermissionEntity => {
		const val = privateSplMbrData.get(this);
		if(val) return val;
		else throw new Error("Error in User.class.ts:internal() -> Key 'this' does not exist");
	};

	constructor(splMbrEnt: ICiShoppinglistPermissionEntity){
		privateSplMbrData.set(this, {
			userUid: splMbrEnt.userUid,
			splUid: splMbrEnt.splUid,
			permission: splMbrEnt. permission,
			createdAt: splMbrEnt.createdAt,
			updatedAt: splMbrEnt.updatedAt
		});
	}

	get userUid(): ICiShoppinglistPermissionEntity["userUid"] { return this.internal().userUid; }
	get splUid(): ICiShoppinglistPermissionEntity["splUid"] { return this.internal().splUid; }
	get permission(): ICiShoppinglistPermissionEntity["permission"] { return this.internal().permission; }
	get createdAt(): ICiShoppinglistPermissionEntity["createdAt"] { return this.internal().createdAt; }
	get updatedAt(): ICiShoppinglistPermissionEntity["updatedAt"] { return this.internal().updatedAt; }

	async update(newData: ICiShoppinglistPermissionEntity): Promise<void> {
		try {
			await dbp.query("UPDATE `eshol`.`ciShoppinglistPermission` SET ? WHERE splUid = BINARY ? AND userUid = BINARY ?;", [newData, this.splUid, this.userUid]);
		} catch (error) {
			WLOGGER.error("Shoppinglist.update()", {
				params: {newData},
				error
			});
		}finally{
			await this.sync();
		}
	}

	toJson(): ICiShoppinglistPermissionEntity {
		return{
			splUid: this.splUid,
			userUid: this.userUid,
			permission: this.permission,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt
		};
	}

	async sync(): Promise<void> {
		const query = await dbp.query(`SELECT * FROM \`eshol\`.\`ciShoppinglistPermission\` WHERE splUid = BINARY ? AND userUid = BINARY ?;`, [this.splUid, this.userUid]);
		const rows = query[0] as ICiShoppinglistPermissionEntity[];
		privateSplMbrData.set(this, rows[0]);
	}

	async delete(): Promise<boolean>{
		const [spl, user] = await Promise.all([Shoppinglist.findOneBySplUid(this.splUid), User.findOneByUserUid(this.userUid)]);
		if(spl && user){
			return ShoppinglistPermission.delete(spl, user);
		}else{
			return false;
		}
	}

	toString(): string {
		return `${this.splUid} ${this.userUid} ${this.permission}`;
	}

	static async create(newData: ICiShoppinglistPermissionEntityCreate, dbcon: PoolConnection): Promise<ShoppinglistPermission> {
		try{
			await dbcon.query("INSERT INTO ciShoppinglistPermission cisplmbr SET ?;", [{
				splUid: newData.splUid,
				userUid: newData.userUid,
				permission: "rw"
			}]);
			const query = await dbcon.query("SELECT * FROM ciShoppinglistPermission WHERE splUid = BINARY ? AND userUid = BINARY ?;", [newData.splUid, newData.userUid]);
			const rows = query[0] as ICiShoppinglistPermissionEntity[];
			if(rows.length === 1){
				return new ShoppinglistPermission(rows[0]);
			}else{
				throw new Error("ShoppinglistPermission.create() -> rows.length !== 1");
			}
		}catch(error){
			// TODO: Finish the Error Logging
			WLOGGER.error("ShoppinglistPermission.create()", {
				params: {
					newData
				},
				error
			});
			throw error;
		}
	}

	static async delete(spl: Shoppinglist, user: User): Promise<boolean>{
		const dbcon = await dbp.getConnection();
		await dbcon.beginTransaction();
		try {
			const query = await dbcon.query("DELETE FROM `eshol`.`ciShoppinglistPermission` WHERE splUid = BINARY ? AND userUid = BINARY ?", [spl.splUid, user.userUid]);
			const result = query[0] as OkPacket;
			if(result.affectedRows === 1){
				await dbcon.commit();
				return true;
			} else if(result.affectedRows === 0){
				await dbcon.commit();
				return false;
			} else{
				throw new Error("ShoppinglistPermission.delete(): more than 1 affected Row");
			}
		} catch (error) {
			await dbcon.rollback();
			WLOGGER.error("ShoppinglistPermission.delete()", {
				params: {
					spl,
					user
				},
				error
			});
			throw error;
		}finally{
			dbcon.release();
		}
	}

	static async findMany(search?: Partial<Pick<ICiShoppinglistPermissionEntity, "splUid" | "userUid">>): Promise<ShoppinglistPermission[]>{
		const dbcon = await dbp.getConnection();
		let whereClause = "";
		const whereContitions: string[] = [];
		if(search){
			if(search.splUid){
				whereClause += "splUid = BINARY " + dbcon.escape(search.splUid);
			}
			if(search.userUid){
				whereClause += "userUid = BINARY " + dbcon.escape(search.userUid);
			}
		}
		if(whereContitions.length > 0){
			whereClause += ` WHERE ${whereContitions.join(" AND ")}`;
		}
		try{
			const query = await dbcon.query(`SELECT * FROM \`eshol\`.\`ciShoppinglistPermission\` ${whereClause};`);
			const rows = query[0] as ICiShoppinglistPermissionEntity[];
			return rows.map(row => new ShoppinglistPermission(row));
		}catch(error){
			// TODO: Add Data to log
			WLOGGER.error("ShoppinglistPermission.findMany()", {
				params: search,
				error
			});
			throw error;
		}finally{
			dbcon.release();
		}
	}
}
export default ShoppinglistPermission;