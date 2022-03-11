import { Request, Response, NextFunction } from "express";

// requestBodyJsonRequired
export const authRequired = (req: Request, res: Response, next: NextFunction): void => {
	if(req.userAccount) next();
	else res.status(401).end();
};

export default authRequired;