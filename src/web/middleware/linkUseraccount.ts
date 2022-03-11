import { Request, Response, NextFunction } from "express";
import { User } from "../../cmdb/User.class";
import WLOGGER from "../../wlogger";
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const linkUserAccount = (async (req: Request, _res: Response, next: NextFunction) => {
	const REQUEST_API_KEY = req.header("X-API-Key");
	WLOGGER.debug("X-API-Key", {token: REQUEST_API_KEY});
	if( REQUEST_API_KEY && typeof REQUEST_API_KEY === "string"){
		try{
			const userAccount = await User.findOneByApitoken(REQUEST_API_KEY, true);
			if(userAccount && userAccount.isActive === true && userAccount.isVerified === true){
				req.userAccount = userAccount;
			}
		}catch(err){
			WLOGGER.error("web_core_api_error_linkUserAccount", err);
			req.userAccount = null;
		}
	}
	WLOGGER.debug("Link UserAccount:", req.userAccount instanceof User ? {
		username: req.userAccount.username,
		userUid: req.userAccount.userUid,
		role: req.userAccount.role
	} : null);
	next();
});

export default linkUserAccount;