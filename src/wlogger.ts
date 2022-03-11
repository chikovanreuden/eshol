/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import winston from 'winston';
import { prettyJSON } from "./util/common";

const logFormat = winston.format.printf( (info: winston.Logform.TransformableInfo) => {
	const formattedDate: string = info.metadata.timestamp;
	delete info.metadata.timestamp;
	// tslint:disable-next-line: no-console
	let msg = `${formattedDate} ${info.level}: ${info.message}`;
	try{
		msg += ` ${prettyJSON(info.metadata)}`;
	}catch(e){
		msg += info.metadata;
	}
	return msg;
});

winston.exceptions.handle(
	new winston.transports.File({
		filename: 'logs/exceptions.log',
		format: winston.format.combine(
			winston.format.timestamp(),
			winston.format.json(),
			winston.format.metadata(),
			winston.format.errors({stack: true})
		)
	}),
	new winston.transports.Console({
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.errors({stack: true}),
			// format.simple()
			// format.prettyPrint(),
			logFormat
		)
	})
);

const logger = winston.createLogger({
	// levels: winston.config.syslog.levels,
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json(),
		winston.format.metadata(),
		winston.format.errors({stack: true})
	),
	transports: [
		new winston.transports.Console({
			level: 'debug',
			format: winston.format.combine(
				winston.format.colorize(),
				// format.simple()
				// format.prettyPrint(),
				logFormat
			),
			handleExceptions: true
		}),
		new winston.transports.File({filename: "logs/error.log", level: 'error'}),
		new winston.transports.File({filename: "logs/combined.log", level:'info', handleExceptions: true}),
	],
	exitOnError: false
});

export default logger;