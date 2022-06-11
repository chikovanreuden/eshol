import {Request, Response, Router} from "express";
import JsonResponse from "../../../../classes/JsonResponse";
import WLOGGER from "../../../../wlogger";
import { USER_RULE_VERIFICATIONTOKEN } from "../../../../lib/validatorLib";
import { User } from "../../../../cmdb";
const router = Router();
export default router;

router.get("/email/:verificationtoken", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const { verificationtoken } = req.params;
	const verData = USER_RULE_VERIFICATIONTOKEN.validate(verificationtoken.trim());
	if(verData.error){
		verData.error.details.forEach(det => rtn.addError(det.message));
		rtn.send(400);
		return;
	}

	try{
		const userAccount = await User.verifyEmail(verData.value);
		if(userAccount){
			rtn.addData("user", userAccount.toJson("private")).send();
			return;
		}
		rtn.send(404);
		return;
	}catch(error){
		rtn.addError("internal_error").send(500);
		return;
	}
});