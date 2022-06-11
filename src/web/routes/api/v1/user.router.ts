import {Request, Response, Router} from "express";
import Joi from "joi";
import { CI_RULE_CIUID, USER_RULE_USERNAME, USER_SCHEMA_REGISTER, USER_SCHEMA_UPDATE, USER_SCHEMA_UPDATE_SELF } from "../../../../lib/validatorLib";
import { ICiUserEntityRegister, ICiUserEntityUpdate, ICiUserEntityUpdateSelf } from "../../../../types/db/CiUser.Entity";
import WLOGGER from "../../../../wlogger";
import JsonResponse from "../../../../classes/JsonResponse";
import Visibility from "../../../../types/Vis";
import { Item, Shoppinglist, User} from "../../../../cmdb/";
import { checkParamUsername } from "../../../middleware/checkParams";
const router = Router();
export default router;

/**
 * responses:
 * 200
 * 400
 * 404
 */

router.get("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	let vis: "public" | "private" | "internal" = "public";
	if(req.userAccount){
		if(req.userAccount.role === "admin"){
			vis = "internal";
		}
		if(req.userAccount.role === "moderator"){
			vis = "private";
		}
	}
	if(req.query.username){
		const usernameParameter = USER_RULE_USERNAME.required().validate(req.query.username);
		if(usernameParameter.error){
			usernameParameter.error.details.forEach(det => rtn.addError(det.message));
			rtn.send(400);
			return;
		}
		const user = await User.findOneByUsername(req.query.username as string);
		if(user){
			rtn.addData("user", user.toJson(vis)).send(200);
			return;
		}
		rtn.send(404);
		return;
	}

	let allUsers: User[];
	if(vis === "public"){
		allUsers = await User.findAllFilter({isActive: true});
	}
	allUsers = await User.findAll();
	rtn.addData("users", allUsers.map(user => user.toJson(vis))).send();
});

router.post("/", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const userData = USER_SCHEMA_REGISTER.validate(req.body);
	if(userData.error){
		userData.error.details.forEach(det => rtn.addError(det.message));
		rtn.send(400);
		return;
	}
	const {username, email, password, displayname} = req.body as ICiUserEntityRegister;

	const usernameAv = await User.usernameAvaliability(username);
	if(!usernameAv){
		rtn.message = "username_not_avalible";
		rtn.send();
		return;
	}

	const emailAv = await User.emailAvaliability(email);
	if(!emailAv){
		rtn.message = "email_not_avalible";
		rtn.send();
		return;
	}
	try {
		const user = await User.create({username, email, password, displayname});
		rtn.addData("user", user.toJson("private")).send(201);
		return;
	} catch (error) {
		WLOGGER.error("Error while creating User", {
			file: "user.router.ts",
			function: "router.post('/')",
			rid: req.rid,
			param: {
				username,
				displayname,
				email,
				password: "**censored**"
			},
			error
		});
		rtn.addError("user_registration_failed").send(500);
		return;
	}
});

router.get("/id/:userUid", async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const reqParamsValid = Joi.object({
		userUid: CI_RULE_CIUID.required()
	}).validate(req.params);
	if(reqParamsValid.error){
		reqParamsValid.error.details.forEach(det => rtn.addError(det.message));
		rtn.send(400);
		return;
	}
	const ciUser = await User.findOneByUserUid(req.params.userUid);
	if(ciUser){
		let vis: Visibility = "public";
		if(req.userAccount){
			if(req.userAccount.role === "admin") vis = "internal";
			if(req.userAccount.role === "moderator") vis = "private";
		}
		rtn.addData("user", ciUser.toJson(vis)).send();
		return;
	}
	rtn.send(404);
	return;
});

router.get("/:username", checkParamUsername, async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	const ciUser = await User.findOneByUsername(req.params.username);
	if(ciUser){
		let vis: Visibility = "public";
		if(req.userAccount){
			if(req.userAccount.role === "admin") vis = "internal";
			if(req.userAccount.role === "moderator") vis = "private";
		}
		rtn.addData("user", ciUser.toJson(vis)).send();
		return;
	}
	rtn.send(404);
	return;
});

router.get("/:username/shoppinglists", checkParamUsername, async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	if(req.userAccount){
		const vis: Visibility = ["admin", "moderator"].includes(req.userAccount.role) ? "internal" : "private";
		if(req.userAccount.username === req.params.username){
			const spls = await Shoppinglist.findManyByUser(req.userAccount);
			rtn.addData("shoppinglists", spls.map(spl => spl.toJson(vis)));
			return;
		}else if(["admin", "moderator"].includes(req.userAccount.role)){
			const user = await User.findOneByUsername(req.params.username);
			if(user){
				const spls = await Shoppinglist.findManyByUser(user);
				rtn.addData("shoppinglists", spls.map(spl => spl.toJson("internal")));
				return;
			}else{
				rtn.send(404); // user_not_found
				return;
			}
		}
	}
	rtn.send(401);
	return;
});

router.get("/:username/items", checkParamUsername, async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	if(req.userAccount){
		const vis: Visibility = ["admin", "moderator"].includes(req.userAccount.role) ? "internal" : "private";
		if(req.userAccount.username === req.params.username){
			const items = await Item.findAllByUser(req.userAccount);
			rtn.addData("items", items.map(item => item.toJson(vis)));
			return;
		}else if(["admin", "moderator"].includes(req.userAccount.role)){
			const user = await User.findOneByUsername(req.params.username);
			if(user){
				const items = await Item.findAllByUser(user);
				rtn.addData("items", items.map(item => item.toJson(vis)));
				return;
			}else{
				rtn.send(404); // user_not_found
				return;
			}
		}
	}
	rtn.send(401);
	return;
});

// router.patch("/:username", authRequired, async (req: Request, res: Response) => {
// 	if(req.userAccount){
// 		if(req.params.username === req.userAccount.username){
// 			const user = req.userAccount;
// 			type IReqBodyUserUpdate = Partial<Pick<User, "displayname">>;
// 			const reqBody: IReqBodyUserUpdate = req.body;
// 			if(reqBody.displayname) user.displayname = reqBody.displayname;
// 			try{
// 				await user.save();
// 			}catch(error){
// 				WLOGGER.error();
// 				throw error;
// 			}
// 		}
// 	}else{
// 		res.status(401).end();
// 		return;
// 	}

// });

router.patch("/:username", checkParamUsername, async (req: Request, res: Response) => {
	const rtn = new JsonResponse(res, true);
	if(req.userAccount){
		if(req.userAccount.role === "admin"){
			const reqBodyData = USER_SCHEMA_UPDATE.validate(req.body);
			if(reqBodyData.error){
				reqBodyData.error.details.forEach(detail => rtn.addError(detail.message));
				rtn.send(400);
				return;
			};
			const reqBody = req.body as ICiUserEntityUpdate;
			const user = await User.findOneByUsername(req.params.username);
			if(user){
				try{
					if(reqBody.role) await user.setRole(reqBody.role);
					await user.update(reqBody);
					rtn.addData("user", user.toJson("internal")).send();
					return;
				}catch(error){
					WLOGGER.error("Error while patching User", {
						error,
						file: "user.router.ts",
						function: 'router.patch("/:username/")',
						rid: req.rid,
						params: reqBody
					});
					rtn.addError("error while saving/setting user props");
					rtn.send(500);
					return;
				}
			}
			rtn.send(404);
			return;
		}else if(req.params.username === req.userAccount.username){
			const user = req.userAccount;
			const reqBodyData = USER_SCHEMA_UPDATE_SELF.validate(req.body);
			if(reqBodyData.error){
				reqBodyData.error.details.forEach(det => rtn.addError(det.message));
				rtn.send(400);
				return;
			}
			const reqBody = req.body as ICiUserEntityUpdateSelf;
			try{
				await user.update(reqBody);
				rtn.addData("user", {
					displayname: user.displayname,
					username: user.username,
					userUid: user.userUid
				});
				rtn.send();
				return;
			}catch(error){
				WLOGGER.error("Error while patchin User", {
					error,
					file: "user.router.ts",
					function: 'router.patch("/:username/")',
					rid: req.rid,
					params: reqBody
				});
				rtn.addError("error while saving/setting user props");
				rtn.send(500);
				return;
			}
		}
	}
	res.status(401).end();
	return;
});