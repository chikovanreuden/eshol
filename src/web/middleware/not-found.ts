import { Request, Response, NextFunction } from "express";

export const notFoundHandler = (
	_req: Request,
	res: Response,
): void => {
	res.status(404).end();
};