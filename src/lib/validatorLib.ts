import Joi from 'joi';
import * as regex from "../util/regex";

export const LOGINNAME_RULE = Joi.string().min(3).max(64);
export const LOGINBODY_SCHEMA = Joi.object({
	loginname: LOGINNAME_RULE.required(),
	password: Joi.string().min(12).max(64).required()
});

export const CI_RULE_CIUID = Joi.string().length(32);
export const CI_RULE_NAME = Joi.string().min(3).max(64);
export const USER_RULE_USERNAME = Joi.string().pattern(regex.patttern.REGEX_USERNAME);
export const USER_RULE_EMAIL = Joi.string().email();
export const USER_RULE_PASSWORD = Joi.string().pattern(regex.patttern.REGEX_PASSWORD);
export const USER_RULE_DISPLAYNAME = Joi.string().min(1).max(64);
export const USER_RULE_ROLE = Joi.valid("guest", "user", "moderator", "admin");
export const USER_RULE_ACTIVE = Joi.string().length(1);
export const USER_RULE_VERIFICATIONTOKEN = Joi.string().length(64);

export const USER_SCHEMA_REGISTER = Joi.object({
	username: USER_RULE_USERNAME.required(),
	email: USER_RULE_EMAIL.required(),
	password: USER_RULE_PASSWORD.required(),
	displayname: USER_RULE_DISPLAYNAME
});

export const USER_SCHEMA_UPDATE = Joi.object({
	displayname: USER_RULE_DISPLAYNAME,
	username: USER_RULE_USERNAME,
	email: USER_RULE_EMAIL,
	active: USER_RULE_ACTIVE,
	role: USER_RULE_ROLE
});

export const USER_SCHEMA_UPDATE_SELF = Joi.object({
	displayname: USER_RULE_DISPLAYNAME
});

export const USERPASSWORD_CREATE = Joi.object({
	ciUser_userUid: CI_RULE_CIUID.required(),
	pwhash: Joi.string().min(128).max(256).required(),
});

export const APITOKEN_RULE_ACTIVE = Joi.valid("Y", "N");
export const APITOKEN_RULE_CUSTOMCLIENTNAME = Joi.string().min(2).max(128);

export const APITOKEN_SCHEMA_UPDATE = Joi.object({
	active: APITOKEN_RULE_ACTIVE,
	customClientname: APITOKEN_RULE_CUSTOMCLIENTNAME
});

export const SHOPPINGLIST_RULE_PRIVACY = Joi.valid("public", "private");
export const SHOPPINGLIST_SCHEMA_UPDATE = Joi.object({
	name: CI_RULE_NAME,
	owner: CI_RULE_CIUID,
	privacy: SHOPPINGLIST_RULE_PRIVACY
});
export const SHOPPINGLIST_SCHEMA_CREATE = Joi.object({
	owner: CI_RULE_CIUID.required(),
	name: CI_RULE_NAME.required(),
	privacy: SHOPPINGLIST_RULE_PRIVACY.required()
});

export const ITEM_RULE_DESCRIPTION = Joi.string().min(1).max(512);
export const ITEM_RULE_AMOUNT = Joi.number();
export const ITEM_RULE_AMOUNTTYPE = Joi.valid("x", "kg", "g", "ml", "l");
export const ITEM_RULE_STATUS = Joi.valid("new", "reserved", "done");
export const ITEM_RULE_BUYDATE = Joi.date();
export const ITEM_RULE_TOTALPRICE = Joi.number().precision(3);
export const ITEM_RULE_BUYAMOUNT = Joi.number().precision(3);
export const ITEM_SCHEMA_NEW = Joi.object({
	itemUid: CI_RULE_CIUID.required(),
	name: CI_RULE_NAME.required(),
	description: ITEM_RULE_DESCRIPTION,
	shoppinglist: CI_RULE_CIUID.required(),
	product: CI_RULE_CIUID,
	addedBy: CI_RULE_CIUID.required(),
	amount: ITEM_RULE_AMOUNT.required(),
	amountType: ITEM_RULE_AMOUNTTYPE.required()
});
export const ITEM_SCHEMA_CREATE = Joi.object({
	name: CI_RULE_NAME.required(),
	description: ITEM_RULE_DESCRIPTION,
	shoppinglist: CI_RULE_CIUID.required(),
	product: CI_RULE_CIUID,
	amount: ITEM_RULE_AMOUNT.required(),
	amountType: ITEM_RULE_AMOUNTTYPE.required()
});
export const ITEM_SCHEMA_UPDATE = Joi.object({
	name: CI_RULE_NAME,
	description: ITEM_RULE_DESCRIPTION,
	product: CI_RULE_CIUID,
	amount: ITEM_RULE_AMOUNT,
	amountType: ITEM_RULE_AMOUNTTYPE
});
export const ITEM_SCHEMA_BUY = Joi.object({
	buyDate: Joi.date().iso().required(),
	buyAmount: Joi.number().required(),
	totalPrice: Joi.number().required()
});

export const SHOPPINGLISTMEMBER_RULE_PERMISSION = Joi.valid("rw", "r");
export const SHOPPINGLISTMEMBER_SCHEMA_NEW = Joi.object({
	splUid: CI_RULE_CIUID.required(),
	userUid: CI_RULE_CIUID.required(),
	permission: SHOPPINGLISTMEMBER_RULE_PERMISSION.required()
});

export const PWRESETTOKEN_RULE_TOKEN = Joi.string().length(128);
export const PWRESETTOKEN_RULE_USED = Joi.valid("Y", "N");
export const PWRESETTOKEN_SCHEMA_CREATE = Joi.object({
	token: PWRESETTOKEN_RULE_TOKEN.required(),
	userUid: CI_RULE_CIUID.required()
});

export const PWRESETTOKEN_SCHEMA_UPDATE = Joi.object({
	used: PWRESETTOKEN_RULE_USED.optional()
});