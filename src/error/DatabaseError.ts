
type DatabaseErrorType = "not_unique" | "not_found";

export class DatabaseError extends Error{
	public type: DatabaseErrorType;
	public sql?: string;
	constructor(type: DatabaseErrorType, message: string, sql?: string){
		super(message);
		Object.setPrototypeOf(this, DatabaseError.prototype);
		this.name = "DatabaseError";
		this.type = type;
		this.sql = sql;
	}
}