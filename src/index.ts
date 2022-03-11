import * as dotenv from "dotenv";
// import path from "path";
// const dotenvParsed = dotenv.config({path: path.resolve(__dirname, "../.env")});
const dotenvParsed = dotenv.config();
import minimist from "minimist";
import WLOGGER from "./wlogger";

import {dbp} from "./db/index";
const argv = minimist((process.argv.slice(2)));

WLOGGER.debug(`App started`, { NODE_ENV: process.env.NODE_ENV });
WLOGGER.debug("ARGV", argv);
if(dotenvParsed.error){
	WLOGGER.error("Error while parsing .env", {err: dotenvParsed.error});
	process.exit(1);
}
if(!dotenvParsed.parsed){
	WLOGGER.error("Env is undefined/null!");
	process.exit(1);
}

process.on('uncaughtException', (err) => {
	console.error((new Date()).toUTCString() + ' uncaughtException:', {
		errMessage: err.message,
		stack: err.stack,
		err
	});
	WLOGGER.error((new Date()).toUTCString() + ' uncaughtException', {
		errMessage: err.message,
		stack: err.stack,
		err
	});
	// tgClient.sendMessage(process.env.TELEGRAM_ID_MAIN, JSON.stringify({
	// 	err_message: err.message,
	// 	err_stack: err.stack
	// })).then(response => {
	// 	console.log("Error Notification send");
	// 	console.log(response)
	// }).catch(e => console.error(e.message, e.stack))

	// process.exit(1)
});
WLOGGER.debug("index loaded");
const init = async () => {
	const dbcon = await dbp.getConnection();
	try{
		await dbcon.ping();
		require("./app");
		require("./web");
	}catch(e){
		WLOGGER.error("Error", e);
		throw e;
	}finally{
		dbcon.release();
	}
};

init().catch(err => {
	WLOGGER.error("Couldn't start Application due to a Error on require('./index')", err );
	process.exit(1);
});