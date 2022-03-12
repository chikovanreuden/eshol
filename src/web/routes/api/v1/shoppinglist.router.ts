import {Request, Response, Router} from "express";
import { getShoppinglistPermission } from "../../../../lib/permission";
import JsonResponse from "../../../../classes/JsonResponse";
import { Shoppinglist, Item, User} from "../../../../cmdb/";
import { SHOPPINGLIST_SCHEMA_CREATE, SHOPPINGLIST_SCHEMA_UPDATE } from "../../../../lib/validatorLib";
import { ICiShoppinglistEntityCreate, ICiShoppinglistEntityUpdate } from "../../../../types/db/CiShoppinglist.Entity";
const router = Router();
export default router;

router.get("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const spls = await Shoppinglist.findAll();
	let vis: "public" | "private" | "internal" = "public";
	let spls: Shoppinglist[];
	if(req.userAccount){
		switch(req.userAccount.role){
			case "admin":
				vis = "internal";
				spls = await Shoppinglist.findAll();
				rtn.addData("shoppinglist", spls.map(spl => spl.toJson(vis))).send(200);
				return;
			case "moderator":
				vis = "private";
				spls = await Shoppinglist.findAll();
				rtn.addData("shoppinglist", spls.map(spl => spl.toJson(vis))).send(200);
				return;
			default:
				vis = "public";
				spls = await Shoppinglist.findManyByUser(req.userAccount);
				rtn.addData("shoppinglist", spls.map(spl => spl.toJson(vis))).send(200);
				return;
		}
	}else{
		spls = await Shoppinglist.findMany({privacy: "public"});
		rtn.addData("shoppinglist", spls.map(spl => spl.toJson(vis))).send(200);
	}
	rtn.addData("shoppinglist", spls.map(spl => spl.toJson(vis))).send();
	return;
});

router.post("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	if(req.userAccount && req.userAccount.isActive && req.userAccount.isVerified){
		const splPostData = SHOPPINGLIST_SCHEMA_CREATE.validate(req.body);
		if(splPostData.error){
			splPostData.error.details.map(det => rtn.addError(det.message));
			rtn.send(400);
			return;
		}
		const reqBody = req.body as ICiShoppinglistEntityCreate;
		if(req.userAccount.userUid === reqBody.owner){
			const newSplCreated = await Shoppinglist.create({
				name: reqBody.name,
				owner: reqBody.owner,
				privacy: reqBody.privacy
			});
			rtn.addData("shoppinglist", newSplCreated.toJson("private")).send();
			return;
		}else if(["admin", "moderator"].includes(req.userAccount.role)){
			const user = await User.findOneByUserUid(reqBody.owner);
			if(user){
				const newSplCreated = await Shoppinglist.create({
					name: reqBody.name,
					owner: reqBody.owner,
					privacy: reqBody.privacy
				});
				rtn.addData("shoppinglist", newSplCreated.toJson("private")).send();
				return;
			}
			rtn.addError("user_not_found").send(400);
			return;
		}else{
			rtn.addError("no_permission_create_spl").send(401);
			return;
		}
	}
	rtn.send(401);
	return;
});

router.get("/:splUid", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {splUid} = req.params;
	const spl = await Shoppinglist.findOneBySplUid(splUid);
	if(spl){
		let vis: "public" | "private" | "internal" = "public";
		if(req.userAccount){
			if(req.userAccount.role === "admin") vis = "internal";
			if(req.userAccount.role === "moderator" || req.userAccount.userUid === spl.owner) vis = "private";
		}
		rtn.addData("shoppinglist", spl.toJson(vis));
	}
	rtn.send(404);
	return;
});

router.patch("/:splUid", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {splUid} = req.params;
	if(req.userAccount){
		const spl = await Shoppinglist.findOneBySplUid(splUid);
		if(spl){
			if(req.userAccount.role === "admin" || req.userAccount.role === "moderator" || req.userAccount.userUid === spl.owner){
				const postData = SHOPPINGLIST_SCHEMA_UPDATE.validate(req.body);
				if(postData.error){
					postData.error.details.map(det => rtn.addError(det.message));
					rtn.send(400);
					return;
				}
				const reqBody = req.body as ICiShoppinglistEntityUpdate;
				await spl.update(reqBody);
				rtn.addData("shoppinglist", spl.toJson((req.userAccount.role === "admin" || req.userAccount.role === "moderator" ? "internal" : "private")));
				rtn.send();
				return;
			}
			rtn.send(401);
			return;
		}
		rtn.send(404);
		return;
	}
	rtn.send(401);
	return;
});

router.delete("/:splUid", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {splUid} = req.params;
	const spl = await Shoppinglist.findOneBySplUid(splUid);
	if(spl){
		if(req.userAccount){
			if(req.userAccount.role === "admin" || req.userAccount.role === "moderator" || req.userAccount.userUid === spl.owner){
				await spl.deleteCi();
				rtn.send(204);
			}
		}else{
			rtn.send(401);
		}
	}
	rtn.send(404);
	return;
});

router.get("/:splUid/items", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {splUid} = req.params;
	const spl = await Shoppinglist.findOneBySplUid(splUid);
	const items = await Item.findAllByShoppinglist(splUid);
	if(req.userAccount){
		if(req.userAccount.role === "admin" || req.userAccount.role === "moderator"){
			rtn.addData("items", items.map(itm => itm.toJson("internal")));
			rtn.send();
			return;
		}
		if(req.userAccount.userUid === spl.owner){
			rtn.addData("items", items.map(itm => itm.toJson("private")));
			rtn.send();
			return;
		}
		const perm = await getShoppinglistPermission(spl, req.userAccount);
		if(perm){
			rtn.addData("items", items.map(itm => itm.toJson("private")));
			rtn.send();
			return;
		}
	}
	rtn.send(401);
	return;
});