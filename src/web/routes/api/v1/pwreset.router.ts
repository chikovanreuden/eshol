import {Request, Response, Router} from "express";
import Joi from "joi";
import JsonResponse from "../../../../classes/JsonResponse";
import { LOGINBODY_SCHEMA, PWRESETTOKEN_RULE_TOKEN } from "../../../../lib/validatorLib";
import { User, PwresetToken} from "../../../../cmdb";
import * as mailer from "../../../../mailer";
import dbp from "../../../../db";
import * as pw from "../../../../pw";
import { ILoginBody } from "../../../../types/common";

const router = Router();
export default router;

interface IPwResetBody {
	loginname: string
}

router.post("/:pwresetToken", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const { pwresetToken } = req.params;
	const verData = PWRESETTOKEN_RULE_TOKEN.validate(pwresetToken.trim());
	if(verData.error){
		verData.error.details.forEach(det => rtn.addError(det.message));
		rtn.send(400);
		return;
	}
	const loginBodyData = LOGINBODY_SCHEMA.validate(req.body);
	if(loginBodyData.error){
		loginBodyData.error.details.forEach(details => rtn.addError(details.message));
		rtn.send(400);
		return;
	}
	const reqBody = req.body as ILoginBody;
	const token = await PwresetToken.findOneByToken(pwresetToken);
	if(token && token.used === "N"){
		// TODO: Check token.createdAt. Set something like 10 min
		const TIMESTAMP_NOW = new Date().getTime();
		const MAX_THRESHHOLD_MINUTES = 15 * 60 * 1000;
		const TIMESTAMP_TOKEN = new Date(token.createdAt).getTime();
		if( (TIMESTAMP_NOW - TIMESTAMP_TOKEN) > MAX_THRESHHOLD_MINUTES){
			rtn.addError("pwresettoken_too_old");
			rtn.send(200);
			return;
		}
		const user = await User.findOneByUserUid(token.userUid);
		if(user){
			if(user.username === reqBody.loginname || user.email === reqBody.loginname){
				const pwHash = await pw.hash(reqBody.password);
				await dbp.query(
					"INSERT INTO `eshol`.`userpasswd` (`ciUser_userUid`, `pwhash`) VALUES (?, ?);",
					[user.userUid, pwHash]
				);
				await token.update({used: "Y"});
				rtn.addData("user", user.toJson("public"));
				rtn.send(200);
				await mailer.sendEmailUserPwResetConfimation(user);
				return;
			}else{
				rtn.addError("pwresettoken_invalid_2").send(403);
				return;
			}
		}else{
			rtn.addError("user_not_found").send(404);
			return;
		}
	}else{
		rtn.addError("pwresettoken_invalid").send(403);
		return;
	}
});

router.post("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const reqBodyValidationSchema = Joi.object({
		email: Joi.string().email().required()
	});
	const reqBodyData = reqBodyValidationSchema.validate(req.body);
	if(reqBodyData.error){
		reqBodyData.error.details.forEach(det => rtn.addError(det.message));
		rtn.send(400);
		return;
	}
	const reqBody = req.body as IPwResetBody;
	const user = await User.findOneByEmail(reqBody.loginname);
	if(user){
		const pwresettoken = await PwresetToken.create(user);
		await mailer.sendEmailUserPwResetToken(user, pwresettoken.token);
	}
	rtn.send(204);
});