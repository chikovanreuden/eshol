import {Request, Response, Router} from "express";
import JsonResponse from "../../../../classes/JsonResponse";
import authRequired from "../../../middleware/authRequired";
const router = Router();
router.all("/", (_req: Request, res: Response) => {
	res.json({
		message: "root"
	});
});
export default router;

router.get("/profile/me", authRequired, (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	rtn.addData("user", req.userAccount?.toJson());
	rtn.send();
});