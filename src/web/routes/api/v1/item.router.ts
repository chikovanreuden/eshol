import {NextFunction, Request, Response, Router} from "express";
import WLOGGER from "../../../../wlogger";
import { Shoppinglist } from "../../../../cmdb/Shoppinglist.class";
import { User } from "../../../../cmdb/User.class";
import { getShoppinglistPermission } from "../../../../lib/permission";
import { ITEM_SCHEMA_BUY, ITEM_SCHEMA_CREATE, ITEM_SCHEMA_UPDATE } from "../../../../lib/validatorLib";
import { ICiItemEntityBuy, ICiItemEntityCreate, ICiItemEntityUpdate } from "../../../../types/db/CiItem.Entity";
import JsonResponse from "../../../../classes/JsonResponse";
import { Item } from "../../../../cmdb/Item.class";
import Visibility from "../../../../types/Vis";
const router = Router();
export default router;

router.get("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res,true);
	if(req.userAccount){
		if(["admin", "moderator"].includes(req.userAccount.role)){
			const items = await Item.findAll();
			rtn.addData("items", items.map(itm => itm.toJson("internal")));
			rtn.send();
			return;
		}else{
			// const spls = await req.userAccount.getShoppinglistsAsync();
			// const items: Item[] = [];
			// for(const spl of spls){
			// 	const thisSplItems = await spl.getItemsAsync();
			// 	thisSplItems.forEach(itm => items.push(itm));
			// }
			// rtn.addData("items", spls.map(spl => spl.toJson("private"))).send();
			const items = await Item.findAllByUser(req.userAccount);
			rtn.addData("items", items.map(item => item.toJson("private"))).send();
			rtn.send();
			return;
		}
	}
	rtn.send(401);
	return;
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
	const rtn = new JsonResponse(res, true);
	if(req.userAccount){
		const postData = ITEM_SCHEMA_CREATE.validate(req.body);
		if(postData.error){
			postData.error.details.map(det => rtn.addError(det.message));
			rtn.send(400);
			return;
		}
		const reqBody = req.body as ICiItemEntityCreate;
		try{
			const spl = await Shoppinglist.findOneBySplUid(reqBody.shoppinglist);
			let user: User | null = null;
			let vis: Visibility = "public";
			if(["admin", "moderator"].includes(req.userAccount.role)){
				user = req.userAccount;
				vis = "internal";
			}else{
				const perm = await getShoppinglistPermission(spl, req.userAccount);
				if(perm === "owner" || perm === "rw"){
					user = req.userAccount;
					vis = "private";
				}
			}
			if(user){
				const itm = await Item.create(reqBody, user);
				if(itm){
					rtn.addData("item", itm.toJson(vis));
					rtn.send();
					return;
				}
			}else{
				rtn.send(401);
				return;
			}
		}catch(err){
			WLOGGER.error("Error in item.router.ts", err);
			next(err);
		}
	}
	rtn.send(401);
});

router.get("/:itemUid", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {itemUid} = req.params;
	if(req.userAccount){
		const item = await Item.findOneByItemUid(itemUid);
		if(item){
			if(["admin", "moderator"].includes(req.userAccount.role)){
				rtn.addData("item", item.toJson("internal"));
				rtn.send();
				return;
			}else{
				const perm = await getShoppinglistPermission(item.shoppinglist, req.userAccount);
				if(perm){
					rtn.addData("item", item.toJson("private"));
					rtn.send();
					return;
				}else{
					rtn.send(401);
					return;
				}
			}
		}else{
			rtn.send(404);
			return;
		}
	}
	rtn.send(401);
});

router.post("/:itemUid/buy", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {itemUid} = req.params;
	if(req.userAccount){
		const item = await Item.findOneByItemUid(itemUid);
		if(item){
			const perm = await getShoppinglistPermission(item.shoppinglist, req.userAccount);
			if(perm === "owner" || perm === "rw" || ["admin", "moderator"].includes(req.userAccount.role)){
				const postData = ITEM_SCHEMA_BUY.validate(req.body);
				if(postData.error){
					postData.error.details.forEach(det => rtn.addError(det.message));
					rtn.send(400);
					return;
				}
				const reqBody = req.body as ICiItemEntityBuy;
				await item.buy(reqBody, req.userAccount);
				rtn.addData("item", item.toJson("private"));
				rtn.send();
				return;
			}else{
				rtn.send(401);
				return;
			}
		}else{
			rtn.send(404);
			return;
		}
	}
	rtn.send(401);
});

router.patch("/:itemUid", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {itemUid} = req.params;
	if(req.userAccount){
		const item = await Item.findOneByItemUid(itemUid);
		if(item){
			const perm = await getShoppinglistPermission(item.shoppinglist, req.userAccount);
			if(perm === "owner" || perm === "rw" || ["admin", "moderator"].includes(req.userAccount.role)){
				const postData = ITEM_SCHEMA_UPDATE.validate(req.body);
				if(postData.error){
					postData.error.details.forEach(det => rtn.addError(det.message));
					rtn.send(400);
					return;
				}
				const reqBody = req.body as ICiItemEntityUpdate;
				await item.update(reqBody);
				rtn.addData("item", item.toJson("private"));
				rtn.send();
				return;
			}else{
				rtn.send(401);
				return;
			}
		}else{
			rtn.send(404);
			return;
		}
	}
	rtn.send(401);
});

router.delete("/:itemUid", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {itemUid} = req.params;
	if(req.userAccount){
		const item = await Item.findOneByItemUid(itemUid);
		if(item){
			const perm = await getShoppinglistPermission(item.shoppinglist, req.userAccount);
			if(["admin", "moderator"].includes(req.userAccount.role) || perm === "owner" || perm === "rw"){
				await item.deleteCi(req.userAccount);
				rtn.send(200);
				return;
			}else{
				rtn.send(401);
				return;
			}
		}else{
			rtn.send(404);
			return;
		}
	}else{
		rtn.send(401);
		return;
	}
});