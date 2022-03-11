export class HttpError extends Error {
	constructor(public code: number, message: string) {
		super(message);
		Object.setPrototypeOf(this, HttpError.prototype);
		this.name = "HttpError";
	}
}