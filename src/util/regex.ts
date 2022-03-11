/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unused-vars */
const REGEX_EMAIL_RFC5322 = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const REGEX_PASSWORD = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*\-_]).{12,64}$/;
// const REGEX_PASSWORD = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[*.!@$%^&\(\){}\[\]:;<>,.?\/~_+-=|\\]).{12,64}$/;
// Password
// ^                                            Match the beginning of the string
// (?=.*[0-9])                                  Require that at least one digit appear anywhere in the string
// (?=.*[a-z])                                  Require that at least one lowercase letter appear anywhere in the string
// (?=.*[A-Z])                                  Require that at least one uppercase letter appear anywhere in the string
// (?=.*[*.!@$%^&(){}[]:;<>,.?/~_+-=|\])        Require that at least one special character appear anywhere in the string
// .{8,32}                                      The password must be at least 8 characters long, but no more than 32
// $                                            Match the end of the string.
// int count = 0;

//    if( 8 <= pass.length() && pass.length() <= 32  )
//    {
//       if( pass.matches(".*\\d.*") )
//          count ++;
//       if( pass.matches(".*[a-z].*") )
//          count ++;
//       if( pass.matches(".*[A-Z].*") )
//          count ++;
//       if( pass.matches(".*[*.!@#$%^&(){}[]:";'<>,.?/~`_+-=|\\].*") )
//          count ++;
//    }

//    return count >= 3;

const REGEX_USERNAME = /^(?=.{3,32}$)(?![_.-])(?!.*[_\.-]{2})[a-zA-Z0-9\._-]+$/;

// is a Integer with no Zeros infront
const REGEX_INT_POSITIVE = /^[1-9]\d*$/;
const REGEX_DOMAINNAME_MATCH = /(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])/;
const REGEX_VALID_DOMAINNAME = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
const REGEX_BBCODE = /\[(.+?).*?\](.*?)\[\/\1\]/gm;
const REGEX_BBCODE_URL_SIMPLE = /\[url\](.+?)\[\/url\]/gm;
const REGEX_BBCODE_URL_TITLE = /\[url=((https|http)?:\/\/.+?)\](.*?)\[\/url\]/gm;
const REGEX_URL = /(?:http|https|ftp|mailto|file|data|irc):\/\/[A-Za-z0-9\-]{0,63}(\.[A-Za-z0-9\-]{0,63})+(:\d{1,4})?\/*(\/*[A-Za-z0-9\-._]+\/*)*(\?.*)?(#.*)?/;
const REGEX_HTML_TAG =/<.+>/;
const REGEX_IP4 = /(?:25[0-5]|2[0-4]\d|[01]\d{2}|\d{1,2})(?:.(?:25[0-5]|2[0-4]\d|[01]\d{2}|\d{1,2})){3}/;
const REGEX_IP6 = /(?:[A-Fa-f0-9]){0,4}(?: ?:? ?(?:[A-Fa-f0-9]){0,4}){0,7}/;

/**
 * [cspacer20]test123
 * Group 0: [cspacer20]test123
 * Group 1: cspacer
 * Group 2: test123
 */
const REGEX_TEAMSPEAK_CHANNELNAME = /\[([\*\w]+)[^\]]*]([\w -\\<>\[\]\*#.,;:\+'`´"!§$%&/\(\)=\{\}\|°]*)/;
export const patttern = {
	REGEX_EMAIL_RFC5322,
	REGEX_PASSWORD,
	REGEX_USERNAME
};

export const isAlphaNummeric = (data: string): boolean => {
	const regEx = /^[0-9a-zA-Z]*$/;
	return regEx.test(data);
};

export const isNummericInteger = (data: string): boolean => {
	const regEx = /^[0-9]*$/;
	return regEx.test(data);
};

export const isValidEmailAddress = (email: string): boolean => {
	return REGEX_EMAIL_RFC5322.test(email);
};

export const isValidUsername = (username: string): boolean => {
	return REGEX_USERNAME.test(username);
};

export const passwordStrength = (password: string): boolean => {
	return REGEX_PASSWORD.test(password);
};

export const findKeys = (str: string): string[] => {
	const keys = [];
	const reg = /(?<={{).*?(?=}})/gm;
	let match;
	// tslint:disable-next-line: no-conditional-assignment
	while ((match = reg.exec(str)) !== null) {
		keys.push(match[0]);
	}
	console.dir(keys);
	return keys;
};