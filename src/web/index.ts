/* eslint-disable @typescript-eslint/restrict-template-expressions */
import path from "path";
import crypto from "crypto";
import express, {NextFunction, Request, Response} from "express";
const app = express();
import helmet from "helmet";
import cors from "cors";
import cookieParser from 'cookie-parser';
import errorhandler from 'errorhandler';
// import expressLayouts from "express-ejs-layouts";
import winston from 'winston';
import expressWinston from 'express-winston';
import * as nanoid from "../id";
import WLOGGER from "../wlogger";
// const createError = require('http-errors')
// import HttpException from "../classes/HttpException";
// import { notFoundHandler } from "./middleware/not-found";

app.use(cors(
	{
		origin:[`${process.env.WEB_HOST}:${process.env.WEB_PORT}`],
		methods:['GET','POST','PUT','DELETE'],
		credentials: true // enable send cookie on req
	}
));
app.disable('x-powered-by');
// Generate new CSP Nounce
app.use((_req: Request, res: Response, next: NextFunction) => {
	res.locals.cspNonce = crypto.randomBytes(16).toString("hex");
	next();
});

app.use(
	helmet.contentSecurityPolicy({
		useDefaults: true,
		directives: {
			"default-src": helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			"script-src": ["'self'", (_req, res) => `'nonce-${(res as Response).locals.cspNonce}'`, "cdn.jsdelivr.net", "code.jquery.com", "unpkg.com"],
			"font-src": ["'self'", "fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
			"style-src": ["'self'", "fonts.googleapis.com", "cdnjs.cloudflare.com", "bootswatch.com", "cdn.jsdelivr.net"],
			// "connect-src": ["'self'"]
		},
	})
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

if(process.env.NODE_ENV !== "development"){
	app.set('trust proxy', 1);
	//expressSessionOptions.cookie.domain = `${process.env.WEB_HOST}:${process.env.WEB_PORT}`
}

app.use(express.static(path.join(__dirname, 'static')));
app.use("/css", express.static(path.join(__dirname, 'static', 'css')));
app.use("/js", express.static(path.join(__dirname, 'static', 'js')));
app.use("/img", express.static(path.join(__dirname, 'static','img')));
app.use("/templ", express.static(path.join(__dirname, 'static','templ')));

expressWinston.requestWhitelist.push('session');
expressWinston.requestWhitelist.push('user');
expressWinston.requestWhitelist.push('body');
expressWinston.requestWhitelist.push('cookies');
expressWinston.requestWhitelist.push('rid');
expressWinston.ignoredRoutes = ["/favicon.ico", "/css/*", "/js/*"];
app.use(expressWinston.logger({
	expressFormat: true,
	colorize: true,
	meta: true,
	// statusLevels: true, // default value
	// level: function (req, res) {
	//   var level = "";
	//   if (res.statusCode >= 100) { level = "info"; }
	//   if (res.statusCode >= 400) { level = "warn"; }
	//   if (res.statusCode >= 500) { level = "error"; }
	//   // Ops is worried about hacking attempts so make Unauthorized and Forbidden critical
	//   if (res.statusCode == 401 || res.statusCode == 403) { level = "critical"; }
	//   // No one should be using the old path, so always warn for those
	//   // if (req.path === "/v1" && level === "info") { level = "warn"; }
	//   return level;
	// },
	transports: [
		new winston.transports.Console({
			level: "info",
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.colorize(),
				winston.format.simple()
			)
		})
	]
}));

// Add request_id
app.use((req: Request, res: Response, next: NextFunction) => {
	const id = nanoid.generate(16);
	const datetime = (new Date()).getTime();
	req.rid = `${datetime}:${id}`;
	res.rid = `${datetime}:${id}`;
	next();
});

/** RULES OF OUR API */
app.use((req: Request, res: Response, next: NextFunction): void => {
	// set the CORS policy
	res.header('Access-Control-Allow-Origin', '*');
	// set the CORS headers
	res.header('Access-Control-Allow-Headers', 'origin, X-Requested-With,Content-Type,Accept, Authorization');
	// set the CORS method headers
	if (req.method === 'OPTIONS') {
		res.header('Access-Control-Allow-Methods', 'GET PUT DELETE POST PATCH');
		res.status(200).json({});
		return;
	}
	next();
});

// API Router
import linkUserAccount from "./middleware/linkUseraccount";
app.use(linkUserAccount);
// API Root Router
import rootRouterApiV1 from "./routes/api/v1/root.router";
app.use("/api/", rootRouterApiV1);
app.use("/api/v1", rootRouterApiV1);
// API Auth Router
import authRouterApiV1 from "./routes/api/v1/auth.router";
app.use("/api/auth", authRouterApiV1);
app.use("/api/v1/auth", authRouterApiV1);
// API User
import userRouterApiV1 from "./routes/api/v1/user.router";
app.use("/api/user", userRouterApiV1);
app.use("/api/v1/user", userRouterApiV1);
import shoppinglistRouterApiV1 from "./routes/api/v1/shoppinglist.router";
app.use("/api/shoppinglist", shoppinglistRouterApiV1);
app.use("/api/v1/shoppinglist", shoppinglistRouterApiV1);
import itemRouterApiV1 from "./routes/api/v1/item.router";
app.use("/api/item", itemRouterApiV1);
app.use("/api/v1/item", itemRouterApiV1);
import verifyRouterApiV1 from "./routes/api/v1/verify.router";
app.use("/api/verify", verifyRouterApiV1);
app.use("/api/v1/verify", verifyRouterApiV1);
import pwresetRouterApiV1 from "./routes/api/v1/pwreset.router";
app.use("/api/pwreset", pwresetRouterApiV1);
app.use("/api/v1/pwreset", pwresetRouterApiV1);

app.use(expressWinston.errorLogger({
	meta: true,
	// statusLevels: true,
	// level: function (req, res) {
	// 	var level = "";
	// 	if (res.statusCode >= 100) { level = "info"; }
	// 	if (res.statusCode >= 400) { level = "warn"; }
	// 	if (res.statusCode >= 500) { level = "error"; }
	// 	// Ops is worried about hacking attempts so make Unauthorized and Forbidden critical
	// 	if (res.statusCode == 401 || res.statusCode == 403) { level = "critical"; }
	// 	// No one should be using the old path, so always warn for those
	// 	// if (req.path === "/v1" && level === "info") { level = "warn"; }
	// 	return level;
	// },
	transports: [
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.colorize(),
				winston.format.json()
			)
		}),
		new winston.transports.File({
			filename: "logs/express_error.log",
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.json()
			)
		}),
	]
}));

// Error Handler Section
// Error Handler: CSRF
// app.use((error: HttpException, _req: Request, res: Response, next: express.NextFunction): void | Response => {
// 	if (error.code !== 'EBADCSRFTOKEN') return next(error);
// 	// handle CSRF token errors here
// 	WLOGGER.error("CSRF Tampered with", {
// 		error
// 	});
// 	return res.status(403).json({message: 'form tampered with'});
// });
// 404 Handler
app.use((
	_req: Request,
	res: Response,
): void => {
	res.status(404).end();
});
import {notify} from "node-notifier";
if (process.env.NODE_ENV === 'development') {
	const errorNotification = (_err: unknown, str: string, req: Request) => {
		notify({
			title: 'Error in ' + req.method + ' ' + req.url,
			message: str
		});
	};
	// only use in development
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call
	app.use(errorhandler({log: errorNotification}));
}
// 5xx handler
// app.use(internalError);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
	WLOGGER.error("500 Error", err);
	res.status(500).end();
});

app.listen(parseInt((process.env.WEB_PORT || "1338")), "0.0.0.0", () => {
	WLOGGER.info(`Web App listening at http://localhost:${process.env.WEB_PORT}`);
});