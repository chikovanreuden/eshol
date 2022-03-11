import * as crypto from "crypto";

export const checkPWStrength = (password: string): boolean => {
	const PWRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g;
	return PWRegex.test(password);
};

export const hash = (password: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		const salt = crypto.randomBytes(32).toString("hex");
		crypto.scrypt(password, salt, 64, (err, derivedKey) => {
			if (err) reject(err);
			resolve(salt + ":" + derivedKey.toString('hex'));
		});
	});
};

export const verify = (password: string, hash: string): Promise<boolean> => {
	return new Promise((resolve, reject) => {
		if(! checkPWStrength(password)) reject(new Error("pw.verify failed. Password strength check failed"));
		const [salt, key] = hash.split(":");
		crypto.scrypt(password, salt, 64, (err, derivedKey) => {
			if (err) reject(err);
			resolve(key === derivedKey.toString('hex'));
		});
	});
};


