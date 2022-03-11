import * as dotenv from "dotenv";
dotenv.config();
import axios, { AxiosRequestConfig } from "axios";
import dbp from "../db";
import { User, Shoppinglist, Item } from "../cmdb";
import WLOGGER from "../wlogger";
import * as id from "../id";

const API_URL = (path?: string) => {
	return `http://localhost:${process.env.WEB_PORT}/api${path ? path : ""}`;
};

const instance = axios.create({
	baseURL: API_URL(),
	headers: {'X-Custom-Header': 'foobar'}
});

interface ApiEndpoint extends AxiosRequestConfig {
	method: "get" | "post" | "patch" | "delete"
	url: string
	expect: "success" | "fail"
	expectedHttpCode?: number
}

const callApi = async (endpoint: ApiEndpoint) => {
	try{
		const response = await instance(endpoint);
		WLOGGER.debug("API Endpoint " + endpoint.url, {
			endpoint,
			response: {
				status: response.status,
				url: response.config.url,
				method: response.config.method,
				data: response.data
			}
		});
	}catch(err){
		WLOGGER.debug("API Endpoint Error", {
			err,
			endpoint
		});
	}
};

const mockUrls: ApiEndpoint[] = [
	{
		method: "get",
		url: "/user",
		expect: "success",
	},
	{
		method: "get",
		url: "/shoppinglist",
		expect: "success",
	},
	{
		method: "get",
		url: "/item",
		expect: "success",
	},
	{
		method: "post",
		url: "/user",
		expect: "success",
		data: {
			username: "alice",
			email: "alice@xcsone.de",
			password: "Password123!"
		}
	},
	{
		method: "post",
		url: "/shoppinglist",
		expect: "fail",
		data: {
			owner: id.generate(32, "mixed"),
			name: "ShouldFailSpl",
			privacy: "private"
		}
	}
];

const fillDb = async (): Promise<void> => {
	await dbp.query("DELETE FROM `eshol`.`ci`");
	await dbp.query("DELETE FROM `eshol`.`userpasswd`");
	await dbp.query("DELETE FROM `eshol`.`apitoken`");

	const systemUser = await User.create({
		username: "system",
		email: "system@xcsone.de",
		displayname: "System",
		password: "Password123!"
	});
	await systemUser.setRole("admin");
	await dbp.query("UPDATE `eshol`.`ciUser` SET `emailVerificationToken` = NULL WHERE `userUid` = BINARY ?;", [systemUser.userUid]);
	await systemUser.sync();

	const chiko = await User.create({
		username: "chiko",
		email: "chiko@xcsone.de",
		displayname: "chiko",
		password: "Password123!"
	});
	await chiko.setRole("admin");
	mockUrls.push({
		method: "get",
		url: `/verify/email/${chiko.emailVerificationToken as string}`,
		expect: "success"
	});
	const chikoSpl = await Shoppinglist.create({
		name: "Chikos Shoppinglist",
		owner: chiko.userUid,
		privacy: "private"
	});
	const item1 = await Item.create({
		name: "Milk",
		shoppinglist: chikoSpl.splUid,
		amountType: "x",
		amount: 2
	}, chiko);
	await item1.buy({buyAmount: 2, totalPrice: 2.59}, chiko);
};

const main = async () => {
	await fillDb();
	for(const endpoint of mockUrls){
		await callApi(endpoint);
	}
};

main().then(() => {
	process.exit(0);
}).catch((e) => {
	console.error(e);
});