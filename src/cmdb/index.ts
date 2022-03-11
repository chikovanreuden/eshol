import { ICiEntity } from "../types/db/Ci.Entity";
import { Connection, PoolConnection } from "mysql2/promise";
import esholId from "../util/esholId";
import WLOGGER from "../wlogger";
import { Ci } from "./Ci.class";
export * from "./Ci.class";
export * from "./User.class";
export * from "./Item.class";
export * from "./Shoppinglist.class";
export * from "./ApiToken.class";
export * from "./PwresetToken.class";
/*
*
* @return new ciuid
*/
export const createCi = async (
	type: ICiEntity["type"],
	ciName: ICiEntity["ciName"],
	dbcon: Connection | PoolConnection
): Promise<ICiEntity["ciUid"]> => {
	try{
		let newCiUid: string;
		do{
			newCiUid = esholId(type);
		}while(await Ci.ciUid_exists(newCiUid));
		await dbcon.query(
			"INSERT INTO `eshol`.`ci` SET `ciUid` = ?, `type` = ?, `ciName` = ?;",
			[newCiUid, type, ciName]
		);
		const newCiQuery = await dbcon.query("SELECT * FROM `eshol`.`ci` WHERE `ciUid` = BINARY ?", [newCiUid]);
		const newCiRows = newCiQuery[0] as ICiEntity[];
		if(newCiRows.length === 1){
			return newCiUid;
		}else{
			throw new Error("Couldn't create Ci");
		}
	}catch(e){
		WLOGGER.error("Error CMDB.create()", {
			e,
			ciParameter: {
				type,
				ciName
			}
		});
		throw e;
	}
};