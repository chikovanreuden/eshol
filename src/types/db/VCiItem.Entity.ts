import { ICiEntity } from "./Ci.Entity";
import { ICiItemEntity } from "./CiItem.Entity";
import { ICiShoppinglistEntity } from "./CiShoppinglist.Entity";

export interface VCiItemEntity extends ICiEntity, ICiItemEntity {
	privacy: ICiShoppinglistEntity["privacy"]
}