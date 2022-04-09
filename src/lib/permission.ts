import dbp from "../db";
import { User, Shoppinglist } from "../cmdb";
import { ICiShoppinglistEntity } from "../types/db/CiShoppinglist.Entity";
import { ICiShoppinglistPermissionEntity } from "../types/db/CiShoppinglistPermission.Entity";
import { ICiUserEntity } from "../types/db/CiUser.Entity";

export const getShoppinglistPermission = async (spl: Shoppinglist | ICiShoppinglistEntity["splUid"], user: User | ICiUserEntity["userUid"]): Promise<ICiShoppinglistPermissionEntity["permission"] | "owner" | null> => {
	const userUid = user instanceof User ? user.userUid : user;
	if(! (spl instanceof Shoppinglist)) spl = await Shoppinglist.findOneBySplUid(spl);
	if(spl.owner === userUid) return "owner";
	const query = await dbp.query("SELECT * FROM `eshol`.`ciShoppinglistPermission` WHERE `splUid` = BINARY ? AND `userUid` = BINARY ?;", [spl.splUid, userUid]);
	const rows = query[0] as ICiShoppinglistPermissionEntity[];
	if(rows.length === 1) return rows[0].permission;
	return null;
};