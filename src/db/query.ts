import { ICiEntity } from "src/types/db/Ci.Entity";

type TField<T> = keyof T;
type TOp = "like" | "=" | "<" | ">";
type TValue = any;

type TWhere<T> = [TField<T>, TOp, TValue];

export class DBTable<T> {
	public table: string;
	constructor(table: string, ){
		this.table = table;
	}
	select(fields: (keyof T)[]): this {
		return this;
	}
	where(where: TWhere<T>): this{
		return this;
	}
	// static where<T>(field: TField<T>, op: TOp, value: TValue): string{

	// };
}
export default DBTable;

const query = new DBTable<ICiEntity>("ci").select(["ciName", "ciUid"]).where(["ciName", "=", "test"]);
// DB.where<ICiEntity>("ciCreatedAt", ">", 2);