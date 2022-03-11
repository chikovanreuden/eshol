import * as util from "util";

// export const isError = (e: unknown): boolean => {
// 	if(e && e.stack && e.message && typeof e.stack === 'string' && typeof e.message === 'string'){
// 		return true;
// 	}
// 	return false;
// };

export const isFunction = (func: unknown): boolean => {
	if(func && {}.toString.call(func) === '[object Function]'){
		return true;
	}
	return false;
};

/**
 * @param x
 * @param notEmpty
 * @returns {boolean}
 */
export const isString = (x: unknown, notEmpty = false): boolean => {
	const bool = Object.prototype.toString.call(x) === "[object String]";
	if(notEmpty){
		if(bool === true && (x as string).length > 0) return true;
		else return false;
	}
	return bool;
};

export function* arrayToChunks(arr: unknown[], n: number): Generator {
	for (let i = 0; i < arr.length; i += n) {
		yield arr.slice(i, i + n);
	}
}

/**
 * This Function returns a string with the most Basic (primitiv) Types.
 * In JavaScript any non-primitiv Type (including null) are just JavaScript Objects.
 *
 * @param x
 * @returns (string | null | undefined)
 */
export const getType = ( x: unknown ): "integer" | "number" | "boolean" | "string" | "object" | "function" | "array" | "JSDate" | null | undefined => {
	if(typeof x === "boolean") return "boolean";
	if(Array.isArray(x)) return "array";
	if(Object.prototype.toString.call(x) === "[object String]") return "string";
	if(Object.prototype.toString.call(x) === "[object Object]") return "object";
	if(Object.prototype.toString.call(x) === "[object Function]") return "function";
	if(x instanceof Date) return "JSDate";
	if(!Number.isNaN(x)){
		if(Number.isInteger(x)) return "integer";
		else return "number";
	}
	if(x === null) return null;
	if(x === undefined || typeof x === "undefined") return undefined;
	return undefined;
};
export const checkType = ( x: unknown, shouldBe: "integer" | "number" | "boolean" | "string" | "object" | "function" | "array" | "JSDate" | null | undefined ): boolean => {
	return getType(x) === shouldBe;
};

export const getRandomInt = (min:number, max:number): number => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const inspectDeep = (element: unknown): any => {
	return util.inspect(element, {
		showHidden: false,
		depth: null
	});
};

export const intLength = (x: number): number => {
	return Math.max(Math.floor(Math.log10(Math.abs(x))), 0) + 1;
};

export const prettyJSON = (obj: Record<string, unknown>, tabs = 2): string => {
	return JSON.stringify(obj, null, tabs);
};

export const unhex = (r: string): string => {
	return Buffer.from(r, "hex").toString();
};

export const removeItemOnce = (arr: unknown[], value: unknown): any[] => {
	const index = arr.indexOf(value);
	if (index > -1) {
		arr.splice(index, 1);
	}
	return arr;
};

export const removeItemAll = (arr: any[], value:unknown): any[] => {
	let i = 0;
	while (i < arr.length) {
		if (arr[i] === value) {
			arr.splice(i, 1);
		} else {
			++i;
		}
	}
	return arr;
};

export const drawLine = (str = ""): string => {
	const max = process.stdout.columns > 120 ? 120 : process.stdout.columns;
	if (str) str = ` ${str} `;
	// return ("*****" + str).padEnd(max, "*") + "\n"
	return ("*" + str).padEnd(max, "*");
};

export const drawBlock = (title:string, content = "No_Content"): string => {
	if (typeof content === "object") content = (<typeof content>inspectDeep(content));
	return [drawLine(title), content, drawLine()].join("\n");
};