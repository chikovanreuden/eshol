declare global {
	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: 'development' | 'production'
			TEAMSPEAK3_CACHE_INTERVAL: string
			TEAMSPEAK3_SERVER_HOST: string
			TEAMSPEAK3_SERVER_VIRTUALSERVERID: string
			TEAMSPEAK3_SERVER_QUERY_PORT_TELNET: string
			TEAMSPEAK3_SERVER_PORT: string
			TEAMSPEAK3_SERVER_QUERY_USERNAME: string
			TEAMSPEAK3_SERVER_QUERY_PASSWORD: string
			TEAMSPEAK3_SERVER_QUERY_NICKNAME: string
			TEAMSPEAK_DEBUG: string
			TEAMSPEAK_FLOODING: string
			TEAMSPEAK3_CHANNELID_SUPPORT: string
			TEAMSPEAK3_CACHE_INTERVAL: string
			DB_HOST: string
			DB_PORT: string
			DB_DATABASE: string
			DB_USERNAME: string
			DB_PASSWORD: string
			REPL: string
			LANG: string
			WEB_EXPRESS_APP_SESSION_SECRET: string
			WEB_ENABLED: string
			WEB_PROTO: string
			WEB_BIND_IP: string
			WEB_HOST: string
			WEB_PORT: string
			WEB_PATH: string
			WEB_BRAND: string
			WEB_TITLE: string
			WEB_ADMIN_TOKEN: string
			WEB_API_PATH: string
			TELEGRAM_ID_MAIN: string
			TELEGRAM_BOT_TOKEN: string
			FEATURE_SIMPLESUPPORTCHANNEL: string
			PLUGINS_ENABLED: string
			PLUGINS_AUTOLOAD: string
			EMAIL_USERNAME: string
			EMAIL_PASSWORD: string
		}
	}
	const LOG_DIR: string;
	const appRootDir: string;
	const appRootIndex: string;
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};