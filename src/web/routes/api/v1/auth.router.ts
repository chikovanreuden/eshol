import {Request, Response, Router} from "express";
import Joi from "joi";
import JsonResponse from "../../../../classes/JsonResponse";
import { User, ApiToken} from "../../../../cmdb";
import { ICiUserEntity } from "../../../../types/db/CiUser.Entity";
import * as regex from "../../../../util/regex";
const router = Router();
export default router;

interface ILoginBody {
	loginname: ICiUserEntity["username"] | ICiUserEntity["email"]
	password: string
}

router.get("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	if(req.userAccount){
		rtn.addData("user", req.userAccount.toJson("private"));
		const apiTokens = await ApiToken.findManyByUser(req.userAccount);
		rtn.addData("apitoken", apiTokens);
		rtn.send();
	}else{
		rtn.send(401);
	}
});

// router.post("/", async (req: Request, res: Response) => {
// 	const rtn = new JsonResponse(res, true);
// 	const loginBodyData = Joi.object({
// 		loginname: Joi.string().min(3).max(64).required(),
// 		password: Joi.string().min(12).max(64).required()
// 	}).validate(req.body);
// 	if(loginBodyData.error){
// 		loginBodyData.error.details.forEach(details => rtn.addError(details.message));
// 		rtn.send(400);
// 		return;
// 	}
// 	const reqBody = req.body as ILoginBody;
// 	const loginInfo = await User.login(reqBody.loginname, reqBody.password);
// 	if(loginInfo){
// 		rtn.addData("user", loginInfo.user.toJson("private"));
// 		rtn.addData("apitoken", loginInfo.apitoken.toJson("private"));
// 		rtn.send();
// 		return;
// 	}else{
// 		rtn.send(401);
// 		return;
// 	}
// });

router.post("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const loginBodyData = Joi.object({
		loginname: Joi.string().min(3).max(64).required(),
		password: Joi.string().min(12).max(64).required()
	}).validate(req.body);
	if(loginBodyData.error){
		loginBodyData.error.details.forEach(details => rtn.addError(details.message));
		rtn.send(400);
		return;
	}
	const reqBody = req.body as ILoginBody;
	let user: User | null;
	if(regex.isValidEmailAddress(reqBody.loginname)){
		user = await User.findOneByEmail(reqBody.loginname);
	}else if(regex.isValidUsername(reqBody.loginname)){
		user = await User.findOneByUsername(reqBody.loginname);
	}else{
		rtn.send(401);
		return;
	}
	if(user){
		if(user.isVerified !== true){
			rtn.addError("user_not_verified").send(401);
			return;
		}else if(user.isActive === true){
			if(await user.checkPassword(reqBody.password) === true){
				const apitoken = await ApiToken.create(user);
				if(apitoken){
					rtn.addData("apitoken", apitoken.toJson("private"));
					rtn.addData("user", user.toJson("private"));
					rtn.send(200);
					return;
				}
			}
		}
	}
	rtn.send(401);
	return;
});

router.delete("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const token = req.header("X-API-Key");
	if(token){
		const tkn = await ApiToken.findOneByApiToken(token);
		if(tkn){
			try {
				await tkn.update({active: "N"});
				rtn.send(204);
				return;
			} catch (error) {
				rtn.addError("internal_error").send(500);
				return;
			}
		}
	}
	res.status(401).end();
});