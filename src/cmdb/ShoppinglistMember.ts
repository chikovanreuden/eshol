import dbp from "../db";
import WLOGGER from "../wlogger";
import { ICiShoppinglistMemberEntity, ICiShoppinglistMemberEntityCreate, ICiShoppinglistMemberEntityUpdate } from "src/types/db/CiShoppinglistMember.Entity";
import { OkPacket, PoolConnection } from "mysql2/promise";
import { IBaseCi, User, Shoppinglist } from "./index";

export interface ShoppinglistUserPermission {
	permission: ICiShoppinglistMemberEntity["permission"] | "owner"
	user: User
};

const privateSplMbrData = new WeakMap<any, ICiShoppinglistMemberEntity>();

export class ShoppinglistMember implements IBaseCi{
	private internal = (): ICiShoppinglistMemberEntity => {
		const val = privateSplMbrData.get(this);
		if(val) return val;
		else throw new Error("Error in User.class.ts:internal() -> Key 'this' does not exist");
	};

	constructor(splMbrEnt: ICiShoppinglistMemberEntity){
		privateSplMbrData.set(this, {
			userUid: splMbrEnt.userUid,
			splUid: splMbrEnt.splUid,
			permission: splMbrEnt. permission,
			createdAt: splMbrEnt.createdAt,
			updatedAt: splMbrEnt.updatedAt
		});
	}

	get userUid(): ICiShoppinglistMemberEntity["userUid"] { return this.internal().userUid; }
	get splUid(): ICiShoppinglistMemberEntity["splUid"] { return this.internal().splUid; }
	get permission(): ICiShoppinglistMemberEntity["permission"] { return this.internal().permission; }
	get createdAt(): ICiShoppinglistMemberEntity["createdAt"] { return this.internal().createdAt; }
	get updatedAt(): ICiShoppinglistMemberEntity["updatedAt"] { return this.internal().updatedAt; }

	async update(newData: ICiShoppinglistMemberEntityUpdate): Promise<void> {
		try {
			await dbp.query("UPDATE `eshol`.`ciShoppinglistMember` SET ? WHERE splUid = BINARY ? AND userUid = BINARY ?;", [newData, this.splUid, this.userUid]);
		} catch (error) {
			WLOGGER.error("Shoppinglist.update()", {
				error
			});
		}finally{
			await this.sync();
		}
	}

	toJson(): ICiShoppinglistMemberEntity {
		return{
			splUid: this.splUid,
			userUid: this.userUid,
			permission: this.permission,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt
		};
	}

	async sync(): Promise<void> {
		const query = await dbp.query(`SELECT * FROM \`eshol\`.\`ciShoppinglistMember\` WHERE splUid = BINARY ? AND userUid = BINARY ?;`, [this.splUid, this.userUid]);
		const rows = query[0] as ICiShoppinglistMemberEntity[];
		privateSplMbrData.set(this, rows[0]);
	}

	async delete(): Promise<boolean>{
		const [spl, user] = await Promise.all([Shoppinglist.findOneBySplUid(this.splUid), User.findOneByUserUid(this.userUid)]);
		if(spl && user){
			return ShoppinglistMember.delete(spl, user);
		}else{
			return false;
		}
	}

	toString(): string {
		return `${this.splUid} ${this.userUid} ${this.permission}`;
	}

	static async create(newData: ICiShoppinglistMemberEntityCreate, dbcon: PoolConnection): Promise<ShoppinglistMember> {
		try{
			await dbcon.query("INSERT INTO ciShoppinglistMemeber cisplmbr SET ?;", [{
				splUid: newData.splUid,
				userUid: newData.userUid,
				permission: "rw"
			}]);
			const query = await dbcon.query("SELECT * FROM ciShoppinglistMemeber WHERE splUid = BINARY ? AND userUid = BINARY ?;", [newData.splUid, newData.userUid]);
			const rows = query[0] as ICiShoppinglistMemberEntity[];
			if(rows.length === 1){
				return new ShoppinglistMember(rows[0]);
			}else{
				throw new Error("ShoppinglistMember.create() -> rows.length !== 1");
			}
		}catch(err){
			// TODO: Finish the Error Logging
			WLOGGER.error("", err);
			throw err;
		}
	}

	static async delete(spl: Shoppinglist, user: User): Promise<boolean>{
		const dbcon = await dbp.getConnection();
		await dbcon.beginTransaction();
		try {
			const query = await dbcon.query("DELETE FROM `eshol`.`ciShoppinglistMemeber` WHERE splUid = BINARY ? AND userUid = BINARY ?", [spl.splUid, user.userUid]);
			const result = query[0] as OkPacket;
			if(result.affectedRows === 1){
				await dbcon.commit();
				return true;
			} else if(result.affectedRows === 0){
				await dbcon.commit();
				return false;
			} else{
				throw new Error("More");
			}
		} catch (error) {
			await dbcon.rollback();
			WLOGGER.error("", {
				error
			});
			throw error;
		}finally{
			dbcon.release();
		}
	}

	static async findMany(search?: Partial<Pick<ICiShoppinglistMemberEntity, "splUid" | "userUid">>): Promise<ShoppinglistMember[]>{
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
			const query = await dbcon.query(`SELECT * FROM \`eshol\`.\`ciShoppinglistMember\` ${whereClause};`);
			const rows = query[0] as ICiShoppinglistMemberEntity[];
			return rows.map(row => new ShoppinglistMember(row));
		}catch(err){
			// TODO: Add Data to log
			WLOGGER.error({});
			throw err;
		}finally{
			dbcon.release();
		}
	}

}