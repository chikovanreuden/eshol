import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { USER_RULE_USERNAME } from "../../lib/validatorLib";
import JsonResponse from "../../classes/JsonResponse";
export const checkParamUsername = ((req: Request, res: Response, next: NextFunction) => {
	const rtn = new JsonResponse(res, true);
	const reqParamsValid = Joi.object({
		username: USER_RULE_USERNAME.required()
	}).validate(req.params);
	if(reqParamsValid.error){
		reqParamsValid.error.details.forEach(det => rtn.addError(det.message));
		rtn.send(400);
		return;
	}
	next();
});