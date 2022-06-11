import { Response } from "express";
import WLOGGER from "../wlogger";

export interface IJsonResponse {
	rid: string | undefined
	result: "ok" | "error" | "internal_error"
	status: number
	errors: string[]
	data: Record<string, any>
	message: string | undefined
}

interface IJsonResponsePrivateData extends IJsonResponse {
	res: Response
}

const privateMap = new WeakMap<any, IJsonResponsePrivateData>();

export class JsonResponse {
	private clearDataOnError: boolean;
	private isSend = false;
	private internal = (): IJsonResponsePrivateData => {
		const val = privateMap.get(this);
		if(val) return val;
		else throw new Error("Error in JsonResponse.internal() -> Key 'this' does not exist");
	};
	constructor(res: Response, clearDataOnError: boolean, message?: string){
		privateMap.set(this, {
			message,
			result: "ok",
			res,
			rid: res.rid,
			data: {},
			errors: [],
			status: 200
		});
		this.clearDataOnError = clearDataOnError;
	}
	set message(msg: IJsonResponse["message"]) {
		this.internal().message = msg;
	}
	get message(): IJsonResponse["message"]{ return this.internal().message; }
	addError(e: string): this {
		this.internal().errors.push(e);
		return this;
	}
	get rid(): IJsonResponse["rid"] { return this.internal().rid; }
	get result(): IJsonResponse["result"] { return this.internal().result; }
	set result(result: IJsonResponse["result"]) { this.internal().result = result; }
	get errors(): IJsonResponse["errors"] { return this.internal().errors; }
	get data(): IJsonResponse["data"]  { return this.internal().data; }
	get status(): IJsonResponse["status"]  { return this.internal().status; }
	get hasErrors(): boolean {
		return this.internal().errors.length > 0;
	}
	addData(name: string, data: unknown): this {
		if(this.internal().data[name]){
			throw new Error("Cannot overwrite existing property '" + name + "'");
		}
		this.internal().data[name] = data;
		return this;
	}

	clearData(): void{
		for (const key of Object.keys(this.internal().data)) {
			delete this.internal().data[key];
		}
	}

	build(): Partial<IJsonResponse> {
		const rtn: Partial<IJsonResponse> = {};
		if(this.message && this.message.length > 0){
			rtn.message = this.message;
		}
		if(this.hasErrors || this.status === 500){
			this.clearData();
			rtn.rid = this.rid;
			rtn.errors = this.errors;
			rtn.result = "error";
			return rtn;
		}
		if(this.hasErrors && this.clearDataOnError){
			this.clearData();
		}
		if( Object.keys(this.data).length > 0){
			rtn.data = this.data;
		}
		return rtn;
	}

	send(httpCode = 200): void {
		this.internal().status = httpCode;
		if(this.isSend === true) throw new Error("Cannot send a Response. Response has already been send!");
		if(httpCode >= 200 && httpCode <= 299){
			if(httpCode === 204){
				this.internal().res.status(httpCode).end();
				return;
			}
			if(this.hasErrors){
				const err_msg = "httpCode_200_JsonResponse_hasErrors";
				WLOGGER.error(err_msg, {
					err: new Error(err_msg),
					build: this.build()
				});
			}
			this.internal().res.status(httpCode).json(this.build());
			return;
		} else {
			if(this.clearDataOnError) Object.keys(this.data).forEach(key => delete this.data[key]);
			if(httpCode >= 400 && httpCode <= 499){
				if(httpCode === 404){
					this.internal().res.status(httpCode).end();
					return;
				}
				this.internal().res.status(httpCode).json();
			}else if(httpCode >= 500 && httpCode <= 599){
				this.message = "internal_error";
				this.result = "error";
				this.clearData();
				this.internal().res.status(500).json(this.build());
				return;
			}
		}
		this.isSend = true;
	}
}

export default JsonResponse;