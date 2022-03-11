import * as crypto from "crypto";
import * as nanoid from "nanoid";
const MINIMUM_ID_LENGTH = 10;
const DEFAULT_ID_LENGTH = 32;
const MINIMUM_UNIQUE_CHARS = 10;

export const randomHex = (size?: number): string => {
	if(!size) size = 16;
	return crypto.randomBytes(size).toString("hex");
};

const Keyspaces = {
	mixed: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
	fakehex: "0123456789ABCDEF",
	lowercase: "0123456789abcdefghijklmnopqrstuvwxyz",
	uppercase: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	int: "0123456789",
	ext: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_",
	complex: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_!"§$%&/()=?`+*#\'´^°,.;:<>|{[]}\\~'
};

export const generate = (_length = DEFAULT_ID_LENGTH, customKeyspace?: keyof typeof Keyspaces): string => {
	let keyspace: string;
	if(!customKeyspace) keyspace = Keyspaces.lowercase;
	else keyspace = Keyspaces[customKeyspace];
	//testing for unique chars
	const uniqueChars:string[] = [];
	{
		const splited = [...keyspace];
		for(const char of splited){
			if(! uniqueChars.includes(char)) uniqueChars.push(char);
		}
	}
	if(uniqueChars.length < MINIMUM_UNIQUE_CHARS) throw new Error(`Less then ${MINIMUM_UNIQUE_CHARS} unique Charakters provided.`);

	if (Number.isInteger(_length)) {
		if (_length < MINIMUM_ID_LENGTH) {
			_length = MINIMUM_ID_LENGTH;
		} else if (_length > 128) {
			_length = 128;
		}
	}
	return nanoid.customAlphabet(keyspace, _length)();
};

export const genHex = (_length: number): string => {
	return randomHex((_length/2));
};