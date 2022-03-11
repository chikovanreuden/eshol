import { Request, Response, NextFunction } from "express";
import JsonResponse from "../../classes/JsonResponse";

// requestBodyJsonRequired
export const jsonBodyRequired = (req: Request, res: Response, next: NextFunction): void => {
	// req.get('content-type') !== "application/json"
	if (req.header('Content-Type') !== "application/json") {
		const rtn = new JsonResponse(res, true).addError("Header \"Content-Type: 'application/json'\" required").build();
		res.status(406).json(rtn);
		return;
	}
	try{
		JSON.parse(req.body);
	}catch(err){
		const rtn = new JsonResponse(res, true).addError("JSON Request Body is required").build();
		res.status(400).json(rtn);
		return;
	}
	next();
};

export default jsonBodyRequired;