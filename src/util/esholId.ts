import { ICiEntity } from "../types/db/Ci.Entity";
import * as id from "../id";
export const esholId = (type: ICiEntity["type"] | "ci" | "token"): string => {
	const UID_LENGTH = 32;
	let prefix = "";
	switch(type){
		case "ci":
			prefix = "ci";
			break;
		case "item":
			prefix = "itm";
			break;
		case "product":
			prefix = "prd";
			break;
		case "shoppinglist":
			prefix = "spl";
			break;
		case "user":
			prefix = "usr";
			break;
		case "token":
			prefix = "tkn";
			break;
		default:
			throw new Error("esholId_invalid_type");
	}
	if(prefix){
		const UID = id.generate((UID_LENGTH-prefix.length), "mixed");
		return prefix + UID;
	}else{
		throw new Error("esholId_invalid_type2");
	}
};
export default esholId;