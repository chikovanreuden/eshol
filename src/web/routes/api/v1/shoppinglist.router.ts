/**
 * TODO: Check for HTTP Response Codes and Clean it up. Change False 401s to 403 if the User is authenticated but its Permissions are insufficient
 */

import {Request, Response, Router} from "express";
import { getShoppinglistPermission } from "../../../../lib/permission";
import JsonResponse from "../../../../classes/JsonResponse";
import { Shoppinglist, Item, User} from "../../../../cmdb/";
import { SHOPPINGLISTMEMBER_RULE_PERMISSION, SHOPPINGLIST_SCHEMA_CREATE, SHOPPINGLIST_SCHEMA_UPDATE, USER_RULE_USERNAME } from "../../../../lib/validatorLib";
import { ICiShoppinglistEntityCreate, ICiShoppinglistEntityUpdate } from "../../../../types/db/CiShoppinglist.Entity";
import { ShoppinglistMember} from "../../../../cmdb/ShoppinglistMember";
import Joi from "joi";
import { ICiUserEntity } from "../../../../types/db/CiUser.Entity";
import { ICiShoppinglistMemberEntity } from "../../../../types/db/CiShoppinglistMember.Entity";
const router = Router();
export default router;

/**
 * Get All Shoppinglists*
 * If the Client/User is not authenticated:
 * Show all Shoppinglists wich have set Privacy set to "public".
 * If authenticated and Client/User has Roles "admin" or "moderator":
 * Show all Shoppinglists
 * If authenticated but without any special Role:
 * Show all public Shoppinglists and those the User has Permissions to, like "read" (r) or "read/write" (rw)
 */
router.get("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
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
				rtn.addData("shoppinglist", newSplCreated.toJson("internal")).send(200);
				return;
			}else{
				rtn.addError("spl_create_user_not_found").send(404);
				return;
			}
		}else{
			rtn.addError("spl_create_no_permission").send(401);
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
			}else{
				rtn.send(403);
				return;
			}
		}else{
			rtn.send(404);
			return;
		}
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
				return;
			}
		}else{
			rtn.send(401);
			return;
		}
	}
	rtn.send(404);
	return;
});

router.get("/:splUid/items", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {splUid} = req.params;
	const [spl, items] = await Promise.all([await Shoppinglist.findOneBySplUid(splUid), await Item.findAllByShoppinglist(splUid)]);
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
		}else{
			rtn.send(403);
			return;
		}
	}
	rtn.send(401);
	return;
});

router.get("/:splUid/permissions", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {splUid} = req.params;
	const spl = await Shoppinglist.findOneBySplUid(splUid);
	if(spl){
		if(req.userAccount){
			if(req.userAccount.role === "admin" || req.userAccount.role === "moderator"){
				const perms = await spl.getUserPermissions();
				rtn.addData("permissions", perms.map(perm => {
					return {
						permission: perm.permission,
						user: perm.user.toJson("internal")
					};
				}));
				rtn.send();
				return;
			}else if(req.userAccount.userUid === spl.owner){
				if(spl.isActive){
					const perms = await spl.getUserPermissions();
					rtn.addData("permissions", perms.filter(perm => perm.user.isActive === true).map(perm => {
						return {
							permission: perm.permission,
							user: perm.user.toJson("private")
						};
					}));
					rtn.send();
					return;
				}else{
					rtn.send(404);
					return;
				}
			}else{
				rtn.send(403);
				return;
			}
		}
	}
	rtn.send(404);
	return;
});


router.post("/:splUid/permissions", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {splUid} = req.params;
	const spl = await Shoppinglist.findOneBySplUid(splUid);
	if(spl){
		if(req.userAccount){
			if(req.userAccount.role === "admin" || req.userAccount.role === "moderator" || req.userAccount.userUid === spl.owner){
				const schema = Joi.object({
					permission: SHOPPINGLISTMEMBER_RULE_PERMISSION.required(),
					username: USER_RULE_USERNAME.required()
				});
				interface IShoppinglistMemberNew {
					username: ICiUserEntity["username"]
					permission: ICiShoppinglistMemberEntity["permission"]
				}
				const postData = schema.validate(req.body);
				if(postData.error){
					postData.error.details.forEach(det => rtn.addError(det.message));
					rtn.send(400);
					return;
				}
				const reqBody = req.body as IShoppinglistMemberNew;
				const user = await User.findOneByUsername(reqBody.username);
				if(user){
					if(user.isActive){
						await spl.addUserPermission(user, reqBody.permission);
						rtn.send(204);
						return;
					}else{
						rtn.addError("user_not_active");
						rtn.send();
						return;
					}
				}else{
					rtn.addError("user_not_found");
					rtn.send(404);
					return;
				}
			}else{
				rtn.send(403);
				return;
			}
		}
	}
	rtn.addError("spl_not_found");
	rtn.send(404);
	return;
});

router.delete("/:splUid/permissions", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const {splUid} = req.params;
	const spl = await Shoppinglist.findOneBySplUid(splUid);
	if(spl){
		if(req.userAccount){
			if(req.userAccount.role === "admin" || req.userAccount.role === "moderator" || req.userAccount.userUid === spl.owner){
				const schema = Joi.object({
					username: USER_RULE_USERNAME.required()
				});
				const postData = schema.validate(req.body);
				if(postData.error){
					postData.error.details.forEach(det => rtn.addError(det.message));
					rtn.send(400);
					return;
				}
				interface IShoppinglistMemberDelete {
					username: ICiUserEntity["username"]
				}
				const reqBody = req.body as IShoppinglistMemberDelete;
				const user = await User.findOneByUsername(reqBody.username);
				if(user){
					await ShoppinglistMember.delete(spl, user);
					rtn.send(204);
					return;
				}else{
					rtn.addError("user_not_found");
					rtn.send(404);
					return;
				}
			}else{
				rtn.send(403);
				return;
			}
		}
	}
	rtn.addError("spl_not_found");
	rtn.send(404);
	return;
});