import WLOGGER from "../wlogger";
import dbp from "../db";
import * as CMDB from "./index";
import { Ci, IBaseCi } from "./index";
import { ICiItemEntity, ICiItemEntityBuy, ICiItemEntityCreate, ICiItemEntityNew, ICiItemEntityUpdate } from "../types/db/CiItem.Entity";
import { VCiItemEntity } from "../types/db/VCiItem.Entity";
import { User } from "./index";
import { ICiUserEntity } from "../types/db/CiUser.Entity";
import { getShoppinglistPermission } from "../lib/permission";

const privateItemData = new WeakMap<any, VCiItemEntity>();

export class Item extends Ci implements IBaseCi, VCiItemEntity {
	private internal = (): VCiItemEntity => {
		const val = privateItemData.get(this);
		if(val) return val;
		else throw new Error("Error in item.class.ts:internal() -> Key 'this' does not exist");
	};
	constructor(vciitem: VCiItemEntity){
		super(vciitem);
		privateItemData.set(this, vciitem);
		this.syncronized = true;
	}

	get itemUid(): ICiItemEntity["itemUid"]{ return this.internal().itemUid; }
	get name(): ICiItemEntity["name"]{ return this.internal().name; }
	get description(): ICiItemEntity["description"]{ return this.internal().description; }

	/**
	 * Represents the splUid of a Shoppinglist
	 */
	get shoppinglist(): ICiItemEntity["shoppinglist"]{ return this.internal().shoppinglist; }
	get product(): ICiItemEntity["product"]{ return this.internal().product; }

	/**
	 * Represents the userUid of a User
	 */
	get addedBy(): ICiItemEntity["addedBy"]{ return this.internal().addedBy; }
	get amount(): ICiItemEntity["amount"]{ return this.internal().amount; }
	get amountType(): ICiItemEntity["amountType"]{ return this.internal().amountType; }
	get status(): ICiItemEntity["status"]{ return this.internal().status; }
	get buyDate(): ICiItemEntity["buyDate"]{ return this.internal().buyDate; }
	get buyer(): ICiItemEntity["buyer"]{ return this.internal().buyer; }
	get buyAmount(): ICiItemEntity["buyAmount"]{ return this.internal().buyAmount; }
	get totalPrice(): ICiItemEntity["totalPrice"]{ return this.internal().totalPrice; }
	get createdAt(): ICiItemEntity["createdAt"]{ return this.internal().createdAt; }
	get updatedAt(): ICiItemEntity["updatedAt"]{ return this.internal().updatedAt; }
	get privacy(): VCiItemEntity["privacy"]{ return this.internal().privacy; }

	async buy(opt: ICiItemEntityBuy, buyer: User): Promise<void>{
		const USER_SPL_PERM = await getShoppinglistPermission(this.shoppinglist, buyer);
		if(USER_SPL_PERM === "owner" || USER_SPL_PERM === "rw"){
			const dbcon = await dbp.getConnection();
			// TODO: Change Array to Object. Maybe create a new ...Buy Interface
			// const CURRENT_TIMESTAMP = { toSqlString: () => { return 'CURRENT_TIMESTAMP()'; } };
			const setKVArray = [];
			if(opt.buyDate instanceof Date){
				setKVArray.push("`status`=\"done\"=" + dbcon.escape(opt.buyDate));
			}else{
				setKVArray.push("`buyDate`=CURRENT_TIMESTAMP()");
			}
			setKVArray.push("`buyAmount`=" + dbcon.escape(opt.buyAmount));
			setKVArray.push("`totalPrice`=" + dbcon.escape(opt.totalPrice));
			setKVArray.push("`buyer`=" + dbcon.escape(buyer.userUid));
			setKVArray.push("`status`=\"done\"");
			const query = dbcon.format("UPDATE `eshol`.`ciItem` SET " + setKVArray.join(", ") + " WHERE `itemUid` = BINARY ?;", [this.itemUid]);
			try{
				await dbcon.query(query);
			}catch(err){
				WLOGGER.error("Item.buy() Update Query Error", {err, query});
				throw err;
			}finally{
				await this.sync();
				dbcon.release();
			}
		}else{
			throw new Error("user_no_perm");
		}
	}

	toString(): string{
		return `${this.itemUid} ${this.name}`;
	}

	toJson(vis?: "public" | "private" | "internal"): Partial<Item>{
		if(vis === "private"){
			return {
				itemUid: this.itemUid,
				name: this.name,
				description: this.description,
				shoppinglist: this.shoppinglist,
				product: this.product,
				addedBy: this.addedBy,
				amount: this.amount,
				amountType: this.amountType,
				status: this.status,
				buyDate: this.buyDate,
				buyer: this.buyer,
				buyAmount: this.buyAmount,
				totalPrice: this.totalPrice,
				privacy: this.privacy,
				createdAt: this.createdAt,
				updatedAt: this.updatedAt,
				isActive: this.isActive,
				isDeleted: this.isDeleted,
				ciDeactivatedAt: this.ciDeactivatedAt,
				ciDeactivatedBy: this.ciDeactivatedBy,
				ciDeletedAt: this.ciDeletedAt,
				ciDeletedBy: this.ciDeletedBy,
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
				itemUid: this.itemUid,
				name: this.name,
				description: this.description,
				shoppinglist: this.shoppinglist,
				product: this.product,
				addedBy: this.addedBy,
				amount: this.amount,
				amountType: this.amountType,
				status: this.status,
				buyDate: this.buyDate,
				buyer: this.buyer,
				buyAmount: this.buyAmount,
				totalPrice: this.totalPrice,
				privacy: this.privacy,
				createdAt: this.createdAt,
				updatedAt: this.updatedAt,
				isActive: this.isActive,
				isDeleted: this.isDeleted
			};
		}else {
			return {
				name: this.name
			};
		}
	}

	async sync(): Promise<void>{
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiItem` WHERE `itemUid` = BINARY ?;", [this.itemUid]);
		const rows = query[0] as VCiItemEntity[];
		if(rows.length === 1){
			privateItemData.set(this, rows[0]);
		}else{
			throw new Error("Error: Item.sync() - rows.length is !== 1");
		}
	}

	async update(newData: ICiItemEntityUpdate): Promise<void> {
		const dbcon = await dbp.getConnection();
		await dbcon.beginTransaction();
		try{
			if(newData.name){
				await this.updateCi({
					ciName: newData.name
				}, dbcon);
			}
			await dbcon.query("UPDATE `eshol`.`ciItem` SET ? WHERE `itemUid` = BINARY ?;", [newData, this.itemUid]);
			await dbcon.commit();
		}catch(error){
			await dbcon.rollback();
			throw error;
		}finally{
			dbcon.release();
			await this.sync();
		}
	}

	static async create(newItem: ICiItemEntityCreate, addedBy: User): Promise<Item>{
		const dbCon = await dbp.getConnection();
		await dbCon.beginTransaction();
		try{
			const newCiUid = await CMDB.createCi("item", newItem.name, dbCon);
			// TODO: Finish!
			const newItemEntity: ICiItemEntityNew = {
				itemUid: newCiUid,
				name: newItem.name,
				description: newItem.description ? newItem.description : null,
				shoppinglist: newItem.shoppinglist,
				product: newItem.product ? newItem.product : null,
				addedBy: addedBy.userUid,
				amount: newItem.amount,
				amountType: newItem.amountType
			};
			await dbCon.query("INSERT INTO `eshol`.`ciItem` SET ?;", newItemEntity);
			const query = await dbCon.query("SELECT * FROM `eshol`.`vCiItem` WHERE `itemUid` = BINARY ?;", [newCiUid]);
			const rows = query[0] as VCiItemEntity[];
			if(rows.length === 1){
				await dbCon.commit();
				return new Item(rows[0]);
			}else{
				throw new Error("Error: Item.create - more/less than 1 Item found after creation");
			}
		}catch(error){
			await dbCon.rollback();
			WLOGGER.error("Error Item.create()", {
				error
			});
			throw error;
		}finally{
			dbCon.release();
		}
	}

	static async findAll(): Promise<Item[]>{
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiItem`;");
		const rows = query[0] as VCiItemEntity[];
		return rows.map(itm => new Item(itm));
	}

	static async findAllByShoppinglist(splUid: ICiItemEntity["shoppinglist"]): Promise<Item[]>{
		const itemsQuery = await dbp.query("SELECT * FROM `eshol`.`vCiItem` WHERE `shoppinglist` = BINARY ?;", [splUid]);
		const itemsQueryRows = itemsQuery[0] as VCiItemEntity[];
		const allItems: Item[] = itemsQueryRows.map((element) => new Item(element));
		return allItems;
	}
	static async findOneByItemUid(itemUid: ICiItemEntity["itemUid"]): Promise<Item | null>{
		const query = await dbp.query("SELECT * FROM `eshol`.`vCiItem` WHERE `itemUid` = BINARY ?;", [itemUid]);
		const rows = query[0] as VCiItemEntity[];
		if(rows.length === 1) return new Item(rows[0]);
		else return null;
	}

	static async findAllByUser(user: User | ICiUserEntity["userUid"]): Promise<Item[]>{
		const userUid = user instanceof User ? user.userUid : user;

		const query = await dbp.query("SELECT * FROM `vCiItem` WHERE `shoppinglist` IN (SELECT `splUid` FROM `eshol`.`ciShoppinglistPermission` WHERE `userUid` = ?) OR `shoppinglist` IN (SELECT `splUid` FROM ciShoppinglist WHERE `owner` = ?);", [userUid, userUid]);
		const rows = query[0] as VCiItemEntity[];
		return rows.map(row => new Item(row));
	}
}