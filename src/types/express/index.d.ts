import { User } from "../../cmdb/User.class";
declare module 'express-serve-static-core' {
	interface Request {
		userAccount: User | null
		rid: string
	}
	interface Response {
		cspNonce: string
		rid: string
		locals: Record<string, any>
	}
}

declare global {
	namespace Express {
		interface Request {
			userAccount: User | null
			rid: string
		}
		interface Response {
			cspNonce: string
			rid: string
			locals: Record<string, any>
		}
	}
}