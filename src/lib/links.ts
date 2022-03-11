export const WEB_ADDRESS_PUBLIC = (() => {
	const port = process.env.WEB_PORT ? parseInt(process.env.WEB_PORT) : 1338;
	return `https://${process.env.WEB_HOST}${port === 80 || port === 443 ? "" :  ":" + port.toString()}`;
})();

export const getLinkPublic = (path?: string): string => {
	if(path && !path.startsWith("/")) path = "/" + path;
	return `${WEB_ADDRESS_PUBLIC}${path ? path : ""}`;
};