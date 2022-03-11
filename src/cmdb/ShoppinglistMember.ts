import { ICiShoppinglistMemberEntity } from "src/types/db/CiShoppinglistMember.Entity";

const table = `${process.env.DB_DATABASE}.\`ciShoppinglistMember\``;

const privateSplMbrData = new WeakMap<any, ICiShoppinglistMemberEntity>();

export class ShoppinglistMember {
	private internal = (): ICiShoppinglistMemberEntity => {
		const val = privateSplMbrData.get(this);
		if(val) return val;
		else throw new Error("Error in User.class.ts:internal() -> Key 'this' does not exist");
	};
}