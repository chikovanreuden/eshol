import WLOGGER from "../wlogger";
import mysqlp from "mysql2/promise";

export const dbp = mysqlp.createPool({
	connectionLimit: 10,
	host: process.env.DB_HOST,
	user: process.env.DB_USERNAME,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_DATABASE,
	typeCast: true,
});
export default dbp;

dbp.on('acquire', (connection) => {
	if(process.env.SQL_DEBUG === "1") WLOGGER.debug('DB Connection ' + connection.threadId.toString() + ' acquired');
});

dbp.on('connection', (connection) => {
	if(process.env.SQL_DEBUG === "1") WLOGGER.debug('DB Connection ' + connection.threadId.toString() + ' connected');
});

dbp.on('enqueue', () => {
	if(process.env.SQL_DEBUG === "1") WLOGGER.debug('Waiting for available connection slot');
});

dbp.on('release', (connection) => {
	if(process.env.SQL_DEBUG === "1") WLOGGER.debug('DB Connection ' + connection.threadId.toString() + ' released');
});